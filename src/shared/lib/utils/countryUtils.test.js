import { describe, it, expect } from 'vitest';
import {
  CONTINENT_TOTALS,
  CONTINENT_COUNTRY_CODES,
  getCountryContinent,
  normalizeCountryCode,
  isUn195Country,
  TERRITORY_TO_SOVEREIGN_MAP,
  UN_195_COUNTRIES,
} from './countryUtils';

describe('countryUtils — UN sovereign consolidation', () => {
  it('maps territories to their sovereign (Malvinas → Argentina)', () => {
    expect(normalizeCountryCode('FK')).toBe('AR');
    expect(normalizeCountryCode('fk')).toBe('AR');
    expect(normalizeCountryCode('GL')).toBe('DK');
    expect(normalizeCountryCode('PR')).toBe('US');
    expect(normalizeCountryCode('HK')).toBe('CN');
    expect(normalizeCountryCode('SJ')).toBe('NO');
    expect(TERRITORY_TO_SOVEREIGN_MAP.FK).toBe('AR');
    expect(TERRITORY_TO_SOVEREIGN_MAP.AI).toBe('GB');
  });

  it('exposes exactly the immutable 195 UN sovereigns', () => {
    expect(UN_195_COUNTRIES).toHaveLength(195);
    expect(Object.isFrozen(UN_195_COUNTRIES)).toBe(true);
    expect(new Set(UN_195_COUNTRIES).size).toBe(195);
    expect(UN_195_COUNTRIES).toContain('VA');
    expect(UN_195_COUNTRIES).toContain('PS');
    expect(UN_195_COUNTRIES).not.toContain('AQ');
    expect(UN_195_COUNTRIES).not.toContain('GL');
    expect(isUn195Country('GL')).toBe(true); // territory → DK
    expect(isUn195Country('AQ')).toBe(false);
  });
});

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
