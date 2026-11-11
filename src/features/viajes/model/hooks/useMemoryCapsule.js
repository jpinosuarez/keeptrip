/**
 * useMemoryCapsule — daily Memory Capsule selection + on-demand memory story.
 *
 * Zero Firestore reads while idle: everything is memoized from the already
 * hydrated `bitacora` / `bitacoraData`. Gallery photos are lazily fetched ONCE
 * per trip (in-memory cache) only when the traveler opens the story.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@shared/firebase';
import { obtenerFotosViaje } from '@shared/api/services/viajes/galeriaService';
import { computeRouteTelemetry, ordenarParadasCronologicamente } from '@shared/lib/utils/viajeUtils';
import { ENABLE_DEV_TOOLS, ENABLE_MEMORY_CAPSULE } from '@shared/config/featureFlags';
import { buildTripStoryDeck } from '@features/viajes/viewer/lib/buildTripStoryDeck';
import { selectDailyMemoryCapsule, toDateKey } from '../memoryCapsuleEngine';

const SEEN_KEY_PREFIX = 'keeptrip_memory_seen_';

const readSeenIds = (seenKey) => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(seenKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

const writeSeenIds = (seenKey, ids) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(seenKey, JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private mode): seen-today simply stays false.
  }
};

/**
 * @param {{ trips?: Array<object>, tripDataMap?: object, userUid?: string|null, referenceDate?: Date|null }} [options]
 * @returns {object} capsule, candidate metadata, seen-today state and story controls
 */
export const useMemoryCapsule = ({
  trips = [],
  tripDataMap = {},
  userUid = null,
  referenceDate = null,
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shuffleOffset, setShuffleOffset] = useState(0);
  const [devMode, setDevMode] = useState('auto');
  const [seenVersion, setSeenVersion] = useState(0);
  const [story, setStory] = useState({ open: false, slides: [], loading: false });

  const photosCacheRef = useRef(new Map());
  const photoRequestsRef = useRef(new Map());
  const mountedRef = useRef(true);
  const autoOpenedRef = useRef(null);

  const memoryParam = searchParams.get('memory');
  const stopParam = searchParams.get('stop');

  const referenceDateKey = useMemo(
    () => toDateKey(referenceDate || new Date()),
    [referenceDate]
  );

  const selection = useMemo(
    () => selectDailyMemoryCapsule({
      trips,
      tripDataMap,
      referenceDate: referenceDate || referenceDateKey,
      shuffleOffset,
      forceMode: devMode === 'auto' ? null : devMode,
      forcedTripId: memoryParam || null,
      forcedStopId: stopParam || null,
    }),
    [trips, tripDataMap, referenceDate, referenceDateKey, shuffleOffset, devMode, memoryParam, stopParam]
  );

  const capsule = selection.capsule;
  const seenKey = `${SEEN_KEY_PREFIX}${selection.dateKey}`;
  const seenIds = useMemo(() => readSeenIds(seenKey), [seenKey, seenVersion]);
  const isSeenToday = Boolean(capsule && seenIds.includes(capsule.id));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // DEV-only simulation mode (auto / exact_day / same_month / thematic_*).
  useEffect(() => {
    if (!ENABLE_DEV_TOOLS || typeof window === 'undefined') return undefined;
    let active = true;
    let unsubscribe = () => {};

    import('@shared/dev/devMemoryOverride')
      .then((mod) => {
        if (!active) return;
        const sync = () => {
          setDevMode(mod.getDevMemoryMode());
          setSeenVersion((version) => version + 1);
        };
        sync();
        unsubscribe = mod.subscribeDevMemoryOverride(sync);
      })
      .catch(() => {
        // Dev store unavailable: keep the production default ('auto').
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const markAsSeen = useCallback((targetCapsule = null) => {
    const target = targetCapsule || selection.capsule;
    if (!target) return;
    const key = `${SEEN_KEY_PREFIX}${selection.dateKey}`;
    const current = readSeenIds(key);
    if (current.includes(target.id)) return;
    writeSeenIds(key, [...current, target.id]);
    setSeenVersion((version) => version + 1);
  }, [selection.capsule, selection.dateKey]);

  const resetSeenStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(seenKey);
      } catch {
        // Ignore storage failures.
      }
    }
    setSeenVersion((version) => version + 1);
  }, [seenKey]);

  const shuffleMemory = useCallback(() => {
    setShuffleOffset((offset) => offset + 1);
  }, []);

  const fetchTripPhotos = useCallback(async (targetCapsule) => {
    const tripId = targetCapsule?.tripId;
    if (!tripId) return [];
    if (photosCacheRef.current.has(tripId)) return photosCacheRef.current.get(tripId);

    const targetOwnerUid = targetCapsule?.rawTrip?.ownerId || userUid || null;
    if (!targetOwnerUid) return [];
    if (photoRequestsRef.current.has(tripId)) return photoRequestsRef.current.get(tripId);

    const request = (async () => {
      try {
        const photos = await obtenerFotosViaje({ db, userId: targetOwnerUid, viajeId: tripId });
        const safePhotos = Array.isArray(photos) ? photos : [];
        photosCacheRef.current.set(tripId, safePhotos);
        return safePhotos;
      } catch {
        // Offline / permission error: gracefully degrade to a photo-less deck.
        photosCacheRef.current.set(tripId, []);
        return [];
      } finally {
        photoRequestsRef.current.delete(tripId);
      }
    })();

    photoRequestsRef.current.set(tripId, request);
    return request;
  }, [userUid]);

  const buildDeckForCapsule = useCallback((targetCapsule, galleryPhotos = []) => {
    const rawTrip = targetCapsule?.rawTrip || {};
    const paradasOrdenadas = ordenarParadasCronologicamente(
      Array.isArray(rawTrip.paradas) ? rawTrip.paradas : []
    );
    return buildTripStoryDeck({
      viaje: rawTrip,
      paradasOrdenadas,
      photos: galleryPhotos,
      telemetry: computeRouteTelemetry(paradasOrdenadas, rawTrip),
      mode: 'memory',
      memoryCapsule: targetCapsule,
    });
  }, []);

  const openMemoryStory = useCallback(async () => {
    const targetCapsule = selection.capsule;
    if (!targetCapsule) return [];

    markAsSeen(targetCapsule);
    setStory((previous) => ({ ...previous, open: true, loading: true }));

    const photos = await fetchTripPhotos(targetCapsule);
    const slides = buildDeckForCapsule(targetCapsule, photos);

    if (mountedRef.current) {
      setStory({ open: true, slides, loading: false });
    }
    return slides;
  }, [selection.capsule, markAsSeen, fetchTripPhotos, buildDeckForCapsule]);

  const closeMemoryStory = useCallback(() => {
    setStory({ open: false, slides: [], loading: false });

    if (!searchParams.has('memory') && !searchParams.has('stop')) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('memory');
    next.delete('stop');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Deep-link support: ?memory=TRIP_ID&stop=STOP_ID auto-opens the story.
  // Deps are primitives so unstable upstream objects cannot re-open a story
  // the traveler just closed.
  useEffect(() => {
    if (!ENABLE_MEMORY_CAPSULE) return;
    if (!memoryParam || !selection.capsule) return;
    if (String(selection.capsule.tripId) !== String(memoryParam)) return;

    const signature = `${memoryParam}::${stopParam || ''}`;
    if (autoOpenedRef.current === signature) return;
    autoOpenedRef.current = signature;
    openMemoryStory();
  }, [memoryParam, stopParam, selection.capsule?.tripId, openMemoryStory]);

  return {
    capsule,
    totalCandidates: selection.totalCandidates,
    allCandidates: selection.allCandidates,
    dateKey: selection.dateKey,
    isSeenToday,
    markAsSeen,
    resetSeenStatus,
    shuffleMemory,
    isStoryOpen: story.open,
    isLoadingStoryPhotos: story.loading,
    storySlides: story.slides,
    openMemoryStory,
    closeMemoryStory,
    devMode,
  };
};

export default useMemoryCapsule;

