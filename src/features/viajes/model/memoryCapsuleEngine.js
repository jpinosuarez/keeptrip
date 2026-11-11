/**
 * Memory Capsule Engine — pure, isomorphic selection logic for the
 * Google-Photos-style "memory story" retention card (Block 3.2).
 *
 * ISOMORPHIC PURITY: this module has ZERO React/DOM/storage dependencies so it
 * can be imported unchanged by Cloud Functions / native background workers
 * (Block 5.2 push notifications).
 *
 * Cost-Safety: every function operates over the already-hydrated in-memory
 * `bitacora` stubs + `bitacoraData` map. No Firestore access, ever.
 */

import {
  normalizeToIsoDate,
  ordenarParadasCronologicamente,
  calcularRangoFechasParadas,
  resolveCoverPhotoUrl,
} from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';

const STOP_COUNTRY_FIELDS = ['paisCodigo', 'countryCode', 'codigoPais', 'pais', 'country'];

const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

/** Match types produced by the 3-level relevance cascade. */
export const MEMORY_MATCH_TYPES = [
  'exact_day',
  'same_month',
  'thematic_food',
  'thematic_view',
  'thematic_favorite_stop',
  'thematic_companions',
  'thematic_highlight',
];

const MATCH_TYPE_TIER = {
  exact_day: 1,
  same_month: 2,
  thematic_food: 3,
  thematic_view: 3,
  thematic_favorite_stop: 3,
  thematic_companions: 3,
  thematic_highlight: 3,
};

/**
 * Local (device) `YYYY-MM-DD` key. ISO-prefixed strings are returned verbatim
 * so no timezone shift can move the day.
 * @param {Date|string|number} [dateInput]
 * @returns {string}
 */
export const toDateKey = (dateInput = new Date()) => {
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  }
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const safe = date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = safe.getFullYear();
  const month = String(safe.getMonth() + 1).padStart(2, '0');
  const day = String(safe.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoParts = (iso) => {
  const match = typeof iso === 'string' ? iso.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};

const yearOfIso = (iso) => {
  const parts = parseIsoParts(iso);
  return parts ? parts.year : null;
};

const monthIndexOfIso = (iso) => {
  const parts = parseIsoParts(iso);
  return parts ? parts.year * 12 + (parts.month - 1) : null;
};

/**
 * Re-anchors a date key into another year, clamping Feb 29 to Feb 28 on
 * non-leap target years (timezone / leap-year resilience).
 * @param {string} iso
 * @param {number} targetYear
 * @returns {string|null}
 */
export const shiftIsoYear = (iso, targetYear) => {
  const parts = parseIsoParts(iso);
  if (!parts || !Number.isFinite(targetYear)) return null;
  const lastDayOfMonth = new Date(targetYear, parts.month, 0).getDate();
  const day = Math.min(parts.day, lastDayOfMonth);
  return `${targetYear}-${String(parts.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/**
 * UTC-safe day offset used for the ±1-day anniversary tolerance window.
 * @param {string} iso
 * @param {number} delta
 * @returns {string|null}
 */
export const addIsoDays = (iso, delta) => {
  const parts = parseIsoParts(iso);
  if (!parts) return null;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + Number(delta || 0));
  return date.toISOString().slice(0, 10);
};

/**
 * Resolves the enveloping date range of a trip (root dates first, then stops).
 * @param {object} trip
 * @returns {{ start: string|null, end: string|null }}
 */
export const resolveTripDateRange = (trip = {}) => {
  const source = asObject(trip);
  const start = normalizeToIsoDate(source.fechaInicio);
  const end = normalizeToIsoDate(source.fechaFin) || start;
  if (start) return { start, end: end || start };
  const computed = calcularRangoFechasParadas(asArray(source.paradas));
  return { start: computed.fechaInicio || null, end: computed.fechaFin || null };
};

const extractIsoFromFlagUrl = (url) => {
  if (typeof url !== 'string') return null;
  const match = url.match(/\/([a-zA-Z]{2,3})\.(?:png|svg|jpe?g|webp)$/);
  return match ? normalizeCountryCode(match[1]) : null;
};

/**
 * STOP-FIRST ISO-2 country codes: stop country fields are the only valid
 * source when stops exist; root metadata is the last-resort fallback.
 * @param {object} trip
 * @param {Array<object>} stops
 * @returns {string[]}
 */
export const resolveTripCountryCodes = (trip = {}, stops = []) => {
  const source = asObject(trip);
  const codes = [];
  const push = (value) => {
    const iso = normalizeCountryCode(value);
    if (iso && !codes.includes(iso)) codes.push(iso);
  };

  asArray(stops).forEach((stop) => {
    for (const field of STOP_COUNTRY_FIELDS) {
      const iso = normalizeCountryCode(stop?.[field]);
      if (iso) {
        push(iso);
        break;
      }
    }
  });

  if (codes.length === 0) {
    push(source.paisCodigo || source.code || source.countryCode || null);
  }
  if (codes.length === 0) {
    asArray(source.banderas).forEach((flag) => push(extractIsoFromFlagUrl(flag)));
  }

  return codes;
};

/**
 * Eligible = completed (or legacy/draft, treated as completed) and not
 * starting in the future relative to `referenceDateKey`.
 * @param {object} trip
 * @param {string|null} referenceDateKey
 * @returns {boolean}
 */
export const isMemoryEligibleTrip = (trip, referenceDateKey = null) => {
  if (!trip || typeof trip !== 'object') return false;
  const status = String(trip.status || 'completed').toLowerCase();
  if (status === 'wishlist' || status === 'planned') return false;
  const range = resolveTripDateRange(trip);
  if (range.start && referenceDateKey && range.start > referenceDateKey) return false;
  return true;
};

/**
 * Merges `bitacora` stubs with their hydrated `bitacoraData` record, drops
 * future/wishlist/planned trips, sorts stops chronologically and resolves the
 * STOP-FIRST country codes + cover URL once per trip.
 *
 * @param {Array<object>} trips
 * @param {object} tripDataMap
 * @param {Date|string} referenceDate
 * @returns {{ trips: Array<object>, dateKey: string, referenceDate: Date|string }}
 */
export const normalizeCompletedMemoriesPool = (trips = [], tripDataMap = {}, referenceDate = new Date()) => {
  const dateKey = toDateKey(referenceDate);
  const normalizedTrips = asArray(trips)
    .map((stub) => ({ ...asObject(stub), ...asObject(tripDataMap?.[stub?.id]) }))
    .filter((merged) => Boolean(merged.id) && isMemoryEligibleTrip(merged, dateKey))
    .map((merged) => {
      const paradas = ordenarParadasCronologicamente(asArray(merged.paradas));
      return {
        ...merged,
        paradas,
        dateRange: resolveTripDateRange({ ...merged, paradas }),
        countryCodes: resolveTripCountryCodes({ ...merged, paradas }, paradas),
        coverUrl: resolveCoverPhotoUrl(merged) || null,
      };
    });

  return { trips: normalizedTrips, dateKey, referenceDate };
};


const CATEGORY_EMOJI = {
  monumento: '🏛️',
  gastronomia: '🍽️',
  food: '🍽️',
  mirador: '🌅',
  view: '🌅',
  cultura: '🎭',
  hotel: '🏨',
};

const resolveCategoryEmoji = (categoria) => CATEGORY_EMOJI[String(categoria || '').toLowerCase()] || '📍';

const normalizePoi = (poi, index = 0) => {
  if (!poi || typeof poi !== 'object') return null;
  const nombre = String(poi.nombre || poi.name || '').trim();
  if (!nombre) return null;
  const categoria = String(poi.categoria || 'monumento').toLowerCase();
  return {
    id: poi.id || `poi-${index}`,
    nombre,
    categoria,
    emoji: poi.emoji || resolveCategoryEmoji(categoria),
  };
};

const collectPois = (trip, matchedStop) => {
  const matchedPois = matchedStop ? asArray(matchedStop.lugares) : [];
  const source = matchedPois.length > 0
    ? matchedPois
    : asArray(asObject(trip).paradas).flatMap((stop) => asArray(stop?.lugares));
  return source.map((poi, index) => normalizePoi(poi, index)).filter(Boolean).slice(0, 4);
};

const collectVibes = (trip, matchedStop) => {
  const source = asObject(trip);
  const values = [
    ...asArray(source.vibe),
    ...asArray(source.vibes),
    ...asArray(matchedStop?.vibes),
  ];
  return [...new Set(values.map((value) => (typeof value === 'string' ? value.trim() : '')).filter(Boolean))];
};

const normalizeCompanions = (raw) => {
  const names = asArray(raw)
    .map((companion) => {
      if (typeof companion === 'string') return companion.trim();
      if (companion && typeof companion === 'object') {
        return String(companion.name || companion.displayName || companion.nombre || companion.email || '').trim();
      }
      return '';
    })
    .filter(Boolean);
  return [...new Set(names)];
};

const toSnippet = (value, max = 140) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed;
};

const resolveTripTitle = (trip) => {
  const source = asObject(trip);
  return String(source.titulo || source.title || source.nombreEspanol || source.destino || '').trim() || 'Keeptrip';
};

const resolveHeadline = (trip, matchedStop) => {
  const source = asObject(trip);
  return (
    toSnippet(matchedStop?.titular) ||
    toSnippet(source.titular) ||
    toSnippet(matchedStop?.relato) ||
    toSnippet(matchedStop?.notaCorta) ||
    null
  );
};

const NOTIFICATION_COPY = {
  es: {
    exact_day: { title: 'Un día como hoy, estabas en {{city}}', body: 'Revive {{title}} · hace {{yearsAgo}} años' },
    same_month: { title: 'Este mes, hace {{yearsAgo}} años, viajaste a {{city}}', body: 'Vuelve a {{title}} en tu archivo de viajes' },
    thematic_food: { title: 'El mejor sabor de {{title}}', body: 'Reencuentra {{food}} en tu historia de viaje' },
    thematic_view: { title: 'La mejor postal de {{title}}', body: 'Vuelve a {{view}} en tu historia de viaje' },
    thematic_favorite_stop: { title: 'Tu lugar favorito de {{title}}', body: 'Revisita {{city}} en tu archivo de viajes' },
    thematic_companions: { title: 'La aventura de {{title}} en buena compañía', body: 'Recuerda a {{companions}} en tu historia de viaje' },
    thematic_highlight: { title: 'Un recuerdo de {{title}}', body: 'Abre tu cápsula del tiempo de {{city}}' },
  },
  en: {
    exact_day: { title: 'A day like today, you were in {{city}}', body: 'Relive {{title}} — {{yearsAgo}} years ago' },
    same_month: { title: 'This month, {{yearsAgo}} years ago, you traveled to {{city}}', body: 'Return to {{title}} in your travel archive' },
    thematic_food: { title: 'The best flavor of {{title}}', body: 'Rediscover {{food}} in your trip story' },
    thematic_view: { title: 'The best postcard from {{title}}', body: 'Return to {{view}} in your trip story' },
    thematic_favorite_stop: { title: 'Your favorite place in {{title}}', body: 'Revisit {{city}} in your travel archive' },
    thematic_companions: { title: 'The {{title}} adventure in great company', body: 'Remember {{companions}} in your trip story' },
    thematic_highlight: { title: 'A memory from {{title}}', body: 'Open your time capsule from {{city}}' },
  },
};

/**
 * Pure notification payload builder (no i18n runtime dependency) so Cloud
 * Functions can reuse it. Emits pre-formatted copy + i18n keys + interpolation.
 * @param {object} input
 * @returns {object}
 */
export const buildNotificationMeta = ({
  matchType = 'thematic_highlight',
  yearsAgo = 0,
  tripTitle = '',
  stopCity = null,
  highlights = {},
  companions = [],
  coverUrl = null,
  deepLink = '',
  locale = 'es',
} = {}) => {
  const dictionary = NOTIFICATION_COPY[locale] || NOTIFICATION_COPY.es;
  const template = dictionary[matchType] || dictionary.thematic_highlight;
  const interpolation = {
    title: tripTitle,
    city: stopCity || tripTitle,
    yearsAgo: Math.max(0, Number(yearsAgo) || 0),
    food: highlights.topFood || tripTitle,
    view: highlights.topView || tripTitle,
    companions: companions.join(', '),
  };
  const interpolate = (text) => String(text || '').replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => (interpolation[key] !== undefined && interpolation[key] !== null ? String(interpolation[key]) : '')
  );

  return {
    title: interpolate(template.title),
    body: interpolate(template.body),
    imageUrl: coverUrl || null,
    deepLink,
    titleKey: `memory.notification.${matchType}.title`,
    bodyKey: `memory.notification.${matchType}.body`,
    interpolation,
  };
};


const stopScore = (stop) => {
  const favorite = stop?.esFavorita ? 100 : 0;
  const poiCount = asArray(stop?.lugares).length * 5;
  const titular = stop?.titular ? 10 : 0;
  const start = normalizeToIsoDate(stop?.fechaLlegada || stop?.fecha);
  const end = normalizeToIsoDate(stop?.fechaSalida || stop?.fechaLlegada || stop?.fecha);
  let duration = 0;
  if (start && end) {
    const diff = new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime();
    duration = Number.isFinite(diff) ? Math.max(0, Math.round(diff / 86400000)) : 0;
  }
  return favorite + poiCount + titular + duration;
};

const rankStops = (stops = []) => [...asArray(stops)].sort((a, b) => {
  const diff = stopScore(b) - stopScore(a);
  if (diff !== 0) return diff;
  return String(a?.id || a?.nombre || '').localeCompare(String(b?.id || b?.nombre || ''));
});

const pickBestStop = (trip) => rankStops(asObject(trip).paradas)[0] || null;

const pickFavoriteStop = (trip) => rankStops(
  asArray(asObject(trip).paradas).filter((stop) => stop?.esFavorita === true)
)[0] || null;

const pickStopByCategory = (trip, categories = []) => {
  const matching = asArray(asObject(trip).paradas).filter((stop) => asArray(stop?.lugares).some(
    (poi) => categories.includes(String(poi?.categoria || '').toLowerCase())
  ));
  return rankStops(matching)[0] || null;
};

/**
 * Formats one candidate into the normalized `[RETENTION-CAPSULE-01]` contract.
 * @param {object} input
 * @returns {object}
 */
const formatMemoryCapsule = ({
  trip,
  stop = null,
  matchType,
  tierLevel = MATCH_TYPE_TIER[matchType] || 3,
  yearsAgo = 0,
  dateKey,
  locale = 'es',
}) => {
  const source = asObject(trip);
  const rawStop = stop || null;
  const tripTitle = resolveTripTitle(source);
  const stopCity = rawStop
    ? String(rawStop.ciudad || rawStop.nombre || '').trim() || null
    : null;
  const stopId = rawStop?.id ? String(rawStop.id) : null;
  const highlights = {
    topFood: source.highlights?.topFood || null,
    topView: source.highlights?.topView || null,
    topTip: source.highlights?.topTip || null,
  };
  const companions = normalizeCompanions(source.companions);
  const countryCodes = Array.isArray(source.countryCodes) && source.countryCodes.length > 0
    ? source.countryCodes
    : resolveTripCountryCodes(source, source.paradas);
  const coverUrl = source.coverUrl || resolveCoverPhotoUrl(source) || null;
  const dateRange = source.dateRange || resolveTripDateRange(source);
  const deepLink = `/dashboard?memory=${source.id}${stopId ? `&stop=${stopId}` : ''}`;

  return {
    id: `${source.id}::${stopId || 'root'}::${matchType}`,
    tripId: source.id,
    stopId,
    matchType,
    tierLevel,
    yearsAgo: Math.max(0, Number(yearsAgo) || 0),
    dateKey,
    tripTitle,
    stopCity,
    countryCodes,
    coverUrl,
    headline: resolveHeadline(source, rawStop),
    highlights,
    pois: collectPois(source, rawStop),
    vibes: collectVibes(source, rawStop),
    companions,
    companionType: source.companionType || null,
    tripDateRange: { start: dateRange.start || '', end: dateRange.end || '' },
    deepLink,
    tripViewerUrl: `/trips/${source.id}`,
    notificationMeta: buildNotificationMeta({
      matchType,
      yearsAgo,
      tripTitle,
      stopCity,
      highlights,
      companions,
      coverUrl,
      deepLink,
      locale,
    }),
    rawTrip: source,
    rawStop,
  };
};

/**
 * Level 1 — exact anniversary: most recent year (>= 1) whose reference MM-DD
 * falls inside a stop range (±1 day), falling back to the trip range.
 * @param {object} trip normalized trip
 * @param {string} dateKey
 * @returns {{ yearsAgo: number, stop: object|null }|null}
 */
const collectExactDayMatch = (trip, dateKey) => {
  const refYear = yearOfIso(dateKey);
  if (!refYear) return null;
  let best = null;

  const considerRange = (startInput, endInput, stop) => {
    const start = normalizeToIsoDate(startInput);
    if (!start) return;
    const end = normalizeToIsoDate(endInput) || start;
    const startYear = yearOfIso(start);
    const lower = addIsoDays(start, -1);
    const upper = addIsoDays(end, 1);
    if (!startYear || !lower || !upper) return;

    for (let year = refYear - 1; year >= startYear; year -= 1) {
      const target = shiftIsoYear(dateKey, year);
      if (!target) continue;
      if (target >= lower && target <= upper) {
        const yearsAgo = refYear - year;
        if (yearsAgo >= 1 && (!best || yearsAgo < best.yearsAgo)) {
          best = { yearsAgo, stop: stop || null };
        }
        break;
      }
    }
  };

  asArray(trip.paradas).forEach((stop) => considerRange(
    stop?.fechaLlegada || stop?.fecha,
    stop?.fechaSalida || stop?.fechaLlegada || stop?.fecha,
    stop
  ));

  if (!best && trip.dateRange?.start) {
    considerRange(trip.dateRange.start, trip.dateRange.end, null);
  }

  return best;
};

/**
 * Level 2 — same calendar month in previous years (not already exact_day).
 * @param {object} trip normalized trip
 * @param {string} dateKey
 * @returns {{ yearsAgo: number, stop: object|null }|null}
 */
const collectSameMonthMatch = (trip, dateKey) => {
  const parts = parseIsoParts(dateKey);
  if (!parts) return null;
  const refYear = parts.year;
  const refMonth = parts.month;
  const matches = [];

  const evaluate = (startInput, endInput, stop) => {
    const start = normalizeToIsoDate(startInput);
    if (!start) return;
    const end = normalizeToIsoDate(endInput) || start;
    const startIdx = monthIndexOfIso(start);
    const endIdx = monthIndexOfIso(end);
    if (startIdx === null || endIdx === null) return;

    for (let idx = startIdx; idx <= endIdx; idx += 1) {
      const month = (idx % 12) + 1;
      const year = Math.floor(idx / 12);
      if (month === refMonth && year < refYear) {
        matches.push({ yearsAgo: refYear - year, stop: stop || null });
        break;
      }
    }
  };

  const stops = asArray(trip.paradas);
  if (stops.length > 0) {
    stops.forEach((stop) => evaluate(
      stop?.fechaLlegada || stop?.fecha,
      stop?.fechaSalida || stop?.fechaLlegada || stop?.fecha,
      stop
    ));
  }
  if (matches.length === 0 && trip.dateRange?.start) {
    evaluate(trip.dateRange.start, trip.dateRange.end, null);
  }
  if (matches.length === 0) return null;

  const minYearsAgo = Math.min(...matches.map((match) => match.yearsAgo));
  const recent = matches.filter((match) => match.yearsAgo === minYearsAgo);
  const withStops = recent.filter((match) => match.stop);
  const stop = withStops.length > 0 ? rankStops(withStops.map((match) => match.stop))[0] : null;

  return { yearsAgo: minYearsAgo, stop };
};

const sortCapsulesById = (list) => [...list].sort((a, b) => a.id.localeCompare(b.id));

const resolveThematicYearsAgo = (trip, dateKey) => {
  const refYear = yearOfIso(dateKey);
  const startYear = yearOfIso(trip?.dateRange?.start);
  if (!refYear || !startYear) return 0;
  return Math.max(0, refYear - startYear);
};

/**
 * Builds the 3-level relevance cascade. Every entry is a fully formatted
 * `[RETENTION-CAPSULE-01]` capsule; tiers are deterministically id-sorted.
 *
 * @param {Array<object>} trips
 * @param {object} tripDataMap
 * @param {Date|string} referenceDate
 * @param {{ locale?: string, pool?: object }} [options]
 * @returns {object} tier buckets + flattened `allCandidates`
 */
export const buildMemoryCandidates = (trips = [], tripDataMap = {}, referenceDate = new Date(), options = {}) => {
  const locale = options.locale || 'es';
  const normalizedPool = options.pool && Array.isArray(options.pool.trips)
    ? options.pool
    : normalizeCompletedMemoriesPool(trips, tripDataMap, referenceDate);
  const { dateKey } = normalizedPool;

  const exactDay = [];
  const exactTripIds = new Set();
  const sameMonth = [];
  const thematicFood = [];
  const thematicView = [];
  const thematicFavoriteStop = [];
  const thematicCompanions = [];
  const thematicHighlight = [];

  normalizedPool.trips.forEach((trip) => {
    const match = collectExactDayMatch(trip, dateKey);
    if (!match) return;
    exactDay.push(formatMemoryCapsule({
      trip,
      stop: match.stop,
      matchType: 'exact_day',
      tierLevel: MATCH_TYPE_TIER.exact_day,
      yearsAgo: match.yearsAgo,
      dateKey,
      locale,
    }));
    exactTripIds.add(trip.id);
  });

  normalizedPool.trips.forEach((trip) => {
    if (exactTripIds.has(trip.id)) return;
    const match = collectSameMonthMatch(trip, dateKey);
    if (!match) return;
    sameMonth.push(formatMemoryCapsule({
      trip,
      stop: match.stop,
      matchType: 'same_month',
      tierLevel: MATCH_TYPE_TIER.same_month,
      yearsAgo: match.yearsAgo,
      dateKey,
      locale,
    }));
  });

  normalizedPool.trips.forEach((trip) => {
    const yearsAgo = resolveThematicYearsAgo(trip, dateKey);
    const highlights = asObject(trip.highlights);
    const hasCompanions = normalizeCompanions(trip.companions).length > 0;

    const foodStop = pickStopByCategory(trip, ['gastronomia', 'food']);
    if (foodStop || highlights.topFood) {
      thematicFood.push(formatMemoryCapsule({
        trip,
        stop: foodStop || pickBestStop(trip),
        matchType: 'thematic_food',
        tierLevel: MATCH_TYPE_TIER.thematic_food,
        yearsAgo,
        dateKey,
        locale,
      }));
    }

    const viewStop = pickStopByCategory(trip, ['mirador', 'view']);
    if (viewStop || highlights.topView) {
      thematicView.push(formatMemoryCapsule({
        trip,
        stop: viewStop || pickBestStop(trip),
        matchType: 'thematic_view',
        tierLevel: MATCH_TYPE_TIER.thematic_view,
        yearsAgo,
        dateKey,
        locale,
      }));
    }

    const favoriteStop = pickFavoriteStop(trip);
    if (favoriteStop) {
      thematicFavoriteStop.push(formatMemoryCapsule({
        trip,
        stop: favoriteStop,
        matchType: 'thematic_favorite_stop',
        tierLevel: MATCH_TYPE_TIER.thematic_favorite_stop,
        yearsAgo,
        dateKey,
        locale,
      }));
    }

    if (hasCompanions) {
      thematicCompanions.push(formatMemoryCapsule({
        trip,
        stop: favoriteStop || pickBestStop(trip),
        matchType: 'thematic_companions',
        tierLevel: MATCH_TYPE_TIER.thematic_companions,
        yearsAgo,
        dateKey,
        locale,
      }));
    }

    thematicHighlight.push(formatMemoryCapsule({
      trip,
      stop: favoriteStop || pickBestStop(trip),
      matchType: 'thematic_highlight',
      tierLevel: MATCH_TYPE_TIER.thematic_highlight,
      yearsAgo,
      dateKey,
      locale,
    }));
  });

  const tiers = {
    exact_day: sortCapsulesById(exactDay),
    same_month: sortCapsulesById(sameMonth),
    thematic_food: sortCapsulesById(thematicFood),
    thematic_view: sortCapsulesById(thematicView),
    thematic_favorite_stop: sortCapsulesById(thematicFavoriteStop),
    thematic_companions: sortCapsulesById(thematicCompanions),
    thematic_highlight: sortCapsulesById(thematicHighlight),
  };

  const allCandidates = [
    ...tiers.exact_day,
    ...tiers.same_month,
    ...tiers.thematic_food,
    ...tiers.thematic_view,
    ...tiers.thematic_favorite_stop,
    ...tiers.thematic_companions,
    ...tiers.thematic_highlight,
  ];

  return { ...tiers, allCandidates, dateKey };
};


const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Deterministic 32-bit FNV-1a hash. Same date key → same seed all day, on
 * every device and every reload.
 * @param {string} seedText
 * @returns {number}
 */
export const hashDailySeed = (seedText = '') => {
  let hash = FNV_OFFSET_BASIS >>> 0;
  const text = String(seedText);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
};

const TIER_BUCKET_ORDER = [
  'exact_day',
  'same_month',
  'thematic_food',
  'thematic_view',
  'thematic_favorite_stop',
  'thematic_companions',
  'thematic_highlight',
];

/**
 * Selects the daily Memory Capsule.
 *
 * Return shape (single source of truth, mirrored by `useMemoryCapsule`):
 *   { capsule, totalCandidates, allCandidates, dateKey }
 *
 * - Default: highest-priority non-empty tier (L1 ➔ L2 ➔ L3).
 * - `shuffleOffset > 0`: cycles across the flattened pool (all tiers), so the
 *   traveler can explore every memory before repeating.
 * - `forceMode` / `forcedTripId` / `forcedStopId`: pinned preview for DEV and
 *   deep-link (?memory=TRIP_ID&stop=STOP_ID), with a graceful fallback to the
 *   default selection when the filtered pool is empty.
 *
 * @param {object} [options]
 * @returns {{ capsule: object|null, totalCandidates: number, allCandidates: Array<object>, dateKey: string }}
 */
export const selectDailyMemoryCapsule = ({
  trips = [],
  tripDataMap = {},
  referenceDate = new Date(),
  shuffleOffset = 0,
  forceMode = null,
  forcedTripId = null,
  forcedStopId = null,
  locale = 'es',
} = {}) => {
  const candidateSet = buildMemoryCandidates(trips, tripDataMap, referenceDate, { locale });
  const { dateKey, allCandidates } = candidateSet;
  const totalCandidates = allCandidates.length;
  const offset = Math.max(0, Number(shuffleOffset) || 0);
  const seed = hashDailySeed(`keeptrip-memory::${dateKey}`);

  const highestTier = TIER_BUCKET_ORDER
    .map((bucket) => candidateSet[bucket])
    .find((list) => Array.isArray(list) && list.length > 0) || [];

  const effectiveForceMode = forceMode && forceMode !== 'auto' ? forceMode : null;
  const hasForcedFilter = Boolean(forcedTripId || effectiveForceMode);

  let forcedPool = allCandidates;
  if (forcedTripId) {
    forcedPool = forcedPool.filter((capsule) => String(capsule.tripId) === String(forcedTripId));
  }
  if (effectiveForceMode) {
    forcedPool = forcedPool.filter((capsule) => capsule.matchType === effectiveForceMode);
  }
  if (forcedTripId && forcedStopId) {
    const stopMatched = forcedPool.filter((capsule) => String(capsule.stopId) === String(forcedStopId));
    if (stopMatched.length > 0) forcedPool = stopMatched;
  }

  let capsule = null;

  if (hasForcedFilter && forcedPool.length > 0) {
    capsule = forcedPool[(seed + offset) % forcedPool.length] || forcedPool[0];
  }

  if (!capsule) {
    if (offset > 0 && allCandidates.length > 0) {
      capsule = allCandidates[(seed + offset) % allCandidates.length] || allCandidates[0];
    } else if (highestTier.length > 0) {
      capsule = highestTier[seed % highestTier.length];
    }
  }

  return { capsule: capsule || null, totalCandidates, allCandidates, dateKey };
};

