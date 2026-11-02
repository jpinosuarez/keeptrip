import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { COUNTRIES_DATA } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

export const CountrySearchSelect = ({
  value,
  onChange,
  placeholder = 'Seleccionar país...',
  label,
  disabled = false,
  className = '',
}) => {
  const { t, i18n } = useTranslation(['common', 'countries']);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedIso = value ? value.toUpperCase() : '';
  const selectedCountryName = selectedIso
    ? getLocalizedCountryName(selectedIso, i18n.language) || selectedIso
    : '';

  const countriesList = useMemo(() => {
    return COUNTRIES_DATA.map((c) => ({
      code: c.code,
      name: getLocalizedCountryName(c.code, i18n.language) || c.name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [i18n.language]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return countriesList;
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return countriesList.filter((c) => {
      const norm = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return norm.includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [countriesList, searchQuery]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setIsOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const focusTimer = setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => clearTimeout(focusTimer);
  }, [isOpen]);

  // Keep the expanded list inside the modal viewport (modal bodies are scrollable
  // and can clip the dropdown when the field sits near the bottom edge).
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (container && typeof container.scrollIntoView === 'function') {
      container.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-1 w-full", className)}>
      {label && (
        <label className="text-xs font-bold text-[#2C3E50] uppercase tracking-wider">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen((p) => !p);
          setSearchQuery('');
        }}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-left",
          "flex items-center justify-between gap-2.5 min-h-[44px] cursor-pointer",
          "focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] outline-none transition-all",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          isOpen && "border-[#FF6B35] ring-2 ring-[#FF6B35]/20"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedIso ? (
            <>
              <CountryFlag code={selectedIso} size="sm" />
              <span className="text-sm font-semibold text-slate-800 truncate font-sans">
                {selectedCountryName}
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={cn("text-slate-400 transition-transform shrink-0", isOpen && "rotate-180 text-[#FF6B35]")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[200px] overflow-y-auto overscroll-contain touch-pan-y custom-scroll">
          <div className="sticky top-0 z-10 p-2 border-b border-slate-100 flex items-center gap-2 bg-white">
            <Search size={16} className="text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common:search', 'Buscar país...')}
              className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 min-h-[36px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="p-1 flex flex-col gap-0.5">
            {filtered.length > 0 ? (
              filtered.map((c) => {
                const isSelected = c.code === selectedIso;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onChange?.(c.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      "w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors rounded-xl text-sm cursor-pointer",
                      isSelected
                        ? "bg-[#FF6B35]/10 text-[#FF6B35] font-bold"
                        : "text-slate-700 font-medium"
                    )}
                  >
                    <CountryFlag code={c.code} size="sm" />
                    <span className="truncate flex-1 min-w-0">{c.name}</span>
                    {isSelected && <Check size={16} className="text-[#FF6B35] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 font-medium">
                {t('common:noResults', 'No se encontraron países')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySearchSelect;
