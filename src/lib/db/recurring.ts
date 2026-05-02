import type { MonthKey, Store, Subscription } from '../types';
import { newId } from '../uuid';
import { addExpense } from './transactions';
import { monthKey as toMonthKey } from './months';

export type NewSubscription = Omit<Subscription, 'id' | 'createdAt' | 'active' | 'appliedMonths'>;

export function addSubscription(
  store: Store,
  input: NewSubscription,
): { store: Store; id: string } {
  const sub: Subscription = {
    id: newId(),
    createdAt: new Date().toISOString(),
    active: true,
    appliedMonths: [],
    ...input,
  };
  return {
    store: { ...store, subscriptions: [...store.subscriptions, sub] },
    id: sub.id,
  };
}

export function removeSubscription(store: Store, id: string): Store {
  return { ...store, subscriptions: store.subscriptions.filter((s) => s.id !== id) };
}

export function pauseSubscription(store: Store, id: string, paused: boolean): Store {
  return {
    ...store,
    subscriptions: store.subscriptions.map((s) =>
      s.id === id ? { ...s, active: !paused } : s,
    ),
  };
}

function lastDayOfMonth(monthKey: MonthKey): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isMonthDueOn(monthKey: MonthKey, dayOfMonth: number, today: Date): boolean {
  const todayKey = toMonthKey(today);
  if (monthKey < todayKey) return true; // a past month: always due
  if (monthKey > todayKey) return false; // future month: never due now
  // current month: only due once today's date >= dayOfMonth (clamped to month length)
  const max = lastDayOfMonth(monthKey);
  const target = Math.min(dayOfMonth, max);
  return today.getUTCDate() >= target;
}

/**
 * For every active subscription whose `appliedMonths` does not include the
 * given key, create the matching Expense in that month and record the key.
 * Idempotent: re-running on the same store is a no-op for already-applied
 * months.
 */
export function applyDueSubscriptions(
  store: Store,
  monthKey: MonthKey,
  today: Date,
): Store {
  if (!store.months[monthKey]) return store;
  let next = store;
  const lastDay = lastDayOfMonth(monthKey);
  for (const sub of store.subscriptions) {
    if (!sub.active) continue;
    if (sub.appliedMonths.includes(monthKey)) continue;
    if (!isMonthDueOn(monthKey, sub.dayOfMonth, today)) continue;
    const day = String(Math.min(sub.dayOfMonth, lastDay)).padStart(2, '0');
    const date = `${monthKey}-${day}`;
    next = addExpense(next, monthKey, {
      amount: sub.amount,
      currency: sub.currency,
      categoryId: sub.categoryId,
      accountId: sub.accountId,
      note: `${sub.description} (recurring)`,
      date,
    }).store;
    next = {
      ...next,
      subscriptions: next.subscriptions.map((s) =>
        s.id === sub.id ? { ...s, appliedMonths: [...s.appliedMonths, monthKey] } : s,
      ),
    };
  }
  return next;
}
