import { describe, it, expect } from 'vitest';
import {
  toDateKey,
  isMemoryEligibleTrip,
  normalizeCompletedMemoriesPool,
  buildMemoryCandidates,
  selectDailyMemoryCapsule,
  hashDailySeed,
  shiftIsoYear,
  addIsoDays,
} from './memoryCapsuleEngine';

const REF = '2026-05-04';

const madridTrip = {
  id: 't-madrid',
  titulo: 'Ruta España',
  fechaInicio: '2024-05-01',
  fechaFin: '2024-05-10',
  paisCodigo: 'ES',
};

const madridStop = {
  id: 'madrid',
  nombre: 'Madrid',
  ciudad: 'Madrid',
  paisCodigo: 'ES',
  fechaLlegada: '2024-05-01',
  fechaSalida: '2024-05-10',
};

const mayDataset = () => ({
  trips: [madridTrip],
  tripDataMap: { 't-madrid': { paradas: [madridStop] } },
});

describe('memoryCapsuleEngine · date helpers', () => {
  it('toDateKey keeps ISO strings verbatim and formats local Dates', () => {
    expect(toDateKey('2026-05-04')).toBe('2026-05-04');
    expect(toDateKey('2026-05-04T23:30:00.000Z')).toBe('2026-05-04');
    expect(toDateKey(new Date(2026, 4, 4, 12, 0, 0))).toBe('2026-05-04');
  });

  it('shiftIsoYear clamps Feb 29 to Feb 28 on non-leap years', () => {
    expect(shiftIsoYear('2026-02-28', 2024)).toBe('2024-02-28');
    expect(shiftIsoYear('2026-02-29', 2024)).toBe('2024-02-29');
    expect(shiftIsoYear('2026-02-29', 2025)).toBe('2025-02-28');
  });

  it('addIsoDays offsets across month boundaries', () => {
    expect(addIsoDays('2024-05-01', -1)).toBe('2024-04-30');
    expect(addIsoDays('2024-05-10', 1)).toBe('2024-05-11');
  });
});

describe('memoryCapsuleEngine · eligibility', () => {
  it('excludes wishlist, planned and future trips', () => {
    expect(isMemoryEligibleTrip(null, REF)).toBe(false);
    expect(isMemoryEligibleTrip({ status: 'wishlist' }, REF)).toBe(false);
    expect(isMemoryEligibleTrip({ status: 'planned' }, REF)).toBe(false);
    expect(isMemoryEligibleTrip({ status: 'completed' }, REF)).toBe(true);
    expect(isMemoryEligibleTrip({ fechaInicio: '2026-06-01', fechaFin: '2026-06-05' }, REF)).toBe(false);
    expect(isMemoryEligibleTrip({ fechaInicio: '2024-01-01', fechaFin: '2024-01-05' }, REF)).toBe(true);
  });
});

describe('memoryCapsuleEngine · pool normalization', () => {
  it('merges stubs, drops ineligible trips, sorts stops and keeps stop-first countries', () => {
    const trips = [
      { id: 'a', titulo: 'A', fechaInicio: '2024-01-01', fechaFin: '2024-01-10', paisCodigo: 'DE', foto: 'https://img/a.jpg' },
      { id: 'future', titulo: 'F', fechaInicio: '2026-09-01', fechaFin: '2026-09-05' },
      { id: 'wish', titulo: 'W', fechaInicio: '2023-01-01', fechaFin: '2023-01-02', status: 'wishlist' },
      { id: 'plan', titulo: 'P', fechaInicio: '2023-02-01', fechaFin: '2023-02-02', status: 'planned' },
      { id: 'draft', titulo: 'D' },
    ];
    const tripDataMap = {
      a: {
        paradas: [
          { id: 'cz', nombre: 'Praga', paisCodigo: 'CZ', fechaLlegada: '2024-01-05', fechaSalida: '2024-01-07' },
          { id: 'hu', nombre: 'Budapest', paisCodigo: 'HU', fechaLlegada: '2024-01-01', fechaSalida: '2024-01-04' },
        ],
      },
    };

    const pool = normalizeCompletedMemoriesPool(trips, tripDataMap, REF);

    expect(pool.dateKey).toBe(REF);
    expect(pool.trips.map((trip) => trip.id).sort()).toEqual(['a', 'draft']);

    const tripA = pool.trips.find((trip) => trip.id === 'a');
    expect(tripA.paradas.map((stop) => stop.id)).toEqual(['hu', 'cz']);
    // STOP-FIRST: stale root metadata (DE) must never leak when stops exist.
    expect(tripA.countryCodes).toEqual(['HU', 'CZ']);
    expect(tripA.coverUrl).toBe('https://img/a.jpg');
  });
});

describe('memoryCapsuleEngine · Level 1 exact_day', () => {
  it('matches the anniversary day and pinpoints the stop', () => {
    const { trips, tripDataMap } = mayDataset();
    const candidates = buildMemoryCandidates(trips, tripDataMap, REF);

    expect(candidates.exact_day).toHaveLength(1);
    const capsule = candidates.exact_day[0];

    expect(capsule.matchType).toBe('exact_day');
    expect(capsule.tierLevel).toBe(1);
    expect(capsule.yearsAgo).toBe(2);
    expect(capsule.stopId).toBe('madrid');
    expect(capsule.tripId).toBe('t-madrid');
    expect(capsule.id).toBe('t-madrid::madrid::exact_day');
    expect(capsule.deepLink).toBe('/dashboard?memory=t-madrid&stop=madrid');
    expect(capsule.tripViewerUrl).toBe('/trips/t-madrid');
    expect(capsule.countryCodes).toEqual(['ES']);
    expect(capsule.dateKey).toBe(REF);
    expect(capsule.tripDateRange).toEqual({ start: '2024-05-01', end: '2024-05-10' });
    expect(capsule.notificationMeta.title).toContain('Un día como hoy');
    expect(capsule.notificationMeta.deepLink).toBe(capsule.deepLink);
    expect(capsule.notificationMeta.imageUrl).toBeNull();
    expect(capsule.notificationMeta.titleKey).toBe('memory.notification.exact_day.title');
    expect(capsule.notificationMeta.bodyKey).toBe('memory.notification.exact_day.body');
  });

  it('tolerates a ±1 day window around the trip bounds', () => {
    const { trips, tripDataMap } = mayDataset();
    const candidates = buildMemoryCandidates(trips, tripDataMap, '2026-05-11');
    expect(candidates.exact_day).toHaveLength(1);
    expect(candidates.exact_day[0].yearsAgo).toBe(2);
  });

  it('is leap-year safe (Feb 29 trip matches Feb 28 in non-leap years)', () => {
    const trips = [{ id: 'leap', titulo: 'Bisiesto', fechaInicio: '2024-02-29', fechaFin: '2024-02-29' }];
    const tripDataMap = { leap: { paradas: [{ id: 'leap-stop', nombre: 'Roma', fechaLlegada: '2024-02-29' }] } };

    const candidates = buildMemoryCandidates(trips, tripDataMap, '2026-02-28');
    expect(candidates.exact_day).toHaveLength(1);
    expect(candidates.exact_day[0].yearsAgo).toBe(2);

    const oneYearAgo = buildMemoryCandidates(trips, tripDataMap, '2025-02-28');
    expect(oneYearAgo.exact_day).toHaveLength(1);
    expect(oneYearAgo.exact_day[0].yearsAgo).toBe(1);
  });
});

describe('memoryCapsuleEngine · Level 2 same_month', () => {
  it('matches the same calendar month from previous years and is de-duped against exact_day', () => {
    const trips = [
      madridTrip,
      { id: 't-june', titulo: 'París', fechaInicio: '2023-06-20', fechaFin: '2023-06-25', paisCodigo: 'FR' },
      { id: 't-lisboa', titulo: 'Lisboa', fechaInicio: '2023-05-20', fechaFin: '2023-05-25', paisCodigo: 'PT' },
    ];
    const tripDataMap = {
      't-madrid': { paradas: [madridStop] },
      't-june': { paradas: [{ id: 'paris', nombre: 'París', paisCodigo: 'FR', fechaLlegada: '2023-06-20', fechaSalida: '2023-06-25' }] },
      't-lisboa': { paradas: [{ id: 'lisboa', nombre: 'Lisboa', paisCodigo: 'PT', fechaLlegada: '2023-05-20', fechaSalida: '2023-05-25' }] },
    };

    const candidates = buildMemoryCandidates(trips, tripDataMap, REF);

    expect(candidates.exact_day.map((capsule) => capsule.tripId)).toEqual(['t-madrid']);
    // May is the reference month: Lisbon qualifies as same_month, Madrid is de-duped.
    expect(candidates.same_month).toHaveLength(1);
    expect(candidates.same_month[0].tripId).toBe('t-lisboa');
    expect(candidates.same_month[0].yearsAgo).toBe(3);
    expect(candidates.same_month[0].matchType).toBe('same_month');
    expect(candidates.same_month[0].tierLevel).toBe(2);

    // June trip is neither (different month, no anniversary).
    expect(candidates.same_month.some((capsule) => capsule.tripId === 't-june')).toBe(false);
  });
});

describe('memoryCapsuleEngine · Level 3 thematic', () => {
  const themedDataset = () => ({
    trips: [
      {
        id: 't-themed',
        titulo: 'Sabores de Italia',
        fechaInicio: '2026-01-05',
        fechaFin: '2026-01-08',
        paisCodigo: 'IT',
        vibe: ['gastronomia', 'atardecer'],
        highlights: { topFood: 'Pasta', topView: 'Duomo' },
        companions: ['Ana', { name: 'Luis' }],
        companionType: 'friends',
      },
    ],
    tripDataMap: {
      't-themed': {
        paradas: [
          {
            id: 'roma',
            nombre: 'Roma',
            ciudad: 'Roma',
            paisCodigo: 'IT',
            fechaLlegada: '2026-01-05',
            fechaSalida: '2026-01-08',
            esFavorita: true,
            vibes: ['gastronomia'],
            lugares: [
              { id: 'p1', nombre: 'Trastevere', categoria: 'gastronomia' },
              { id: 'p2', nombre: 'Janículo', categoria: 'mirador' },
            ],
          },
        ],
      },
    },
  });

  it('always yields thematic candidates even for trips less than 1 year old', () => {
    const { trips, tripDataMap } = themedDataset();
    const candidates = buildMemoryCandidates(trips, tripDataMap, REF);

    expect(candidates.exact_day).toHaveLength(0);
    expect(candidates.same_month).toHaveLength(0);
    expect(candidates.thematic_food).toHaveLength(1);
    expect(candidates.thematic_view).toHaveLength(1);
    expect(candidates.thematic_favorite_stop).toHaveLength(1);
    expect(candidates.thematic_companions).toHaveLength(1);
    expect(candidates.thematic_highlight).toHaveLength(1);

    const food = candidates.thematic_food[0];
    expect(food.matchType).toBe('thematic_food');
    expect(food.tierLevel).toBe(3);
    expect(food.yearsAgo).toBe(0);
    expect(food.stopId).toBe('roma');
    expect(food.pois).toHaveLength(2);
    expect(food.pois[0]).toMatchObject({ nombre: 'Trastevere', categoria: 'gastronomia', emoji: '🍽️' });
    expect(food.pois[1]).toMatchObject({ categoria: 'mirador', emoji: '🌅' });
    expect(food.companions).toEqual(['Ana', 'Luis']);
    expect(food.companionType).toBe('friends');
    expect(food.vibes).toEqual(['gastronomia', 'atardecer']);
    expect(food.notificationMeta.title).toBe('El mejor sabor de Sabores de Italia');

    const highlight = candidates.thematic_highlight[0];
    expect(highlight.id).toBe('t-themed::roma::thematic_highlight');
    expect(highlight.headline).toBeNull();
  });

  it('falls back to trip-level thematic highlights when a trip has no stops', () => {
    const trips = [{ id: 't-nostops', titulo: 'Escapada', fechaInicio: '2025-12-01', fechaFin: '2025-12-02' }];
    const candidates = buildMemoryCandidates(trips, {}, REF);

    expect(candidates.thematic_highlight).toHaveLength(1);
    expect(candidates.thematic_highlight[0].stopId).toBeNull();
    expect(candidates.thematic_highlight[0].id).toBe('t-nostops::root::thematic_highlight');
    expect(candidates.thematic_highlight[0].deepLink).toBe('/dashboard?memory=t-nostops');
  });
});


describe('memoryCapsuleEngine · deterministic selection', () => {
  it('returns the documented shape and is stable for the same day', () => {
    const { trips, tripDataMap } = mayDataset();
    const first = selectDailyMemoryCapsule({ trips, tripDataMap, referenceDate: REF });
    const second = selectDailyMemoryCapsule({ trips, tripDataMap, referenceDate: REF });

    expect(Object.keys(first).sort()).toEqual(['allCandidates', 'capsule', 'dateKey', 'totalCandidates']);
    expect(first.dateKey).toBe(REF);
    expect(first.totalCandidates).toBe(first.allCandidates.length);
    expect(first.capsule.matchType).toBe('exact_day');
    expect(second.capsule.id).toBe(first.capsule.id);
    expect(second.totalCandidates).toBe(first.totalCandidates);
  });

  it('hashDailySeed is deterministic and date-specific', () => {
    expect(hashDailySeed('keeptrip-memory::2026-05-04')).toBe(hashDailySeed('keeptrip-memory::2026-05-04'));
    expect(hashDailySeed('keeptrip-memory::2026-05-04')).not.toBe(hashDailySeed('keeptrip-memory::2026-05-05'));
  });

  it('shuffleOffset cycles through every candidate before repeating', () => {
    const trips = ['a', 'b', 'c'].map((id) => ({
      id: `t-${id}`,
      titulo: `Trip ${id}`,
      fechaInicio: '2026-01-05',
      fechaFin: '2026-01-08',
    }));
    const tripDataMap = trips.reduce((acc, trip) => {
      acc[trip.id] = { paradas: [{ id: `stop-${trip.id}`, nombre: `Stop ${trip.id}` }] };
      return acc;
    }, {});

    const base = selectDailyMemoryCapsule({ trips, tripDataMap, referenceDate: REF });
    expect(base.totalCandidates).toBe(3);

    const seen = new Set();
    for (let offset = 1; offset <= base.totalCandidates; offset += 1) {
      const result = selectDailyMemoryCapsule({
        trips,
        tripDataMap,
        referenceDate: REF,
        shuffleOffset: offset,
      });
      seen.add(result.capsule.id);
    }
    expect(seen.size).toBe(base.totalCandidates);
  });

  it('honors forceMode, forcedTripId and forcedStopId with graceful fallback', () => {
    const { trips, tripDataMap } = mayDataset();

    const forced = selectDailyMemoryCapsule({
      trips,
      tripDataMap,
      referenceDate: REF,
      forcedTripId: 't-madrid',
      forcedStopId: 'madrid',
    });
    expect(forced.capsule.tripId).toBe('t-madrid');
    expect(forced.capsule.stopId).toBe('madrid');

    const forcedMode = selectDailyMemoryCapsule({
      trips,
      tripDataMap,
      referenceDate: REF,
      forceMode: 'thematic_highlight',
    });
    expect(forcedMode.capsule.matchType).toBe('thematic_highlight');
    expect(forcedMode.capsule.id).toBe('t-madrid::madrid::thematic_highlight');

    // Empty forced pool falls back to the default highest tier.
    const fallback = selectDailyMemoryCapsule({
      trips,
      tripDataMap,
      referenceDate: REF,
      forceMode: 'thematic_food',
    });
    expect(fallback.capsule.matchType).toBe('exact_day');
  });
});

