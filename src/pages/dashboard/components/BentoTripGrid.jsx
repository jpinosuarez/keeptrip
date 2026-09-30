/**
 * BentoTripGrid — Dynamic grid layout for 1-4 recent trips
 * Automatically adjusts col-span and row-span based on trip count
 */
import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import TripCard from '@widgets/tripGrid/ui/TripCard';
import { cn } from '@shared/lib/utils/cn';

/**
 * Compute col/row spans based on trip count and position
 * @param {number} tripCount Total number of trips (1-4)
 * @param {number} index Position in array (0-based)
 * @returns {{ colSpan: number, rowSpan: number }}
 */
const getGridSpan = (tripCount, index) => {
  if (tripCount === 1) {
    return { colSpan: 2, rowSpan: 2 }; // Hero card
  }
  if (tripCount === 2) {
    return { colSpan: 2, rowSpan: 1 }; // Side-by-side
  }
  if (tripCount === 3) {
    return index === 0 
      ? { colSpan: 2, rowSpan: 1 } // First: full width
      : { colSpan: 1, rowSpan: 1 }; // Rest: half width
  }
  // tripCount === 4
  return { colSpan: 1, rowSpan: 1 }; // 2x2 grid
};

const BentoTripGrid = ({ trips = [], tripData = {}, onEdit, onDelete, priorityImageId = null }) => {
  return (
    <Motion.div
      className="grid gap-4 md:gap-6 w-full h-full grid-cols-1 md:grid-cols-2 auto-rows-max md:auto-rows-[minmax(250px,auto)]"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0 } } }}
    >
      <AnimatePresence mode="popLayout">
        {trips.map((trip, index) => {
          const { colSpan, rowSpan } = getGridSpan(trips.length, index);
          const data = tripData[trip.id] || trip || {};
          const isPriority = trip.id === priorityImageId;

          // Skip if trip has no valid data
          if (!data.titulo && !data.nombreEspanol && !data.nameSpanish && !data.paisCodigo && !data.code && !data.countryCode) {
            return null;
          }

          return (
            <Motion.div
              key={trip.id}
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
                onDelete={() => onDelete?.(trip.id)}
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
