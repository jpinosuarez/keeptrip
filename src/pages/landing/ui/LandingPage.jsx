import React from 'react';
import { motion as Motion } from 'framer-motion';

import NavBar from './components/NavBar/NavBar';
import HeroSection from './components/Hero/HeroSection';

const BentoFeatures = React.lazy(() => import('./components/BentoFeatures/BentoFeatures'));
const Footer = React.lazy(() => import('./components/Footer'));

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const LandingPage = () => {
  // "Never Remove, z-index Push-Behind" (unauthenticated path)
  // Mirrors AppShell.jsx — see that file for full architecture rationale.
  // z-index:-1 keeps opacity:1 so LCP tracking is preserved.
  React.useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const splash = document.getElementById('keeptrip-splash');
        if (!splash) return;

        splash.setAttribute('aria-hidden', 'true');
        splash.style.zIndex = '-1';
        splash.style.pointerEvents = 'none';
      });
    });
  }, []);

  return (
    <Motion.div
      className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] min-h-[100dvh] h-[100dvh] overflow-y-auto overflow-x-hidden bg-background relative font-heading"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Visual, deliberate Background Map */}
      <div className="absolute inset-0 bg-[url('/world-map-blank.opt.svg')] bg-cover bg-[center_15%] opacity-15 z-[1] pointer-events-none [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_95%)]" />

      <NavBar />
      <HeroSection />
      <React.Suspense fallback={<div className="min-h-[800px]" />}>
        <BentoFeatures />
        <Footer />
      </React.Suspense>
    </Motion.div>
  );
};

export default LandingPage;