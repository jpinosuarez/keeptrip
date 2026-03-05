import { describe, it, expect } from 'vitest';
import {
  TRAVELER_LEVELS,
  getTravelerLevel,
  getNextLevel,
  checkLevelUp
} from './travelerLevel';

describe('travelerLevel', () => {
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

    it('devuelve Leyenda para 195 países', () => {
      expect(getTravelerLevel(195).id).toBe('legend');
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

    it('con 51+ países no hay siguiente nivel', () => {
      const { level, remaining, progress } = getNextLevel(60);
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
});
