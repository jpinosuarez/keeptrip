/**
 * Conquest colour theme tokens — shared layer (FSD-safe).
 *
 * Pure, dependency-free constants + resolvers used by the gamification model
 * and the map surfaces (features/mapa, shared/ui). No imports from @features.
 */

export const CONQUEST_COLOR_THEMES = [
  { id: 'atomic_tangerine', hex: '#FF6B35', nameKey: 'hub:conquestThemes.atomicTangerine', defaultName: 'Naranja Atómico' },
  { id: 'solar_amber', hex: '#F59E0B', nameKey: 'hub:conquestThemes.solarAmber', defaultName: 'Ámbar Solar' },
  { id: 'odyssey_indigo', hex: '#6366F1', nameKey: 'hub:conquestThemes.odysseyIndigo', defaultName: 'Índigo Odisea' },
  { id: 'ruby_crimson', hex: '#E11D48', nameKey: 'hub:conquestThemes.rubyCrimson', defaultName: 'Carmesí Rubí' },
  { id: 'boreal_violet', hex: '#8B5CF6', nameKey: 'hub:conquestThemes.borealViolet', defaultName: 'Violeta Boreal' },
];

export const DEFAULT_CONQUEST_COLOR = '#FF6B35';
export const CONQUEST_COLOR_UNLOCK_LEVEL = 3;
export const CONQUEST_COLOR_UNLOCK_XP = 3001;

/** @returns {boolean} true once the traveler reaches Level 3 (3001+ XP). */
export function isConquestColorUnlocked(xp = 0) {
  return Number(xp) >= CONQUEST_COLOR_UNLOCK_XP;
}

/**
 * Resolves the user's preferred conquest colour, falling back to Atomic
 * Tangerine when the perk is locked or the stored value is invalid.
 *
 * @param {{ conquestColor?: string }|null} userProfile
 * @param {number} xp
 * @returns {string} hex colour
 */
export function resolveConquestColor(userProfile, xp = 0) {
  if (!isConquestColorUnlocked(xp)) return DEFAULT_CONQUEST_COLOR;
  const preferred = userProfile?.conquestColor;
  if (!preferred || typeof preferred !== 'string') return DEFAULT_CONQUEST_COLOR;
  const match = CONQUEST_COLOR_THEMES.find(
    (theme) => theme.hex.toLowerCase() === preferred.trim().toLowerCase(),
  );
  return match ? match.hex : DEFAULT_CONQUEST_COLOR;
}
