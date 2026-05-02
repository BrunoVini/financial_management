import type { Currency, MonthKey, Store } from '../types';
import { monthExpenseTotalsByCategory } from './transactions';

export function setBudget(store: Store, categoryId: string, amount: number): Store {
  const next = { ...store.budgets };
  if (!Number.isFinite(amount) || amount <= 0) {
    delete next[categoryId];
  } else {
    next[categoryId] = amount;
  }
  return { ...store, budgets: next };
}

export function getBudget(store: Store, categoryId: string): number | undefined {
  return store.budgets[categoryId];
}

export interface BudgetRow {
  categoryId: string;
  spent: number;
  limit: number | undefined;
  remaining: number | undefined;
  pctUsed: number | undefined;
}

/**
 * Spend-vs-budget rollup for a month, in display currency. Returns one row
 * per expense category that has either a budget set or a non-zero spend.
 * Categories with neither are filtered out.
 */
export function categorySpendVsBudget(
  store: Store,
  monthKey: MonthKey,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): BudgetRow[] {
  const totals = monthExpenseTotalsByCategory(store, monthKey, displayCurrency, ratesEurBase);
  const rows: BudgetRow[] = [];
  const seen = new Set<string>();
  for (const cat of store.categories.expense) {
    const spent = totals[cat.id] ?? 0;
    const limit = store.budgets[cat.id];
    if (!limit && spent <= 0) continue;
    const remaining = limit !== undefined ? limit - spent : undefined;
    const pctUsed = limit !== undefined && limit > 0 ? (spent / limit) * 100 : undefined;
    rows.push({ categoryId: cat.id, spent, limit, remaining, pctUsed });
    seen.add(cat.id);
  }
  return rows;
}
