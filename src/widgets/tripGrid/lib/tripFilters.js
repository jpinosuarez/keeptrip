/**
 * tripFilters — Pure, in-memory filtering & grouping engine for the Trips archive.
 *
 * ZERO Firestore access: every function operates over the `bitacora` stubs and the
 * `bitacoraData` map already held in memory. Safe to memoize and unit-test in isolation.
 *
 * All helpers defensively guard against undefined stops/fields:
 *   (trip.paradas || trip.ciudades || [])
 */
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import {
  calculateTripDays,
  normalizeToIsoDate,
  FOTO_DEFAULT_URL,
} from '@shared/lib/utils/viajeUtils';

const STOP_COUNTRY_FIELDS = ['paisCodigo', 'countryCode', 'codigoPais', 'pais', 'country'];
const ROOT_COUNTRY_FIELDS = ['paisCodigo', 'code', 'countryCode'];

const asObject = (value) => (value && typeof value === 'object' ? value : {});

/**
 * Merges a bitacora stub with its enriched `bitacoraData[id]` record.
 * @param {object} trip
 * @param {object} tripData
 * @returns {object}
 */
export const mergeTrip = (trip, tripData) => {
  const extra = tripData?.[trip?.id];
  return { ...asObject(trip), ...asObject(extra) };
};

/**
 * Lowercases and strips diacritics/accents so search is language-tolerant.
 * @param {unknown} text
 * @returns {string}
 */
export const normalizeForSearch = (text) => {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Returns the ordered stops for a trip, gracefully falling back to the
 * comma-separated `ciudades` string. Guards against undefined values.
 * @param {object} trip - Merged trip record.
 * @returns {Array<object>}
 */
export const getTripParadas = (trip) => {
  const source = asObject(trip);
  const stops = source.paradas;
  if (Array.isArray(stops) && stops.filter(Boolean).length > 0) {
    return stops.filter(Boolean);
  }

  const cities = source.ciudades ?? trip?.ciudades;
  if (Array.isArray(cities)) {
    return cities
      .map((city) => (typeof city === 'string' ? { nombre: city } : city))
      .filter(Boolean);
  }
  if (typeof cities === 'string') {
    return cities
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean)
      .map((nombre) => ({ nombre }));
  }
  return [];
};

/**
 * Resolves the unique ISO-2 country codes for a trip (stop-first, fallback to root).
 * @param {object} trip - Merged trip record.
 * @returns {string[]}
 */
export const getTripCountries = (trip) => {
  const source = asObject(trip);
  const stops = getTripParadas(source);
  const stopCodes = [];

  for (const stop of stops) {
    for (const field of STOP_COUNTRY_FIELDS) {
      const iso = normalizeCountryCode(stop?.[field]);
      if (iso) {
        stopCodes.push(iso);
        break;
      }
    }
  }

  if (stopCodes.length > 0) {
    return [...new Set(stopCodes)];
  }

  const rootCodes = ROOT_COUNTRY_FIELDS
    .map((field) => normalizeCountryCode(source[field]))
    .filter(Boolean);

  return [...new Set(rootCodes)];
};

/**
 * Institutional scope taxonomy: 'local' when any trip country matches the
 * traveler's birth/residence country, otherwise 'international'.
 * @param {object} trip - Merged trip record.
 * @param {object|null} userProfile
 * @returns {'local'|'international'}
 */
export const classifyScope = (trip, userProfile) => {
  const tripCountries = getTripCountries(trip);
  const homeCountries = [userProfile?.birthCountry, userProfile?.residenceCountry]
    .map((code) => normalizeCountryCode(code))
    .filter(Boolean);

  if (homeCountries.some((code) => tripCountries.includes(code))) {
    return 'local';
  }
  return 'international';
};

/**
 * Duration buckets aligned with the product taxonomy.
 * Escapadas (<=4d) | Viaje Medio (5-14d) | Gran Expedición (15+d).
 * @param {number} days
 * @returns {'short'|'medium'|'long'|null}
 */
export const classifyDuration = (days) => {
  if (!Number.isFinite(days) || days <= 0) return null;
  if (days <= 4) return 'short';
  if (days <= 14) return 'medium';
  return 'long';
};

/** @returns {string|null} ISO start date (YYYY-MM-DD) or null. */
export const getTripStartDate = (trip) => {
  const source = asObject(trip);
  return normalizeToIsoDate(source.fechaInicio || source.startDate || source.date);
};

/** @returns {string|null} ISO end date (YYYY-MM-DD) or null. */
export const getTripEndDate = (trip) => {
  const source = asObject(trip);
  return normalizeToIsoDate(source.fechaFin || source.endDate);
};

/** @returns {number} Inclusive duration in days (0 when unknown). */
export const getTripDays = (trip) =>
  calculateTripDays(getTripStartDate(trip), getTripEndDate(trip)) || 0;

/** @returns {number|null} Start year (e.g. 2026) or null. */
export const getTripYear = (trip) => {
  const iso = getTripStartDate(trip);
  return iso ? Number(iso.slice(0, 4)) : null;
};

/** @returns {number} Number of stops. */
export const getTripStopCount = (trip) => getTripParadas(trip).length;

/** @returns {string|null} Valid cover URL (nullable for defaults). */
export const getTripCover = (trip) => {
  const source = asObject(trip);
  const cover = source.foto || source.portadaUrl;
  if (typeof cover !== 'string') return null;
  const trimmed = cover.trim();
  if (!trimmed || trimmed === FOTO_DEFAULT_URL) return null;
  return trimmed;
};

/** @returns {string} Concatenated narrative text/notes (may be empty). */
export const getTripNotes = (trip) => {
  const source = asObject(trip);
  return [source.texto, source.relato]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .trim();
};

export const hasTripCover = (trip) => Boolean(getTripCover(trip));
export const hasTripNotes = (trip) => Boolean(getTripNotes(trip));

/**
 * A trip is "complete / enriched" when it has BOTH a real cover and narrative notes.
 * Missing either marks it as "por enriquecer".
 * @returns {boolean}
 */
export const isTripComplete = (trip) => hasTripCover(trip) && hasTripNotes(trip);

/**
 * Whether the trip has enough memory content to justify the Atomic Tangerine Story Ring.
 * @returns {boolean}
 */
export const hasTripStory = (trip) => {
  if (hasTripCover(trip) || hasTripNotes(trip)) return true;
  return getTripParadas(trip).some(
    (stop) =>
      stop?.foto ||
      (typeof stop?.relato === 'string' && stop.relato.trim()) ||
      (typeof stop?.notaCorta === 'string' && stop.notaCorta.trim())
  );
};

/**
 * Best-effort display title (never empty).
 * @param {object} trip - Merged trip record.
 * @param {string} [i18nLang='es']
 * @returns {string}
 */
export const getTripTitle = (trip, i18nLang = 'es') => {
  const source = asObject(trip);
  const explicit = source.titulo || source.nombreEspanol || source.nameSpanish;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  const primaryCountry = getTripCountries(source)[0] || null;
  const localized = primaryCountry
    ? getLocalizedCountryName(primaryCountry, i18nLang)
    : '';
  return localized || '';
};

const buildSearchHaystack = (trip, i18nLang) => {
  const source = asObject(trip);
  const stops = getTripParadas(source).map(
    (stop) => stop?.nombre || stop?.name || stop?.city || ''
  );
  const countryWords = getTripCountries(source).flatMap((code) => [
    code,
    getLocalizedCountryName(code, i18nLang),
    getLocalizedCountryName(code, 'en'),
  ]);

  return normalizeForSearch(
    [
      source.titulo,
      source.nombreEspanol,
      source.nameSpanish,
      ...stops,
      typeof source.ciudades === 'string' ? source.ciudades : '',
      ...countryWords,
      source.texto,
      source.relato,
    ]
      .filter(Boolean)
      .join(' ')
  );
};

/**
 * Applies the 5-dimension filter matrix + sorting over an in-memory trip list.
 * Each active filter AND-combines; `'all'` (or empty) is a no-op.
 *
 * @param {object} params
 * @param {Array<object>} [params.trips=[]]
 * @param {object} [params.tripData={}]
 * @param {string} [params.searchQuery='']
 * @param {'all'|'thisYear'|number|string} [params.year='all']
 * @param {string} [params.country='all']
 * @param {'all'|'local'|'international'} [params.scope='all']
 * @param {'all'|'short'|'medium'|'long'} [params.duration='all']
 * @param {'all'|'complete'|'incomplete'} [params.curation='all']
 * @param {'recent'|'oldest'|'duration'|'stops'} [params.sort='recent']
 * @param {object|null} [params.userProfile=null]
 * @param {string} [params.i18nLang='es']
 * @returns {Array<object>} Filtered + sorted trip stubs.
 */
export const applyTripFilters = ({
  trips = [],
  tripData = {},
  searchQuery = '',
  year = 'all',
  country = 'all',
  scope = 'all',
  duration = 'all',
  curation = 'all',
  sort = 'recent',
  userProfile = null,
  i18nLang = 'es',
} = {}) => {
  const safeTrips = Array.isArray(trips) ? trips.filter(Boolean) : [];
  const query = normalizeForSearch(searchQuery);
  const normalizedCountry = normalizeCountryCode(country);
  const currentYear = new Date().getFullYear();

  const decorated = [];

  for (const trip of safeTrips) {
    const data = mergeTrip(trip, tripData);

    if (query && !buildSearchHaystack(data, i18nLang).includes(query)) {
      continue;
    }

    if (year !== 'all') {
      const tripYear = getTripYear(data);
      if (year === 'thisYear') {
        if (tripYear !== currentYear) continue;
      } else if (String(tripYear) !== String(year)) {
        continue;
      }
    }

    if (country !== 'all' && normalizedCountry) {
      if (!getTripCountries(data).includes(normalizedCountry)) continue;
    }

    if (scope !== 'all' && classifyScope(data, userProfile) !== scope) {
      continue;
    }

    if (duration !== 'all') {
      const bucket = classifyDuration(getTripDays(data));
      if (bucket !== duration) continue;
    }

    if (curation !== 'all') {
      const complete = isTripComplete(data);
      if (curation === 'complete' && !complete) continue;
      if (curation === 'incomplete' && complete) continue;
    }

    const startIso = getTripStartDate(data);
    decorated.push({
      trip,
      start: startIso ? new Date(`${startIso}T00:00:00`).getTime() : null,
      days: getTripDays(data),
      stops: getTripStopCount(data),
    });
  }

  const byStart = (a, b, direction) => {
    if (a.start === null && b.start === null) return 0;
    if (a.start === null) return 1;
    if (b.start === null) return -1;
    return direction * (a.start - b.start);
  };

  const sorters = {
    recent: (a, b) => byStart(a, b, -1),
    oldest: (a, b) => byStart(a, b, 1),
    duration: (a, b) => b.days - a.days,
    stops: (a, b) => b.stops - a.stops,
  };

  decorated.sort(sorters[sort] || sorters.recent);

  return decorated.map((entry) => entry.trip);
};

/**
 * Groups trips under chronological Year Headers with annual telemetry.
 * Years are ordered descending; undated trips fall into a `null` group at the end.
 *
 * @param {Array<object>} filteredTrips
 * @param {object} [tripData={}]
 * @param {'recent'|'oldest'|'duration'|'stops'} [sort='recent']
 * @returns {Array<{ year: number|null, trips: Array<object>, totalTrips: number, totalDays: number, uniqueCountries: string[] }>}
 */
export const groupTripsByYear = (filteredTrips = [], tripData = {}, sort = 'recent') => {
  const groups = new Map();

  for (const trip of Array.isArray(filteredTrips) ? filteredTrips.filter(Boolean) : []) {
    const data = mergeTrip(trip, tripData);
    const year = getTripYear(data);
    const key = year === null ? 'null' : String(year);

    if (!groups.has(key)) {
      groups.set(key, {
        year,
        trips: [],
        totalDays: 0,
        countrySet: new Set(),
      });
    }

    const group = groups.get(key);
    group.trips.push(trip);
    group.totalDays += getTripDays(data);
    for (const code of getTripCountries(data)) {
      group.countrySet.add(code);
    }
  }

  const yearDirection = sort === 'oldest' ? 1 : -1;

  return [...groups.values()]
    .sort((a, b) => {
      if (a.year === null && b.year === null) return 0;
      if (a.year === null) return 1;
      if (b.year === null) return -1;
      return yearDirection * (a.year - b.year);
    })
    .map((group) => ({
      year: group.year,
      trips: group.trips,
      totalTrips: group.trips.length,
      totalDays: group.totalDays,
      uniqueCountries: [...group.countrySet],
    }));
};

/**
 * Derives the dynamic Country filter options from the trips present in memory.
 * Zero empty options: only countries that at least one trip visited are returned.
 *
 * @param {Array<object>} trips
 * @param {object} [tripData={}]
 * @param {string} [i18nLang='es']
 * @returns {Array<{ code: string, name: string, count: number }>}
 */
export const buildCountryOptions = (trips = [], tripData = {}, i18nLang = 'es') => {
  const counts = new Map();

  for (const trip of Array.isArray(trips) ? trips.filter(Boolean) : []) {
    const data = mergeTrip(trip, tripData);
    for (const code of getTripCountries(data)) {
      counts.set(code, (counts.get(code) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      name: getLocalizedCountryName(code, i18nLang) || code,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};

/**
 * Extracts distinct visited start-years in descending order.
 * @param {Array<object>} trips
 * @param {object} [tripData={}]
 * @returns {number[]}
 */
export const buildYearOptions = (trips = [], tripData = {}) => {
  const years = new Set();

  for (const trip of Array.isArray(trips) ? trips.filter(Boolean) : []) {
    const year = getTripYear(mergeTrip(trip, tripData));
    if (year !== null) years.add(year);
  }

  return [...years].sort((a, b) => b - a);
};
