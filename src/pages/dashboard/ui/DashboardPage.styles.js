import { COLORS, SHADOWS, RADIUS, FONTS } from '@shared/config';

export const styles = {
  dashboardContainer: (isDesktop) => ({
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    ...(isDesktop
      ? {
          height: '100dvh',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 5fr) minmax(400px, 7fr)',
          gridTemplateRows: 'min-content minmax(0, 1fr)',
          gap: '24px',
          padding: '24px',
        }
      : {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px',
          height: 'auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }),
  }),

  welcomeContainer: (isDesktop) => ({
    minWidth: 0,
    ...(isDesktop
      ? {
          gridColumn: '1',
          gridRow: '1',
          alignSelf: 'stretch',
        }
      : {
          width: '100%',
        }),
  }),

  statsContainer: (isDesktop) => ({
    minWidth: 0,
    ...(isDesktop
      ? {
          gridColumn: '2',
          gridRow: '1',
          alignSelf: 'stretch',
        }
      : {
          width: '100%',
        }),
  }),

  recentsContainer: (isDesktop) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
    ...(isDesktop
      ? {
          gridColumn: '1',
          gridRow: '2',
          minHeight: 0,
          height: '100%',
          overflow: 'visible',
        }
      : {
          width: '100%',
        }),
  }),

  mapContainer: (isDesktop) => ({
    minWidth: 0,
    ...(isDesktop
      ? {
          gridColumn: '2',
          gridRow: '2',
          minHeight: 0,
          height: '100%',
        }
      : {
          width: '100%',
        }),
  }),

  mapSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    height: '100%',
    minWidth: 0,
    minHeight: 0,
  },

  mapCard: (isDesktop) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    boxShadow: SHADOWS.md,
    backgroundColor: COLORS.background, // Handled internally by map ocean trick
    position: 'relative',
    ...(isDesktop
      ? {
          flex: 1,
          height: '100%',
        }
      : {
          width: '100%',
          height: '240px',
          minHeight: '240px',
          flexShrink: 0,
        }),
  }),

  mapErrorFallback: (isMobile) => ({
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: isMobile ? '200px' : '220px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    overflow: 'hidden',
    backgroundColor: '#e0e6ed', // Matches HomeMap MAP_OCEAN_COLOR
    borderRadius: RADIUS.xl,
  }),

  mapErrorBackdrop: {
    position: 'absolute',
    inset: 0,
    filter: 'blur(0.2px)',
  },

  mapErrorGlowA: {
    position: 'absolute',
    width: '40%',
    aspectRatio: '1 / 1',
    top: '10%',
    right: '25%',
    borderRadius: '50%',
    background: '#ffffff',
    filter: 'blur(30px)',
    opacity: 0.5,
  },

  mapErrorGlowB: {
    position: 'absolute',
    width: '50%',
    aspectRatio: '1 / 1',
    left: '10%',
    bottom: '10%',
    borderRadius: '50%',
    background: '#ffffff',
    filter: 'blur(40px)',
    opacity: 0.4,
  },

  mapErrorGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.15,
    backgroundImage: `linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
    maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 30%, transparent 90%)',
  },

  mapErrorPanel: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    textAlign: 'center',
  },

  mapErrorText: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: COLORS.textSecondary,
    maxWidth: '34ch',
  },

  mapRetryBtn: {
    border: `1px solid ${COLORS.atomicTangerine}55`,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.atomicTangerine,
    color: COLORS.surface,
    minHeight: '44px',
    padding: '10px 18px',
    fontSize: '0.86rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.01em',
    boxShadow: `0 10px 20px ${COLORS.atomicTangerine}40`,
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: '8px',
    marginTop: 0,
    paddingTop: 0,
    minHeight: '44px',
  },

  sectionTitle: {
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    lineHeight: 1,
    minWidth: 0,
    flex: 1,
  },

  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 107, 53, 0.06)',
    border: '1px solid rgba(255, 107, 53, 0.15)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontFamily: FONTS.body,
    fontWeight: '800',
    color: COLORS.atomicTangerine,
    padding: '8px 18px',
    minHeight: '40px',
    borderRadius: RADIUS.full,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },

  cardsList: (isDesktop) => {
    if (isDesktop) {
      return {
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: 'visible',
      };
    }
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
      gridTemplateRows: 'auto',
      alignItems: 'stretch',
      gap: '12px',
      minWidth: 0,
      minHeight: 0,
      overflow: 'visible',
    };
  },

  dashboardErrorCard: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '14px',
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.border}`,
    background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.background} 100%)`,
    boxShadow: SHADOWS.sm,
    minWidth: 0,
  },

  dashboardErrorText: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.4,
    fontWeight: 700,
    color: COLORS.textPrimary,
  },

  dashboardErrorHint: {
    margin: 0,
    fontSize: '0.8rem',
    lineHeight: 1.35,
    color: COLORS.textSecondary,
    overflowWrap: 'anywhere',
  },
};
