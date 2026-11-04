/**
 * TravelStatsWidget — Consolidated Interactive Summary Bar (Block 2.3)
 * - Circular "World explored" progress ring (viewBox 0 0 36 36, never clipped).
 * - Uniform JetBrains Mono metrics with dark slate values.
 * - Fully interactive: any metric (or the trailing pill) opens /hub.
 * - Mobile-first: flex-wrap down to 360px, no horizontal scroll.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Globe, Compass, Calendar, MapPin, Route, ArrowRight } from 'lucide-react';
import { ENABLE_TRAVEL_STATS } from '@shared/config';
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
    },
  ];

  return (
    <section role="region" aria-label={ariaLabel} className={containerClassName}>
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 md:px-5 md:py-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 md:gap-6">
        {/* World explored — circular progress ring (always vertically centered) */}
        <button
          {...interactiveProps}
          aria-label={t('stats.worldExploredPercentage')}
          className="flex items-center gap-2.5 flex-shrink-0 min-h-[44px] bg-transparent border-none p-0 text-left cursor-pointer disabled:cursor-default"
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
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#FF6B35]">
              {Math.round(worldPct)}%
            </span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 leading-tight">
            {t('stats.worldExploredPercentage')}
          </span>
        </button>

        {/* Metric cells — uniform typography */}
        {items.map(({ key, Icon, value, label }) => (
          <button
            key={key}
            {...interactiveProps}
            aria-label={label}
            className="flex flex-col items-start justify-center flex-1 min-w-[72px] min-h-[44px] bg-transparent border-none p-0 text-left cursor-pointer transition-opacity hover:opacity-80 disabled:cursor-default"
          >
            <span className="flex items-center gap-1 mb-1 min-w-0">
              <Icon size={16} className="text-atomicTangerine shrink-0" />
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 leading-tight truncate">
                {label}
              </span>
            </span>
            <span className="text-sm md:text-base font-bold font-mono text-slate-900 leading-none">
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
            className="shrink-0 ml-auto px-4 py-2 rounded-xl bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {t('stats.viewMoreStats')}
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </section>
  );
};

export default TravelStatsWidget;

