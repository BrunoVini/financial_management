import { writable } from 'svelte/store';
import type { Currency, Language } from '@/lib/types';

export const SUPPORTED_CURRENCIES: Currency[] = ['BRL', 'USD', 'CAD', 'EUR'];

export interface WizardHolding {
  name: string;
  type: string;
  currency: Currency;
  currentValue: number;
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  language: Language;
  displayCurrency: Currency;
  activeCurrencies: Currency[];
  hasSalary: boolean;
  salaryAmount: number;
  salaryCurrency: Currency;
  salaryDayOfMonth: number;
  openingBalances: Record<Currency, number>;
  holdings: WizardHolding[];
}

export function defaultWizardState(language: Language): WizardState {
  return {
    step: 1,
    language,
    displayCurrency: 'BRL',
    activeCurrencies: ['BRL'],
    hasSalary: false,
    salaryAmount: 0,
    salaryCurrency: 'BRL',
    salaryDayOfMonth: 1,
    openingBalances: { BRL: 0 },
    holdings: [],
  };
}

export const wizard = writable<WizardState>(defaultWizardState('pt-BR'));
