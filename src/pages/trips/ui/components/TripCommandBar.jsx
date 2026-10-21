import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import { useSearch, useToast, useUI } from '@app/providers';
import { cn } from '@shared/lib/utils/cn';

const TripCommandBar = ({ activeFilter, onFilterChange }) => {
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  const { pushToast } = useToast();
  const { searchPaletteOpen } = useUI();
  const { busqueda: query, setBusqueda: setQuery, limpiarBusqueda: clearQuery } = useSearch();

  const handleListToggle = (e) => {
    e?.stopPropagation();
    if (searchPaletteOpen) return;
    pushToast(t('toast.comingSoon'), 'info');
  };

  return (
    <div className="flex flex-col gap-2 pb-2">
      {/* Mobile Inline Search Field */}
      <div className="flex md:hidden items-center h-11 w-full bg-white/90 backdrop-blur-md rounded-xl border border-border/60 px-3.5 gap-2 shadow-sm">
        <Search size={18} className="text-text-secondary shrink-0" />
        <input
          type="text"
          placeholder={tNav('searchJournal')}
          aria-label={tNav('searchJournal')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border-none bg-transparent text-sm text-charcoalBlue w-full outline-none focus:ring-0 placeholder:text-text-secondary"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            aria-label={tNav('clearSearch')}
            className="border-none bg-transparent cursor-pointer text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center p-0 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter and View Toggles */}
      <div className="pt-1 flex flex-row items-center justify-between gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={cn(
              "px-4 py-2 rounded-full border text-[0.82rem] font-bold cursor-pointer transition-all duration-200 min-h-[44px] min-w-[44px] whitespace-nowrap flex items-center justify-center",
              activeFilter === 'all'
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine"
                : "border-slate-200 bg-transparent text-charcoalBlue hover:bg-black/5"
            )}
          >
            {t('filters.all')}
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('year')}
            className={cn(
              "px-4 py-2 rounded-full border text-[0.82rem] font-bold cursor-pointer transition-all duration-200 min-h-[44px] min-w-[44px] whitespace-nowrap flex items-center justify-center",
              activeFilter === 'year'
                ? "border-atomicTangerine bg-atomicTangerine/10 text-atomicTangerine"
                : "border-slate-200 bg-transparent text-charcoalBlue hover:bg-black/5"
            )}
          >
            {t('filters.year')}
          </button>
        </div>
        <div className="flex gap-1 items-center shrink-0">
          <button
            type="button"
            title={t('viewGrid')}
            aria-label={t('viewGrid')}
            className="p-2.5 text-atomicTangerine bg-transparent border-none cursor-default min-h-[44px] min-w-[44px] flex items-center justify-center transition-all opacity-100"
          >
            <LayoutGrid size={18} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={handleListToggle}
            title={t('viewList')}
            aria-label={t('viewList')}
            className="p-2.5 text-text-secondary bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-all opacity-60 hover:opacity-100"
          >
            <List size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TripCommandBar);