import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS, SPACING, FONTS } from '../../theme';

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
  heroImage: (foto) => ({
    width: '100%',
    height: foto ? '60vh' : '40vh',
    minHeight: '320px',
    position: 'relative',
    backgroundImage: foto ? `url(${foto})` : 'none',
    backgroundColor: foto ? 'transparent' : COLORS.charcoalBlue,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: `0 0 ${RADIUS['2xl']} ${RADIUS['2xl']}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  }),
  heroGradient: {
    position: 'absolute',
    inset: 0,
    borderRadius: `0 0 ${RADIUS['2xl']} ${RADIUS['2xl']}`,
    background: `linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.08) 0%,
      rgba(0, 0, 0, 0.02) 30%,
      rgba(0, 0, 0, 0.25) 60%,
      rgba(0, 0, 0, 0.7) 85%,
      rgba(0, 0, 0, 0.85) 100%
    )`,
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
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    width: '42px',
    height: '42px', 
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
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    width: '42px',
    height: '42px',
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
  heroContent: {
    position: 'relative',
    zIndex: 10,
    padding: '0 32px 32px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
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
    fontSize: 'clamp(2rem, 5vw, 3.8rem)',
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
    border: '1px solid rgba(255,255,255,0.1)',
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
  //  EDIT MODE — dentro del hero, integrado con glass
  // ==========================================================
  editOverlay: {
    position: 'relative',
    zIndex: 10,
    padding: '0 32px 32px',
    maxWidth: '1100px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  titleInput: {
    fontFamily: FONTS.heading,
    fontSize: 'clamp(1.6rem, 4vw, 2.8rem)',
    fontWeight: '900',
    letterSpacing: '-0.02em',
    background: 'rgba(255,255,255,0.08)',
    border: 'none',
    borderBottom: '2px solid rgba(255,255,255,0.5)',
    color: 'white',
    width: '100%',
    outline: 'none',
    padding: '4px 0',
    transition: TRANSITIONS.fast,
  },
  editActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  imageReplaceBtn: (disabled = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: RADIUS.full,
    ...GLASS.dark,
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '9px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: TRANSITIONS.fast,
    boxShadow: SHADOWS.sm,
  }),

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
  
  bodyContent: {
    maxWidth: '1000px', margin: '0 auto', padding: '40px',
    display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '60px',
    '@media (max-width: 900px)': { gridTemplateColumns: '1fr', gap: '30px' }
  },
  mainColumn: { display: 'flex', flexDirection: 'column' },
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
  textArea: { 
    width: '100%', minHeight: '200px', padding: '20px', borderRadius: RADIUS.lg, 
    border: `2px solid ${COLORS.border}`, fontSize: '1rem', outline: 'none',
    boxShadow: SHADOWS.inner,
    ':focus': { borderColor: COLORS.atomicTangerine } 
  },
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
  
  timeline: { borderLeft: `2px solid ${COLORS.border}`, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' },
  timelineItem: { position: 'relative' },
  timelineDot: { position: 'absolute', left: '-25px', top: '6px', width: '8px', height: '8px', borderRadius: RADIUS.full, background: COLORS.atomicTangerine, border: '2px solid white' },
  stopCard: { background: COLORS.surface, padding: '12px', borderRadius: RADIUS.md, border: `1px solid ${COLORS.background}` },
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
  //  FIX: sideColumn estaba referenciado en JSX pero no definido
  // ==========================================================
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
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
    padding: '24px 20px 100px 20px', // bottom padding para el FAB
    display: 'flex',
    flexDirection: 'column',
  },
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
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
    width: '40px',
    height: '40px',
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
  destinoBody: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
  },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: SPACING.md,
    marginBottom: '32px',
  },

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
  transportBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.8rem',
    background: COLORS.background,
    padding: '2px 8px',
    borderRadius: RADIUS.full,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textSecondary,
  },
  notaCorta: {
    fontSize: '0.88rem',
    color: COLORS.textTertiary,
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  dateRange: {
    fontSize: '0.78rem',
    color: COLORS.textSecondary,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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

