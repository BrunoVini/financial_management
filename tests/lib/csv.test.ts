import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/csv';

describe('toCsv', () => {
  it('joins headers and rows with commas and CRLF lines', () => {
    // Given/When: simple values
    const out = toCsv(['date', 'amount'], [
      ['2026-05-10', 100],
      ['2026-05-11', 50],
    ]);
    // Then: header line + two data lines, CRLF separated
    expect(out).toBe('date,amount\r\n2026-05-10,100\r\n2026-05-11,50');
  });

  it('quotes cells containing commas, quotes or newlines', () => {
    // Given: values with special characters
    const out = toCsv(['note'], [['a, b'], ['"q"'], ['line1\nline2']]);
    // Then: each is wrapped, and embedded quotes are doubled
    expect(out).toContain('"a, b"');
    expect(out).toContain('"""q"""');
    expect(out).toContain('"line1\nline2"');
  });

  it('handles empty input gracefully', () => {
    // Given/When/Then: no rows still emits the header line
    expect(toCsv(['a', 'b'], [])).toBe('a,b');
  });
});
