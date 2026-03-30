import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ENABLE_IMMERSIVE_VIEWER } from '@shared/config';
import { welcomeStyles as styles } from './WelcomeBento.styles';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';
const WelcomeBento = ({ name, level, nextLevel, logStatsDashboard, isMobile }) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const handleLevelClick = () => { navigate('/explorer'); };
  return (
    <div style={styles.pageHeader(isMobile)}>
      <div style={styles.decorLayer} aria-hidden="true">
        <span style={styles.decorOrbA} />
        <span style={styles.decorOrbB} />
      </div>
      <div style={styles.headerContent}>
        <div>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          <p style={styles.subtitle}>{t('welcomeSubtitle')}</p>
          <div style={styles.badgeRow}>
            {ENABLE_IMMERSIVE_VIEWER ? (
              <button type="button" onClick={handleLevelClick} style={styles.badgeLevelButton}>
                <span style={styles.badgeLevel}>{level.icon} {level.label}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <span style={styles.badgeLevel}>{level.icon} {level.label}</span>
            )}
            {nextLevel.level && (
              <span style={styles.badgeProgress}>
                {t('nextLevelProgress', {
                  remaining: nextLevel.remaining,
                  countryWord: nextLevel.remaining !== 1 ? t('stats.countriesPlural') : t('stats.countrySingular'),
                  level: nextLevel.level.label,
                })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={styles.statsSection}>
        <TravelStatsWidget
          logStats={logStatsDashboard}
          ariaLabel={t('stats.tripSummary')}
          variant="home"
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};
export default WelcomeBento;