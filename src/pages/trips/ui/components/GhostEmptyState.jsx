import React from 'react';
import { Globe, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUI } from '@app/providers/UIContext';
import EmptyStateCard from '@shared/ui/components/EmptyStateCard';

/**
 * GhostEmptyState — first-run archive empty state. Cleanly consumes the canonical
 * <EmptyStateCard /> inside a centered full-width wrapper. Because it renders as
 * <GhostEmptyState /> (no props) in some callers, it accepts an optional
 * onCreateTrip and falls back to opening the global search palette.
 */
export default function GhostEmptyState({ onCreateTrip }) {
  const { t } = useTranslation('dashboard');
  const { openBuscador } = useUI();
  const handleCreate = onCreateTrip || openBuscador;

  return (
    <div className="w-full py-8 px-4 flex justify-center" data-testid="ghost-empty-state">
      <EmptyStateCard
        icon={Globe}
        accentColor="orange"
        title={t('welcome.emptyStateTitle', 'El Comienzo de tu Legado')}
        description={t('welcome.recentPlaceholder', 'Tus aventuras recientes aparecerán aquí')}
        primaryAction={{
          label: t('welcome.createTrip', 'Crear viaje'),
          onClick: handleCreate,
          icon: Plus,
        }}
      />
    </div>
  );
}
