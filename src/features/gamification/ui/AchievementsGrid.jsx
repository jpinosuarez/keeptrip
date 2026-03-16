import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Trophy, Compass, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AchievementCard from './AchievementCard';
import { styles } from './TravelerHub.styles';

/**
 * AchievementsGrid — renders next goals, unlocked badges, and locked badges.
 * Extracted from TravelerHub to be a standalone, composable component.
 *
 * @param {{ achievementsWithProgress: object[], isMobile: boolean }} props
 */
const AchievementsGrid = ({ achievementsWithProgress = [], isMobile = false }) => {
  const { t } = useTranslation('hub');

  const { unlocked, locked, nextGoals } = useMemo(() => {
    const un = achievementsWithProgress.filter((a) => a.unlocked);
    const lo = achievementsWithProgress.filter((a) => !a.unlocked);
    const goals = [...lo].sort((a, b) => b.progress - a.progress).slice(0, 3);
    return { unlocked: un, locked: lo, nextGoals: goals };
  }, [achievementsWithProgress]);

  const unlockedCount = unlocked.length;
  const totalCount = achievementsWithProgress.length;

  return (
    <div>
      {/* ── Next Goals ── */}
      {nextGoals.length > 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <Target size={16} /> {t('achievements.nextGoals')}
            </h3>
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
              const goalName = t(`achievements.${goal.id}`, goal.id);
              return (
                <div key={goal.id} style={isLast ? styles.goalRowLast : styles.goalRow}>
                  <span style={styles.goalIcon}>{goal.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...styles.goalText, fontWeight: 800, margin: 0 }}>{goalName}</p>
                    <p style={{ ...styles.goalText, margin: 0, fontSize: '0.8rem', color: 'rgba(44, 62, 80, 0.8)' }}>
                      {remaining} {unitMap[goal.criteria.type] || t('goals.units.countries_other')} {t('para-desbloquear')}
                    </p>
                  </div>
                  <span style={styles.goalProgress}>{Math.round(goal.progress * 100)}%</span>
                </div>
              );
            })}
          </div>
        </Motion.div>
      )}

      {/* ── Unlocked badges ── */}
      {unlockedCount > 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <Trophy size={16} /> {t('achievements.unlockedTitle')}
            </h3>
            <span style={styles.sectionMeta}>
              {unlockedCount}/{totalCount}
            </span>
          </div>
          <div style={styles.achievementsGrid(isMobile)}>
            {unlocked.map((a) => (
              <AchievementCard key={a.id} achievement={a} isMobile={isMobile} />
            ))}
          </div>
        </Motion.div>
      )}

      {/* ── Locked badges ── */}
      {locked.length > 0 && (
        <Motion.div
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
        </Motion.div>
      )}
    </div>
  );
};

export default AchievementsGrid;
