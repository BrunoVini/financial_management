import { describe, expect, it } from 'vitest';
import { applyWizard } from '@/routes/onboarding/finish';
import { defaultStore } from '@/lib/storage';
import { defaultWizardState } from '@/routes/onboarding/state';

const today = new Date('2026-05-02T12:00:00Z');

describe('applyWizard', () => {
  it('marks the store as onboarded and persists settings', () => {
    // Given: a fresh store and a fully filled wizard
    const w = defaultWizardState('en');
    w.displayCurrency = 'USD';
    w.activeCurrencies = ['USD', 'BRL'];
    w.openingBalances = { USD: 1000, BRL: 500 };
    w.hasSalary = true;
    w.salaryAmount = 4200;
    w.salaryCurrency = 'USD';
    w.salaryDayOfMonth = 5;

    // When: applying the wizard
    const next = applyWizard(defaultStore(), w, today);

    // Then: settings reflect everything and onboarded is true
    expect(next.settings.onboarded).toBe(true);
    expect(next.settings.language).toBe('en');
    expect(next.settings.displayCurrency).toBe('USD');
    expect(next.settings.activeCurrencies).toEqual(['USD', 'BRL']);
    expect(next.settings.salaryAmount).toBe(4200);
    expect(next.settings.salaryDayOfMonth).toBe(5);
  });

  it('seeds default categories in the chosen language', () => {
    // Given: a wizard configured in pt-BR
    const w = defaultWizardState('pt-BR');
    // When: applying
    const next = applyWizard(defaultStore(), w, today);
    // Then: pt-BR seed labels are present
    expect(next.categories.expense.length).toBeGreaterThan(0);
    expect(next.categories.expense[0].name).toBe('Mercado');
    expect(next.categories.investment.length).toBeGreaterThan(0);
    expect(next.categories.investment[0].name).toBe('Renda Fixa');
  });

  it('creates one account per active currency with the entered balance', () => {
    // Given: USD + BRL active with balances
    const w = defaultWizardState('en');
    w.activeCurrencies = ['USD', 'BRL'];
    w.openingBalances = { USD: 1000, BRL: 500 };
    // When: applying
    const next = applyWizard(defaultStore(), w, today);
    // Then: 2 accounts exist, names follow `<currency> wallet`, balances match
    expect(next.accounts).toHaveLength(2);
    const usd = next.accounts.find((a) => a.currency === 'USD');
    const brl = next.accounts.find((a) => a.currency === 'BRL');
    expect(usd?.openingBalance).toBe(1000);
    expect(brl?.openingBalance).toBe(500);
    expect(usd?.name).toBe('USD wallet');
  });

  it('opens the current month with the entered balances', () => {
    // Given: balances and today's date
    const w = defaultWizardState('en');
    w.activeCurrencies = ['BRL'];
    w.openingBalances = { BRL: 250 };
    // When: applying
    const next = applyWizard(defaultStore(), w, today);
    // Then: the current month exists with the right opening balances and is open
    const m = next.months['2026-05'];
    expect(m).toBeTruthy();
    expect(m.status).toBe('open');
    expect(m.openingBalances.BRL).toBe(250);
  });

  it('creates each holding plus a starting snapshot, ignoring blank names', () => {
    // Given: 2 holdings, one with a blank name (skipped)
    const w = defaultWizardState('en');
    w.activeCurrencies = ['BRL'];
    w.openingBalances = { BRL: 0 };
    w.holdings = [
      { name: 'PETR4', type: 'Stocks', currency: 'BRL', currentValue: 1500 },
      { name: '   ', type: 'Stocks', currency: 'BRL', currentValue: 0 },
    ];
    // When: applying
    const next = applyWizard(defaultStore(), w, today);
    // Then: 1 holding + 1 snapshot
    expect(next.investments.holdings).toHaveLength(1);
    expect(next.investments.holdings[0].name).toBe('PETR4');
    expect(next.investments.snapshots).toHaveLength(1);
    expect(next.investments.snapshots[0].marketValue).toBe(1500);
  });
});
