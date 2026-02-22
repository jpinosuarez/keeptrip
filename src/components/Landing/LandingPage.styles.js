import { COLORS, FONTS, SHADOWS, RADIUS, TRANSITIONS } from '../../theme';

export const styles = {
  container: {
    minHeight: '100vh',
    height: '100vh',
    overflowY: 'auto',
    background: COLORS.background,
    position: 'relative',
    fontFamily: FONTS.heading
  },
  nav: {
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    letterSpacing: '-1px'
  },
  loginBtn: {
    padding: '10px 24px',
    borderRadius: RADIUS['2xl'],
    border: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    color: COLORS.charcoalBlue,
    fontWeight: '700',
    cursor: 'pointer',
    transition: TRANSITIONS.fast
  },
  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 10,
    position: 'relative'
  },
  title: {
    fontSize: '4rem',
    fontWeight: '900',
    color: COLORS.charcoalBlue,
    lineHeight: 1.1,
    marginBottom: '24px'
  },
  gradientText: {
    background: `linear-gradient(90deg, ${COLORS.atomicTangerine}, ${COLORS.mutedTeal})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '1.25rem',
    color: COLORS.textSecondary,
    maxWidth: '600px',
    marginBottom: '40px',
    lineHeight: 1.6
  },
  ctaBtn: {
    padding: '16px 40px',
    fontSize: '1.1rem',
    fontWeight: '800',
    background: COLORS.charcoalBlue,
    color: 'white',
    border: 'none',
    borderRadius: RADIUS.full,
    cursor: 'pointer',
    boxShadow: SHADOWS.float,
    transition: TRANSITIONS.normal
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    marginTop: '80px',
    width: '100%'
  },
  featureCard: {
    background: COLORS.surface,
    padding: '30px',
    borderRadius: RADIUS.xl,
    boxShadow: SHADOWS.md,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  backgroundMap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg")',
    backgroundSize: 'cover',
    opacity: 0.03,
    zIndex: 0,
    pointerEvents: 'none'
  }
};