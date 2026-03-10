import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { styles } from './LandingPage.styles';
import { Map, BookOpen, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation(['landing', 'common']);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3
      }
    }
  };

  return (
    <motion.div
      style={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.nav
        style={styles.nav}
        variants={itemVariants}
      >
        <div style={styles.logo}>Keeptrip</div>
        <motion.button
          onClick={login}
          className="tap-btn"
          style={styles.loginBtn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {t('common:login')}
        </motion.button>
      </motion.nav>

      <motion.main
        style={styles.hero}
        variants={itemVariants}
      >
        <motion.div
          style={styles.content}
          variants={itemVariants}
        >
          <motion.h1
            style={styles.title}
            variants={itemVariants}
          >
            {t('landing:titleTop')} <br />
            <motion.span
              style={styles.gradientText}
              variants={itemVariants}
            >
              {t('landing:titleHighlight')}
            </motion.span>
          </motion.h1>
          <motion.p
            style={styles.subtitle}
            variants={itemVariants}
          >
            {t('landing:subtitle')}
          </motion.p>
          <motion.button
            onClick={login}
            className="tap-btn"
            style={styles.ctaBtn}
            variants={itemVariants}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
          >
            {t('landing:ctaButton')}
          </motion.button>
        </motion.div>

        <motion.div
          style={styles.featuresGrid}
          variants={featureVariants}
        >
          <motion.div
            style={styles.featureCard}
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
          >
            <Map size={32} color="#FF6B35" />
            <h3>{t('landing:feature.map')}</h3>
            <p>{t('landing:feature.mapDesc')}</p>
          </motion.div>
          <motion.div
            style={styles.featureCard}
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
          >
            <BookOpen size={32} color="#45B0A8" />
            <h3>{t('landing:feature.journal')}</h3>
            <p>{t('landing:feature.journalDesc')}</p>
          </motion.div>
          <motion.div
            style={styles.featureCard}
            variants={itemVariants}
            whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
          >
            <Shield size={32} color="#2C3E50" />
            <h3>{t('landing:feature.security')}</h3>
            <p>{t('landing:feature.securityDesc')}</p>
          </motion.div>
        </motion.div>
      </motion.main>

      <div style={styles.backgroundMap} />
    </motion.div>
  );
};

export default LandingPage;