import { COLORS, SHADOWS, RADIUS } from '@shared/config';

export const styles = {
  dashboardContainer: (isMobile) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '20px' : '28px',
    padding: isMobile ? '16px 16px 80px' : '28px 28px 40px',
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
    margin: '6px 0 0',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },

  headerStatsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },

  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: COLORS.surface,
    padding: '10px 16px',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.sm,
    border: `1px solid rgba(44,62,80,0.06)`,
    minWidth: '100px',
    flex: '1 1 auto',
  },

  pillIcon: (color) => ({
    backgroundColor: color,
    borderRadius: '10px',
    width: '30px',
    height: '30px',
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

  pillLabel: {
    fontSize: '0.65rem',
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginTop: '2px',
  },

  mainGrid: (isMobile) => ({
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
    gap: '20px',
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
    gap: '12px',
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
    padding: '4px 0',
  },

  cardsList: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
    scrollbarWidth: 'none',
  },

  travelCard: {
    position: 'relative',
    minWidth: '160px',
    width: '160px',
    height: '210px',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: SHADOWS.md,
  },

  cardBackground: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },

  cardGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.7) 100%)',
  },

  cardContent: {
    position: 'absolute',
    inset: 0,
    padding: '12px',
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
    borderRadius: '3px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  cardTitle: {
    margin: 0,
    fontSize: '0.85rem',
    fontWeight: '800',
    color: 'white',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.72rem',
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
    width: '90px',
    height: '90px',
  },

  welcomeArtOrbit: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: `${COLORS.atomicTangerine}20`,
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
    fontSize: '0.87rem',
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
  },
};
