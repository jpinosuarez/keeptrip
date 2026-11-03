import { useCallback, useRef, useState } from 'react';

/**
 * Viewer UI state. Block 2.1 final polish: stop highlighting is driven by a
 * SINGLE hover state owned by VisorViaje (hoveredStopId). No scroll observers.
 */
export function useVisorViajeUI() {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStories, setShowStories] = useState(false);

  const carouselRef = useRef(null);
  const [activeCarouselDot, setActiveCarouselDot] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 220 + 16;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveCarouselDot(idx);
  }, []);

  return {
    showMapModal,
    setShowMapModal,
    showStories,
    setShowStories,
    carouselRef,
    activeCarouselDot,
    handleCarouselScroll,
  };
}
