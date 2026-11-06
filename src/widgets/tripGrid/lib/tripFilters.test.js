/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import {
  applyTripFilters,
  buildCountryOptions,
  buildYearOptions,
  classifyDuration,
  classifyScope,
  getTripCountries,
  groupTripsByYear,
  isTripComplete,
  normalizeForSearch,
  matchesCompanionFilter,
} from './tripFilters';

const currentYear = new Date().getFullYear();

const trips = [
  { id: 't1', titulo: 'Japón', fechaInicio: '2025-04-01', fechaFin: '2025-04-03', paisCodigo: 'JP' },
  { id: 't2', titulo: 'Ruta Europa', fechaInicio: '2024-06-01', fechaFin: '2024-06-30', code: 'HU' },
  { id: 't3', titulo: 'Escapada Madrid', fechaInicio: `${currentYear}-02-10`, fechaFin: `${currentYear}-02-12` },
  { id: 't4', titulo: '', fechaInicio: '2024-06-05', fechaFin: '2024-06-20' },
  { id: 't5', titulo: 'Semana', fechaInicio: '2023-05-01', fechaFin: '2023-05-07', paisCodigo: 'FR' },
];

const tripData = {
  t1: {
    id: 't1',
    titulo: 'Japón',
    fechaInicio: '2025-04-01',
    fechaFin: '2025-04-03',
    foto: 'https://cdn/cover-jp.jpg',
    texto: 'Templos y ramen',
    paradas: [
      { nombre: 'Tokio', paisCodigo: 'JP' },
      { nombre: 'Kioto', paisCodigo: 'JP' },
    ],
  },
  t2: {
    id: 't2',
    titulo: 'Ruta Europa',
    fechaInicio: '2024-06-01',
    fechaFin: '2024-06-30',
    foto: 'https://cdn/cover-eu.jpg',
    texto: 'Gran ruta',
    paradas: [
      { nombre: 'Budapest', paisCodigo: 'HU' },
      { nombre: 'Praga', paisCodigo: 'CZ' },
    ],
  },
  t3: {
    id: 't3',
    titulo: 'Escapada Madrid',
    fechaInicio: `${currentYear}-02-10`,
    fechaFin: `${currentYear}-02-12`,
    foto: 'https://cdn/cover-es.jpg',
    texto: 'Tapas',
    paradas: [{ nombre: 'Madrid', paisCodigo: 'ES' }],
  },
  t4: {
    id: 't4',
    nombreEspanol: 'Japón',
    fechaInicio: '2024-06-05',
    fechaFin: '2024-06-20',
    paradas: [{ nombre: 'Osaka', paisCodigo: 'JP' }],
  },
  t5: {
    id: 't5',
    titulo: 'Semana',
    fechaInicio: '2023-05-01',
    fechaFin: '2023-05-07',
    paradas: [{ nombre: 'París', paisCodigo: 'FR' }],
  },
};

const run = (overrides = {}) => applyTripFilters({ trips, tripData, ...overrides });
const ids = (result) => result.map((trip) => trip.id).sort();

describe('tripFilters helpers', () => {
  it('normalizeForSearch strips accents and lowercases', () => {
    expect(normalizeForSearch('Japón')).toBe('japon');
    expect(normalizeForSearch('  PRAGA ')).toBe('praga');
  });

  it('getTripCountries is stop-first with root fallback', () => {
    expect(getTripCountries(tripData.t2).sort()).toEqual(['CZ', 'HU']);
    expect(getTripCountries(tripData.t3)).toEqual(['ES']);
  });

  it('classifyDuration maps to short / medium / long buckets', () => {
    expect(classifyDuration(3)).toBe('short');
    expect(classifyDuration(7)).toBe('medium');
    expect(classifyDuration(20)).toBe('long');
    expect(classifyDuration(0)).toBeNull();
  });

  it('classifyScope compares trip countries against profile roots', () => {
    const profile = { residenceCountry: 'ES', birthCountry: 'ES' };
    expect(classifyScope(tripData.t3, profile)).toBe('local');
    expect(classifyScope(tripData.t1, profile)).toBe('international');
  });

  it('isTripComplete requires cover + narrative notes', () => {
    expect(isTripComplete(tripData.t1)).toBe(true);
    expect(isTripComplete(tripData.t4)).toBe(false);
  });
});

describe('applyTripFilters — search', () => {
  it('matches accent-insensitively by title', () => {
    expect(ids(run({ searchQuery: 'japon' }))).toEqual(['t1', 't4']);
  });

  it('matches stop/city names', () => {
    expect(ids(run({ searchQuery: 'budapest' }))).toEqual(['t2']);
  });

  it('matches localized country names', () => {
    expect(ids(run({ searchQuery: 'hungria', i18nLang: 'es' }))).toEqual(['t2']);
  });
});

describe('applyTripFilters — 5D combinations', () => {
  it('filters by specific year', () => {
    expect(ids(run({ year: '2025' }))).toEqual(['t1']);
  });

  it('filters by this year', () => {
    expect(ids(run({ year: 'thisYear' }))).toEqual(['t3']);
  });

  it('filters by country code', () => {
    expect(ids(run({ country: 'JP' }))).toEqual(['t1', 't4']);
  });

  it('filters by geographic scope', () => {
    const profile = { residenceCountry: 'ES' };
    expect(ids(run({ scope: 'local', userProfile: profile }))).toEqual(['t3']);
    expect(ids(run({ scope: 'international', userProfile: profile }))).toEqual([
      't1',
      't2',
      't4',
      't5',
    ]);
  });

  it('filters by duration bucket', () => {
    expect(ids(run({ duration: 'short' }))).toEqual(['t1', 't3']);
    expect(ids(run({ duration: 'medium' }))).toEqual(['t5']);
    expect(ids(run({ duration: 'long' }))).toEqual(['t2', 't4']);
  });

  it('filters by curation status', () => {
    expect(ids(run({ curation: 'complete' }))).toEqual(['t1', 't2', 't3']);
    expect(ids(run({ curation: 'incomplete' }))).toEqual(['t4', 't5']);
  });

  it('AND-combines multiple active filters', () => {
    expect(ids(run({ year: '2024', duration: 'long', country: 'CZ' }))).toEqual(['t2']);
  });
});

describe('applyTripFilters — sorting', () => {
  it('sorts most recent first (default)', () => {
    expect(run().map((trip) => trip.id)).toEqual(['t3', 't1', 't4', 't2', 't5']);
  });

  it('sorts oldest first', () => {
    expect(run({ sort: 'oldest' }).map((trip) => trip.id)).toEqual([
      't5',
      't2',
      't4',
      't1',
      't3',
    ]);
  });

  it('sorts by duration descending', () => {
    expect(run({ sort: 'duration' }).map((trip) => trip.id)).toEqual([
      't2',
      't4',
      't5',
      't1',
      't3',
    ]);
  });

  it('sorts by stop count descending', () => {
    expect(run({ sort: 'stops' }).map((trip) => trip.id)).toEqual([
      't1',
      't2',
      't3',
      't4',
      't5',
    ]);
  });
});

describe('buildCountryOptions & buildYearOptions', () => {
  it('derives only non-empty dynamic country options with counts', () => {
    const options = buildCountryOptions(trips, tripData, 'es');
    const jp = options.find((option) => option.code === 'JP');
    expect(jp).toBeTruthy();
    expect(jp.count).toBe(2);
    expect(options.every((option) => option.count > 0)).toBe(true);
  });

  it('extracts distinct years in descending order', () => {
    expect(buildYearOptions(trips, tripData)).toEqual([currentYear, 2025, 2024, 2023]);
  });
});

describe('groupTripsByYear', () => {
  it('groups by year with annual telemetry', () => {
    const groups = groupTripsByYear(trips, tripData);
    expect(groups.map((group) => group.year)).toEqual([currentYear, 2025, 2024, 2023]);

    const group2024 = groups.find((group) => group.year === 2024);
    expect(group2024.totalTrips).toBe(2);
    expect(group2024.totalDays).toBe(46); // 30 + 16
    expect(group2024.uniqueCountries.sort()).toEqual(['CZ', 'HU', 'JP']);
  });

  it('sorts year groups ascending when sort is "oldest"', () => {
    const groups = groupTripsByYear(trips, tripData, 'oldest');
    expect(groups.map((group) => group.year)).toEqual([2023, 2024, 2025, currentYear]);
  });
});

describe('matchesCompanionFilter & companion dimension', () => {
  it('matches by companionType', () => {
    expect(matchesCompanionFilter({ companionType: 'couple' }, 'couple')).toBe(true);
    expect(matchesCompanionFilter({ companionType: 'solo' }, 'family')).toBe(false);
  });

  it('matches by companion name (string or object)', () => {
    expect(matchesCompanionFilter({ companions: ['Valeria', { name: 'Lucas' }] }, 'Lucas')).toBe(true);
    expect(matchesCompanionFilter({ companions: ['Valeria'] }, 'Pedro')).toBe(false);
  });

  it('treats "all"/empty as a no-op', () => {
    expect(matchesCompanionFilter({}, 'all')).toBe(true);
    expect(matchesCompanionFilter({}, '')).toBe(true);
  });

  it('applyTripFilters honours the companion dimension', () => {
    const data = {
      t1: { ...tripData.t1, companionType: 'couple' },
      t2: { ...tripData.t2, companionType: 'solo' },
    };
    const result = applyTripFilters({
      trips: [trips[0], trips[1]],
      tripData: data,
      companion: 'couple',
    });
    expect(result.map((trip) => trip.id)).toEqual(['t1']);
  });
});
