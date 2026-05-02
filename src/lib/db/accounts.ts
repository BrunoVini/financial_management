import type { Account, Currency, MonthKey, Store } from '../types';
import { newId } from '../uuid';

export type NewAccount = { name: string; currency: Currency; openingBalance: number };

export function addAccount(store: Store, input: NewAccount): Store {
  const account: Account = { id: newId(), ...input };
  return { ...store, accounts: [...store.accounts, account] };
}

export function removeAccount(store: Store, id: string): Store {
  return { ...store, accounts: store.accounts.filter((a) => a.id !== id) };
}

export function getAccount(store: Store, id: string): Account | undefined {
  return store.accounts.find((a) => a.id === id);
}

export function listAccountsByCurrency(store: Store, currency: Currency): Account[] {
  return store.accounts.filter((a) => a.currency === currency);
}

/**
 * Compute an account's balance as of the end of `monthKey` (inclusive).
 * For Phase 2 there are no transactions yet, so this equals the opening balance.
 * Phase 3 will fold incomes/expenses/salary/fxTransfers into this calculation.
 */
export function accountBalance(store: Store, accountId: string, _monthKey: MonthKey): number {
  const account = getAccount(store, accountId);
  if (!account) return 0;
  return account.openingBalance;
}
