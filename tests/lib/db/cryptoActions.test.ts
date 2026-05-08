import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshCryptoSnapshot } from '@/lib/db/cryptoActions';
import type { CryptoCache, Holding } from '@/lib/types';

const NOW = new Date('2026-05-07T12:00:00Z');

function btcHolding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    name: 'Bitcoin',
    type: 'Crypto',
    currency: 'BRL',
    createdAt: '2026-05-01T00:00:00Z',
    coinId: 'bitcoin',
    coinAmount: 0.5,
    ...overrides,
  };
}

describe('refreshCryptoSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ bitcoin: { brl: 350000 } }), { status: 200 }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds a snapshot from price × coinAmount and emits the cache to persist', async () => {
    // Given: a BTC holding with 0.5 BTC and no current cache
    // When: refresh is invoked
    const result = await refreshCryptoSnapshot(btcHolding(), null, NOW);

    // Then: snapshot has marketValue = 350000 × 0.5 = 175000, on the right month
    expect(result.snapshot).not.toBeNull();
    expect(result.snapshot?.marketValue).toBe(175000);
    expect(result.snapshot?.monthKey).toBe('2026-05');
    expect(result.snapshot?.currency).toBe('BRL');
    expect(result.cache?.prices.bitcoin.brl).toBe(350000);
    expect(result.errorKey).toBeUndefined();
  });

  it('does nothing for non-crypto holdings', async () => {
    // Given: a holding without coinId
    // When: refresh is invoked
    const result = await refreshCryptoSnapshot(btcHolding({ coinId: undefined }), null, NOW);

    // Then: nothing to persist, no error
    expect(result.snapshot).toBeNull();
    expect(result.cache).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reuses the same-day cache instead of fetching', async () => {
    // Given: today's cache already covers BTC in BRL
    const cache: CryptoCache = {
      fetchedAt: '2026-05-07',
      prices: { bitcoin: { brl: 400000 } },
    };

    // When: refresh is invoked
    const result = await refreshCryptoSnapshot(btcHolding(), cache, NOW);

    // Then: no fetch, snapshot reflects the cached price (0.5 × 400000)
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.cache).toBeNull();
    expect(result.snapshot?.marketValue).toBe(200000);
  });

  it('surfaces errorKey when the price feed fails and there is no cache', async () => {
    // Given: a failing network and no cache
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );

    // When: refresh is invoked
    const result = await refreshCryptoSnapshot(btcHolding(), null, NOW);

    // Then: errorKey is set; nothing to persist
    expect(result.errorKey).toBe('inv.crypto.priceFailed');
    expect(result.snapshot).toBeNull();
  });
});
