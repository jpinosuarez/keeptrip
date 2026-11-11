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
import { getCountryISO3, normalizeCountryCode, getCountryCentroid } from '@shared/lib/utils/countryUtils';
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

const haversineKm = (a, b) => {
  if (!a || !b) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};

const normalizeLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const first = Number(coords[0]);
  const second = Number(coords[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (Math.abs(first) > 90) return { lat: second, lng: first };
  return { lat: first, lng: second };
};

const getStopPoint = (stop) => {
  if (!stop || typeof stop !== 'object') return null;
  const raw = stop.coordenadas || stop.coordinates || stop.latlng || null;
  if (Array.isArray(raw)) return normalizeLatLng(raw);
  const code = stop.paisCodigo || stop.countryCode;
  const centroid = code ? getCountryCentroid(code) : null;
  if (Array.isArray(centroid) && centroid.length >= 2) {
    return { lng: Number(centroid[0]), lat: Number(centroid[1]) };
  }
  return null;
};

const getTripDurationDays = (trip) => {
  if (!trip) return 0;
  const start = trip.fechaInicio || trip.startDate;
  const end = trip.fechaFin || trip.endDate;
  if (start && end) {
    const a = new Date(start);
    const b = new Date(end);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime())) {
      return Math.max(1, Math.ceil((b - a) / 86400000) + 1);
    }
  }
  if (Number.isFinite(Number(trip.dias))) return Math.max(0, Number(trip.dias));
  return 0;
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

  // ── Polish Slice 2: rich metrics for the dual badge engine ──
  const stopsByTrip = new Map();
  for (const p of todasLasParadas) {
    if (!p?.viajeId) continue;
    if (!stopsByTrip.has(p.viajeId)) stopsByTrip.set(p.viajeId, []);
    stopsByTrip.get(p.viajeId).push(p);
  }

  const homePoint = (() => {
    const base = userProfile?.baseCity?.coordinates;
    const birth = userProfile?.birthCity?.coordinates;
    const coords = Array.isArray(base) ? base : Array.isArray(birth) ? birth : null;
    if (coords) return normalizeLatLng(coords);
    const homeCode = residenceCountry || birthCountry;
    const centroid = homeCode ? getCountryCentroid(homeCode) : null;
    if (Array.isArray(centroid) && centroid.length >= 2) {
      return { lng: Number(centroid[0]), lat: Number(centroid[1]) };
    }
    return null;
  })();

  const ISLANDS = new Set(['JP', 'ID', 'PH', 'NZ', 'IS', 'GB', 'IE', 'CU', 'DO', 'JM', 'BS', 'MT', 'CY', 'LK', 'MV', 'FJ', 'MG', 'SG', 'TW']);
  const MICROSTATES = new Set(['MC', 'VA', 'SM', 'AD', 'LI', 'MT', 'SG', 'LU', 'BH', 'MV', 'SC', 'BB']);

  let totalKm = 0;
  let totalDays = 0;
  let maxStopsInTrip = 0;
  let dayTrips = 0;
  let chronicleStops = 0;
  let poiCount = 0;
  let foodTrips = 0;
  let trilogyTrips = 0;
  let gastronomyPois = 0;
  let culturePois = 0;
  let favoriteStops = 0;
  let hasNorthStop = false;
  let hasSouthStop = false;
  const hemispheres = new Set();
  let hasPolarStop = false;
  let maxDistanceFromHomeKm = 0;
  const citySet = new Set();
  const transportCounts = { plane: 0, train: 0, car: 0, ship: 0, bus: 0, walk: 0 };
  const transportModes = new Set();
  const visitedIso2 = new Set();
  let soloTrips = 0;
  let coupleTrips = 0;
  let groupTrips = 0;
  const quarters = new Set();
  let crossedNewYear = false;

  for (const code of countryCodes) {
    const iso2 = normalizeCountryCode(code) || code;
    if (iso2) visitedIso2.add(String(iso2).toUpperCase());
  }

  for (const trip of bitacora) {
    const tripStops = (stopsByTrip.get(trip.id) || []).slice();
    maxStopsInTrip = Math.max(maxStopsInTrip, tripStops.length);
    const days = getTripDurationDays(trip);
    totalDays += days;
    const escapeCount = tripStops.filter((s) => s?.esParadaEscapada).length;
    if (escapeCount > 0) dayTrips += escapeCount;
    else if (days === 1) dayTrips += 1;

    const highlights = trip?.highlights;
    if (hasText(highlights?.topFood)) foodTrips += 1;
    if (hasText(highlights?.topFood) && hasText(highlights?.topView) && hasText(highlights?.topTip)) {
      trilogyTrips += 1;
    }

    const companionType = String(trip?.companionType || '').toLowerCase();
    const companions = Array.isArray(trip?.companions) ? trip.companions.length : 0;
    if (companionType === 'solo' || (companions === 0 && !companionType)) soloTrips += 1;
    else if (companionType === 'couple' || companionType === 'partner' || companions === 1) coupleTrips += 1;
    else if (companionType === 'family' || companionType === 'friends' || companions >= 2) groupTrips += 1;

    const startRaw = trip?.fechaInicio || trip?.startDate || null;
    const endRaw = trip?.fechaFin || trip?.endDate || null;
    if (startRaw) {
      const month = new Date(startRaw).getMonth();
      if (!Number.isNaN(month)) quarters.add(Math.floor(month / 3));
    }
    if (startRaw && endRaw) {
      const a = new Date(startRaw);
      const b = new Date(endRaw);
      if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && b.getFullYear() > a.getFullYear()) {
        crossedNewYear = true;
      }
    }

    const points = tripStops.map(getStopPoint).filter(Boolean);
    for (let i = 1; i < points.length; i += 1) totalKm += haversineKm(points[i - 1], points[i]);

    for (const stop of tripStops) {
      const countryIso2 = normalizeCountryCode(stop?.paisCodigo || stop?.countryCode) || null;
      if (countryIso2) visitedIso2.add(String(countryIso2).toUpperCase());

      const city = stop?.ciudad || stop?.city || stop?.ciudades;
      if (typeof city === 'string' && city.trim()) citySet.add(city.trim().toLowerCase());

      if (hasText(stop?.titular) || hasText(stop?.nota) || hasText(stop?.relato)) chronicleStops += 1;

      if (Array.isArray(stop?.lugares)) {
        poiCount += stop.lugares.length;
        for (const poi of stop.lugares) {
          const kind = String(poi?.tipo || poi?.categoria || poi?.category || '').toLowerCase();
          if (kind.includes('gastro') || kind.includes('food') || kind.includes('restaur')) gastronomyPois += 1;
          if (kind.includes('cultur') || kind.includes('monument') || kind.includes('museo') || kind.includes('museum')) culturePois += 1;
        }
      }
      if (stop?.esFavorita) favoriteStops += 1;

      const mode = String(stop?.transporte || stop?.transport || '').toLowerCase();
      if (mode && Object.prototype.hasOwnProperty.call(transportCounts, mode)) transportCounts[mode] += 1;
      if (mode) transportModes.add(mode);

      const point = getStopPoint(stop);
      if (point) {
        if (point.lat > 0) hasNorthStop = true;
        if (point.lat < 0) hasSouthStop = true;
        hemispheres.add(point.lat >= 0 ? 'N' : 'S');
        hemispheres.add(point.lng >= 0 ? 'E' : 'W');
        if (point.lat >= 60 || point.lat <= -50) hasPolarStop = true;
        if (homePoint) {
          maxDistanceFromHomeKm = Math.max(maxDistanceFromHomeKm, haversineKm(homePoint, point));
        }
      }
    }
  }
  const wishlistItems = Array.isArray(userProfile?.wishlist) ? userProfile.wishlist : [];
  const wishlistIso2 = new Set();
  for (const item of wishlistItems) {
    const iso2 = normalizeCountryCode(item?.paisCodigo || item?.countryCode || item?.country) || null;
    if (iso2) wishlistIso2.add(String(iso2).toUpperCase());
  }
  let wishlistCompleted = 0;
  for (const iso2 of wishlistIso2) if (visitedIso2.has(iso2)) wishlistCompleted += 1;

  let islandCountriesCount = 0;
  let microstatesCount = 0;
  for (const iso2 of visitedIso2) {
    if (ISLANDS.has(iso2)) islandCountriesCount += 1;
    if (MICROSTATES.has(iso2)) microstatesCount += 1;
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
    // Polish Slice 2 rich metrics
    totalKm,
    totalDays,
    maxStopsInTrip,
    maxDaysInTrip: longestDays,
    dayTrips,
    chronicleStops,
    poiCount,
    foodTrips,
    trilogyTrips,
    gastronomyPois,
    culturePois,
    favoriteStops,
    crossedEquator: hasNorthStop && hasSouthStop,
    hemispheresCount: hemispheres.size,
    hasPolarStop,
    maxDistanceFromHomeKm: Math.round(maxDistanceFromHomeKm),
    transportCounts,
    transportModes: transportModes.size,
    islandCountriesCount,
    microstatesCount,
    uniqueCities: citySet.size,
    soloTrips,
    coupleTrips,
    groupTrips,
    wishlistCount: wishlistItems.length,
    wishlistCompleted,
    quartersVisited: quarters.size,
    crossedNewYear,
  };
};

/**
 * Evaluate which achievements are unlocked given user stats.
 * Returns only the unlocked achievements (with their definition).
 */
const resolveMetricCurrent = (stats, type) => {
  switch (type) {
    case 'countries': return stats.countries || 0;
    case 'trips': return stats.trips || 0;
    case 'continents': return stats.continents || 0;
    case 'detailed_trips': return stats.detailedTrips || 0;
    case 'local_explorer': return Math.max(stats.localTripsCount || 0, stats.localStopsCount || 0);
    case 'has_photo': return stats.hasAnyPhoto ? 1 : 0;
    case 'has_detail': return stats.hasAnyDetail ? 1 : 0;
    case 'has_dates': return stats.hasAnyDates ? 1 : 0;
    case 'photos': return stats.totalPhotos || 0;
    case 'long_trip': return stats.longestTrip || 0;
    case 'places': return stats.poiCount || 0;
    case 'total_km': return stats.totalKm || 0;
    case 'total_days': return stats.totalDays || 0;
    case 'chronicle_stops': return stats.chronicleStops || 0;
    case 'trilogy_trips': return stats.trilogyTrips || 0;
    case 'food_trips': return stats.foodTrips || 0;
    case 'poi_count': return stats.poiCount || 0;
    case 'unique_cities': return stats.uniqueCities || 0;
    case 'transport_modes': return stats.transportModes || 0;
    case 'train_legs': return stats.transportCounts?.train || 0;
    case 'car_legs': return stats.transportCounts?.car || 0;
    case 'ship_legs': return stats.transportCounts?.ship || 0;
    case 'plane_legs': return stats.transportCounts?.plane || 0;
    case 'day_trips': return stats.dayTrips || 0;
    case 'max_stops': return stats.maxStopsInTrip || 0;
    case 'max_days': return stats.maxDaysInTrip || stats.longestTrip || 0;
    case 'island_countries': return stats.islandCountriesCount || 0;
    case 'microstates': return stats.microstatesCount || 0;
    case 'solo_trips': return stats.soloTrips || 0;
    case 'couple_trips': return stats.coupleTrips || 0;
    case 'group_trips': return stats.groupTrips || 0;
    case 'wishlist_count': return stats.wishlistCount || 0;
    case 'wishlist_completed': return stats.wishlistCompleted || 0;
    case 'quarters': return stats.quartersVisited || 0;
    case 'equator': return stats.crossedEquator ? 1 : 0;
    case 'hemispheres': return stats.hemispheresCount || 0;
    case 'polar': return stats.hasPolarStop ? 1 : 0;
    case 'far_home_km': return stats.maxDistanceFromHomeKm || 0;
    case 'new_year': return stats.crossedNewYear ? 1 : 0;
    case 'gastronomy_pois': return stats.gastronomyPois || 0;
    case 'culture_pois': return stats.culturePois || 0;
    case 'favorite_stops': return stats.favoriteStops || 0;
    default: return 0;
  }
};

const TIER_NAMES = ['bronze', 'silver', 'gold', 'legend'];

/**
 * Dual badge status: `milestone` (one-off Hito) vs `tiered` (4-step mastery).
 * `progress` stays a 0..1 fraction for backwards compatibility; raw counts are
 * exposed via `current`, and tiered badges also expose `attainedTierIndex`,
 * `nextTierThreshold`, `tier`, `isMaxTier` and `progressPct`.
 */
export const getAchievementsWithProgress = (stats) =>
  ACHIEVEMENTS.map((achievement) => {
    const current = Number(resolveMetricCurrent(stats, achievement?.criteria?.type)) || 0;

    if (achievement.type === 'tiered' && Array.isArray(achievement.tiers) && achievement.tiers.length > 0) {
      const tiers = achievement.tiers;
      let attainedTierIndex = -1;
      for (let i = 0; i < tiers.length; i += 1) {
        if (current >= tiers[i]) attainedTierIndex = i;
      }
      const unlocked = attainedTierIndex >= 0;
      const nextTierThreshold =
        attainedTierIndex + 1 < tiers.length ? tiers[attainedTierIndex + 1] : null;
      const target = nextTierThreshold ?? tiers[tiers.length - 1];
      const tierBase = attainedTierIndex >= 0 ? tiers[attainedTierIndex] : 0;
      const progress = nextTierThreshold
        ? Math.min(1, Math.max(0, (current - tierBase) / Math.max(1, nextTierThreshold - tierBase)))
        : 1;
      return {
        ...achievement,
        current,
        unlocked,
        progress,
        target,
        tiers,
        type: 'tiered',
        attainedTierIndex,
        nextTierThreshold,
        tier: unlocked ? TIER_NAMES[Math.min(attainedTierIndex, TIER_NAMES.length - 1)] : null,
        isMaxTier: nextTierThreshold === null,
        progressPct: nextTierThreshold
          ? Math.min(99, Math.round((current / nextTierThreshold) * 100))
          : 100,
      };
    }

    const target = achievement.target ?? achievement.criteria?.threshold ?? 1;
    const unlocked = current >= target;
    const progress = unlocked ? 1 : Math.min(1, current / Math.max(1, target));
    return {
      ...achievement,
      current,
      unlocked,
      progress,
      target,
      type: 'milestone',
      isMilestone: true,
      progressPct: unlocked ? 100 : Math.min(99, Math.round((current / Math.max(1, target)) * 100)),
    };
  });

export const evaluateAchievements = (stats) =>
  getAchievementsWithProgress(stats).filter((achievement) => achievement.unlocked);

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

