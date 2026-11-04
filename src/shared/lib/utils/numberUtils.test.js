import { describe, it, expect } from 'vitest';
import { formatLocalizedNumber, formatKmValue } from './numberUtils';

describe('numberUtils — locale-aware formatting (Block 2.3)', () => {
  it('groups 4-digit numbers in Spanish (overrides minimumGroupingDigits)', () => {
    expect(formatLocalizedNumber(3304, 'es')).toBe('3.304');
    expect(formatLocalizedNumber(3304, 'es-ES')).toBe('3.304');
  });

  it('groups 4-digit numbers in English with commas', () => {
    expect(formatLocalizedNumber(3304, 'en')).toBe('3,304');
    expect(formatLocalizedNumber(3304, 'en-US')).toBe('3,304');
  });

  it('supports decimal precision', () => {
    expect(formatLocalizedNumber(1234.567, 'es', { decimals: 2 })).toBe('1.234,57');
    expect(formatLocalizedNumber(1234.567, 'en', { decimals: 2 })).toBe('1,234.57');
  });

  it('falls back to zero for non-numeric or missing values', () => {
    expect(formatLocalizedNumber(null, 'es')).toBe('0');
    expect(formatLocalizedNumber(undefined, 'es')).toBe('0');
    expect(formatLocalizedNumber(NaN, 'es')).toBe('0');
    expect(formatLocalizedNumber('not-a-number', 'es')).toBe('0');
  });

  it('formats kilometres with zero decimals', () => {
    expect(formatKmValue(3304, 'es')).toBe('3.304');
    expect(formatKmValue(40.9, 'es')).toBe('41');
  });
});
