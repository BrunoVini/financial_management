import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureRates, todayIso, RATES_URL } from '@/lib/rates';
import type { RatesCache } from '@/lib/types';

function okResponse(rates: Record<string, number>): Response {
  return new Response(
    JSON.stringify({
      result: 'success',
      base_code: 'EUR',
      rates,
    }),
    { status: 200 },
  );
}

describe('rates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-02T12:00:00Z'));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => okResponse({ EUR: 1, BRL: 5.5, USD: 1.1, CAD: 1.5, JPY: 165 })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fetches and returns a cache filtered to requested symbols', async () => {
    // Given: no current cache
    // When: ensureRates is called for BRL/USD/CAD
    const result = await ensureRates(['BRL', 'USD', 'CAD'], null);

    // Then: only requested symbols (plus EUR base) are kept; one network call
    expect(result.rates.BRL).toBe(5.5);
    expect(result.rates.USD).toBe(1.1);
    expect(result.cache?.fetchedAt).toBe(todayIso());
    expect(result.cache?.rates.JPY).toBeUndefined();
    expect(result.cache?.rates.EUR).toBe(1);
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
    // Given: a stale cache and a network that will throw (simulates CORS / offline)
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

  it('hits the open.er-api EUR-base endpoint', async () => {
    // When: ensureRates is called
    await ensureRates(['BRL', 'USD'], null);

    // Then: the request goes to the configured URL
    expect(globalThis.fetch).toHaveBeenCalledWith(RATES_URL);
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

  it('rejects responses with result != success', async () => {
    // Given: provider returns an error envelope
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ result: 'error', 'error-type': 'unsupported-code' }),
            { status: 200 },
          ),
      ),
    );

    // When/Then: ensureRates throws (treated as fetch failure)
    await expect(ensureRates(['BRL'], null)).rejects.toThrow();
  });
});
