import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';
import { normalizeToIsoDate } from '@shared/lib/utils/viajeUtils';
import { cn } from '@shared/lib/utils/cn';

/**
 * Colophon footer for the Documentary Viewer: XP summary, share action and
 * sequential trip navigation (previous / next) computed chronologically.
 */
const VisorFooterSection = ({
  tripList = [],
  viajeId = null,
  xp = 0,
  shareData = null,
  onNavigateTrip,
}) => {
  const { t } = useTranslation('visor');

  const orderedTrips = useMemo(() => {
    const list = (Array.isArray(tripList) ? tripList : []).filter(Boolean);
    return [...list].sort((a, b) => {
      const dateA = normalizeToIsoDate(a?.fechaInicio || a?.fecha) || '9999-12-31';
      const dateB = normalizeToIsoDate(b?.fechaInicio || b?.fecha) || '9999-12-31';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return String(a?.titulo || a?.id || '').localeCompare(String(b?.titulo || b?.id || ''));
    });
  }, [tripList]);

  const currentIndex = orderedTrips.findIndex((trip) => trip?.id === viajeId);
  const hasSequentialNavigation = orderedTrips.length > 1 && currentIndex !== -1;
  const previousTrip = hasSequentialNavigation
    ? orderedTrips[(currentIndex - 1 + orderedTrips.length) % orderedTrips.length]
    : null;
  const nextTrip = hasSequentialNavigation
    ? orderedTrips[(currentIndex + 1) % orderedTrips.length]
    : null;

  const handleNavigate = (trip) => {
    if (!trip?.id || typeof onNavigateTrip !== 'function') return;
    onNavigateTrip(trip.id);
  };

  return (
    <footer
      data-testid="visor-footer"
      className="mt-4 border-t border-border pt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-2 rounded-full bg-atomicTangerine/10 border border-atomicTangerine/30 px-4 py-2 text-atomicTangerine font-mono text-sm font-bold">
          <Trophy size={15} />
          {t('footer.xpEarned', { xp, defaultValue: '+{{xp}} XP' })}
        </span>
        {shareData && <ShareStoryButton data={shareData} />}
      </div>

      {hasSequentialNavigation && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleNavigate(previousTrip)}
            disabled={!previousTrip}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full border border-border bg-surface text-textPrimary text-sm font-semibold transition-all',
              'hover:border-atomicTangerine hover:text-atomicTangerine disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer max-w-[220px]'
            )}
            title={previousTrip?.titulo || ''}
          >
            <ChevronLeft size={16} />
            <span className="truncate">
              {t('footer.previousTrip', 'Viaje anterior')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigate(nextTrip)}
            disabled={!nextTrip}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full border border-border bg-surface text-textPrimary text-sm font-semibold transition-all',
              'hover:border-atomicTangerine hover:text-atomicTangerine disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer max-w-[220px]'
            )}
            title={nextTrip?.titulo || ''}
          >
            <span className="truncate">
              {t('footer.nextTrip', 'Siguiente viaje')}
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </footer>
  );
};

export default VisorFooterSection;
