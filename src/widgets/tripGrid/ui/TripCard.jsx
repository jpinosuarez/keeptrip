import React, { useRef } from 'react';
import { motion as Motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Compass, Calendar, MapPin, Trash2, Clock, MoreVertical, Edit2, Share2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PortalDropdown from '@shared/ui/components/PortalDropdown/PortalDropdown';
import { tripStyles as styles } from './TripCard.styles';
import {
  FOTO_DEFAULT_URL,
  formatStorytellingDate,
  formatCitiesSummary,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';
import { COLORS, RADIUS } from '@shared/config';
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
const TripCard = ({ trip, onClick, onDelete, isMobile = false, variant = 'list', priorityImage = false }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const triggerRef = useRef(null);
  const { t, i18n } = useTranslation(['countries', 'dashboard', 'common']);
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
      className="trip-card"
      data-variant={variant}
      ref={cardRef}
      aria-label={cardAriaLabel}
      style={{
        ...styles.cardBase(variant),
        perspective: 1000,
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        willChange: 'transform' // Performance constraint
      }}
      onClick={(e) => {
        // Card click disabled per Director's UX request. Navigation only via Menu actions.
        e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
        }
      }}
      initial={priorityImage ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={!isMobile ? { scale: 1.02, zIndex: 10 } : {}}
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
      
      <div className="top-content">
        <div className="flags-row">
          {flags.length > 0 ? (
            flags.map((flag, idx) => (
              <img key={idx} src={flag} alt={t('tripCard.flagAlt', { ns: 'dashboard', defaultValue: 'Bandera' })} className="flag-img" loading={priorityImage ? "eager" : "lazy"} />
            ))
          ) : (
             <div className="glass-pill">
                 <Compass size={14} color="white" />
             </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <button
              ref={triggerRef}
              className={`trip-card-menu-btn ${showMenu ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              aria-label={t('button.actionMenu', { ns: 'common', defaultValue: 'Menú de acciones' })}
            >
              <MoreVertical size={16} color="white" />
            </button>

            <PortalDropdown
              isOpen={showMenu}
              onClose={() => setShowMenu(false)}
              triggerRef={triggerRef}
            >
              <button 
                className="portal-menu-item"
                style={{ ...menuItemStyle, color: COLORS.charcoalBlue }} 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick(); }}
              >
                <Edit2 size={16} /> {t('common.edit', 'Editar')}
              </button>
              
              <div style={{ height: '1px', background: '#eee', margin: '4px 0' }} />
              
              <button 
                className="portal-menu-item danger"
                style={{ ...menuItemStyle, color: '#ef4444' }} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowMenu(false); 
                  onDelete && onDelete(trip.id); 
                }}
              >
                <Trash2 size={16} /> {t('common.delete', 'Eliminar')}
              </button>
            </PortalDropdown>
          </div>
        </div>
      </div>

      <div className="bottom-content">
        <h4 className="title">{title}</h4>
        <div className="meta-row">
          <span className="glass-pill">
            <Calendar size={14} /> {datePillText}
          </span>
          <span className="glass-pill">
            <MapPin size={14} /> {citiesPillText}
          </span>
          <span className="glass-pill">
            <Clock size={14} /> {durationPillText}
          </span>
        </div>
      </div>
    </Motion.div>
  );
};

const menuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 12px',
  border: 'none',
  background: 'transparent',
  borderRadius: RADIUS.sm,
  fontSize: '0.88rem',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.2s',
  ':hover': { background: '#f5f5f5' }
};

export default TripCard;
