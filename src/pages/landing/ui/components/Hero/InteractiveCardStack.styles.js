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

  tripCardMock: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: RADIUS['2xl'] || '20px',
    overflow: 'hidden',
    boxShadow: SHADOWS?.xl || '0 24px 48px rgba(0,0,0,0.15)',
    border: '4px solid white', // creates a polaroid/frame effect
    cursor: 'grab',
    transformOrigin: 'bottom center', // rotaciones ancladas abajo
    backgroundColor: '#fff',
  },

  tripCardMockImage: (url) => ({
    width: '100%',
    height: '100%',
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    pointerEvents: 'none',
  }),

  tripCardMockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 50%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px',
    pointerEvents: 'none',
  },

  tripCardMockPill: {
    alignSelf: 'flex-end',
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: RADIUS.full,
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    border: '1px solid rgba(255, 255, 255, 0.4)'
  },

  tripCardMockContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  tripCardMockTitle: {
    color: '#ffffff',
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '900',
    lineHeight: 1.1,
    letterSpacing: '-0.5px'
  },

  tripCardMockDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '600',
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
