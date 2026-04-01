import { COLORS, FONTS } from '@shared/config';

export const styles = {
  container: {
    minHeight: '100vh',
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden', // Previene scroll horizontal indeseado con animaciones
    background: COLORS.background || '#FAFBFC',
    position: 'relative',
    fontFamily: FONTS.heading,
  },

  // Highlighted explicit background map
  backgroundMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center 15%',
    opacity: 0.15, // Increased opacity to make it a purposeful design element (Iteration 2)
    zIndex: 1,
    pointerEvents: 'none',
    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)',
  }
};