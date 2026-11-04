import React from 'react';
import { MapPin, Sparkles, Camera } from 'lucide-react';
import { cn } from '@shared/lib/utils/cn';

/**
 * EditorTabBar — sleek, direct-access 3-tab switcher.
 * Active tab uses the Atomic Tangerine brand accent; touch targets >= 44px and
 * no horizontal overflow (labels truncate on 360px viewports).
 *
 * @param {{ t: (k: string, d?: string, o?: object) => string, activeTab: string, onChange: (tab: string) => void, stopsCount?: number, photosCount?: number }} props
 */
const EditorTabBar = ({ t, activeTab, onChange, stopsCount = 0, photosCount = 0 }) => {
  const tabs = [
    { id: 'route', Icon: MapPin, label: t('tabs.route', 'Ruta y Paradas'), count: stopsCount },
    { id: 'essence', Icon: Sparkles, label: t('tabs.essence', 'Esencia y Destacados') },
    { id: 'gallery', Icon: Camera, label: t('tabs.gallery', 'Fotos y Galería'), count: photosCount },
  ];

  return (
    <div
      role="tablist"
      aria-label={t('tabs.ariaLabel', 'Editor sections')}
      className="sticky top-0 z-10 grid grid-cols-3 gap-1 bg-surface border-b border-border px-2 py-2"
    >
      {tabs.map(({ id, Icon, label, count }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'min-h-[44px] min-w-0 flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[0.72rem] font-bold transition-all',
              active
                ? 'bg-atomicTangerine/10 text-atomicTangerine'
                : 'text-textSecondary hover:bg-background'
            )}
          >
            <Icon size={15} className="shrink-0" />
            <span className="truncate">
              {label}
              {typeof count === 'number' ? ` (${count})` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default EditorTabBar;
