import { COLORS, SHADOWS, RADIUS, TRANSITIONS, GLASS, Z_INDEX } from '@shared/config';

export const mediaStyles = `
  /* Mobile Tab Bar */
  .mobile-tab-bar {
    display: none;
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    width: min(92vw, 400px);
    height: 64px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border: 1px solid rgba(255, 255, 255, 0.55);
    border-radius: 9999px; /* Pill shape */
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    z-index: ${Z_INDEX.sticky};
    padding: 0 12px;
    align-items: center;
    justify-content: space-evenly;
  }

  .mobile-tab-label {
    font-size: 10px;
    line-height: 1;
    margin-top: 2px;
    letter-spacing: 0.1px;
    white-space: nowrap;
    transition: color 0.2s, font-weight 0.15s;
  }

  .mobile-tab-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    width: 52px;
    height: 52px;
    flex: 0 0 52px;
    color: ${COLORS.textSecondary};
    cursor: pointer;
    transition: color 0.2s;
    gap: 1px;
    padding: 0;
  }

  .mobile-tab-btn.active {
    color: ${COLORS.atomicTangerine};
  }

  /* Desktop Fluid Rail */
  .desktop-fluid-rail {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 80px; /* Slim rail */
    background: transparent;
    flex-direction: column;
    align-items: center;
    padding: 24px 0;
    z-index: ${Z_INDEX.sticky};
    border-right: 1px solid rgba(0,0,0,0.05); /* Very subtle if any */
  }

  .rail-logo {
    margin-bottom: 32px;
  }

  .rail-nav {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    width: 100%;
    align-items: center;
  }

  .rail-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: ${RADIUS.xl};
    border: none;
    background: transparent;
    color: ${COLORS.textSecondary};
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    position: relative;
  }

  .rail-btn:hover {
    background: rgba(0,0,0,0.04);
    color: ${COLORS.charcoalBlue};
  }

  .rail-btn.active {
    background: ${COLORS.charcoalBlue};
    color: #fff;
    box-shadow: ${SHADOWS.md};
  }

  .rail-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 24px;
    width: 100%;
  }

  @media (max-width: 768px) {
    .desktop-fluid-rail {
      display: none !important;
    }
    .mobile-tab-bar {
      display: flex !important;
    }
  }
`;
