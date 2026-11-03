import { useCallback, useRef, useState } from 'react';
import { useActiveParada } from '@shared/lib/hooks/useActiveParada';

export function useVisorViajeUI({ isRouteMode, isMobile }) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredStopId, setHoveredStopId] = useState(null);

  const { activeIndex: activeParadaIndex, setParadaRef, getParadaNode } = useActiveParada(
    isRouteMode && !isMobile
  );

  const carouselRef = useRef(null);
  const [activeCarouselDot, setActiveCarouselDot] = useState(0);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 220 + 16;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveCarouselDot(idx);
  }, []);

  const handleMarkerHover = useCallback((i) => setHoveredIndex(i), []);
  const handleMarkerHoverEnd = useCallback(() => setHoveredIndex(null), []);
  const handleStopHover = useCallback((stopId) => setHoveredStopId(stopId ?? null), []);
  const handleStopHoverEnd = useCallback(() => setHoveredStopId(null), []);

  const handleMarkerClick = useCallback(
    (i) => {
      const node = getParadaNode(i);
      if (!node) return;
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHoveredIndex(i);
      setTimeout(() => setHoveredIndex(null), 2000);
    },
    [getParadaNode]
  );

  return {
    showMapModal,
    setShowMapModal,
    showStories,
    setShowStories,
    hoveredIndex,
    setHoveredIndex,
    hoveredStopId,
    activeParadaIndex,
    setParadaRef,
    carouselRef,
    activeCarouselDot,
    handleCarouselScroll,
    handleMarkerHover,
    handleMarkerHoverEnd,
    handleStopHover,
    handleStopHoverEnd,
    handleMarkerClick,
  };
}
