import type { StockCache } from './types';

/**
 * brapi.dev free `quote/{ticker}` endpoint. CORS-enabled, rate-limited
 * (~15 req/min anonymous). Returns shape:
 * `{ results: [{ symbol, regularMarketPrice, currency, ... }] }`.
 */
export const STOCK_QUOTE_URL = 'https://brapi.dev/api/quote';

export interface StockPricesResult {
  prices: Record<string, number>;
  fetchedAt: string;
  stale: boolean;
  /** New cache to persist. Null when unchanged. */
  cache: StockCache | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchPrices(tickers: string[]): Promise<StockCache> {
  const list = tickers.map((t) => encodeURIComponent(t.toUpperCase())).join(',');
  const res = await fetch(`${STOCK_QUOTE_URL}/${list}`);
  if (!res.ok) throw new Error(`stock ${res.status}`);
  const json = (await res.json()) as {
    results?: Array<{ symbol: string; regularMarketPrice?: number }>;
  };
  const prices: Record<string, number> = {};
  for (const r of json.results ?? []) {
    if (typeof r.regularMarketPrice === 'number') {
      prices[r.symbol.toUpperCase()] = r.regularMarketPrice;
    }
  }
  return { fetchedAt: todayIso(), prices };
}

/**
 * Returns stock prices for the requested tickers. Reuses `currentCache`
 * when it covers every ticker on the same UTC day. Otherwise fetches
 * and emits a merged cache the caller persists via `mutate`.
 */
export async function ensureStockPrices(
  tickers: string[],
  currentCache: StockCache | null,
): Promise<StockPricesResult> {
  if (tickers.length === 0) {
    return {
      prices: currentCache?.prices ?? {},
      fetchedAt: currentCache?.fetchedAt ?? todayIso(),
      stale: false,
      cache: null,
    };
  }
  const today = todayIso();
  const upper = tickers.map((t) => t.toUpperCase());
  const isFresh = currentCache && currentCache.fetchedAt === today;
  const covers = isFresh && upper.every((t) => typeof currentCache.prices[t] === 'number');
  if (covers) {
    return {
      prices: currentCache.prices,
      fetchedAt: currentCache.fetchedAt,
      stale: false,
      cache: null,
    };
  }
  try {
    const fresh = await fetchPrices(upper);
    const merged: StockCache =
      isFresh && currentCache
        ? { fetchedAt: today, prices: { ...currentCache.prices, ...fresh.prices } }
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
    throw new Error('stock prices unavailable and no cache');
  }
}

export function stockPriceOf(cache: StockCache | null, ticker: string): number | undefined {
  return cache?.prices[ticker.toUpperCase()];
}
