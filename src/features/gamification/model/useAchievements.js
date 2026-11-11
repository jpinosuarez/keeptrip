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
import { ENABLE_GAMIFICATION, ENABLE_DEV_TOOLS } from '@shared/config';
import { isDevGodModeEnabled, DEV_OVERRIDE_EVENT } from '@shared/dev/devGamificationOverride';
import {
  getGodModeXpBreakdown,
  getSimulatedGodModeBadges,
  getSimulatedGodModeEmblems,
} from './devGodModeSimulation';
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

  // DEV-only Gamification God Mode (session-scoped). When enabled, every
  // selector below returns a full simulated payload so the Hub can be audited
  // with all 195 UN emblems + every badge without touching Firestore.
  const [godMode, setGodMode] = useState(() => ENABLE_DEV_TOOLS && isDevGodModeEnabled());
  // Hard-gated to DEV builds: a stray sessionStorage key can never unlock the
  // simulated payloads in production.
  const godModeActive = ENABLE_DEV_TOOLS && ENABLE_GAMIFICATION && godMode;

  useEffect(() => {
    const sync = () => setGodMode(isDevGodModeEnabled());
    window.addEventListener(DEV_OVERRIDE_EVENT, sync);
    return () => window.removeEventListener(DEV_OVERRIDE_EVENT, sync);
  }, []);

  // Derive meaningful dep values to avoid reacting to reference changes
  const countryCount = paisesVisitados.length;
  const tripCount = bitacora.length;
  const stopCount = todasLasParadas.length;

  useEffect(() => {
    if (!ENABLE_GAMIFICATION) return;

    const stats = buildStats(paisesVisitados, bitacora, todasLasParadas, userProfile);
    const unlocked = evaluateAchievements(stats);
    const currentLevel = getTravelerLevel(countryCount);
    const persisted = readPersisted();

    // First run ever (or cleared storage): seed state, don't celebrate
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      if (!persisted) {
        writePersisted({
          unlockedIds: unlocked.map((a) => a.id),
          celebratedLevel: currentLevel.id,
        });
      }
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
      setCelebrations((prev) => [...prev, ...queue]);
      writePersisted({
        unlockedIds: [...new Set([...prevUnlockedIds, ...unlocked.map((a) => a.id)])],
        celebratedLevel: currentLevel.id,
      });
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
      if (godModeActive) return getSimulatedGodModeBadges();
      return getAchievementsWithProgress(stats);
    },
    [godModeActive, stats],
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
    if (godModeActive) return getGodModeXpBreakdown();
    return calculateXPBreakdown(viajes, userProfile);
  }, [godModeActive, viajes, userProfile]);

  const countryEmblems = useMemo(() => {
    if (!ENABLE_GAMIFICATION) return [];
    if (godModeActive) return getSimulatedGodModeEmblems();
    return calculateCountryEmblems(viajes, userProfile);
  }, [godModeActive, viajes, userProfile]);

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
