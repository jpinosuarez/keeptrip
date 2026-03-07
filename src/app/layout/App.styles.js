const appViewportHeight =
  typeof window !== 'undefined' && window.CSS?.supports?.('height', '100dvh')
    ? '100dvh'
    : '100vh';

export const styles = {
  appWrapper: {
    display: 'flex',
    backgroundColor: '#F8FAFC',
    height: appViewportHeight,
    width: '100%',
    overflow: 'hidden'
  },

  mainContent: (isMobile) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
    transition: 'margin-left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), padding 0.25s ease',
    position: 'relative',
    overflow: 'hidden',
    marginLeft: isMobile ? '0' : undefined
  }),

  sectionWrapper: (isMobile) => ({
    flex: 1,
    padding: isMobile ? '10px' : '20px',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    transition: 'padding 0.25s ease'
  }),

  scrollableContent: {
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingRight: '6px',
    paddingBottom: '40px'
  },

  containerMapaStyle: (isMobile) => ({
    width: '100%',
    height: '100%',
    borderRadius: isMobile ? '16px' : '24px',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'border-radius 0.25s ease'
  }),

  mapStatsOverlay: (isMobile) => ({
    position: 'absolute',
    top: isMobile ? '10px' : '20px',
    left: isMobile ? '10px' : '20px',
    zIndex: 10,
    width: isMobile ? 'min(220px, calc(100% - 20px))' : '260px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none'
  })
};
