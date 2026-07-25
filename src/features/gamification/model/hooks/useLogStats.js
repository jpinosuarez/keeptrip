import { useMemo } from 'react';
import { calculateTripDays } from '@shared/lib/utils/viajeUtils';

const EMPTY_TRIPS = [];
const EMPTY_TRIP_DATA = {};

const getTripStops = (trip, tripDetails) => {
  if (Array.isArray(tripDetails?.paradas)) return tripDetails.paradas;
  if (Array.isArray(trip?.paradas)) return trip.paradas;
  if (tripDetails?.paradas && typeof tripDetails.paradas === 'object') return Object.values(tripDetails.paradas);
  if (trip?.paradas && typeof trip.paradas === 'object') return Object.values(trip.paradas);
  return [];
};

export const useLogStats = (trips = [], tripData = {}) => {
  const safeTrips = Array.isArray(trips) ? trips : EMPTY_TRIPS;
  const safeTripData = tripData && typeof tripData === 'object' ? tripData : EMPTY_TRIP_DATA;

  return useMemo(() => {
    if (safeTrips.length === 0) {
      return {
        worldExploredPercentage: '0.0',
        uniqueCountries: 0,
        completedTrips: 0,
        totalDays: 0,
        totalStops: 0,
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

    viajes.forEach((viaje) => {
      const stops = getTripStops(viaje, viaje);
      const startDate = viaje.fechaInicio || viaje.startDate || viaje.date;
      const endDate = viaje.fechaFin || viaje.endDate;

      totalDays += calculateTripDays(startDate, endDate);


      stops.forEach((stop) => {
        const stopCountryCode = stop?.paisCodigo || stop?.countryCode || stop?.code;
        if (stopCountryCode) countryCodes.add(stopCountryCode);
      });

      const tripCountryCode = viaje.paisCodigo || viaje.countryCode || viaje.code;
      if (tripCountryCode) countryCodes.add(tripCountryCode);
    });

    const uniqueCountries = countryCodes.size;
    const worldExploredPercentage = ((uniqueCountries / 195) * 100).toFixed(1);

    return {
      worldExploredPercentage,
      uniqueCountries,
      completedTrips: safeTrips.length,
      totalDays,
      totalStops,
    };
  }, [safeTrips, safeTripData]);
};

export default useLogStats;