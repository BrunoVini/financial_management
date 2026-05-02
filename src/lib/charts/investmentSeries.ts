import type { Currency, Store } from '../types';
import { convert } from '../money';

/**
 * Build the combined investments chart series:
 *  - keys: every monthKey in ascending order that has at least one
 *    contribution or snapshot anywhere in the store.
 *  - contributions: cumulative contributions in display currency at each
 *    point in `keys`.
 *  - marketValue: market value at each point — uses the latest snapshot
 *    on or before that month for every holding, falling back to its
 *    cumulative contributions when no snapshot exists yet.
 */
export function investmentSeries(
  store: Store,
  displayCurrency: Currency,
  ratesEurBase: Record<Currency, number>,
): { keys: string[]; contributions: number[]; marketValue: number[] } {
  const keySet = new Set<string>();
  for (const c of store.investments.contributions) keySet.add(c.monthKey);
  for (const s of store.investments.snapshots) keySet.add(s.monthKey);
  const keys = [...keySet].sort();
  if (keys.length === 0) return { keys: [], contributions: [], marketValue: [] };

  const contributions: number[] = [];
  const marketValue: number[] = [];

  for (const key of keys) {
    let cumContrib = 0;
    let mv = 0;

    for (const c of store.investments.contributions) {
      if (c.monthKey > key) continue;
      const v = convert(c.amount, c.currency, displayCurrency, ratesEurBase);
      if (Number.isFinite(v)) cumContrib += v;
    }

    for (const h of store.investments.holdings) {
      const snapshots = store.investments.snapshots
        .filter((s) => s.holdingId === h.id && s.monthKey <= key)
        .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
      let valueNative = 0;
      let currency: Currency = h.currency;
      if (snapshots.length > 0) {
        valueNative = snapshots[0].marketValue;
        currency = snapshots[0].currency;
      } else {
        // No snapshot yet — fall back to cumulative contributions for this
        // holding so the chart starts at "what was put in".
        for (const c of store.investments.contributions) {
          if (c.holdingId !== h.id) continue;
          if (c.monthKey > key) continue;
          if (c.currency !== currency) continue;
          valueNative += c.amount;
        }
      }
      const v = convert(valueNative, currency, displayCurrency, ratesEurBase);
      if (Number.isFinite(v)) mv += v;
    }

    contributions.push(cumContrib);
    marketValue.push(mv);
  }

  return { keys, contributions, marketValue };
}

export interface SparklinePoint {
  takenAt: string;
  marketValue: number;
}

export function holdingSparkline(store: Store, holdingId: string): SparklinePoint[] {
  return store.investments.snapshots
    .filter((s) => s.holdingId === holdingId)
    .map((s) => ({ takenAt: s.takenAt, marketValue: s.marketValue }))
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}
