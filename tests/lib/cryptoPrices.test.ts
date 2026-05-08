import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureCryptoPrices,
  priceOf,
  todayIso,
  CRYPTO_PRICES_URL,
} from '@/lib/cryptoPrices';
import type { CryptoCache } from '@/lib/types';

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe('cryptoPrices', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        okResponse({
          bitcoin: { brl: 350000, usd: 65000, eur: 60000 },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches BTC prices for the requested currencies and emits a cache', async () => {
    // Given: no current cache
    // When: BTC is requested for BRL/USD/EUR
    const result = await ensureCryptoPrices(['bitcoin'], ['BRL', 'USD', 'EUR'], null);

    // Then: prices come back, the cache covers every pair, one network call made
    expect(result.prices.bitcoin.brl).toBe(350000);
    expect(result.cache?.fetchedAt).toBe(todayIso());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('builds a CoinGecko URL with comma-joined ids and lowercase currencies', async () => {
    // When: ensure is called with multiple coins and currencies
    await ensureCryptoPrices(['bitcoin', 'ethereum'], ['BRL', 'USD'], null);

    // Then: URL is correctly assembled
    const calledWith = (globalThis.fetch as unknown as { mock: { calls: string[][] } }).mock
      .calls[0][0];
    expect(calledWith).toContain(CRYPTO_PRICES_URL);
    expect(calledWith).toContain('ids=bitcoin%2Cethereum');
    expect(calledWith).toContain('vs_currencies=brl%2Cusd');
  });

  it('skips network when current cache covers every requested pair today', async () => {
    // Given: a fresh cache covering BTC in BRL
    const cache: CryptoCache = {
      fetchedAt: todayIso(),
      prices: { bitcoin: { brl: 350000 } },
    };

    // When: ensure is called for the same pair
    const result = await ensureCryptoPrices(['bitcoin'], ['BRL'], cache);

    // Then: no fetch, no new cache to persist
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.cache).toBeNull();
    expect(result.prices.bitcoin.brl).toBe(350000);
  });

  it('refetches when cache is fresh but missing a requested currency', async () => {
    // Given: today's cache only has BRL, but caller wants USD too
    const cache: CryptoCache = {
      fetchedAt: todayIso(),
      prices: { bitcoin: { brl: 350000 } },
    };

    // When: ensure is called with the wider set
    const result = await ensureCryptoPrices(['bitcoin'], ['BRL', 'USD'], cache);

    // Then: a fresh fetch happens and the merged cache contains both
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.cache?.prices.bitcoin.usd).toBe(65000);
    expect(result.cache?.prices.bitcoin.brl).toBe(350000);
  });

  it('refetches when cache is from a previous day', async () => {
    // Given: yesterday's cache
    const cache: CryptoCache = {
      fetchedAt: '2026-05-06',
      prices: { bitcoin: { brl: 1, usd: 1 } },
    };

    // When: ensure is called today
    const result = await ensureCryptoPrices(['bitcoin'], ['BRL'], cache);

    // Then: a fresh fetch happens
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.cache?.fetchedAt).toBe(todayIso());
  });

  it('falls back to stale cache on fetch error', async () => {
    // Given: a yesterday cache and a failing network
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    const cache: CryptoCache = {
      fetchedAt: '2026-05-06',
      prices: { bitcoin: { brl: 100 } },
    };

    // When: ensure is called
    const result = await ensureCryptoPrices(['bitcoin'], ['BRL'], cache);

    // Then: stale cache returned, no new cache to persist
    expect(result.stale).toBe(true);
    expect(result.cache).toBeNull();
    expect(result.prices.bitcoin.brl).toBe(100);
  });

  it('throws when network fails and no cache is available', async () => {
    // Given: no cache and a failing network
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    // When/Then: ensure surfaces the error
    await expect(ensureCryptoPrices(['bitcoin'], ['BRL'], null)).rejects.toThrow();
  });

  it('priceOf reads (coin, currency) pairs case-insensitively from the cache', () => {
    // Given: a cache with BTC in BRL
    const cache: CryptoCache = {
      fetchedAt: todayIso(),
      prices: { bitcoin: { brl: 350000 } },
    };

    // When/Then: priceOf accepts upper-case currency codes
    expect(priceOf(cache, 'bitcoin', 'BRL')).toBe(350000);
    expect(priceOf(cache, 'bitcoin', 'USD')).toBeUndefined();
    expect(priceOf(null, 'bitcoin', 'BRL')).toBeUndefined();
  });

  it('returns the existing cache slice without fetching when no coins/currencies requested', async () => {
    // Given: a cache from yesterday
    const cache: CryptoCache = {
      fetchedAt: '2026-05-06',
      prices: { bitcoin: { brl: 100 } },
    };

    // When: ensure is called with empty inputs
    const result = await ensureCryptoPrices([], [], cache);

    // Then: no fetch happens and the input cache is surfaced unchanged
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.cache).toBeNull();
    expect(result.prices).toEqual(cache.prices);
  });
});
