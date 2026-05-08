import type { Contribution, Holding } from '../types';

/**
 * Days between two ISO dates (UTC, ignoring time component). Negative
 * when `from` is after `to` — callers should clamp to >= 0.
 */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(
    Number(fromIso.slice(0, 4)),
    Number(fromIso.slice(5, 7)) - 1,
    Number(fromIso.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(toIso.slice(0, 4)),
    Number(toIso.slice(5, 7)) - 1,
    Number(toIso.slice(8, 10)),
  );
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Annualize a holding's yield given the current annualized CDI rate.
 * - `fixed`: yieldRate is the annual decimal (0.12 = 12% a.a.).
 * - `cdi`: yieldRate is the % of CDI as decimal multiplier (1 = 100%).
 *   Annualized rate = pctOfCdi × annualCdi.
 *
 * Returns 0 when the holding has no yield config or required inputs.
 */
export function annualizedYield(holding: Holding, annualCdi: number | null): number {
  if (holding.yieldType === 'fixed' && typeof holding.yieldRate === 'number') {
    return holding.yieldRate;
  }
  if (
    holding.yieldType === 'cdi' &&
    typeof holding.yieldRate === 'number' &&
    typeof annualCdi === 'number'
  ) {
    return holding.yieldRate * annualCdi;
  }
  return 0;
}

/**
 * Accrued market value for a yield-bearing holding: each contribution
 * compounds independently from its date to `asOf`. Returns the original
 * contributed sum when the holding has no yield config (caller can fall
 * back to manual snapshot semantics).
 */
export function accruedMarketValue(
  holding: Holding,
  contributions: Contribution[],
  annualCdi: number | null,
  asOfIso: string = new Date().toISOString().slice(0, 10),
): number {
  const annual = annualizedYield(holding, annualCdi);
  let sum = 0;
  for (const c of contributions) {
    if (c.holdingId !== holding.id) continue;
    if (annual <= 0) {
      sum += c.amount;
      continue;
    }
    const days = Math.max(0, daysBetween(c.date, asOfIso));
    const grown = c.amount * Math.pow(1 + annual, days / 365);
    sum += grown;
  }
  return Math.round(sum * 100) / 100;
}

export function hasYield(holding: Holding): boolean {
  return holding.yieldType !== undefined && typeof holding.yieldRate === 'number';
}
