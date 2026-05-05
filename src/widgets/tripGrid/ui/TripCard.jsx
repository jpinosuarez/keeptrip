/**
 * Cinematic TripCard (2026 Restyle)
 * Features full-bleed images, floating glass pills, and 3D parallax on desktop hovering.
 */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Compass, Calendar, MapPin, Trash2, Clock, MoreVertical, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  FOTO_DEFAULT_URL,
  formatStorytellingDate,
  formatCitiesSummary,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';

const TripCard = ({ trip, onClick, onEdit, onDelete, isMobile = false, variant = 'list', priorityImage = false }) => {
  const { t, i18n } = useTranslation(['countries', 'dashboard', 'common']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const flags = useMemo(() => 
    (Array.isArray(trip.banderas) && trip.banderas.filter(Boolean).length > 0 && trip.banderas.filter(Boolean)) ||
    (Array.isArray(trip.flags) && trip.flags.filter(Boolean).length > 0 && trip.flags.filter(Boolean)) ||
    (trip.flag ? [trip.flag] : []), 
    [trip.banderas, trip.flags, trip.flag]
  );
  
  const auraFlags = useMemo(() => (flags.length > 0 ? flags : [FOTO_DEFAULT_URL]).slice(0, 4), [flags]);
  
  const coverUrl = trip.foto || '';
  const isDefaultPhoto = !coverUrl || coverUrl === FOTO_DEFAULT_URL;

  const startDate = trip.fechaInicio || trip.startDate || trip.date || null;
  const endDate = trip.fechaFin || trip.endDate || null;
  const parsedCities = useMemo(() => 
    String(trip.ciudades || '')
      .split(',')
      .map((city) => city.trim())
      .filter(Boolean)
      .map((city) => ({ nombre: city })),
    [trip.ciudades]
  );
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

  const isList = variant === 'list';

  return (
    <Motion.div
      data-testid={`trip-card-${trip.id}`}
      ref={cardRef}
      style={{
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
      initial={priorityImage ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      whileHover={!isMobile && !isMenuOpen ? { scale: 1.02, zIndex: 10 } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative cursor-default group rounded-2xl shadow-md bg-charcoalBlue transition-shadow duration-300 border-0 overflow-visible",
        isList ? "aspect-auto min-h-[120px]" : "aspect-[4/5]",
        isMenuOpen ? "z-[60]" : "z-[1]"
      )}
    >

      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pointer-events-none">
        <Motion.div 
          style={{
            x: isMobile ? 0 : bgX,
            y: isMobile ? 0 : bgY
          }} 
          className="absolute -inset-[10%] w-[120%] h-[120%] bg-mutedTeal will-change-transform overflow-hidden rounded-[inherit]"
        >
          {!isDefaultPhoto ? (
            <img 
              src={coverUrl} 
              alt={title || t('tripCoverAlt', { ns: 'dashboard', defaultValue: 'Portada del viaje' })} 
              className="w-full h-full object-cover"
              loading={priorityImage ? "eager" : "lazy"}
            />
          ) : (
            <div className="relative w-full h-full overflow-hidden" aria-hidden="true">
              <div className={cn(
                "grid w-full h-full blur-sm scale-105 opacity-30",
                auraFlags.length <= 1 ? "grid-cols-1 grid-rows-1" : 
                auraFlags.length === 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2"
              )}>
                {auraFlags.map((flag, idx) => (
                  <img
                    key={`${flag}-${idx}`}
                    src={flag}
                    alt=""
                    className={cn(
                      "w-full h-full object-cover",
                      auraFlags.length === 3 && idx === 2 ? "col-span-2" : ""
                    )}
                    loading={priorityImage ? "eager" : "lazy"}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}
        </Motion.div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      </div>
      
      {/* Content Wrapper */}
      <div className="relative z-[2] flex flex-col h-full pb-5">
        {/* Top Content */}
        <div className="p-4 flex justify-between items-start w-full">
        <div className="flex flex-wrap items-center gap-1.5 row-gap-1.5">
          {flags.length > 0 ? (
            flags.map((flag, idx) => (
              <img 
                key={idx} 
                src={flag} 
                alt="Bandera" 
                className="w-6 h-6 object-cover rounded-full shadow-sm border border-white/20" 
                loading={priorityImage ? "eager" : "lazy"} 
              />
            ))
          ) : (
            <div className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-md rounded-full px-2.5 py-1 flex items-center justify-center text-white">
                <Compass size={14} />
            </div>
          )}
        </div>
          
        <div className="relative">
          <button
            ref={buttonRef}
            className="pointer-events-auto bg-white/25 backdrop-blur-lg border border-white/30 rounded-full w-11 h-11 flex items-center justify-center text-white shadow-md hover:bg-white/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsMenuOpen((prev) => !prev);
            }}
            aria-label="Abrir opciones de viaje"
          >
            <MoreVertical size={20} />
          </button>
 
          <AnimatePresence>
            {isMenuOpen && createPortal(
              <Motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="fixed w-[180px] bg-white/85 backdrop-blur-xl rounded-xl shadow-lg p-2 flex flex-col gap-1 z-[100]"
                style={{
                  top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 8 : 0,
                  left: buttonRef.current ? buttonRef.current.getBoundingClientRect().left - 180 + buttonRef.current.getBoundingClientRect().width : 0,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsMenuOpen(false);
                    if (onEdit) onEdit(trip.id);
                  }}
                  className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-slate-800 text-left hover:bg-black/5 transition-colors font-heading"
                >
                  <Edit2 size={16} /> <span>{t('card.edit', { ns: 'dashboard', defaultValue: 'Editar viaje' })}</span>
                </button>
 
                <div className="h-px bg-black/10 my-1" />
 
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsMenuOpen(false);
                      onDelete(trip.id);
                    }}
                    className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-danger text-left hover:bg-danger/10 transition-colors font-heading"
                  >
                    <Trash2 size={16} /> <span>{t('card.delete', { ns: 'dashboard', defaultValue: 'Eliminar' })}</span>
                  </button>
                )}
              </Motion.div>,
              document.body
            )}
          </AnimatePresence>
        </div>
        </div>
        
        {/* Bottom Content */}
        <div className="p-4 pt-0 w-full flex flex-col gap-2 mt-auto pointer-events-none">
        <h4 className="m-0 text-xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)] truncate leading-[1.1] tracking-tighter font-heading">
          {title}
        </h4>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-md rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-[0.75rem] font-bold tracking-wide font-heading">
            <Calendar size={14} /> {datePillText}
          </span>
          <span className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-md rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-[0.75rem] font-bold tracking-wide font-heading">
            <MapPin size={14} /> {citiesPillText}
          </span>
          <span className="bg-white/20 backdrop-blur-lg border border-white/30 shadow-md rounded-full px-2.5 py-1 flex items-center gap-1.5 text-white text-[0.75rem] font-bold tracking-wide font-heading">
            <Clock size={14} /> {durationPillText}
          </span>
        </div>
        </div>
      </div>
    </Motion.div>
  );
};

export default TripCard;
