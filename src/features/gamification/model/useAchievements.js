import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getTravelerLevel,
  resolveConquestColor,
  isConquestColorUnlocked as checkConquestColorUnlocked,
} from './travelerLevel';
import {
  buildStats,
  evaluateAchievements,
  getAchievementsWithProgress,
  calculateXPBreakdown,
  calculateCountryEmblems,
  getNextAchievableBadges,
} from './achievementsEngine';
import { ENABLE_GAMIFICATION } from '@shared/config';
import { useDevGodMode } from './useDevGodMode';
import { useAuth } from '@app/providers/AuthContext';

const STORAGE_KEY = 'keeptrip-achievements';
const EMPTY_STATS = Object.freeze({});

const readPersisted = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writePersisted = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/**
 * Manages the gamification lifecycle: evaluates achievements + level-ups,
 * detects NEW unlocks, and queues celebrations.
 *
 * Stores already-unlocked achievement ids and the last-celebrated traveler level
 * in localStorage to prevent re-triggers on Firestore re-emissions, tab focus, etc.
 */
export const useAchievements = ({ paisesVisitados, bitacora, todasLasParadas }) => {
  const [celebrations, setCelebrations] = useState([]);
  const isInitialLoadRef = useRef(true);
  const { userProfile } = useAuth() || {};

  // DEV-only Gamification God Mode (session-scoped). `useDevGodMode` lazily
  // imports the override store + simulation behind `import.meta.env.DEV`, so
  // production bundles contain neither the payloads nor the session key.
  const { enabled: devGodModeEnabled, sim: devGodModeSim } = useDevGodMode();
  const godModeActive = ENABLE_GAMIFICATION && devGodModeEnabled;

  // Derive meaningful dep values to avoid reacting to reference changes
  const countryCount = paisesVisitados.length;
  const tripCount = bitacora.length;
  const stopCount = todasLasParadas.length;

  // Increment 3.1 — initial Firestore hydration guard. On the very first render
  // `bitacora` is [] (snapshot pending); seeding the baseline there would flag
  // every pre-existing achievement as "new" when the snapshot lands, opening the
  // full-screen CelebrationQueue over the editor/dashboard.
  const pendingHydrationRef = useRef(false);

  useEffect(() => {
    if (!ENABLE_GAMIFICATION) return;

    const stats = buildStats(paisesVisitados, bitacora, todasLasParadas, userProfile);
    const unlocked = evaluateAchievements(stats);
    const currentLevel = getTravelerLevel(countryCount);
    const persisted = readPersisted();

    const seedBaseline = () =>
      writePersisted({
        unlockedIds: unlocked.map((a) => a.id),
        celebratedLevel: currentLevel.id,
      });

    // First run: seed the baseline. If the archive is still empty (Firestore
    // snapshot pending) remember it and re-seed silently on hydration.
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (!persisted) {
        seedBaseline();
      }
      pendingHydrationRef.current = countryCount + tripCount + stopCount === 0;
      return;
    }

    // First snapshot arrived after an empty mount → this is hydration, not a
    // genuine unlock. Re-seed in silence so no celebration modal is mounted.
    if (pendingHydrationRef.current) {
      pendingHydrationRef.current = false;
      seedBaseline();
      return;
    }

    const prevUnlockedIds = persisted?.unlockedIds ?? [];
    const prevLevel = persisted?.celebratedLevel ?? currentLevel.id;

    const newAchievements = unlocked.filter((a) => !prevUnlockedIds.includes(a.id));
    const isLevelUp = currentLevel.id !== 'dreamer' && currentLevel.id !== prevLevel;

    const queue = [];
    if (isLevelUp) {
      queue.push({ type: 'level-up', data: currentLevel });
    }
    for (const a of newAchievements) {
      queue.push({ type: 'achievement', data: a });
    }

    if (queue.length > 0) {
      writePersisted({
        unlockedIds: [...new Set([...prevUnlockedIds, ...unlocked.map((a) => a.id)])],
        celebratedLevel: currentLevel.id,
      });

      // Automated E2E runs must never mount full-screen celebration overlays
      // (they sit at Z_INDEX.celebration and intercept editor pointer events).
      // Opt back in per-spec with window.__ENABLE_GAMIFICATION_CELEBRATIONS_E2E__.
      const isE2E =
        typeof window !== 'undefined' &&
        (window.navigator?.webdriver === true || import.meta.env.VITE_E2E === 'true');
      const allowCelebrations =
        !isE2E ||
        (typeof window !== 'undefined' &&
          window.__ENABLE_GAMIFICATION_CELEBRATIONS_E2E__ === true);

      if (allowCelebrations) {
        setCelebrations((prev) => [...prev, ...queue]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCount, tripCount, stopCount]);

  const dismissCelebration = useCallback(() => {
    setCelebrations((prev) => prev.slice(1));
  }, []);

  const dismissAll = useCallback(() => {
    setCelebrations([]);
  }, []);

  // Always-available data (not dependent on celebrations)
  const stats = useMemo(
    () => (ENABLE_GAMIFICATION ? buildStats(paisesVisitados, bitacora, todasLasParadas, userProfile) : EMPTY_STATS),
    [paisesVisitados, bitacora, todasLasParadas, userProfile],
  );

  const achievementsWithProgress = useMemo(
    () => {
      if (!ENABLE_GAMIFICATION) return [];
      if (godModeActive && devGodModeSim) return devGodModeSim.getSimulatedGodModeBadges();
      return getAchievementsWithProgress(stats);
    },
    [godModeActive, devGodModeSim, stats],
  );

  // Group trips + their stops on the fly so the XP 2.0 / emblem engines stay
  // 100% in-memory (no extra Firestore reads, no N+1 queries).
  const viajes = useMemo(() => {
    if (!ENABLE_GAMIFICATION) return [];
    const stopsByTrip = new Map();
    for (const parada of Array.isArray(todasLasParadas) ? todasLasParadas : []) {
      const tripId = parada?.viajeId;
      if (!tripId) continue;
      if (!stopsByTrip.has(tripId)) stopsByTrip.set(tripId, []);
      stopsByTrip.get(tripId).push(parada);
    }
    const trips = Array.isArray(bitacora) ? bitacora : [];
    return trips.map((trip) => ({ ...trip, paradas: stopsByTrip.get(trip.id) || [] }));
  }, [bitacora, todasLasParadas]);

  const xpBreakdown = useMemo(() => {
    if (!ENABLE_GAMIFICATION) return null;
    if (godModeActive && devGodModeSim) return devGodModeSim.getGodModeXpBreakdown();
    return calculateXPBreakdown(viajes, userProfile);
  }, [godModeActive, devGodModeSim, viajes, userProfile]);

  const countryEmblems = useMemo(() => {
    if (!ENABLE_GAMIFICATION) return [];
    if (godModeActive && devGodModeSim) return devGodModeSim.getSimulatedGodModeEmblems();
    return calculateCountryEmblems(viajes, userProfile);
  }, [godModeActive, devGodModeSim, viajes, userProfile]);

  const nextAchievableBadges = useMemo(
    () => (ENABLE_GAMIFICATION ? getNextAchievableBadges(achievementsWithProgress, 2) : []),
    [achievementsWithProgress],
  );

  const totalXP = xpBreakdown?.totalXP || 0;

  const conquestColor = useMemo(
    () => resolveConquestColor(userProfile, totalXP),
    [userProfile, totalXP],
  );

  const conquestColorUnlocked = useMemo(
    () => (godModeActive ? true : checkConquestColorUnlocked(totalXP)),
    [godModeActive, totalXP],
  );

  return {
    celebrations,
    dismissCelebration,
    dismissAll,
    stats,
    achievementsWithProgress,
    xpBreakdown,
    countryEmblems,
    nextAchievableBadges,
    conquestColor,
    isConquestColorUnlocked: conquestColorUnlocked,
  };
};
