import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, Check, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearch } from '@app/providers';
import CountryFlag from '@shared/ui/components/CountryFlag';
import BottomSheet from '@shared/ui/components/BottomSheet/BottomSheet';
import FilterDropdown from '@widgets/tripGrid/ui/components/FilterDropdown';
import { cn } from '@shared/lib/utils/cn';

const pickOption = (options, value) => options.find((option) => option.value === value) || options[0];

const SheetOptionGroup = ({ title, options = [], value, onSelect }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[0.7rem] font-bold uppercase tracking-wide text-slate-400 px-1">
      {title}
    </span>
    <div className="flex flex-col gap-0.5">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect?.(option.value)}
            className={cn(
              'w-full min-h-[44px] px-3 rounded-xl text-sm font-medium text-left',
              'flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors',
              isSelected ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-slate-700'
            )}
          >
            <span className="flex items-center min-w-0 flex-1">
              {option.flagCode && <CountryFlag code={option.flagCode} size="xs" />}
              <span className={cn('truncate', option.flagCode && 'ml-2')}>{option.label}</span>
            </span>
            {option.count != null && (
              <span className="text-slate-400 text-[11px] font-mono shrink-0">
                ({option.count})
              </span>
            )}
            {isSelected && <Check size={16} className="shrink-0" />}
          </button>
        );
      })}
    </div>
  </div>
);

/**
 * TripCommandBar — single live-filter search authority + 5 uniform custom
 * dropdowns, a separated sort control, view-mode switcher and mobile sheet.
 */
const TripCommandBar = ({
  filters = {},
  onChange,
  countryOptions = [],
  yearOptions = [],
  resultCount = 0,
  totalCount = 0,
  onClearFilters,
}) => {
  const { t } = useTranslation('dashboard');
  const { busqueda: query, setBusqueda, limpiarBusqueda } = useSearch();
  const [inputValue, setInputValue] = useState(query);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 150ms debounce → single search authority (useSearch).
  useEffect(() => {
    const timer = setTimeout(() => setBusqueda(inputValue), 150);
    return () => clearTimeout(timer);
  }, [inputValue, setBusqueda]);

  const handleSearchChange = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    limpiarBusqueda();
  }, [limpiarBusqueda]);

  const handleClearAll = useCallback(() => {
    setInputValue('');
    limpiarBusqueda();
    // Reset the sort back to the default alongside the 5 filter dimensions.
    onChange?.({ sort: 'recent' });
    onClearFilters?.();
  }, [limpiarBusqueda, onChange, onClearFilters]);

  const handleChange = useCallback((patch) => onChange?.(patch), [onChange]);

  const handleViewMode = useCallback(
    (mode) => {
      if (filters.viewMode === mode) return;
      try {
        localStorage.setItem('keeptrip_trips_view_mode', mode);
      } catch {
        // localStorage may be unavailable (private mode); ignore.
      }
      onChange?.({ viewMode: mode });
    },
    [filters.viewMode, onChange]
  );

  const activeFilterCount = useMemo(() => {
    const keys = ['year', 'country', 'scope', 'duration', 'curation', 'companion'];
    return keys.reduce(
      (count, key) => (filters[key] && filters[key] !== 'all' ? count + 1 : count),
      0
    );
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || Boolean(query);

  const yearOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filterAllYearsShort', 'Todos') },
      { value: 'thisYear', label: t('filterThisYear', 'Este año') },
      ...yearOptions.map((year) => ({ value: String(year), label: String(year) })),
    ],
    [yearOptions, t]
  );

  const countryOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filterAllCountriesShort', 'Todos') },
      ...countryOptions.map((option) => ({
        value: option.code,
        label: option.name,
        flagCode: option.code,
        count: option.count,
      })),
    ],
    [countryOptions, t]
  );

  const scopeOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filterAllScopes', 'Todos') },
      { value: 'local', label: t('filterLocal', 'Aventuras Locales') },
      { value: 'international', label: t('filterInternational', 'Internacionales') },
    ],
    [t]
  );

  const durationOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filterAllDurations', 'Todas') },
      { value: 'short', label: t('filterDurationShort', 'Escapadas (<4d)') },
      { value: 'medium', label: t('filterDurationMedium', 'Viajes Medios (5-14d)') },
      { value: 'long', label: t('filterDurationLong', 'Grandes Expediciones (15+d)') },
    ],
    [t]
  );

  const curationOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filterAllCuration', 'Todos') },
      { value: 'complete', label: t('filterCompleted', 'Completos') },
      { value: 'incomplete', label: t('filterIncomplete', 'Por enriquecer') },
    ],
    [t]
  );

  const companionOptionsList = useMemo(
    () => [
      { value: 'all', label: t('filters.allCompanions', 'Todas las compañías') },
      { value: 'solo', label: t('companionType.solo', 'En solitario') },
      { value: 'couple', label: t('companionType.couple', 'En pareja') },
      { value: 'family', label: t('companionType.family', 'En familia') },
      { value: 'friends', label: t('companionType.friends', 'Con amigos') },
    ],
    [t]
  );

  const sortOptionsList = useMemo(
    () => [
      { value: 'recent', label: t('sortRecent', 'Más recientes') },
      { value: 'oldest', label: t('sortOldest', 'Más antiguos') },
      { value: 'duration', label: t('sortDuration', 'Mayor duración') },
      { value: 'stops', label: t('sortStops', 'Más paradas') },
    ],
    [t]
  );

  const yearValue = filters.year ?? 'all';
  const countryValue = filters.country ?? 'all';
  const scopeValue = filters.scope ?? 'all';
  const durationValue = filters.duration ?? 'all';
  const curationValue = filters.curation ?? 'all';
  const companionValue = filters.companion ?? 'all';
  const sortValue = filters.sort ?? 'recent';

  const yearLabel = `${t('yearPrefix', 'Año')}: ${pickOption(yearOptionsList, yearValue).label}`;
  const countryLabel = `${t('countryPrefix', 'País')}: ${pickOption(countryOptionsList, countryValue).label}`;
  const scopeLabel = `${t('scopePrefix', 'Tipo')}: ${pickOption(scopeOptionsList, scopeValue).label}`;
  const durationLabel = `${t('durationPrefix', 'Duración')}: ${pickOption(durationOptionsList, durationValue).label}`;
  const curationLabel = `${t('curationPrefix', 'Estado')}: ${pickOption(curationOptionsList, curationValue).label}`;
  const companionLabel = `${t('companionPrefix', 'Compañía')}: ${pickOption(companionOptionsList, companionValue).label}`;
  const sortLabel = `${t('sortPrefix', 'Ordenar')}: ${pickOption(sortOptionsList, sortValue).label}`;

  const renderFilterDropdowns = () => (
    <>
      <FilterDropdown
        triggerLabel={yearLabel}
        active={yearValue !== 'all'}
        options={yearOptionsList}
        value={yearValue}
        onSelect={(next) => handleChange({ year: next })}
        ariaLabel={t('yearPrefix', 'Año')}
        testId="filter-year"
      />
      <FilterDropdown
        triggerLabel={countryLabel}
        active={countryValue !== 'all'}
        options={countryOptionsList}
        value={countryValue}
        onSelect={(next) => handleChange({ country: next })}
        ariaLabel={t('countryPrefix', 'País')}
        testId="filter-country"
      />
      <FilterDropdown
        triggerLabel={scopeLabel}
        active={scopeValue !== 'all'}
        options={scopeOptionsList}
        value={scopeValue}
        onSelect={(next) => handleChange({ scope: next })}
        ariaLabel={t('scopeLabel', 'Alcance geográfico')}
        testId="filter-scope"
      />
      <FilterDropdown
        triggerLabel={durationLabel}
        active={durationValue !== 'all'}
        options={durationOptionsList}
        value={durationValue}
        onSelect={(next) => handleChange({ duration: next })}
        ariaLabel={t('durationLabel', 'Duración')}
        testId="filter-duration"
      />
      <FilterDropdown
        triggerLabel={curationLabel}
        active={curationValue !== 'all'}
        options={curationOptionsList}
        value={curationValue}
        onSelect={(next) => handleChange({ curation: next })}
        ariaLabel={t('curationLabel', 'Estado de curación')}
        testId="filter-curation"
      />
      <FilterDropdown
        triggerLabel={companionLabel}
        active={companionValue !== 'all'}
        options={companionOptionsList}
        value={companionValue}
        onSelect={(next) => handleChange({ companion: next })}
        ariaLabel={t('companionPrefix', 'Compañía')}
        testId="filter-companion"
      />
    </>
  );

  return (
    <div className="flex flex-col gap-2 pb-2" data-testid="trip-command-bar">
      {/* Unified live-filter search (desktop + mobile) */}
      <div className="flex items-center min-h-[44px] w-full sm:max-w-[400px] rounded-full border border-slate-200/90 bg-white px-4 gap-2.5 shadow-2xs focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/20 transition-all">
        <Search size={18} className="text-text-secondary shrink-0" />
        <input
          type="text"
          placeholder={t('searchTripsPlaceholder', 'Filtrar viajes por título, ciudad o país...')}
          aria-label={t('searchTripsPlaceholder', 'Filtrar viajes por título, ciudad o país...')}
          value={inputValue}
          onChange={handleSearchChange}
          className="border-none bg-transparent text-sm text-slate-800 w-full min-w-0 flex-1 outline-none focus:ring-0 placeholder:text-slate-400"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            aria-label={t('clearSearch')}
            className="border-none bg-transparent cursor-pointer text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center p-0 shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Mobile filters trigger */}
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="flex md:hidden items-center justify-center gap-1.5 h-11 min-h-[44px] min-w-[44px] px-3 rounded-full border border-slate-200 bg-white text-[0.8rem] font-bold text-charcoalBlue cursor-pointer"
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0
            ? t('filtersButtonCount', { count: activeFilterCount, defaultValue: 'Filtros ({{count}})' })
            : t('filtersButton', 'Filtros')}
        </button>

        {/* Desktop: 5 uniform filter dropdowns */}
        <div className="hidden md:flex items-center gap-2 flex-wrap min-w-0">
          {renderFilterDropdowns()}
        </div>

        {/* Right: separated sort control + view switcher */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className="hidden md:block">
            <FilterDropdown
              triggerLabel={sortLabel}
              triggerIcon={<ArrowUpDown size={14} className="text-slate-500" />}
              options={sortOptionsList}
              value={sortValue}
              onSelect={(next) => handleChange({ sort: next })}
              ariaLabel={t('sortLabel', 'Ordenar')}
              align="right"
              testId="sort-dropdown"
            />
          </div>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={t('viewMode', 'Modo de vista')}
          >
            <button
              type="button"
              onClick={() => handleViewMode('grid')}
              aria-pressed={filters.viewMode !== 'list'}
              aria-label={t('viewModeGrid', 'Cuadrícula')}
              className={cn(
                'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border-none bg-transparent cursor-pointer transition-all',
                filters.viewMode !== 'list'
                  ? 'text-atomicTangerine'
                  : 'text-text-secondary hover:text-charcoalBlue'
              )}
            >
              <LayoutGrid size={18} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => handleViewMode('list')}
              aria-pressed={filters.viewMode === 'list'}
              aria-label={t('viewModeList', 'Lista')}
              className={cn(
                'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border-none bg-transparent cursor-pointer transition-all',
                filters.viewMode === 'list'
                  ? 'text-atomicTangerine'
                  : 'text-text-secondary hover:text-charcoalBlue'
              )}
            >
              <List size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>

      {/* Active country deep-link chip */}
      {filters.country && filters.country !== 'all' && (
        <button
          type="button"
          onClick={() => onChange?.({ country: 'all' })}
          className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] font-sans text-xs font-bold inline-flex items-center gap-2 hover:bg-[#FF6B35]/15 transition-colors cursor-pointer self-start"
          data-testid="active-country-filter-pill"
        >
          <CountryFlag code={filters.country} size="xs" />
          <span>
            {countryOptionsList.find((option) => option.value === filters.country)?.label ||
              filters.country}
          </span>
          <X aria-label="Quitar filtro de país" size={14} />
        </button>
      )}

      {/* Results indicator */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-2 text-[0.78rem] text-slate-500">
          <span>
            {t('showingResults', {
              shown: resultCount,
              total: totalCount,
              defaultValue: 'Mostrando {{shown}} de {{total}} viajes',
            })}
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="min-h-[44px] px-2 border-none bg-transparent cursor-pointer text-atomicTangerine font-semibold"
          >
            {t('clearFilters', 'Limpiar filtros')}
          </button>
        </div>
      )}

      {/* Mobile filters BottomSheet: sort first, divider, then filter categories */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        ariaLabel={t('filtersButton', 'Filtros')}
      >
        <div className="flex flex-col gap-4 px-1 pb-2">
          <SheetOptionGroup
            title={t('sortBy', 'Ordenar por')}
            options={sortOptionsList}
            value={sortValue}
            onSelect={(next) => handleChange({ sort: next })}
          />
          <div className="h-px bg-slate-200" />
          <SheetOptionGroup
            title={t('yearPrefix', 'Año')}
            options={yearOptionsList}
            value={yearValue}
            onSelect={(next) => handleChange({ year: next })}
          />
          <SheetOptionGroup
            title={t('countryPrefix', 'País')}
            options={countryOptionsList}
            value={countryValue}
            onSelect={(next) => handleChange({ country: next })}
          />
          <SheetOptionGroup
            title={t('scopeLabel', 'Alcance geográfico')}
            options={scopeOptionsList}
            value={scopeValue}
            onSelect={(next) => handleChange({ scope: next })}
          />
          <SheetOptionGroup
            title={t('durationLabel', 'Duración')}
            options={durationOptionsList}
            value={durationValue}
            onSelect={(next) => handleChange({ duration: next })}
          />
          <SheetOptionGroup
            title={t('curationLabel', 'Estado de curación')}
            options={curationOptionsList}
            value={curationValue}
            onSelect={(next) => handleChange({ curation: next })}
          />
          <SheetOptionGroup
            title={t('companionPrefix', 'Compañía')}
            options={companionOptionsList}
            value={companionValue}
            onSelect={(next) => handleChange({ companion: next })}
          />
          <button
            type="button"
            onClick={() => setIsSheetOpen(false)}
            className="h-11 min-h-[44px] w-full rounded-full bg-atomicTangerine text-white font-bold border-none cursor-pointer"
          >
            {t('applyFilters', 'Aplicar')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default React.memo(TripCommandBar);

