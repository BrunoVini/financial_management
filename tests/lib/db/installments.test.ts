import { describe, expect, it } from 'vitest';
import {
  addInstallmentPlan,
  removeInstallmentPlan,
  perInstallmentAmount,
  installmentMonth,
  installmentsPendingThrough,
  installmentsDueInMonth,
  totalUpcomingDebt,
  payInstallment,
} from '@/lib/db/installments';
import { defaultStore } from '@/lib/storage';
import { createMonth } from '@/lib/db/months';
import { addAccount } from '@/lib/db/accounts';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1 };

function seedWithAccount() {
  let s = defaultStore();
  s = addAccount(s, { name: 'BRL', currency: 'BRL', openingBalance: 5000 });
  return { store: s, accountId: s.accounts[0].id };
}

describe('addInstallmentPlan / perInstallmentAmount', () => {
  it('creates a plan with createdAt + empty paidIndices and rounds the per-installment value', () => {
    // Given: a fresh store with one account
    const { store: s0, accountId } = seedWithAccount();
    // When: a 6-installment 1234.56 BRL plan is added
    const { store, id } = addInstallmentPlan(s0, {
      description: 'Smartphone',
      totalAmount: 1234.56,
      installmentCount: 6,
      currency: 'BRL',
      accountId,
      categoryId: 'cat-tech',
      firstMonthKey: '2026-05',
    });
    // Then: it persists with computed per-installment amount
    expect(store.installments).toHaveLength(1);
    const plan = store.installments.find((p) => p.id === id)!;
    expect(plan.paidIndices).toEqual([]);
    expect(plan.createdAt).toBeTruthy();
    expect(perInstallmentAmount(plan)).toBeCloseTo(1234.56 / 6, 2);
  });
});

describe('installmentMonth', () => {
  it('walks forward one month per index, crossing year boundaries', () => {
    // Given: a plan starting in 2026-11
    const plan = {
      id: 'p',
      description: 'X',
      totalAmount: 12,
      installmentCount: 12,
      currency: 'BRL',
      accountId: 'a',
      categoryId: 'c',
      firstMonthKey: '2026-11',
      createdAt: '2026-11-01T00:00:00Z',
      paidIndices: [],
    };
    // When/Then: indices 0..3 walk Nov -> Dec -> Jan (year+1) -> Feb
    expect(installmentMonth(plan, 0)).toBe('2026-11');
    expect(installmentMonth(plan, 1)).toBe('2026-12');
    expect(installmentMonth(plan, 2)).toBe('2027-01');
    expect(installmentMonth(plan, 3)).toBe('2027-02');
  });
});

describe('installmentsPendingThrough / installmentsDueInMonth', () => {
  it('returns only unpaid installments due on or before the cutoff', () => {
    // Given: a 4-installment plan starting in May, indices 0 and 2 already paid
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'TV',
      totalAmount: 4000,
      installmentCount: 4,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    const s2 = {
      ...s1,
      installments: s1.installments.map((p) =>
        p.id === id ? { ...p, paidIndices: [0, 2] } : p,
      ),
    };
    // When: looking through July
    const through = installmentsPendingThrough(s2, '2026-07');
    // Then: only index 1 (June) is pending and ≤ July
    expect(through).toHaveLength(1);
    expect(through[0].monthKey).toBe('2026-06');
    expect(through[0].index).toBe(1);
    // And: dueInMonth respects the exact match
    expect(installmentsDueInMonth(s2, '2026-06')).toHaveLength(1);
    expect(installmentsDueInMonth(s2, '2026-05')).toHaveLength(0); // already paid
  });
});

describe('totalUpcomingDebt', () => {
  it('sums all unpaid installments converted to display currency', () => {
    // Given: a 4x100 USD plan, none paid yet
    const { store: s0, accountId } = seedWithAccount();
    const { store } = addInstallmentPlan(s0, {
      description: 'Laptop',
      totalAmount: 400,
      installmentCount: 4,
      currency: 'USD',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    // When: totalling in BRL with rates EUR=1, BRL=5.5, USD=1.1
    const total = totalUpcomingDebt(store, 'BRL', ratesEurBase);
    // Then: 400 USD -> ~2000 BRL via EUR base
    expect(total).toBeCloseTo((400 / 1.1) * 5.5, 2);
  });

  it('returns zero when every installment is paid', () => {
    // Given: a plan fully paid
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'Done',
      totalAmount: 200,
      installmentCount: 2,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    const s2 = {
      ...s1,
      installments: s1.installments.map((p) =>
        p.id === id ? { ...p, paidIndices: [0, 1] } : p,
      ),
    };
    // When/Then: total is zero
    expect(totalUpcomingDebt(s2, 'BRL', ratesEurBase)).toBe(0);
  });
});

describe('payInstallment', () => {
  it('creates an Expense in the right month and marks the index paid', () => {
    // Given: a 3x300 BRL plan and the May month created
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'Geladeira',
      totalAmount: 900,
      installmentCount: 3,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    const s2 = createMonth(s1, '2026-05', { BRL: 5000 });
    // When: paying installment 0 on 2026-05-10
    const s3 = payInstallment(s2, id, 0, '2026-05-10');
    // Then: an expense is in May with the right amount and the index is recorded as paid
    const may = s3.months['2026-05'];
    expect(may.expenses).toHaveLength(1);
    expect(may.expenses[0].amount).toBe(300);
    expect(may.expenses[0].note).toContain('1/3');
    const plan = s3.installments.find((p) => p.id === id)!;
    expect(plan.paidIndices).toEqual([0]);
  });

  it('is a no-op when the index is already paid', () => {
    // Given: a plan with index 0 already paid
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'X',
      totalAmount: 100,
      installmentCount: 1,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    const s2 = createMonth(s1, '2026-05', { BRL: 1000 });
    const s3 = payInstallment(s2, id, 0, '2026-05-10');
    // When: paying again
    const s4 = payInstallment(s3, id, 0, '2026-05-12');
    // Then: still a single expense, paidIndices unchanged
    expect(s4.months['2026-05'].expenses).toHaveLength(1);
    expect(s4.installments[0].paidIndices).toEqual([0]);
  });

  it('is a no-op when the destination month does not exist', () => {
    // Given: a plan whose month was not created yet
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'X',
      totalAmount: 100,
      installmentCount: 1,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    // When: paying without createMonth
    const s2 = payInstallment(s1, id, 0, '2026-05-10');
    // Then: store unchanged
    expect(s2).toEqual(s1);
  });
});

describe('removeInstallmentPlan', () => {
  it('drops the plan but keeps any expenses already created from past payments', () => {
    // Given: a plan with one paid installment
    const { store: s0, accountId } = seedWithAccount();
    const { store: s1, id } = addInstallmentPlan(s0, {
      description: 'X',
      totalAmount: 200,
      installmentCount: 2,
      currency: 'BRL',
      accountId,
      categoryId: 'cat',
      firstMonthKey: '2026-05',
    });
    const s2 = createMonth(s1, '2026-05', { BRL: 5000 });
    const s3 = payInstallment(s2, id, 0, '2026-05-10');
    // When: removing the plan
    const s4 = removeInstallmentPlan(s3, id);
    // Then: plan is gone but the expense stays
    expect(s4.installments).toHaveLength(0);
    expect(s4.months['2026-05'].expenses).toHaveLength(1);
  });
});
