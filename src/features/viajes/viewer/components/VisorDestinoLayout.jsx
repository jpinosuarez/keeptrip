import React, { Suspense } from 'react';
import ContextCard from '../ContextCard';

const mapPreviewFallback = (
  <div
    style={{
      width: '100%',
      height: '300px',
      borderRadius: '16px',
      background: 'linear-gradient(145deg, #e2e8f0 0%, #f8fafc 100%)',
      border: '1px solid rgba(148, 163, 184, 0.35)',
    }}
    aria-hidden="true"
  />
);

const VisorDestinoLayout = ({ isMobile, styles, paradas, sections, MapRoutePreview }) => {
  return (
    <div style={styles.destinoBody(isMobile)}>
      {sections.context}

      {paradas.length === 1 && (
        <div style={{ marginBottom: '24px' }}>
          <ContextCard icon="📍" label="Ubicacion" style={{ gridColumn: 'span 2' }}>
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
