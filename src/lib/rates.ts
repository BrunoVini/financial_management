import type { Currency, RatesCache } from './types';
import { loadStore, saveStore } from './storage';

export const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

export interface RatesResult {
  rates: Record<Currency, number>;
  fetchedAt: string;
  stale: boolean;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchRates(symbols: Currency[]): Promise<RatesCache> {
  const url = `${FRANKFURTER_URL}?from=EUR&to=${symbols.join(',')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frankfurter ${res.status}`);
  const json = (await res.json()) as { base: 'EUR'; rates: Record<Currency, number> };
  return { fetchedAt: todayIso(), base: 'EUR', rates: { EUR: 1, ...json.rates } };
}

export async function ensureRates(symbols: Currency[]): Promise<RatesResult> {
  const store = loadStore();
  const cache = store.ratesCache;
  if (cache && cache.fetchedAt === todayIso()) {
    return { rates: cache.rates, fetchedAt: cache.fetchedAt, stale: false };
  }
  try {
    const fresh = await fetchRates(symbols);
    store.ratesCache = fresh;
    saveStore(store);
    return { rates: fresh.rates, fetchedAt: fresh.fetchedAt, stale: false };
  } catch {
    if (cache) return { rates: cache.rates, fetchedAt: cache.fetchedAt, stale: true };
    throw new Error('rates unavailable and no cache');
  }
}

export function clearRatesCache(): void {
  const store = loadStore();
  store.ratesCache = null;
  saveStore(store);
}
