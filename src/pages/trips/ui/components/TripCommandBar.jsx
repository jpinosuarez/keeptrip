import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, List } from 'lucide-react';
import { useToast } from '@app/providers';
import { cn } from '@shared/lib/utils/cn';

const TripCommandBar = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation('dashboard');
  const { pushToast } = useToast();
  const handleListToggle = () => { pushToast(t('toast.comingSoon'), 'info'); };

  return (
    <div className="flex flex-col gap-2 pb-2">
      <div className="pt-2 flex flex-row items-center justify-between">
        <div className="flex gap-1.5 items-center">
          <button
            onClick={() => onFilterChange('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-full border text-[0.78rem] font-bold cursor-pointer transition-all duration-200 min-h-[40px] whitespace-nowrap",
              activeFilter === 'all'
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine"
                : "border-slate-200 bg-transparent text-charcoalBlue"
            )}
          >
            {t('filters.all')}
          </button>
          <button
            onClick={() => onFilterChange('year')}
            className={cn(
              "px-3.5 py-1.5 rounded-full border text-[0.78rem] font-bold cursor-pointer transition-all duration-200 min-h-[40px] whitespace-nowrap",
              activeFilter === 'year'
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine"
                : "border-slate-200 bg-transparent text-charcoalBlue"
            )}
          >
            {t('filters.year')}
          </button>
        </div>
        <div className="flex gap-0.5 items-center">
          <button
            title={t('viewGrid')}
            aria-label={t('viewGrid')}
            className="p-2 text-atomicTangerine bg-transparent border-none cursor-default min-h-[40px] min-w-[40px] flex items-center justify-center transition-all opacity-100"
          >
            <LayoutGrid size={18} strokeWidth={1.8} />
          </button>
          <button
            onClick={handleListToggle}
            title={t('viewList')}
            aria-label={t('viewList')}
            className="p-2 text-text-secondary bg-transparent border-none cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center transition-all opacity-60 hover:opacity-100"
          >
            <List size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TripCommandBar);