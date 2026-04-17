import React, { useRef, useState, useEffect } from 'react';
import { motion as Motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Compass, Calendar, MapPin, Trash2, Clock, MoreVertical, Edit2, Share2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tripStyles as styles } from './TripCard.styles';
import {
  FOTO_DEFAULT_URL,
  formatStorytellingDate,
  formatCitiesSummary,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

const getAuraGridStyle = (count) => {
  if (count <= 1) {
    return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
  }

  if (count === 2) {
    return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' };
  }

  return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
};

const getAuraFlagStyle = (count, index) => {
  if (count === 3 && index === 2) {
    return { gridColumn: '1 / span 2' };
  }

  return null;
};

/**
 * Cinematic TripCard (2026 Restyle)
 * Features full-bleed images, floating glass pills, and 3D parallax on desktop hovering.
 */
const TripCard = ({ trip, onClick, onEdit, onShare, onDuplicate, onDelete, isMobile = false, variant = 'list', priorityImage = false }) => {
  const { t, i18n } = useTranslation(['countries', 'dashboard', 'common']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const flags =
    (Array.isArray(trip.banderas) && trip.banderas.filter(Boolean).length > 0 && trip.banderas.filter(Boolean)) ||
    (Array.isArray(trip.flags) && trip.flags.filter(Boolean).length > 0 && trip.flags.filter(Boolean)) ||
    (trip.flag ? [trip.flag] : []);
  const auraFlags = (flags.length > 0 ? flags : [FOTO_DEFAULT_URL]).slice(0, 4);
  const auraGridStyle = getAuraGridStyle(auraFlags.length);
  const coverUrl = trip.foto || '';
  const isDefaultPhoto = !coverUrl || coverUrl === FOTO_DEFAULT_URL;

  const startDate = trip.fechaInicio || trip.startDate || trip.date || null;
  const endDate = trip.fechaFin || trip.endDate || null;
  const parsedCities = String(trip.ciudades || '')
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean)
    .map((city) => ({ nombre: city }));
  const paradas = Array.isArray(trip.paradas) && trip.paradas.length > 0 ? trip.paradas : parsedCities;

  const datePillText = formatStorytellingDate(startDate, endDate, i18n.language) || '—';
  const citiesPillText = formatCitiesSummary(paradas, t) || '—';
  const daysCount = calculateTripDays(startDate, endDate);
  const durationPillText = daysCount
    ? t('days', {
        ns: 'common',
        count: daysCount,
        defaultValue: `${daysCount} days`,
      })
    : '—';

  const countryCode = trip.paisCodigo || trip.code || trip.countryCode || null;
  const localizedCountryName = getLocalizedCountryName(countryCode, i18n.language, t);
  const defaultTitle = localizedCountryName || trip.nombreEspanol || trip.nameSpanish || '';
  const title = trip.titulo || defaultTitle;
  const cardAriaLabel = title || t('viewTrip', { ns: 'dashboard', defaultValue: 'Ver viaje' });

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
      data-testid={`trip-card-${trip.id}`}
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={cardAriaLabel}
      style={{
        ...styles.cardBase(isMobile, variant),
        perspective: 1000,
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        willChange: 'transform' // Performance constraint
      }}
      initial={priorityImage ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={!isMobile && !isMenuOpen ? { scale: 1.02, zIndex: 10 } : {}}
      whileTap={{ scale: 0.96 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={styles.bgWrapper}>
        <Motion.div 
          style={{
            ...styles.bgImageHolder,
            x: isMobile ? 0 : bgX,
            y: isMobile ? 0 : bgY
          }} 
        >
          {!isDefaultPhoto ? (
            <img 
              src={coverUrl} 
              alt={title || t('tripCoverAlt', { ns: 'dashboard', defaultValue: 'Portada del viaje' })} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              loading={priorityImage ? "eager" : "lazy"}
              fetchPriority={priorityImage ? "high" : undefined}
            />
          ) : (
            <div style={styles.fallbackAuraContainer} aria-hidden="true">
              <div style={{ ...styles.fallbackAuraTrack, ...auraGridStyle }}>
                {auraFlags.map((flag, idx) => (
                  <img
                    key={`${flag}-${idx}`}
                    src={flag}
                    alt=""
                    style={{ ...styles.fallbackAuraFlag, ...getAuraFlagStyle(auraFlags.length, idx) }}
                    loading={priorityImage ? "eager" : "lazy"}
                  />
                ))}
              </div>
              <div style={styles.fallbackAuraOverlay} />
            </div>
          )}
        </Motion.div>
        <div style={styles.overlay} />
      </div>
      
      <div style={styles.topContent}>
        <div style={styles.flagsRow}>
          {flags.length > 0 ? (
            flags.map((flag, idx) => (
              <img key={idx} src={flag} alt="Bandera" style={styles.flagImg} loading={priorityImage ? "eager" : "lazy"} />
            ))
          ) : (
             <div style={styles.glassPill}>
                 <Compass size={14} color="white" />
             </div>
          )}
          
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              className="tap-icon"
              style={{
                ...styles.actionBtn,
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)')}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="Abrir opciones de viaje"
            >
              <MoreVertical size={20} color="white" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <Motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '52px',
                    right: 0,
                    width: '180px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.07)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent bubble up to Immersive Viewer
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onEdit) onEdit(trip.id);
                      if (onClick) onClick(); // Fallback temporal si no se provee onEdit
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Edit2 size={16} /> <span>✏️ Editar viaje</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onShare) onShare(trip.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Share2 size={16} /> <span>🔗 Compartir ruta</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onDuplicate) onDuplicate(trip);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Copy size={16} /> <span>📋 Duplicar</span>
                  </button>

                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 0' }} />

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsMenuOpen(false);
                        onDelete(trip.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#EF4444',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={16} /> <span>🗑️ Eliminar</span>
                    </button>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>    e.stopPropagation();
                e.preventDefault();
                setIsMenuOpen((prev) => !prev);
              }}
              aria-label="Abrir opciones de viaje"
            >
              <MoreVertical size={20} color="white" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <Motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '52px',
                    right: 0,
                    width: '180px',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.07)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 50,
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent bubble up to Immersive Viewer
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onEdit) onEdit(trip.id);
                      if (onClick) onClick(); // Fallback temporal si no se provee onEdit
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Edit2 size={16} /> <span>✏️ Editar viaje</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onShare) onShare(trip.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Share2 size={16} /> <span>🔗 Compartir ruta</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      if (onDuplicate) onDuplicate(trip);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#1E293B',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Copy size={16} /> <span>📋 Duplicar</span>
                  </button>

                  <div style={{ height: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 0' }} />

                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsMenuOpen(false);
                        onDelete(trip.id);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#EF4444',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Trash2 size={16} /> <span>🗑️ Eliminar</span>
                    </button>
                  )}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div style={styles.bottomContent}>
        <h4 style={styles.title}>{title}</h4>
        <div style={styles.metaRow}>
          <span style={styles.glassPill}>
            <Calendar size={14} /> {datePillText}
          </span>
          <span style={styles.glassPill}>
            <MapPin size={14} /> {citiesPillText}
          </span>
          <span style={styles.glassPill}>
            <Clock size={14} /> {durationPillText}
          </span>
        </div>
      </div>
    </Motion.div>
  );
};

export default TripCard;
