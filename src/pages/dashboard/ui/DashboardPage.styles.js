import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const styles = {
  dashboardContainer: (isMobile) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '10px' : '16px', // Reduce el gap vertical
    padding: isMobile ? '16px 16px 80px' : '32px 32px 32px', // Reduce padding inferior
    boxSizing: 'border-box',
  }),

  welcomeArea: (isMobile) => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'flex-end',
    gap: '16px',
  }),

  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.2,
  },

  subtitle: {
    margin: '8px 0 0',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },  statsBanner: {
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    boxShadow: SHADOWS.sm,
  },
  levelLine: {
    margin: '6px 0 0',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },

  ctaDesktop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.xl,
    padding: '10px 20px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 4px 14px ${COLORS.atomicTangerine}40`,
    minHeight: '44px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    letterSpacing: '-0.01em',
  },

  fabMobile: {
    position: 'fixed',
    bottom: '80px',
    right: '16px',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '16px 24px',
    fontSize: '0.95rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${COLORS.atomicTangerine}60, 0 4px 12px rgba(0,0,0,0.2)`,
    minHeight: '56px',
  },

  mainGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) 320px',
    gap: isMobile ? '16px' : '18px',
    alignItems: isMobile ? 'stretch' : 'center', // Centra verticalmente en desktop
    justifyContent: 'center', // Centra horizontalmente el grid
  }),

  mapCard: (isMobile) => ({
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    aspectRatio: '2.2/1', // Relación de aspecto más panorámica
    height: isMobile ? 'auto' : 'auto', // Deja que aspectRatio controle el alto
    minHeight: isMobile ? '160px' : '220px', // Asegura suficiente altura
    maxHeight: isMobile ? '260px' : '320px', // Evita que sea demasiado grande
    boxShadow: SHADOWS.md,
    backgroundColor: COLORS.surface,
    cursor: 'crosshair',
  }),

  mapErrorFallback: (isMobile) => ({
    width: '100%',
    height: '100%',
    minHeight: isMobile ? '160px' : '220px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '16px',
    textAlign: 'center',
    color: COLORS.textPrimary,
    background: `linear-gradient(160deg, ${COLORS.surface} 0%, ${COLORS.background} 100%)`,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.xl,
  }),

  mapErrorText: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: COLORS.textSecondary,
    maxWidth: '34ch',
  },

  mapRetryBtn: {
    border: 'none',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.atomicTangerine,
    color: COLORS.surface,
    minHeight: '44px',
    padding: '10px 16px',
    fontSize: '0.86rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `0 6px 14px ${COLORS.atomicTangerine}45`,
  },

  recentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px', // Reduce el gap interno
    marginTop: '-8px', // Sube el bloque de aventuras recientes
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },

  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: COLORS.atomicTangerine,
    padding: '8px 12px',
    minHeight: '44px',
    minWidth: '44px',
    borderRadius: RADIUS.sm,
  },

  cardsList: (isMobile) => ({
    display: isMobile ? 'grid' : 'flex',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : undefined,
    flexDirection: isMobile ? undefined : 'row',
    gap: '8px',
    overflowX: isMobile ? 'hidden' : 'auto',
    paddingBottom: isMobile ? '0' : '8px',
    scrollbarWidth: 'none',
  }),

};
