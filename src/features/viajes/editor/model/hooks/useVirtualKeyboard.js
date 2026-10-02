import { useState, useEffect } from 'react';

/**
 * useVirtualKeyboard
 * Tracks window.visualViewport height and offset on touch devices
 * to dynamically handle virtual keyboard appearance in mobile browsers (e.g. iOS Safari).
 *
 * Calculations strictly follow docs/IOS_SAFE_AREA.md guidelines:
 * - keyboardOffset: Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop)
 * - isKeyboardOpen: true when keyboardOffset > 60px
 * - visualViewportHeight: height of current visible viewport
 */
export const useVirtualKeyboard = () => {
  const [state, setState] = useState({
    keyboardOffset: 0,
    isKeyboardOpen: false,
    visualViewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      if (!vv) {
        setState({
          keyboardOffset: 0,
          isKeyboardOpen: false,
          visualViewportHeight: window.innerHeight,
        });
        return;
      }

      // Calculate keyboard offset accounting for visual viewport shrink and scroll offset
      const offset = Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
      // Virtual keyboards on iOS/Android take at least 100-300px; 60px filter avoids minor address bar transitions
      const isOpen = offset > 60;

      setState({
        keyboardOffset: isOpen ? offset : 0,
        isKeyboardOpen: isOpen,
        visualViewportHeight: Math.round(vv.height),
      });
    };

    if (vv) {
      vv.addEventListener('resize', handleViewportChange, { passive: true });
      vv.addEventListener('scroll', handleViewportChange, { passive: true });
    }
    window.addEventListener('resize', handleViewportChange, { passive: true });

    // Initial sync
    handleViewportChange();

    return () => {
      if (vv) {
        vv.removeEventListener('resize', handleViewportChange);
        vv.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
    };
  }, []);

  return state;
};

export default useVirtualKeyboard;
