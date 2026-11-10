import { describe, it, expect } from 'vitest';
import {
  TRAVELER_LEVELS,
  getTravelerLevel,
  getNextLevel,
  checkLevelUp,
  calculateTotalXP,
  calculateTripXP,
  ONBOARDING_XP_BONUS,
  CONQUEST_COLOR_THEMES,
  DEFAULT_CONQUEST_COLOR,
  CONQUEST_COLOR_UNLOCK_LEVEL,
  CONQUEST_COLOR_UNLOCK_XP,
  isConquestColorUnlocked,
  resolveConquestColor,
  LEVEL_PERKS,
} from '../travelerLevel';

describe('travelerLevel', () => {
  describe('calculateTotalXP', () => {
    it('awards +50 XP bonus when onboarding is completed', () => {
      const statsWithoutOnboarding = {
        uniqueCountries: 1,
        completedTrips: 1,
        totalStops: 2,
        hasCompletedOnboarding: false,
      };
      const statsWithOnboarding = {
        uniqueCountries: 1,
        completedTrips: 1,
        totalStops: 2,
        hasCompletedOnboarding: true,
      };

      const xpWithout = calculateTotalXP(statsWithoutOnboarding);
      const xpWith = calculateTotalXP(statsWithOnboarding);

      expect(xpWith - xpWithout).toBe(ONBOARDING_XP_BONUS);
      expect(ONBOARDING_XP_BONUS).toBe(50);
    });
  });

  describe('TRAVELER_LEVELS', () => {
    it('están ordenados ascendentemente por min', () => {
      for (let i = 1; i < TRAVELER_LEVELS.length; i++) {
        expect(TRAVELER_LEVELS[i].min).toBeGreaterThan(TRAVELER_LEVELS[i - 1].min);
      }
    });

    it('cada nivel tiene los campos requeridos', () => {
      TRAVELER_LEVELS.forEach((lvl) => {
        expect(lvl).toHaveProperty('id');
        expect(lvl).toHaveProperty('min');
        expect(lvl).toHaveProperty('label');
        expect(lvl).toHaveProperty('icon');
        expect(lvl).toHaveProperty('color');
      });
    });
  });

  describe('getTravelerLevel', () => {
    it('devuelve Soñador para 0 países', () => {
      expect(getTravelerLevel(0).id).toBe('dreamer');
    });

    it('devuelve Turista Local para 1 país', () => {
      expect(getTravelerLevel(1).id).toBe('local');
    });

    it('devuelve Turista Local para 3 países', () => {
      expect(getTravelerLevel(3).id).toBe('local');
    });

    it('devuelve Explorador para 4 países', () => {
      expect(getTravelerLevel(4).id).toBe('explorer');
    });

    it('devuelve Trotamundos para 11 países', () => {
      expect(getTravelerLevel(11).id).toBe('globetrotter');
    });

    it('devuelve Nómada Global para 26 países', () => {
      expect(getTravelerLevel(26).id).toBe('nomad');
    });

    it('devuelve Leyenda para 51 países', () => {
      expect(getTravelerLevel(51).id).toBe('legend');
    });

    it('devuelve Viajero del Mundo para 195 países', () => {
      expect(getTravelerLevel(195).id).toBe('world_traveler');
    });

    it('devuelve Mítico para 201 países', () => {
      expect(getTravelerLevel(201).id).toBe('mythic');
    });

    it('devuelve Soñador para valores negativos', () => {
      expect(getTravelerLevel(-5).id).toBe('dreamer');
    });

    it('devuelve Soñador si no se pasa argumento', () => {
      expect(getTravelerLevel().id).toBe('dreamer');
    });

    it('trunca valores decimales', () => {
      expect(getTravelerLevel(3.9).id).toBe('local');
      expect(getTravelerLevel(4.0).id).toBe('explorer');
    });
  });

  describe('getNextLevel', () => {
    it('con 0 países el siguiente es Turista Local, faltan 1', () => {
      const { level, remaining, progress } = getNextLevel(0);
      expect(level.id).toBe('local');
      expect(remaining).toBe(1);
      expect(progress).toBe(0);
    });

    it('con 2 países el siguiente es Explorador, faltan 2', () => {
      const { level, remaining, progress } = getNextLevel(2);
      expect(level.id).toBe('explorer');
      expect(remaining).toBe(2);
      expect(progress).toBeCloseTo(1 / 3, 5);
    });

    it('con 10 países el siguiente es Trotamundos, faltan 1', () => {
      const { level, remaining } = getNextLevel(10);
      expect(level.id).toBe('globetrotter');
      expect(remaining).toBe(1);
    });

    it('con 51+ países el siguiente nivel es Viajero del Mundo', () => {
      const { level, remaining, progress } = getNextLevel(60);
      expect(level.id).toBe('world_traveler');
      expect(remaining).toBe(41);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });

    it('con 201+ países no hay siguiente nivel', () => {
      const { level, remaining, progress } = getNextLevel(201);
      expect(level).toBeNull();
      expect(remaining).toBe(0);
      expect(progress).toBe(1);
    });

    it('progress está entre 0 y 1', () => {
      for (let i = 0; i <= 50; i++) {
        const { progress } = getNextLevel(i);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('checkLevelUp', () => {
    it('detecta level-up de 0 → 1 (Soñador → Turista Local)', () => {
      const { leveledUp, newLevel } = checkLevelUp(0, 1);
      expect(leveledUp).toBe(true);
      expect(newLevel.id).toBe('local');
    });

    it('no hay level-up si sigue en el mismo nivel', () => {
      const { leveledUp, newLevel } = checkLevelUp(1, 2);
      expect(leveledUp).toBe(false);
      expect(newLevel).toBeNull();
    });

    it('no hay level-up si la cuenta decrece', () => {
      const { leveledUp } = checkLevelUp(5, 3);
      expect(leveledUp).toBe(false);
    });

    it('detecta level-up multi-salto (0 → 11)', () => {
      const { leveledUp, newLevel } = checkLevelUp(0, 11);
      expect(leveledUp).toBe(true);
      expect(newLevel.id).toBe('globetrotter');
    });
  });

  describe('calculateTripXP (XP 2.0 curation bonuses)', () => {
    it('returns the legacy base when there is no curation', () => {
      expect(calculateTripXP({}, [], [])).toBe(100);
      expect(calculateTripXP({}, [{}, {}], [{}, {}, {}])).toBe(100 + 100 + 30);
    });

    it('adds +30 when the full Trilogía is present', () => {
      const viaje = { highlights: { topFood: 'Asado', topView: 'Mirador', topTip: 'Reservá' } };
      expect(calculateTripXP(viaje, [], [])).toBe(130);
    });

    it('adds +15 per documented stop (titular | nota | relato)', () => {
      const paradas = [
        { titular: 'Día 1' },
        { nota: 'Llevá efectivo' },
        { relato: 'Gran atardecer' },
        {},
      ];
      expect(calculateTripXP({}, paradas, [])).toBe(100 + 4 * 50 + 3 * 15);
    });

    it('adds +10 per POI registered in parada.lugares', () => {
      const paradas = [{ lugares: [{}, {}] }, { lugares: [{}] }];
      expect(calculateTripXP({}, paradas, [])).toBe(100 + 2 * 50 + 3 * 10);
    });

    it('combines base + all curation bonuses', () => {
      const viaje = { highlights: { topFood: 'X', topView: 'Y', topTip: 'Z' } };
      const paradas = [{ titular: 'T', lugares: [{}, {}] }];
      expect(calculateTripXP(viaje, paradas, [{}, {}])).toBe(100 + 50 + 20 + 30 + 15 + 20);
    });
  });

  describe('Conquest colour themes (Level 3 perk)', () => {
    it('exposes 5 brand-safe themes in the official order', () => {
      expect(CONQUEST_COLOR_THEMES).toHaveLength(5);
      expect(CONQUEST_COLOR_THEMES.map((theme) => theme.hex)).toEqual([
        '#FF6B35',
        '#F59E0B',
        '#6366F1',
        '#E11D48',
        '#8B5CF6',
      ]);
    });

    it('unlocks at Level 3 / 3001 XP', () => {
      expect(CONQUEST_COLOR_UNLOCK_LEVEL).toBe(3);
      expect(CONQUEST_COLOR_UNLOCK_XP).toBe(3001);
      expect(isConquestColorUnlocked(0)).toBe(false);
      expect(isConquestColorUnlocked(2999)).toBe(false);
      expect(isConquestColorUnlocked(3001)).toBe(true);
      expect(isConquestColorUnlocked(5000)).toBe(true);
    });

    it('resolveConquestColor locks to the default below the threshold', () => {
      expect(resolveConquestColor({ conquestColor: '#E11D48' }, 100)).toBe(DEFAULT_CONQUEST_COLOR);
    });

    it('resolveConquestColor honors a valid unlocked preference', () => {
      expect(resolveConquestColor({ conquestColor: '#E11D48' }, 5000)).toBe('#E11D48');
    });

    it('resolveConquestColor falls back on an invalid preference', () => {
      expect(resolveConquestColor({ conquestColor: '#123456' }, 5000)).toBe(DEFAULT_CONQUEST_COLOR);
      expect(resolveConquestColor(null, 5000)).toBe(DEFAULT_CONQUEST_COLOR);
    });

    it('LEVEL_PERKS maps levels 1..5 with ascending XP gates', () => {
      expect(Object.keys(LEVEL_PERKS)).toEqual(['1', '2', '3', '4', '5']);
      expect(LEVEL_PERKS[1].minXP).toBe(0);
      expect(LEVEL_PERKS[3].minXP).toBe(3001);
      expect(LEVEL_PERKS[5].minXP).toBe(15001);
    });
  });
});
