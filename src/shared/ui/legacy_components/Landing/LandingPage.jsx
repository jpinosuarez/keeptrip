import React from 'react';
import { useAuth } from '@app/providers/AuthContext';
import { styles } from './LandingPage.styles';
import { Compass, Map, BookOpen, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation(['landing', 'common']);

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.logo}>Keeptrip</div>
        <button onClick={login} className="tap-btn" style={styles.loginBtn}>{t('common:login')}</button>
      </nav>

      <main style={styles.hero}>
        <div style={styles.content}>
          <h1 style={styles.title}>
            {t('landing:titleTop')} <br />
            <span style={styles.gradientText}>{t('landing:titleHighlight')}</span>
          </h1>
          <p style={styles.subtitle}>
            {t('landing:subtitle')}
          </p>
          <button onClick={login} className="tap-btn" style={styles.ctaBtn}>
            {t('landing:ctaButton')}
          </button>
        </div>

        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <Map size={32} color="#FF6B35" />
            <h3>{t('landing:feature.map')}</h3>
            <p>{t('landing:feature.mapDesc')}</p>
          </div>
          <div style={styles.featureCard}>
            <BookOpen size={32} color="#45B0A8" />
            <h3>{t('landing:feature.journal')}</h3>
            <p>{t('landing:feature.journalDesc')}</p>
          </div>
          <div style={styles.featureCard}>
            <Shield size={32} color="#2C3E50" />
            <h3>{t('landing:feature.security')}</h3>
            <p>{t('landing:feature.securityDesc')}</p>
          </div>
        </div>
      </main>
      
      <div style={styles.backgroundMap} />
    </div>
  );
};

export default LandingPage;