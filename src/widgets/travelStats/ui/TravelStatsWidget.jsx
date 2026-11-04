/**
 * TravelStatsWidget — Consolidated Interactive Bar (Block 2.3)
 * - Circular "World explored" progress ring (unclipped, viewBox 0 0 36 36).
 * - JetBrains Mono total-kilometre pill.
 * - Fully interactive: any metric (or the trailing action pill) opens /hub.
 * - Mobile-first: wraps gracefully down to 360px, no horizontal scroll.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Globe, Compass, Calendar, MapPin, Route, ArrowRight } from 'lucide-react';
import { ENABLE_TRAVEL_STATS } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import { formatLocalizedNumber, formatKmValue } from '@shared/lib/utils/numberUtils';

const TravelStatsWidget = ({ logStats = null, ariaLabel, containerClassName = 'w-full' }) => {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const isInteractive = ENABLE_TRAVEL_STATS;

  const safeValue = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : 0);

  if (!logStats || safeValue(logStats.completedTrips) === 0) {
    return (
      <section role="region" aria-label={ariaLabel} className="w-full h-full">
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/60 border border-dashed border-border text-center items-center">
          <span className="text-sm font-bold text-charcoalBlue">{t('stats.emptyStateHint')}</span>
          <span className="text-xs text-text-secondary">{t('stats.emptyStateMessage')}</span>
        </div>
      </section>
    );
  }

  const worldPct = Math.max(
    0,
    Math.min(100, Number.parseFloat(logStats.worldExploredPercentage || '0') || 0)
  );
  const ringOffset = 100 - worldPct;

  const openStats = () => {
    if (isInteractive) navigate('/hub');
  };

  const interactiveProps = isInteractive
    ? { type: 'button', onClick: openStats }
    : { type: 'button', disabled: true };

  const items = [
    {
      key: 'uniqueCountries',
      Icon: Globe,
      value: formatLocalizedNumber(safeValue(logStats.uniqueCountries), i18n?.language),
      label: t('stats.uniqueCountries'),
    },
    {
      key: 'completedTrips',
      Icon: Compass,
      value: formatLocalizedNumber(safeValue(logStats.completedTrips), i18n?.language),
      label: t('stats.completedTrips'),
    },
    {
      key: 'totalDays',
      Icon: Calendar,
      value: formatLocalizedNumber(safeValue(logStats.totalDays), i18n?.language),
      label: t('stats.totalDays'),
    },
    {
      key: 'totalStops',
      Icon: MapPin,
      value: formatLocalizedNumber(safeValue(logStats.totalStops), i18n?.language),
      label: t('stats.totalStops'),
    },
    {
      key: 'totalKm',
      Icon: Route,
      value: `${formatKmValue(safeValue(logStats.totalKm), i18n?.language)} km`,
      label: t('stats.totalKm'),
      mono: true,
    },
  ];

  return (
    <section role="region" aria-label={ariaLabel} className={containerClassName}>
      <div className="w-full bg-white/90 shadow-sm border border-slate-200/80 rounded-2xl px-3 py-3 md:p-4">
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap md:flex-nowrap items-center justify-between gap-2 w-full">
          {/* World explored — circular progress ring (never clipped) */}
          <button
            {...interactiveProps}
            aria-label={t('stats.worldExploredPercentage')}
            className="flex items-center gap-2 flex-shrink-0 min-w-[120px] min-h-[44px] bg-transparent border-none p-0 text-left cursor-pointer disabled:cursor-default"
          >
            <span className="relative w-10 h-10 shrink-0">
              <svg
                viewBox="0 0 36 36"
                className="w-10 h-10 -rotate-90 overflow-visible"
                aria-hidden="true"
              >
                <circle r="15.9155" cx="18" cy="18" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                <circle
                  r="15.9155"
                  cx="18"
                  cy="18"
                  fill="transparent"
                  stroke="#FF6B35"
                  strokeWidth="3"
                  strokeDasharray="100"
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-atomicTangerine">
                {Math.round(worldPct)}%
              </span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary leading-tight">
              {t('stats.worldExploredPercentage')}
            </span>
          </button>

          {/* Metric pills */}
          {items.map(({ key, Icon, value, label, mono }) => (
            <button
              key={key}
              {...interactiveProps}
              aria-label={label}
              className="flex flex-col items-start justify-center flex-1 min-w-[80px] min-h-[44px] bg-transparent border-none p-1 rounded-lg text-left cursor-pointer transition-colors hover:bg-atomicTangerine/5 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span className="flex items-center gap-1 min-w-0">
                <Icon size={16} className="text-atomicTangerine shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary truncate">
                  {label}
                </span>
              </span>
              <span
                className={cn(
                  'mt-0.5',
                  mono
                    ? 'font-mono text-sm font-bold text-slate-800'
                    : 'text-xs font-black text-atomicTangerine drop-shadow-lg'
                )}
              >
                {value}
              </span>
            </button>
          ))}

          {/* Trailing action pill */}
          {isInteractive && (
            <button
              type="button"
              onClick={openStats}
              aria-label={t('stats.viewMoreStats')}
              className="flex items-center gap-1 min-h-[44px] px-3 rounded-full bg-atomicTangerine/10 border border-atomicTangerine/20 text-[0.72rem] font-extrabold text-atomicTangerine whitespace-nowrap cursor-pointer hover:bg-atomicTangerine/15 transition-colors"
            >
              {t('stats.viewMoreStats')}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default TravelStatsWidget;

