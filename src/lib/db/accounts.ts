import type { Account, Currency, Month, MonthKey, Store } from '../types';
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

interface MonthDelta {
  in: number;
  out: number;
}

function monthDelta(month: Month, account: Account, isCurrencyPrimary: boolean): MonthDelta {
  let inSum = 0;
  let outSum = 0;
  for (const e of month.expenses) {
    if (e.accountId === account.id) outSum += e.amount;
  }
  // Income / salary / fx-transfer transactions don't carry an `accountId`,
  // so they are attributed by currency. To avoid double-counting when more
  // than one account shares a currency, only the first such account
  // (insertion order) receives the credit.
  if (isCurrencyPrimary) {
    for (const i of month.extraIncomes) {
      if (i.currency === account.currency) inSum += i.amount;
    }
    if (month.salary && month.salary.currency === account.currency) {
      inSum += month.salary.amount;
    }
    for (const fx of month.fxTransfers) {
      if (fx.fromCurrency === account.currency) outSum += fx.fromAmount;
      if (fx.toCurrency === account.currency) inSum += fx.toAmount;
    }
  }
  return { in: inSum, out: outSum };
}

/**
 * Account balance at the end of `monthKey` (inclusive). Folds in every
 * transaction (expenses by accountId; incomes / salary / fxTransfers by
 * matching currency, attributed to the first account of that currency)
 * up to that month from `account.openingBalance`.
 */
export function accountBalance(store: Store, accountId: string, monthKey: MonthKey): number {
  const account = getAccount(store, accountId);
  if (!account) return 0;
  const primaryByCurrency = store.accounts.find((a) => a.currency === account.currency);
  const isCurrencyPrimary = primaryByCurrency?.id === account.id;
  let balance = account.openingBalance;
  for (const key of Object.keys(store.months).sort()) {
    if (key > monthKey) continue;
    const { in: inSum, out: outSum } = monthDelta(store.months[key], account, isCurrencyPrimary);
    balance += inSum - outSum;
  }
  return balance;
}
