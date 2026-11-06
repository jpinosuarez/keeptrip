import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Plus } from 'lucide-react';
import { useAuth, useSearch, useUI, useToast } from '@app/providers';
import { ENABLE_TRIPS_LIST_VIEW, ENABLE_WISHLIST } from '@shared/config';
import { cn } from '@shared/lib/utils/cn';
import {
  COUNTRIES_DATA,
  getFlagUrl,
  normalizeCountryCode,
  getCountryCentroid,
} from '@shared/lib/utils/countryUtils';
import { normalizeWishlistItem } from '@shared/lib/wishlist/wishlistUtils';
import TripGrid from '@widgets/tripGrid/TripGrid';
import TripListView from '@widgets/tripGrid/ui/TripListView';
import {
  applyTripFilters,
  buildCountryOptions,
  buildYearOptions,
} from '@widgets/tripGrid/lib/tripFilters';
import TripCommandBar from './components/TripCommandBar';
import WishlistView from './components/WishlistView';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useLogStats } from '@features/gamification/model';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const VIEW_MODE_KEY = 'keeptrip_trips_view_mode';

const getInitialViewMode = () => {
  if (typeof window === 'undefined') return 'grid';
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const TripsPage = () => {
  const { t, i18n } = useTranslation(['dashboard', 'countries', 'nav']);
  useDocumentTitle(t('nav:pageTitle.journal'));

  const { data, crud } = useOutletContext();
  const { userProfile, eliminarDeWishlist } = useAuth();
  const { busqueda, limpiarBusqueda } = useSearch();
  const { openBuscador, setViajeBorrador, setCiudadInicialBorrador } = useUI();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  // Block 2.5 — "Mis Viajes" vs "Mi Wishlist" segmented view switcher.
  const [activeTab, setActiveTab] = useState('trips');
  const [wishlistQuery, setWishlistQuery] = useState('');

  const [filters, setFilters] = useState(() => ({
    viewMode: getInitialViewMode(),
    year: 'all',
    country: 'all',
    scope: 'all',
    duration: 'all',
    curation: 'all',
    companion: 'all',
    sort: 'recent',
  }));

  const trips = useMemo(() => data.bitacora ?? [], [data.bitacora]);
  const tripData = useMemo(() => data.bitacoraData ?? {}, [data.bitacoraData]);

  // Block 2.5 — normalized wishlist items (stored on the user profile).
  const wishlistItems = useMemo(() => {
    const raw = Array.isArray(userProfile?.wishlist) ? userProfile.wishlist : [];
    return raw.map(normalizeWishlistItem).filter(Boolean);
  }, [userProfile]);

  const handleRemoveWishlistGroup = useCallback(async (group) => {
    const ids = (group?.items || []).map((entry) => entry.id).filter(Boolean);
    if (ids.length === 0) return;
    const name = group?.paisNombre || group?.paisCodigo || '';
    await eliminarDeWishlist?.(ids);
    pushToast(
      t('wishlist.removed', { name, defaultValue: `${name} eliminado de tu Wishlist` }),
      'success'
    );
  }, [eliminarDeWishlist, pushToast, t]);

  const handleCreateTripFromWishlist = useCallback((group) => {
    const code = normalizeCountryCode(group?.paisCodigo) || group?.paisCodigo || '';
    const countryInfo = COUNTRIES_DATA.find((country) => country.code === code);
    const coords =
      group?.items?.find((entry) => Array.isArray(entry.coordenadas))?.coordenadas ||
      getCountryCentroid(code) ||
      null;
    const countryName = countryInfo?.name || group?.paisNombre || code;
    const cityItem = group?.ciudades?.[0] || null;
    const today = new Date().toISOString().split('T')[0];

    setViajeBorrador({
      id: 'new',
      code,
      nombreEspanol: countryName,
      flag: getFlagUrl(code),
      continente: 'Mundo',
      titulo: '',
      fechaInicio: today,
      fechaFin: today,
      foto: null,
      latlng: coords,
      coordenadas: coords,
      vibe: [],
      highlights: { topFood: '', topView: '', topTip: '' },
      companions: [],
      texto: '',
      presupuesto: null,
    });
    setCiudadInicialBorrador({
      nombre: cityItem?.nombre || countryName,
      coordenadas: cityItem?.coordenadas || coords || [0, 0],
      fecha: today,
      paisCodigo: code,
      flag: getFlagUrl(code),
      _selectionId: `${Date.now()}`,
    });
    navigate('/trips?new=true');
  }, [setViajeBorrador, setCiudadInicialBorrador, navigate]);

  const handleFiltersChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      year: 'all',
      country: 'all',
      scope: 'all',
      duration: 'all',
      curation: 'all',
      companion: 'all',
      sort: 'recent',
    }));
    limpiarBusqueda();
  }, [limpiarBusqueda]);

  // Persist the dual-view preference (default: grid for first-time visitors).
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, filters.viewMode);
    } catch {
      // Private mode / storage disabled — preference simply not persisted.
    }
  }, [filters.viewMode]);

  const filteredTrips = useMemo(
    () =>
      applyTripFilters({
        trips,
        tripData,
        searchQuery: busqueda,
        year: filters.year,
        country: filters.country,
        scope: filters.scope,
        duration: filters.duration,
        curation: filters.curation,
        companion: filters.companion,
        sort: filters.sort,
        userProfile,
        i18nLang: i18n.language,
      }),
    [trips, tripData, busqueda, filters, userProfile, i18n.language]
  );

  const countryOptions = useMemo(
    () => buildCountryOptions(trips, tripData, i18n.language),
    [trips, tripData, i18n.language]
  );
  const yearOptions = useMemo(() => buildYearOptions(trips, tripData), [trips, tripData]);

  const tripsLogStats = useLogStats(trips, tripData);
  const searchTerm = busqueda.trim().toLowerCase();
  const isListView = ENABLE_TRIPS_LIST_VIEW && filters.viewMode === 'list';

  return (
    <div className="flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
      {/* Block 2.5 — Segmented view switcher: Trips | Wishlist */}
      {ENABLE_WISHLIST && (
        <div className="flex items-center gap-2 mb-4" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'trips'}
            onClick={() => setActiveTab('trips')}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold border transition-colors cursor-pointer font-heading',
              activeTab === 'trips'
                ? 'bg-[#FF6B35]/10 border-[#FF6B35] text-[#FF6B35]'
                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
            )}
          >
            🌍 {t('wishlist.tabTrips', 'Viajes Realizados')} ({trips.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wishlist'}
            onClick={() => setActiveTab('wishlist')}
            className={cn(
              'inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full text-sm font-bold border transition-colors cursor-pointer font-heading',
              activeTab === 'wishlist'
                ? 'bg-[#45B0A8]/15 border-[#45B0A8] text-[#2C3E50]'
                : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-slate-50'
            )}
          >
            🔖 {t('wishlist.tabWishlist', 'Mi Wishlist')} ({wishlistItems.length})
          </button>
        </div>
      )}

      {activeTab === 'trips' ? (
        <>
          {/* 1. Global Travel Stats Summary Widget (above the filter controls) */}
          {trips.length > 0 && (
            <div className="w-full mb-6">
              <TravelStatsWidget
                logStats={tripsLogStats}
                ariaLabel={t('stats.tripSummary')}
                containerClassName="w-full"
              />
            </div>
          )}

          {/* 2. Single search authority + 5D filters + view switcher */}
          <div className="mb-3">
            <TripCommandBar
              filters={filters}
              onChange={handleFiltersChange}
              countryOptions={countryOptions}
              yearOptions={yearOptions}
              resultCount={filteredTrips.length}
              totalCount={trips.length}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* 3. Dual view: Grid (untouched) | List (Year headers + rows) */}
          <div className="flex-1 flex flex-col pb-0 md:pb-0 max-md:pb-[max(env(safe-area-inset-bottom),20px)]">
            {isListView ? (
              <TripListView
                trips={filteredTrips}
                tripData={tripData}
                crud={crud}
                userProfile={userProfile}
                sort={filters.sort}
                totalTripsCount={trips.length}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <TripGrid
                trips={filteredTrips}
                tripData={tripData}
                totalLogCount={trips.length}
                handleDelete={crud.solicitarEliminarViaje}
                isDeletingTrip={crud.isDeletingViaje}
                searchTerm={searchTerm}
              />
            )}
          </div>
        </>
      ) : (
        /* Block 2.5 — Wishlist view (no stats, no trip filters) */
        <div className="flex-1 flex flex-col">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-3 rounded-full bg-white border border-[#E2E8F0] min-h-[44px]">
              <Search size={16} className="text-[#45B0A8] shrink-0" />
              <input
                type="text"
                value={wishlistQuery}
                onChange={(e) => setWishlistQuery(e.target.value)}
                placeholder={t('wishlist.searchPlaceholder', 'Buscar y añadir a tu Wishlist…')}
                aria-label={t('wishlist.searchAria', 'Buscar en tu Wishlist')}
                className="flex-1 min-w-0 border-none outline-none bg-transparent text-sm text-[#1E293B]"
              />
            </div>
            <button
              type="button"
              onClick={openBuscador}
              aria-label={t('wishlist.addDestination', 'Añadir destino')}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full bg-[#FF6B35] text-white font-bold border-none cursor-pointer shrink-0 shadow-[0_6px_20px_rgba(255,107,53,0.35)] font-heading"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('wishlist.addDestination', 'Añadir destino')}</span>
            </button>
          </div>
          <WishlistView
            items={wishlistItems}
            query={wishlistQuery}
            onRemove={handleRemoveWishlistGroup}
            onCreateTrip={handleCreateTripFromWishlist}
            onAddDestination={openBuscador}
          />
        </div>
      )}

      {/* Nested route modal support */}
      <Outlet />
    </div>
  );
};

export default TripsPage;
