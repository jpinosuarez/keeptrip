/**
 * placeFeature — shared parsing helpers for Mapbox geocoding features.
 *
 * Used by the search palette and the inline wishlist search so both surfaces
 * render consistent, unambiguous place labels (name + region + country) and
 * never show visually identical duplicate rows.
 *
 * A parsed place shape:
 *   { id, name, fullName, type, isCountry, coordinates, countryCode,
 *     countryName, regionName, subtitle }
 */

import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

const norm = (value) => String(value ?? '').trim().toLowerCase();

const findContext = (context, prefix) =>
  context.find((entry) => typeof entry?.id === 'string' && entry.id.startsWith(prefix));

/**
 * Parses a raw Mapbox Geocoding feature into the canonical place shape.
 * Extracts the region/state context so homonymous cities can be told apart.
 *
 * @param {object} feat - raw Mapbox feature
 * @param {{ language?: string, t?: Function }} [options]
 * @returns {object|null}
 */
export const parsePlaceFeature = (feat, { language = 'es', t } = {}) => {
  if (!feat || typeof feat !== 'object') return null;

  const context = Array.isArray(feat.context) ? feat.context : [];
  const isCountryType = Array.isArray(feat.place_type)
    ? feat.place_type.includes('country')
    : false;
  const countryContext = findContext(context, 'country') || (isCountryType ? feat : null);

  const countryCode = (
    countryContext?.short_code ||
    countryContext?.properties?.short_code ||
    feat.properties?.short_code ||
    feat.short_code
  )?.toUpperCase();

  // Prefer the administrative region (state/province); fall back to the
  // containing city for localities/neighbourhoods.
  const regionContext =
    findContext(context, 'region') ||
    findContext(context, 'district') ||
    findContext(context, 'place');
  const regionName = regionContext?.text || '';

  const placeType = Array.isArray(feat.place_type) ? feat.place_type[0] : 'place';
  const isCountry = placeType === 'country';

  const countryName =
    getLocalizedCountryName(countryCode, language, t) || countryContext?.text || '';

  const subtitle = [regionName, countryName].filter(Boolean).join(', ');

  return {
    id: feat.id,
    name: feat.text,
    fullName: feat.place_name,
    type: placeType,
    isCountry,
    coordinates: feat.center,
    countryCode,
    countryName,
    regionName,
    subtitle,
    _mapbox: true,
  };
};

/**
 * Removes visually identical duplicates (same normalized name + region + code).
 * @param {object[]} places - parsed places
 * @returns {object[]}
 */
export const dedupePlaces = (places = []) => {
  if (!Array.isArray(places)) return [];
  const seen = new Set();
  const output = [];
  places.forEach((place) => {
    if (!place) return;
    const key = `${norm(place.name)}|${norm(place.regionName)}|${place.countryCode || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    output.push(place);
  });
  return output;
};
