import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { MapPin, X } from 'lucide-react';
import RouteMap from '../RouteMap';

const VisorRouteLayout = ({
  isMobile,
  paradas,
  activeParadaIndex,
  mapSyncIndex,
  hoveredIndex,
  onMarkerHover,
  onMarkerHoverEnd,
  onMarkerClick,
  showMapModal,
  onOpenMap,
  onCloseMap,
  sections,
}) => {
  if (isMobile) {
    return (
      <>
        <div className="max-w-full px-5 pt-6 pb-[calc(100px+env(safe-area-inset-bottom,0px))] flex flex-col">
          {sections.context}
          {sections.timeline}
          <div className="mt-8">{sections.bitacora}</div>
          {sections.gallery}
        </div>

        <button 
          type="button" 
          className="fixed bottom-[max(24px,env(safe-area-inset-bottom,0px))] right-[max(24px,env(safe-area-inset-right,0px))] w-14 h-14 rounded-full bg-atomicTangerine text-white border-none flex items-center justify-center shadow-lg cursor-pointer z-[30] transition-all" 
          onClick={onOpenMap} 
          aria-label="Ver mapa de ruta"
        >
          <MapPin size={24} />
        </button>

        {showMapModal && (
          <div className="fixed inset-0 z-[10001] bg-charcoalBlue flex flex-col">
            <button 
              type="button" 
              className="absolute top-4 left-4 z-10 backdrop-blur-md bg-black/40 border border-white/20 rounded-full w-11 h-11 flex items-center justify-center text-white cursor-pointer transition-all" 
              onClick={onCloseMap} 
              aria-label="Cerrar mapa"
            >
              <X size={20} />
            </button>
            <RouteMap paradas={paradas} activeIndex={mapSyncIndex || activeParadaIndex} isModal />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0 max-w-full m-0 min-h-[calc(100vh-50vh)]">
      <div className="overflow-y-auto max-h-[calc(100vh-60px)] p-10 flex flex-col" id="visor-scroll-column">
        {sections.context}
        {sections.timeline}
        <div className="mt-8">{sections.bitacora}</div>
        {sections.gallery}
      </div>
      <div className="sticky top-0 h-screen p-4">
        <RouteMap
          paradas={paradas}
          activeIndex={mapSyncIndex !== undefined ? mapSyncIndex : activeParadaIndex}
          hoveredIndex={hoveredIndex}
          onMarkerHover={onMarkerHover}
          onMarkerHoverEnd={onMarkerHoverEnd}
          onMarkerClick={onMarkerClick}
        />
      </div>
    </div>
  );
};

export default VisorRouteLayout;
