import { describe, expect, it } from 'vitest';
import {
  addAccount,
  removeAccount,
  getAccount,
  listAccountsByCurrency,
  accountBalance,
} from '@/lib/db/accounts';
import { defaultStore } from '@/lib/storage';
import { createMonth } from '@/lib/db/months';
import {
  addExpense,
  addIncome,
  addFxTransfer,
  setSalaryReceived,
} from '@/lib/db/transactions';

describe('addAccount', () => {
  it('appends a new account with a generated id', () => {
    // Given: an empty store
    const s0 = defaultStore();
    // When: adding one BRL wallet
    const s1 = addAccount(s0, { name: 'BRL Wallet', currency: 'BRL', openingBalance: 1000 });
    // Then: it is in the list with an id
    expect(s1.accounts).toHaveLength(1);
    expect(s1.accounts[0]).toMatchObject({ name: 'BRL Wallet', currency: 'BRL', openingBalance: 1000 });
    expect(s1.accounts[0].id).toBeTruthy();
  });
});

describe('removeAccount and getAccount', () => {
  it('removes by id and getAccount returns undefined afterwards', () => {
    // Given: store with two accounts
    const s0 = defaultStore();
    const s1 = addAccount(s0, { name: 'A', currency: 'BRL', openingBalance: 0 });
    const s2 = addAccount(s1, { name: 'B', currency: 'USD', openingBalance: 0 });
    const idA = s2.accounts[0].id;
    // When: removing A
    const s3 = removeAccount(s2, idA);
    // Then: only B remains, getAccount(A) is undefined
    expect(s3.accounts).toHaveLength(1);
    expect(getAccount(s3, idA)).toBeUndefined();
    expect(getAccount(s3, s3.accounts[0].id)?.name).toBe('B');
  });
});

describe('listAccountsByCurrency', () => {
  it('filters accounts by currency code', () => {
    // Given: 3 accounts across 2 currencies
    let s = defaultStore();
    s = addAccount(s, { name: 'BRL1', currency: 'BRL', openingBalance: 0 });
    s = addAccount(s, { name: 'USD1', currency: 'USD', openingBalance: 0 });
    s = addAccount(s, { name: 'BRL2', currency: 'BRL', openingBalance: 0 });
    // When: listing BRL accounts
    const brl = listAccountsByCurrency(s, 'BRL');
    // Then: 2 returned
    expect(brl).toHaveLength(2);
    expect(brl.every((a) => a.currency === 'BRL')).toBe(true);
  });
});

describe('accountBalance', () => {
  it('equals opening balance when no transactions exist', () => {
    // Given: a single account with opening balance
    const s0 = defaultStore();
    const s1 = addAccount(s0, { name: 'A', currency: 'BRL', openingBalance: 1234.5 });
    const id = s1.accounts[0].id;
    // When: querying balance for any month
    // Then: it matches the opening balance
    expect(accountBalance(s1, id, '2026-05')).toBe(1234.5);
  });

  it('returns 0 for unknown account', () => {
    // Given: a fresh store
    const s = defaultStore();
    // When/Then: querying a nonexistent id
    expect(accountBalance(s, 'nope', '2026-05')).toBe(0);
  });

  it('subtracts expenses tied to the account', () => {
    // Given: a BRL account with opening 1000 and a 200 expense in May
    let s = addAccount(defaultStore(), { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
    const id = s.accounts[0].id;
    s = createMonth(s, '2026-05', { BRL: 1000 });
    s = addExpense(s, '2026-05', {
      amount: 200,
      currency: 'BRL',
      categoryId: 'food',
      accountId: id,
      date: '2026-05-10',
    }).store;
    // When/Then: balance after May reflects the expense
    expect(accountBalance(s, id, '2026-05')).toBe(800);
  });

  it('adds extra incomes in matching currency', () => {
    // Given: a BRL account opening 0 and a 500 BRL extra income in May
    let s = addAccount(defaultStore(), { name: 'BRL', currency: 'BRL', openingBalance: 0 });
    const id = s.accounts[0].id;
    s = createMonth(s, '2026-05', { BRL: 0 });
    s = addIncome(s, '2026-05', { amount: 500, currency: 'BRL', date: '2026-05-15' }).store;
    // When/Then: balance reflects the income
    expect(accountBalance(s, id, '2026-05')).toBe(500);
  });

  it('adds salary in matching currency', () => {
    // Given: USD account opening 0 with a USD salary of 4000 received in May
    let s = addAccount(defaultStore(), { name: 'USD', currency: 'USD', openingBalance: 0 });
    const id = s.accounts[0].id;
    s = createMonth(s, '2026-05', { USD: 0 });
    s = setSalaryReceived(s, '2026-05', {
      amount: 4000,
      currency: 'USD',
      rateToDisplay: 5.4,
      receivedAt: '2026-05-05',
    });
    // When/Then: USD account balance reflects the salary
    expect(accountBalance(s, id, '2026-05')).toBe(4000);
  });

  it('handles fx transfers in both directions', () => {
    // Given: USD and BRL accounts; a fx transfer 100 USD -> 540 BRL in May
    let s = defaultStore();
    s = addAccount(s, { name: 'USD', currency: 'USD', openingBalance: 1000 });
    s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 0 });
    const usdId = s.accounts[0].id;
    const brlId = s.accounts[1].id;
    s = createMonth(s, '2026-05', { USD: 1000, BRL: 0 });
    s = addFxTransfer(s, '2026-05', {
      fromCurrency: 'USD',
      toCurrency: 'BRL',
      fromAmount: 100,
      toAmount: 540,
      rate: 5.4,
      date: '2026-05-12',
    }).store;
    // When/Then: USD drops by 100, BRL rises by 540
    expect(accountBalance(s, usdId, '2026-05')).toBe(900);
    expect(accountBalance(s, brlId, '2026-05')).toBe(540);
  });

  it('does not double-count incomes when two accounts share a currency', () => {
    // Given: two BRL accounts (BRL1 first) and a 500 BRL extra income
    let s = defaultStore();
    s = addAccount(s, { name: 'BRL1', currency: 'BRL', openingBalance: 0 });
    s = addAccount(s, { name: 'BRL2', currency: 'BRL', openingBalance: 0 });
    const id1 = s.accounts[0].id;
    const id2 = s.accounts[1].id;
    s = createMonth(s, '2026-05', { BRL: 0 });
    s = addIncome(s, '2026-05', { amount: 500, currency: 'BRL', date: '2026-05-15' }).store;

    // When/Then: only the first BRL account receives the credit; sum across all
    //            accounts equals the income (no double-counting).
    expect(accountBalance(s, id1, '2026-05')).toBe(500);
    expect(accountBalance(s, id2, '2026-05')).toBe(0);
  });

  it('does not double-count salary or fx transfers across same-currency accounts', () => {
    // Given: two USD accounts and one BRL account; a 4000 USD salary and a
    //        100 USD -> 540 BRL fx transfer in May
    let s = defaultStore();
    s = addAccount(s, { name: 'USD1', currency: 'USD', openingBalance: 0 });
    s = addAccount(s, { name: 'USD2', currency: 'USD', openingBalance: 0 });
    s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 0 });
    const usd1 = s.accounts[0].id;
    const usd2 = s.accounts[1].id;
    const brl = s.accounts[2].id;
    s = createMonth(s, '2026-05', { USD: 0, BRL: 0 });
    s = setSalaryReceived(s, '2026-05', {
      amount: 4000,
      currency: 'USD',
      rateToDisplay: 5.4,
      receivedAt: '2026-05-05',
    });
    s = addFxTransfer(s, '2026-05', {
      fromCurrency: 'USD',
      toCurrency: 'BRL',
      fromAmount: 100,
      toAmount: 540,
      rate: 5.4,
      date: '2026-05-12',
    }).store;

    // When/Then: salary and the fx outflow only hit USD1 (first); BRL
    //            inflow hits the only BRL account.
    expect(accountBalance(s, usd1, '2026-05')).toBe(3900);
    expect(accountBalance(s, usd2, '2026-05')).toBe(0);
    expect(accountBalance(s, brl, '2026-05')).toBe(540);
  });

  it('only counts months up to and including monthKey', () => {
    // Given: a BRL account with an expense in June
    let s = addAccount(defaultStore(), { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
    const id = s.accounts[0].id;
    s = createMonth(s, '2026-05', { BRL: 1000 });
    s = createMonth(s, '2026-06', { BRL: 1000 });
    s = addExpense(s, '2026-06', {
      amount: 200,
      currency: 'BRL',
      categoryId: 'c',
      accountId: id,
      date: '2026-06-10',
    }).store;
    // When/Then: querying May, expense is excluded; querying June, it's included
    expect(accountBalance(s, id, '2026-05')).toBe(1000);
    expect(accountBalance(s, id, '2026-06')).toBe(800);
  });
});
