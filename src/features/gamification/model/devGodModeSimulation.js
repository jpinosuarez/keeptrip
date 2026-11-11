/**
 * DEV-only Gamification God Mode simulation payloads.
 *
 * Pure, synchronous and side-effect free: builds the FULL catalog of country
 * emblems as `visited` plus every achievement at its maximum tier. Consumed by
 * `useAchievements` when the session toggle is enabled (see
 * `@shared/dev/devGamificationOverride`).
 *
 * No Firestore reads/writes, no network.
 */

import { getAllCatalogCountries } from './countryEmblemsCatalog';
import { ACHIEVEMENTS } from './achievementDefinitions';
import { getCountryISO3 } from '@shared/lib/utils/countryUtils';

const MASTERY_TIERS = [
  { tier: 'explorador', tierName: 'Explorador', stars: 1, tierLevel: 1, metalTheme: 'bronze_coral', accentColor: '#FF6B35' },
  { tier: 'conocedor', tierName: 'Conocedor', stars: 2, tierLevel: 2, metalTheme: 'arctic_silver', accentColor: '#94A3B8' },
  { tier: 'experto', tierName: 'Experto de Ruta', stars: 3, tierLevel: 3, metalTheme: 'solar_gold', accentColor: '#F59E0B' },
  { tier: 'segundo_hogar', tierName: 'Segundo Hogar', stars: 4, tierLevel: 4, metalTheme: 'platinum_teal', accentColor: '#45B0A8' },
  { tier: 'leyenda', tierName: 'Leyenda Local', stars: 5, tierLevel: 5, metalTheme: 'obsidian_gold', accentColor: '#F59E0B' },
];

const GOD_MODE_XP_BREAKDOWN = Object.freeze({
  totalXP: 18500,
  curationTotalXP: 1200,
  tripsXP: 2500,
  countriesXP: 12500,
  stopsXP: 2300,
});

const ROOTS_CODE = 'AR';
const BASE_CODE = 'DE';

/** XP breakdown that unlocks every traveler rank (Leyenda del Camino). */
export const getGodModeXpBreakdown = () => ({ ...GOD_MODE_XP_BREAKDOWN });

/** 195 UN sovereign catalog countries rendered as visited emblems (AR = Leyenda). */
export function getSimulatedGodModeEmblems() {
  return getAllCatalogCountries().map((spec, index) => {
    const isRoots = spec.iso2 === ROOTS_CODE;
    const isBase = spec.iso2 === BASE_CODE;
    const mastery = isRoots
      ? MASTERY_TIERS[MASTERY_TIERS.length - 1]
      : MASTERY_TIERS[index % MASTERY_TIERS.length];
    const discoveryCode = `#${String(index + 1).padStart(2, '0')}`;

    return {
      iso2: spec.iso2,
      countryCode: spec.iso2,
      iso3: spec.iso3 || getCountryISO3(spec.iso2),
      countryName: spec.iso2,
      visitsCount: mastery.stars * 2,
      citiesCount: 2,
      cities: ['Ciudad Alfa', 'Ciudad Beta'],
      daysCount: mastery.stars * 7,
      status: 'visited',
      tier: mastery.tier,
      tierLevel: mastery.tierLevel,
      stars: mastery.stars,
      tierName: mastery.tierName,
      metalTheme: mastery.metalTheme,
      accentColor: mastery.accentColor,
      firstVisitedAt: '2023-04-12',
      isBirthCountry: isRoots,
      isResidenceCountry: isBase,
      identityBadge: isRoots ? { type: 'roots' } : isBase ? { type: 'base' } : null,
      trips: [
        {
          id: `dev-trip-${spec.iso2}`,
          titulo: `Aventura en ${spec.iso2}`,
          fechaInicio: '2023-04-12',
          fechaFin: '2023-04-19',
          coverUrl: null,
          stopsInCountry: 2,
        },
      ],
      navigationAction: { type: 'create_trip', path: `/trips?new=true&country=${spec.iso2}` },
      catalogSpec: spec,
      discoveryOrder: index + 1,
      discoveryCode,
    };
  });
}

/** Every achievement unlocked at its maximum tier (progress 100%). */
export function getSimulatedGodModeBadges() {
  return ACHIEVEMENTS.map((achievement) => {
    if (achievement.type === 'tiered' && Array.isArray(achievement.tiers) && achievement.tiers.length > 0) {
      const tiers = achievement.tiers;
      const attainedTierIndex = tiers.length - 1;
      const current = tiers[attainedTierIndex];

      return {
        ...achievement,
        current,
        unlocked: true,
        progress: 1,
        target: current,
        tiers,
        type: 'tiered',
        attainedTierIndex,
        nextTierThreshold: null,
        tier: 'legend',
        isMaxTier: true,
        progressPct: 100,
      };
    }

    const target = achievement.target ?? achievement.criteria?.threshold ?? 1;

    return {
      ...achievement,
      current: target,
      unlocked: true,
      progress: 1,
      target,
      type: 'milestone',
      isMilestone: true,
      progressPct: 100,
    };
  });
}
