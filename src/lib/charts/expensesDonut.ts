import type { Currency, MonthKey, Store } from '../types';
import { monthExpenseTotalsByCategory } from '../db/transactions';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

/**
 * Per-category totals for a month, converted to display currency, paired
 * with the category's color. Categories with zero spend are dropped.
 * Empty array when the month has no expenses.
 */
export function expensesDonut(
  store: Store,
  monthKey: MonthKey,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): DonutSlice[] {
  const totals = monthExpenseTotalsByCategory(store, monthKey, displayCurrency, ratesEurBase);
  const slices: DonutSlice[] = [];
  for (const cat of store.categories.expense) {
    const value = totals[cat.id];
    if (!value || value <= 0) continue;
    slices.push({ name: cat.name, value, color: cat.color });
  }
  return slices;
}
