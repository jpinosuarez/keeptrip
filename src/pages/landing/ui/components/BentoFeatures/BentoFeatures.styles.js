import { COLORS, FONTS, RADIUS, SHADOWS } from '@shared/config';

export const styles = {
  featuresSection: (isMobile) => ({
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? '32px 24px 64px' : '40px 48px 100px',
    display: isMobile ? 'flex' : 'grid',
    flexDirection: isMobile ? 'column' : undefined,
    gridTemplateColumns: !isMobile ? 'repeat(12, 1fr)' : undefined,
    gridAutoRows: !isMobile ? 'minmax(220px, auto)' : undefined,
    gap: isMobile ? '32px' : '24px', // Generous whitespace on mobile
    position: 'relative',
    zIndex: 10,
  }),

  featureCard: (isMobile, index) => {
    let colSpan = 'span 12';
    if (!isMobile) {
      if (index === 0) colSpan = 'span 7';
      else if (index === 1) colSpan = 'span 5';
      else colSpan = 'span 12';
    }

    return {
      gridColumn: !isMobile ? colSpan : undefined,
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderRadius: RADIUS.xl,
      padding: isMobile ? '32px 24px' : '40px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      border: `1px solid rgba(255,255,255, 0.8)`,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minHeight: '260px',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    };
  },

  featureCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  featureCardIconWrap: (color) => ({
    width: '48px', 
    height: '48px',
    borderRadius: RADIUS.lg,
    background: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),

  featureCardNum: (color) => ({
    fontSize: '0.8rem',
    fontWeight: '900',
    color: color,
    letterSpacing: '1.5px',
    opacity: 0.5,
    textTransform: 'uppercase',
  }),

  featureCardTitle: (isMobile, index) => ({
    fontSize: (!isMobile && index === 0) ? '1.8rem' : '1.3rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
    marginTop: 'auto',
  }),

  featureDesc: (isMobile, index) => ({
    margin: 0,
    fontSize: (!isMobile && index === 0) ? '1.05rem' : '0.95rem',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    fontFamily: FONTS.body,
    maxWidth: (!isMobile && index === 0) ? '80%' : '100%',
  }),

  // World Map Container (Card 1)
  worldMapContainer: {
    position: 'relative',
    width: '100%',
    flex: 1,
    minHeight: '240px',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
    border: '1px solid #E2E8F0',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  // Travel Stats Grid (Card 2 Refactor)
  statsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px 0',
    flex: 1,
  },

  statsRow: {
    display: 'flex',
    gap: '16px',
    width: '100%',
  },

  statSubCard: {
    flex: 1,
    background: 'rgba(248, 250, 252, 0.8)', // Slate 50 with light transparency
    padding: '24px 20px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(226, 232, 240, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },

  statNumber: {
    fontSize: '3.2rem', // Massive impactful numbers
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1,
    letterSpacing: '-2px',
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
  },

  statLabel: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },

  statIconWrap: {
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  // Masonry Gallery Mock (Card 3)
  masonryVisualContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
    margin: '16px 0 0',
    overflow: 'hidden',
    position: 'relative',
  },

  masonryCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },

  masonryImg: (url, height) => ({
    width: '100%',
    height: height,
    backgroundImage: `url("${url}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: RADIUS.lg,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    position: 'relative',
    overflow: 'hidden',
  }),

  galleryContextPill: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: RADIUS.full,
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  },

  galleryContextLabel: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
    letterSpacing: '0.5px',
  },

  masonryOverlayCount: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: RADIUS.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: '800',
    gap: '4px',
  }

};
