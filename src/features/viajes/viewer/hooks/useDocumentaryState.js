import { useState, useEffect, useRef, useCallback } from 'react';
import { useActiveParada } from '@shared/lib/hooks/useActiveParada';

/**
 * useDocumentaryState — The brain of the Immersive Viewer.
 * Coordinates between the scrolling Timeline and the Sticky Map.
 * 
 * Includes: 
 * - Active parada detection (IntersectionObserver)
 * - Scroll velocity tracking (for debounce)
 * - Map cinematic sync
 */
export function useDocumentaryState({ paradas, isMobile, enabled = true }) {
  // 1. Core intersection detection (uses standard hook but we wrap it)
  const { activeIndex, setParadaRef, getParadaNode } = useActiveParada(enabled);
  
  // 2. Map-Sync State
  const [mapSyncIndex, setMapSyncIndex] = useState(0);
  const scrollPos = useRef(0);
  const scrollVelocity = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const syncTimeoutRef = useRef(null);

  // 3. Velocity tracking logic
  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      const now = Date.now();
      const dt = now - lastScrollTime.current;
      if (dt === 0) return;

      const currentY = window.scrollY;
      const dy = currentY - scrollPos.current;
      
      scrollVelocity.current = Math.abs(dy / dt); // px/ms
      scrollPos.current = currentY;
      lastScrollTime.current = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled]);

  // 4. Cinematic Sync Trigger (Velocity-Based Debounce)
  useEffect(() => {
    if (!enabled || isMobile) return; // In mobile, sync might be different or simpler

    // If we have a pending sync, clear it
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    const syncInterval = 500; // Delay for "settling"
    const velocityThreshold = 0.5; // If moving faster than this, skip

    const attemptSync = () => {
      if (scrollVelocity.current < velocityThreshold) {
        setMapSyncIndex(activeIndex);
      } else {
        // Still moving too fast? Check again soon
        syncTimeoutRef.current = setTimeout(attemptSync, 200);
      }
    };

    syncTimeoutRef.current = setTimeout(attemptSync, syncInterval);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [activeIndex, enabled, isMobile]);

  return {
    activeIndex,
    mapSyncIndex,
    setParadaRef,
    getParadaNode,
    scrollVelocity: scrollVelocity.current
  };
}
