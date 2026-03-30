import { useMemo } from 'react';

let getContinents;
let getContinentsResolved = false;

const resolveGetContinents = () => {
  if (getContinentsResolved) return;
  getContinentsResolved = true;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    ({ getContinents } = require('@features/gamification/model/achievementsEngine'));
  } catch {
    getContinents = (codes) => new Set(codes);
  }
};

// Resolve on module load
resolveGetContinents();

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const EMPTY_TRIPS = [];
const EMPTY_TRIP_DATA = {};

const getTripDuration = (tripDetails) => {
  if (!tripDetails?.startDate || !tripDetails?.endDate) {
    return 1;
  }

  const startDate = new Date(tripDetails.startDate);
  const endDate = new Date(tripDetails.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 1;
  }

  const diffInDays = Math.ceil((endDate - startDate) / DAY_IN_MS) + 1;
  return diffInDays > 0 ? diffInDays : 1;
};

const countTripCities = (tripDetails) => {
  if (!tripDetails?.cities) {
    return 0;
  }

  return tripDetails.cities
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean)
    .length;
};

export const useLogStats = (trips = [], tripData = {}) => {
  const safeTrips = Array.isArray(trips) ? trips : EMPTY_TRIPS;
  const safeTripData = tripData && typeof tripData === 'object' ? tripData : EMPTY_TRIP_DATA;

  return useMemo(() => {
    if (safeTrips.length === 0) {
      return {
        tripCount: 0,
        totalDays: 0,
        totalCities: 0,
        percentOfWorld: 0,
        averageRating: null,
        continents: 0,
        longestTrip: 0,
        totalPhotos: 0,
      };
    }

    let totalDays = 0;
    let totalCities = 0;
    let ratingSum = 0;
    let ratedTripCount = 0;
    let longestDays = 0;
    let totalPhotos = 0;
    const continentCodes = new Set();

    safeTrips.forEach((trip) => {
      const tripDetails = safeTripData[trip.id];

      const duration = getTripDuration(tripDetails);
      totalDays += duration;
      if (duration > longestDays) longestDays = duration;

      totalCities += countTripCities(tripDetails);

      const rating = Number(tripDetails?.rating);
      if (!Number.isNaN(rating) && rating > 0) {
        ratingSum += rating;
        ratedTripCount += 1;
      }

      // gather country codes for continents lookup
      if (tripDetails?.code) {
        continentCodes.add(tripDetails.code);
      } else if (trip.code) {
        continentCodes.add(trip.code);
      }

      // count photos if present in trip record itself or details
      if (Array.isArray(tripDetails?.gallery)) totalPhotos += tripDetails.gallery.length;
      else if (Array.isArray(tripDetails?.fotos)) totalPhotos += tripDetails.fotos.length;
      else if (Array.isArray(trip.gallery)) totalPhotos += trip.gallery.length;
      else if (Array.isArray(trip.fotos)) totalPhotos += trip.fotos.length;
    });

    const averageRating = ratedTripCount > 0 ? ratingSum / ratedTripCount : 0;

    // Calculate % of World (ISO 3166-1: 195 recognized countries)
    const uniqueCountries = continentCodes.size;
    const percentOfWorld = Number(((uniqueCountries / 195) * 100).toFixed(1));

    // convert continent codes to count via achievementsEngine helper
    const continents = getContinents([...continentCodes]).size;

    return {
      tripCount: safeTrips.length,
      totalDays,
      totalCities,
      percentOfWorld,
      averageRating: averageRating > 0 ? averageRating.toFixed(1) : null,
      continents,
      longestTrip: longestDays,
      totalPhotos,
    };
  }, [safeTrips, safeTripData]);
};

export default useLogStats;