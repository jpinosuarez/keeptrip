import { describe, it, expect } from 'vitest';
import {
  CONTINENT_TOTALS,
  CONTINENT_COUNTRY_CODES,
  getCountryContinent,
} from './countryUtils';

describe('countryUtils — classical 5-continent taxonomy (Block 2.3)', () => {
  it('sums to 195 sovereign countries', () => {
    const total = Object.values(CONTINENT_TOTALS).reduce((acc, count) => acc + count, 0);
    expect(total).toBe(195);
    expect(CONTINENT_TOTALS).toEqual({ EU: 44, AM: 35, AS: 48, AF: 54, OC: 14 });
  });

  it('maps each continent bucket to its declared total', () => {
    Object.entries(CONTINENT_TOTALS).forEach(([continent, total]) => {
      expect(CONTINENT_COUNTRY_CODES[continent]).toHaveLength(total);
    });
  });

  it('maps representative ISO-2 codes across all 5 continents', () => {
    expect(getCountryContinent('ES')).toBe('EU');
    expect(getCountryContinent('DE')).toBe('EU');
    expect(getCountryContinent('AR')).toBe('AM');
    expect(getCountryContinent('US')).toBe('AM');
    expect(getCountryContinent('JP')).toBe('AS');
    expect(getCountryContinent('IN')).toBe('AS');
    expect(getCountryContinent('ZA')).toBe('AF');
    expect(getCountryContinent('EG')).toBe('AF');
    expect(getCountryContinent('AU')).toBe('OC');
    expect(getCountryContinent('NZ')).toBe('OC');
  });

  it('accepts ISO-3 codes and is case-insensitive', () => {
    expect(getCountryContinent('arg')).toBe('AM');
    expect(getCountryContinent('DEU')).toBe('EU');
    expect(getCountryContinent('jpn')).toBe('AS');
  });

  it('returns null for unknown or empty input', () => {
    expect(getCountryContinent('XX')).toBeNull();
    expect(getCountryContinent('')).toBeNull();
    expect(getCountryContinent(null)).toBeNull();
    expect(getCountryContinent(undefined)).toBeNull();
  });
});
