import { COLORS, RADIUS, SHADOWS } from '@shared/config';

export const styles = {
  heroVisual: {
    position: 'relative',
    width: '100%',
    height: '420px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${COLORS.atomicTangerine}30 0%, transparent 65%)`,
    pointerEvents: 'none',
    zIndex: 1,
  },

  tripCardsStack: {
    position: 'relative',
    width: '280px',
    height: '360px',
    zIndex: 2,
    perspective: '1000px', // Adds depth for simple 3d transforms if needed
  },

  // Carousel Controls — Lateral side buttons
  heroNavControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'calc(100% + 72px)', // extends beyond card edges for laterality
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none', // container is invisible, only buttons capture events
  },

  heroNavBtn: {
    width: '48px',
    height: '48px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    color: COLORS.charcoalBlue,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.07)',
    pointerEvents: 'all', // re-enable events on actual buttons
    flexShrink: 0,
  },
};
