import { describe, expect, it } from 'vitest';
import { convert, formatMoney } from '@/lib/money';

const ratesEurBase = { EUR: 1, BRL: 5.5, USD: 1.1, CAD: 1.5 };

describe('convert', () => {
  it('returns the same amount when from and to are identical', () => {
    // Given: a BRL amount and a rates table
    // When: converting BRL -> BRL
    const result = convert(100, 'BRL', 'BRL', ratesEurBase);
    // Then: the amount is returned unchanged (no rounding artifacts)
    expect(result).toBe(100);
  });

  it('converts USD to BRL through the EUR base', () => {
    // Given: rates table with EUR as base (BRL=5.5, USD=1.1)
    // When: converting 100 USD to BRL
    const result = convert(100, 'USD', 'BRL', ratesEurBase);
    // Then: result is (100 / USD_rate) * BRL_rate
    expect(result).toBeCloseTo((100 / 1.1) * 5.5, 4);
  });

  it('converts BRL to USD', () => {
    // Given: rates table with EUR as base
    // When: converting 550 BRL to USD
    const result = convert(550, 'BRL', 'USD', ratesEurBase);
    // Then: result is (550 / BRL_rate) * USD_rate
    expect(result).toBeCloseTo((550 / 5.5) * 1.1, 4);
  });

  it('returns NaN when a rate is missing', () => {
    // Given: rates table without an XYZ entry
    // When: converting from an unknown currency
    const result = convert(1, 'XYZ', 'BRL', ratesEurBase);
    // Then: NaN is returned (caller decides how to surface the error)
    expect(result).toBeNaN();
  });
});

describe('formatMoney', () => {
  it('formats BRL in pt-BR with R$ prefix', () => {
    // Given: a BRL amount and pt-BR locale
    // When: formatting
    const formatted = formatMoney(1234.5, 'BRL', 'pt-BR');
    // Then: the output includes the R$ symbol used in pt-BR
    expect(formatted).toContain('R$');
  });

  it('formats USD in en with $ prefix', () => {
    // Given: a USD amount and en locale
    // When: formatting
    const formatted = formatMoney(1234.5, 'USD', 'en');
    // Then: the output includes the $ symbol used in en-US
    expect(formatted).toContain('$');
  });
});
