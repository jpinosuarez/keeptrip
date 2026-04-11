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
  return (
    <Motion.div
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