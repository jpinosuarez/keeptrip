import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import EmptyStateCard from '@shared/ui/components/EmptyStateCard';

/**
 * EmptyDashboardState — Minimalist empty placeholder for the "Recent Adventures" column.
 * No CTA button here — the primary Hero CTA lives in WelcomeBento to avoid visual
 * confusion. Uses the canonical <EmptyStateCard /> with a transparent Bento variant.
 */
const EmptyDashboardState = () => {
  const { t } = useTranslation('dashboard');

  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      className="w-full h-full min-h-0 flex items-center justify-center"
    >
      <EmptyStateCard
        icon={Globe}
        accentColor="orange"
        title={t('welcome.emptyStateTitle')}
        description={t('welcome.recentPlaceholder')}
        className="bg-transparent border-0 shadow-none w-full max-w-md px-4 py-8 md:px-6 md:py-10"
      />
    </Motion.div>
  );
};

export default EmptyDashboardState;

