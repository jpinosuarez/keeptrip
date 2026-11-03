/**
 * Scroll is fully decoupled from the viewer map (Block 2.1 final polish).
 * There is NO IntersectionObserver and NO scroll listener: page scrolling can
 * never change active stops or the map. Highlighting is hover-only.
 */
export function useDocumentaryState() {
  return {
    activeIndex: null,
    mapSyncIndex: null,
    setParadaRef: () => {},
    getParadaNode: () => null,
  };
}
