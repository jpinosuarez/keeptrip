import { useActiveParada } from '@shared/lib/hooks/useActiveParada';

/**
 * useDocumentaryState — active-stop detection for the Editorial Viewer.
 *
 * Block 2.1: the map is no longer sticky and the cinematic `flyTo` was
 * removed (motion-sickness + 60fps scroll). The hook now exposes the
 * IntersectionObserver-driven active index so markers/timeline stay in sync.
 */
export function useDocumentaryState({ enabled = true } = {}) {
  const { activeIndex, setParadaRef, getParadaNode } = useActiveParada(enabled);

  return {
    activeIndex,
    mapSyncIndex: activeIndex,
    setParadaRef,
    getParadaNode,
  };
}
