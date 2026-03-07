import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook que observa un array de refs (stop cards) con IntersectionObserver
 * y devuelve el índice de la parada actualmente visible en el viewport.
 *
 * @param {boolean} enabled - false para desactivar (ej. mobile sin mapa visible, o modo edición)
 * @returns {{ activeIndex: number }}
 */
export function useActiveParada(enabled = true) {
  const [activeIndex, setActiveIndex] = useState(0);
  const nodesRef = useRef([]);

  // Callback estable para asignar refs en el .map()
  const setParadaRef = useCallback((index, node) => {
    nodesRef.current[index] = node || null;
  }, []);

  const getParadaNode = useCallback((index) => nodesRef.current[index] || null, []);

  useEffect(() => {
    if (!enabled) return;

    const refs = nodesRef.current;
    if (!refs || refs.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // De todas las entries visibles, elegir la que tiene mayor ratio
        let bestIndex = -1;
        let bestRatio = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const idx = refs.indexOf(entry.target);
            if (idx !== -1) {
              bestRatio = entry.intersectionRatio;
              bestIndex = idx;
            }
          }
        });
        if (bestIndex !== -1) {
          setActiveIndex(bestIndex);
        }
      },
      {
        threshold: [0.3, 0.6, 1.0],
        rootMargin: '-25% 0px -25% 0px',
      }
    );

    // Observar solo nodos válidos
    refs.forEach((node) => {
      if (node instanceof Element) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  return { activeIndex: enabled ? activeIndex : 0, setParadaRef, getParadaNode };
}
