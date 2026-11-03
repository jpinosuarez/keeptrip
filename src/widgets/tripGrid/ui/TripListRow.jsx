import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Edit2, Eye, MapPin, MoreVertical, Play, Trash2 } from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import PortalDropdown from '@shared/ui/components/PortalDropdown/PortalDropdown';
import { formatDateRange, ordenarParadasCronologicamente } from '@shared/lib/utils/viajeUtils';
import { cn } from '@shared/lib/utils/cn';
import {
  getTripCountries,
  getTripCover,
  getTripDays,
  getTripEndDate,
  getTripStartDate,
  getTripTitle,
  isTripComplete,
} from '../lib/tripFilters';

/**
 * TripListRow — compact 72px horizontal archive row.
 * - Thumbnail (56x56) opens the Stories Player.
 * - Row body navigates to the Documentary Viewer (/trips/:id).
 * - Uses native content-visibility virtualization for 60fps scroll.
 */
const TripListRow = ({
  trip = {},
  isLocal = false,
  isDeleting = false,
  onView,
  onEdit,
  onDelete,
  onOpenStories,
}) => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Chronological stop sequence — first city on the left is always the first stop.
  const routeText = useMemo(() => {
    let rawStops = [];
    if (Array.isArray(trip.paradas) && trip.paradas.length > 0) {
      rawStops = trip.paradas;
    } else if (Array.isArray(trip.ciudades)) {
      rawStops = trip.ciudades
        .map((city) => (typeof city === 'string' ? { nombre: city } : city))
        .filter(Boolean);
    } else if (typeof trip.ciudades === 'string') {
      rawStops = trip.ciudades
        .split(',')
        .map((city) => ({ nombre: city.trim() }))
        .filter((stop) => stop.nombre);
    }

    const sortedStops = ordenarParadasCronologicamente(rawStops);
    const stopCities = sortedStops
      .map((stop) => stop?.ciudad || stop?.nombre || stop?.name)
      .filter(Boolean);
    return stopCities.length > 0
      ? stopCities.join(' \u2794 ')
      : trip.destino || trip.titulo || '';
  }, [trip]);
  const countries = useMemo(() => getTripCountries(trip), [trip]);

  const primaryCountry = countries[0] || null;
  const cover = getTripCover(trip);
  const complete = isTripComplete(trip);
  const startIso = getTripStartDate(trip);
  const endIso = getTripEndDate(trip);
  const days = getTripDays(trip);
  const title = getTripTitle(trip, i18n.language) || t('untitledTrip', 'Sin título');
  const dateText = formatDateRange(startIso, endIso);

  const handleRowClick = () => onView?.(trip.id);

  const handleThumbnailClick = (event) => {
    event.stopPropagation();
    onOpenStories?.(trip.id, event);
  };

  return (
    <article
      data-testid={`trip-list-row-${trip.id}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 72px' }}
      className={cn(
        'cv-auto-card-list',
        'min-h-[72px] rounded-2xl bg-white border border-slate-200/90',
        'hover:border-[#FF6B35]/60 transition-all p-3 flex items-center justify-between gap-4',
        'cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.07)]',
        isDeleting && 'opacity-60 pointer-events-none'
      )}
    >
      {/* Left: Cover thumbnail (opens stories) */}
      <button
        type="button"
        onClick={handleThumbnailClick}
        data-testid={`trip-list-row-stories-${trip.id}`}
        aria-label={t('viewStories', 'Ver Stories')}
        title={t('reviveInStories', 'Revivir en Stories')}
        className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 border-none min-h-[44px] min-w-[44px] cursor-pointer ring-2 ring-offset-2 ring-[#FF6B35] shadow-xs hover:scale-105 transition-transform"
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : primaryCountry ? (
          <CountryFlag code={primaryCountry} size="lg" />
        ) : (
          <MapPin size={20} className="text-slate-400" />
        )}
        <span className="absolute bottom-0.5 right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#FF6B35] text-white">
          <Play size={10} fill="currentColor" />
        </span>
      </button>

      {/* Center: Title + meta (row navigation trigger) */}
      <div
        role="button"
        tabIndex={0}
        data-testid={`trip-list-row-body-${trip.id}`}
        aria-label={title}
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleRowClick();
          }
        }}
        className="flex-1 min-w-0 flex flex-col justify-center gap-1 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          {countries.length > 0 && (
            <span className="flex -space-x-1 shrink-0">
              {countries.slice(0, 3).map((code) => (
                <CountryFlag key={code} code={code} size="sm" />
              ))}
            </span>
          )}
          <h3 className="font-bold text-slate-800 truncate text-sm md:text-base font-sans m-0">
            {title}
          </h3>
          {isLocal && (
            <span className="shrink-0 text-[0.65rem] font-semibold text-mutedTeal bg-mutedTeal/10 px-2 py-0.5 rounded-full">
              {t('localAdventure', 'Aventura Local')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 min-w-0">
          {routeText && (
            <span className="flex items-center gap-1 min-w-0 truncate">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{routeText}</span>
            </span>
          )}
          {dateText && (
            <span className="flex items-center gap-1 shrink-0">
              <Calendar size={12} className="shrink-0" />
              {dateText}
            </span>
          )}
          {days > 0 && (
            <span className="font-mono text-[0.7rem] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
              {days}d
            </span>
          )}
          {!complete && (
            <span className="text-[0.7rem] text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded-full font-medium shrink-0">
              {t('addMemories', '+ Añadir recuerdos')}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions menu */}
      <div
        className="flex items-center shrink-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={t('card.menu', 'Abrir opciones de viaje')}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-none bg-transparent cursor-pointer transition-colors"
        >
          <MoreVertical size={18} />
        </button>
        <PortalDropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          triggerRef={menuButtonRef}
        >
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onView?.(trip.id);
            }}
            className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-slate-800 text-left hover:bg-black/5 transition-colors font-heading"
          >
            <Eye size={16} /> <span>{t('dashboard:viewTrip')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onOpenStories?.(trip.id);
            }}
            className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-slate-800 text-left hover:bg-black/5 transition-colors font-heading"
          >
            <Play size={16} /> <span>{t('dashboard:viewStories')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onEdit?.(trip.id);
            }}
            className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-slate-800 text-left hover:bg-black/5 transition-colors font-heading"
          >
            <Edit2 size={16} /> <span>{t('dashboard:card.edit')}</span>
          </button>
          <div className="h-px bg-black/10 my-1" />
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onDelete?.(trip.id);
            }}
            className="flex items-center gap-2 w-full p-3 border-none bg-transparent rounded-lg cursor-pointer text-[0.85rem] font-bold text-danger text-left hover:bg-danger/10 transition-colors font-heading"
          >
            <Trash2 size={16} /> <span>{t('dashboard:card.delete')}</span>
          </button>
        </PortalDropdown>
      </div>
    </article>
  );
};

const stopsSignature = (trip) =>
  Array.isArray(trip?.paradas)
    ? trip.paradas
        .map((stop) => `${stop?.nombre || stop?.name || stop?.ciudad || ''}:${stop?.fechaLlegada || stop?.fecha || ''}`)
        .join('|')
    : trip?.ciudades || '';

function areTripListRowPropsEqual(prevProps, nextProps) {
  if (prevProps.isLocal !== nextProps.isLocal) return false;
  if (prevProps.isDeleting !== nextProps.isDeleting) return false;
  if (prevProps.onView !== nextProps.onView) return false;
  if (prevProps.onEdit !== nextProps.onEdit) return false;
  if (prevProps.onDelete !== nextProps.onDelete) return false;
  if (prevProps.onOpenStories !== nextProps.onOpenStories) return false;

  const a = prevProps.trip;
  const b = nextProps.trip;
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.id === b.id &&
    a.titulo === b.titulo &&
    a.foto === b.foto &&
    a.portadaUrl === b.portadaUrl &&
    a.fechaInicio === b.fechaInicio &&
    a.fechaFin === b.fechaFin &&
    a.texto === b.texto &&
    a.relato === b.relato &&
    a.ciudades === b.ciudades &&
    a.destino === b.destino &&
    a.paisCodigo === b.paisCodigo &&
    a.code === b.code &&
    a.countryCode === b.countryCode &&
    stopsSignature(a) === stopsSignature(b)
  );
}

export default React.memo(TripListRow, areTripListRowPropsEqual);
