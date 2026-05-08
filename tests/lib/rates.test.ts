import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureRates, todayIso, FRANKFURTER_URL } from '@/lib/rates';
import type { RatesCache } from '@/lib/types';

describe('rates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              base: 'EUR',
              date: '2026-05-02',
              rates: { BRL: 5.5, USD: 1.1, CAD: 1.5 },
            }),
            { status: 200 },
          ),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches and returns a cache to persist when current cache is empty', async () => {
    // Given: no current cache
    // When: ensureRates is called for the active currencies
    const result = await ensureRates(['BRL', 'USD', 'CAD'], null);

    // Then: rates are returned, a fresh cache is emitted for the caller to persist,
    //       and exactly one network call was made
    expect(result.rates.BRL).toBe(5.5);
    expect(result.cache?.fetchedAt).toBe(todayIso());
    expect(result.cache?.rates.BRL).toBe(5.5);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips network and emits no cache when current cache fetchedAt is today', async () => {
    // Given: a cache already stamped with today's date
    const cache: RatesCache = { fetchedAt: todayIso(), base: 'EUR', rates: { BRL: 5.5 } };

    // When: ensureRates is called
    const result = await ensureRates(['BRL'], cache);

    // Then: no fetch happens — cached rates serve the request, no new cache to persist
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.cache).toBeNull();
    expect(result.rates.BRL).toBe(5.5);
  });

  it('refetches when cache is from a previous day', async () => {
    // Given: a cache from yesterday
    const cache: RatesCache = { fetchedAt: '2026-05-01', base: 'EUR', rates: { BRL: 5.0 } };

    // When: ensureRates is called today
    const result = await ensureRates(['BRL', 'USD', 'CAD'], cache);

    // Then: a fresh fetch is triggered and a new cache is emitted
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.cache?.fetchedAt).toBe(todayIso());
  });

  it('falls back to stale cache on fetch error', async () => {
    // Given: a stale cache and a network that will throw
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    const cache: RatesCache = { fetchedAt: '2026-04-01', base: 'EUR', rates: { BRL: 5.0 } };

    // When: ensureRates is called
    const result = await ensureRates(['BRL'], cache);

    // Then: the stale rates are returned with stale=true, no new cache to persist
    expect(result.rates.BRL).toBe(5.0);
    expect(result.stale).toBe(true);
    expect(result.cache).toBeNull();
  });

  it('builds the frankfurter URL with the requested symbols', async () => {
    // When: ensureRates is called with a specific list and no cache
    await ensureRates(['BRL', 'USD'], null);

    // Then: the URL contains base=EUR and the comma-joined symbols
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${FRANKFURTER_URL}?from=EUR&to=BRL,USD`),
    );
  });

  it('throws when network fails and no cache is available', async () => {
    // Given: no cache and a failing network
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    // When/Then: ensureRates surfaces the error
    await expect(ensureRates(['BRL'], null)).rejects.toThrow('rates unavailable');
  });
});
