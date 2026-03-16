import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
  isNewTraveler, 
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
      <div style={styles.headerRow}>
        <div style={styles.identityGroup}>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          <p style={styles.subtitle}>
            {visitedCount > 0
              ? t('subtitleStats', { countries: visitedCount, percent: worldPercent, trips: tripsCount })
              : t('welcome.emptyStateSubtitle', 'Comienza a explorar el mundo')}
          </p>
          
          <div style={styles.badgeRow}>
            <button type="button" onClick={handleLevelClick} style={styles.badgeLevelButton}>
              <span style={styles.badgeLevel}>
                {level.icon} {level.label}
              </span>
              <ArrowRight size={16} />
            </button>
            {nextLevel.level && (
              <span style={styles.badgeProgress}>
                · {nextLevel.remaining} {nextLevel.remaining !== 1 ? t('stats.countriesPlural') : t('stats.countrySingular')} para {nextLevel.level.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isNewTraveler && (
        <div style={styles.statsWrapper}>
          <TravelStatsWidget
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
      )}
    </Motion.div>
  );
};

export default WelcomeBento;
