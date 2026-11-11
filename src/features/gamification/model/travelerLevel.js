/**
 * Sistema de niveles de viajero — gamificación tipo Duolingo.
 *
 * Cada nivel se desbloquea al alcanzar un número mínimo de países visitados.
 * Se expone tanto la lógica pura (getTravelerLevel, getNextLevel) como
 * el listado completo de niveles para renderizar barras de progreso.
 */

export const TRAVELER_LEVELS = [
  { id: 'dreamer',    min: 0,  label: 'Soñador',        icon: '💭', color: '#94A3B8' },
  { id: 'local',      min: 1,  label: 'Turista Local',  icon: '🧳', color: '#60A5FA' },
  { id: 'explorer',   min: 4,  label: 'Explorador',     icon: '🧭', color: '#34D399' },
  { id: 'globetrotter', min: 11, label: 'Trotamundos',  icon: '🌍', color: '#FBBF24' },
  { id: 'nomad',      min: 26, label: 'Nómada Global',  icon: '✈️', color: '#F97316' },
  { id: 'legend',     min: 51, label: 'Leyenda',        icon: '👑', color: '#A855F7' },
  { id: 'world_traveler', min: 101, label: 'Viajero del Mundo', icon: '🌏', color: '#22C55E' },
  { id: 'mythic',     min: 201, label: 'Mítico',         icon: '🪄', color: '#EC4899' },
];

export const ONBOARDING_XP_BONUS = 50;

/**
 * Calcula el XP total del viajero sumando países, viajes, paradas,
 * logros desbloqueados y el bono por completar el onboarding (+50 XP).
 */
export const calculateTotalXP = (stats = {}) => {
  let xp = 0;
  if (stats?.hasCompletedOnboarding) {
    xp += ONBOARDING_XP_BONUS;
  }
  const countries = stats.uniqueCountries || stats.countries || 0;
  const trips = stats.completedTrips || stats.trips || 0;
  const stops = stats.totalStops || 0;
  const achievements = stats.unlockedAchievementsCount ||
    (Array.isArray(stats.unlockedAchievements) ? stats.unlockedAchievements.length : 0);

  xp += countries * 100;
  xp += trips * 50;
  xp += stops * 20;
  xp += achievements * 150;

  return xp;
};

/**
 * XP contributed by a single trip (used by the viewer colophon and the
 * Stories finale slide). Deterministic and display-only.
 *
 * @param {Object} viaje
 * @param {Array<Object>} paradas
 * @param {Array<Object>} photos
 * @returns {number}
 */
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

export const calculateTripXP = (viaje, paradas = [], photos = []) => {
  const stopList = Array.isArray(paradas) ? paradas : [];
  const gallery = Array.isArray(photos) ? photos.length : 0;
  const stops = stopList.length;

  // Base value (unchanged — backwards compatible).
  let xp = 100 + stops * 50 + gallery * 10;

  // Curation bonus: full Trilogía (Mejor Sabor + Mejor Vista + Mejor Tip).
  const highlights = viaje?.highlights;
  const hasFullTrilogy =
    hasText(highlights?.topFood) && hasText(highlights?.topView) && hasText(highlights?.topTip);
  if (hasFullTrilogy) xp += 30;

  // Curation bonus: documented stops + registered POIs.
  for (const parada of stopList) {
    if (hasText(parada?.titular) || hasText(parada?.nota) || hasText(parada?.relato)) {
      xp += 15;
    }
    const places = Array.isArray(parada?.lugares) ? parada.lugares : [];
    xp += places.length * 10;
  }

  return xp;
};

/**
 * Devuelve el nivel actual del viajero basado en cantidad de países.
 * @param {number} countriesCount - Número de países visitados
 * @returns {{ id: string, min: number, label: string, icon: string, color: string }}
 */
export const getTravelerLevel = (countriesCount = 0) => {
  const count = Math.max(0, Math.floor(countriesCount));
  // Recorre de mayor a menor hasta encontrar el primer nivel que calzaficacion
  for (let i = TRAVELER_LEVELS.length - 1; i >= 0; i--) {
    if (count >= TRAVELER_LEVELS[i].min) return TRAVELER_LEVELS[i];
  }
  return TRAVELER_LEVELS[0];
};

/**
 * Devuelve el próximo nivel (null si ya es Leyenda).
 * @param {number} countriesCount
 * @returns {{ level: object|null, remaining: number, progress: number }}
 */
export const getNextLevel = (countriesCount = 0) => {
  const count = Math.max(0, Math.floor(countriesCount));
  const currentIdx = TRAVELER_LEVELS.findIndex(
    (_, i, arr) => i === arr.length - 1 || count < arr[i + 1].min
  );

  if (currentIdx === TRAVELER_LEVELS.length - 1) {
    return { level: null, remaining: 0, progress: 1 };
  }

  const current = TRAVELER_LEVELS[currentIdx];
  const next = TRAVELER_LEVELS[currentIdx + 1];
  const rangeSize = next.min - current.min;
  const progress = rangeSize > 0 ? (count - current.min) / rangeSize : 0;

  return {
    level: next,
    remaining: next.min - count,
    progress: Math.min(Math.max(progress, 0), 1),
  };
};

/**
 * Comprueba si un cambio de países provocó un level-up.
 * Útil para disparar confetti / modal.
 * @param {number} prevCount
 * @param {number} newCount
 * @returns {{ leveledUp: boolean, newLevel: object|null }}
 */
export const checkLevelUp = (prevCount, newCount) => {
  const prevLevel = getTravelerLevel(prevCount);
  const newLevel = getTravelerLevel(newCount);
  const leveledUp = newLevel.id !== prevLevel.id && newCount > prevCount;
  return { leveledUp, newLevel: leveledUp ? newLevel : null };
};

// ─────────────────────────────────────────────────────────────────────────────
// Level 3 Perks — Conquest Colour Themes (canonical logic lives in @shared for
// FSD compliance; re-exported here so the gamification public API is unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export {
  CONQUEST_COLOR_THEMES,
  DEFAULT_CONQUEST_COLOR,
  CONQUEST_COLOR_UNLOCK_LEVEL,
  CONQUEST_COLOR_UNLOCK_XP,
  isConquestColorUnlocked,
  resolveConquestColor,
} from '@shared/lib/utils/conquestTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Level Perks (1 → 5)
// ─────────────────────────────────────────────────────────────────────────────
export const LEVEL_PERKS = {
  1: { level: 1, minXP: 0, perkKey: 'hub:perks.level1', defaultPerk: 'Mapa 3D, Emblemas de Destino y Estadísticas Base' },
  2: { level: 2, minXP: 1001, perkKey: 'hub:perks.level2', defaultPerk: 'Insignia Destacada en Perfil y Cabecera' },
  3: { level: 3, minXP: 3001, perkKey: 'hub:perks.level3', defaultPerk: 'Selector de Color de Conquista del Mapa (5 Temas)' },
  4: { level: 4, minXP: 7001, perkKey: 'hub:perks.level4', defaultPerk: 'Marco Edición Coleccionista en Stories y Perfil' },
  5: { level: 5, minXP: 15001, perkKey: 'hub:perks.level5', defaultPerk: 'Emblema Maestro Leyenda del Camino (Obsidiana y Oro)' },
};
