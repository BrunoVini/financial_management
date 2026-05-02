import { describe, expect, it } from 'vitest';
import {
  addSubscription,
  removeSubscription,
  pauseSubscription,
  applyDueSubscriptions,
} from '@/lib/db/recurring';
import { defaultStore } from '@/lib/storage';
import { addAccount } from '@/lib/db/accounts';
import { createMonth } from '@/lib/db/months';

function seed() {
  let s = defaultStore();
  s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
  return { store: s, accountId: s.accounts[0].id };
}

describe('addSubscription / removeSubscription', () => {
  it('appends and drops by id', () => {
    // Given/When: a fresh store + one subscription
    const { store: s0, accountId } = seed();
    const { store, id } = addSubscription(s0, {
      description: 'Netflix',
      amount: 39.9,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 5,
    });
    // Then: it appears with active=true, empty appliedMonths
    expect(store.subscriptions).toHaveLength(1);
    expect(store.subscriptions[0].active).toBe(true);
    expect(store.subscriptions[0].appliedMonths).toEqual([]);
    // When: removed
    const after = removeSubscription(store, id);
    expect(after.subscriptions).toHaveLength(0);
  });
});

describe('pauseSubscription', () => {
  it('toggles active', () => {
    // Given: an active subscription
    const { store: s0, accountId } = seed();
    const { store: s1, id } = addSubscription(s0, {
      description: 'Gym',
      amount: 100,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 10,
    });
    // When: paused then resumed
    const s2 = pauseSubscription(s1, id, true);
    const s3 = pauseSubscription(s2, id, false);
    // Then: states transition as expected
    expect(s2.subscriptions[0].active).toBe(false);
    expect(s3.subscriptions[0].active).toBe(true);
  });
});

describe('applyDueSubscriptions', () => {
  it('creates the expense once and records the month', () => {
    // Given: a subscription due on day 5 and the May month created
    const { store: s0, accountId } = seed();
    const { store: s1 } = addSubscription(s0, {
      description: 'Netflix',
      amount: 40,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 5,
    });
    const s2 = createMonth(s1, '2026-05', { BRL: 1000 });
    // When: applying on May 10 (>= 5)
    const s3 = applyDueSubscriptions(s2, '2026-05', new Date('2026-05-10T12:00:00Z'));
    // Then: 1 expense created and appliedMonths records '2026-05'
    expect(s3.months['2026-05'].expenses).toHaveLength(1);
    expect(s3.months['2026-05'].expenses[0].amount).toBe(40);
    expect(s3.subscriptions[0].appliedMonths).toEqual(['2026-05']);
    // When: re-running on the same day
    const s4 = applyDueSubscriptions(s3, '2026-05', new Date('2026-05-10T12:00:00Z'));
    // Then: idempotent — no second expense
    expect(s4.months['2026-05'].expenses).toHaveLength(1);
  });

  it('skips current month before the due day', () => {
    // Given: subscription due on day 20, today is May 10
    const { store: s0, accountId } = seed();
    const { store: s1 } = addSubscription(s0, {
      description: 'X',
      amount: 10,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 20,
    });
    const s2 = createMonth(s1, '2026-05', { BRL: 1000 });
    // When/Then: not yet due
    const s3 = applyDueSubscriptions(s2, '2026-05', new Date('2026-05-10T12:00:00Z'));
    expect(s3.months['2026-05'].expenses).toHaveLength(0);
    expect(s3.subscriptions[0].appliedMonths).toEqual([]);
  });

  it('skips paused subscriptions', () => {
    // Given: a paused subscription
    const { store: s0, accountId } = seed();
    const { store: s1, id } = addSubscription(s0, {
      description: 'Paused',
      amount: 99,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 1,
    });
    const s2 = pauseSubscription(s1, id, true);
    const s3 = createMonth(s2, '2026-05', { BRL: 1000 });
    // When: applying after the day
    const s4 = applyDueSubscriptions(s3, '2026-05', new Date('2026-05-10T12:00:00Z'));
    // Then: no expense, no record
    expect(s4.months['2026-05'].expenses).toHaveLength(0);
    expect(s4.subscriptions[0].appliedMonths).toEqual([]);
  });

  it('clamps day-of-month to month length', () => {
    // Given: subscription due on day 31, applying February
    const { store: s0, accountId } = seed();
    const { store: s1 } = addSubscription(s0, {
      description: 'EOM',
      amount: 50,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 31,
    });
    const s2 = createMonth(s1, '2026-02', { BRL: 1000 });
    // When: applying on Feb 28
    const s3 = applyDueSubscriptions(s2, '2026-02', new Date('2026-02-28T12:00:00Z'));
    // Then: expense created with date 2026-02-28 (clamped from 31 to 28)
    expect(s3.months['2026-02'].expenses).toHaveLength(1);
    expect(s3.months['2026-02'].expenses[0].date).toBe('2026-02-28');
  });

  it('past months are always due', () => {
    // Given: a subscription due on day 25 and a past month (April) freshly opened
    const { store: s0, accountId } = seed();
    const { store: s1 } = addSubscription(s0, {
      description: 'Late',
      amount: 30,
      currency: 'BRL',
      categoryId: 'cat',
      accountId,
      dayOfMonth: 25,
    });
    const s2 = createMonth(s1, '2026-04', { BRL: 1000 });
    // When: applying for April while today is May 1 (no day comparison
    // because month is in the past)
    const s3 = applyDueSubscriptions(s2, '2026-04', new Date('2026-05-01T12:00:00Z'));
    // Then: expense was created in April
    expect(s3.months['2026-04'].expenses).toHaveLength(1);
  });
});
