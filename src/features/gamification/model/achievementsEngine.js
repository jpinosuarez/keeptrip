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

/** Build a continents Set from an array of ISO-3 country codes. */
const getContinents = (countryCodes) => {
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
export const buildStats = (countryCodes, bitacora, todasLasParadas) => {
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

  return {
    countries: countryCodes.length,
    trips: bitacora.length,
    continents: continents.size,
    detailedTrips,
    continentNames: continents,
    longestTrip: longestDays,
    totalPhotos,
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
    // Micro-milestone resolvers (Guardrail #1)
    has_photo:  () => stats.hasAnyPhoto,
    has_detail: () => stats.hasAnyDetail,
    has_dates:  () => stats.hasAnyDates,
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
    const valueMap = {
      countries:      stats.countries,
      trips:          stats.trips,
      continents:     stats.continents,
      detailed_trips: stats.detailedTrips,
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
