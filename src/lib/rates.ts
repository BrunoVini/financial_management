import type { Currency, RatesCache } from './types';

export const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

export interface RatesResult {
  rates: Record<Currency, number>;
  fetchedAt: string;
  stale: boolean;
  /** New cache the caller should persist (via appStore mutate). Null when unchanged. */
  cache: RatesCache | null;
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

export async function ensureRates(
  symbols: Currency[],
  currentCache: RatesCache | null,
): Promise<RatesResult> {
  if (currentCache && currentCache.fetchedAt === todayIso()) {
    return {
      rates: currentCache.rates,
      fetchedAt: currentCache.fetchedAt,
      stale: false,
      cache: null,
    };
  }
  try {
    const fresh = await fetchRates(symbols);
    return { rates: fresh.rates, fetchedAt: fresh.fetchedAt, stale: false, cache: fresh };
  } catch {
    if (currentCache) {
      return {
        rates: currentCache.rates,
        fetchedAt: currentCache.fetchedAt,
        stale: true,
        cache: null,
      };
    }
    throw new Error('rates unavailable and no cache');
  }
}
