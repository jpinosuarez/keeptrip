/**
 * TravelStatsWidget — Consolidated Bar (Ultra-Compact)
 * - Replaces the grid hero with a single compact stats bar.
 * - Mobile-first: uses `flex-wrap` and `overflow-x-auto no-scrollbar` for graceful degradation.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Compass, Calendar, MapPin } from 'lucide-react';

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(Math.round(value));
};

const TravelStatsWidget = ({ logStats = null, ariaLabel, variant = 'compact', containerClassName = 'w-full' }) => {
  const { t } = useTranslation('dashboard');
  // variant is for future extensibility (e.g. 'full', 'compact')
  console.log('Stats variant:', variant);


  const safeValue = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

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

  const worldPct = Math.max(0, Math.min(100, Number.parseFloat(logStats.worldExploredPercentage || '0') || 0));

  const items = [
    {
      key: 'uniqueCountries',
      icon: <Globe size={18} className="text-atomicTangerine" />, 
      value: `${formatNumber(safeValue(logStats.uniqueCountries))}`,
      label: t('stats.uniqueCountries'),
    },
    {
      key: 'completedTrips',
      icon: <Compass size={18} className="text-atomicTangerine" />, 
      value: `${formatNumber(safeValue(logStats.completedTrips))}`,
      label: t('stats.completedTrips'),
    },
    {
      key: 'totalDays',
      icon: <Calendar size={18} className="text-atomicTangerine" />, 
      value: `${formatNumber(safeValue(logStats.totalDays))}`,
      label: t('stats.totalDays'),
    },
    {
      key: 'totalStops',
      icon: <MapPin size={18} className="text-atomicTangerine" />, 
      value: `${formatNumber(safeValue(logStats.totalStops))}`,
      label: t('stats.totalStops'),
    },
  ];

  return (
    <section role="region" aria-label={ariaLabel} className={containerClassName}>
      <div className="w-full bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-md shadow-lg border border-white/10 rounded-2xl px-3 py-3 md:p-4">
        {/* Single-Row Flex Layout: Mobile wraps, Desktop fixed row */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap md:flex-nowrap items-center justify-between gap-2 w-full">
          {/* World Explored Mini Section - Left */}
          <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[110px]">
            <div className="space-y-0.5">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-atomicTangerine to-mutedTeal transition-all duration-500" 
                  style={{ width: `${worldPct}%` }}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">{t('stats.worldExploredPercentage')}</span>
              <span className="text-xs font-black text-atomicTangerine drop-shadow-lg block">{Math.round(worldPct)}%</span>
            </div>
          </div>

          {/* 4 Metrics - Horizontal Row */}
          {items.map((it) => (
            <div key={it.key} className="flex flex-col items-start flex-1 min-w-[80px]">
              <div className="flex items-center gap-1 min-w-0">
                {React.cloneElement(it.icon, { size: 16 })}
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary truncate">
                  {it.label}
                </span>
              </div>
              <span className="text-xs font-black text-atomicTangerine drop-shadow-lg mt-0.5">{it.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TravelStatsWidget;