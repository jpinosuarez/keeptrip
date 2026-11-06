import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import {
  groupWishlistByCountry,
  matchesWishlistQuery,
} from '@shared/lib/wishlist/wishlistUtils';
import WishlistCountryCard from './WishlistCountryCard';
import EmptyWishlistState from './EmptyWishlistState';

/**
 * WishlistView — the body of the "Mi Wishlist" tab.
 * Filters + groups saved destinations by country into an editorial Bento grid.
 */
const WishlistView = ({
  items = [],
  query = '',
  onRemove,
  onCreateTrip,
  onAddDestination,
}) => {
  const { t } = useTranslation('dashboard');

  const groups = useMemo(() => {
    const filtered = (Array.isArray(items) ? items : []).filter((item) =>
      matchesWishlistQuery(item, query)
    );
    return groupWishlistByCountry(filtered);
  }, [items, query]);

  if (!Array.isArray(items) || items.length === 0) {
    return <EmptyWishlistState onAdd={onAddDestination} />;
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-[#64748B]">
        <Search size={28} className="text-[#45B0A8]" />
        <p className="m-0 text-sm font-medium">
          {t('wishlist.noResults', 'No hay destinos que coincidan con tu búsqueda.')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {groups.map((group) => (
        <WishlistCountryCard
          key={group.paisCodigo}
          group={group}
          onRemove={onRemove}
          onCreateTrip={onCreateTrip}
        />
      ))}
    </div>
  );
};

export default WishlistView;
