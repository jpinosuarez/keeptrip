/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLogStats } from './useLogStats';

describe('useLogStats', () => {
  it('returns an empty summary when trips are empty', () => {
    const { result } = renderHook(() => useLogStats([], {}));

    expect(result.current).toEqual({
      worldExploredPercentage: '0.0',
      uniqueCountries: 0,
      completedTrips: 0,
      totalDays: 0,
      totalStops: 0,
      localTripsCount: 0,
      internationalTripsCount: 0,
      localStopsCount: 0,
      hasCompletedOnboarding: false,
      birthCountry: null,
      residenceCountry: null,
    });
  });

  it('computes storytelling stats from trip data', () => {
    const trips = [{ id: 'trip-1' }, { id: 'trip-2' }];
    const tripData = {
      'trip-1': {
        fechaInicio: '2026-01-10',
        fechaFin: '2026-01-12',
        paradas: [{ paisCodigo: 'ES' }, { paisCodigo: 'PT' }],
        totalParadas: 2,
      },
      'trip-2': {
        fechaInicio: '2026-02-01',
        fechaFin: '2026-02-03',
        paradas: [{ paisCodigo: 'PT' }, { paisCodigo: 'FR' }, { paisCodigo: 'FR' }],
        totalParadas: 3,
      },
    };

    const { result } = renderHook(() => useLogStats(trips, tripData));

    expect(result.current).toMatchObject({
      worldExploredPercentage: '1.5',
      uniqueCountries: 3,
      completedTrips: 2,
      totalDays: 6,
      totalStops: 5,
    });
  });

  it('falls back to totalParadas when paradas are missing', () => {
    const trips = [{ id: 'trip-1' }];
    const tripData = {
      'trip-1': {
        fechaInicio: '2026-03-01',
        fechaFin: '2026-03-02',
        totalParadas: 4,
        paisCodigo: 'AR',
      },
    };

    const { result } = renderHook(() => useLogStats(trips, tripData));

    expect(result.current.totalStops).toBe(4);
    expect(result.current.uniqueCountries).toBe(1);
  });

  it('counts stops when paradas are stored as object map', () => {
    const trips = [{ id: 'trip-1' }];
    const tripData = {
      'trip-1': {
        fechaInicio: '2026-04-01',
        fechaFin: '2026-04-01',
        paradas: {
          p1: { paisCodigo: 'CL' },
          p2: { paisCodigo: 'PE' },
          p3: { paisCodigo: 'CL' },
        },
      },
    };

    const { result } = renderHook(() => useLogStats(trips, tripData));

    expect(result.current.totalStops).toBe(3);
    expect(result.current.uniqueCountries).toBe(2);
  });

  it('correctly tracks domestic vs international trips without inflating uniqueCountries for unvisited home countries', () => {
    const profile = {
      birthCountry: 'AR',
      residenceCountry: 'DE',
      hasCompletedOnboarding: true,
    };

    // User has trips in Argentina (domestic) and France (international)
    // Germany (residence) has NO trips logged
    const trips = [{ id: 'trip-ar' }, { id: 'trip-fr' }];
    const tripData = {
      'trip-ar': {
        fechaInicio: '2026-05-01',
        fechaFin: '2026-05-05',
        paradas: [{ paisCodigo: 'AR' }, { paisCodigo: 'AR' }],
      },
      'trip-fr': {
        fechaInicio: '2026-06-01',
        fechaFin: '2026-06-05',
        paradas: [{ paisCodigo: 'FR' }],
      },
    };

    const { result } = renderHook(() => useLogStats(trips, tripData, profile));

    // Only AR and FR are unique countries (DE is NOT counted because no trips logged there)
    expect(result.current.uniqueCountries).toBe(2);
    expect(result.current.completedTrips).toBe(2);
    expect(result.current.localTripsCount).toBe(1);
    expect(result.current.internationalTripsCount).toBe(1);
    expect(result.current.localStopsCount).toBe(2);
    expect(result.current.hasCompletedOnboarding).toBe(true);
    expect(result.current.birthCountry).toBe('AR');
    expect(result.current.residenceCountry).toBe('DE');
  });
});