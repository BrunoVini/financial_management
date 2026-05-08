import type { Contribution, Currency, Holding, MonthKey, Snapshot, Store } from '../types';
import { newId } from '../uuid';
import { accruedMarketValue, hasYield } from './yieldEngine';
import { annualizeDaily } from '../bcbRates';

export type NewHolding = {
  name: string;
  type: string;
  currency: Currency;
  coinId?: string;
  coinAmount?: number;
};
export type NewContribution = {
  holdingId: string;
  monthKey: MonthKey;
  amount: number;
  currency: Currency;
  date: string;
};
export type NewSnapshot = {
  holdingId: string;
  monthKey: MonthKey;
  marketValue: number;
  currency: Currency;
  takenAt: string;
};

export function addHolding(store: Store, input: NewHolding): Store {
  const holding: Holding = { id: newId(), createdAt: new Date().toISOString(), ...input };
  return {
    ...store,
    investments: { ...store.investments, holdings: [...store.investments.holdings, holding] },
  };
}

export function removeHolding(store: Store, id: string): Store {
  return {
    ...store,
    investments: {
      holdings: store.investments.holdings.filter((h) => h.id !== id),
      contributions: store.investments.contributions.filter((c) => c.holdingId !== id),
      snapshots: store.investments.snapshots.filter((s) => s.holdingId !== id),
    },
  };
}

export function addContribution(store: Store, input: NewContribution): Store {
  const c: Contribution = { id: newId(), ...input };
  return {
    ...store,
    investments: {
      ...store.investments,
      contributions: [...store.investments.contributions, c],
    },
  };
}

export function addSnapshot(store: Store, input: NewSnapshot): Store {
  const s: Snapshot = { id: newId(), ...input };
  return {
    ...store,
    investments: { ...store.investments, snapshots: [...store.investments.snapshots, s] },
  };
}

export interface HoldingReturn {
  contributed: number;
  marketValue: number;
  deltaAbsolute: number;
  deltaPercent: number;
}

/**
 * Update the held quantity of a crypto holding. No-op when the holding
 * is missing or not a crypto position (no `coinId`).
 */
export function setHoldingCoinAmount(store: Store, holdingId: string, coinAmount: number): Store {
  const holding = store.investments.holdings.find((h) => h.id === holdingId);
  if (!holding || !holding.coinId) return store;
  return {
    ...store,
    investments: {
      ...store.investments,
      holdings: store.investments.holdings.map((h) =>
        h.id === holdingId ? { ...h, coinAmount } : h,
      ),
    },
  };
}

export function setHoldingShareAmount(store: Store, holdingId: string, shareAmount: number): Store {
  const holding = store.investments.holdings.find((h) => h.id === holdingId);
  if (!holding || !holding.ticker) return store;
  return {
    ...store,
    investments: {
      ...store.investments,
      holdings: store.investments.holdings.map((h) =>
        h.id === holdingId ? { ...h, shareAmount } : h,
      ),
    },
  };
}

export function holdingReturn(store: Store, holdingId: string): HoldingReturn {
  const holding = store.investments.holdings.find((h) => h.id === holdingId);
  const myContribs = store.investments.contributions.filter((c) => c.holdingId === holdingId);
  const contributed = myContribs.reduce((sum, c) => sum + c.amount, 0);
  const snapshots = store.investments.snapshots
    .filter((s) => s.holdingId === holdingId)
    .sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  let marketValue: number;
  if (snapshots.length) {
    marketValue = snapshots[snapshots.length - 1].marketValue;
  } else if (holding && hasYield(holding)) {
    const annualCdi = store.bcbCache ? annualizeDaily(store.bcbCache.cdiDaily) : null;
    marketValue = accruedMarketValue(holding, myContribs, annualCdi);
  } else {
    marketValue = contributed;
  }
  const deltaAbsolute = marketValue - contributed;
  const deltaPercent = contributed > 0 ? (deltaAbsolute / contributed) * 100 : 0;
  return { contributed, marketValue, deltaAbsolute, deltaPercent };
}
