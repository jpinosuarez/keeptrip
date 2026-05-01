import React from 'react';
import { cn } from '@shared/lib/utils/cn';

/**
 * Skeleton placeholder card for trip loading states.
 */

/** Skeleton for DashboardHome recent trip cards */
export function TripCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse shrink-0",
        "aspect-[4/5] min-w-[180px] max-w-[320px] flex-[1_1_220px]",
        "rounded-xl border border-border bg-slate-100 mb-md"
      )}
    />
  );
}

/** Skeleton for BentoGrid masonry items */
export function BentoCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse min-h-[200px]",
        "rounded-lg border border-border bg-slate-100"
      )}
    />
  );
}

/** Renders n skeleton cards */
export function SkeletonList({ count = 3, Component = TripCardSkeleton }) {
  return (
    <div className="flex flex-col gap-md">
      {Array.from({ length: count }).map((_, i) => 
        React.createElement(Component, { key: i })
      )}
    </div>
  );
}
