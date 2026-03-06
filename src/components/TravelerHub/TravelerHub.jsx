import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Compass, Flag, Globe } from 'lucide-react';
import { getTravelerLevel, getNextLevel } from '../../utils/travelerLevel';
import { useWindowSize } from '../../hooks/useWindowSize';
import AchievementCard from './AchievementCard';
import { styles } from './TravelerHub.styles';
import { COLORS } from '../../theme';
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

  // Separate unlocked vs locked, unlocked first
  const { unlocked, locked, nextGoals } = useMemo(() => {
    const un = achievementsWithProgress.filter((a) => a.unlocked);
    const lo = achievementsWithProgress.filter((a) => !a.unlocked);
    // Next goals: top 3 closest-to-unlocking locked achievements
    const goals = [...lo].sort((a, b) => b.progress - a.progress).slice(0, 3);
    return { unlocked: un, locked: lo, nextGoals: goals };
  }, [achievementsWithProgress]);

  const unlockedCount = unlocked.length;
  const totalCount = achievementsWithProgress.length;

  return (
    <div style={styles.container(isMobile)}>
      <div style={styles.scrollArea} className="custom-scroll">
        {/* ── Hero Card ── */}
        <motion.div
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
                : t('biometric.maxLevel')}
            </p>
            {next.level && (
              <div style={styles.heroProgressOuter}>
                <motion.div
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
        </motion.div>

        {/* ── Next Goals ── */}
        {nextGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><Target size={16} /> {t('achievements.nextGoals')}</h3>
            </div>
            <div style={styles.goalsCard}>
              {nextGoals.map((goal, i) => {
                const isLast = i === nextGoals.length - 1;
                const remaining = goal.criteria.threshold - goal.current;
                const unitMap = {
                  countries: remaining === 1 ? t('goals.units.countries_one') : t('goals.units.countries_other'),
                  trips: remaining === 1 ? t('goals.units.trips_one') : t('goals.units.trips_other'),
                  continents: remaining === 1 ? t('goals.units.continents_one') : t('goals.units.continents_other'),
                  detailed_trips: remaining === 1 ? t('goals.units.detailed_trips_one') : t('goals.units.detailed_trips_other'),
                };
                return (
                  <div key={goal.id} style={isLast ? styles.goalRowLast : styles.goalRow}>
                    <span style={styles.goalIcon}>{goal.icon}</span>
                    <p style={styles.goalText}>
                      {remaining} {unitMap[goal.criteria.type] || 'más'} para desbloquear
                    </p>
                    <span style={styles.goalProgress}>
                      {Math.round(goal.progress * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Unlocked Achievements ── */}
        {unlockedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}><Trophy size={16} /> {t('achievements.unlockedTitle')}</h3>
              <span style={styles.sectionMeta}>{unlockedCount}/{totalCount}</span>
            </div>
            <div style={styles.achievementsGrid(isMobile)}>
              {unlocked.map((a) => (
                <AchievementCard key={a.id} achievement={a} isMobile={isMobile} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Locked Achievements ── */}
        {locked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>
                <Compass size={16} /> {t('achievements.lockedTitle')}
              </h3>
            </div>
            <div style={styles.achievementsGrid(isMobile)}>
              {locked.map((a) => (
                <AchievementCard key={a.id} achievement={a} isMobile={isMobile} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TravelerHub;
