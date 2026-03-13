import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const tripStyles = {
  cardBase: (isMobile, variant) => {
    const isGrid = variant === 'grid';
    return {
      position: 'relative',
      minWidth: isGrid ? 'auto' : (isMobile ? undefined : '160px'),
      width: isGrid ? '100%' : (isMobile ? '100%' : '160px'),
      height: isGrid ? '280px' : '220px', // Taller for cinematic feel
      borderRadius: isMobile ? RADIUS.lg : RADIUS.xl,
      overflow: 'hidden',
      cursor: 'pointer',
      flexShrink: isGrid || isMobile ? undefined : 0,
      boxShadow: SHADOWS.lg,
      backgroundColor: COLORS.surface,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    };
  },

  bgWrapper: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    overflow: 'hidden',
    borderRadius: 'inherit'
  },

  bgImage: (url) => ({
    position: 'absolute',
    inset: '-10%', // Leave bleeding room for parallax
    width: '120%',
    height: '120%',
    backgroundImage: url ? `url(${url})` : 'none',
    backgroundColor: url ? 'transparent' : COLORS.mutedTeal,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    willChange: 'transform'
  }),

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
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '12px',
  },

  flagsRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
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
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'background-color 0.2s',
  },

  bottomContent: {
    position: 'relative',
    zIndex: 2,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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

  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '6px',
  },
};
