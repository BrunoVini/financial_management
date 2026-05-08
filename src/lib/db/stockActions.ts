import type { Holding, StockCache } from '../types';
import type { NewSnapshot } from './investments';
import { ensureStockPrices, stockPriceOf } from '../stockPrices';
import { monthKey as toMonthKey } from './months';

export interface RefreshStockSnapshotResult {
  cache: StockCache | null;
  snapshot: NewSnapshot | null;
  errorKey?: 'inv.stock.priceFailed';
}

/**
 * Coordinator for "refresh stock price": hits brapi.dev, looks up the
 * latest regularMarketPrice, and computes the snapshot the caller should
 * append. Failures surface via `errorKey` instead of throwing.
 */
export async function refreshStockSnapshot(
  holding: Holding,
  currentCache: StockCache | null,
  now: Date = new Date(),
): Promise<RefreshStockSnapshotResult> {
  if (!holding.ticker || holding.shareAmount === undefined) {
    return { cache: null, snapshot: null };
  }
  let cache: StockCache | null = null;
  let prices: StockCache | null = currentCache;
  try {
    const result = await ensureStockPrices([holding.ticker], currentCache);
    cache = result.cache;
    if (cache) prices = cache;
  } catch {
    return { cache: null, snapshot: null, errorKey: 'inv.stock.priceFailed' };
  }
  const price = stockPriceOf(prices, holding.ticker);
  if (typeof price !== 'number') {
    return { cache, snapshot: null, errorKey: 'inv.stock.priceFailed' };
  }
  const marketValue = Math.round(price * holding.shareAmount * 100) / 100;
  return {
    cache,
    snapshot: {
      holdingId: holding.id,
      monthKey: toMonthKey(now),
      marketValue,
      currency: holding.currency,
      takenAt: now.toISOString().slice(0, 10),
    },
  };
}
