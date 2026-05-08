import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshStockSnapshot } from '@/lib/db/stockActions';
import type { Holding, StockCache } from '@/lib/types';

const NOW = new Date('2026-05-08T12:00:00Z');

function petr(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    name: 'Petrobras PN',
    type: 'Ações',
    currency: 'BRL',
    createdAt: '2026-05-01T00:00:00Z',
    ticker: 'PETR4',
    shareAmount: 100,
    ...overrides,
  };
}

describe('refreshStockSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ results: [{ symbol: 'PETR4', regularMarketPrice: 46.22 }] }),
            { status: 200 },
          ),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('builds a snapshot from price × shareAmount', async () => {
    const result = await refreshStockSnapshot(petr(), null, NOW);
    expect(result.snapshot?.marketValue).toBe(4622);
    expect(result.snapshot?.monthKey).toBe('2026-05');
    expect(result.snapshot?.currency).toBe('BRL');
    expect(result.cache?.prices.PETR4).toBe(46.22);
  });

  it('does nothing for non-stock holdings', async () => {
    const result = await refreshStockSnapshot(petr({ ticker: undefined }), null, NOW);
    expect(result.snapshot).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('reuses same-day cache instead of fetching', async () => {
    const cache: StockCache = { fetchedAt: '2026-05-08', prices: { PETR4: 50 } };
    const result = await refreshStockSnapshot(petr(), cache, NOW);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.snapshot?.marketValue).toBe(5000);
  });

  it('surfaces errorKey on network failure with no cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network');
      }),
    );
    const result = await refreshStockSnapshot(petr(), null, NOW);
    expect(result.errorKey).toBe('inv.stock.priceFailed');
    expect(result.snapshot).toBeNull();
  });
});
