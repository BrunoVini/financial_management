import { describe, expect, it } from 'vitest';
import {
  monthKey,
  nextMonthKey,
  createMonth,
  rolloverIfNeeded,
  getOrCreateCurrentMonth,
  closeMonth,
  GRACE_DAYS,
} from '@/lib/db/months';
import { defaultStore } from '@/lib/storage';

describe('monthKey / nextMonthKey', () => {
  it('formats and rolls over month boundaries', () => {
    // Given: a date in May 2026
    // When: formatting it
    expect(monthKey(new Date('2026-05-15T12:00:00Z'))).toBe('2026-05');
    // Then: nextMonthKey advances by one month and crosses years
    expect(nextMonthKey('2026-05')).toBe('2026-06');
    expect(nextMonthKey('2026-12')).toBe('2027-01');
  });
});

describe('createMonth', () => {
  it('inserts a new month and ignores duplicates', () => {
    // Given: an empty store
    const s0 = defaultStore();
    // When: creating a month twice
    const s1 = createMonth(s0, '2026-05', { BRL: 1000 });
    const s2 = createMonth(s1, '2026-05', { BRL: 9999 });
    // Then: the first creation wins; status is open
    expect(s1.months['2026-05'].openingBalances.BRL).toBe(1000);
    expect(s2.months['2026-05'].openingBalances.BRL).toBe(1000);
    expect(s1.months['2026-05'].status).toBe('open');
  });
});

describe('getOrCreateCurrentMonth', () => {
  it('creates the current month with zeroed balances when missing', () => {
    // Given: store with active currencies but no months
    const s0 = { ...defaultStore() };
    s0.settings.activeCurrencies = ['BRL', 'USD'];
    // When: ensuring current month exists
    const { store, key } = getOrCreateCurrentMonth(s0, new Date('2026-05-15T12:00:00Z'));
    // Then: month is created and balances zeroed for each active currency
    expect(key).toBe('2026-05');
    expect(store.months['2026-05'].openingBalances).toEqual({ BRL: 0, USD: 0 });
  });

  it('returns the existing month when already present', () => {
    // Given: store with the month already created
    const s0 = createMonth(defaultStore(), '2026-05', { BRL: 500 });
    // When: ensuring current month for a date in the same month
    const { store, key } = getOrCreateCurrentMonth(s0, new Date('2026-05-20T12:00:00Z'));
    // Then: balances are unchanged
    expect(key).toBe('2026-05');
    expect(store.months['2026-05'].openingBalances.BRL).toBe(500);
  });
});

describe('rolloverIfNeeded', () => {
  it('does nothing when newest month equals today', () => {
    // Given: only the current month exists
    const s0 = createMonth(defaultStore(), '2026-05', { BRL: 0 });
    // When: rolling over on a day in the same month
    const r = rolloverIfNeeded(s0, new Date('2026-05-20T12:00:00Z'));
    // Then: no months created or closed
    expect(r.createdMonths).toEqual([]);
    expect(r.closedMonths).toEqual([]);
  });

  it('marks previous as grace and creates next month with inherited balances', () => {
    // Given: a previous month with closingBalances
    let s = createMonth(defaultStore(), '2026-04', { BRL: 100 });
    s = closeMonth(s, '2026-04', { BRL: 250 });
    // When: rollover on day 15 of May
    const r = rolloverIfNeeded(s, new Date('2026-05-15T12:00:00Z'));
    // Then: 2026-05 created with inherited closing balances
    expect(r.createdMonths).toEqual(['2026-05']);
    expect(r.store.months['2026-05'].openingBalances.BRL).toBe(250);
    // (2026-04 was already closed, so 'grace' transition does not apply)
    expect(r.store.months['2026-04'].status).toBe('closed');
  });

  it('flips an open previous month to grace with a natural deadline', () => {
    // Given: an open previous month
    const s = createMonth(defaultStore(), '2026-04', { BRL: 0 });
    // When: rollover early in May (still inside the natural grace window)
    const today = new Date('2026-05-01T12:00:00Z');
    const r = rolloverIfNeeded(s, today);
    // Then: previous becomes 'grace' with closedAt = first of next month + GRACE_DAYS
    const m = r.store.months['2026-04'];
    expect(m.status).toBe('grace');
    expect(m.closedAt).toBeTruthy();
    const expected = new Date(Date.UTC(2026, 4, 1 + GRACE_DAYS)).toISOString();
    expect(m.closedAt).toBe(expected);
  });

  it('closes an old open month directly when its grace window already elapsed', () => {
    // Given: a January month left 'open' (user was inactive for months)
    const s = createMonth(defaultStore(), '2026-01', { BRL: 0 });
    // When: rollover happens in May (months past the natural Feb-08 deadline)
    const r = rolloverIfNeeded(s, new Date('2026-05-15T12:00:00Z'));
    // Then: 2026-01 is 'closed' (not 'grace'), and reported via closedMonths
    expect(r.store.months['2026-01'].status).toBe('closed');
    expect(r.closedMonths).toContain('2026-01');
  });

  it('creates intermediate months when more than one month passed', () => {
    // Given: a month from January
    const s = createMonth(defaultStore(), '2026-01', { BRL: 50 });
    // When: rollover in May
    const r = rolloverIfNeeded(s, new Date('2026-05-15T12:00:00Z'));
    // Then: Feb, Mar, Apr, May all exist, openings inherited
    expect(r.createdMonths).toEqual(['2026-02', '2026-03', '2026-04', '2026-05']);
    expect(r.store.months['2026-05'].openingBalances.BRL).toBe(50);
  });

  it('sweeps grace months whose deadline elapsed', () => {
    // Given: a month in 'grace' with a past closedAt
    let s = createMonth(defaultStore(), '2026-04', { BRL: 0 });
    s = {
      ...s,
      months: {
        ...s.months,
        '2026-04': { ...s.months['2026-04'], status: 'grace', closedAt: '2026-04-10T00:00:00Z' },
      },
    };
    // When: rollover today (well past the deadline)
    const r = rolloverIfNeeded(s, new Date('2026-05-15T12:00:00Z'));
    // Then: 2026-04 is now closed
    expect(r.store.months['2026-04'].status).toBe('closed');
    expect(r.closedMonths).toContain('2026-04');
  });
});

describe('closeMonth', () => {
  it('marks the month closed with the provided closing balances', () => {
    // Given: an open month
    const s0 = createMonth(defaultStore(), '2026-05', { BRL: 0 });
    // When: closing it
    const s1 = closeMonth(s0, '2026-05', { BRL: 500, USD: 100 });
    // Then: status is closed and closingBalances persisted
    expect(s1.months['2026-05'].status).toBe('closed');
    expect(s1.months['2026-05'].closingBalances).toEqual({ BRL: 500, USD: 100 });
    expect(s1.months['2026-05'].closedAt).toBeTruthy();
  });
});
