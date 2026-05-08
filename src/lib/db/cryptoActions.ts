import type { CryptoCache, Holding } from '../types';
import type { NewSnapshot } from './investments';
import { ensureCryptoPrices, priceOf } from '../cryptoPrices';
import { monthKey as toMonthKey } from './months';

export interface RefreshSnapshotResult {
  /** Crypto cache to persist via mutate. Null when unchanged. */
  cache: CryptoCache | null;
  /** Snapshot input ready to feed addSnapshot. Null when refresh failed. */
  snapshot: NewSnapshot | null;
  /** i18n key the caller should surface to the user when set. */
  errorKey?: 'inv.crypto.priceFailed';
}

/**
 * Pure-ish coordinator for the "refresh crypto price" action: hits
 * CoinGecko (via ensureCryptoPrices), looks up the price, and computes
 * the snapshot the caller should append. Any network or pricing failure
 * is surfaced via `errorKey` instead of throwing so UI can stay tidy.
 */
export async function refreshCryptoSnapshot(
  holding: Holding,
  currentCache: CryptoCache | null,
  now: Date = new Date(),
): Promise<RefreshSnapshotResult> {
  if (!holding.coinId || holding.coinAmount === undefined) {
    return { cache: null, snapshot: null };
  }
  let cache: CryptoCache | null = null;
  let prices: CryptoCache | null = currentCache;
  try {
    const result = await ensureCryptoPrices([holding.coinId], [holding.currency], currentCache);
    cache = result.cache;
    if (cache) prices = cache;
  } catch {
    return { cache: null, snapshot: null, errorKey: 'inv.crypto.priceFailed' };
  }
  const price = priceOf(prices, holding.coinId, holding.currency);
  if (typeof price !== 'number') {
    return { cache, snapshot: null, errorKey: 'inv.crypto.priceFailed' };
  }
  const marketValue = Math.round(price * holding.coinAmount * 100) / 100;
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
