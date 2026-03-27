import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ENABLE_IMMERSIVE_VIEWER } from '@shared/config';
import { welcomeStyles as styles } from './WelcomeBento.styles';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const WelcomeBento = ({ 
  name, 
  visitedCount, 
  worldPercent, 
  tripsCount, 
  level, 
  nextLevel, 
  logStatsDashboard, 
  isMobile
}) => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const handleLevelClick = () => {
    navigate('/explorer');
  };

  return (
    <Motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={styles.card(isMobile)}
    >
      <div style={styles.decorLayer} aria-hidden="true">
        <span style={styles.decorOrbA} />
        <span style={styles.decorOrbB} />
      </div>

      <div style={styles.headerRow}>
        <div style={styles.identityGroup}>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          <p style={styles.subtitle}>
            {visitedCount > 0
              ? t('subtitleStats', { countries: visitedCount, percent: worldPercent, trips: tripsCount })
              : t('welcome.emptyStateSubtitle')}
          </p>
          
          <div style={styles.badgeRow}>
            {ENABLE_IMMERSIVE_VIEWER ? (
              <button type="button" onClick={handleLevelClick} style={styles.badgeLevelButton}>
                <span style={styles.badgeLevel}>
                  {level.icon} {level.label}
                </span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <span style={styles.badgeLevel}>
                {level.icon} {level.label}
              </span>
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

      <div style={styles.statsWrapper}>
        <TravelStatsWidget
          heroMetric={{
            value: visitedCount,
            label: t('stats.countriesVisited')
          }}
          stats={[
            { value: logStatsDashboard.tripCount, label: t('stats.tripsCompleted') },
            { value: logStatsDashboard.totalDays, label: t('stats.totalDays') },
            { value: logStatsDashboard.totalCities, label: t('stats.registeredCities') },
            { value: logStatsDashboard.continents, label: t('stats.continents') },
            { value: logStatsDashboard.longestTrip, label: t('stats.longestTrip') },
            { value: logStatsDashboard.totalPhotos, label: t('stats.photos') },
          ]}
          ariaLabel={t('stats.tripSummary')}
        />
      </div>
    </Motion.div>
  );
};

export default WelcomeBento;
