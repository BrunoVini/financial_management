import type {
  Currency,
  Expense,
  FxTransfer,
  Income,
  Month,
  MonthKey,
  Salary,
  Store,
} from '../types';
import { newId } from '../uuid';
import { convert } from '../money';

export type NewExpense = Omit<Expense, 'id'>;
export type NewIncome = Omit<Income, 'id'>;
export type NewFxTransfer = Omit<FxTransfer, 'id'>;

function patchMonth(store: Store, key: MonthKey, patch: Partial<Month>): Store {
  const m = store.months[key];
  if (!m) return store;
  return { ...store, months: { ...store.months, [key]: { ...m, ...patch } } };
}

export function addExpense(
  store: Store,
  monthKey: MonthKey,
  input: NewExpense,
): { store: Store; id: string } {
  const m = store.months[monthKey];
  if (!m) return { store, id: '' };
  const expense: Expense = { id: newId(), ...input };
  return {
    store: patchMonth(store, monthKey, { expenses: [...m.expenses, expense] }),
    id: expense.id,
  };
}

export function removeExpense(store: Store, monthKey: MonthKey, id: string): Store {
  const m = store.months[monthKey];
  if (!m) return store;
  return patchMonth(store, monthKey, { expenses: m.expenses.filter((e) => e.id !== id) });
}

export function addIncome(
  store: Store,
  monthKey: MonthKey,
  input: NewIncome,
): { store: Store; id: string } {
  const m = store.months[monthKey];
  if (!m) return { store, id: '' };
  const income: Income = { id: newId(), ...input };
  return {
    store: patchMonth(store, monthKey, { extraIncomes: [...m.extraIncomes, income] }),
    id: income.id,
  };
}

export function removeIncome(store: Store, monthKey: MonthKey, id: string): Store {
  const m = store.months[monthKey];
  if (!m) return store;
  return patchMonth(store, monthKey, {
    extraIncomes: m.extraIncomes.filter((i) => i.id !== id),
  });
}

export function addFxTransfer(
  store: Store,
  monthKey: MonthKey,
  input: NewFxTransfer,
): { store: Store; id: string } {
  const m = store.months[monthKey];
  if (!m) return { store, id: '' };
  const fx: FxTransfer = { id: newId(), ...input };
  return {
    store: patchMonth(store, monthKey, { fxTransfers: [...m.fxTransfers, fx] }),
    id: fx.id,
  };
}

export function removeFxTransfer(store: Store, monthKey: MonthKey, id: string): Store {
  const m = store.months[monthKey];
  if (!m) return store;
  return patchMonth(store, monthKey, {
    fxTransfers: m.fxTransfers.filter((t) => t.id !== id),
  });
}

export function setSalaryReceived(
  store: Store,
  monthKey: MonthKey,
  input: Salary | null,
): Store {
  return patchMonth(store, monthKey, { salary: input });
}

function expensesByMonth(store: Store, upTo: MonthKey): Expense[] {
  const result: Expense[] = [];
  for (const key of Object.keys(store.months)) {
    if (key > upTo) continue;
    result.push(...store.months[key].expenses);
  }
  return result;
}

export function monthExpenseTotalsByCategory(
  store: Store,
  monthKey: MonthKey,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): Record<string, number> {
  const m = store.months[monthKey];
  if (!m) return {};
  const totals: Record<string, number> = {};
  for (const e of m.expenses) {
    const v = convert(e.amount, e.currency, displayCurrency, ratesEurBase);
    if (!Number.isFinite(v)) continue;
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + v;
  }
  return totals;
}

export function monthExpenseTotal(
  store: Store,
  monthKey: MonthKey,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): number {
  const totals = monthExpenseTotalsByCategory(store, monthKey, displayCurrency, ratesEurBase);
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

export function monthIncomeTotal(
  store: Store,
  monthKey: MonthKey,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): number {
  const m = store.months[monthKey];
  if (!m) return 0;
  let total = 0;
  if (m.salary) {
    // Salary uses its locked rateToDisplay rather than live rates so the
    // historical record stays stable even if rates fluctuate later.
    if (m.salary.currency === displayCurrency) total += m.salary.amount;
    else total += m.salary.amount * m.salary.rateToDisplay;
  }
  for (const i of m.extraIncomes) {
    const v = convert(i.amount, i.currency, displayCurrency, ratesEurBase);
    if (Number.isFinite(v)) total += v;
  }
  return total;
}

// Re-exported for callers that want the raw list (used by accountBalance).
export { expensesByMonth };
