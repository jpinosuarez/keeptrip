import { describe, it, expect } from 'vitest';
import {
  buildStats,
  evaluateAchievements,
  getAchievementsWithProgress,
} from '../achievementsEngine';

describe('achievementsEngine - local_explorer', () => {
  it('builds local stats and unlocks local_explorer when user has >= 3 domestic trips', () => {
    const userProfile = {
      birthCountry: 'AR',
      residenceCountry: 'DE',
    };

    const bitacora = [
      { id: 't1', paisCodigo: 'AR' },
      { id: 't2', paisCodigo: 'AR' },
      { id: 't3', paisCodigo: 'DE' },
    ];
    const todasLasParadas = [
      { viajeId: 't1', paisCodigo: 'AR' },
      { viajeId: 't2', paisCodigo: 'AR' },
      { viajeId: 't3', paisCodigo: 'DE' },
    ];

    const stats = buildStats(['ARG', 'DEU'], bitacora, todasLasParadas, userProfile);
    expect(stats.localTripsCount).toBe(3);

    const unlocked = evaluateAchievements(stats);
    expect(unlocked.some((a) => a.id === 'local_explorer')).toBe(true);

    const withProgress = getAchievementsWithProgress(stats);
    const localAch = withProgress.find((a) => a.id === 'local_explorer');
    expect(localAch.unlocked).toBe(true);
    expect(localAch.progress).toBe(1);
  });

  it('unlocks local_explorer when user has >= 10 stops in home countries', () => {
    const userProfile = {
      birthCountry: 'ES',
      residenceCountry: 'ES',
    };

    const bitacora = [{ id: 't1', paisCodigo: 'ES' }];
    const todasLasParadas = Array.from({ length: 10 }, (_, i) => ({
      viajeId: 't1',
      paisCodigo: 'ES',
    }));

    const stats = buildStats(['ESP'], bitacora, todasLasParadas, userProfile);
    expect(stats.localStopsCount).toBe(10);

    const unlocked = evaluateAchievements(stats);
    expect(unlocked.some((a) => a.id === 'local_explorer')).toBe(true);
  });

  it('calculates partial progress when threshold is not yet met', () => {
    const userProfile = {
      birthCountry: 'ES',
      residenceCountry: 'ES',
    };

    const bitacora = [{ id: 't1', paisCodigo: 'ES' }];
    const todasLasParadas = [{ viajeId: 't1', paisCodigo: 'ES' }];

    const stats = buildStats(['ESP'], bitacora, todasLasParadas, userProfile);
    const withProgress = getAchievementsWithProgress(stats);
    const localAch = withProgress.find((a) => a.id === 'local_explorer');

    expect(localAch.unlocked).toBe(false);
    expect(localAch.progress).toBeCloseTo(1 / 3, 2);
  });
});
