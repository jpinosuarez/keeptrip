import {
  ensureOperationalFlagsListener,
  getOperationalFlagsSnapshot,
} from '@shared/lib/hooks/useOperationalFlags';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// In-memory cache for Mapbox geocoding
const cache = new Map();
const activeRequests = new Map();

const CACHE_TTL_MS = 1000 * 60 * 60; // 60 minutes

const bindAbortSignal = (promise, signal) => {
  if (!signal) return promise;

  if (signal.aborted) {
    return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', onAbort);
      });
  });
};

const EMPTY_RESULT = Object.freeze({ features: [] });

export const fetchGeocoding = async ({
  query,
  language,
  types = 'country,place,locality',
  signal,
  minLength = 3,
  country,
}) => {
  // Keep the response shape stable (always `{ features: [...] }`) so callers
  // never have to branch between an array and a Mapbox payload.
  if (!query || query.length < minLength) return EMPTY_RESULT;

  ensureOperationalFlagsListener();
  const currentLevel = Number(getOperationalFlagsSnapshot()?.level || 0);
  if (currentLevel >= 1) {
    return EMPTY_RESULT;
  }

  const normalizedLanguage = language || 'en';
  const normalizedCountry = country ? String(country).trim().toLowerCase() : '';
  const cacheKey = `${query.toLowerCase()}_${normalizedLanguage}_${types}_${normalizedCountry}`;

  // Check cache
  const cachedHit = cache.get(cacheKey);
  if (cachedHit && Date.now() - cachedHit.timestamp < CACHE_TTL_MS) {
    return cachedHit.data;
  }

  // Deduplicate in-flight requests
  if (activeRequests.has(cacheKey)) {
    return bindAbortSignal(activeRequests.get(cacheKey), signal);
  }

  const networkPromise = (async () => {
    try {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?types=${encodeURIComponent(types)}&language=${encodeURIComponent(
        normalizedLanguage
      )}&access_token=${MAPBOX_TOKEN}${
        normalizedCountry ? `&country=${encodeURIComponent(normalizedCountry)}` : ''
      }`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Mapbox geocoding failed with status ${res.status}`);
      }
      const data = await res.json();
      
      // Cache the result
      cache.set(cacheKey, {
        timestamp: Date.now(),
        data,
      });

      return data;
    } finally {
      activeRequests.delete(cacheKey);
    }
  })();

  activeRequests.set(cacheKey, networkPromise);
  return bindAbortSignal(networkPromise, signal);
};

export const clearGeocodingCache = () => {
  cache.clear();
};
