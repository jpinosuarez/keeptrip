import { describe, it, expect } from 'vitest';
import {
  normalizeWishlistItem,
  wishlistKey,
  isInWishlist,
  findWishlistMatches,
  matchesWishlistQuery,
  groupWishlistByCountry,
  buildWishlistItemFromPlace,
} from './wishlistUtils';

describe('wishlistUtils / normalizeWishlistItem', () => {
  it('normalizes a country item and derives a stable id', () => {
    const item = normalizeWishlistItem({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'jp' });
    expect(item).toMatchObject({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP' });
    expect(item.id).toContain('wishlist-pais-JP');
    expect(typeof item.creadoEn).toBe('string');
  });

  it('coerces body/organic city types to "ciudad" and tolerates bad coordinates', () => {
    const item = normalizeWishlistItem({
      tipo: 'city',
      name: 'Kioto',
      countryCode: 'JP',
      coordinates: ['x', null],
    });
    expect(item.tipo).toBe('ciudad');
    expect(item.coordenadas).toBeNull();
  });

  it('returns null when unrecoverable (no name)', () => {
    expect(normalizeWishlistItem({ tipo: 'pais' })).toBeNull();
    expect(normalizeWishlistItem(null)).toBeNull();
  });
});

describe('wishlistUtils / wishlistKey + isInWishlist', () => {
  it('builds country and city keys that never collide', () => {
    expect(wishlistKey({ tipo: 'pais', paisCodigo: 'JP' })).toBe('country:JP');
    expect(wishlistKey({ tipo: 'ciudad', paisCodigo: 'JP', nombre: 'Kioto' })).toBe('city:JP:kioto');
  });

  it('detects duplicates by key', () => {
    const list = [normalizeWishlistItem({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP' })];
    expect(isInWishlist(list, { tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP' })).toBe(true);
    expect(isInWishlist(list, { tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP' })).toBe(false);
  });
});

describe('wishlistUtils / findWishlistMatches (auto-completion)', () => {
  const japan = normalizeWishlistItem({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP' });
  const kioto = normalizeWishlistItem({ tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP' });
  const lisbon = normalizeWishlistItem({ tipo: 'pais', nombre: 'Portugal', paisCodigo: 'PT' });
  const wishlist = [japan, kioto, lisbon];

  it('matches a country item when any stop is in that country', () => {
    const matched = findWishlistMatches(wishlist, [{ paisCodigo: 'JP', ciudad: 'Tokio' }]);
    expect(matched.map((i) => i.id)).toContain(japan.id);
  });

  it('matches a city item only on name + country', () => {
    const matched = findWishlistMatches(wishlist, [
      { paisCodigo: 'JP', ciudad: 'Kioto' },
      { paisCodigo: 'JP', ciudad: 'Tokio' },
    ]);
    const ids = matched.map((i) => i.id);
    expect(ids).toContain(kioto.id);
    expect(ids).toContain(japan.id);
  });

  it('never matches an unrelated country', () => {
    const matched = findWishlistMatches(wishlist, [{ paisCodigo: 'FR', ciudad: 'París' }]);
    expect(matched).toHaveLength(0);
  });

  it('returns [] defensively for empty inputs', () => {
    expect(findWishlistMatches([], [{ paisCodigo: 'JP' }])).toEqual([]);
    expect(findWishlistMatches(wishlist, [])).toEqual([]);
    expect(findWishlistMatches(undefined, undefined)).toEqual([]);
  });
});

describe('wishlistUtils / matchesWishlistQuery', () => {
  const item = normalizeWishlistItem({ tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP', paisNombre: 'Japón' });
  it('matches by name, country name or code (case-insensitive)', () => {
    expect(matchesWishlistQuery(item, 'kio')).toBe(true);
    expect(matchesWishlistQuery(item, 'jap')).toBe(true);
    expect(matchesWishlistQuery(item, 'jp')).toBe(true);
    expect(matchesWishlistQuery(item, '')).toBe(true);
    expect(matchesWishlistQuery(item, 'lisboa')).toBe(false);
  });
});

describe('wishlistUtils / groupWishlistByCountry', () => {
  it('groups items by ISO-2 code and collects cities', () => {
    const items = [
      normalizeWishlistItem({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP' }),
      normalizeWishlistItem({ tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP' }),
      normalizeWishlistItem({ tipo: 'pais', nombre: 'Portugal', paisCodigo: 'PT' }),
    ];
    const groups = groupWishlistByCountry(items);
    expect(groups).toHaveLength(2);
    const jp = groups.find((g) => g.paisCodigo === 'JP');
    expect(jp.ciudades).toHaveLength(1);
    expect(jp.items).toHaveLength(2);
  });
});

describe('wishlistUtils / buildWishlistItemFromPlace', () => {
  it('marks country results vs city results correctly', () => {
    const country = buildWishlistItemFromPlace({
      name: 'Japón',
      type: 'country',
      countryCode: 'JP',
      coordinates: [138, 36],
    });
    expect(country).toMatchObject({ tipo: 'pais', paisCodigo: 'JP', nombre: 'Japón' });
    expect(country.coordenadas).toEqual([138, 36]);

    const city = buildWishlistItemFromPlace({
      name: 'Lisboa',
      type: 'place',
      countryCode: 'PT',
      countryName: 'Portugal',
      coordinates: [-9.13, 38.72],
    });
    expect(city.tipo).toBe('ciudad');
    expect(city.paisNombre).toBe('Portugal');
  });

  it('returns null for empty input', () => {
    expect(buildWishlistItemFromPlace(null)).toBeNull();
  });
});
