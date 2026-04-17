import React from 'react';
import { motion as Motion } from 'framer-motion';

import { styles } from './LandingPage.styles';
import NavBar from './components/NavBar/NavBar';
import HeroSection from './components/Hero/HeroSection';
import BentoFeatures from './components/BentoFeatures/BentoFeatures';
import Footer from './components/Footer';

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
      className="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" // Safe area insets
      style={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Visual, deliberate Background Map */}
      <div style={styles.backgroundMap} />

      <NavBar />
      <HeroSection />
      <BentoFeatures />
      <Footer />
    </Motion.div>
  );
};

export default LandingPage;