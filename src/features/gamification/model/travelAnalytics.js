/**
 * travelAnalytics — Pure, 100% in-memory Deep Travel Analytics engine (Block 2.3).
 *
 * ZERO Firestore access. Every metric is derived from the `bitacora` stubs and
 * the `bitacoraData` map already held in memory by `useViajes`, plus the
 * traveller `userProfile`. Safe to memoize and unit-test in isolation.
 */
import {
  computeRouteTelemetry,
  ordenarParadasCronologicamente,
  haversineKm,
  calculateTripDays,
  normalizeToIsoDate,
} from '@shared/lib/utils/viajeUtils';
import {
  normalizeCountryCode,
  getCountryContinent,
  CONTINENT_TOTALS,
} from '@shared/lib/utils/countryUtils';

export const EARTH_CIRCUMFERENCE_KM = 40075;
export const WORLD_TOTAL_COUNTRIES = 195;

const asObject = (value) => (value && typeof value === 'object' ? value : {});
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const isLeapYear = (year) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * Merges a `bitacora` stub with its enriched `bitacoraData[id]` record.
 * @param {object} trip
 * @param {object} tripData
 * @returns {object}
 */
export const mergeTrip = (trip, tripData) => ({
  ...asObject(trip),
  ...asObject(tripData?.[trip?.id]),
});

/**
 * Resolves the ordered stop list for a (merged) trip with graceful object-map
 * support and zero-throw guards.
 * @param {object} trip
 * @param {object} [tripData]
 * @returns {Array<object>}
 */
export const getTripStops = (trip, tripData) => {
  const detail = asObject(tripData?.[trip?.id]);
  const raw = detail.paradas ?? asObject(trip).paradas;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (raw && typeof raw === 'object') return Object.values(raw).filter(Boolean);
  return [];
};

/** @returns {string|null} ISO start date (YYYY-MM-DD). */
export const getTripStartDate = (trip) =>
  normalizeToIsoDate(asObject(trip).fechaInicio || trip?.startDate || trip?.date);

/** @returns {string|null} ISO end date (YYYY-MM-DD). */
export const getTripEndDate = (trip) =>
  normalizeToIsoDate(asObject(trip).fechaFin || trip?.endDate);

/** @returns {number|null} Start year or null. */
export const getTripYear = (trip) => {
  const iso = getTripStartDate(trip);
  return iso ? Number(iso.slice(0, 4)) : null;
};

/** @returns {number} Inclusive trip duration in days (0 when unknown). */
export const getTripDays = (trip) =>
  calculateTripDays(getTripStartDate(trip), getTripEndDate(trip)) || 0;

/** @returns {string} Best-effort trip title (never null). */
export const getTripTitle = (trip) => {
  const source = asObject(trip);
  return source.titulo || source.title || source.nombreEspanol || '';
};

/**
 * Resolves the ISO-2 country codes of a trip (stop-first, root fallback).
 * @param {object} trip - Merged trip record.
 * @returns {string[]}
 */
export const getTripCountryCodes = (trip) => {
  const source = asObject(trip);
  const stops = Array.isArray(source.paradas)
    ? source.paradas.filter(Boolean)
    : (source.paradas && typeof source.paradas === 'object'
      ? Object.values(source.paradas)
      : []);

  const codes = [];
  stops.forEach((stop) => {
    const raw =
      stop?.paisCodigo || stop?.countryCode || stop?.codigoPais ||
      stop?.code || stop?.pais || stop?.country;
    const iso = normalizeCountryCode(raw);
    if (iso) codes.push(iso);
  });

  const rootIso = normalizeCountryCode(source.paisCodigo || source.countryCode || source.code);
  if (rootIso) codes.push(rootIso);

  return codes;
};

/** @returns {number[]} Distinct trip start-years, descending. */
export const getAvailableYears = (trips = [], tripData = {}) => {
  const years = new Set();
  asArray(trips).forEach((trip) => {
    const year = getTripYear(mergeTrip(trip, tripData));
    if (year !== null && Number.isFinite(year)) years.add(year);
  });
  return [...years].sort((a, b) => b - a);
};

/**
 * Earth-circumference playful equivalence.
 * @param {number} totalKm
 * @returns {{ earthLaps: number, earthPercentage: number }}
 */
export const getEarthLaps = (totalKm) => {
  const km = Number.isFinite(totalKm) && totalKm > 0 ? totalKm : 0;
  return {
    earthLaps: +(km / EARTH_CIRCUMFERENCE_KM).toFixed(2),
    earthPercentage: Math.min(100, Math.round((km / EARTH_CIRCUMFERENCE_KM) * 100)),
  };
};

/**
 * Sum of internal route distances across all trips. Matches the Trip Viewer 1:1
 * by delegating to `computeRouteTelemetry(ordenarParadasCronologicamente(...))`.
 * @param {Array<object>} trips
 * @param {object} [tripData]
 * @returns {number} rounded total kilometres
 */
export const computeTotalKm = (trips = [], tripData = {}) =>
  asArray(trips).reduce((acc, trip) => {
    const merged = mergeTrip(trip, tripData);
    const orderedStops = ordenarParadasCronologicamente(getTripStops(merged, tripData));
    return acc + (computeRouteTelemetry(orderedStops).totalKm || 0);
  }, 0);

/**
 * Dimension 1 — Planetary footprint across the 5 classical continents.
 * @returns {{ continents: Array<{code:string,visitedCount:number,totalCountries:number,percentage:number,visitedCountryCodes:string[]}>, uniqueCountries: number }}
 */
export const computeContinentStats = (trips = [], tripData = {}) => {
  const byContinent = { EU: new Set(), AM: new Set(), AS: new Set(), AF: new Set(), OC: new Set() };
  const allCountries = new Set();

  asArray(trips).forEach((trip) => {
    const merged = mergeTrip(trip, tripData);
    const uniqueCodes = [...new Set(getTripCountryCodes(merged))];
    uniqueCodes.forEach((iso) => {
      allCountries.add(iso);
      const continent = getCountryContinent(iso);
      if (continent && byContinent[continent]) byContinent[continent].add(iso);
    });
  });

  const continents = Object.keys(CONTINENT_TOTALS)
    .map((code) => {
      const totalCountries = CONTINENT_TOTALS[code];
      const visitedCountryCodes = [...(byContinent[code] || [])].sort();
      const visitedCount = visitedCountryCodes.length;
      const percentage = totalCountries > 0
        ? Math.round((visitedCount / totalCountries) * 100)
        : 0;
      return { code, visitedCount, totalCountries, percentage, visitedCountryCodes };
    })
    .sort((a, b) => (b.visitedCount - a.visitedCount) || a.code.localeCompare(b.code));

  return { continents, uniqueCountries: allCountries.size };
};

/** Formats a latitude into navigational notation, e.g. `40.42° N`. */
export const formatLatitude = (lat) => `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'}`;

/** Formats a longitude into navigational notation, e.g. `3.70° O` (west label is localizable). */
export const formatLongitude = (lng, westLabel = 'O') =>
  `${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : westLabel}`;

/** Formats a full coordinate pair, e.g. `40.42° N, 3.70° O`. */
export const formatCardinalCoord = (lat, lng, westLabel = 'O') =>
  `${formatLatitude(lat)}, ${formatLongitude(lng, westLabel)}`;

const buildStopRecord = (stop, merged) => {
  const coords = stop?.coordenadas;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const countryRaw =
    stop?.paisCodigo || stop?.countryCode || stop?.codigoPais || stop?.code;
  return {
    cityName: String(stop?.nombre || stop?.ciudad || stop?.city || stop?.name || '').trim(),
    countryCode: normalizeCountryCode(countryRaw) || null,
    latitude: lat,
    longitude: lng,
    formattedCoord: formatCardinalCoord(lat, lng),
    tripId: merged.id ?? null,
    tripTitle: getTripTitle(merged),
  };
};

/**
 * Dimension 2a — 4 cardinal extreme points (north / south / east / west).
 * @returns {{ north: object|null, south: object|null, east: object|null, west: object|null }}
 */
export const computeCardinalPoles = (trips = [], tripData = {}) => {
  const poles = { north: null, south: null, east: null, west: null };

  asArray(trips).forEach((trip) => {
    const merged = mergeTrip(trip, tripData);
    getTripStops(merged, tripData).forEach((stop) => {
      const record = buildStopRecord(stop, merged);
      if (!record) return;
      if (!poles.north || record.latitude > poles.north.latitude) poles.north = record;
      if (!poles.south || record.latitude < poles.south.latitude) poles.south = record;
      if (!poles.east || record.longitude > poles.east.longitude) poles.east = record;
      if (!poles.west || record.longitude < poles.west.longitude) poles.west = record;
    });
  });

  return poles;
};

/**
 * Dimension 2b — Farthest visited point from the traveller's home base.
 * Uses `baseCity` coordinates (fallback `birthCity`). Null when not configured.
 * @returns {object|null}
 */
export const computeFarthestFromHome = (trips = [], tripData = {}, userProfile = null) => {
  const city = userProfile?.baseCity || userProfile?.birthCity || null;
  const homeCoords = city?.coordinates;
  if (!Array.isArray(homeCoords) || homeCoords.length < 2 || !homeCoords.every(Number.isFinite)) {
    return null;
  }

  let best = null;
  asArray(trips).forEach((trip) => {
    const merged = mergeTrip(trip, tripData);
    getTripStops(merged, tripData).forEach((stop) => {
      const coords = stop?.coordenadas;
      if (!Array.isArray(coords) || coords.length < 2) return;
      const [lng, lat] = coords;
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      const distanceKm = haversineKm(homeCoords, [lng, lat]);
      if (!Number.isFinite(distanceKm) || distanceKm <= 0) return;
      if (!best || distanceKm > best.distanceKm) {
        const countryRaw =
          stop?.paisCodigo || stop?.countryCode || stop?.codigoPais || stop?.code;
        best = {
          cityName: String(stop?.nombre || stop?.ciudad || stop?.city || stop?.name || '').trim(),
          countryCode: normalizeCountryCode(countryRaw) || null,
          distanceKm,
          homeCityName: city?.name || '',
          tripId: merged.id ?? null,
          tripTitle: getTripTitle(merged),
          latitude: lat,
          longitude: lng,
          formattedCoord: formatCardinalCoord(lat, lng),
        };
      }
    });
  });

  if (!best) return null;
  return { ...best, distanceKm: Math.round(best.distanceKm) };
};

/**
 * Dimension 3b — 12-month seasonality (start-month attribution).
 * @returns {{ months: Array<{month:number,days:number,trips:number}>, peakMonth:number|null, hasData:boolean }}
 */
export const computeSeasonality = (trips = [], tripData = {}) => {
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index, days: 0, trips: 0 }));

  asArray(trips).forEach((trip) => {
    const merged = mergeTrip(trip, tripData);
    const iso = getTripStartDate(merged);
    if (!iso) return;
    const month = Number(iso.slice(5, 7)) - 1;
    if (month < 0 || month > 11) return;
    months[month].days += getTripDays(merged);
    months[month].trips += 1;
  });

  let peakMonth = null;
  let peakDays = 0;
  months.forEach((month) => {
    if (month.days > peakDays) {
      peakDays = month.days;
      peakMonth = month.month;
    }
  });

  return { months, peakMonth, hasData: months.some((month) => month.trips > 0) };
};

/**
 * Duration bucket aligned with the TripsPage filter taxonomy.
 * @param {number} days
 * @returns {'short'|'medium'|'long'|null}
 */
export const classifyDays = (days) => {
  if (!Number.isFinite(days) || days <= 0) return null;
  if (days <= 4) return 'short';
  if (days <= 14) return 'medium';
  return 'long';
};

/**
 * Dimension 4 — Fidelity: top destinations, scope split and companions.
 * @returns {{ topCountries: Array<{code:string,count:number}>, topCities: Array<{name:string,count:number}>, topCompanions: Array<{name:string,count:number}>, localTripsCount: number, internationalTripsCount: number }}
 */
export const computeFidelityStats = (trips = [], tripData = {}, userProfile = null) => {
  const countryTripCounts = new Map();
  const cityCounts = new Map();
  const companionCounts = new Map();
  const homeSet = new Set(
    [normalizeCountryCode(userProfile?.birthCountry), normalizeCountryCode(userProfile?.residenceCountry)]
      .filter(Boolean)
  );
  let localTripsCount = 0;
  const safeTrips = asArray(trips);

  safeTrips.forEach((trip) => {
    const merged = mergeTrip(trip, tripData);
    const uniqueCodes = [...new Set(getTripCountryCodes(merged))];
    uniqueCodes.forEach((code) => {
      countryTripCounts.set(code, (countryTripCounts.get(code) || 0) + 1);
    });

    if (homeSet.size > 0 && uniqueCodes.length > 0 && uniqueCodes.every((code) => homeSet.has(code))) {
      localTripsCount += 1;
    }

    getTripStops(merged, tripData).forEach((stop) => {
      const name = String(stop?.nombre || stop?.ciudad || stop?.city || stop?.name || '').trim();
      if (!name) return;
      cityCounts.set(name, (cityCounts.get(name) || 0) + 1);
    });

    const companions = merged.acompanantes || merged.companeros || merged.companions;
    if (Array.isArray(companions)) {
      companions.forEach((companion) => {
        const name = typeof companion === 'string' ? companion.trim() : '';
        if (name) companionCounts.set(name, (companionCounts.get(name) || 0) + 1);
      });
    }
  });

  const toTop = (map, keyName) =>
    [...map.entries()]
      .map(([key, count]) => ({ [keyName]: key, count }))
      .sort((a, b) => (b.count - a.count) || String(a[keyName]).localeCompare(String(b[keyName])))
      .slice(0, 3);

  return {
    topCountries: toTop(countryTripCounts, 'code'),
    topCities: toTop(cityCounts, 'name'),
    topCompanions: toTop(companionCounts, 'name'),
    localTripsCount,
    internationalTripsCount: Math.max(0, safeTrips.length - localTripsCount),
  };
};

/**
 * Orchestrates every analytics dimension with an optional year filter.
 *
 * @param {object} params
 * @param {Array<object>} [params.trips]      - `bitacora` stubs
 * @param {object}        [params.tripData]   - `bitacoraData` map
 * @param {object|null}   [params.userProfile]
 * @param {'all'|string}  [params.selectedYear]
 * @returns {object} full analytics payload
 */
export const computeTravelAnalytics = ({
  trips = [],
  tripData = {},
  userProfile = null,
  selectedYear = 'all',
} = {}) => {
  const safeTrips = asArray(trips);
  const safeTripData = (tripData && typeof tripData === 'object' && !Array.isArray(tripData))
    ? tripData
    : {};

  const availableYears = getAvailableYears(safeTrips, safeTripData);
  const normalizedYear =
    selectedYear === 'all' || selectedYear === null || selectedYear === undefined
      ? 'all'
      : String(selectedYear);

  const filteredTrips = normalizedYear === 'all'
    ? safeTrips
    : safeTrips.filter((trip) => String(getTripYear(mergeTrip(trip, safeTripData))) === normalizedYear);

  const totalTrips = filteredTrips.length;

  // Dimension 2 — Geodesic odometer, poles & farthest point
  const totalKm = computeTotalKm(filteredTrips, safeTripData);
  const avgKmPerTrip = totalTrips > 0 ? Math.round(totalKm / totalTrips) : 0;
  const { earthLaps, earthPercentage } = getEarthLaps(totalKm);
  const poles = computeCardinalPoles(filteredTrips, safeTripData);
  const farthestFromHome = computeFarthestFromHome(filteredTrips, safeTripData, userProfile);

  // Dimension 1 — Continents & planetary footprint
  const { continents, uniqueCountries } = computeContinentStats(filteredTrips, safeTripData);
  const worldExploredPercentage = ((uniqueCountries / WORLD_TOTAL_COUNTRIES) * 100).toFixed(1);

  // Dimension 3 — Time, pace & seasonality
  const decorated = filteredTrips.map((trip) => {
    const merged = mergeTrip(trip, safeTripData);
    return {
      id: merged.id ?? null,
      title: getTripTitle(merged),
      days: getTripDays(merged),
      countryCodes: [...new Set(getTripCountryCodes(merged))],
    };
  });
  const totalDays = decorated.reduce((acc, entry) => acc + entry.days, 0);
  const averageDaysPerTrip = totalTrips > 0 ? +(totalDays / totalTrips).toFixed(1) : 0;
  const longestTrip = decorated.reduce(
    (best, entry) => (!best || entry.days > best.days ? entry : best),
    null
  );

  const pace = { short: 0, medium: 0, long: 0 };
  decorated.forEach((entry) => {
    const bucket = classifyDays(entry.days);
    if (bucket) pace[bucket] += 1;
  });

  const seasonality = computeSeasonality(filteredTrips, safeTripData);

  // Dimension 4 — Fidelity, destinations & scope
  const fidelity = computeFidelityStats(filteredTrips, safeTripData, userProfile);

  // Dimension 5 — Year highlight banner
  let yearBanner = null;
  if (normalizedYear !== 'all') {
    const yearNumber = Number(normalizedYear);
    const daysInYear = isLeapYear(yearNumber) ? 366 : 365;
    yearBanner = {
      year: yearNumber,
      totalDays,
      percentage: Math.min(100, Math.round((totalDays / daysInYear) * 100)),
    };
  }

  return {
    hasTrips: safeTrips.length > 0,
    availableYears,
    selectedYear: normalizedYear,
    totalTrips,
    totalKm,
    avgKmPerTrip,
    earthLaps,
    earthPercentage,
    continents,
    uniqueCountries,
    worldExploredPercentage,
    poles,
    farthestFromHome,
    totalDays,
    averageDaysPerTrip,
    longestTrip,
    pace,
    seasonality,
    topCountries: fidelity.topCountries,
    topCities: fidelity.topCities,
    topCompanions: fidelity.topCompanions,
    localTripsCount: fidelity.localTripsCount,
    internationalTripsCount: fidelity.internationalTripsCount,
    yearBanner,
  };
};

export default computeTravelAnalytics;





