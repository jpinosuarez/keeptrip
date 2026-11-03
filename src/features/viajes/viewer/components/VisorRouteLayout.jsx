import React from 'react';
import RouteMap from '../RouteMap';

/**
 * Natural-flow editorial route layout (Block 2.1).
 * NO sticky split-screen: the country-framed map and the story sections
 * scroll together with the page.
 */
const VisorRouteLayout = ({
  paradas = [],
  countryCodes = [],
  paisCodigo = null,
  activeParadaIndex,
  mapSyncIndex,
  hoveredIndex,
  hoveredStopId = null,
  onMarkerHover,
  onMarkerHoverEnd,
  onMarkerClick,
  sections,
}) => (
  <div className="max-w-[960px] mx-auto w-full px-4 md:px-6 py-6 flex flex-col gap-y-10">
    {sections.context}

    <div className="h-[340px] md:h-[440px] w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm">
      <RouteMap
        paradas={paradas}
        countryCodes={countryCodes}
        paisCodigo={paisCodigo}
        activeIndex={mapSyncIndex !== undefined ? mapSyncIndex : activeParadaIndex}
        hoveredIndex={hoveredIndex}
        hoveredStopId={hoveredStopId}
        onMarkerHover={onMarkerHover}
        onMarkerHoverEnd={onMarkerHoverEnd}
        onMarkerClick={onMarkerClick}
      />
    </div>

    {sections.timeline}
    {sections.bitacora}
    {sections.gallery}
  </div>
);

export default VisorRouteLayout;

