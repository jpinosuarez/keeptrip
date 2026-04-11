import { useCallback } from 'react';

/**
 * useBottomSheetGestures
 * Isolates drag gesture logic for BottomSheet.
 *
 * @param {object} options
 * @param {() => void} options.onClose - Callback to close the sheet.
 * @param {boolean} options.disabled - If true, swipe-to-dismiss is inactive.
 * @param {number} [options.threshold=80] - px threshold to trigger close on drag.
 * @returns {{ handleDragEnd, dragProps }}
 */
const useBottomSheetGestures = ({ onClose, disabled, threshold = 80 }) => {
  const handleDragEnd = useCallback(
    (_event, info) => {
      if (!disabled && info.offset.y > threshold) {
        // Haptic feedback — safe guard for unsupported environments
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(15); } catch { /* noop */ }
        }
        onClose();
      }
    },
    [disabled, onClose, threshold],
  );

  const dragProps = {
    drag: 'y',
    dragConstraints: { top: 0 },
    dragElastic: 0.12,
    dragMomentum: false,
    onDragEnd: handleDragEnd,
  };

  return { handleDragEnd, dragProps };
};

export default useBottomSheetGestures;
