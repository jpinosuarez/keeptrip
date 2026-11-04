import React from 'react';
import { motion as Motion } from 'framer-motion';

import NavBar from './components/NavBar/NavBar';
import HeroSection from './components/Hero/HeroSection';

const BentoFeatures = React.lazy(() => import('./components/BentoFeatures/BentoFeatures'));
const Footer = React.lazy(() => import('./components/Footer'));

/**
 * DEV-only persona dock (1-click mock data, no login required).
 * `import.meta.env.DEV` is statically replaced with `false` in production, so
 * the dynamic import is dead-code-eliminated (zero bytes shipped to prod).
 */
const DevLaunchDock = import.meta.env.DEV
  ? React.lazy(() => import('@shared/dev/ui/DevLaunchDock'))
  : null;

const LandingPage = () => {
  // Synchronous splash dismissal on mount to unblock immediate LCP paint
  React.useLayoutEffect(() => {
    const splash = document.getElementById('keeptrip-splash');
    if (splash) {
      splash.setAttribute('aria-hidden', 'true');
      splash.style.display = 'none';
      splash.style.pointerEvents = 'none';
    }
  }, []);

  return (
    <div
      className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-background relative font-heading"
    >
      {/* Visual, deliberate Background Map */}
      <div className="absolute inset-0 bg-[url('/world-map-blank.opt.svg')] bg-cover bg-[center_15%] opacity-15 z-[1] pointer-events-none [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_95%)]" />

      <NavBar />
      <HeroSection />
      <React.Suspense fallback={<div className="min-h-[800px]" />}>
        <BentoFeatures />
        <Footer />
      </React.Suspense>

      {DevLaunchDock && (
        <React.Suspense fallback={null}>
          <DevLaunchDock />
        </React.Suspense>
      )}
    </div>
  );
};

export default LandingPage;