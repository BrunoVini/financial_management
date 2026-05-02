import { describe, expect, it } from 'vitest';
import { expensesDonut } from '@/lib/charts/expensesDonut';
import { defaultStore } from '@/lib/storage';
import { addAccount } from '@/lib/db/accounts';
import { addCategory } from '@/lib/db/categories';
import { createMonth } from '@/lib/db/months';
import { addExpense } from '@/lib/db/transactions';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1 };

describe('expensesDonut', () => {
  it('returns one slice per category with non-zero spend, in display currency', () => {
    // Given: two categories, one with two expenses (different currencies),
    // the other with zero spend
    let s = defaultStore();
    s = addCategory(s, 'expense', { name: 'Food', color: '#f00' });
    s = addCategory(s, 'expense', { name: 'Travel', color: '#0f0' });
    s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 0 });
    const accId = s.accounts[0].id;
    const foodId = s.categories.expense[0].id;
    s = createMonth(s, '2026-05', { BRL: 0 });
    s = addExpense(s, '2026-05', {
      amount: 100,
      currency: 'BRL',
      categoryId: foodId,
      accountId: accId,
      date: '2026-05-10',
    }).store;
    s = addExpense(s, '2026-05', {
      amount: 10,
      currency: 'USD',
      categoryId: foodId,
      accountId: accId,
      date: '2026-05-12',
    }).store;
    // When: building the donut for May in BRL
    const slices = expensesDonut(s, '2026-05', 'BRL', ratesEurBase);
    // Then: one slice (Food) with summed value, Travel filtered out
    expect(slices).toHaveLength(1);
    const usdAsBrl = (10 / 1.1) * 5.5;
    expect(slices[0].name).toBe('Food');
    expect(slices[0].value).toBeCloseTo(100 + usdAsBrl, 4);
    expect(slices[0].color).toBe('#f00');
  });

  it('returns an empty array when the month has no expenses', () => {
    // Given/When/Then: no expenses
    const s = defaultStore();
    expect(expensesDonut(s, '2026-05', 'BRL', ratesEurBase)).toEqual([]);
  });
});
