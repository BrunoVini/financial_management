import type { CryptoCache, Currency } from './types';

/**
 * CoinGecko free `simple/price` endpoint. CORS-enabled, no API key
 * required, rate-limited to ~10-30 calls/min — fine since we cache
 * daily. Returns shape: `{ <coinId>: { <vsCurrencyLower>: <price> } }`.
 */
export const CRYPTO_PRICES_URL = 'https://api.coingecko.com/api/v3/simple/price';

export interface CryptoPricesResult {
  prices: Record<string, Record<string, number>>;
  fetchedAt: string;
  stale: boolean;
  /** New cache the caller should persist via appStore. Null when unchanged. */
  cache: CryptoCache | null;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildUrl(coinIds: string[], currencies: Currency[]): string {
  const ids = encodeURIComponent(coinIds.join(','));
  const vs = encodeURIComponent(currencies.map((c) => c.toLowerCase()).join(','));
  return `${CRYPTO_PRICES_URL}?ids=${ids}&vs_currencies=${vs}`;
}

async function fetchPrices(coinIds: string[], currencies: Currency[]): Promise<CryptoCache> {
  const res = await fetch(buildUrl(coinIds, currencies));
  if (!res.ok) throw new Error(`crypto ${res.status}`);
  const json = (await res.json()) as Record<string, Record<string, number>>;
  return { fetchedAt: todayIso(), prices: json };
}

/**
 * Returns crypto prices for the requested coins + currencies. Reuses
 * `currentCache` when it's fresh (same UTC day) AND already covers
 * every requested (coin, currency) pair. Otherwise fetches and emits a
 * merged cache that the caller persists via `mutate(...)`.
 */
export async function ensureCryptoPrices(
  coinIds: string[],
  currencies: Currency[],
  currentCache: CryptoCache | null,
): Promise<CryptoPricesResult> {
  if (coinIds.length === 0 || currencies.length === 0) {
    return {
      prices: currentCache?.prices ?? {},
      fetchedAt: currentCache?.fetchedAt ?? todayIso(),
      stale: false,
      cache: null,
    };
  }
  const today = todayIso();
  const isFresh = currentCache && currentCache.fetchedAt === today;
  const covers =
    isFresh &&
    coinIds.every((id) =>
      currencies.every((c) => typeof currentCache.prices[id]?.[c.toLowerCase()] === 'number'),
    );
  if (covers) {
    return {
      prices: currentCache.prices,
      fetchedAt: currentCache.fetchedAt,
      stale: false,
      cache: null,
    };
  }
  try {
    const fresh = await fetchPrices(coinIds, currencies);
    // Merge with existing same-day cache so previously fetched coins/currencies
    // aren't dropped when the caller asks for a smaller set later.
    const merged: CryptoCache =
      isFresh && currentCache
        ? {
            fetchedAt: today,
            prices: { ...currentCache.prices, ...fresh.prices },
          }
        : fresh;
    return { prices: merged.prices, fetchedAt: merged.fetchedAt, stale: false, cache: merged };
  } catch {
    if (currentCache) {
      return {
        prices: currentCache.prices,
        fetchedAt: currentCache.fetchedAt,
        stale: true,
        cache: null,
      };
    }
    throw new Error('crypto prices unavailable and no cache');
  }
}

/**
 * Look up `coinId` priced in `currency` from the cache. Returns
 * `undefined` when the cache is missing or the pair was never fetched.
 */
export function priceOf(
  cache: CryptoCache | null,
  coinId: string,
  currency: Currency,
): number | undefined {
  return cache?.prices[coinId]?.[currency.toLowerCase()];
}
