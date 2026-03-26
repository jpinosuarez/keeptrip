import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { COLORS, RADIUS } from '@shared/config';
import BottomSheet from '@shared/ui/components/BottomSheet/BottomSheet';

const TripSlideOver = ({ isOpen, onClose, trip }) => {
  const navigate = useNavigate();

  const openTripEditor = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('editing', trip.id);
    navigate({ pathname: '/trips', search: params.toString() });
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} zIndex={100} ariaLabel="Detalles del viaje">
      {trip && (
        <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            width: '100%',
            height: '180px',
            borderRadius: RADIUS.lg,
            backgroundImage: trip.foto ? `url(${trip.foto})` : 'none',
            backgroundColor: trip.foto ? 'transparent' : COLORS.mutedTeal,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '4px'
            }}>
              {(trip.banderas || trip.flags || (trip.flag ? [trip.flag] : [])).slice(0, 3).map((flag, idx) => (
                 <img key={idx} src={flag} alt="Bandera" style={{ width: 28, height: 20, borderRadius: RADIUS.xs, objectFit: 'cover' }} />
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: 800, color: COLORS.charcoalBlue }}>
              {trip.titulo || trip.nombreEspanol || trip.nameSpanish}
            </h2>
            <div style={{ display: 'flex', gap: '12px', color: COLORS.textSecondary, fontSize: '0.9rem', fontWeight: 600 }}>
              {(trip.fechaInicio || trip.startDate) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {trip.fechaInicio || trip.startDate}
                </span>
              )}
              {trip.ciudades && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} /> {trip.ciudades.split(',')[0]}
                </span>
              )}
            </div>
          </div>

          <button
            className="tap-btn"
            onClick={() => {
              onClose();
              openTripEditor();
            }}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '16px',
              backgroundColor: COLORS.atomicTangerine,
              color: '#fff',
              border: 'none',
              borderRadius: RADIUS.md,
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            Abrir Bitacora <ArrowRight size={18} />
          </button>
        </div>
      )}
    </BottomSheet>
  );
};

export default React.memo(TripSlideOver);
