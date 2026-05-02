import type { Currency, Month, MonthKey, Store } from '../types';

export const GRACE_DAYS = 7;

export function monthKey(date: Date): MonthKey {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function nextMonthKey(key: MonthKey): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const next = new Date(Date.UTC(y, m, 1));
  return monthKey(next);
}

function emptyMonth(key: MonthKey, openingBalances: Record<Currency, number>): Month {
  return {
    key,
    status: 'open',
    salary: null,
    extraIncomes: [],
    expenses: [],
    fxTransfers: [],
    openingBalances,
  };
}

export function createMonth(
  store: Store,
  key: MonthKey,
  openingBalances: Record<Currency, number>,
): Store {
  if (store.months[key]) return store;
  return { ...store, months: { ...store.months, [key]: emptyMonth(key, openingBalances) } };
}

function newestMonthKey(store: Store): MonthKey | null {
  const keys = Object.keys(store.months).sort();
  return keys.length ? keys[keys.length - 1] : null;
}

function inheritedOpeningBalances(store: Store, fromKey: MonthKey): Record<Currency, number> {
  const m = store.months[fromKey];
  if (!m) return {};
  return m.closingBalances ?? m.openingBalances ?? {};
}

export interface RolloverResult {
  store: Store;
  createdMonths: MonthKey[];
  closedMonths: MonthKey[];
}

export function rolloverIfNeeded(store: Store, today: Date): RolloverResult {
  const todayKey = monthKey(today);
  const created: MonthKey[] = [];
  const closed: MonthKey[] = [];
  let next = store;

  let newest = newestMonthKey(next);
  while (newest && newest < todayKey) {
    const nextKey = nextMonthKey(newest);
    const opening = inheritedOpeningBalances(next, newest);

    // Mark previous as 'grace' if still open
    const prev = next.months[newest];
    if (prev.status === 'open') {
      const closeDeadline = new Date(today.getTime() + GRACE_DAYS * 86_400_000).toISOString();
      next = {
        ...next,
        months: { ...next.months, [newest]: { ...prev, status: 'grace', closedAt: closeDeadline } },
      };
    }

    next = createMonth(next, nextKey, opening);
    created.push(nextKey);
    newest = nextKey;
  }

  // Sweep grace months whose deadline elapsed
  const todayMs = today.getTime();
  for (const key of Object.keys(next.months)) {
    const m = next.months[key];
    if (m.status === 'grace' && m.closedAt && new Date(m.closedAt).getTime() <= todayMs) {
      next = { ...next, months: { ...next.months, [key]: { ...m, status: 'closed' } } };
      closed.push(key);
    }
  }

  return { store: next, createdMonths: created, closedMonths: closed };
}

export function getOrCreateCurrentMonth(
  store: Store,
  today: Date,
): { store: Store; key: MonthKey } {
  const key = monthKey(today);
  if (store.months[key]) return { store, key };
  // No newest month at all: bootstrap with the active currencies opening at 0.
  const opening: Record<Currency, number> = {};
  for (const c of store.settings.activeCurrencies) opening[c] = 0;
  return { store: createMonth(store, key, opening), key };
}

export function closeMonth(
  store: Store,
  key: MonthKey,
  closingBalances: Record<Currency, number>,
): Store {
  const m = store.months[key];
  if (!m) return store;
  return {
    ...store,
    months: {
      ...store.months,
      [key]: {
        ...m,
        status: 'closed',
        closedAt: new Date().toISOString(),
        closingBalances,
      },
    },
  };
}
