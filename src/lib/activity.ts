import type { Category, Month, Store } from './types';
import type { ActivityEntry } from '../components/ActivityList.svelte';

function categoryName(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.name ?? '—';
}

function categoryColor(categories: Category[], id: string): string | undefined {
  return categories.find((c) => c.id === id)?.color;
}

/**
 * Normalize a Month into ActivityEntry rows for the Overview/MonthDetail
 * lists. Returned in date-descending order. Salary is a single row when
 * present.
 */
export function monthActivity(store: Store, month: Month): ActivityEntry[] {
  const cats = store.categories.expense;
  const entries: ActivityEntry[] = [];

  if (month.salary) {
    entries.push({
      id: `salary-${month.key}`,
      kind: 'salary',
      amount: month.salary.amount,
      currency: month.salary.currency,
      date: month.salary.receivedAt,
      label: 'Salary',
    });
  }

  for (const e of month.expenses) {
    entries.push({
      id: e.id,
      kind: 'expense',
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      label: e.note?.trim() || categoryName(cats, e.categoryId),
      color: categoryColor(cats, e.categoryId),
    });
  }

  for (const i of month.extraIncomes) {
    entries.push({
      id: i.id,
      kind: 'income',
      amount: i.amount,
      currency: i.currency,
      date: i.date,
      label: i.note?.trim() || 'Extra income',
    });
  }

  for (const fx of month.fxTransfers) {
    entries.push({
      id: fx.id,
      kind: 'fx',
      amount: fx.fromAmount,
      currency: fx.fromCurrency,
      date: fx.date,
      label: `${fx.fromCurrency} → ${fx.toCurrency}`,
    });
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
