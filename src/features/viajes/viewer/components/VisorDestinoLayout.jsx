import { cn } from '@shared/lib/utils/cn';
import React, { Suspense } from 'react';
import ContextCard from '../ContextCard';

const mapPreviewFallback = (
  <div
    className="w-full h-[300px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-50 border border-slate-400/35"
    aria-hidden="true"
  />
);

const VisorDestinoLayout = ({ isMobile, paradas, sections, MapRoutePreview }) => {
  return (
    <div className={cn(
      "max-w-[800px] mx-auto w-full flex flex-col",
      isMobile ? "px-4 py-5" : "p-10"
    )}>
      {sections.context}

      {paradas.length === 1 && (
        <div className="mb-6">
          <ContextCard icon="📍" label="Ubicacion" className="col-span-2">
            {MapRoutePreview ? (
              <Suspense fallback={mapPreviewFallback}>
                <MapRoutePreview paradas={paradas} />
              </Suspense>
            ) : null}
          </ContextCard>
        </div>
      )}

      {sections.bitacora}
      {sections.gallery}
    </div>
  );
};

export default VisorDestinoLayout;
