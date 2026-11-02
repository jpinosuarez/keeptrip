/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import {
  createPinElement,
  resolveIdentityPins,
  deriveResidenceMode,
  normalizeCity,
  IDENTITY_PIN_COLORS,
} from './geoIdentity';

describe('geoIdentity / normalizeCity', () => {
  it('preserves the full record when valid coordinates are present', () => {
    expect(
      normalizeCity({ name: 'Rosario', coordinates: [-60.6393, -32.9468], countryCode: 'AR' })
    ).toEqual({
      name: 'Rosario',
      coordinates: [-60.6393, -32.9468],
      countryCode: 'AR',
    });
  });

  it('falls back to the country centroid when coordinates are missing', () => {
    const city = normalizeCity({ name: 'Madrid' }, 'ES');

    expect(city.name).toBe('Madrid');
    expect(city.countryCode).toBe('ES');
    expect(city.coordinates).toEqual([-3.7492, 40.4637]); // Spain centroid
  });

  it('resolves legacy string records without crashing', () => {
    expect(normalizeCity('Berlín', 'DE')).toEqual({
      name: 'Berlín',
      coordinates: [10.4515, 51.1657], // Germany centroid
      countryCode: 'DE',
    });
  });

  it('returns null for empty, blank or non-city input', () => {
    expect(normalizeCity(null)).toBeNull();
    expect(normalizeCity('')).toBeNull();
    expect(normalizeCity('   ')).toBeNull();
    expect(normalizeCity(42)).toBeNull();
    expect(normalizeCity({ coordinates: [1, 2] })).toBeNull();
    expect(normalizeCity({ name: '   ' })).toBeNull();
  });

  it('uses a neutral fallback for unknown countries and ignores invalid coordinates', () => {
    const city = normalizeCity({ name: 'Nowhere', coordinates: ['x', null] }, 'ZZ');

    expect(city.countryCode).toBe('ZZ');
    expect(city.coordinates).toEqual([0, 20]);
  });

  it('never mutates the incoming record', () => {
    const input = { name: 'Lima', coordinates: [-77.03, -12.05], countryCode: 'PE' };
    const result = normalizeCity(input);

    result.coordinates[0] = 0;
    expect(input.coordinates).toEqual([-77.03, -12.05]);
  });
});

describe('geoIdentity / legacy payload tolerance', () => {
  it('resolveIdentityPins never throws on string city records', () => {
    const pins = resolveIdentityPins({ birthCity: 'Rosario', baseCity: 'Madrid' });

    // Legacy strings carry no coordinates, so both anchor on the default country
    // centroid and collapse into the unified pin instead of crashing the marker layer.
    expect(pins.unified).not.toBeNull();
    expect(pins.unified.coordinates.length).toBe(2);

    const split = resolveIdentityPins({
      birthCity: 'Rosario',
      baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168], countryCode: 'ES' },
    });

    expect(split.unified).toBeNull();
    expect(split.birth.name).toBe('Rosario');
    expect(split.base).toEqual({ name: 'Madrid', coordinates: [-3.7038, 40.4168] });
  });

  it('deriveResidenceMode still detects a city change on string records', () => {
    expect(
      deriveResidenceMode({
        birthCountry: 'AR',
        residenceCountry: 'AR',
        birthCity: 'Rosario',
        baseCity: 'Córdoba',
      })
    ).toBe('same_country');
  });
});

describe('geoIdentity / resolveIdentityPins', () => {
  it('returns a single unified pin when origin and residence share coordinates', () => {
    const pins = resolveIdentityPins({
      birthCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
      baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
    });

    expect(pins.unified).toEqual({ name: 'Madrid', coordinates: [-3.7038, 40.4168] });
    expect(pins.birth).toBeNull();
    expect(pins.base).toBeNull();
  });

  it('returns a unified pin when both names match despite tiny coordinate drift', () => {
    const pins = resolveIdentityPins({
      birthCity: { name: 'Rosario', coordinates: [-60.6393, -32.9468] },
      baseCity: { name: 'rosario', coordinates: [-60.65, -32.95] },
    });

    expect(pins.unified).not.toBeNull();
    expect(pins.birth).toBeNull();
  });

  it('splits into separate origin and residence pins for different cities', () => {
    const pins = resolveIdentityPins({
      birthCity: { name: 'Buenos Aires', coordinates: [-58.3816, -34.6037] },
      baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
    });

    expect(pins.unified).toBeNull();
    expect(pins.birth).toEqual({ name: 'Buenos Aires', coordinates: [-58.3816, -34.6037] });
    expect(pins.base).toEqual({ name: 'Madrid', coordinates: [-3.7038, 40.4168] });
  });

  it('tolerates partial identity data (only one city, or none at all)', () => {
    expect(resolveIdentityPins({ birthCity: { name: 'Lima', coordinates: [-77.03, -12.05] } })).toEqual({
      unified: null,
      birth: { name: 'Lima', coordinates: [-77.03, -12.05] },
      base: null,
    });

    expect(resolveIdentityPins({})).toEqual({ unified: null, birth: null, base: null });
    expect(resolveIdentityPins()).toEqual({ unified: null, birth: null, base: null });
  });
});

describe('geoIdentity / deriveResidenceMode', () => {
  it('detects a residence in another country', () => {
    expect(
      deriveResidenceMode({
        birthCountry: 'AR',
        residenceCountry: 'ES',
        birthCity: { name: 'Rosario' },
        baseCity: { name: 'Madrid' },
      })
    ).toBe('different_country');
  });

  it('detects a residence in another city of the same country', () => {
    expect(
      deriveResidenceMode({
        birthCountry: 'AR',
        residenceCountry: 'AR',
        birthCity: { name: 'Rosario' },
        baseCity: { name: 'Buenos Aires' },
      })
    ).toBe('same_country');
  });

  it('defaults to same_city for identical or empty identity data', () => {
    expect(
      deriveResidenceMode({
        birthCountry: 'ES',
        residenceCountry: 'ES',
        birthCity: { name: 'Madrid' },
        baseCity: { name: 'Madrid' },
      })
    ).toBe('same_city');

    expect(deriveResidenceMode()).toBe('same_city');
  });
});

describe('geoIdentity / createPinElement', () => {
  it('builds an accessible pin element with the brand palette classes', () => {
    const pin = createPinElement('origin', 'Ciudad natal: Rosario');

    expect(pin).toBeInstanceOf(HTMLDivElement);
    expect(pin.getAttribute('title')).toBe('Ciudad natal: Rosario');
    expect(pin.getAttribute('aria-label')).toBe('Ciudad natal: Rosario');
    expect(pin.className).toContain('pointer-events-auto');

    const dot = pin.firstElementChild;
    expect(dot.className).toContain('bg-[#2C3E50]'); // Origin → Charcoal Blue
    expect(pin.lastElementChild.textContent).toBe('Ciudad natal: Rosario');
  });

  it('uses the Muted Teal core for residence and unified variants', () => {
    expect(createPinElement('residence').firstElementChild.className).toContain('bg-[#45B0A8]');
    expect(createPinElement('unified').firstElementChild.className).toContain('bg-[#45B0A8]');
  });

  it('falls back to the origin variant for unknown kinds and exposes colors', () => {
    expect(createPinElement('unknown').firstElementChild.className).toContain('bg-[#2C3E50]');
    expect(IDENTITY_PIN_COLORS).toMatchObject({
      origin: '#2C3E50',
      residence: '#45B0A8',
      unified: '#45B0A8',
    });
  });

  it('omits the tooltip and a11y attributes when no label is provided', () => {
    const pin = createPinElement('residence');

    expect(pin.getAttribute('title')).toBeNull();
    expect(pin.childElementCount).toBe(1);
  });
});
