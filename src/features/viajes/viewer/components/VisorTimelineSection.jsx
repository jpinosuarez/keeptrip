import { cn } from '@shared/lib/utils/cn';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion } from 'framer-motion';
import {
  Plane,
  Train,
  Car,
  Ship,
  Bus,
  Footprints,
  Heart,
  MapPin,
  Sparkles,
  Landmark,
  Utensils,
  Eye,
  Palette,
  Bed,
  CloudSun,
} from 'lucide-react';
import CountryFlag from '@shared/ui/components/CountryFlag';
import {
  formatDateRange,
  ordenarParadasCronologicamente,
  esParadaEscapada,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';

const TRANSPORT_META = {
  plane: { Icon: Plane, key: 'plane', fallback: 'En avión' },
  avion: { Icon: Plane, key: 'plane', fallback: 'En avión' },
  train: { Icon: Train, key: 'train', fallback: 'En tren' },
  tren: { Icon: Train, key: 'train', fallback: 'En tren' },
  car: { Icon: Car, key: 'car', fallback: 'En auto' },
  auto: { Icon: Car, key: 'car', fallback: 'En auto' },
  ship: { Icon: Ship, key: 'ship', fallback: 'En barco' },
  barco: { Icon: Ship, key: 'ship', fallback: 'En barco' },
  bus: { Icon: Bus, key: 'bus', fallback: 'En bus' },
  otro: { Icon: Bus, key: 'other', fallback: 'Otro medio' },
  walk: { Icon: Footprints, key: 'walk', fallback: 'A pie' },
};

const VIBE_META = {
  caminable: { key: 'caminable', fallback: 'Ideal para caminar' },
  gastronomia: { key: 'gastronomia', fallback: 'Gran gastronomía' },
  historia: { key: 'historia', fallback: 'Historia viva' },
  naturaleza: { key: 'naturaleza', fallback: 'Naturaleza' },
  joya: { key: 'joya', fallback: 'Joya oculta' },
  fotogenica: { key: 'fotogenica', fallback: 'Súper fotogénica' },
  ambiente: { key: 'ambiente', fallback: 'Gran ambiente' },
};

const PLACE_META = {
  monumento: { Icon: Landmark, key: 'monumento', fallback: 'Monumento' },
  gastronomia: { Icon: Utensils, key: 'gastronomia', fallback: 'Gastronomía' },
  mirador: { Icon: Eye, key: 'mirador', fallback: 'Mirador' },
  cultura: { Icon: Palette, key: 'cultura', fallback: 'Cultura' },
  hotel: { Icon: Bed, key: 'hotel', fallback: 'Hotel' },
};

const hasNarrativeContent = (parada) =>
  Boolean(
    (parada?.nota && String(parada.nota).trim()) ||
      (parada?.titular && String(parada.titular).trim()) ||
      (parada?.notaCorta && String(parada.notaCorta).trim()) ||
      (parada?.descripcion && String(parada.descripcion).trim()) ||
      (parada?.relato && String(parada.relato).trim()) ||
      (Array.isArray(parada?.lugares) && parada.lugares.length > 0) ||
      (Array.isArray(parada?.vibes) && parada.vibes.length > 0) ||
      Boolean(parada?.esFavorita) ||
      (Array.isArray(parada?.fotos) && parada.fotos.length > 0)
  );

const collectThumbnails = (parada, stopPhotos = []) => {
  const fromStop = (Array.isArray(parada?.fotos) ? parada.fotos : [])
    .map((foto) => (typeof foto === 'string' ? foto : foto?.url))
    .filter(Boolean);
  const fromGallery = (Array.isArray(stopPhotos) ? stopPhotos : [])
    .filter((foto) => foto?.paradaId && foto.paradaId === parada?.id && foto?.url)
    .map((foto) => foto.url);
  return [...new Set([...fromStop, ...fromGallery])].slice(0, 4);
};

const VisorTimelineSection = ({ paradas = [], fotos = [], hoveredStopId = null, onHoverStop }) => {
  const { t } = useTranslation('visor');
  const orderedStops = useMemo(() => ordenarParadasCronologicamente(paradas), [paradas]);

  const renderTransportBadge = (parada) => {
    const meta = TRANSPORT_META[parada?.transporte];
    if (!meta) return null;
    const { Icon } = meta;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
        <Icon size={12} className="text-[#FF6B35]" />
        {t(`timeline.transportMode.${meta.key}`, meta.fallback)}
      </span>
    );
  };

  return (
    <>
      <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal mb-4 font-extrabold">
        {t('timeline.title', 'La Crónica del Viaje')}
      </h3>
      <div className="flex flex-col gap-0 relative">
        {orderedStops.map((p, i) => {
          const previousStop = i > 0 ? orderedStops[i - 1] : null;
          const dayTripFrom = previousStop && esParadaEscapada(p, previousStop) ? previousStop.nombre : null;
          const highlighted = Boolean(hoveredStopId && p.id === hoveredStopId);
          const hasContent = hasNarrativeContent(p);
          const days = calculateTripDays(p.fechaLlegada || p.fecha, p.fechaSalida);
          const dateLabel = formatDateRange(p.fechaLlegada || p.fecha, p.fechaSalida);
          const thumbnails = collectThumbnails(p, fotos);
          const storyText = p.nota || p.relato || p.descripcion || p.notaCorta || '';
          const vibes = Array.isArray(p.vibes) ? p.vibes : [];
          const lugares = Array.isArray(p.lugares) ? p.lugares : [];

          const stopHoverEvents = {
            onMouseEnter: () => onHoverStop?.(p.id),
            onMouseLeave: () => onHoverStop?.(null),
          };

          const cardVariants = {
            hidden: { opacity: 0, y: 30, scale: 0.98 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] } },
          };

          return (
            <Motion.div
              key={p.id || i}
              data-testid={`visor-stop-card-${p.id || i}`}
              className="flex gap-4 relative items-start"
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="flex flex-col items-center relative min-w-[20px] pt-[18px]">
                <div
                  className={cn(
                    'rounded-full relative z-[2] flex-shrink-0 transition-all',
                    highlighted
                      ? 'w-3 h-3 bg-atomicTangerine border-[3px] border-white shadow-[0_0_15px_rgba(255,107,53,0.5)]'
                      : 'w-[10px] h-[10px] bg-border border-2 border-white shadow-sm'
                  )}
                />
                {i < orderedStops.length - 1 && <div className="w-0.5 grow bg-border min-h-[24px] mt-1" />}
              </div>

              {hasContent ? (
                <div
                  data-testid={`visor-stop-expanded-${p.id || i}`}
                  className={cn(
                    'w-full rounded-2xl border transition-all duration-200 px-5 py-3.5 bg-white border-slate-200/90 shadow-2xs mb-6 flex flex-col gap-3 relative overflow-hidden',
                    highlighted && 'border-[#FF6B35]/70 bg-[#FF6B35]/[0.04] shadow-xs'
                  )}
                  {...stopHoverEvents}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span data-testid={`visor-stop-name-${p.id || i}`} className="inline-flex items-center gap-1.5 text-base font-bold text-charcoalBlue min-w-0">
                      {p.paisCodigo ? <CountryFlag code={p.paisCodigo} size="sm" /> : null}
                      {p.esFavorita ? <Heart size={14} className="text-[#FF6B35] fill-[#FF6B35] shrink-0" /> : null}
                      <span className="truncate">{p.nombre}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {renderTransportBadge(p)}
                      {dateLabel ? (
                        <span className="text-[0.75rem] text-textSecondary whitespace-nowrap">{dateLabel}</span>
                      ) : null}
                    </div>
                  </div>

                  {p.titular && String(p.titular).trim() ? (
                    <p className="m-0 text-[0.82rem] font-semibold italic text-charcoalBlue">{p.titular}</p>
                  ) : null}

                  {dayTripFrom ? (
                    <span data-testid={`visor-day-trip-${p.id || i}`} className="inline-flex items-center gap-1 self-start rounded-full bg-mutedTeal/10 text-mutedTeal text-[0.72rem] font-bold border border-mutedTeal/30 px-2.5 py-1">
                      <MapPin size={12} />
                      {t('timeline.dayTripFrom', { city: dayTripFrom, defaultValue: 'Escapada de día desde {{city}}' })}
                    </span>
                  ) : null}

                  {storyText ? (
                    <div className="mt-1.5 p-[10px_14px] bg-background rounded-sm border-l-[3px] border-mutedTeal">
                      <p className="text-[0.88rem] leading-[1.6] text-textPrimary whitespace-pre-wrap m-0">{storyText}</p>
                    </div>
                  ) : null}

                  {vibes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {vibes.map((vibe) => {
                        const meta = VIBE_META[vibe];
                        return (
                          <span key={vibe} className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-semibold px-2.5 py-0.5">
                            <Sparkles size={11} />
                            {t(`timeline.vibes.${meta?.key || 'custom'}`, meta?.fallback || vibe)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {lugares.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {lugares.map((lugar) => {
                        const meta = PLACE_META[lugar?.categoria];
                        const Icon = meta?.Icon || MapPin;
                        return (
                          <span key={lugar.id || lugar.nombre} className="inline-flex items-center gap-1 rounded-full bg-mutedTeal/10 text-mutedTeal text-xs font-bold px-2.5 py-0.5">
                            <Icon size={12} /> {lugar.nombre}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}

                  {thumbnails.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {thumbnails.map((url, idx) => (
                        <img key={`${url}-${idx}`} src={url} alt={p.nombre || ''} loading="lazy" className="w-16 h-16 rounded-lg object-cover border border-border" />
                      ))}
                    </div>
                  ) : null}

                  {p.clima?.desc ? (
                    <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5">
                      <CloudSun size={12} className="text-[#FF6B35]" /> {p.clima.desc}
                      {typeof p.clima.max === 'number' ? ` · ${Math.round(p.clima.max)}°C` : ''}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div
                  data-testid={`visor-stop-compact-${p.id || i}`}
                  className={cn(
                    'w-full rounded-2xl border transition-all duration-200 px-5 py-3.5 bg-white border-slate-200/90 shadow-2xs mb-4 flex items-center gap-3 min-h-[48px]',
                    highlighted && 'border-[#FF6B35]/70 bg-[#FF6B35]/[0.04] shadow-xs'
                  )}
                  {...stopHoverEvents}
                >
                  {p.paisCodigo ? <CountryFlag code={p.paisCodigo} size="sm" /> : null}
                  <span data-testid={`visor-stop-name-${p.id || i}`} className="text-sm font-bold text-charcoalBlue truncate flex-1 min-w-0">{p.nombre}</span>
                  {renderTransportBadge(p)}
                  {dateLabel ? <span className="text-[0.72rem] text-textSecondary font-mono whitespace-nowrap">{dateLabel}</span> : null}
                  {days > 0 ? (
                    <span className="text-[0.68rem] font-bold text-mutedTeal bg-mutedTeal/10 border border-mutedTeal/25 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {t('timeline.days', { count: days, defaultValue: '{{count}} días' })}
                    </span>
                  ) : null}
                </div>
              )}
            </Motion.div>
          );
        })}
      </div>
    </>
  );
};

export default VisorTimelineSection;
