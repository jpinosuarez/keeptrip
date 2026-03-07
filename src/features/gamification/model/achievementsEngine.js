/**
 * Pure-function achievement evaluation engine.
 *
 * Takes user stats and returns the list of currently-unlocked achievements.
 * No side-effects — all persistence is handled by the useAchievements hook.
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

  return {
    countries: countryCodes.length,
    trips: bitacora.length,
    continents: continents.size,
    detailedTrips,
    continentNames: continents,
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
  };

  return ACHIEVEMENTS.filter((a) => {
    const resolver = resolvers[a.criteria.type];
    return resolver ? resolver(a.criteria.threshold) : false;
  });
};

/**
 * Compute progress (0..1) for each achievement.
 * Returns all achievements with a `progress` field added.
 */
export const getAchievementsWithProgress = (stats) =>
  ACHIEVEMENTS.map((a) => {
    const valueMap = {
      countries:      stats.countries,
      trips:          stats.trips,
      continents:     stats.continents,
      detailed_trips: stats.detailedTrips,
    };
    const current = valueMap[a.criteria.type] ?? 0;
    const progress = Math.min(current / a.criteria.threshold, 1);
    const unlocked = progress >= 1;
    return { ...a, progress, current, unlocked };
  });
