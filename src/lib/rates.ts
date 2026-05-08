import type { Currency, RatesCache } from './types';

/**
 * Public rates endpoint. We previously used `api.frankfurter.app`, but
 * that endpoint started returning CORS-blocked responses from browsers.
 * `open.er-api.com` (ExchangeRate-API free tier) is CORS-enabled, needs
 * no API key, and exposes the same EUR-base shape we rely on.
 *
 * The response includes every supported currency in `rates`, so we
 * filter down to the symbols the caller asked for.
 */
export const RATES_URL = 'https://open.er-api.com/v6/latest/EUR';

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
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error(`rates ${res.status}`);
  const json = (await res.json()) as {
    result: string;
    base_code: 'EUR';
    rates: Record<string, number>;
  };
  if (json.result !== 'success') throw new Error('rates non-success response');
  const filtered: Record<Currency, number> = { EUR: 1 };
  for (const sym of symbols) {
    if (sym === 'EUR') continue;
    if (typeof json.rates[sym] === 'number') filtered[sym] = json.rates[sym];
  }
  return { fetchedAt: todayIso(), base: 'EUR', rates: filtered };
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
