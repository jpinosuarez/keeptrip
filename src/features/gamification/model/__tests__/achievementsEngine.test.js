import { describe, it, expect } from 'vitest';
import {
  buildStats,
  evaluateAchievements,
  getAchievementsWithProgress,
  isCompletedTripForGamification,
  calculateXPBreakdown,
  calculateCountryEmblems,
  getNextAchievableBadges,
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
    const todasLasParadas = Array.from({ length: 10 }, () => ({
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

const tripWith = (id, code, { cities = [], start = '2024-01-01', end = '2024-01-05' } = {}) => ({
  id,
  status: 'completed',
  paisCodigo: code,
  fechaInicio: start,
  fechaFin: end,
  paradas: cities.map((city) => ({ paisCodigo: code, ciudad: city })),
});

describe('achievementsEngine - XP 2.0', () => {
  it('isCompletedTripForGamification excludes planned and wishlist trips', () => {
    expect(isCompletedTripForGamification(null)).toBe(false);
    expect(isCompletedTripForGamification({})).toBe(true);
    expect(isCompletedTripForGamification({ status: 'completed' })).toBe(true);
    expect(isCompletedTripForGamification({ status: 'planned' })).toBe(false);
    expect(isCompletedTripForGamification({ status: 'wishlist' })).toBe(false);
  });

  it('calculateXPBreakdown computes base + curation deterministically', () => {
    const viajes = [
      {
        id: 't1',
        status: 'completed',
        paisCodigo: 'AR',
        highlights: { topFood: 'Asado', topView: 'Mirador', topTip: 'Reservá' },
        gallery: [{}, {}],
        paradas: [
          { paisCodigo: 'AR', titular: 'Día 1', lugares: [{}, {}] },
          { paisCodigo: 'AR', nota: 'Llevá efectivo', lugares: [{}] },
        ],
      },
      { id: 't2', status: 'planned', paisCodigo: 'FR', paradas: [{ paisCodigo: 'FR', relato: 'x' }] },
    ];

    const xp = calculateXPBreakdown(viajes, { hasCompletedOnboarding: true });

    expect(xp.completedTrips).toBe(1);
    expect(xp.uniqueCountriesCount).toBe(1); // FR excluded (planned)
    expect(xp.totalStopsCount).toBe(2);
    expect(xp.totalPhotosCount).toBe(2);
    expect(xp.tripsWithFullTrilogy).toBe(1);
    expect(xp.stopsWithHeadlineOrNote).toBe(2);
    expect(xp.totalPoisCount).toBe(3);
    expect(xp.tripsXP).toBe(100);
    expect(xp.countriesXP).toBe(500);
    expect(xp.stopsXP).toBe(100);
    expect(xp.photosXP).toBe(20);
    expect(xp.onboardingXP).toBe(50);
    expect(xp.trilogyBonusXP).toBe(30);
    expect(xp.chroniclesBonusXP).toBe(30);
    expect(xp.poisBonusXP).toBe(30);
    expect(xp.curationTotalXP).toBe(90);
    expect(xp.baseTotalXP).toBe(770);
    expect(xp.totalXP).toBe(860);
  });
});

describe('achievementsEngine - emblem states', () => {
  it('derives wishlist, origin and visited states orthogonally', () => {
    const viajes = [
      {
        id: 'ar1',
        status: 'completed',
        titulo: 'Argentina',
        paisCodigo: 'AR',
        fechaInicio: '2024-01-01',
        fechaFin: '2024-01-05',
        paradas: [
          { paisCodigo: 'AR', ciudad: 'Buenos Aires' },
          { paisCodigo: 'AR', ciudad: 'Mendoza' },
        ],
      },
    ];
    const profile = { birthCountry: 'AR', residenceCountry: 'DE', wishlist: [{ paisCodigo: 'JP' }] };
    const emblems = calculateCountryEmblems(viajes, profile);

    const ar = emblems.find((emblem) => emblem.iso2 === 'AR');
    expect(ar.status).toBe('visited');
    expect(ar.visitsCount).toBe(1);
    expect(ar.tier).toBe('explorador');
    expect(ar.stars).toBe(1);
    expect(ar.accentColor).toBe('#FF6B35');
    expect(ar.identityBadge.type).toBe('roots');
    expect(ar.identityBadge.bgHex).toBe('#2C3E50');
    expect(ar.catalogSpec.viewBox).toBe('0 0 256 256');
    expect(ar.catalogSpec.palette.colors.length).toBeGreaterThanOrEqual(2);

    const de = emblems.find((emblem) => emblem.iso2 === 'DE');
    expect(de.status).toBe('origin_unvisited');
    expect(de.tier).toBe('raices_base');
    expect(de.tierName).toBe('Mi Base');
    expect(de.identityBadge.type).toBe('base');
    expect(de.identityBadge.bgHex).toBe('#45B0A8');
    expect(de.accentColor).toBe('#45B0A8');
    expect(de.navigationAction.type).toBe('create_trip');

    const jp = emblems.find((emblem) => emblem.iso2 === 'JP');
    expect(jp.status).toBe('wishlist');
    expect(jp.tierLevel).toBe(0);
    expect(jp.stars).toBe(0);
    expect(jp.tierName).toBe('En Wishlist');
    expect(jp.accentColor).toBe('#45B0A8');
    expect(jp.navigationAction.path).toBe('/trips?new=true&country=JP');
  });

  it('resolves the 5 visited mastery tiers by threshold', () => {
    const emblems = calculateCountryEmblems(
      [
        tripWith('it1', 'IT'),
        tripWith('it2', 'IT'),
        tripWith('es1', 'ES'),
        tripWith('es2', 'ES'),
        tripWith('es3', 'ES'),
        tripWith('pt1', 'PT', { cities: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] }),
        tripWith('mx1', 'MX', {
          cities: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        }),
        tripWith('gr1', 'GR', { start: '2024-01-01', end: '2024-01-30' }),
      ],
      {},
    );

    const pick = (iso2) => emblems.find((emblem) => emblem.iso2 === iso2);

    expect(pick('IT').tier).toBe('conocedor');
    expect(pick('IT').stars).toBe(2);
    expect(pick('IT').accentColor).toBe('#94A3B8');
    expect(pick('IT').metalTheme).toBe('arctic_silver');

    expect(pick('ES').tier).toBe('experto');
    expect(pick('ES').stars).toBe(3);
    expect(pick('ES').metalTheme).toBe('solar_gold');

    expect(pick('PT').tier).toBe('segundo_hogar');
    expect(pick('PT').stars).toBe(4);
    expect(pick('PT').accentColor).toBe('#45B0A8');

    expect(pick('MX').tier).toBe('leyenda');
    expect(pick('MX').stars).toBe(5);
    expect(pick('MX').metalTheme).toBe('obsidian_gold');
    expect(pick('MX').accentColor).toBe('#F59E0B');

    expect(pick('GR').tier).toBe('segundo_hogar');
  });
});


describe('achievementsEngine - emblem identity & navigation', () => {
  it('marks Roots & Base when origin and residence match', () => {
    const origin = calculateCountryEmblems([], { birthCountry: 'ES', residenceCountry: 'ES' });
    expect(origin).toHaveLength(1);
    expect(origin[0].status).toBe('origin_unvisited');
    expect(origin[0].tierName).toBe('Raíces y Base');
    expect(origin[0].accentColor).toBe('#45B0A8');
    expect(origin[0].identityBadge).toEqual({
      type: 'roots_and_base',
      label: 'Raíces y Base',
      bgHex: '#45B0A8',
      borderHex: '#2C3E50',
      icon: 'HeartHome',
    });

    const visited = calculateCountryEmblems([tripWith('es1', 'ES')], {
      birthCountry: 'ES',
      residenceCountry: 'ES',
    });
    expect(visited[0].identityBadge.type).toBe('roots_and_base');
  });

  it('assigns chronological discovery order and multi-trip navigation', () => {
    const emblems = calculateCountryEmblems(
      [
        tripWith('ar2', 'AR', { start: '2024-01-01', end: '2024-01-03' }),
        tripWith('fr', 'FR', { start: '2022-05-01', end: '2022-05-03' }),
        tripWith('ar1', 'AR', { start: '2023-01-01', end: '2023-01-03' }),
      ],
      {},
    );

    const fr = emblems.find((emblem) => emblem.iso2 === 'FR');
    const ar = emblems.find((emblem) => emblem.iso2 === 'AR');

    expect(fr.discoveryOrder).toBe(1);
    expect(fr.discoveryCode).toBe('#01');
    expect(ar.discoveryOrder).toBe(2);
    expect(ar.discoveryCode).toBe('#02');

    expect(fr.navigationAction).toEqual({
      type: 'single_trip',
      path: '/trips/fr',
      tripId: 'fr',
      tripTitle: '',
    });
    expect(ar.navigationAction).toEqual({
      type: 'multi_trip',
      path: '/trips?country=AR',
      count: 2,
    });
  });

  it('excludes planned trips from visited and surfaces them as wishlist', () => {
    const plan = { id: 'p1', status: 'planned', paisCodigo: 'PE', paradas: [{ paisCodigo: 'PE' }] };
    const emblems = calculateCountryEmblems([plan], { wishlist: [{ paisCodigo: 'PE' }] });
    const pe = emblems.find((emblem) => emblem.iso2 === 'PE');
    expect(pe.status).toBe('wishlist');
    expect(emblems.some((emblem) => emblem.status === 'visited')).toBe(false);
  });

  it('materializes locked countries only when includeLocked is requested', () => {
    const emblems = calculateCountryEmblems([], {}, { includeLocked: true });
    expect(emblems.length).toBeGreaterThan(100);
    const fr = emblems.find((emblem) => emblem.iso2 === 'FR');
    expect(fr.status).toBe('locked');
    expect(fr.tier).toBe('locked');
    expect(fr.stars).toBe(0);
    expect(fr.accentColor).toBe('#334155');
  });
});

describe('achievementsEngine - getNextAchievableBadges', () => {
  it('returns the top locked badges by completion, capped at 99%', () => {
    const list = [
      { id: 'a', unlocked: false, progress: 0.9, target: 10, criteria: { threshold: 10 } },
      { id: 'b', unlocked: false, progress: 0.5, target: 10, criteria: { threshold: 10 } },
      { id: 'c', unlocked: true, progress: 1, target: 1 },
      { id: 'd', unlocked: false, progress: 0, target: 5 },
      { id: 'e', unlocked: false, current: 10, target: 10 },
    ];

    const top = getNextAchievableBadges(list, 2);
    expect(top).toHaveLength(2);
    expect(top[0].id).toBe('e');
    expect(top[0].progressPct).toBe(99);
    expect(top[0].remainingCount).toBe(1);
    expect(top[1].id).toBe('a');
    expect(top[1].progressPct).toBe(90);
    expect(top[1].remainingCount).toBe(1);
  });

  it('tie-breaks equal completion by the smallest remaining count', () => {
    const list = [
      { id: 'wide', unlocked: false, current: 5, target: 10 },
      { id: 'tight', unlocked: false, current: 5, target: 9 },
    ];
    const top = getNextAchievableBadges(list, 1);
    expect(top[0].id).toBe('tight');
    expect(top[0].remainingCount).toBe(4);
  });
});

