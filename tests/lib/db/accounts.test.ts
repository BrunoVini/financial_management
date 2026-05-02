import { describe, expect, it } from 'vitest';
import {
  addAccount,
  removeAccount,
  getAccount,
  listAccountsByCurrency,
  accountBalance,
} from '@/lib/db/accounts';
import { defaultStore } from '@/lib/storage';

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
  it('equals opening balance when no transactions exist (Phase 2)', () => {
    // Given: a single account with opening balance
    const s0 = defaultStore();
    const s1 = addAccount(s0, { name: 'A', currency: 'BRL', openingBalance: 1234.5 });
    const id = s1.accounts[0].id;
    // When: querying balance for the current month
    const balance = accountBalance(s1, id, '2026-05');
    // Then: it matches the opening balance
    expect(balance).toBe(1234.5);
  });

  it('returns 0 for unknown account', () => {
    // Given: a fresh store
    const s = defaultStore();
    // When/Then: querying a nonexistent id
    expect(accountBalance(s, 'nope', '2026-05')).toBe(0);
  });
});
