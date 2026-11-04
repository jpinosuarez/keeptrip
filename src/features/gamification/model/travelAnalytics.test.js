import { describe, it, expect } from 'vitest';
import {
  computeTravelAnalytics,
  computeTotalKm,
  getEarthLaps,
  computeContinentStats,
  computeCardinalPoles,
  computeFarthestFromHome,
  computeSeasonality,
  computeFidelityStats,
} from './travelAnalytics';

const baseTrips = [{ id: 't1' }, { id: 't2' }];
const baseTripData = {
  t1: {
    titulo: 'Iberia',
    fechaInicio: '2026-03-01',
    fechaFin: '2026-03-05',
    paradas: [
      { nombre: 'Madrid', paisCodigo: 'ES', coordenadas: [-3.7038, 40.4168] },
      { nombre: 'Lisboa', paisCodigo: 'PT', coordenadas: [-9.1393, 38.7223] },
    ],
  },
  t2: {
    titulo: 'Japan',
    fechaInicio: '2025-07-10',
    fechaFin: '2025-07-24',
    paradas: [
      { nombre: 'Tokyo', paisCodigo: 'JP', coordenadas: [139.6917, 35.6895] },
      { nombre: 'Sydney', paisCodigo: 'AU', coordenadas: [151.2093, -33.8688] },
    ],
  },
};

describe('travelAnalytics', () => {
  it('computes the geodesic odometer and Earth laps', () => {
    const km = computeTotalKm(baseTrips, baseTripData);
    expect(km).toBeGreaterThan(0);

    const laps = getEarthLaps(km);
    expect(laps.earthPercentage).toBeGreaterThanOrEqual(0);
    expect(laps.earthPercentage).toBeLessThanOrEqual(100);
    expect(getEarthLaps(0)).toEqual({ earthLaps: 0, earthPercentage: 0 });
  });

  it('groups visited countries into the 5 classical continents', () => {
    const { continents, uniqueCountries } = computeContinentStats(baseTrips, baseTripData);
    expect(uniqueCountries).toBe(4); // ES, PT, JP, AU

    const byCode = Object.fromEntries(continents.map((continent) => [continent.code, continent]));
    expect(byCode.EU.visitedCount).toBe(2); // ES + PT
    expect(byCode.AS.visitedCount).toBe(1); // JP
    expect(byCode.OC.visitedCount).toBe(1); // AU
    expect(byCode.EU.totalCountries).toBe(44);
  });

  it('identifies the 4 cardinal extreme points', () => {
    const poles = computeCardinalPoles(baseTrips, baseTripData);
    expect(poles.north.cityName).toBe('Madrid'); // 40.41
    expect(poles.south.cityName).toBe('Sydney'); // -33.87
    expect(poles.east.cityName).toBe('Sydney'); // 151.2
    expect(poles.west.cityName).toBe('Lisboa'); // -9.14
    expect(poles.north.tripId).toBe('t1');
    expect(poles.north.formattedCoord).toBe('40.42° N, 3.70° O');
    expect(poles.south.formattedCoord).toContain('° S');
    expect(poles.east.formattedCoord).toContain('° E');
    expect(poles.west.formattedCoord).toContain('° O');
  });

  it('computes the farthest point from a configured home base', () => {
    const profile = { baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] } };
    const farthest = computeFarthestFromHome(baseTrips, baseTripData, profile);
    expect(farthest).not.toBeNull();
    expect(farthest.cityName).toBe('Sydney');
    expect(farthest.distanceKm).toBeGreaterThan(8000);
    expect(farthest.homeCityName).toBe('Madrid');
    expect(farthest.latitude).toBeCloseTo(-33.8688, 3);
    expect(farthest.longitude).toBeCloseTo(151.2093, 3);
    expect(farthest.formattedCoord).toBe('33.87° S, 151.21° E');

    expect(computeFarthestFromHome(baseTrips, baseTripData, null)).toBeNull();
  });

  it('attributes travel days across 12 months and finds the peak', () => {
    const seasonality = computeSeasonality(baseTrips, baseTripData);
    expect(seasonality.months).toHaveLength(12);
    expect(seasonality.months[2].trips).toBe(1); // March (t1)
    expect(seasonality.months[6].trips).toBe(1); // July (t2)
    expect(seasonality.months[6].days).toBe(15); // Jul 10-24 inclusive
    expect(seasonality.hasData).toBe(true);
    expect(seasonality.peakMonth).toBe(6); // July (15d) beats March (5d)
  });

  it('computes fidelity: top destinations and local/international split', () => {
    const fidelity = computeFidelityStats(baseTrips, baseTripData, { birthCountry: 'ES', residenceCountry: 'ES' });
    expect(fidelity.topCities.map((city) => city.name)).toEqual(expect.arrayContaining(['Madrid', 'Lisboa']));
    expect(fidelity.topCountries.length).toBeLessThanOrEqual(3);
    // t1 mixes ES + PT (PT is not a home country) => international; t2 international too
    expect(fidelity.localTripsCount).toBe(0);
    expect(fidelity.internationalTripsCount).toBe(2);

    const localFidelity = computeFidelityStats(baseTrips, baseTripData, { birthCountry: 'ES', residenceCountry: 'PT' });
    expect(localFidelity.localTripsCount).toBe(1); // t1 (ES + PT are both home countries)
  });

  it('filters every dimension by the selected year', () => {
    const all = computeTravelAnalytics({ trips: baseTrips, tripData: baseTripData, selectedYear: 'all' });
    expect(all.totalTrips).toBe(2);
    expect(all.availableYears).toEqual([2026, 2025]);

    const year2025 = computeTravelAnalytics({ trips: baseTrips, tripData: baseTripData, selectedYear: '2025' });
    expect(year2025.totalTrips).toBe(1);
    expect(year2025.yearBanner.year).toBe(2025);
    expect(year2025.yearBanner.totalDays).toBe(15);
    expect(year2025.yearBanner.percentage).toBeGreaterThan(0);
    expect(year2025.uniqueCountries).toBe(2); // JP + AU
  });

  it('orchestrates pace buckets and longest trip', () => {
    const result = computeTravelAnalytics({ trips: baseTrips, tripData: baseTripData });
    expect(result.totalDays).toBe(20); // 5 + 15
    expect(result.averageDaysPerTrip).toBe(10);
    expect(result.longestTrip.id).toBe('t2');
    expect(result.pace.medium).toBe(1); // 5 days
    expect(result.pace.long).toBe(1); // 15 days
    expect(result.pace.short).toBe(0);
    expect(result.avgKmPerTrip).toBeGreaterThan(0);
  });

  it('returns a graceful zero-slop payload when there are no trips', () => {
    const empty = computeTravelAnalytics({ trips: [], tripData: {} });
    expect(empty.hasTrips).toBe(false);
    expect(empty.totalKm).toBe(0);
    expect(empty.farthestFromHome).toBeNull();
    expect(empty.poles.north).toBeNull();
    expect(empty.seasonality.hasData).toBe(false);
    expect(empty.longestTrip).toBeNull();
    expect(empty.yearBanner).toBeNull();
  });
});
