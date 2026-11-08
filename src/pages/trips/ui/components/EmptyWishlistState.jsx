import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Plus } from 'lucide-react';
import EmptyStateCard from '@shared/ui/components/EmptyStateCard';

/**
 * EmptyWishlistState — warm, aspirational empty state for the "Mi Wishlist" tab.
 * Delegates all visuals to the canonical <EmptyStateCard /> so every empty state
 * in Keeptrip shares identical geometry, typography and palette (Visual System v2.0).
 */
export default function EmptyWishlistState({ onAdd }) {
  const { t } = useTranslation(['dashboard']);

  return (
    <EmptyStateCard
      icon={Bookmark}
      accentColor="teal"
      title={t('dashboard:wishlist.empty.title', 'Tu bucket list te espera')}
      description={t(
        'dashboard:wishlist.empty.description',
        'Guarda países y ciudades que sueñas visitar. Cuando estés listo, conviértelos en tu próxima aventura.'
      )}
      primaryAction={{
        label: t('dashboard:wishlist.empty.cta', 'Añadir destino'),
        onClick: onAdd,
        icon: Plus,
      }}
    />
  );
}
