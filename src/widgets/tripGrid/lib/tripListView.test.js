/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { groupTripsByYear } from './tripFilters';

const trips = [
  { id: 'a', fechaInicio: '2026-03-01', fechaFin: '2026-03-10' },
  { id: 'b', fechaInicio: '2026-07-01', fechaFin: '2026-07-05' },
  { id: 'c', fechaInicio: '2025-05-01', fechaFin: '2025-05-20' },
  { id: 'undated', titulo: 'Sin fechas' },
];

const tripData = {
  a: {
    id: 'a',
    fechaInicio: '2026-03-01',
    fechaFin: '2026-03-10',
    paradas: [{ nombre: 'Roma', paisCodigo: 'IT' }],
  },
  b: {
    id: 'b',
    fechaInicio: '2026-07-01',
    fechaFin: '2026-07-05',
    paradas: [{ nombre: 'París', paisCodigo: 'FR' }],
  },
  c: {
    id: 'c',
    fechaInicio: '2025-05-01',
    fechaFin: '2025-05-20',
    paradas: [
      { nombre: 'Tokio', paisCodigo: 'JP' },
      { nombre: 'Kioto', paisCodigo: 'JP' },
    ],
  },
  undated: { id: 'undated', titulo: 'Sin fechas', paradas: [] },
};

describe('groupTripsByYear', () => {
  it('groups by year in descending order and pushes undated trips last', () => {
    const groups = groupTripsByYear(trips, tripData);

    expect(groups.map((group) => group.year)).toEqual([2026, 2025, null]);
    expect(groups[0].trips.map((trip) => trip.id)).toEqual(['a', 'b']);
    expect(groups[1].trips.map((trip) => trip.id)).toEqual(['c']);
    expect(groups[2].trips.map((trip) => trip.id)).toEqual(['undated']);
  });

  it('computes annual telemetry: trip count, total days and unique countries', () => {
    const groups = groupTripsByYear(trips, tripData);
    const group2026 = groups.find((group) => group.year === 2026);

    expect(group2026.totalTrips).toBe(2);
    expect(group2026.totalDays).toBe(15); // 10 + 5
    expect(group2026.uniqueCountries.sort()).toEqual(['FR', 'IT']);

    const group2025 = groups.find((group) => group.year === 2025);
    expect(group2025.totalDays).toBe(20);
    expect(group2025.uniqueCountries).toEqual(['JP']);
  });

  it('sorts year groups ascending when sort is "oldest" (undated stays last)', () => {
    const groups = groupTripsByYear(trips, tripData, 'oldest');
    expect(groups.map((group) => group.year)).toEqual([2025, 2026, null]);
  });

  it('returns an empty array for no trips', () => {
    expect(groupTripsByYear([], {})).toEqual([]);
  });
});
