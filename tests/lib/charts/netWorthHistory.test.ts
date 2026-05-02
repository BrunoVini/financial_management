import { describe, expect, it } from 'vitest';
import { netWorthHistory, HISTORY_LENGTH } from '@/lib/charts/netWorthHistory';
import { defaultStore } from '@/lib/storage';
import { addAccount } from '@/lib/db/accounts';
import { createMonth, monthKey } from '@/lib/db/months';
import { addExpense } from '@/lib/db/transactions';
import type { Store } from '@/lib/types';

const today = new Date('2026-05-15T12:00:00Z');

function withRates(s: Store, rates: Record<string, number>): Store {
  return {
    ...s,
    ratesCache: { fetchedAt: '2026-05-15', base: 'EUR' as const, rates },
  };
}

describe('netWorthHistory', () => {
  it('always returns 12 months ending at today', () => {
    // Given/When: an empty-but-rated store
    const s = withRates(defaultStore(), { EUR: 1, BRL: 5.5 });
    const r = netWorthHistory(s, 'BRL', today);
    // Then: 12 keys ending at the current month
    expect(r.keys).toHaveLength(HISTORY_LENGTH);
    expect(r.keys[r.keys.length - 1]).toBe(monthKey(today));
  });

  it('keeps the last known total in months with no balance data', () => {
    // Given: a single BRL account with opening 1000, only May exists
    let s = withRates(defaultStore(), { EUR: 1, BRL: 5.5 });
    s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
    s = createMonth(s, '2026-05', { BRL: 1000 });
    // When: building the 12-month series at today (May)
    const r = netWorthHistory(s, 'BRL', today);
    // Then: every value reflects the opening balance, none drop to 0
    expect(r.values.every((v) => v === 1000)).toBe(true);
  });

  it('reflects expenses per month', () => {
    // Given: 1000 BRL opening + 200 BRL expense in May
    let s = withRates(defaultStore(), { EUR: 1, BRL: 5.5 });
    s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
    const accId = s.accounts[0].id;
    s = createMonth(s, '2026-05', { BRL: 1000 });
    s = addExpense(s, '2026-05', {
      amount: 200,
      currency: 'BRL',
      categoryId: 'cat',
      accountId: accId,
      date: '2026-05-10',
    }).store;
    // When: building the series
    const r = netWorthHistory(s, 'BRL', today);
    // Then: May (last entry) shows 800; previous months still 1000
    const last = r.values[r.values.length - 1];
    expect(last).toBe(800);
    expect(r.values[r.values.length - 2]).toBe(1000);
  });
});
