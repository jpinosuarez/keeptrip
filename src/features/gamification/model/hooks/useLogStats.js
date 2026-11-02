import { useMemo } from 'react';
import { calculateTripDays } from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { useAuth } from '@app/providers/AuthContext';

const EMPTY_TRIPS = [];
const EMPTY_TRIP_DATA = {};

const getTripStops = (trip, tripDetails) => {
  if (Array.isArray(tripDetails?.paradas)) return tripDetails.paradas;
  if (Array.isArray(trip?.paradas)) return trip.paradas;
  if (tripDetails?.paradas && typeof tripDetails.paradas === 'object') return Object.values(tripDetails.paradas);
  if (trip?.paradas && typeof trip.paradas === 'object') return Object.values(trip.paradas);
  return [];
};

export const useLogStats = (trips = [], tripData = {}, customProfile = null) => {
  const safeTrips = Array.isArray(trips) ? trips : EMPTY_TRIPS;
  const safeTripData = tripData && typeof tripData === 'object' ? tripData : EMPTY_TRIP_DATA;
  const auth = useAuth() || {};
  const effectiveProfile = customProfile || auth.userProfile || null;

  return useMemo(() => {
    const birthCountry = normalizeCountryCode(effectiveProfile?.birthCountry) || null;
    const residenceCountry = normalizeCountryCode(effectiveProfile?.residenceCountry) || null;
    const homeCountriesSet = new Set([birthCountry, residenceCountry].filter(Boolean));
    const hasCompletedOnboarding = Boolean(effectiveProfile?.hasCompletedOnboarding);

    if (safeTrips.length === 0) {
      return {
        worldExploredPercentage: '0.0',
        uniqueCountries: 0,
        completedTrips: 0,
        totalDays: 0,
        totalStops: 0,
        localTripsCount: 0,
        internationalTripsCount: 0,
        localStopsCount: 0,
        hasCompletedOnboarding,
        birthCountry,
        residenceCountry,
      };
    }

    const viajes = safeTrips.map((trip) => {
      const tripDetails = safeTripData[trip.id] || {};
      return { ...trip, ...tripDetails };
    });

    const totalStops = viajes.reduce((acc, viaje) => {
      const stops = getTripStops(viaje, viaje);
      if (stops.length > 0) return acc + stops.length;
      return acc + (Number.isFinite(viaje.totalParadas) ? viaje.totalParadas : 0);
    }, 0);

    let totalDays = 0;
    const countryCodes = new Set();
    let localTripsCount = 0;
    let localStopsCount = 0;

    viajes.forEach((viaje) => {
      const stops = getTripStops(viaje, viaje);
      const startDate = viaje.fechaInicio || viaje.startDate || viaje.date;
      const endDate = viaje.fechaFin || viaje.endDate;

      totalDays += calculateTripDays(startDate, endDate);

      const tripCountries = [];

      stops.forEach((stop) => {
        const rawCode = stop?.paisCodigo || stop?.countryCode || stop?.code;
        const normCode = normalizeCountryCode(rawCode);
        if (normCode) {
          countryCodes.add(normCode);
          tripCountries.push(normCode);
          if (homeCountriesSet.has(normCode)) {
            localStopsCount += 1;
          }
        }
      });

      const rawTripCode = viaje.paisCodigo || viaje.countryCode || viaje.code;
      const normTripCode = normalizeCountryCode(rawTripCode);
      if (normTripCode) {
        countryCodes.add(normTripCode);
        tripCountries.push(normTripCode);
      }

      if (
        homeCountriesSet.size > 0 &&
        tripCountries.length > 0 &&
        tripCountries.every((c) => homeCountriesSet.has(c))
      ) {
        localTripsCount += 1;
      }
    });

    const uniqueCountries = countryCodes.size;
    const worldExploredPercentage = ((uniqueCountries / 195) * 100).toFixed(1);
    const completedTrips = safeTrips.length;
    const internationalTripsCount = Math.max(0, completedTrips - localTripsCount);

    return {
      worldExploredPercentage,
      uniqueCountries,
      completedTrips,
      totalDays,
      totalStops,
      localTripsCount,
      internationalTripsCount,
      localStopsCount,
      hasCompletedOnboarding,
      birthCountry,
      residenceCountry,
    };
  }, [safeTrips, safeTripData, effectiveProfile]);
};

export default useLogStats;