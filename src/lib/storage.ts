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
    installments: [],
    subscriptions: [],
    budgets: {},
    ratesCache: null,
    cryptoCache: null,
    stockCache: null,
    bcbCache: null,
  };
}

export function loadStore(): Store {
  const raw = localStorage.getItem(ROOT_KEY);
  let store: Store;
  if (!raw) {
    return defaultStore();
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion === 1) store = parsed as Store;
    else return defaultStore();
  } catch {
    return defaultStore();
  }
  // Soft migration: backfill optional fields added after v1 first shipped.
  if (!Array.isArray(store.installments)) store.installments = [];
  if (!Array.isArray(store.subscriptions)) store.subscriptions = [];
  if (!store.budgets || typeof store.budgets !== 'object') store.budgets = {};
  if (store.cryptoCache === undefined) store.cryptoCache = null;
  if (store.stockCache === undefined) store.stockCache = null;
  if (store.bcbCache === undefined) store.bcbCache = null;
  return store;
}

export function saveStore(store: Store): void {
  localStorage.setItem(ROOT_KEY, JSON.stringify(store));
}
