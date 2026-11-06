/**
 * geoIdentity — Shared primitives for the user's Geographic Identity
 * (birth country/city + residence country/base city).
 *
 * Single source of truth for:
 *   1. Identity pin DOM elements (imperative Mapbox markers in map views).
 *   2. Resolution of "origin vs residence" pin placement (unified when identical).
 *   3. Derivation of the `residenceMode` form flag used by onboarding/profile/settings.
 *   4. Normalization of persisted city records (`normalizeCity`).
 *
 * Brand contract:
 *   Origin (birth)                 → Charcoal Blue  #2C3E50
 *   Residence / base               → Muted Teal     #45B0A8
 *   Unified (origin === residence) → Muted Teal core + Charcoal Blue ring
 */

import { getCountryCentroid } from '@shared/lib/utils/countryUtils';

export const IDENTITY_PIN_COLORS = Object.freeze({
  origin: '#2C3E50',
  residence: '#45B0A8',
  unified: '#45B0A8',
});

/** Distance (in degrees) under which two city coordinates are treated as the same place. */
const SAME_CITY_DELTA = 0.05;

/** Neutral fallback when neither the record nor the country has known coordinates. */
const FALLBACK_COORDINATES = [0, 20];

const isValidCoordinatePair = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  Number.isFinite(Number(coords[0])) &&
  Number.isFinite(Number(coords[1]));

/**
 * Normalizes a persisted city record into `{ name, coordinates, countryCode }`.
 *
 * Backwards-compatibility guard: legacy profiles may store `birthCity` / `baseCity`
 * as a plain string. Those are resolved to an object anchored on the country centroid
 * instead of crashing the form or the map pin layer.
 *
 * @param {string|{ name?: string, coordinates?: number[], countryCode?: string }|null} city
 * @param {string|null} countryCode - Fallback ISO-2 country for the record.
 * @returns {{ name: string, coordinates: number[], countryCode: string }|null}
 */
export const normalizeCity = (city, countryCode = null) => {
  if (!city) return null;

  if (typeof city === 'string') {
    const name = city.trim();
    if (!name) return null;
    const country = String(countryCode || 'ES').toUpperCase();
    const coords = getCountryCentroid(country);
    return {
      name,
      coordinates: coords ? [...coords] : [...FALLBACK_COORDINATES],
      countryCode: country,
    };
  }

  if (typeof city !== 'object') return null;

  const name = typeof city.name === 'string' ? city.name.trim() : '';
  if (!name) return null;

  const country = String(city.countryCode || countryCode || 'ES').toUpperCase();
  const coordinates = isValidCoordinatePair(city.coordinates)
    ? [Number(city.coordinates[0]), Number(city.coordinates[1])]
    : getCountryCentroid(country) || FALLBACK_COORDINATES;

  return {
    name,
    coordinates: [...coordinates],
    countryCode: country,
  };
};

const PIN_DOT_CLASSES = {
  unified: 'w-5 h-5 rounded-full bg-[#45B0A8] border-2 border-white shadow-lg ring-2 ring-[#2C3E50]',
  origin: 'w-4 h-4 rounded-full bg-[#2C3E50] border-2 border-white shadow-md ring-1 ring-slate-400',
  residence: 'w-4 h-4 rounded-full bg-[#45B0A8] border-2 border-white shadow-md ring-1 ring-slate-400',
};

/**
 * Builds the DOM element rendered inside a `mapboxgl.Marker`.
 * Uses the same Tailwind utility classes as the React pins so the visual
 * language (44px-safe hit area, hover tooltip, brand colors) stays intact.
 *
 * @param {'unified'|'origin'|'residence'} kind
 * @param {string} label - Human readable label shown in the hover tooltip / a11y name.
 * @returns {HTMLDivElement}
 */
export const createPinElement = (kind = 'origin', label = '') => {
  const variant = PIN_DOT_CLASSES[kind] ? kind : 'origin';

  const wrapper = document.createElement('div');
  wrapper.className = 'relative group cursor-pointer flex items-center justify-center pointer-events-auto';
  if (label) {
    wrapper.title = label;
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', label);
  }

  const dot = document.createElement('div');
  dot.className = PIN_DOT_CLASSES[variant];
  wrapper.appendChild(dot);

  if (label) {
    const tooltip = document.createElement('div');
    tooltip.className =
      'absolute bottom-full mb-1 hidden group-hover:flex items-center px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] whitespace-nowrap pointer-events-none z-50 shadow-md';
    tooltip.textContent = label;
    wrapper.appendChild(tooltip);
  }

  return wrapper;
};

/**
 * Resolves which identity pins must be rendered.
 * When birth city and base city are the same place, a single "unified" pin is used
 * so the map never shows two dots stacked on top of each other.
 *
 * @param {{ birthCity?: object|null, baseCity?: object|null }} identity
 * @returns {{
 *   unified: { name: string, coordinates: number[] }|null,
 *   birth: { name: string, coordinates: number[] }|null,
 *   base: { name: string, coordinates: number[] }|null,
 * }}
 */
export const resolveIdentityPins = ({ birthCity = null, baseCity = null } = {}) => {
  // Normalize first: legacy string records must never break the imperative pin layer.
  const birth = normalizeCity(birthCity);
  const base = normalizeCity(baseCity);

  if (birth && base) {
    const delta = Math.hypot(
      birth.coordinates[0] - base.coordinates[0],
      birth.coordinates[1] - base.coordinates[1]
    );
    const sameName = birth.name.toLowerCase() === base.name.toLowerCase();

    if (delta < SAME_CITY_DELTA || sameName) {
      return {
        unified: { name: base.name || birth.name, coordinates: base.coordinates },
        birth: null,
        base: null,
      };
    }
  }

  return {
    unified: null,
    birth: birth ? { name: birth.name, coordinates: birth.coordinates } : null,
    base: base ? { name: base.name, coordinates: base.coordinates } : null,
  };
};

/**
 * Derives the residence mode selector value from a user profile.
 *
 * @param {{
 *   birthCountry?: string|null,
 *   residenceCountry?: string|null,
 *   birthCity?: object|null,
 *   baseCity?: object|null,
 * }} identity
 * @returns {'same_city'|'same_country'|'different_country'}
 */
/**
 * Builds a distinctive Muted Teal "teardrop" marker element for a Wishlist city
 * pin (Block 2.5). Mirrors `createPinElement` ergonomics (44px-safe wrapper,
 * hover tooltip, brand colors) but uses the teal accent + a bookmark glyph so
 * wishlist and visited pins never visually clash.
 *
 * @param {string} label - human readable destination name (tooltip / a11y name).
 * @returns {HTMLDivElement}
 */
export const createWishlistPinElement = (label = '') => {
  const wrapper = document.createElement('div');
  wrapper.className = 'relative group cursor-pointer flex items-center justify-center pointer-events-auto';
  if (label) {
    wrapper.title = label;
    wrapper.setAttribute('role', 'img');
    wrapper.setAttribute('aria-label', label);
  }

  const shape = document.createElement('div');
  shape.style.width = '18px';
  shape.style.height = '18px';
  shape.style.background = '#45B0A8';
  shape.style.border = '2px solid #fff';
  shape.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)';
  shape.style.borderRadius = '50% 50% 50% 0';
  shape.style.transform = 'rotate(-45deg)';
  wrapper.appendChild(shape);

  const glyph = document.createElement('span');
  glyph.textContent = '🔖';
  glyph.style.position = 'absolute';
  glyph.style.fontSize = '9px';
  glyph.style.lineHeight = '1';
  glyph.style.pointerEvents = 'none';
  wrapper.appendChild(glyph);

  if (label) {
    const tooltip = document.createElement('div');
    tooltip.className =
      'absolute bottom-full mb-2 hidden group-hover:flex items-center px-2 py-0.5 rounded bg-slate-900/90 text-white text-[10px] whitespace-nowrap pointer-events-none z-50 shadow-md';
    tooltip.textContent = label;
    wrapper.appendChild(tooltip);
  }

  return wrapper;
};

export const deriveResidenceMode = ({
  birthCountry = null,
  residenceCountry = null,
  birthCity = null,
  baseCity = null,
} = {}) => {
  if (residenceCountry && birthCountry && residenceCountry !== birthCountry) {
    return 'different_country';
  }

  // Normalize so legacy string records still resolve a sensible mode.
  const birth = normalizeCity(birthCity, birthCountry);
  const base = normalizeCity(baseCity, residenceCountry || birthCountry);

  if (base?.name && birth?.name && base.name !== birth.name) {
    return 'same_country';
  }
  return 'same_city';
};
