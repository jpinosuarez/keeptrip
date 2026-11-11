import React from 'react';
import { Globe2, Compass, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatLocalizedNumber } from '@shared/lib/utils';
import { cn } from '@shared/lib/utils/cn';

const XP_LEVEL_RANKS = [
  { level: 1, minXP: 0, icon: '🧭', titleKey: 'ranks.level1', defaultTitle: 'Explorador Inicial' },
  { level: 2, minXP: 1001, icon: '🎒', titleKey: 'ranks.level2', defaultTitle: 'Viajero Frecuente' },
  { level: 3, minXP: 3001, icon: '🌍', titleKey: 'ranks.level3', defaultTitle: 'Trotamundos' },
  { level: 4, minXP: 7001, icon: '✈️', titleKey: 'ranks.level4', defaultTitle: 'Explorador Global' },
  { level: 5, minXP: 15001, icon: '👑', titleKey: 'ranks.level5', defaultTitle: 'Leyenda del Camino' },
];

/** Resolves the canonical XP rank, next rank, progress % and remaining XP. */
export function resolveXpRank(totalXP = 0) {
  const xp = Math.max(0, Number(totalXP) || 0);
  let current = XP_LEVEL_RANKS[0];
  let next = XP_LEVEL_RANKS[1];
  for (let i = 0; i < XP_LEVEL_RANKS.length; i += 1) {
    if (xp >= XP_LEVEL_RANKS[i].minXP) {
      current = XP_LEVEL_RANKS[i];
      next = XP_LEVEL_RANKS[i + 1] || null;
    }
  }
  const progressPct = next
    ? Math.min(
        100,
        Math.max(
          4,
          Math.round(((xp - current.minXP) / Math.max(1, next.minXP - current.minXP)) * 100)
        )
      )
    : 100;
  const remainingXP = next ? Math.max(0, next.minXP - xp) : 0;
  return { current, next, progressPct, remainingXP };
}

export default function TravelerProgress({
  displayName,
  photoURL,
  countriesCount = 0,
  tripsCount = 0,
  unlockedBadgesCount = 0,
  totalBadgesCount = 0,
  totalXP = 0,
  xpBreakdown = null,
  className,
}) {
  const { t, i18n } = useTranslation('hub');
  const lang = i18n.language || 'es';
  const effectiveXP = xpBreakdown?.totalXP ?? totalXP ?? (countriesCount * 500 + tripsCount * 100);
  const { current, next, progressPct, remainingXP } = resolveXpRank(effectiveXP);

  return (
    <section
      className={cn(
        'w-full rounded-3xl bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col gap-3.5',
        className
      )}
      data-testid="traveler-progress-card"
    >
      {/* Top Row: Identity on Left, Uniform KPI Pills on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName || t('defaultTravelerName', 'Explorador Keeptrip')}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-[#FF6B35]/30 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-heading font-extrabold text-base sm:text-lg shrink-0">
              {String(displayName || 'E').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] font-mono text-[11px] font-bold">
              <span>{current.icon}</span>
              <span>
                {t('levelLabel', 'Nivel')} {current.level} · {t(current.titleKey, current.defaultTitle)}
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate">
              {displayName || t('defaultTravelerName', 'Explorador Keeptrip')}
            </h2>
          </div>
        </div>

        {/* 3 Compact KPI Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
            <Globe2 className="text-[#FF6B35] shrink-0" size={14} />
            <span className="font-mono text-xs font-extrabold text-slate-900">{countriesCount}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">
              {t('stats.countries', 'Países')}
            </span>
          </div>

          <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
            <Compass className="text-[#45B0A8] shrink-0" size={14} />
            <span className="font-mono text-xs font-extrabold text-slate-900">{tripsCount}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">
              {t('stats.trips', 'Viajes')}
            </span>
          </div>

          <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5">
            <Trophy className="text-amber-500 shrink-0" size={14} />
            <span className="font-mono text-xs font-extrabold text-slate-900">
              {totalBadgesCount > 0 ? `${unlockedBadgesCount}/${totalBadgesCount}` : unlockedBadgesCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">
              {t('tabs.badgesShort', 'Insignias')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Full-Width Progress Bar with Humanized Copy */}
      <div className="w-full space-y-1.5 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-sans font-semibold text-slate-600 truncate">
            {next
              ? t('nextRankHumanCopy', {
                  remaining: formatLocalizedNumber(remainingXP, lang),
                  nextTitle: t(next.titleKey, next.defaultTitle),
                  nextLevel: next.level,
                  defaultValue: `A ${formatLocalizedNumber(remainingXP, lang)} XP de alcanzar ${t(next.titleKey, next.defaultTitle)} (Nivel ${next.level})`,
                })
              : t('maxLevelReached', '¡Has alcanzado el rango máximo de Leyenda del Camino!')}
          </span>
          <span className="font-mono font-bold text-slate-700 shrink-0" data-testid="traveler-total-xp">
            {formatLocalizedNumber(effectiveXP, lang)} XP ({progressPct}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-amber-500 transition-all duration-500"
          />
        </div>
      </div>
    </section>
  );
}
