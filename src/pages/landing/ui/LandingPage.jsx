import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { styles } from './LandingPage.styles';
import { Map, BookOpen, Shield, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@shared/config';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

const FEATURES = [
  { num: '01', icon: Map,      key: 'map',      color: COLORS.atomicTangerine, isFeatured: true },
  { num: '02', icon: BookOpen, key: 'journal',   color: COLORS.mutedTeal },
  { num: '03', icon: Shield,   key: 'security',  color: COLORS.charcoalBlue },
];

// Estáticos: fuera del componente para no recalcular en cada render
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const LandingPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation(['landing', 'common']);
  const { isMobile } = useWindowSize();

  return (
    <motion.div
      style={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Nav */}
      <motion.nav style={styles.nav} variants={itemVariants}>
        <div style={styles.logo}>Keeptrip</div>
        <motion.button
          onClick={login}
          className="tap-btn"
          style={styles.loginBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {t('common:login')}
        </motion.button>
      </motion.nav>

      {/* Hero: texto izquierda + visual derecha */}
      <motion.main style={styles.hero(isMobile)} variants={itemVariants}>
        {/* Columna izquierda: copy */}
        <motion.div style={styles.content} variants={itemVariants}>
          <motion.div style={styles.kicker} variants={itemVariants}>
            <Globe size={12} color={COLORS.mutedTeal} strokeWidth={2.5} />
            {t('landing:kicker', 'Para viajeros de alma')}
          </motion.div>

          <motion.h1 style={styles.title(isMobile)} variants={itemVariants}>
            {t('landing:titleTop')}
            <br />
            <span style={styles.highlight}>{t('landing:titleHighlight')}</span>
          </motion.h1>

          <motion.p style={styles.subtitle} variants={itemVariants}>
            {t('landing:subtitle')}
          </motion.p>

          <motion.button
            onClick={login}
            className="tap-btn"
            style={styles.ctaBtn}
            variants={itemVariants}
            whileHover={{ opacity: 0.88, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {t('landing:ctaButton')}
            <ArrowRight size={16} />
          </motion.button>
        </motion.div>

        {/* Columna derecha: stat decorativo (solo desktop) */}
        {!isMobile && (
          <motion.div style={styles.heroVisual} variants={itemVariants} aria-hidden="true">
            {/* Un solo layer atmosférico: orb + globe fusionados */}
            <div style={styles.heroBackground}>
              <Globe size={200} color={COLORS.atomicTangerine} strokeWidth={0.6} />
            </div>
            <div style={styles.heroCard}>
              <span style={styles.heroCardNumber}>195</span>
              <span style={styles.heroCardLabel}>{t('landing:heroCountriesLabel', 'países para explorar')}</span>
              <span style={styles.heroCardQuestion}>{t('landing:heroQuestion', '¿Cuántos llevas tú?')}</span>
            </div>
          </motion.div>
        )}
      </motion.main>

      {/* Features: lista editorial numerada — 01 Mapa es el protagonista */}
      <motion.section style={styles.featuresSection(isMobile)} variants={itemVariants}>
        {FEATURES.map(({ num, icon: Icon, key, color, isFeatured }) => (
          <motion.div
            key={key}
            style={isFeatured ? styles.featureItemFeatured : styles.featureItem}
            variants={itemVariants}
            whileHover={{ x: 6, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          >
            <span style={isFeatured ? styles.featureNumFeatured(color) : styles.featureNum(color)}>{num}</span>
            <div style={styles.featureBody}>
              <div style={isFeatured ? styles.featureTitleFeatured(color) : styles.featureTitle}>
                <Icon size={isFeatured ? 20 : 14} color={color} strokeWidth={2} />
                {t(`landing:feature.${key}`)}
              </div>
              <p style={isFeatured ? styles.featureDescFeatured : styles.featureDesc}>
                {t(`landing:feature.${key}Desc`)}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.section>

      <div style={styles.backgroundMap} />
    </motion.div>
  );
};

export default LandingPage;