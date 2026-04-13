import { COLORS, SHADOWS, RADIUS } from '@shared/config';

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
          overflow: 'hidden',
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

  mapSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    fontSize: '0.8rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    lineHeight: 1,
    flexShrink: 0,
    minHeight: '44px',
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
    padding: '16px',
    overflow: 'hidden',
    color: COLORS.textPrimary,
    background: `linear-gradient(160deg, ${COLORS.background} 0%, ${COLORS.surface} 56%, #f1f5f9 100%)`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.xl,
  }),

  mapErrorBackdrop: {
    position: 'absolute',
    inset: 0,
    filter: 'blur(0.2px)',
  },

  mapErrorGlowA: {
    position: 'absolute',
    width: '56%',
    aspectRatio: '1 / 1',
    top: '-22%',
    right: '-8%',
    borderRadius: '50%',
    background: `${COLORS.atomicTangerine}28`,
    filter: 'blur(18px)',
  },

  mapErrorGlowB: {
    position: 'absolute',
    width: '62%',
    aspectRatio: '1 / 1',
    left: '-22%',
    bottom: '-30%',
    borderRadius: '50%',
    background: `${COLORS.mutedTeal}30`,
    filter: 'blur(20px)',
  },

  mapErrorGrid: {
    position: 'absolute',
    inset: 0,
    opacity: 0.4,
    backgroundImage: `linear-gradient(${COLORS.border} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px)`,
    backgroundSize: '36px 36px',
    maskImage: 'radial-gradient(circle at 60% 40%, black 30%, transparent 90%)',
  },

  mapErrorPanel: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: 'min(92%, 380px)',
    padding: '16px',
    textAlign: 'center',
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLORS.border}`,
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(8px)',
    boxShadow: SHADOWS.md,
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
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: COLORS.atomicTangerine,
    padding: '10px 16px',
    minHeight: '44px',
    borderRadius: RADIUS.sm,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },

  cardsList: (isDesktop, count = 0) => {
    let gridTemplateColumns = 'repeat(1, minmax(0, 1fr))';
    let gridTemplateRows = 'minmax(0, 1fr)';

    if (isDesktop) {
      if (count === 1) {
        gridTemplateColumns = 'minmax(0, 1fr)';
        gridTemplateRows = 'minmax(0, 1fr)';
      } else if (count === 2) {
        gridTemplateColumns = 'minmax(0, 1fr)';
        gridTemplateRows = 'repeat(2, minmax(0, 1fr))';
      } else if (count >= 3) {
        gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        gridTemplateRows = 'repeat(2, minmax(0, 1fr))';
      }
    } else {
      gridTemplateColumns = 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))';
      gridTemplateRows = 'auto';
    }

    return {
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows,
      alignItems: 'stretch',
      gap: '12px',
      minWidth: 0,
      minHeight: 0,
      ...(isDesktop
        ? {
            flex: 1,
            overflow: 'hidden',
          }
        : {
            overflow: 'visible',
          }),
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
