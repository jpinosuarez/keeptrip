import React, { useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { COLORS, SHADOWS, RADIUS, GLASS } from '@shared/config';

/**
 * BottomSheet — Modal deslizable desde abajo para móvil.
 * Usa Framer Motion drag para "swipe-to-dismiss".
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - children: ReactNode
 *  - zIndex: number (default 12000)
 *  - disableClose: boolean — deshabilita cierre por drag/overlay (ej. durante carga)
 */
const BottomSheet = ({ isOpen, onClose, children, zIndex = 12000, disableClose = false }) => {
  const handleDragEnd = useCallback((_e, info) => {
    if (!disableClose && info.offset.y > 80) {
      onClose();
    }
  }, [disableClose, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <Motion.div
            key="bs-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ ...overlayStyle, zIndex }}
            onClick={disableClose ? undefined : onClose}
          />

          {/* Sheet */}
          <Motion.div
            key="bs-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ ...sheetStyle, zIndex: zIndex + 1 }}
          >
            {/* Handle / drag indicator */}
            <div style={handleBarRow}>
              <div style={handleBar} />
            </div>

            {children}
          </Motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  ...GLASS.overlay,
};

const sheetStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: COLORS.surface,
  borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
  boxShadow: SHADOWS.float,
  maxHeight: '92dvh',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
};

const handleBarRow = {
  display: 'flex',
  justifyContent: 'center',
  padding: '12px 0 4px',
  cursor: 'grab',
};

const handleBar = {
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: COLORS.border,
};

export default BottomSheet;
