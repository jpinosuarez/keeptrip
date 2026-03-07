import React from 'react';

/**
 * Skeleton placeholder card for trip loading states.
 * Uses CSS classes from mobile-polish.css (skeleton, skeleton-text).
 */

/** Skeleton for DashboardHome recent trip cards */
export function TripCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        height: '140px',
        flexShrink: 0,
      }}
    />
  );
}

/** Skeleton for BentoGrid masonry items */
export function BentoCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        minHeight: '200px',
      }}
    />
  );
}

/** Renders n skeleton cards */
export function SkeletonList({ count = 3, Component = TripCardSkeleton }) {
  return Array.from({ length: count }, (_, i) => React.createElement(Component, { key: i }));
}
