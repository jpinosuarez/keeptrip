import React from 'react';
import MiniMapaRuta from '@shared/ui/components/MiniMapaRuta';
import ContextCard from '../ContextCard';

const VisorDestinoLayout = ({ isMobile, styles, paradas, sections }) => {
  return (
    <div style={styles.destinoBody(isMobile)}>
      {sections.context}

      {paradas.length === 1 && (
        <div style={{ marginBottom: '24px' }}>
          <ContextCard icon="📍" label="Ubicacion" style={{ gridColumn: 'span 2' }}>
            <MiniMapaRuta paradas={paradas} />
          </ContextCard>
        </div>
      )}

      {sections.bitacora}
      {sections.gallery}
    </div>
  );
};

export default VisorDestinoLayout;
