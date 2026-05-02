import { describe, expect, it } from 'vitest';
import { investmentSeries, holdingSparkline } from '@/lib/charts/investmentSeries';
import { defaultStore } from '@/lib/storage';
import { addHolding, addContribution, addSnapshot } from '@/lib/db/investments';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1 };

describe('investmentSeries', () => {
  it('returns empty arrays when there are no contributions or snapshots', () => {
    // Given/When/Then: a fresh store
    const s = defaultStore();
    expect(investmentSeries(s, 'BRL', ratesEurBase)).toEqual({
      keys: [],
      contributions: [],
      marketValue: [],
    });
  });

  it('cumulates contributions and uses the latest snapshot per holding', () => {
    // Given: one holding with 2 contributions (May +100 BRL, Jun +200 BRL)
    // and 2 snapshots (May 110, Jun 350)
    let s = addHolding(defaultStore(), { name: 'X', type: 'Stocks', currency: 'BRL' });
    const id = s.investments.holdings[0].id;
    s = addContribution(s, {
      holdingId: id,
      monthKey: '2026-05',
      amount: 100,
      currency: 'BRL',
      date: '2026-05-10',
    });
    s = addContribution(s, {
      holdingId: id,
      monthKey: '2026-06',
      amount: 200,
      currency: 'BRL',
      date: '2026-06-10',
    });
    s = addSnapshot(s, {
      holdingId: id,
      monthKey: '2026-05',
      marketValue: 110,
      currency: 'BRL',
      takenAt: '2026-05-31',
    });
    s = addSnapshot(s, {
      holdingId: id,
      monthKey: '2026-06',
      marketValue: 350,
      currency: 'BRL',
      takenAt: '2026-06-30',
    });
    // When: building the series in BRL
    const r = investmentSeries(s, 'BRL', ratesEurBase);
    // Then: keys are May, Jun; contributions cumulate; market value is the
    // latest snapshot ≤ each key
    expect(r.keys).toEqual(['2026-05', '2026-06']);
    expect(r.contributions).toEqual([100, 300]);
    expect(r.marketValue).toEqual([110, 350]);
  });

  it('falls back to cumulative contributions when a holding has no snapshot yet', () => {
    // Given: a holding with one May contribution and no snapshots
    let s = addHolding(defaultStore(), { name: 'X', type: 'Stocks', currency: 'BRL' });
    const id = s.investments.holdings[0].id;
    s = addContribution(s, {
      holdingId: id,
      monthKey: '2026-05',
      amount: 250,
      currency: 'BRL',
      date: '2026-05-10',
    });
    // When/Then: market value mirrors contributions in May
    const r = investmentSeries(s, 'BRL', ratesEurBase);
    expect(r.keys).toEqual(['2026-05']);
    expect(r.marketValue).toEqual([250]);
  });
});

describe('holdingSparkline', () => {
  it('returns the snapshot timeline ascending', () => {
    // Given: a holding with two snapshots
    let s = addHolding(defaultStore(), { name: 'X', type: 'Stocks', currency: 'BRL' });
    const id = s.investments.holdings[0].id;
    s = addSnapshot(s, {
      holdingId: id,
      monthKey: '2026-06',
      marketValue: 350,
      currency: 'BRL',
      takenAt: '2026-06-30',
    });
    s = addSnapshot(s, {
      holdingId: id,
      monthKey: '2026-05',
      marketValue: 110,
      currency: 'BRL',
      takenAt: '2026-05-31',
    });
    // When/Then: returned ascending by takenAt
    const points = holdingSparkline(s, id);
    expect(points.map((p) => p.takenAt)).toEqual(['2026-05-31', '2026-06-30']);
    expect(points.map((p) => p.marketValue)).toEqual([110, 350]);
  });
});
