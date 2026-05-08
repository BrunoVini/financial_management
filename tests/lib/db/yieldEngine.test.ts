import { describe, expect, it } from 'vitest';
import { accruedMarketValue, annualizedYield, daysBetween } from '@/lib/db/yieldEngine';
import type { Contribution, Holding } from '@/lib/types';

function holding(overrides: Partial<Holding> = {}): Holding {
  return {
    id: 'h1',
    name: 'Tesouro Pré',
    type: 'Renda Fixa',
    currency: 'BRL',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function contrib(date: string, amount: number): Contribution {
  return { id: 'c' + date, holdingId: 'h1', monthKey: date.slice(0, 7), amount, currency: 'BRL', date };
}

describe('daysBetween', () => {
  it('counts days inclusive of UTC offset effects', () => {
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetween('2026-02-01', '2026-01-01')).toBe(-31);
  });
});

describe('annualizedYield', () => {
  it('returns yieldRate as-is for fixed type', () => {
    expect(annualizedYield(holding({ yieldType: 'fixed', yieldRate: 0.12 }), null)).toBe(0.12);
  });

  it('multiplies CDI by the percentage for cdi type', () => {
    // 100% of CDI = 1 × 0.12 = 0.12
    expect(annualizedYield(holding({ yieldType: 'cdi', yieldRate: 1 }), 0.12)).toBeCloseTo(0.12);
    // 110% of CDI when CDI is 10% a.a.
    expect(annualizedYield(holding({ yieldType: 'cdi', yieldRate: 1.1 }), 0.1)).toBeCloseTo(0.11);
  });

  it('returns 0 when CDI rate is missing for cdi type', () => {
    expect(annualizedYield(holding({ yieldType: 'cdi', yieldRate: 1 }), null)).toBe(0);
  });

  it('returns 0 when no yield is configured', () => {
    expect(annualizedYield(holding(), 0.12)).toBe(0);
  });
});

describe('accruedMarketValue', () => {
  it('compounds each contribution from its date to asOf at the holding annual rate', () => {
    // Given: 12% a.a. fixed, single 1000 contribution one full year ago
    const h = holding({ yieldType: 'fixed', yieldRate: 0.12 });
    const value = accruedMarketValue(h, [contrib('2025-01-01', 1000)], null, '2026-01-01');
    // Then: 1000 × 1.12 = 1120
    expect(value).toBeCloseTo(1120, 1);
  });

  it('sums independently-accrued contributions', () => {
    // Given: 10% a.a., one contribution one year old, one fresh today
    const h = holding({ yieldType: 'fixed', yieldRate: 0.1 });
    const value = accruedMarketValue(
      h,
      [contrib('2025-05-01', 1000), contrib('2026-05-01', 500)],
      null,
      '2026-05-01',
    );
    // Then: 1000×1.10 + 500×1 = 1600
    expect(value).toBeCloseTo(1600, 1);
  });

  it('returns sum of contributions when no yield configured', () => {
    const h = holding();
    const value = accruedMarketValue(h, [contrib('2025-01-01', 1000)], null, '2026-01-01');
    expect(value).toBe(1000);
  });

  it('uses CDI annualized rate for cdi type', () => {
    // Given: 100% CDI when CDI annualized = 12% a.a.
    const h = holding({ yieldType: 'cdi', yieldRate: 1 });
    const value = accruedMarketValue(h, [contrib('2025-01-01', 1000)], 0.12, '2026-01-01');
    expect(value).toBeCloseTo(1120, 1);
  });

  it('only accrues contributions belonging to this holding', () => {
    const h = holding({ yieldType: 'fixed', yieldRate: 0.1 });
    const value = accruedMarketValue(
      h,
      [
        contrib('2025-01-01', 1000),
        { id: 'other', holdingId: 'h2', monthKey: '2025-01', amount: 9999, currency: 'BRL', date: '2025-01-01' },
      ],
      null,
      '2026-01-01',
    );
    expect(value).toBeCloseTo(1100, 1);
  });
});
