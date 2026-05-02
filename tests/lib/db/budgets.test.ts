import { describe, expect, it } from 'vitest';
import {
  setBudget,
  getBudget,
  categorySpendVsBudget,
} from '@/lib/db/budgets';
import { defaultStore } from '@/lib/storage';
import { addCategory } from '@/lib/db/categories';
import { addAccount } from '@/lib/db/accounts';
import { createMonth } from '@/lib/db/months';
import { addExpense } from '@/lib/db/transactions';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1 };

function seed() {
  let s = defaultStore();
  s = addCategory(s, 'expense', { name: 'Food', color: '#f00' });
  s = addCategory(s, 'expense', { name: 'Travel', color: '#0f0' });
  s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 1000 });
  s = createMonth(s, '2026-05', { BRL: 1000 });
  return {
    store: s,
    foodId: s.categories.expense[0].id,
    travelId: s.categories.expense[1].id,
    accountId: s.accounts[0].id,
  };
}

describe('setBudget / getBudget', () => {
  it('stores a positive limit and reads it back', () => {
    // Given: a fresh store
    const { store: s0, foodId } = seed();
    // When: setting a 500 BRL limit
    const s1 = setBudget(s0, foodId, 500);
    // Then: getBudget returns it
    expect(getBudget(s1, foodId)).toBe(500);
  });

  it('removes the entry on zero or negative', () => {
    // Given: a budget already set
    const { store: s0, foodId } = seed();
    const s1 = setBudget(s0, foodId, 500);
    // When: setting it to 0
    const s2 = setBudget(s1, foodId, 0);
    // Then: it is gone
    expect(getBudget(s2, foodId)).toBeUndefined();
  });
});

describe('categorySpendVsBudget', () => {
  it('returns rows for budgeted categories and any with non-zero spend', () => {
    // Given: a budget on Food, expenses split between Food (BRL 100 + USD 50) and Travel (BRL 30)
    const { store: s0, foodId, travelId, accountId } = seed();
    let s = setBudget(s0, foodId, 500);
    s = addExpense(s, '2026-05', {
      amount: 100,
      currency: 'BRL',
      categoryId: foodId,
      accountId,
      date: '2026-05-10',
    }).store;
    s = addExpense(s, '2026-05', {
      amount: 50,
      currency: 'USD',
      categoryId: foodId,
      accountId,
      date: '2026-05-12',
    }).store;
    s = addExpense(s, '2026-05', {
      amount: 30,
      currency: 'BRL',
      categoryId: travelId,
      accountId,
      date: '2026-05-15',
    }).store;
    // When: rolling up
    const rows = categorySpendVsBudget(s, '2026-05', 'BRL', ratesEurBase);
    // Then: 2 rows; Food has limit/remaining/pctUsed, Travel has only spent
    const food = rows.find((r) => r.categoryId === foodId);
    const travel = rows.find((r) => r.categoryId === travelId);
    const usdAsBrl = (50 / 1.1) * 5.5;
    expect(food?.spent).toBeCloseTo(100 + usdAsBrl, 4);
    expect(food?.limit).toBe(500);
    expect(food?.remaining).toBeCloseTo(500 - (100 + usdAsBrl), 4);
    expect(food?.pctUsed).toBeCloseTo(((100 + usdAsBrl) / 500) * 100, 4);
    expect(travel?.spent).toBe(30);
    expect(travel?.limit).toBeUndefined();
  });

  it('filters out categories with no budget and no spend', () => {
    // Given: only a budget set, no expenses
    const { store: s0, foodId } = seed();
    const s1 = setBudget(s0, foodId, 500);
    // When/Then: Food still shows (budgeted), Travel does not
    const rows = categorySpendVsBudget(s1, '2026-05', 'BRL', ratesEurBase);
    expect(rows).toHaveLength(1);
    expect(rows[0].categoryId).toBe(foodId);
    expect(rows[0].spent).toBe(0);
  });
});
