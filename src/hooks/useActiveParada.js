import { useState, useEffect, useCallback } from 'react';

/**
 * Hook que observa un array de refs (stop cards) con IntersectionObserver
 * y devuelve el índice de la parada actualmente visible en el viewport.
 *
 * @param {React.MutableRefObject<HTMLElement[]>} paradaRefs - ref cuyo .current es un array de DOM nodes
 * @param {boolean} enabled - false para desactivar (ej. mobile sin mapa visible, o modo edición)
 * @returns {{ activeIndex: number }}
 */
export function useActiveParada(paradaRefs, enabled = true) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Resetear al índice 0 cuando se desactiva (por ej. al salir de edición)
  useEffect(() => {
    if (!enabled) setActiveIndex(0);
  }, [enabled]);

  // Callback estable para asignar refs en el .map()
  const setParadaRef = useCallback((index, node) => {
    if (paradaRefs.current) {
      paradaRefs.current[index] = node;
    }
  }, [paradaRefs]);

  useEffect(() => {
    if (!enabled) return;

    const refs = paradaRefs.current;
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
  }, [paradaRefs, enabled]);

  return { activeIndex, setParadaRef };
}
