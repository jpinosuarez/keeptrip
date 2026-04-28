import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const tripStyles = {
  cardBase: (variant) => {
    return {
      position: 'relative',
      cursor: 'default',
    };
  },

  bgWrapper: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius: 'inherit'
  },

  bgImageHolder: {
    position: 'absolute',
    inset: '-10%', // Leave bleeding room for parallax
    width: '120%',
    height: '120%',
    backgroundColor: COLORS.mutedTeal,
    willChange: 'transform'
  },

  // Invisible UI Gradient Overlay
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)',
    pointerEvents: 'none'
  },

  topContent: {
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
  },

  flagsRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: '6px',
  },

  // State-of-the-art Floating Pills
  glassPill: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: '9999px',
    padding: '4px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.2px'
  },

  flagImg: {
    width: '24px',
    height: '24px',
    objectFit: 'cover',
    borderRadius: '50%', // Circle flags for pills
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.2)'
  },

  actionBtn: {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'background-color 0.2s',
  },

  bottomContent: {
    position: 'relative',
    zIndex: 2,
    boxSizing: 'border-box',
    minWidth: 0,
  },

  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'white',
    textShadow: '0 2px 8px rgba(0,0,0,0.7)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.1,
    letterSpacing: '-0.5px'
  },

  fallbackAuraContainer: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },

  fallbackAuraTrack: {
    display: 'grid',
    width: '100%',
    height: '100%',
    filter: 'blur(1px) scale(1.05)',
  },

  fallbackAuraFlag: {
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
    objectFit: 'cover',
  },

  fallbackAuraOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    pointerEvents: 'none',
  },

  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
  },
};
