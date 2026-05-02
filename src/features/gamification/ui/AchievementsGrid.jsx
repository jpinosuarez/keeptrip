import React, { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Trophy, Compass, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AchievementCard from './AchievementCard';
import { cn } from '@shared/lib/utils/cn';

/**
 * AchievementsGrid — renders next goals, unlocked badges, and locked badges.
 * Extracted from TravelerHub to be a standalone, composable component.
 *
 * @param {{ achievementsWithProgress: object[], isMobile: boolean }} props
 */
const AchievementsGrid = ({ achievementsWithProgress = [] }) => {
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
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-black text-charcoalBlue font-heading flex items-center gap-2 m-0">
              <Target size={16} /> {t('achievements.nextGoals')}
            </h3>
          </div>
          <div className="flex flex-col gap-3 p-5 md:p-6 rounded-3xl bg-slate-50/50 border border-slate-200/50 shadow-sm mb-6">
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
                <div key={goal.id} 
                  className={cn(
                    "flex items-center gap-3 p-2.5 md:p-3 rounded-2xl bg-slate-900/5",
                    !isLast && "border-b border-black/5"
                  )}
                >
                  <span className="text-[1.4rem] grayscale-[0.6]">{goal.icon}</span>
                  <div className="flex-1">
                    <p className="font-black text-charcoalBlue m-0 text-[0.85rem]">{goalName}</p>
                    <p className="m-0 text-[0.8rem] text-charcoalBlue/80 font-medium">
                      {remaining} {unitMap[goal.criteria.type] || t('goals.units.countries_other')} {t('para-desbloquear')}
                    </p>
                  </div>
                  <span className="text-[0.75rem] font-black font-mono text-text-secondary">{Math.round(goal.progress * 100)}%</span>
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
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-black text-charcoalBlue font-heading flex items-center gap-2 m-0">
              <Trophy size={16} /> {t('achievements.unlockedTitle')}
            </h3>
            <span className="text-[0.8rem] font-semibold text-text-secondary">
              {unlockedCount}/{totalCount}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
            {unlocked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
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
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-black text-charcoalBlue font-heading flex items-center gap-2 m-0">
              <Compass size={16} /> {t('achievements.lockedTitle')}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </Motion.div>
      )}
    </div>
  );
};

export default AchievementsGrid;
