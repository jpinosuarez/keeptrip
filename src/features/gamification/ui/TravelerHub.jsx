import React from 'react';
import { motion as Motion } from 'framer-motion';
import { getTravelerLevel, getNextLevel } from '../model/travelerLevel';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import AchievementsGrid from './AchievementsGrid';
import { styles } from './TravelerHub.styles';
import { COLORS } from '@shared/config';
import { useTranslation } from 'react-i18next';

/**
 * TravelerHub — the gamification hub with a Bento-style layout.
 * Shows traveler level hero card, achievement badges, and next goals.
 */
const TravelerHub = ({ paisesVisitados, bitacora, achievementsWithProgress, stats }) => {
  const { isMobile } = useWindowSize(768);
  const { t } = useTranslation('hub');

  const countryCount = paisesVisitados.length;
  const level = getTravelerLevel(countryCount);
  const next = getNextLevel(countryCount);

  return (
    <div style={styles.container(isMobile)}>
      <div style={styles.scrollArea} className="custom-scroll">
        {/* ── Hero Card ── */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={styles.heroCard(level.color)}
        >
          <div style={styles.heroRing(level.color)} />
          <div style={styles.heroRing2(level.color)} />

          <div style={styles.heroLeft}>
            <div style={styles.heroIcon}>{level.icon}</div>
            <h2 style={styles.heroLabel}>{level.label}</h2>
            <p style={styles.heroSublabel}>
              {next.level
                ? `${next.remaining} ${next.remaining !== 1 ? t('goals.units.countries_other') : t('goals.units.countries_one')} para ${next.level.label}`
                : t('progress.maxLevel')}
            </p>
            {next.level && (
              <div style={styles.heroProgressOuter}>
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(next.progress * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={styles.heroProgressInner(level.color)}
                />
              </div>
            )}
          </div>

          <div style={styles.heroRight}>
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{countryCount}</span>
              <span style={styles.heroStatLabel}>{t('stats.countries')}</span>
            </div>
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{bitacora.length}</span>
              <span style={styles.heroStatLabel}>{t('stats.trips')}</span>
            </div>
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{stats.continents}</span>
              <span style={styles.heroStatLabel}>{t('stats.continents')}</span>
            </div>
          </div>
        </Motion.div>

        {/* ── Achievements (goals + unlocked + locked) ── */}
        <AchievementsGrid achievementsWithProgress={achievementsWithProgress} isMobile={isMobile} />
      </div>
    </div>
  );
};

export default TravelerHub;
