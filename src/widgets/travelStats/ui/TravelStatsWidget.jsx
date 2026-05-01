/**
 * TravelStatsWidget — 2026 Analytics Dashboard
 * 
 * Features:
 *  - Responsive Bento Box layout (Grid on Mobile, Flex on Desktop)
 *  - Glassmorphic hero card with brand gradient
 *  - Standardized micro-stats pills for secondary metrics
 */
import React from 'react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Globe, Compass, Calendar, MapPin } from 'lucide-react';
import { ANIMATION_DELAYS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const StatCard = ({ stat, hero = false, compact = false, index, className }) => {
  const isSecondary = !hero;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: ANIMATION_DELAYS.fast + index * 0.06, duration: 0.35 }}
      className={cn(
        "flex flex-col justify-start min-w-0 min-h-0 backdrop-blur-lg transition-all duration-300",
        compact ? "px-4 py-2 gap-0 rounded-full" : "rounded-xl p-3 gap-2",
        hero 
          ? "bg-gradient-to-br from-atomicTangerine/15 to-mutedTeal/10 shadow-md border border-atomicTangerine/15" 
          : "bg-white/78 border border-black/5 shadow-sm hover:shadow-md",
        isSecondary ? "justify-center" : "",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col min-w-0 w-full h-full justify-center",
          hero ? "items-center text-center gap-2" : "gap-1.5",
          compact && !hero ? "flex-row items-center gap-1.5" : "",
          isSecondary && !compact ? "justify-between items-center flex-row gap-2" : ""
        )}
      >
        {isSecondary ? (
          <>
            <div className={cn(
              "flex flex-col items-start gap-0 min-w-0 flex-1",
              compact ? "items-center text-center flex-[0_1_auto]" : ""
            )}>
              <span
                className={cn(
                  "font-black tracking-tight text-charcoalBlue font-heading leading-tight",
                  compact ? "text-[clamp(1.05rem,2vw,1.25rem)]" : "text-[clamp(1.1rem,1.4vw,1.35rem)]"
                )}
              >
                {stat.displayValue}
              </span>
              <span className="text-[0.75rem] font-semibold tracking-tight normal-case text-slate-500 leading-tight font-heading">
                {stat.label}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-mutedTeal/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <span className="text-mutedTeal flex items-center justify-center">{stat.icon}</span>
            </div>
          </>
        ) : (
          <>
            <span
              className={cn(
                "font-black tracking-tighter font-heading leading-none",
                hero ? "text-[clamp(2rem,3vw,2.5rem)] text-atomicTangerine" : "text-charcoalBlue",
                compact ? (hero ? "text-[clamp(1.5rem,2.8vw,1.9rem)]" : "text-[clamp(1.05rem,2vw,1.25rem)]") : ""
              )}
            >
              {stat.displayValue}
            </span>
            <span className={cn(
              "text-[0.75rem] font-bold tracking-widest uppercase leading-tight font-heading",
              hero ? "text-text-secondary" : "text-slate-500"
            )}>
              {stat.label}
            </span>
            {hero && stat.hint ? <span className="text-[0.62rem] leading-tight text-text-secondary opacity-70">{stat.hint}</span> : null}
          </>
        )}
      </div>
    </Motion.div>
  );
};

const TravelStatsWidget = ({ logStats = null, ariaLabel, variant = 'hero' }) => {
  const { t } = useTranslation('dashboard');
  const isCompact = variant === 'compact';

  const safeValue = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);

  const stats = React.useMemo(() => {
    if (!logStats) return null;

    const worldPercentage = Number.parseFloat(logStats.worldExploredPercentage || '0');

    return {
      worldExploredPercentage: {
        label: t('stats.worldExploredPercentage'),
        displayValue: `${Number.isNaN(worldPercentage) ? 0 : Math.round(worldPercentage)}%`,
      },
      uniqueCountries: {
        label: t('stats.uniqueCountries'),
        icon: <Globe size={20} strokeWidth={2.5} />,
        displayValue: (
          <span className="flex items-baseline gap-0.5">
            {formatNumber(safeValue(logStats.uniqueCountries))}
            <span className="opacity-60 text-[0.7em] font-bold">/195</span>
          </span>
        ),
      },
      completedTrips: {
        label: t('stats.completedTrips'),
        icon: <Compass size={20} strokeWidth={2.5} />,
        displayValue: formatNumber(safeValue(logStats.completedTrips)),
      },
      totalDays: {
        label: t('stats.totalDays'),
        icon: <Calendar size={20} strokeWidth={2.5} />,
        displayValue: formatNumber(safeValue(logStats.totalDays)),
      },
      totalStops: {
        label: t('stats.totalStops'),
        icon: <MapPin size={20} strokeWidth={2.5} />,
        displayValue: formatNumber(safeValue(logStats.totalStops)),
      },
    };
  }, [logStats, t]);

  if (!stats || safeValue(logStats?.completedTrips) === 0) {
    return (
      <section role="region" aria-label={ariaLabel} className="w-full h-full">
        <div className="flex flex-col gap-2 p-6 rounded-xl bg-white/60 border border-dashed border-black/10 text-center items-center">
          <span className="text-sm font-bold text-charcoalBlue font-heading">{t('stats.emptyStateHint')}</span>
          <span className="text-xs text-text-secondary leading-relaxed max-w-[200px]">{t('stats.emptyStateMessage')}</span>
        </div>
      </section>
    );
  }

  const cards = [
    {
      key: 'worldExploredPercentage',
      hero: true,
      className: isCompact ? "col-span-2 md:flex-auto" : "col-span-2 md:flex-[1_1_240px]",
      stat: stats.worldExploredPercentage,
    },
    {
      key: 'uniqueCountries',
      className: isCompact ? "col-span-1 md:flex-auto" : "col-span-1 md:flex-[1_1_180px]",
      stat: stats.uniqueCountries,
    },
    {
      key: 'completedTrips',
      className: isCompact ? "col-span-1 md:flex-auto" : "col-span-1 md:flex-[1_1_180px]",
      stat: stats.completedTrips,
    },
    {
      key: 'totalDays',
      className: isCompact ? "col-span-1 md:flex-auto" : "col-span-1 md:flex-[1_1_180px]",
      stat: stats.totalDays,
    },
    {
      key: 'totalStops',
      className: isCompact ? "col-span-1 md:flex-auto" : "col-span-1 md:flex-[1_1_180px]",
      stat: stats.totalStops,
    },
  ];

  return (
    <section role="region" aria-label={ariaLabel} className="w-full h-full">
      <div className={cn(
        "grid grid-cols-2 md:flex md:flex-wrap justify-center gap-3 md:gap-6 w-full mx-auto max-w-[900px]",
        isCompact ? "items-center" : "items-stretch"
      )}>
        {cards.map((card, index) => (
          <StatCard
            key={card.key}
            stat={card.stat}
            hero={card.hero}
            compact={isCompact}
            className={card.className}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default TravelStatsWidget;