import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTravelerLevel } from './travelerLevel';
import { buildStats, evaluateAchievements, getAchievementsWithProgress } from './achievementsEngine';
import { ENABLE_GAMIFICATION } from '@shared/config';
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
    () => (ENABLE_GAMIFICATION ? getAchievementsWithProgress(stats) : []),
    [stats],
  );

  return {
    celebrations,
    dismissCelebration,
    dismissAll,
    stats,
    achievementsWithProgress,
  };
};
