import React from 'react';
import { MapPin, X } from 'lucide-react';
import RouteMap from '../RouteMap';

const VisorRouteLayout = ({
  isMobile,
  styles,
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
        <div style={styles.mobileColumn}>
          {sections.context}
          {sections.timeline}
          <div style={{ marginTop: '32px' }}>{sections.bitacora}</div>
          {sections.gallery}
        </div>

        <button type="button" style={styles.fab} onClick={onOpenMap} aria-label="Ver mapa de ruta">
          <MapPin size={24} />
        </button>

        {showMapModal && (
          <div style={styles.mapModal}>
            <button type="button" style={styles.mapModalClose} onClick={onCloseMap} aria-label="Cerrar mapa">
              <X size={20} />
            </button>
            <RouteMap paradas={paradas} activeIndex={mapSyncIndex || activeParadaIndex} isModal />
          </div>
        )}
      </>
    );
  }

  return (
    <div style={styles.routeLayout}>
      <div style={styles.scrollColumn} id="visor-scroll-column">
        {sections.context}
        {sections.timeline}
        <div style={{ marginTop: '32px' }}>{sections.bitacora}</div>
        {sections.gallery}
      </div>
      <div style={styles.mapColumn}>
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
