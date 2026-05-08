import { describe, expect, it } from 'vitest';
import {
  addHolding,
  removeHolding,
  addContribution,
  addSnapshot,
  holdingReturn,
  setHoldingCoinAmount,
} from '@/lib/db/investments';
import { defaultStore } from '@/lib/storage';

function seedHolding() {
  const s0 = defaultStore();
  const s1 = addHolding(s0, { name: 'PETR4', type: 'Stocks', currency: 'BRL' });
  const id = s1.investments.holdings[0].id;
  return { store: s1, id };
}

describe('addHolding', () => {
  it('creates a holding with a generated id and createdAt', () => {
    // Given/When: adding one holding
    const { store, id } = seedHolding();
    // Then: it appears with id, currency, createdAt
    expect(store.investments.holdings).toHaveLength(1);
    expect(id).toBeTruthy();
    expect(store.investments.holdings[0].createdAt).toBeTruthy();
  });

  it('persists optional crypto fields when provided', () => {
    // Given/When: adding a BTC holding
    const s = addHolding(defaultStore(), {
      name: 'Bitcoin',
      type: 'Crypto',
      currency: 'BRL',
      coinId: 'bitcoin',
      coinAmount: 0.25,
    });
    const h = s.investments.holdings[0];
    // Then: coinId / coinAmount round-trip
    expect(h.coinId).toBe('bitcoin');
    expect(h.coinAmount).toBe(0.25);
  });
});

describe('setHoldingCoinAmount', () => {
  it('updates coinAmount on a crypto holding', () => {
    // Given: a BTC holding with 0.1 BTC
    let s = addHolding(defaultStore(), {
      name: 'Bitcoin',
      type: 'Crypto',
      currency: 'BRL',
      coinId: 'bitcoin',
      coinAmount: 0.1,
    });
    const id = s.investments.holdings[0].id;
    // When: bumping to 0.5
    s = setHoldingCoinAmount(s, id, 0.5);
    // Then: the holding reflects the new quantity
    expect(s.investments.holdings[0].coinAmount).toBe(0.5);
  });

  it('is a no-op for non-crypto holdings (no coinId)', () => {
    // Given: a stocks holding without coinId
    const { store, id } = seedHolding();
    // When: trying to set a coin amount
    const s2 = setHoldingCoinAmount(store, id, 1);
    // Then: nothing changes
    expect(s2.investments.holdings[0].coinAmount).toBeUndefined();
  });
});

describe('removeHolding', () => {
  it('drops the holding plus its contributions and snapshots', () => {
    // Given: a holding with a contribution and a snapshot
    const { store: s1, id } = seedHolding();
    const s2 = addContribution(s1, {
      holdingId: id,
      monthKey: '2026-05',
      amount: 100,
      currency: 'BRL',
      date: '2026-05-10',
    });
    const s3 = addSnapshot(s2, {
      holdingId: id,
      monthKey: '2026-05',
      marketValue: 110,
      currency: 'BRL',
      takenAt: '2026-05-31',
    });
    // When: removing the holding
    const s4 = removeHolding(s3, id);
    // Then: holding, contributions, snapshots all gone
    expect(s4.investments.holdings).toHaveLength(0);
    expect(s4.investments.contributions).toHaveLength(0);
    expect(s4.investments.snapshots).toHaveLength(0);
  });
});

describe('holdingReturn', () => {
  it('returns zero everything for a brand-new holding', () => {
    // Given: a holding with no contributions or snapshots
    const { store, id } = seedHolding();
    // When: computing return
    const r = holdingReturn(store, id);
    // Then: marketValue defaults to contributed (0), all deltas zero
    expect(r).toEqual({ contributed: 0, marketValue: 0, deltaAbsolute: 0, deltaPercent: 0 });
  });

  it('uses the latest snapshot vs total contributions', () => {
    // Given: 2 contributions (+100, +200) and 2 snapshots (310, 350)
    const { store: s1, id } = seedHolding();
    const s2 = addContribution(s1, {
      holdingId: id,
      monthKey: '2026-05',
      amount: 100,
      currency: 'BRL',
      date: '2026-05-10',
    });
    const s3 = addContribution(s2, {
      holdingId: id,
      monthKey: '2026-05',
      amount: 200,
      currency: 'BRL',
      date: '2026-05-20',
    });
    const s4 = addSnapshot(s3, {
      holdingId: id,
      monthKey: '2026-05',
      marketValue: 310,
      currency: 'BRL',
      takenAt: '2026-05-15',
    });
    const s5 = addSnapshot(s4, {
      holdingId: id,
      monthKey: '2026-05',
      marketValue: 350,
      currency: 'BRL',
      takenAt: '2026-05-31',
    });
    // When: computing return
    const r = holdingReturn(s5, id);
    // Then: contributed=300, marketValue=350 (latest), delta=50, %=16.67
    expect(r.contributed).toBe(300);
    expect(r.marketValue).toBe(350);
    expect(r.deltaAbsolute).toBe(50);
    expect(r.deltaPercent).toBeCloseTo(50 / 300 * 100, 4);
  });
});
