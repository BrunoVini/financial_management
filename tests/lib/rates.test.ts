import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureRates, todayIso, FRANKFURTER_URL } from '@/lib/rates';
import { defaultStore, saveStore, loadStore } from '@/lib/storage';

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

  it('fetches and caches when cache is empty', async () => {
    // Given: a fresh store with no rates cache
    const store = defaultStore();
    saveStore(store);

    // When: ensureRates is called for the active currencies
    const result = await ensureRates(['BRL', 'USD', 'CAD']);

    // Then: rates are returned, the cache is populated, and exactly one network call was made
    expect(result.rates.BRL).toBe(5.5);
    expect(loadStore().ratesCache?.fetchedAt).toBe(todayIso());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips network when cache fetchedAt is today', async () => {
    // Given: a cache already stamped with today's date
    const store = defaultStore();
    store.ratesCache = { fetchedAt: todayIso(), base: 'EUR', rates: { BRL: 5.5 } };
    saveStore(store);

    // When: ensureRates is called
    await ensureRates(['BRL']);

    // Then: no fetch happens — cached rates serve the request
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('refetches when cache is from a previous day', async () => {
    // Given: a cache from yesterday
    const store = defaultStore();
    store.ratesCache = { fetchedAt: '2026-05-01', base: 'EUR', rates: { BRL: 5.0 } };
    saveStore(store);

    // When: ensureRates is called today
    await ensureRates(['BRL', 'USD', 'CAD']);

    // Then: a fresh fetch is triggered
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to stale cache on fetch error', async () => {
    // Given: a stale cache and a network that will throw
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    const store = defaultStore();
    store.ratesCache = { fetchedAt: '2026-04-01', base: 'EUR', rates: { BRL: 5.0 } };
    saveStore(store);

    // When: ensureRates is called
    const result = await ensureRates(['BRL']);

    // Then: the stale rates are returned with stale=true (caller can warn the user)
    expect(result.rates.BRL).toBe(5.0);
    expect(result.stale).toBe(true);
  });

  it('builds the frankfurter URL with the requested symbols', async () => {
    // Given: a fresh store
    saveStore(defaultStore());

    // When: ensureRates is called with a specific list
    await ensureRates(['BRL', 'USD']);

    // Then: the URL contains base=EUR and the comma-joined symbols
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${FRANKFURTER_URL}?from=EUR&to=BRL,USD`),
    );
  });
});
