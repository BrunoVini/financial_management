import type { Store } from '@/lib/types';
import {
  defaultExpenseCategories,
  defaultInvestmentCategories,
} from '@/lib/db/categories';
import { addAccount } from '@/lib/db/accounts';
import { createMonth, monthKey } from '@/lib/db/months';
import { addHolding, addSnapshot } from '@/lib/db/investments';
import type { WizardState } from './state';

/**
 * Apply the wizard state to a Store: persists settings, seeds default
 * categories, creates one account per active currency, opens the current
 * month and seeds optional holdings (each with a starting snapshot so
 * the growth chart has a reference point).
 */
export function applyWizard(store: Store, w: WizardState, today: Date): Store {
  const todayIso = today.toISOString();
  const todayKey = monthKey(today);
  let next = store;

  next = {
    ...next,
    settings: {
      ...next.settings,
      language: w.language,
      displayCurrency: w.displayCurrency,
      activeCurrencies: w.activeCurrencies,
      salaryCurrency: w.hasSalary ? w.salaryCurrency : w.displayCurrency,
      salaryAmount: w.hasSalary ? w.salaryAmount : 0,
      salaryDayOfMonth: w.hasSalary ? w.salaryDayOfMonth : 1,
      onboarded: true,
    },
  };

  next = {
    ...next,
    categories: {
      expense: defaultExpenseCategories(w.language),
      investment: defaultInvestmentCategories(w.language),
    },
  };

  for (const currency of w.activeCurrencies) {
    next = addAccount(next, {
      name: `${currency} wallet`,
      currency,
      openingBalance: w.openingBalances[currency] ?? 0,
    });
  }

  next = createMonth(next, todayKey, { ...w.openingBalances });

  for (const h of w.holdings) {
    if (!h.name.trim()) continue;
    const before = next.investments.holdings.length;
    next = addHolding(next, { name: h.name, type: h.type, currency: h.currency });
    const created = next.investments.holdings[before];
    next = addSnapshot(next, {
      holdingId: created.id,
      monthKey: todayKey,
      marketValue: h.currentValue,
      currency: h.currency,
      takenAt: todayIso,
    });
  }

  return next;
}
