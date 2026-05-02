import type { Currency, InstallmentPlan, MonthKey, Store } from '../types';
import { newId } from '../uuid';
import { addExpense } from './transactions';
import { nextMonthKey } from './months';
import { convert } from '../money';

export type NewInstallmentPlan = Omit<InstallmentPlan, 'id' | 'createdAt' | 'paidIndices'>;

export function addInstallmentPlan(
  store: Store,
  input: NewInstallmentPlan,
): { store: Store; id: string } {
  const plan: InstallmentPlan = {
    id: newId(),
    createdAt: new Date().toISOString(),
    paidIndices: [],
    ...input,
  };
  return {
    store: { ...store, installments: [...store.installments, plan] },
    id: plan.id,
  };
}

export function removeInstallmentPlan(store: Store, id: string): Store {
  return { ...store, installments: store.installments.filter((p) => p.id !== id) };
}

export function perInstallmentAmount(plan: InstallmentPlan): number {
  if (plan.installmentCount <= 0) return 0;
  return Math.round((plan.totalAmount / plan.installmentCount) * 100) / 100;
}

export function installmentMonth(plan: InstallmentPlan, index: number): MonthKey {
  let key = plan.firstMonthKey;
  for (let i = 0; i < index; i += 1) key = nextMonthKey(key);
  return key;
}

export interface PendingInstallment {
  plan: InstallmentPlan;
  index: number;
  monthKey: MonthKey;
  amount: number;
}

/**
 * Returns the unpaid installments due on or before `monthKey`,
 * ordered by month ascending.
 */
export function installmentsPendingThrough(
  store: Store,
  monthKey: MonthKey,
): PendingInstallment[] {
  const out: PendingInstallment[] = [];
  for (const plan of store.installments) {
    const amount = perInstallmentAmount(plan);
    for (let i = 0; i < plan.installmentCount; i += 1) {
      if (plan.paidIndices.includes(i)) continue;
      const due = installmentMonth(plan, i);
      if (due > monthKey) continue;
      out.push({ plan, index: i, monthKey: due, amount });
    }
  }
  return out.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export function installmentsDueInMonth(
  store: Store,
  monthKey: MonthKey,
): PendingInstallment[] {
  return installmentsPendingThrough(store, monthKey).filter((p) => p.monthKey === monthKey);
}

/**
 * Sum of every still-unpaid installment, converted to `displayCurrency`
 * via the live rates cache. NaN-safe (skips entries when conversion
 * fails).
 */
export function totalUpcomingDebt(
  store: Store,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): number {
  let sum = 0;
  for (const plan of store.installments) {
    const amount = perInstallmentAmount(plan);
    for (let i = 0; i < plan.installmentCount; i += 1) {
      if (plan.paidIndices.includes(i)) continue;
      const v = convert(amount, plan.currency, displayCurrency, ratesEurBase);
      if (Number.isFinite(v)) sum += v;
    }
  }
  return sum;
}

/**
 * Mark an installment paid: creates the matching Expense in its month
 * and records the index in paidIndices. The month must already exist
 * (call rolloverIfNeeded first if needed).
 */
export function payInstallment(
  store: Store,
  planId: string,
  index: number,
  date: string,
): Store {
  const plan = store.installments.find((p) => p.id === planId);
  if (!plan) return store;
  if (plan.paidIndices.includes(index)) return store;
  const monthKey = installmentMonth(plan, index);
  if (!store.months[monthKey]) return store;
  const amount = perInstallmentAmount(plan);
  const note = `${plan.description} (${index + 1}/${plan.installmentCount})`;
  let next = addExpense(store, monthKey, {
    amount,
    currency: plan.currency,
    categoryId: plan.categoryId,
    accountId: plan.accountId,
    note,
    date,
  }).store;
  next = {
    ...next,
    installments: next.installments.map((p) =>
      p.id === planId ? { ...p, paidIndices: [...p.paidIndices, index].sort((a, b) => a - b) } : p,
    ),
  };
  return next;
}
