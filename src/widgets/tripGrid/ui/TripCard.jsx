import React, { useRef } from 'react';
import { motion as Motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Compass, Calendar, MapPin, Trash2 } from 'lucide-react';
import { tripStyles as styles } from './TripCard.styles';

/**
 * Cinematic TripCard (2026 Restyle)
 * Features full-bleed images, floating glass pills, and 3D parallax on desktop hovering.
 */
const TripCard = ({ trip, onClick, onDelete, isMobile = false, variant = 'list' }) => {
  const flags = trip.banderas || trip.flags || (trip.flag ? [trip.flag] : []);
  const coverUrl = trip.foto || '';

  // 3D Parallax logic (Desktop Only)
  const cardRef = useRef(null);
  const x = useMotionValue(0.5); 
  const y = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Tilt transforms
  const rotateX = useTransform(springY, [0, 1], [6, -6]);
  const rotateY = useTransform(springX, [0, 1], [-6, 6]);
  
  // Background Parallax
  const bgX = useTransform(springX, [0, 1], ['-3%', '3%']);
  const bgY = useTransform(springY, [0, 1], ['-3%', '3%']);

  const handleMouseMove = (e) => {
    if (isMobile) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width);
    y.set(mouseY / rect.height);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <Motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={trip.titulo || trip.nombreEspanol || 'Ver viaje'}
      style={{
        ...styles.cardBase(isMobile, variant),
        perspective: 1000,
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        willChange: 'transform' // Performance constraint
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={!isMobile ? { scale: 1.02, zIndex: 10 } : {}}
      whileTap={{ scale: 0.96 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={styles.bgWrapper}>
        <Motion.div 
          style={{
            ...styles.bgImage(coverUrl),
            x: isMobile ? 0 : bgX,
            y: isMobile ? 0 : bgY
          }} 
        />
        <div style={styles.overlay} />
      </div>
      
      <div style={styles.topContent}>
        <div style={styles.flagsRow}>
          {flags.length > 0 ? (
            flags.slice(0, 3).map((flag, idx) => (
              <img key={idx} src={flag} alt="Bandera" style={styles.flagImg} loading="lazy" />
            ))
          ) : (
             <div style={styles.glassPill}>
                 <Compass size={14} color="white" />
             </div>
          )}
          
          {onDelete && (
            <button
              className="tap-icon"
              style={styles.actionBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip.id);
              }}
              aria-label="Eliminar Viaje"
            >
              <Trash2 size={16} color="white" />
            </button>
          )}
        </div>
      </div>

      <div style={styles.bottomContent}>
        <h4 style={styles.title}>{trip.titulo || trip.nombreEspanol || trip.nameSpanish}</h4>
        <div style={styles.metaRow}>
          {(trip.fechaInicio || trip.startDate) && (
            <span style={styles.glassPill}>
              <Calendar size={12} /> {trip.fechaInicio || trip.startDate}
            </span>
          )}
          {trip.ciudades && (
            <span style={styles.glassPill}>
              <MapPin size={12} /> {trip.ciudades.split(',')[0]}
            </span>
          )}
        </div>
      </div>
    </Motion.div>
  );
};

export default TripCard;
