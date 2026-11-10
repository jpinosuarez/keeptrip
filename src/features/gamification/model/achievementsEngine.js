/**
 * Pure-function achievement evaluation engine.
 *
 * Takes user stats and returns the list of currently-unlocked achievements.
 * No side-effects — all persistence is handled by the useAchievements hook.
 *
 * New micro-milestone resolvers added (Guardrail #1):
 *   has_photo    — any trip has at least 1 photo
 *   has_detail   — any trip has ciudades / destinos populated
 *   has_dates    — any trip has fechaInicio or startDate set
 */

import { COUNTRIES_DB } from '../../../assets/sellos/index';
import { ACHIEVEMENTS } from './achievementDefinitions';
import { getCountryISO3, normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { getCountryEmblemSpec, getAllCatalogCountries } from './countryEmblemsCatalog';

/** Build a continents Set from an array of ISO-3 country codes. */
export const getContinents = (countryCodes) => {
  const continents = new Set();
  const lookup = new Map(COUNTRIES_DB.map((s) => [s.code, s.continente]));
  for (const code of countryCodes) {
    const c = lookup.get(code);
    if (c) continents.add(c);
  }
  return continents;
};

/**
 * Build aggregated stats from raw user data.
 * @param {string[]} countryCodes  — ISO-3 codes from paisesVisitados
 * @param {object[]} bitacora      — trips array
 * @param {object[]} todasLasParadas — all stops
 */
export const buildStats = (countryCodes, bitacora, todasLasParadas, userProfile = null) => {
  const continents = getContinents(countryCodes);

  // Count trips that have ≥ 3 paradas (detailed documentation)
  const paradaCountByTrip = new Map();
  for (const p of todasLasParadas) {
    if (!p.viajeId) continue;
    paradaCountByTrip.set(p.viajeId, (paradaCountByTrip.get(p.viajeId) || 0) + 1);
  }
  let detailedTrips = 0;
  for (const count of paradaCountByTrip.values()) {
    if (count >= 3) detailedTrips++;
  }

  // longest trip and total photos
  let longestDays = 0;
  let totalPhotos = 0;
  for (const t of bitacora) {
    if (t.startDate && t.endDate) {
      const a = new Date(t.startDate);
      const b = new Date(t.endDate);
      const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > longestDays) longestDays = diff;
    }
    if (Array.isArray(t.gallery)) totalPhotos += t.gallery.length;
    else if (Array.isArray(t.fotos)) totalPhotos += t.fotos.length;
    // Also count single foto field
    else if (t.foto) totalPhotos += 1;
  }

  // ── Micro-milestone derived booleans (Guardrail #1) ──
  const hasAnyPhoto = bitacora.some((t) => {
    return (
      (Array.isArray(t.gallery) && t.gallery.length > 0) ||
      (Array.isArray(t.fotos) && t.fotos.length > 0) ||
      Boolean(t.foto)
    );
  });

  const hasAnyDetail = bitacora.some((t) => {
    // "detail" = trip has at least one city/destination listed
    const hasCiudades = typeof t.ciudades === 'string' && t.ciudades.trim().length > 0;
    const hasDestinos = Array.isArray(t.destinos) && t.destinos.length > 0;
    const hasCities = Array.isArray(t.cities) && t.cities.length > 0;
    return hasCiudades || hasDestinos || hasCities;
  });

  const hasAnyDates = bitacora.some((t) => {
    return Boolean(t.fechaInicio || t.startDate);
  });

  // ── Domestic Travel / Roots & Base calculations ──
  const birthCountry = (userProfile?.birthCountry || '').toUpperCase();
  const residenceCountry = (userProfile?.residenceCountry || '').toUpperCase();
  const homeCodes = new Set([
    birthCountry,
    residenceCountry,
    getCountryISO3(birthCountry),
    getCountryISO3(residenceCountry),
  ].filter(Boolean));

  let localTripsCount = 0;
  let localStopsCount = 0;

  for (const t of bitacora) {
    const stopsForTrip = todasLasParadas.filter((p) => p.viajeId === t.id);
    const tripCountries = [];
    if (t.paisCodigo || t.countryCode || t.code) {
      tripCountries.push(String(t.paisCodigo || t.countryCode || t.code).toUpperCase());
    }
    for (const p of stopsForTrip) {
      const code = String(p.paisCodigo || p.countryCode || p.code || '').toUpperCase();
      if (code) {
        tripCountries.push(code);
        if (homeCodes.has(code)) {
          localStopsCount++;
        }
      }
    }
    if (homeCodes.size > 0 && tripCountries.length > 0 && tripCountries.every((c) => homeCodes.has(c))) {
      localTripsCount++;
    }
  }

  return {
    countries: countryCodes.length,
    trips: bitacora.length,
    continents: continents.size,
    detailedTrips,
    continentNames: continents,
    longestTrip: longestDays,
    totalPhotos,
    localTripsCount,
    localStopsCount,
    // Micro-milestone flags
    hasAnyPhoto,
    hasAnyDetail,
    hasAnyDates,
  };
};

/**
 * Evaluate which achievements are unlocked given user stats.
 * Returns only the unlocked achievements (with their definition).
 */
export const evaluateAchievements = (stats) => {
  const resolvers = {
    countries:      (t) => stats.countries >= t,
    trips:          (t) => stats.trips >= t,
    continents:     (t) => stats.continents >= t,
    detailed_trips: (t) => stats.detailedTrips >= t,
    local_explorer: () => (stats.localTripsCount >= 3 || stats.localStopsCount >= 10),
    // Micro-milestone resolvers (Guardrail #1)
    has_photo:  () => stats.hasAnyPhoto,
    has_detail: () => stats.hasAnyDetail,
    has_dates:  () => stats.hasAnyDates,
    // XP 2.0 catalog resolvers (Block 3.1)
    photos:     (t) => (stats.totalPhotos || 0) >= t,
    long_trip:  (t) => (stats.longestTrip || 0) >= t,
  };

  return ACHIEVEMENTS.filter((a) => {
    const resolver = resolvers[a.criteria.type];
    return resolver ? resolver(a.criteria.threshold) : false;
  });
};

/**
 * Compute progress (0..1) for each achievement.
 * Returns all achievements with a `progress` field added.
 *
 * For boolean micro-milestones (has_photo, has_detail, has_dates),
 * progress is 0 or 1 (no partial — you either have it or you don't).
 */
export const getAchievementsWithProgress = (stats) =>
  ACHIEVEMENTS.map((a) => {
    if (a.criteria.type === 'local_explorer') {
      const tripsProg = (stats.localTripsCount || 0) / 3;
      const stopsProg = (stats.localStopsCount || 0) / 10;
      const progress = Math.min(Math.max(tripsProg, stopsProg), 1);
      const unlocked = progress >= 1;
      return {
        ...a,
        progress,
        current: Math.max(stats.localTripsCount || 0, stats.localStopsCount || 0),
        unlocked,
      };
    }

    const valueMap = {
      countries:      stats.countries,
      trips:          stats.trips,
      continents:     stats.continents,
      detailed_trips: stats.detailedTrips,
      photos:         stats.totalPhotos,
      long_trip:      stats.longestTrip,
    };

    // Boolean types: progress is binary
    const booleanTypes = { has_photo: 'hasAnyPhoto', has_detail: 'hasAnyDetail', has_dates: 'hasAnyDates' };
    if (booleanTypes[a.criteria.type]) {
      const flag = stats[booleanTypes[a.criteria.type]];
      return { ...a, progress: flag ? 1 : 0, current: flag ? 1 : 0, unlocked: flag };
    }

    const current = valueMap[a.criteria.type] ?? 0;
    const progress = Math.min(current / a.criteria.threshold, 1);
    const unlocked = progress >= 1;
    return { ...a, progress, current, unlocked };
  });

// ═════════════════════════════════════════════════════════════════════════════
// Block 3.1 — XP 2.0 & 7-State Territorial Mastery Engine
// Pure, deterministic, in-memory (no I/O, no Firestore, no network).
// ═════════════════════════════════════════════════════════════════════════════

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const asArray = (value) => (Array.isArray(value) ? value : []);

const getTripStops = (viaje) => {
  if (Array.isArray(viaje?.paradas)) return viaje.paradas;
  if (Array.isArray(viaje?.stops)) return viaje.stops;
  return [];
};

const getTripPhotos = (viaje) => {
  const gallery = viaje?.gallery || viaje?.fotos || viaje?.photos;
  if (Array.isArray(gallery)) return gallery;
  if (viaje?.foto) return [viaje.foto];
  return [];
};

const normalizeIso2 = (value) => {
  if (!value || typeof value !== 'string') return null;
  const normalized = normalizeCountryCode(value);
  if (normalized) return normalized;
  const upper = value.trim().toUpperCase();
  return upper.length === 2 ? upper : null;
};

const getStopCountry = (parada) =>
  normalizeIso2(parada?.paisCodigo || parada?.countryCode || parada?.code || parada?.country);

const getTripCountry = (viaje) =>
  normalizeIso2(viaje?.paisCodigo || viaje?.countryCode || viaje?.code || viaje?.country);

const getStopCity = (parada) => {
  const raw = parada?.ciudad || parada?.city || parada?.ciudades;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : '';
};

const getTripDays = (viaje) => {
  const start = viaje?.fechaInicio || viaje?.startDate;
  const end = viaje?.fechaFin || viaje?.endDate;
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(0, Math.ceil((b - a) / 86400000) + 1);
};

/**
 * A trip counts for gamification unless it is explicitly planned or a wishlist item.
 * Drafts and legacy records (missing status) are treated as completed.
 *
 * @param {object} viaje
 * @returns {boolean}
 */
export function isCompletedTripForGamification(viaje) {
  if (!viaje || typeof viaje !== 'object') return false;
  const status = String(viaje.status || 'completed').toLowerCase();
  return status !== 'planned' && status !== 'wishlist';
}

/**
 * XP 2.0 breakdown: base value + curation bonuses.
 *
 * @param {object[]} viajes
 * @param {object|null} userProfile
 */
export function calculateXPBreakdown(viajes = [], userProfile = null) {
  const completedTrips = asArray(viajes).filter(isCompletedTripForGamification);
  const countrySet = new Set();
  let totalStopsCount = 0;
  let totalPhotosCount = 0;
  let tripsWithFullTrilogy = 0;
  let stopsWithHeadlineOrNote = 0;
  let totalPoisCount = 0;

  for (const viaje of completedTrips) {
    const stops = getTripStops(viaje);
    totalStopsCount += stops.length;
    totalPhotosCount += getTripPhotos(viaje).length;

    const tripCountry = getTripCountry(viaje);
    if (tripCountry) countrySet.add(tripCountry);

    const highlights = viaje?.highlights;
    if (hasText(highlights?.topFood) && hasText(highlights?.topView) && hasText(highlights?.topTip)) {
      tripsWithFullTrilogy += 1;
    }

    for (const parada of stops) {
      const stopCountry = getStopCountry(parada);
      if (stopCountry) countrySet.add(stopCountry);
      if (hasText(parada?.titular) || hasText(parada?.nota) || hasText(parada?.relato)) {
        stopsWithHeadlineOrNote += 1;
      }
      totalPoisCount += asArray(parada?.lugares).length;
    }
  }

  const tripsXP = completedTrips.length * 100;
  const countriesXP = countrySet.size * 500;
  const stopsXP = totalStopsCount * 50;
  const photosXP = totalPhotosCount * 10;
  const onboardingXP = userProfile?.hasCompletedOnboarding ? 50 : 0;
  const trilogyBonusXP = tripsWithFullTrilogy * 30;
  const chroniclesBonusXP = stopsWithHeadlineOrNote * 15;
  const poisBonusXP = totalPoisCount * 10;
  const curationTotalXP = trilogyBonusXP + chroniclesBonusXP + poisBonusXP;
  const baseTotalXP = tripsXP + countriesXP + stopsXP + photosXP + onboardingXP;

  return {
    completedTrips: completedTrips.length,
    uniqueCountriesCount: countrySet.size,
    totalStopsCount,
    totalPhotosCount,
    tripsWithFullTrilogy,
    stopsWithHeadlineOrNote,
    totalPoisCount,
    tripsXP,
    countriesXP,
    stopsXP,
    photosXP,
    onboardingXP,
    trilogyBonusXP,
    chroniclesBonusXP,
    poisBonusXP,
    curationTotalXP,
    baseTotalXP,
    totalXP: baseTotalXP + curationTotalXP,
  };
}


/**
 * Returns the closest locked achievements (highest completion first).
 *
 * @param {object[]} achievements - items from `getAchievementsWithProgress`
 * @param {number} limit
 */
export function getNextAchievableBadges(achievements = [], limit = 2) {
  const mapped = [];
  for (const achievement of asArray(achievements)) {
    if (!achievement || achievement.unlocked) continue;

    const target = Number(achievement.target ?? achievement.criteria?.threshold ?? 1) || 1;
    let current = 0;
    if (Number.isFinite(achievement.current)) {
      current = achievement.current;
    } else if (typeof achievement.progress === 'number') {
      current = achievement.progress <= 1 ? achievement.progress * target : achievement.progress;
    }

    if (!(current > 0)) continue;

    const progressPct = Math.min(99, Math.round((current / target) * 100));
    mapped.push({
      ...achievement,
      progressPct,
      remainingCount: Math.max(1, target - current),
    });
  }

  mapped.sort(
    (a, b) => b.progressPct - a.progressPct || a.remainingCount - b.remainingCount,
  );

  return mapped.slice(0, Math.max(0, limit));
}

/** Resolves the 5 visited mastery tiers (Level 1 → 5). */
const resolveMasteryTier = (visitsCount, citiesCount, daysCount) => {
  if (visitsCount >= 6 || citiesCount >= 12 || daysCount >= 60) {
    return { tier: 'leyenda', tierLevel: 5, stars: 5, tierName: 'Leyenda Local', metalTheme: 'obsidian_gold', accentColor: '#F59E0B' };
  }
  if (visitsCount >= 4 || citiesCount >= 8 || daysCount >= 30) {
    return { tier: 'segundo_hogar', tierLevel: 4, stars: 4, tierName: 'Segundo Hogar', metalTheme: 'platinum_teal', accentColor: '#45B0A8' };
  }
  if (visitsCount >= 3 || citiesCount >= 5 || daysCount >= 15) {
    return { tier: 'experto', tierLevel: 3, stars: 3, tierName: 'Experto de Ruta', metalTheme: 'solar_gold', accentColor: '#F59E0B' };
  }
  if (visitsCount >= 2 || citiesCount >= 3) {
    return { tier: 'conocedor', tierLevel: 2, stars: 2, tierName: 'Conocedor', metalTheme: 'arctic_silver', accentColor: '#94A3B8' };
  }
  return { tier: 'explorador', tierLevel: 1, stars: 1, tierName: 'Explorador', metalTheme: 'bronze_coral', accentColor: '#FF6B35' };
};

/** Orthogonal Roots (Charcoal Blue) / Base (Muted Teal) identity badge. */
const buildIdentityBadge = (isBirthCountry, isResidenceCountry) => {
  if (isBirthCountry && isResidenceCountry) {
    return { type: 'roots_and_base', label: 'Raíces y Base', bgHex: '#45B0A8', borderHex: '#2C3E50', icon: 'HeartHome' };
  }
  if (isBirthCountry) {
    return { type: 'roots', label: 'Raíces', bgHex: '#2C3E50', borderHex: '#2C3E50', icon: 'Heart' };
  }
  if (isResidenceCountry) {
    return { type: 'base', label: 'Mi Base', bgHex: '#45B0A8', borderHex: '#45B0A8', icon: 'Home' };
  }
  return null;
};

const resolveIso3 = (iso2) => {
  const iso3 = getCountryISO3(iso2);
  return iso3 || null;
};

const sortTripsByRecency = (trips) =>
  [...trips].sort((a, b) => {
    const ta = a.fechaInicio ? new Date(a.fechaInicio).getTime() : 0;
    const tb = b.fechaInicio ? new Date(b.fechaInicio).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

/** Multi-trip navigation resolution (single / multi / create). */
const buildNavigationAction = (iso2, trips) => {
  const list = asArray(trips);
  if (list.length === 1) {
    return {
      type: 'single_trip',
      path: `/trips/${list[0].id}`,
      tripId: list[0].id,
      tripTitle: list[0].titulo,
    };
  }
  if (list.length >= 2) {
    return { type: 'multi_trip', path: `/trips?country=${iso2}`, count: list.length };
  }
  return { type: 'create_trip', path: `/trips?new=true&country=${iso2}` };
};

const buildEmblemBase = ({ iso2, visitsCount = 0, citiesCount = 0, daysCount = 0, firstVisitedAt = null, isBirthCountry = false, isResidenceCountry = false, trips = [], cities = [] }) => {
  const sortedTrips = sortTripsByRecency(trips);
  const tier = resolveMasteryTier(visitsCount, citiesCount, daysCount);
  return {
    iso2,
    countryCode: iso2,
    iso3: resolveIso3(iso2),
    visitsCount,
    citiesCount,
    cities: asArray(cities),
    daysCount,
    status: 'visited',
    tier: tier.tier,
    tierLevel: tier.tierLevel,
    stars: tier.stars,
    tierName: tier.tierName,
    metalTheme: tier.metalTheme,
    accentColor: tier.accentColor,
    firstVisitedAt,
    isBirthCountry,
    isResidenceCountry,
    identityBadge: buildIdentityBadge(isBirthCountry, isResidenceCountry),
    trips: sortedTrips,
    navigationAction: buildNavigationAction(iso2, sortedTrips),
    catalogSpec: getCountryEmblemSpec(iso2),
  };
};


/**
 * Derives the 7-State Country Emblem model entirely in memory from trips + profile.
 *
 * States: `visited` (5 mastery tiers), `origin_unvisited`, `wishlist`, `locked`.
 *
 * @param {object[]} viajes
 * @param {object|null} userProfile
 * @param {{ includeLocked?: boolean }} options
 * @returns {object[]}
 */
export function calculateCountryEmblems(viajes = [], userProfile = null, options = {}) {
  const completedTrips = asArray(viajes).filter(isCompletedTripForGamification);
  const birthIso2 = normalizeIso2(userProfile?.birthCountry);
  const residenceIso2 = normalizeIso2(userProfile?.residenceCountry);

  const aggregates = new Map();

  for (const viaje of completedTrips) {
    const stops = getTripStops(viaje);
    const tripDays = getTripDays(viaje);
    const tripCountry = getTripCountry(viaje);

    const countryStopCounts = new Map();
    const countryCities = new Map();
    for (const parada of stops) {
      const stopCountry = getStopCountry(parada);
      if (!stopCountry) continue;
      countryStopCounts.set(stopCountry, (countryStopCounts.get(stopCountry) || 0) + 1);
      const city = getStopCity(parada);
      if (city) {
        if (!countryCities.has(stopCountry)) countryCities.set(stopCountry, new Set());
        countryCities.get(stopCountry).add(city);
      }
    }

    const tripCountryCodes = new Set(countryStopCounts.keys());
    if (tripCountry) tripCountryCodes.add(tripCountry);
    if (tripCountryCodes.size === 0) continue;

    const visitedAt = viaje?.fechaInicio || viaje?.startDate || null;

    for (const iso2 of tripCountryCodes) {
      if (!aggregates.has(iso2)) {
        aggregates.set(iso2, { iso2, trips: [], cities: new Set(), daysCount: 0, firstVisitedAt: null });
      }
      const agg = aggregates.get(iso2);
      agg.trips.push({
        id: viaje.id || null,
        titulo: viaje.titulo || viaje.title || '',
        fechaInicio: viaje.fechaInicio || viaje.startDate || null,
        fechaFin: viaje.fechaFin || viaje.endDate || null,
        coverUrl: viaje.coverUrl || viaje.portada || viaje.foto || null,
        stopsInCountry: countryStopCounts.get(iso2) || 0,
      });
      const citiesForCountry = countryCities.get(iso2);
      if (citiesForCountry) {
        for (const city of citiesForCountry) agg.cities.add(city);
      }
      agg.daysCount += tripDays;
      if (visitedAt) {
        const current = agg.firstVisitedAt ? new Date(agg.firstVisitedAt).getTime() : Number.POSITIVE_INFINITY;
        if (new Date(visitedAt).getTime() < current) agg.firstVisitedAt = visitedAt;
      }
    }
  }

  const visited = [];
  for (const agg of aggregates.values()) {
    const isBirthCountry = Boolean(birthIso2) && birthIso2 === agg.iso2;
    const isResidenceCountry = Boolean(residenceIso2) && residenceIso2 === agg.iso2;
    visited.push(
      buildEmblemBase({
        iso2: agg.iso2,
        visitsCount: agg.trips.length,
        citiesCount: agg.cities.size,
        daysCount: agg.daysCount,
        firstVisitedAt: agg.firstVisitedAt,
        isBirthCountry,
        isResidenceCountry,
        trips: agg.trips,
        cities: [...agg.cities],
      }),
    );
  }

  const visitedSorted = [...visited]
    .sort((a, b) => {
      const ta = a.firstVisitedAt ? new Date(a.firstVisitedAt).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.firstVisitedAt ? new Date(b.firstVisitedAt).getTime() : Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return a.iso2.localeCompare(b.iso2);
    })
    .map((emblem, index) => ({
      ...emblem,
      discoveryOrder: index + 1,
      discoveryCode: `#${String(index + 1).padStart(2, '0')}`,
    }));

  // Origin (birth / residence) with zero visits.
  const originCountries = [];
  const originCodes = [];
  if (birthIso2) originCodes.push(birthIso2);
  if (residenceIso2 && residenceIso2 !== birthIso2) originCodes.push(residenceIso2);

  for (const iso2 of originCodes) {
    if (aggregates.has(iso2)) continue;
    const isBirthCountry = Boolean(birthIso2) && birthIso2 === iso2;
    const isResidenceCountry = Boolean(residenceIso2) && residenceIso2 === iso2;
    const both = isBirthCountry && isResidenceCountry;
    originCountries.push({
      iso2,
      countryCode: iso2,
      iso3: resolveIso3(iso2),
      visitsCount: 0,
      citiesCount: 0,
      cities: [],
      daysCount: 0,
      status: 'origin_unvisited',
      tier: 'raices_base',
      tierLevel: 0,
      stars: 0,
      tierName: both ? 'Raíces y Base' : (isBirthCountry ? 'Mis Raíces' : 'Mi Base'),
      metalTheme: null,
      accentColor: isResidenceCountry ? '#45B0A8' : '#2C3E50',
      firstVisitedAt: null,
      isBirthCountry,
      isResidenceCountry,
      identityBadge: buildIdentityBadge(isBirthCountry, isResidenceCountry),
      trips: [],
      navigationAction: buildNavigationAction(iso2, []),
      catalogSpec: getCountryEmblemSpec(iso2),
      discoveryOrder: null,
      discoveryCode: null,
    });
  }

  // Wishlist destinations (zero visits, never overriding origin).
  const wishlistSet = new Set();
  for (const item of asArray(userProfile?.wishlist)) {
    const iso2 = normalizeIso2(
      item?.paisCodigo || item?.countryCode || item?.country || item?.code || item?.iso2,
    );
    if (iso2) wishlistSet.add(iso2);
  }

  const wishlistCountries = [];
  for (const iso2 of [...wishlistSet].sort()) {
    if (aggregates.has(iso2)) continue;
    if (originCodes.includes(iso2)) continue;
    const isBirthCountry = Boolean(birthIso2) && birthIso2 === iso2;
    const isResidenceCountry = Boolean(residenceIso2) && residenceIso2 === iso2;
    wishlistCountries.push({
      iso2,
      countryCode: iso2,
      iso3: resolveIso3(iso2),
      visitsCount: 0,
      citiesCount: 0,
      cities: [],
      daysCount: 0,
      status: 'wishlist',
      tier: 'wishlist',
      tierLevel: 0,
      stars: 0,
      tierName: 'En Wishlist',
      metalTheme: null,
      accentColor: '#45B0A8',
      firstVisitedAt: null,
      isBirthCountry,
      isResidenceCountry,
      identityBadge: buildIdentityBadge(isBirthCountry, isResidenceCountry),
      trips: [],
      navigationAction: buildNavigationAction(iso2, []),
      catalogSpec: getCountryEmblemSpec(iso2),
      discoveryOrder: null,
      discoveryCode: null,
    });
  }

  // Locked countries (only when explicitly requested).
  const lockedCountries = [];
  if (options?.includeLocked) {
    const taken = new Set([...aggregates.keys(), ...originCodes, ...wishlistSet]);
    for (const spec of getAllCatalogCountries()) {
      const iso2 = spec?.iso2;
      if (!iso2 || taken.has(iso2)) continue;
      lockedCountries.push({
        iso2,
        countryCode: iso2,
        iso3: spec.iso3 || resolveIso3(iso2),
        visitsCount: 0,
        citiesCount: 0,
        cities: [],
        daysCount: 0,
        status: 'locked',
        tier: 'locked',
        tierLevel: 0,
        stars: 0,
        tierName: 'Por Descubrir',
        metalTheme: null,
        accentColor: '#334155',
        firstVisitedAt: null,
        isBirthCountry: false,
        isResidenceCountry: false,
        identityBadge: null,
        trips: [],
        navigationAction: buildNavigationAction(iso2, []),
        catalogSpec: spec,
        discoveryOrder: null,
        discoveryCode: null,
      });
    }
  }

  return [...visitedSorted, ...originCountries, ...wishlistCountries, ...lockedCountries];
}

