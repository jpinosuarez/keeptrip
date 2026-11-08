import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import {
  groupWishlistByCountry,
  matchesWishlistQuery,
} from '@shared/lib/wishlist/wishlistUtils';
import WishlistCountryCard from './WishlistCountryCard';
import EmptyWishlistState from './EmptyWishlistState';

/**
 * WishlistView — body of the "Mi Wishlist" tab.
 *
 * Lightweight by design (Block 2.5 final simplification):
 * - The search input is a PURE in-memory filter over saved destinations.
 * - External destination discovery (Mapbox geocoding) is the sole
 *   responsibility of SearchPalette (single authority) — no inline dropdown.
 * - When the wishlist is empty we render ONLY the centered empty-state card
 *   (no search bar at all).
 */
const WishlistView = ({
  items = [],
  onDeleteCountry,
  onDeleteItem,
  onCreateTrip,
  onAddDestination,
}) => {
  const { t } = useTranslation('dashboard');
  const [query, setQuery] = useState('');

  const hasItems = Array.isArray(items) && items.length > 0;

  const groups = useMemo(() => {
    const filtered = (Array.isArray(items) ? items : []).filter((item) =>
      matchesWishlistQuery(item, query)
    );
    return groupWishlistByCountry(filtered);
  }, [items, query]);

  // EMPTY — only the centered empty-state card, no search bar.
  if (!hasItems) {
    return (
      <div className="flex w-full justify-center px-4 py-8">
        <EmptyWishlistState onAdd={onAddDestination} />
      </div>
    );
  }

  // POPULATED — local filter bar + grid (or no-results fallback).
  return (
    <div className="flex flex-col w-full">
      <div className="mb-6 flex w-full min-w-[240px] sm:w-[380px] shrink-0 items-center gap-2.5 rounded-full border border-slate-200/90 bg-white px-4 py-2.5 shadow-2xs focus-within:border-[#45B0A8] focus-within:ring-2 focus-within:ring-[#45B0A8]/20 transition-all">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('dashboard:wishlist.searchPlaceholder', 'Filtrar destinos guardados...')}
          aria-label={t('dashboard:wishlist.searchAria', 'Buscar en tu Wishlist')}
          className="w-full min-w-[160px] flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('dashboard:wishlist.clear', 'Limpiar filtro')}
            title={t('dashboard:wishlist.clear', 'Limpiar filtro')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {query.trim().length > 0 && groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Search className="text-[#45B0A8]/60 mb-1" size={28} />
          <p className="text-sm text-slate-500 m-0">
            No tienes destinos que coincidan con <strong className="text-slate-800">"{query}"</strong>
          </p>
          <button
            type="button"
            onClick={() => onAddDestination?.(query)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF6B35] hover:underline cursor-pointer"
          >
            <span>{t('dashboard:wishlist.noMatchesCta', 'Buscar en el mapa para añadirlo')}</span>
            <span>→</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => (
            <WishlistCountryCard
              key={group.paisCodigo}
              group={group}
              onDeleteCountry={onDeleteCountry}
              onDeleteItem={onDeleteItem}
              onCreateTrip={onCreateTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistView;
