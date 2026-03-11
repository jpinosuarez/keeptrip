import { COLORS, FONTS, SHADOWS, RADIUS, TRANSITIONS } from '@shared/config';

export const styles = {
  container: {
    minHeight: '100vh',
    height: '100vh',
    overflowY: 'auto',
    background: COLORS.background,
    position: 'relative',
    fontFamily: FONTS.heading,
  },

  nav: {
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },

  logo: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-1px',
  },

  // Ghost button con color de marca — visible e invitador desde el primer elemento
  loginBtn: {
    padding: '10px 24px',
    borderRadius: RADIUS['2xl'],
    border: `1.5px solid ${COLORS.atomicTangerine}`,
    background: 'transparent',
    color: COLORS.atomicTangerine,
    fontWeight: '700',
    cursor: 'pointer',
    transition: TRANSITIONS.fast,
    minHeight: '44px',
    minWidth: '44px',
    fontFamily: FONTS.heading,
  },

  // Hero asimétrico: texto izquierda, visual derecha (desktop)
  hero: (isMobile) => ({
    maxWidth: '1160px',
    margin: '0 auto',
    padding: isMobile ? '48px 24px 40px' : '80px 40px 64px',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '0' : '64px',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  }),

  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
  },

  kicker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: COLORS.mutedTeal,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    backgroundColor: `${COLORS.mutedTeal}18`,
    padding: '6px 12px',
    borderRadius: RADIUS.full,
    border: `1px solid ${COLORS.mutedTeal}30`,
  },

  title: (isMobile) => ({
    fontSize: isMobile ? '2.875rem' : '4.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.05,
    margin: 0,
    letterSpacing: isMobile ? '-0.5px' : '-2px',
  }),

  // Color sólido de marca — sin gradiente
  highlight: {
    color: COLORS.atomicTangerine,
  },

  subtitle: {
    fontSize: '1.05rem',
    color: COLORS.textSecondary,
    maxWidth: '480px',
    lineHeight: 1.65,
    margin: 0,
    fontFamily: FONTS.body,
  },

  // CTA en atomicTangerine — corrección del lenguaje de color de marca
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    fontSize: '1rem',
    fontWeight: '800',
    background: COLORS.atomicTangerine,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    cursor: 'pointer',
    boxShadow: `0 8px 24px ${COLORS.atomicTangerine}40`,
    transition: TRANSITIONS.normal,
    minHeight: '44px',
    minWidth: '240px',
    fontFamily: FONTS.heading,
  },

  // ── Hero visual (columna derecha, solo desktop) ─────────────────────────
  heroVisual: {
    position: 'relative',
    width: '100%',
    height: '320px',
  },

  // Fondo atmosférico: orb + globe en un solo layer (antes 2 divs)
  heroBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${COLORS.atomicTangerine}15 0%, transparent 70%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.18,
  },

  heroCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -52%)',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    textAlign: 'center',
  },

  heroCardNumber: {
    fontSize: '5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1,
    letterSpacing: '-3px',
  },

  heroCardLabel: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
  },

  // Pregunta inline — sin badge flotante extra
  heroCardQuestion: {
    marginTop: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: COLORS.atomicTangerine,
    fontStyle: 'italic',
  },

  // ── Features: lista editorial numerada (en lugar de 3 cards idénticas) ──
  featuresSection: (isMobile) => ({
    maxWidth: '1160px',
    margin: '0 auto',
    padding: isMobile ? '0 24px 56px' : '0 40px 80px',
    display: 'flex',
    flexDirection: 'column',
    borderTop: `1px solid ${COLORS.border}`,
    position: 'relative',
    zIndex: 10,
  }),

  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '24px',
    padding: '24px 0',
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'default',
  },

  // 01/Mapa: protagonista. Escala 4rem vs 2.25rem — diferencia 1.8x — comunica que alguien tomó una decisión
  featureItemFeatured: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '24px',
    padding: '32px 0',
    borderBottom: `1px solid ${COLORS.border}`,
    cursor: 'default',
  },

  featureNum: (color) => ({
    fontSize: '2.25rem',
    fontWeight: '900',
    color: color,
    lineHeight: 1,
    letterSpacing: '-1.5px',
    flexShrink: 0,
    opacity: 0.25,
    minWidth: '56px',
  }),

  // Número del protagonista: 4rem + opacidad plena para presencia real
  featureNumFeatured: (color) => ({
    fontSize: '4rem',
    fontWeight: '900',
    color: color,
    lineHeight: 1,
    letterSpacing: '-2.5px',
    flexShrink: 0,
    opacity: 0.6,
    minWidth: '72px',
  }),

  featureBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    paddingTop: '2px',
  },

  featureTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '1rem',
    fontWeight: '800',
    color: COLORS.charcoalBlue,
  },

  // Título del protagonista: tamaño 1.4rem + color de marca — no charcoal genérico
  featureTitleFeatured: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.4rem',
    fontWeight: '900',
    color: color,
    letterSpacing: '-0.3px',
  }),

  featureDesc: {
    margin: 0,
    fontSize: '0.9rem',
    color: COLORS.textSecondary,
    lineHeight: 1.6,
    fontFamily: FONTS.body,
    maxWidth: '480px',
  },

  // Descripción del protagonista: ligeramente más grande y con fontWeight 500
  featureDescFeatured: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 1.65,
    fontFamily: FONTS.body,
    maxWidth: '480px',
  },

  backgroundMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg")',
    backgroundSize: 'cover',
    opacity: 0.03,
    zIndex: 1,
  },
};