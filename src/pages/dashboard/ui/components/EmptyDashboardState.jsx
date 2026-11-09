import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmptyDashboardState() {
  const { t } = useTranslation('dashboard');
  return (
    <Motion.div
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      className="w-full h-full min-h-0 flex flex-col items-center justify-center text-center bg-transparent px-6 py-10"
    >
      <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center mb-4">
        <Globe aria-hidden="true" size={26} strokeWidth={1.75} />
      </div>
      <h3 className="m-0 font-heading text-lg font-extrabold text-slate-800 tracking-tight">
        {t('welcome.emptyStateTitle')}
      </h3>
      <p className="m-0 mt-2 font-sans text-sm text-slate-500 max-w-xs mx-auto">
        {t('welcome.recentPlaceholder')}
      </p>
    </Motion.div>
  );
}
