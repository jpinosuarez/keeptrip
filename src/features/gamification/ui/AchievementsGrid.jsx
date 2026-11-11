import React, { useState, useMemo } from 'react';
import { Target, ArrowRight, Globe2, BookOpen, Train, Users, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AchievementCard from './AchievementCard';
import { cn } from '@shared/lib/utils/cn';

const CATEGORY_TABS = [
  { id: 'ALL', labelKey: 'badges.categories.all', defaultLabel: 'Todas', icon: Award },
  { id: 'exploration', labelKey: 'badges.categories.exploration', defaultLabel: 'Exploración Global', icon: Globe2 },
  { id: 'narrative', labelKey: 'badges.categories.narrative', defaultLabel: 'Profundidad Documental', icon: BookOpen },
  { id: 'movement', labelKey: 'badges.categories.movement', defaultLabel: 'Estilo y Movimiento', icon: Train },
  { id: 'tribe_dreams', labelKey: 'badges.categories.tribeDreams', defaultLabel: 'Tribu y Sueños', icon: Users },
];

/**
 * AchievementsGrid v2.0 — "🎯 Próximo Hito a tu Alcance" assistant banner,
 * 4 mastery-category filter pills and the unlocked/locked badge grids.
 */
export default function AchievementsGrid({
  achievementsWithProgress = [],
  nextAchievableBadges = [],
}) {
  const { t } = useTranslation('hub');
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const topNextBadges = useMemo(() => {
    if (Array.isArray(nextAchievableBadges) && nextAchievableBadges.length > 0) {
      return nextAchievableBadges.slice(0, 2);
    }
    return achievementsWithProgress
      .filter((a) => !a.unlocked && (a.progress > 0 || a.current > 0))
      .slice(0, 2);
  }, [nextAchievableBadges, achievementsWithProgress]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'ALL') return achievementsWithProgress;
    return achievementsWithProgress.filter((a) => a.category === selectedCategory);
  }, [achievementsWithProgress, selectedCategory]);

  const unlockedList = useMemo(
    () => filteredAchievements.filter((a) => a.unlocked),
    [filteredAchievements],
  );
  const lockedList = useMemo(
    () => filteredAchievements.filter((a) => !a.unlocked),
    [filteredAchievements],
  );

  const handleAssistantAction = (badge) => {
    if (badge?.targetTab === 'wishlist') {
      navigate('/trips?tab=wishlist');
    } else {
      navigate('/trips');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" data-testid="achievements-grid">
      {topNextBadges.length > 0 && (
        <div
          className="rounded-[28px] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 md:p-6 shadow-lg border border-slate-700/80"
          data-testid="next-milestone-assistant"
        >
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-3">
            <Target className="text-[#FF6B35]" size={16} />
            <span>{t('assistant.title', '🎯 Próximo Hito a tu Alcance')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topNextBadges.map((badge) => {
              const pct =
                badge.progressPct ??
                Math.min(
                  99,
                  Math.round(
                    ((badge.progress ?? badge.current ?? 0) / Math.max(1, badge.target || 1)) * 100,
                  ),
                );
              const remaining =
                badge.remainingCount ??
                Math.max(1, (badge.target || 1) - (badge.progress ?? badge.current ?? 0));

              return (
                <div
                  key={badge.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-between gap-3"
                  data-testid={`assistant-badge-${badge.id}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-heading font-extrabold text-base text-white">
                        {t(`achievements.${badge.id}`, badge.id)}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#FF6B35]">{pct}%</span>
                    </div>
                    <p className="mt-1 font-sans text-xs text-slate-300">
                      {t(`achievements.${badge.id}_desc`, '')}
                    </p>
                    {badge.category && (
                      <span className="mt-1.5 inline-flex px-2 py-0.5 rounded-full bg-white/10 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-200">
                        {t(`badges.categories.${badge.category}`, badge.category)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full rounded-full bg-[#FF6B35]" />
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono text-[11px] text-amber-300">
                        {t('assistant.remainingCount', {
                          count: remaining,
                          defaultValue: `Faltan ${remaining} para desbloquear`,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAssistantAction(badge)}
                        className="min-h-[44px] px-3 py-1 rounded-full bg-[#FF6B35] hover:bg-[#e85a26] text-white font-sans text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{t('assistant.cta', 'Completar')}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 mastery-category filter pills */}
      <div
        className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1 sm:flex-wrap bg-transparent sm:bg-white sm:p-3 sm:rounded-3xl sm:border sm:border-slate-200/80 shadow-2xs"
        role="tablist"
      >
        {CATEGORY_TABS.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'min-h-[44px] shrink-0 px-4 py-2 rounded-full font-sans text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer',
                isActive
                  ? 'bg-[#FF6B35] text-white shadow-xs'
                  : 'bg-white sm:bg-transparent border sm:border-0 border-slate-200 text-slate-600 hover:bg-slate-100',
              )}
              data-testid={`badge-category-${cat.id}`}
            >
              <Icon size={14} />
              <span>{t(cat.labelKey, cat.defaultLabel)}</span>
            </button>
          );
        })}
      </div>
      {unlockedList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-extrabold text-base text-slate-800">
            {t('achievements.unlockedTitle', 'Insignias Desbloqueadas')} ({unlockedList.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedList.map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        </div>
      )}

      {lockedList.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading font-extrabold text-base text-slate-600">
            {t('achievements.lockedTitle', 'Próximos Desafíos')} ({lockedList.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedList.map((ach) => (
              <AchievementCard key={ach.id} achievement={ach} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}