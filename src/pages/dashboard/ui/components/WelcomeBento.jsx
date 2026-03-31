import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { welcomeStyles as styles } from './WelcomeBento.styles';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const WelcomeBento = ({ name, logStatsDashboard, isMobile, isNewTraveler, onNewTrip }) => {
  const { t } = useTranslation('dashboard');

  return (
    <div style={styles.pageHeader(isMobile)}>
      <div style={styles.decorLayer} aria-hidden="true">
        <span style={styles.decorOrbA} />
        <span style={styles.decorOrbB} />
      </div>
      <div style={styles.headerContent}>
        <div>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          {isNewTraveler ? (
            /* ── Aspirational Empty State: Premium editorial magazine feel ── */
            <Motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={styles.aspirationalBlock}
            >
              <p style={styles.aspirationalText}>
                {t('welcome.aspirationalMessage')}
              </p>
              <Motion.button
                type="button"
                onClick={onNewTrip}
                style={styles.aspirationalCta}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <Compass size={16} />
                {t('welcome.aspirationalCtaLabel')}
              </Motion.button>
            </Motion.div>
          ) : (
            /* ── Returning Traveler: Clean subtitle, no gamification clutter ── */
            <>
              <p style={styles.subtitle}>{t('welcomeSubtitle')}</p>
            </>
          )}
        </div>
      </div>

      {/* Stats only render for returning travelers */}
      {!isNewTraveler && (
        <div style={styles.statsSection}>
          <TravelStatsWidget
            logStats={logStatsDashboard}
            ariaLabel={t('stats.tripSummary')}
            variant="home"
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
};

export default WelcomeBento;