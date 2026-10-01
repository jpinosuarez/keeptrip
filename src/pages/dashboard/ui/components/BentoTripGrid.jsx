/**
 * BentoTripGrid — Dynamic bento grid layout for 1-4 recent trips
 * Encapsulates loading skeletons, error banner, empty state, and responsive col/row spans.
 */
import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TripCard from '@widgets/tripGrid/ui/TripCard';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';
import EmptyDashboardState from './EmptyDashboardState';
import { getGridSpan } from './bentoGridUtils';
import { cn } from '@shared/lib/utils/cn';

const BentoTripGrid = ({
  trips = [],
  tripData = {},
  loading = false,
  isError = false,
  fetchError = null,
  isNewTraveler = false,
  onEdit,
  onDelete,
  onNewTrip,
  priorityImageId = null,
}) => {
  const { t } = useTranslation('dashboard');

  if (loading) {
    return (
      <div
        data-testid="bento-loading-state"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0 auto-rows-fr"
      >
        <SkeletonList count={2} Component={TripCardSkeleton} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="bento-error-state"
        className="flex flex-col items-start gap-2 p-3.5 rounded-lg border border-border bg-gradient-to-b from-white to-background shadow-sm min-w-0"
        role="status"
        aria-live="polite"
      >
        <WifiOff size={18} className="text-warning" />
        <p className="m-0 text-[0.9rem] leading-tight font-bold text-text-primary">
          {t('loadTripsError')}
        </p>
        {fetchError?.message && (
          <p className="m-0 text-[0.8rem] leading-tight text-text-secondary break-all">
            {fetchError.message}
          </p>
        )}
      </div>
    );
  }

  if (isNewTraveler || trips.length === 0) {
    return (
      <div
        data-testid="bento-empty-state"
        className="col-span-full min-w-0 min-h-0 w-full h-full flex items-center justify-center"
      >
        <EmptyDashboardState onNewTrip={onNewTrip} />
      </div>
    );
  }

  return (
    <Motion.div
      data-testid="bento-trip-grid"
      className="grid gap-4 w-full h-full min-h-0 grid-cols-1 md:grid-cols-2 auto-rows-max md:auto-rows-fr"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0 } } }}
    >
      <AnimatePresence mode="popLayout">
        {trips.map((trip, index) => {
          const { colSpan, rowSpan } = getGridSpan(trips.length, index);
          const data = tripData[trip.id] || trip || {};
          const isPriority = trip.id === priorityImageId || index === 0;

          // Skip if trip has no identifiable data
          if (
            !trip.id &&
            !data.titulo &&
            !data.title &&
            !data.nombreEspanol &&
            !data.nameSpanish &&
            !data.paisCodigo &&
            !data.code &&
            !data.countryCode
          ) {
            return null;
          }

          return (
            <Motion.div
              key={trip.id || index}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 100, damping: 20, delay: index * 0.08 }}
              className={cn(
                "rounded-2xl overflow-hidden min-h-0 h-full",
                colSpan === 2 && "md:col-span-2",
                rowSpan === 2 && "md:row-span-2"
              )}
            >
              <TripCard
                trip={{ ...data, id: trip.id }}
                variant="bento"
                onEdit={() => onEdit?.(trip.id)}
                onDelete={onDelete ? () => onDelete?.(trip.id) : undefined}
                priorityImage={isPriority}
              />
            </Motion.div>
          );
        })}
      </AnimatePresence>
    </Motion.div>
  );
};

export default BentoTripGrid;
