import { getCountryBounds, normalizeCountryCode } from '@shared/lib/utils/countryUtils';

const isValidCoordinate = (coords) =>
  Array.isArray(coords) &&
  coords.length >= 2 &&
  Number.isFinite(coords[0]) &&
  Number.isFinite(coords[1]);

/**
 * Extracts an ISO-2 code from a flag URL (flagcdn) or a raw country code.
 */
const extractFlagCode = (value) => {
  if (typeof value !== 'string') return value;
  const match = value.match(/flagcdn\.com\/(?:w\d+\/)?([a-z]{2})\.(?:svg|png)/i);
  return match ? match[1].toUpperCase() : value;
};

const STOP_COUNTRY_FIELDS = ['paisCodigo', 'countryCode', 'codigoPais', 'pais', 'country'];

/**
 * Collects the unique ISO-2 country codes visited by a trip.
 *
 * STOP-FIRST RULE: when the trip has stops, their country fields are the ONLY
 * source of truth. Stale/default country metadata on the root trip document
 * (paisCodigo, paises, countries, banderas) is ignored so "intruder" countries
 * (e.g. DE on a HU-CZ trip) never pollute the viewer map.
 *
 * Accepts either `collectCountryCodes({ viaje, paradas })` or the legacy
 * positional form `collectCountryCodes(paradas, viaje)`.
 *
 * @param {Array<Object>|{ paradas?: Array<Object>, viaje?: Object }} paradasOrInput
 * @param {Object|string} [viajeInput]
 * @returns {string[]} unique ISO-2 codes
 */
export const collectCountryCodes = (paradasOrInput = [], viajeInput = {}) => {
  const isObjectInput =
    paradasOrInput &&
    !Array.isArray(paradasOrInput) &&
    typeof paradasOrInput === 'object' &&
    ('paradas' in paradasOrInput || 'viaje' in paradasOrInput);

  const paradas = isObjectInput
    ? (Array.isArray(paradasOrInput.paradas) ? paradasOrInput.paradas : [])
    : (Array.isArray(paradasOrInput) ? paradasOrInput : []);

  const viaje = isObjectInput
    ? (paradasOrInput.viaje || {})
    : (typeof viajeInput === 'string' ? { paisCodigo: viajeInput } : (viajeInput || {}));

  const codes = new Set();

  const push = (value) => {
    if (value == null || value === '') return;
    const iso2 = normalizeCountryCode(extractFlagCode(value));
    if (iso2) codes.add(iso2);
  };

  // STOP-FIRST: stops own the trip geography. Never mix root metadata here.
  if (paradas.length > 0) {
    paradas.forEach((parada) => {
      STOP_COUNTRY_FIELDS.forEach((field) => push(parada?.[field]));
    });
    return [...codes];
  }

  // Fallback: only when there are no stops yet (initial load / empty trip).
  push(viaje?.paisCodigo);
  push(viaje?.code);
  push(viaje?.countryCode);
  (Array.isArray(viaje?.paises) ? viaje.paises : []).forEach(push);
  (Array.isArray(viaje?.countries) ? viaje.countries : []).forEach(push);
  (Array.isArray(viaje?.banderas) ? viaje.banderas : []).forEach(push);

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
