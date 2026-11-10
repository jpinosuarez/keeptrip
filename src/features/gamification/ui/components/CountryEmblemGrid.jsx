import React, { useState, useMemo } from 'react';
import { Globe2, Bookmark, Compass, Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CountryEmblemCard from './CountryEmblemCard';
import CountryEmblemModal from './CountryEmblemModal';
import EmptyStateCard from '@shared/ui/components/EmptyStateCard';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

const CONTINENT_FILTERS = [
  { id: 'ALL', labelKey: 'emblems.continents.all', defaultLabel: 'Todos' },
  { id: 'Europe', labelKey: 'emblems.continents.europe', defaultLabel: 'Europa' },
  { id: 'Americas', labelKey: 'emblems.continents.americas', defaultLabel: 'América' },
  { id: 'Asia', labelKey: 'emblems.continents.asia', defaultLabel: 'Asia' },
  { id: 'Africa', labelKey: 'emblems.continents.africa', defaultLabel: 'África' },
  { id: 'Oceania', labelKey: 'emblems.continents.oceania', defaultLabel: 'Oceanía' },
];

function matchesContinentFilter(emblem, continentId) {
  if (!continentId || continentId === 'ALL') return true;
  const raw = String(emblem?.continent || emblem?.catalogSpec?.continent || '').toLowerCase();
  if (continentId === 'Americas') {
    return raw.includes('america') || raw === 'am' || raw === 'na' || raw === 'sa';
  }
  if (continentId === 'Europe') return raw.includes('europ') || raw === 'eu';
  if (continentId === 'Asia') return raw.includes('asia') || raw === 'as';
  if (continentId === 'Africa') return raw.includes('afric') || raw === 'af';
  if (continentId === 'Oceania') return raw.includes('ocean') || raw === 'oc';
  return true;
}

export default function CountryEmblemGrid({ emblems = [], allEmblemsWithLocked = null, onCreateTrip }) {
  const { t, i18n } = useTranslation('hub');
  const [activeFilter, setActiveFilter] = useState('discovered');
  const [selectedContinent, setSelectedContinent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmblem, setSelectedEmblem] = useState(null);

  const discoveredEmblems = useMemo(
    () => emblems.filter((e) => e.visitsCount > 0 || e.status === 'origin_unvisited'),
    [emblems],
  );

  const wishlistEmblems = useMemo(
    () => emblems.filter((e) => e.status === 'wishlist' || e.tier === 'wishlist'),
    [emblems],
  );

  const atlasSource = useMemo(
    () => (Array.isArray(allEmblemsWithLocked) && allEmblemsWithLocked.length > 0 ? allEmblemsWithLocked : emblems),
    [allEmblemsWithLocked, emblems],
  );

  const visibleEmblems = useMemo(() => {
    let base = discoveredEmblems;
    if (activeFilter === 'wishlist') base = wishlistEmblems;
    else if (activeFilter === 'continent') base = discoveredEmblems;
    else if (activeFilter === 'atlas') base = atlasSource;

    if (activeFilter === 'continent' || activeFilter === 'atlas') {
      base = base.filter((e) => matchesContinentFilter(e, selectedContinent));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      base = base.filter((e) => {
        const code = String(e.countryCode || e.iso2 || '').toLowerCase();
        const locName = (getLocalizedCountryName(code, i18n.language) || e.countryName || '').toLowerCase();
        const iso3 = String(e.iso3 || e.catalogSpec?.iso3 || '').toLowerCase();
        return locName.includes(q) || code.includes(q) || iso3.includes(q);
      });
    }

    return base;
  }, [activeFilter, discoveredEmblems, wishlistEmblems, atlasSource, selectedContinent, searchQuery, i18n.language]);

  const filters = [
    { id: 'discovered', Icon: Globe2, labelKey: 'emblems.filters.discovered', defaultLabel: 'Descubiertos', activeClass: 'bg-[#FF6B35] text-white shadow-xs' },
    { id: 'wishlist', Icon: Bookmark, labelKey: 'emblems.filters.wishlist', defaultLabel: 'En Wishlist', activeClass: 'bg-[#45B0A8] text-white shadow-xs' },
    { id: 'continent', Icon: Compass, labelKey: 'emblems.filters.byContinent', defaultLabel: 'Por Continente', activeClass: 'bg-[#2C3E50] text-white shadow-xs' },
    { id: 'atlas', Icon: Sparkles, labelKey: 'emblems.filters.atlas', defaultLabel: 'Atlas Completo', activeClass: 'bg-slate-900 text-white shadow-xs' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" data-testid="country-emblem-grid">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {filters.map(({ id, Icon, labelKey, defaultLabel, activeClass }) => {
            const isActive = activeFilter === id;
            const countSuffix =
              id === 'discovered'
                ? ` (${discoveredEmblems.length})`
                : id === 'wishlist'
                  ? ` (${wishlistEmblems.length})`
                  : id === 'atlas'
                    ? ` (${discoveredEmblems.length}/195)`
                    : '';
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(id)}
                className={cn(
                  'min-h-[44px] px-4 py-2 rounded-full font-sans text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5',
                  isActive ? activeClass : 'text-slate-600 hover:bg-slate-100',
                )}
                data-testid={`emblem-filter-${id}`}
              >
                <Icon size={14} />
                <span>{t(labelKey, defaultLabel)}{countSuffix}</span>
              </button>
            );
          })}
        </div>
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('emblems.searchPlaceholder', 'Buscar país o código ISO...')}
            className="w-full min-h-[44px] pl-9 pr-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35]"
            data-testid="emblem-search-input"
          />
        </div>
      </div>

      {(activeFilter === 'continent' || activeFilter === 'atlas') && (
        <div className="flex flex-wrap items-center gap-2">
          {CONTINENT_FILTERS.map((cf) => (
            <button
              key={cf.id}
              type="button"
              onClick={() => setSelectedContinent(cf.id)}
              className={cn(
                'min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer',
                selectedContinent === cf.id
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {t(cf.labelKey, cf.defaultLabel)}
            </button>
          ))}
        </div>
      )}

      {visibleEmblems.length === 0 ? (
        <div className="w-full py-8 px-4 flex justify-center">
          <EmptyStateCard
            icon={activeFilter === 'wishlist' ? Bookmark : Globe2}
            accentColor={activeFilter === 'wishlist' ? 'teal' : 'orange'}
            title={
              activeFilter === 'wishlist'
                ? t('emblems.empty.wishlistTitle', 'Tu Wishlist está vacía')
                : t('emblems.empty.discoveredTitle', 'Aún no tienes emblemas en esta vista')
            }
            description={
              activeFilter === 'wishlist'
                ? t('emblems.empty.wishlistDesc', 'Guarda destinos que sueñas visitar para ver sus siluetas cartográficas en Muted Teal.')
                : t('emblems.empty.discoveredDesc', 'Registra tu primera aventura para esculpir y desbloquear el emblema 3D de cada país explorado.')
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleEmblems.map((emblem) => {
            const key = emblem.countryCode || emblem.iso2;
            return (
              <CountryEmblemCard
                key={key}
                emblem={emblem}
                variant="card"
                onSelect={(emb) => setSelectedEmblem(emb)}
              />
            );
          })}
        </div>
      )}
      <CountryEmblemModal
        emblem={selectedEmblem}
        isOpen={Boolean(selectedEmblem)}
        onClose={() => setSelectedEmblem(null)}
        onCreateTripForCountry={onCreateTrip}
      />
    </div>
  );
}