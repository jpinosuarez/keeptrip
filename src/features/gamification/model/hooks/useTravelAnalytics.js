import { useMemo } from 'react';
import { computeTravelAnalytics } from '../travelAnalytics';

const EMPTY_TRIPS = [];
const EMPTY_TRIP_DATA = {};

/**
 * React wrapper around the pure `computeTravelAnalytics` engine.
 * 100% in-memory — recomputes only when inputs or the year filter change.
 *
 * @param {object} params
 * @param {Array<object>} [params.trips]
 * @param {object} [params.tripData]
 * @param {object|null} [params.userProfile]
 * @param {'all'|string} [params.selectedYear]
 */
export const useTravelAnalytics = ({
  trips = EMPTY_TRIPS,
  tripData = EMPTY_TRIP_DATA,
  userProfile = null,
  selectedYear = 'all',
} = {}) => {
  const safeTrips = Array.isArray(trips) ? trips : EMPTY_TRIPS;
  const safeTripData = tripData && typeof tripData === 'object' ? tripData : EMPTY_TRIP_DATA;

  return useMemo(
    () => computeTravelAnalytics({
      trips: safeTrips,
      tripData: safeTripData,
      userProfile,
      selectedYear,
    }),
    [safeTrips, safeTripData, userProfile, selectedYear]
  );
};

export default useTravelAnalytics;
