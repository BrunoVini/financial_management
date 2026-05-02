import type { Currency, Store } from '../types';
import { monthKey, nextMonthKey } from '../db/months';
import { accountBalance } from '../db/accounts';
import { holdingReturn } from '../db/investments';
import { convert } from '../money';

const HISTORY_LENGTH = 12;

function previousMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  return monthKey(prev);
}

/**
 * Build the last `HISTORY_LENGTH` months of net-worth in `displayCurrency`.
 * For each month: sum of every account balance (already folds transactions)
 * plus the latest holding snapshot ≤ that month, all converted via the live
 * rates cache. Months that don't exist yet anchor at the prior known total
 * so the line doesn't drop to zero in gaps.
 */
export function netWorthHistory(
  store: Store,
  displayCurrency: Currency,
  today: Date,
): { keys: string[]; values: number[] } {
  const keys: string[] = [];
  let cursor = monthKey(today);
  for (let i = 0; i < HISTORY_LENGTH; i += 1) {
    keys.unshift(cursor);
    cursor = previousMonthKey(cursor);
  }
  const rates = store.ratesCache?.rates ?? {};
  const values: number[] = [];
  let lastKnown = 0;

  for (const key of keys) {
    let sum = 0;
    let counted = false;
    for (const acc of store.accounts) {
      const bal = accountBalance(store, acc.id, key);
      const v = convert(bal, acc.currency, displayCurrency, rates);
      if (Number.isFinite(v)) {
        sum += v;
        counted = true;
      }
    }
    for (const h of store.investments.holdings) {
      const r = holdingReturn(store, h.id);
      const v = convert(r.marketValue, h.currency, displayCurrency, rates);
      if (Number.isFinite(v)) {
        sum += v;
        counted = true;
      }
    }
    if (!counted) {
      values.push(lastKnown);
    } else {
      values.push(sum);
      lastKnown = sum;
    }
  }
  return { keys, values };
}

export { HISTORY_LENGTH, nextMonthKey };
