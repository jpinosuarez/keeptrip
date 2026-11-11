import { describe, it, expect } from 'vitest';
import {
  getGodModeXpBreakdown,
  getSimulatedGodModeBadges,
  getSimulatedGodModeEmblems,
} from '../devGodModeSimulation';
import { ACHIEVEMENTS } from '../achievementDefinitions';
import { getAllCatalogCountries } from '../countryEmblemsCatalog';

describe('devGodModeSimulation', () => {
  it('builds one visited emblem per catalog country (AR as Leyenda)', () => {
    const emblems = getSimulatedGodModeEmblems();
    const catalog = getAllCatalogCountries();

    expect(emblems).toHaveLength(catalog.length);
    expect(emblems.every((emblem) => emblem.status === 'visited')).toBe(true);
    expect(emblems.every((emblem) => emblem.visitsCount > 0)).toBe(true);
    expect(emblems.every((emblem) => emblem.catalogSpec && emblem.catalogSpec.svgPath)).toBe(true);

    const argentina = emblems.find((emblem) => emblem.iso2 === 'AR');
    expect(argentina.tier).toBe('leyenda');
    expect(argentina.identityBadge).toEqual({ type: 'roots' });
    expect(emblems.find((emblem) => emblem.iso2 === 'DE').identityBadge).toEqual({ type: 'base' });

    // Monaco must always be part of the simulated 195, with its curated vector.
    const monaco = emblems.find((emblem) => emblem.countryCode === 'MC');
    expect(monaco).toBeTruthy();
    expect(monaco.continent).toBeTruthy();
    expect(monaco.catalogSpec?.svgPath?.startsWith('M')).toBe(true);
    expect(monaco.catalogSpec?.svgPath?.includes('C')).toBe(false);
    expect((monaco.catalogSpec?.svgPath?.match(/L/g) || []).length).toBeGreaterThanOrEqual(30);
  });

  it('unlocks every achievement at its maximum tier', () => {
    const badges = getSimulatedGodModeBadges();

    expect(badges).toHaveLength(ACHIEVEMENTS.length);
    expect(badges.every((badge) => badge.unlocked && badge.progressPct === 100)).toBe(true);
    expect(badges.filter((badge) => badge.type === 'tiered').every((badge) => badge.isMaxTier)).toBe(true);
  });

  it('exposes the max-rank XP breakdown', () => {
    expect(getGodModeXpBreakdown().totalXP).toBe(18500);
  });
});