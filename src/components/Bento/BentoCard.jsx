import React from 'react';
import { Calendar, MapPin, Trash2 } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS, GLASS, TRANSITIONS } from '../../theme';

const styles = {
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    border: `1px solid ${COLORS.border}`,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: SHADOWS.md,
    transition: TRANSITIONS.normal,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '220px',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.9) 100%)',
    zIndex: 1
  },
  content: {
    position: 'relative',
    zIndex: 2,
    padding: '20px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  flagImg: {
    width: '32px',
    height: '24px',
    borderRadius: RADIUS.xs,
    objectFit: 'cover',
    boxShadow: SHADOWS.sm,
    border: '1px solid rgba(255,255,255,0.3)'
  },
  footer: { marginTop: 'auto' },
  title: { fontSize: '1.3rem', fontWeight: '800', margin: '0 0 8px 0', lineHeight: 1.1 },
  meta: { display: 'flex', gap: '12px', fontSize: '0.85rem', fontWeight: '600', alignItems: 'center' },
  deleteBtn: {
    ...GLASS.dark,
    border: 'none',
    borderRadius: RADIUS.full,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    transition: TRANSITIONS.fast,
    ':hover': { background: COLORS.danger }
  }
};

const BentoCard = ({ viaje, onClick, manejarEliminar }) => {
  const foto = viaje.foto;
  const titulo = viaje.titulo || viaje.nombreEspanol;
  const banderas = viaje.banderas && viaje.banderas.length > 0 ? viaje.banderas : [];

  const onDelete = (event) => {
    event.stopPropagation();
    manejarEliminar(viaje.id);
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        backgroundImage: foto ? `url(${foto})` : 'none',
        backgroundColor: foto ? 'transparent' : 'white'
      }}
    >
      {foto && <div style={styles.overlay} />}

      <div style={styles.content}>
        <div style={styles.topRow}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {banderas.slice(0, 3).map((bandera, index) => (
              <img key={index} src={bandera} alt="flag" style={styles.flagImg} onError={(e) => { e.target.style.display = 'none'; }} />
            ))}
            {banderas.length > 3 && <span style={{ color: 'white', fontWeight: 'bold', textShadow: '0 2px 2px black' }}>+{banderas.length - 3}</span>}
          </div>

          <button style={styles.deleteBtn} onClick={onDelete} title="Eliminar viaje">
            <Trash2 size={16} />
          </button>
        </div>

        <div style={styles.footer}>
          <h3 style={{ ...styles.title, color: foto ? 'white' : COLORS.charcoalBlue, textShadow: foto ? '0 2px 10px rgba(0,0,0,0.5)' : 'none' }}>
            {titulo}
          </h3>
          <div style={{ ...styles.meta, color: foto ? 'rgba(255,255,255,0.9)' : COLORS.textSecondary }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {viaje.fechaInicio?.split('-')[0]}</span>
            {viaje.ciudades && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {viaje.ciudades.split(',').length}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoCard;
