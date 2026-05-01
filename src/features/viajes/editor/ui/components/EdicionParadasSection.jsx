import React from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { COLORS } from '@shared/config';
import CityManager from './CityManager';

const EdicionParadasSection = ({
  styles,
  t,
  paradas,
  setParadas,
  fechaRangoDisplay,
  tripStartDate,
  sinParadas,
  isReadOnlyMode = false,
}) => {
  return (
    <div style={styles.section}>
      <label style={styles.label}>
        <Calendar size={14} /> {t('labels.paradas')}
      </label>
      {fechaRangoDisplay && (
        <span style={{ fontSize: '0.82rem', color: COLORS.textSecondary, marginBottom: 6, display: 'block' }}>
          {`📅 ${fechaRangoDisplay}`}
        </span>
      )}
      <CityManager t={t} paradas={paradas} setParadas={setParadas} tripStartDate={tripStartDate} isReadOnlyMode={isReadOnlyMode} />
      {sinParadas && (
        <div
          style={{
            marginTop: 16,
            padding: '32px 24px',
            borderRadius: 16,
            border: `2px dashed ${COLORS.border}`,
            background: COLORS.background,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 12,
          }}
          role="status"
          aria-live="polite"
        >
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 12,
            background: 'rgba(255, 107, 53, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MapPin size={32} color={COLORS.atomicTangerine} strokeWidth={1.5} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: COLORS.charcoalBlue,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              {t('labels.emptyStopsTitle', 'Tu ruta está vacía')}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              color: COLORS.textSecondary,
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '280px',
            }}>
              {t('labels.emptyStopsDescription', 'Agrega tu primer destino usando la barra de búsqueda arriba para comenzar.')}
            </p>
          </div>
          <div style={{
            marginTop: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: COLORS.atomicTangerine,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {t('labels.emptyStopsHint', 'Necesitas al menos 1 parada para guardar')}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdicionParadasSection;
