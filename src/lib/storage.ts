import type { Store } from './types';

export const ROOT_KEY = 'fm:v1';

export function defaultStore(): Store {
  return {
    schemaVersion: 1,
    settings: {
      language: 'pt-BR',
      theme: 'dark',
      displayCurrency: 'BRL',
      salaryCurrency: 'BRL',
      salaryAmount: 0,
      salaryDayOfMonth: 1,
      activeCurrencies: ['BRL'],
      onboarded: false,
    },
    categories: { expense: [], investment: [] },
    accounts: [],
    months: {},
    investments: { holdings: [], contributions: [], snapshots: [] },
    ratesCache: null,
  };
}

export function loadStore(): Store {
  const raw = localStorage.getItem(ROOT_KEY);
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === 1) return parsed as Store;
    return defaultStore();
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(ROOT_KEY, JSON.stringify(store));
}
