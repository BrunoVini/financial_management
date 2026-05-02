import { describe, expect, it } from 'vitest';
import {
  addExpense,
  addIncome,
  addFxTransfer,
  removeExpense,
  removeIncome,
  removeFxTransfer,
  setSalaryReceived,
  monthExpenseTotalsByCategory,
  monthExpenseTotal,
  monthIncomeTotal,
} from '@/lib/db/transactions';
import { defaultStore } from '@/lib/storage';
import { createMonth } from '@/lib/db/months';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1, CAD: 1.5 };

function seed() {
  let s = defaultStore();
  s = createMonth(s, '2026-05', { BRL: 0, USD: 0 });
  return s;
}

describe('addExpense', () => {
  it('appends an expense with a generated id and returns it', () => {
    // Given: a store with a current month
    const s0 = seed();
    // When: an expense is added
    const { store, id } = addExpense(s0, '2026-05', {
      amount: 100,
      currency: 'BRL',
      categoryId: 'cat-x',
      accountId: 'acc-x',
      date: '2026-05-15',
    });
    // Then: it is in the month with the returned id
    expect(store.months['2026-05'].expenses).toHaveLength(1);
    expect(store.months['2026-05'].expenses[0].id).toBe(id);
    expect(store.months['2026-05'].expenses[0].amount).toBe(100);
  });

  it('is a no-op when the month does not exist', () => {
    // Given: a store without that month
    const s0 = defaultStore();
    // When: trying to add
    const { store, id } = addExpense(s0, '2026-05', {
      amount: 1,
      currency: 'BRL',
      categoryId: 'x',
      accountId: 'y',
      date: '2026-05-15',
    });
    // Then: store unchanged, id is empty
    expect(store).toEqual(s0);
    expect(id).toBe('');
  });
});

describe('removeExpense', () => {
  it('drops the expense by id', () => {
    // Given: a month with two expenses
    let s = seed();
    const a = addExpense(s, '2026-05', {
      amount: 1,
      currency: 'BRL',
      categoryId: 'c',
      accountId: 'a',
      date: '2026-05-15',
    });
    s = a.store;
    const b = addExpense(s, '2026-05', {
      amount: 2,
      currency: 'BRL',
      categoryId: 'c',
      accountId: 'a',
      date: '2026-05-16',
    });
    s = b.store;
    // When: removing the first
    s = removeExpense(s, '2026-05', a.id);
    // Then: only the second remains
    expect(s.months['2026-05'].expenses).toHaveLength(1);
    expect(s.months['2026-05'].expenses[0].id).toBe(b.id);
  });
});

describe('addIncome / removeIncome', () => {
  it('appends and removes by id', () => {
    // Given: empty month
    let s = seed();
    // When: adding an income then removing it
    const { store: s1, id } = addIncome(s, '2026-05', {
      amount: 250,
      currency: 'BRL',
      date: '2026-05-10',
    });
    s = s1;
    expect(s.months['2026-05'].extraIncomes).toHaveLength(1);
    s = removeIncome(s, '2026-05', id);
    // Then: list is empty again
    expect(s.months['2026-05'].extraIncomes).toHaveLength(0);
  });
});

describe('addFxTransfer / removeFxTransfer', () => {
  it('records a paired transfer and lets it be removed', () => {
    // Given: a month
    let s = seed();
    // When: recording an FX transfer
    const { store: s1, id } = addFxTransfer(s, '2026-05', {
      fromCurrency: 'USD',
      toCurrency: 'BRL',
      fromAmount: 100,
      toAmount: 540,
      rate: 5.4,
      date: '2026-05-12',
    });
    s = s1;
    expect(s.months['2026-05'].fxTransfers).toHaveLength(1);
    s = removeFxTransfer(s, '2026-05', id);
    // Then: list is empty after removal
    expect(s.months['2026-05'].fxTransfers).toHaveLength(0);
  });
});

describe('setSalaryReceived', () => {
  it('writes salary onto the month and clears via null', () => {
    // Given: a month with no salary
    let s = seed();
    // When: marking salary received
    s = setSalaryReceived(s, '2026-05', {
      amount: 4200,
      currency: 'USD',
      rateToDisplay: 5.4,
      receivedAt: '2026-05-05',
    });
    // Then: month has salary populated
    expect(s.months['2026-05'].salary?.amount).toBe(4200);
    // When: cleared via null
    s = setSalaryReceived(s, '2026-05', null);
    // Then: salary is null again
    expect(s.months['2026-05'].salary).toBeNull();
  });
});

describe('monthExpenseTotalsByCategory + monthExpenseTotal', () => {
  it('sums by category, converting to display currency', () => {
    // Given: a month with mixed-currency expenses
    let s = seed();
    s = addExpense(s, '2026-05', {
      amount: 100,
      currency: 'BRL',
      categoryId: 'food',
      accountId: 'a',
      date: '2026-05-10',
    }).store;
    s = addExpense(s, '2026-05', {
      amount: 50,
      currency: 'USD',
      categoryId: 'food',
      accountId: 'a',
      date: '2026-05-11',
    }).store;
    s = addExpense(s, '2026-05', {
      amount: 30,
      currency: 'BRL',
      categoryId: 'leisure',
      accountId: 'a',
      date: '2026-05-12',
    }).store;
    // When: aggregating in BRL
    const totals = monthExpenseTotalsByCategory(s, '2026-05', 'BRL', ratesEurBase);
    const total = monthExpenseTotal(s, '2026-05', 'BRL', ratesEurBase);
    // Then: food sums BRL 100 + (50 USD -> BRL); leisure stays BRL 30; grand total matches
    const usdAsBrl = (50 / 1.1) * 5.5;
    expect(totals.food).toBeCloseTo(100 + usdAsBrl, 4);
    expect(totals.leisure).toBe(30);
    expect(total).toBeCloseTo(130 + usdAsBrl, 4);
  });
});

describe('monthIncomeTotal', () => {
  it('uses the locked rateToDisplay for salary and live rates for extras', () => {
    // Given: a month with a USD salary received at rate 5.4 and a BRL extra income
    let s = seed();
    s = setSalaryReceived(s, '2026-05', {
      amount: 1000,
      currency: 'USD',
      rateToDisplay: 5.4, // locked at receipt
      receivedAt: '2026-05-05',
    });
    s = addIncome(s, '2026-05', {
      amount: 200,
      currency: 'BRL',
      date: '2026-05-10',
    }).store;
    // When: totaling income in BRL with live rate 5.5
    const total = monthIncomeTotal(s, '2026-05', 'BRL', ratesEurBase);
    // Then: salary stays at 1000 * 5.4 = 5400 (locked) + 200 BRL extra = 5600
    expect(total).toBeCloseTo(5400 + 200, 4);
  });

  it('skips salary if month has none', () => {
    // Given: month with only an extra income
    let s = seed();
    s = addIncome(s, '2026-05', {
      amount: 200,
      currency: 'BRL',
      date: '2026-05-10',
    }).store;
    // When/Then: total equals just the extra
    expect(monthIncomeTotal(s, '2026-05', 'BRL', ratesEurBase)).toBe(200);
  });
});
