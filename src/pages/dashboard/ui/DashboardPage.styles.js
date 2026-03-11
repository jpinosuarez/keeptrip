import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const styles = {
  dashboardContainer: (isMobile) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '16px' : '24px',
    padding: isMobile ? '16px 16px 80px' : '32px 32px 40px',
    boxSizing: 'border-box',
  }),

  welcomeArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.2,
  },

  subtitle: {
    margin: '8px 0 0',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },

  headerStatsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },

  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: COLORS.surface,
    padding: '8px 16px',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.sm,
    border: `1px solid rgba(44,62,80,0.06)`,
    minWidth: '80px',
    flex: '1 1 auto',
  },

  // Países: el achievement core. Más jerarquía que los soportes.
  statPillFeatured: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: COLORS.surface,
    padding: '12px 20px',
    borderRadius: RADIUS.xl,
    boxShadow: `0 4px 16px ${COLORS.atomicTangerine}25, 0 2px 8px rgba(0,0,0,0.04)`,
    border: `1px solid ${COLORS.atomicTangerine}30`,
    minWidth: '120px',
    flex: '2 1 auto',
  },

  pillIcon: (color) => ({
    backgroundColor: color,
    borderRadius: RADIUS.sm,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),

  // Ícono del pill featured: 36px para escalar con el número 1.4rem
  pillIconFeatured: (color) => ({
    backgroundColor: color,
    borderRadius: RADIUS.sm,
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),

  pillValue: {
    fontSize: '1rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1,
  },

  pillValueFeatured: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1,
  },

  // Fracción "/ 195" en pill featured
  pillFraction: {
    fontSize: '0.8rem',
    fontWeight: '400',
    color: COLORS.textSecondary,
  },

  pillContent: {
    display: 'flex',
    flexDirection: 'column',
  },

  pillLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginTop: '4px',
  },

  mainGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
    gap: '24px',
    alignItems: 'start',
  }),

  mapCard: (isMobile) => ({
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: isMobile ? '240px' : '360px',
    boxShadow: SHADOWS.md,
    backgroundColor: COLORS.surface,
  }),

  recentsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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

  travelCard: (isMobile) => ({
    position: 'relative',
    minWidth: isMobile ? undefined : '160px',
    width: isMobile ? '100%' : '160px',
    height: '208px',
    borderRadius: isMobile ? RADIUS.lg : RADIUS.xl,
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: isMobile ? undefined : 0,
    boxShadow: SHADOWS.md,
  }),

  cardBackground: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },

  cardGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
  },

  cardContent: {
    position: 'absolute',
    inset: 0,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'flex-end',
  },

  cardBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  flagImg: {
    width: '28px',
    height: '20px',
    objectFit: 'cover',
    borderRadius: RADIUS.xs,
    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))',
  },

  cardTitle: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '800',
    color: 'white',
    textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  welcomeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    textAlign: 'center',
    boxShadow: SHADOWS.sm,
    border: `1px solid rgba(44,62,80,0.06)`,
    width: '100%',
  },

  welcomeArt: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '88px',
    height: '88px',
  },

  welcomeArtOrbit: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: `${COLORS.mutedTeal}20`,
    borderRadius: '50%',
    padding: '6px',
    display: 'flex',
  },

  welcomeTitle: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
  },

  welcomeText: {
    margin: 0,
    fontSize: '0.875rem',
    color: COLORS.textSecondary,
    lineHeight: 1.5,
    maxWidth: '280px',
  },

  welcomeCta: {
    backgroundColor: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.md,
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: `0 4px 14px ${COLORS.atomicTangerine}40`,
    transition: 'opacity 0.15s',
    minHeight: '44px',
    minWidth: '240px',
  },
};
