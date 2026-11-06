/**
 * wishlistUtils — Pure, domain-agnostic helpers for the Keeptrip Wishlist
 * (Block 2.5: Lightweight Wishlist for Countries and Cities).
 *
 * The wishlist is stored as an array of `WishlistItem` objects on the user
 * profile document (`usuarios/{uid}.wishlist`). These helpers are free of React
 * and Firebase so they can be unit-tested in isolation and reused by the
 * AuthContext, the search palette, the trips page and the map.
 *
 * WishlistItem contract:
 *   { id, tipo: 'pais'|'ciudad', nombre, paisCodigo (ISO-2), paisNombre,
 *     coordenadas: [lng, lat] | null, creadoEn: ISOString }
 */

import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';

const normalizeName = (value) => String(value ?? '').trim().toLowerCase();

const slugify = (value) =>
  normalizeName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toCoordinatePair = (value) => {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const lng = Number(value[0]);
  const lat = Number(value[1]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
};

/**
 * Normalizes a raw wishlist record (persisted or freshly built) into the
 * canonical shape. Tolerates legacy/malformed payloads and never throws.
 * @returns {object|null} normalized item, or null when unrecoverable.
 */
export const normalizeWishlistItem = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const nombre = String(raw.nombre ?? raw.name ?? '').trim();
  if (!nombre) return null;

  const tipo = raw.tipo === 'ciudad' || raw.tipo === 'city' ? 'ciudad' : 'pais';
  const paisCodigo =
    normalizeCountryCode(raw.paisCodigo ?? raw.code ?? raw.countryCode ?? '') || '';
  const coordenadas = toCoordinatePair(raw.coordenadas) || toCoordinatePair(raw.coordinates);

  const id =
    raw.id ||
    `wishlist-${tipo}-${paisCodigo || 'xx'}-${slugify(nombre) || Date.now()}`;

  return {
    id: String(id),
    tipo,
    nombre,
    paisCodigo,
    paisNombre: String(raw.paisNombre ?? raw.countryName ?? ''),
    coordenadas,
    creadoEn: raw.creadoEn || new Date().toISOString(),
  };
};

/** Stable identity string for de-duplication (country vs. city aware). */
export const wishlistKey = (item) => {
  if (!item) return '';
  const rawCode = item.paisCodigo ?? item.code ?? item.countryCode ?? '';
  const code = normalizeCountryCode(rawCode) || String(rawCode || '').toUpperCase();
  const isCity = item.tipo === 'ciudad' || item.tipo === 'city';
  if (isCity) return `city:${code}:${slugify(item.nombre ?? item.name)}`;
  return `country:${code}`;
};

/** True when a target item (country or city) already exists in the wishlist. */
export const isInWishlist = (wishlist = [], target) => {
  if (!Array.isArray(wishlist) || !target) return false;
  const targetKey = wishlistKey(target);
  if (!targetKey) return false;
  return wishlist.some((item) => wishlistKey(item) === targetKey);
};


/**
 * Matches wishlist items against saved trip stops to auto-complete fulfilled
 * dreams. A country item matches any stop in that country; a city item matches
 * a stop with the same normalized city name AND country code.
 */
export const findWishlistMatches = (wishlist = [], stops = []) => {
  if (!Array.isArray(wishlist) || wishlist.length === 0) return [];
  if (!Array.isArray(stops) || stops.length === 0) return [];

  const matchedIds = new Set();

  stops.forEach((stop) => {
    if (!stop) return;
    const rawCode = stop.paisCodigo ?? stop.countryCode ?? stop.code ?? '';
    const stopCode = normalizeCountryCode(rawCode) || '';
    const stopName = normalizeName(stop.ciudad ?? stop.nombre ?? stop.name);

    wishlist.forEach((item) => {
      const itemCode = normalizeCountryCode(item.paisCodigo ?? '') || '';
      if (item.tipo === 'ciudad') {
        if (stopName && itemCode && itemCode === stopCode && normalizeName(item.nombre) === stopName) {
          matchedIds.add(item.id);
        }
      } else if (itemCode && itemCode === stopCode) {
        matchedIds.add(item.id);
      }
    });
  });

  return wishlist.filter((item) => matchedIds.has(item.id));
};

/** Case-insensitive filter for the wishlist search input. */
export const matchesWishlistQuery = (item, query) => {
  const q = normalizeName(query);
  if (!q) return true;
  if (!item) return false;
  return (
    normalizeName(item.nombre).includes(q) ||
    normalizeName(item.paisNombre).includes(q) ||
    normalizeName(item.paisCodigo).includes(q)
  );
};

/** Groups wishlist items by country for the editorial Bento grid. */
export const groupWishlistByCountry = (items = []) => {
  if (!Array.isArray(items)) return [];
  const map = new Map();

  items.forEach((item) => {
    if (!item) return;
    const code = (normalizeCountryCode(item.paisCodigo) || item.paisCodigo || 'XX').toUpperCase();
    if (!map.has(code)) {
      map.set(code, { paisCodigo: code, paisNombre: '', ciudades: [], items: [] });
    }
    const group = map.get(code);
    group.items.push(item);
    if (item.tipo === 'ciudad') group.ciudades.push(item);
    if (!group.paisNombre && item.paisNombre) group.paisNombre = item.paisNombre;
  });

  return Array.from(map.values());
};

/**
 * Builds a normalized WishlistItem from a search result / place payload.
 * Accepts the SearchPalette Mapbox shape.
 */
export const buildWishlistItemFromPlace = (place) => {
  if (!place) return null;
  const isCity = Boolean(place.type) && place.type !== 'country';
  return normalizeWishlistItem({
    tipo: isCity ? 'ciudad' : 'pais',
    nombre: place.name ?? place.nombre ?? '',
    paisCodigo: place.countryCode ?? place.code ?? place.paisCodigo ?? '',
    paisNombre: place.countryName ?? place.paisNombre ?? '',
    coordenadas: place.coordinates ?? place.coordenadas ?? null,
  });
};
