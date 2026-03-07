import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS, SPACING, FONTS } from '@shared/config';

export const styles = {
  // ==========================================================
  //  OVERLAY BASE
  // ==========================================================
  expandedOverlay: { 
    position: 'fixed', inset: 0, backgroundColor: COLORS.background, zIndex: 10000, overflowY: 'auto' 
  },

  // ==========================================================
  //  HERO — Rediseño inmersivo Bento/Glassmorphism
  // ==========================================================
  heroWrapper: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: (foto, isMobile = false) => ({
    width: '100%',
    height: foto
      ? (isMobile ? '45vh' : '60vh')
      : (isMobile ? '32vh' : '40vh'),
    minHeight: isMobile ? '240px' : '320px',
    position: 'relative',
    backgroundImage: foto ? `url(${foto})` : 'none',
    backgroundColor: foto ? 'transparent' : COLORS.charcoalBlue,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: `0 0 var(--radius-2xl) var(--radius-2xl)`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  }),
  heroGradient: {
    position: 'absolute',
    inset: 0,
    borderRadius: `0 0 var(--radius-2xl) var(--radius-2xl)`,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85) 100%)',
    pointerEvents: 'none',
  },

  // ==========================================================
  //  FLOATING NAV BAR — Glass pill top
  // ==========================================================
  navBar: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    right: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  iconBtn: (disabled = false) => ({ 
    ...GLASS.dark,
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    width: '44px',
    height: '44px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: TRANSITIONS.fast,
    boxShadow: SHADOWS.md,
  }),
  navActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  primaryBtn: (isSave, disabled = false) => ({
    ...GLASS.dark,
    background: isSave
      ? COLORS.atomicTangerine
      : 'rgba(255, 255, 255, 0.9)',
    color: isSave ? 'white' : COLORS.charcoalBlue,
    border: isSave ? 'none' : '1px solid rgba(255,255,255,0.3)',
    borderRadius: RADIUS.full,
    padding: '10px 22px', 
    fontFamily: FONTS.body,
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    opacity: disabled ? 0.6 : 1,
    transition: TRANSITIONS.fast,
    boxShadow: isSave ? SHADOWS.glow : SHADOWS.md,
    backdropFilter: isSave ? 'none' : 'blur(10px)',
    WebkitBackdropFilter: isSave ? 'none' : 'blur(10px)',
  }),
  secondaryBtn: (disabled = false) => ({
    ...GLASS.dark,
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: TRANSITIONS.fast,
    boxShadow: SHADOWS.md,
  }),

  // ==========================================================
  //  HERO CONTENT — anclado abajo del hero
  // ==========================================================
  heroContent: (isMobile = false) => ({
    position: 'relative',
    zIndex: 10,
    padding: isMobile ? '0 16px 20px' : '0 32px 32px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  }),
  flagRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  flagImg: {
    width: '36px',
    height: 'auto',
    borderRadius: RADIUS.xs,
    boxShadow: SHADOWS.md,
    border: '1px solid rgba(255,255,255,0.2)',
  },
  flagIcon: {
    fontSize: '2.4rem',
    textShadow: '0 4px 10px rgba(0,0,0,0.3)',
  },
  titleDisplay: { 
    color: 'white',
    fontFamily: FONTS.heading,
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    fontWeight: '900',
    margin: '4px 0',
    lineHeight: 1.05,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 30px rgba(0,0,0,0.4)',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
  metaBadge: { 
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px', 
    ...GLASS.dark,
    padding: '7px 14px',
    borderRadius: RADIUS.full,
    color: 'white',
    fontSize: '0.82rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  sharedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...GLASS.dark,
    padding: '7px 14px',
    borderRadius: RADIUS.full,
    color: '#e0e7ff',
    fontSize: '0.82rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  // ==========================================================
  //  TIMELINE NARRATIVO (Modo Ruta — vertical dot-line)
  // ==========================================================
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    position: 'relative',
  },
  timelineRow: {
    display: 'flex',
    gap: '16px',
    position: 'relative',
    alignItems: 'flex-start',
  },
  timelineTrack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    minWidth: '20px',
    paddingTop: '18px',
  },
  timelineDotActive: {
    width: '12px',
    height: '12px',
    borderRadius: RADIUS.full,
    background: COLORS.atomicTangerine,
    border: '3px solid white',
    boxShadow: SHADOWS.glow,
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
  },
  timelineDotInactive: {
    width: '10px',
    height: '10px',
    borderRadius: RADIUS.full,
    background: COLORS.border,
    border: '2px solid white',
    boxShadow: SHADOWS.sm,
    position: 'relative',
    zIndex: 2,
    flexShrink: 0,
  },
  timelineLine: {
    width: '2px',
    flexGrow: 1,
    background: COLORS.border,
    minHeight: '24px',
    marginTop: '4px',
  },
  transportIconOnLine: {
    position: 'absolute',
    left: '0',
    bottom: '-4px',
    width: '20px',
    textAlign: 'center',
    fontSize: '0.9rem',
    zIndex: 3,
  },
  climaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    color: COLORS.textSecondary,
    background: COLORS.background,
    padding: '4px 10px',
    borderRadius: RADIUS.full,
    border: `1px solid ${COLORS.border}`,
    width: 'fit-content',
  },
  paradaRelato: {
    marginTop: '6px',
    padding: '10px 14px',
    background: COLORS.background,
    borderRadius: RADIUS.sm,
    borderLeft: `3px solid ${COLORS.mutedTeal}`,
  },
  paradaRelatoText: {
    fontSize: '0.88rem',
    lineHeight: 1.6,
    color: COLORS.textPrimary,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  highlightListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
  },

  // ==========================================================
  //  STORYTELLING (Modo Ruta — dentro del hero)
  // ==========================================================
  storytellingRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  storytellingChip: {
    padding: '5px 10px',
    borderRadius: RADIUS.full,
    ...GLASS.dark,
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.78rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  storytellingVibeChip: {
    padding: '5px 10px',
    borderRadius: RADIUS.full,
    background: 'rgba(255, 107, 53, 0.2)',
    color: '#ffd4b8',
    fontSize: '0.78rem',
    fontWeight: '600',
    border: '1px solid rgba(255, 107, 53, 0.25)',
  },
  companionDot: {
    width: '26px',
    height: '26px',
    borderRadius: RADIUS.full,
    ...GLASS.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  highlightTag: {
    ...GLASS.dark,
    padding: '6px 12px',
    borderRadius: RADIUS.full,
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.78rem',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  // ==========================================================
  //  FOTO CREDITO
  // ==========================================================
  creditLink: {
    position: 'absolute',
    bottom: '16px',
    right: '20px',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.72rem',
    textDecoration: 'none',
    ...GLASS.dark,
    padding: '5px 12px',
    borderRadius: RADIUS.full,
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    zIndex: 20,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  
  sectionTitle: { 
    fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', 
    color: COLORS.mutedTeal, marginBottom: '15px', fontWeight: '800' 
  },
  galleryHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px'
  },
  galleryToggleBtn: (active = false) => ({
    border: `1px solid ${active ? COLORS.atomicTangerine : COLORS.border}`,
    background: active ? `${COLORS.atomicTangerine}15` : 'white',
    color: active ? COLORS.atomicTangerine : COLORS.textPrimary,
    borderRadius: RADIUS.full,
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  }),
  gallerySubtitle: {
    marginTop: '-6px',
    marginBottom: '12px',
    color: COLORS.textSecondary,
    fontSize: '0.9rem'
  },
  readText: { fontSize: '1.1rem', lineHeight: 1.7, color: COLORS.charcoalBlue, whiteSpace: 'pre-wrap' },
  galleryManageBlock: {
    marginTop: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px'
  },
  galleryManageCard: (isPortada) => ({
    border: `1px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    background: COLORS.surface,
    boxShadow: isPortada ? SHADOWS.md : SHADOWS.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px'
  }),
  galleryManageImg: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: RADIUS.sm
  },
  captionInput: {
    width: '100%',
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.sm,
    padding: '6px 8px',
    fontSize: '0.85rem',
    color: COLORS.textPrimary,
    outline: 'none',
    background: COLORS.background
  },
  galleryActionsRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  galleryActionBtn: (isPortada) => ({
    border: `1px solid ${isPortada ? COLORS.atomicTangerine : COLORS.border}`,
    background: isPortada ? `${COLORS.atomicTangerine}15` : 'white',
    color: isPortada ? COLORS.atomicTangerine : COLORS.textPrimary,
    borderRadius: RADIUS.full,
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  }),
  galleryDangerBtn: {
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.danger,
    borderRadius: RADIUS.full,
    padding: '6px 10px',
    fontSize: '0.75rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  
  // (legacy timeline/stopCard styles removed — replaced by timelineContainer/Row/Track above)
  emptyState: { fontStyle: 'italic', color: COLORS.textSecondary },
  weatherNote: {
    marginTop: '8px',
    fontSize: '0.9rem',
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: COLORS.background,
    padding: '8px 12px',
    borderRadius: RADIUS.sm
  },
  verifiedBadge: {
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    fontWeight: '800',
    color: COLORS.mutedTeal,
    background: COLORS.surface,
    padding: '2px 6px',
    borderRadius: RADIUS.xs
  },

  // ==========================================================
  //  MODO RUTA — Desktop: split layout (scroll + sticky map)
  // ==========================================================
  routeLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0',
    maxWidth: '100%',
    margin: '0',
    minHeight: 'calc(100vh - 50vh)', // al menos lo que queda post-hero
  },
  scrollColumn: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 60px)',
    padding: '40px 40px 40px 40px',
    display: 'flex',
    flexDirection: 'column',
  },
  mapColumn: {
    position: 'sticky',
    top: 0,
    height: '100vh',
    padding: SPACING.md,
  },

  // ==========================================================
  //  MODO RUTA — Mobile: single column + FAB
  // ==========================================================
  mobileColumn: {
    maxWidth: '100%',
    padding: '24px 20px calc(100px + env(safe-area-inset-bottom, 0px)) 20px',
    display: 'flex',
    flexDirection: 'column',
  },
  fab: {
    position: 'fixed',
    bottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
    right: 'max(24px, env(safe-area-inset-right, 0px))',
    width: '56px',
    height: '56px',
    borderRadius: RADIUS.full,
    background: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: SHADOWS.float,
    cursor: 'pointer',
    zIndex: 30,
    transition: TRANSITIONS.fast,
  },
  mapModal: {
    position: 'fixed',
    inset: 0,
    zIndex: 10001, // por encima del overlay del visor
    background: COLORS.charcoalBlue,
    display: 'flex',
    flexDirection: 'column',
  },
  mapModalClose: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 10,
    ...GLASS.dark,
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
  },

  // ==========================================================
  //  MODO DESTINO — Single column centered
  // ==========================================================
  destinoBody: (isMobile = false) => ({
    maxWidth: '800px',
    margin: '0 auto',
    padding: isMobile ? '20px 16px' : '40px',
    display: 'flex',
    flexDirection: 'column',
  }),
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: SPACING.md,
    marginBottom: '32px',
  },

  // ─── Carrusel horizontal (mobile) con scroll-snap ───
  contextCarouselWrapper: {
    position: 'relative',
    marginBottom: '32px',
  },
  contextCarousel: {
    display: 'flex',
    gap: SPACING.md,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: '12px',
    // Ocultar scrollbar nativo (CSS se pone en index.css para ::-webkit-scrollbar)
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  contextCarouselCard: {
    minWidth: '220px',
    maxWidth: '280px',
    flex: '0 0 auto',
    scrollSnapAlign: 'start',
  },
  // Gradiente "peek" — indica que hay más cards a la derecha
  contextCarouselPeek: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: '12px',
    width: '48px',
    background: 'linear-gradient(to right, transparent, rgba(248,250,252,0.95))',
    pointerEvents: 'none',
    zIndex: 2,
    borderRadius: `0 ${RADIUS.lg} ${RADIUS.lg} 0`,
  },
  // Dot indicators
  contextCarouselDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '4px',
  },
  contextCarouselDot: (isActive) => ({
    width: isActive ? '16px' : '6px',
    height: '6px',
    borderRadius: RADIUS.full,
    background: isActive ? COLORS.atomicTangerine : COLORS.border,
    transition: TRANSITIONS.fast,
  }),

  // ==========================================================
  //  STOP CARD ENRIQUECIDA (Modo Ruta lectura)
  // ==========================================================
  enrichedStopCard: {
    background: COLORS.surface,
    padding: '16px',
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border}`,
    boxShadow: SHADOWS.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: TRANSITIONS.fast,
  },
  enrichedStopCardActive: {
    borderColor: COLORS.atomicTangerine,
    boxShadow: SHADOWS.glow,
  },
  stopCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
  },
  stopCardName: {
    fontSize: '1rem',
    fontWeight: '700',
    color: COLORS.charcoalBlue,
  },
  stopCardDate: {
    fontSize: '0.75rem',
    color: COLORS.textSecondary,
    whiteSpace: 'nowrap',
  },
  notaCorta: {
    fontSize: '0.88rem',
    color: COLORS.textTertiary,
    lineHeight: 1.4,
    fontStyle: 'italic',
  },

  // ==========================================================
  //  COMPANIONS GRID (para ContextCard)
  // ==========================================================
  companionsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  companionAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: RADIUS.full,
    background: COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: '700',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textPrimary,
  },
};

