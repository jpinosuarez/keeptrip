import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/lib/utils/cn';
import BottomSheetHeader from './BottomSheetHeader.jsx';
import BottomSheetContent from './BottomSheetContent.jsx';
import useBottomSheetGestures from './useBottomSheetGestures.js';

/**
 * BottomSheet
 * Slide-up modal panel with swipe-to-dismiss and haptic feedback.
 */
const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SHELL_EASE_OUT = [0.22, 1, 0.36, 1];

const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.3, ease: SHELL_EASE_OUT },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.3, ease: SHELL_EASE_OUT },
  },
};

const BottomSheet = ({
  isOpen,
  onClose,
  children,
  disableClose = false,
  ariaLabel = 'Bottom sheet',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef(null);
  const prevFocusRef = useRef(null);

  const handleClose = useCallback(() => {
    if (!disableClose) onClose();
  }, [disableClose, onClose]);

  const { dragProps } = useBottomSheetGestures({
    onClose: handleClose,
    disabled: disableClose,
  });

  useEffect(() => {
    if (!isOpen) return;

    prevFocusRef.current = document.activeElement;
    sheetRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      prevFocusRef.current?.focus?.();
    };
  }, [handleClose, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <Motion.div
            key="bs-overlay"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2, ease: SHELL_EASE_OUT }}
            onClick={handleClose}
            className={cn(
              "fixed inset-0 z-modal bg-overlay backdrop-blur-sm",
              disableClose ? "cursor-default" : "cursor-pointer"
            )}
          />

          {/* Sheet panel */}
          <Motion.div
            key="bs-sheet"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "app-shell-focus fixed bottom-0 left-0 right-0 z-modal",
              "bg-surface rounded-t-xl flex flex-col will-change-transform max-h-[92dvh]",
              isDragging ? "shadow-2xl" : "shadow-float"
            )}
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            tabIndex={-1}
            {...dragProps}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              dragProps.onDragEnd(e, info);
            }}
          >
            <BottomSheetHeader isDragging={isDragging} />
            <BottomSheetContent>{children}</BottomSheetContent>
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
