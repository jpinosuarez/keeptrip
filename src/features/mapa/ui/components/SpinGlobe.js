/**
 * SpinGlobe — Mapbox GL idle globe rotation engine.
 *
 * Pure utility (no React, no hooks).
 * Creates a self-cleaning auto-rotation loop via recursive `easeTo`.
 * Pauses on user interaction, resumes on idle. Stops at high zoom.
 * Hibernates on element occlusion, tab invisibility, and viewport exit.
 *
 * @param {mapboxgl.Map} map - Mapbox GL JS map instance
 * @param {Object} options
 * @param {number} [options.secondsPerRevolution=120] - Duration for full 360° rotation
 * @param {number} [options.maxSpinZoom=5] - Zoom level above which rotation stops
 * @returns {{ start: Function, stop: Function, pause: Function, resume: Function, setOccluded: Function, destroy: Function }}
 */
export function createSpinGlobe(map, { secondsPerRevolution = 120, maxSpinZoom = 5 } = {}) {
  let userInteracting = false;
  let spinEnabled = false;
  let isIntersecting = true;
  let isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;
  let isOccluded = false;
  let isScrolling = false;
  let scrollTimer = null;

  const distancePerSecond = 360 / secondsPerRevolution;

  function canSpin() {
    return spinEnabled && !userInteracting && isIntersecting && isDocumentVisible && !isOccluded && !isScrolling;
  }

  function spin() {
    if (!canSpin()) return;

    const zoom = map.getZoom();
    if (zoom > maxSpinZoom) return;

    const center = map.getCenter();
    center.lng -= distancePerSecond;

    map.easeTo({
      center,
      duration: 1000,
      easing: (n) => n, // Linear for seamless loop
    });
  }

  // ── Interaction awareness ─────────────────────────────────────────
  const onInteractionStart = () => {
    userInteracting = true;
  };

  const onInteractionEnd = () => {
    userInteracting = false;
    spin();
  };

  const onMoveEnd = () => {
    if (!userInteracting) spin();
  };

  // ── Wire up Mapbox events ─────────────────────────────────────────
  const INTERACTION_START_EVENTS = ['mousedown', 'touchstart', 'wheel'];
  const INTERACTION_END_EVENTS = ['mouseup', 'touchend'];

  function attachListeners() {
    INTERACTION_START_EVENTS.forEach((e) => map.on(e, onInteractionStart));
    INTERACTION_END_EVENTS.forEach((e) => map.on(e, onInteractionEnd));
    map.on('moveend', onMoveEnd);
    map.on('dragstart', onInteractionStart);
    map.on('dragend', onInteractionEnd);
  }

  function detachListeners() {
    INTERACTION_START_EVENTS.forEach((e) => map.off(e, onInteractionStart));
    INTERACTION_END_EVENTS.forEach((e) => map.off(e, onInteractionEnd));
    map.off('moveend', onMoveEnd);
    map.off('dragstart', onInteractionStart);
    map.off('dragend', onInteractionEnd);
  }

  attachListeners();

  // ── Viewport & Tab Visibility Hibernation ─────────────────────────
  const container = typeof map.getContainer === 'function' ? map.getContainer() : null;
  let intersectionObserver = null;

  if (typeof IntersectionObserver !== 'undefined' && container) {
    intersectionObserver = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting && canSpin()) {
        spin();
      } else if (!isIntersecting) {
        map.stop?.();
      }
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);
  }

  const onVisibilityChange = () => {
    isDocumentVisible = typeof document !== 'undefined' ? !document.hidden : true;
    if (isDocumentVisible && canSpin()) {
      spin();
    } else if (!isDocumentVisible) {
      map.stop?.();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  const onScroll = () => {
    if (!isScrolling) {
      isScrolling = true;
      map.stop?.();
    }
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      isScrolling = false;
      if (canSpin()) {
        spin();
      }
    }, 150);
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  }

  return {
    /** Begin auto-rotation. */
    start() {
      spinEnabled = true;
      spin();
    },
    /** Pause auto-rotation (preserves listeners for resume). */
    stop() {
      spinEnabled = false;
      map.stop?.();
    },
    /** Alias for stop. */
    pause() {
      spinEnabled = false;
      map.stop?.();
    },
    /** Alias for start. */
    resume() {
      spinEnabled = true;
      spin();
    },
    /** Set modal occlusion status (e.g. when full-screen modal mounts over the globe). */
    setOccluded(occluded) {
      isOccluded = Boolean(occluded);
      if (isOccluded) {
        map.stop?.();
      } else if (canSpin()) {
        spin();
      }
    },
    /** Full teardown: stop rotation and remove all event listeners and observers. */
    destroy() {
      spinEnabled = false;
      map.stop?.();
      detachListeners();
      intersectionObserver?.disconnect();
      if (scrollTimer) clearTimeout(scrollTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', onScroll, { capture: true });
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    },
  };
}

export default createSpinGlobe;
