import { describe, it, expect } from 'vitest';
import { getTripMapBounds, collectCountryCodes } from './mapBounds';

describe('getTripMapBounds', () => {
  it('returns null when there is no geographic data', () => {
    expect(getTripMapBounds({ paradas: [], countryCodes: [] })).toBeNull();
    expect(getTripMapBounds()).toBeNull();
  });

  it('frames a single stop coordinate', () => {
    const bounds = getTripMapBounds({ paradas: [{ coordenadas: [-3.7, 40.4] }] });
    expect(bounds).toEqual([[-3.7, 40.4], [-3.7, 40.4]]);
  });

  it('merges stop coordinates with the full country box (no cropping)', () => {
    const bounds = getTripMapBounds({
      paradas: [{ coordenadas: [-3.7, 40.4] }],
      countryCodes: ['ES'],
    });

    expect(bounds[0][0]).toBeLessThanOrEqual(-9.3);
    expect(bounds[0][1]).toBeLessThanOrEqual(36.0);
    expect(bounds[1][0]).toBeGreaterThanOrEqual(3.3);
    expect(bounds[1][1]).toBeGreaterThanOrEqual(43.8);
  });

  it('accepts ISO-3 country codes for the country boxes', () => {
    const bounds = getTripMapBounds({ countryCodes: ['ESP'] });
    expect(bounds).not.toBeNull();
    expect(bounds[0][0]).toBeLessThanOrEqual(-9.3);
  });

  it('ignores invalid coordinates and unknown countries', () => {
    expect(getTripMapBounds({ paradas: [{ coordenadas: ['x', null] }], countryCodes: ['SV'] })).toBeNull();
  });
});

describe('collectCountryCodes', () => {
  it('dedupes trip + stop codes normalized to ISO-2', () => {
    const codes = collectCountryCodes([{ paisCodigo: 'esp' }, { paisCodigo: 'FR' }], 'ES');
    expect(codes).toEqual(['ES', 'FR']);
  });

  it('accepts a raw country code string as the trip argument', () => {
    expect(collectCountryCodes([], 'AR')).toEqual(['AR']);
  });

  it('STOP-FIRST: ignores stale trip-level countries when stops exist', () => {
    const codes = collectCountryCodes({
      viaje: {
        paisCodigo: 'DE',
        paises: ['DE'],
        banderas: ['https://flagcdn.com/de.svg'],
      },
      paradas: [{ paisCodigo: 'HU' }, { countryCode: 'CZ' }],
    });

    expect(codes).toEqual(['HU', 'CZ']);
    expect(codes).not.toContain('DE');
  });
});
