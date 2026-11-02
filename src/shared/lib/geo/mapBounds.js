import { getCountryBounds, normalizeCountryCode } from '@shared/lib/utils/countryUtils';

const isValidCoordinate = (coords) =>
  Array.isArray(coords) &&
  coords.length >= 2 &&
  Number.isFinite(coords[0]) &&
  Number.isFinite(coords[1]);

/**
 * Collects the unique ISO-2 country codes visited by a trip
 * (trip-level code + every stop's country).
 *
 * @param {Array<Object>} paradas
 * @param {Object|string} viaje - Trip data (or a raw country code)
 * @returns {string[]} unique ISO-2 codes
 */
export const collectCountryCodes = (paradas = [], viaje = {}) => {
  const codes = new Set();

  const push = (value) => {
    const iso2 = normalizeCountryCode(value);
    if (iso2) codes.add(iso2);
  };

  if (typeof viaje === 'string') {
    push(viaje);
  } else {
    push(viaje?.paisCodigo);
    push(viaje?.code);
    push(viaje?.countryCode);
  }

  (Array.isArray(paradas) ? paradas : []).forEach((parada) => push(parada?.paisCodigo));

  return [...codes];
};

/**
 * Combined bounding box that frames a trip without cropping its countries.
 * Unions every stop coordinate with the full bounding box of every visited
 * country.
 *
 * @param {{ paradas?: Array<Object>, countryCodes?: string[] }} input
 * @returns {[[number, number], [number, number]] | null} [[minLng, minLat], [maxLng, maxLat]]
 */
export const getTripMapBounds = ({ paradas = [], countryCodes = [] } = {}) => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const extend = (lng, lat) => {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  };

  (Array.isArray(paradas) ? paradas : []).forEach((parada) => {
    if (isValidCoordinate(parada?.coordenadas)) {
      extend(parada.coordenadas[0], parada.coordenadas[1]);
    }
  });

  (Array.isArray(countryCodes) ? countryCodes : []).forEach((code) => {
    const bounds = getCountryBounds(code);
    if (!bounds) return;
    extend(bounds[0], bounds[1]);
    extend(bounds[2], bounds[3]);
  });

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

export default getTripMapBounds;
