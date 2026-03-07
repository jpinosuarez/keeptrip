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
];

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
