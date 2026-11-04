import { calculateTripXP } from '@features/gamification/model/travelerLevel';
import {
  calculateTripDays,
  esParadaEscapada,
  formatDateRange,
  haversineKm,
} from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';

/** @type {number} Maximum stop slides per deck. */
export const MAX_STOP_SLIDES = 4;

/** @type {number} Auto-advance duration for each story slide (ms). */
export const STORY_SLIDE_DURATION_MS = 4500;

/**
 * Formats a kilometre amount using Spanish thousands dots (1.240 km).
 * @param {number} km
 * @returns {string}
 */
export const formatKmLabel = (km) => {
  const rounded = Math.max(0, Math.round(Number(km) || 0));
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km`;
};

const STOP_COUNTRY_FIELDS = ['paisCodigo', 'countryCode', 'codigoPais', 'pais', 'country'];

/**
 * Resolves the primary ISO-2 country code of a trip.
 *
 * STOP-FIRST: when stops exist, their country fields are the only valid source
 * (stale root metadata such as `viaje.paisCodigo = 'DE'` must never leak into a
 * HU/CZ trip). Root trip fields are only used when there are no stops.
 *
 * @param {Object} viaje
 * @param {Array<Object>} paradas
 * @returns {string|null}
 */
export const resolveTripCountryCode = (viaje = {}, paradas = []) => {
  const stops = Array.isArray(paradas) ? paradas.filter(Boolean) : [];

  if (stops.length > 0) {
    for (const stop of stops) {
      for (const field of STOP_COUNTRY_FIELDS) {
        const iso2 = normalizeCountryCode(stop?.[field]);
        if (iso2) return iso2;
      }
    }
    // Stops exist but none carry a country: never fall back to root metadata.
    return null;
  }

  return normalizeCountryCode(
    viaje?.paisCodigo || viaje?.code || viaje?.countryCode || null
  );
};

/**
 * Home connection status for the hero badge and the route story slide.
 * - `local` when the trip country matches birth/residence country.
 * - `distance` when international and the profile has a base city.
 * - `null` when there is not enough profile data.
 *
 * @param {{ viaje?: Object, paradasOrdenadas?: Array<Object>, userProfile?: Object|null }} input
 * @returns {{ type: 'local' } | { type: 'distance', distanceKm: number, baseCityName: string|null } | null}
 */
export const getHomeConnectionStatus = ({
  viaje = {},
  paradasOrdenadas = [],
  userProfile = null,
} = {}) => {
  if (!userProfile) return null;

  const stops = Array.isArray(paradasOrdenadas) ? paradasOrdenadas : [];
  const tripCountry = resolveTripCountryCode(viaje, stops);
  const birthCountry = normalizeCountryCode(userProfile?.birthCountry || null);
  const residenceCountry = normalizeCountryCode(userProfile?.residenceCountry || null);

  const isLocal =
    Boolean(tripCountry) &&
    ((birthCountry && tripCountry === birthCountry) ||
      (residenceCountry && tripCountry === residenceCountry));

  if (isLocal) return { type: 'local' };

  const baseCity = userProfile?.baseCity;
  const baseCoordinates = baseCity?.coordinates;
  const firstCoordinates = stops.find(
    (parada) => Array.isArray(parada?.coordenadas) && parada.coordenadas.length >= 2
  )?.coordenadas;

  if (Array.isArray(baseCoordinates) && baseCoordinates.length >= 2 && firstCoordinates) {
    return {
      type: 'distance',
      distanceKm: Math.round(haversineKm(baseCoordinates, firstCoordinates)),
      baseCityName: baseCity?.name || null,
    };
  }

  return null;
};

/**
 * Picks up to `max` entries spread evenly across the stops array while
 * preserving their original indexes (for day-trip detection).
 */
const pickEvenly = (stops, max) => {
  if (max <= 0 || stops.length === 0) return [];
  if (stops.length <= max) return stops.map((item, index) => ({ item, index }));

  const picked = [];
  for (let i = 0; i < max; i += 1) {
    const index = Math.round((i * (stops.length - 1)) / (max - 1));
    picked.push({ item: stops[index], index });
  }

  return picked.filter(
    (entry, position) => picked.findIndex((other) => other.index === entry.index) === position
  );
};

/**
 * Builds the Instagram-Stories deck for a trip: 3 to 7 non-empty slides.
 *
 * Slide order: Cover -> Route/Telemetry -> up to 4 Stop slides ->
 * (Highlights/Context only when present) -> Finale.
 *
 * @param {{ viaje?: Object, paradasOrdenadas?: Array<Object>, photos?: Array<Object>, telemetry?: Object|null, userProfile?: Object|null }} input
 * @returns {Array<Object>}
 */
export const buildTripStoryDeck = ({
  viaje = {},
  paradasOrdenadas = [],
  photos = [],
  telemetry = null,
  userProfile = null,
} = {}) => {
  const stops = Array.isArray(paradasOrdenadas) ? paradasOrdenadas.filter(Boolean) : [];
  const photoList = (Array.isArray(photos) ? photos : []).filter(
    (photo) => photo && typeof photo.url === 'string' && photo.url
  );

  const countryCode = resolveTripCountryCode(viaje, stops);
  const homeStatus = getHomeConnectionStatus({ viaje, paradasOrdenadas: stops, userProfile });

  const totalKm = Number.isFinite(telemetry?.totalKm) ? telemetry.totalKm : 0;
  const totalDays =
    Number.isFinite(telemetry?.totalDays) && telemetry.totalDays > 0
      ? telemetry.totalDays
      : calculateTripDays(viaje?.fechaInicio, viaje?.fechaFin) || 0;
  const totalStops = Number.isFinite(telemetry?.totalStops) ? telemetry.totalStops : stops.length;

  const highlights = viaje?.highlights || {};
  const hasHighlights = Boolean(highlights.topFood || highlights.topView || highlights.topTip);
  const companions = (Array.isArray(viaje?.companions) ? viaje.companions : []).filter(Boolean);
  const weather =
    (typeof viaje?.weather === 'string' && viaje.weather.trim()) ||
    stops.find((parada) => parada?.clima?.desc)?.clima?.desc ||
    null;
  const hasContext = hasHighlights || companions.length > 0 || Boolean(weather);

  const coverPhoto =
    (typeof viaje?.foto === 'string' && viaje.foto.trim()) || photoList[0]?.url || null;

  const slides = [];

  // 1) Cover
  slides.push({
    id: 'cover',
    type: 'cover',
    title: viaje?.titulo || '',
    image: coverPhoto,
    countryCode,
    dates: formatDateRange(viaje?.fechaInicio, viaje?.fechaFin),
    totalDays,
  });

  // 2) Route & Telemetry
  slides.push({
    id: 'route',
    type: 'route',
    countryCode,
    stopNames: stops.map((parada) => parada?.nombre).filter(Boolean),
    totalKm,
    totalDays,
    totalStops,
    homeStatus,
  });

  // 3) Stop slides (up to 4; 3 when a context slide is also present to respect max 7)
  const stopSlideBudget = hasContext ? Math.min(MAX_STOP_SLIDES, 3) : MAX_STOP_SLIDES;
  pickEvenly(stops, stopSlideBudget).forEach(({ item: parada, index }) => {
    const previousStop = index > 0 ? stops[index - 1] : null;
    // All gallery photos tagged to this stop (dual-entry photo flow).
    const stopPhotos = photoList.filter(
      (photo) => photo?.paradaId === parada?.id || photo?.stopId === parada?.id
    );
    const linkedPhoto = stopPhotos[0] || photoList.find(
      (photo) => photo?.stopId === parada?.id || photo?.paradaId === parada?.id
    );
    const note =
      (typeof parada?.titular === 'string' && parada.titular.trim()) ||
      (typeof parada?.notaCorta === 'string' && parada.notaCorta.trim()) ||
      (typeof parada?.nota === 'string' && parada.nota.trim().slice(0, 180)) ||
      (typeof parada?.relato === 'string' && parada.relato.trim().slice(0, 180)) ||
      '';

    slides.push({
      id: `stop-${parada?.id || index}`,
      type: 'stop',
      stopNumber: index + 1,
      title: parada?.nombre || '',
      subtitle: formatDateRange(parada?.fechaLlegada || parada?.fecha, parada?.fechaSalida),
      note,
      image: (typeof parada?.foto === 'string' && parada.foto) || linkedPhoto?.url || null,
      photos: stopPhotos.map((photo) => photo.url).filter(Boolean),
      favorite: Boolean(parada?.esFavorita),
      vibes: Array.isArray(parada?.vibes) ? parada.vibes.filter(Boolean) : [],
      lugares: Array.isArray(parada?.lugares) ? parada.lugares.filter(Boolean) : [],
      dayTripFrom:
        previousStop && esParadaEscapada(parada, previousStop) ? previousStop?.nombre || null : null,
      countryCode:
        normalizeCountryCode(
          parada?.paisCodigo ||
            parada?.countryCode ||
            parada?.codigoPais ||
            parada?.pais ||
            parada?.country
        ) || countryCode,
    });
  });

  // 4) Highlights & Context (only when data exists)
  if (hasContext) {
    slides.push({
      id: 'context',
      type: 'context',
      highlights: {
        topFood: highlights.topFood || null,
        topView: highlights.topView || null,
        topTip: highlights.topTip || null,
      },
      companionNames: companions
        .map((companion) => companion?.name || companion?.email)
        .filter(Boolean),
      weather,
    });
  }

  // 5) Finale
  slides.push({
    id: 'finale',
    type: 'finale',
    title: viaje?.titulo || '',
    image: coverPhoto,
    images: photoList.slice(0, 4).map((photo) => photo.url),
    xp: calculateTripXP(viaje, stops, photoList),
    countryCode,
  });

  return slides;
};

export default buildTripStoryDeck;

