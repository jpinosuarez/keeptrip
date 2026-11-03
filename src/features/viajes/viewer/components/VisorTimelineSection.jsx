import { cn } from '@shared/lib/utils/cn';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion as Motion } from 'framer-motion';
import {
  formatDateRange,
  ordenarParadasCronologicamente,
  esParadaEscapada,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';

const transporteEmoji = { avion: '\u2708\ufe0f', tren: '\ud83d\ude86', auto: '\ud83d\ude97', bus: '\ud83d\ude8c', otro: '\ud83d\udeb6' };

const climaEmoji = (desc) => {
  if (!desc) return '\ud83c\udf21\ufe0f';
  const d = desc.toLowerCase();
  if (d.includes('sol') || d.includes('despejado')) return '\u2600\ufe0f';
  if (d.includes('nub') || d.includes('parcial')) return '\u26c5';
  if (d.includes('lluvia') || d.includes('llovi')) return '\ud83c\udf27\ufe0f';
  if (d.includes('nieve')) return '\u2744\ufe0f';
  if (d.includes('tormenta')) return '\u26a1';
  return '\ud83c\udf24\ufe0f';
};

/** Zero-slop: a stop without narrative/media renders as a compact milestone. */
const hasNarrativeContent = (parada) =>
  Boolean(
    (parada?.nota && String(parada.nota).trim()) ||
      (parada?.notaCorta && String(parada.notaCorta).trim()) ||
      (parada?.descripcion && String(parada.descripcion).trim()) ||
      (parada?.comentarios && String(parada.comentarios).trim()) ||
      (parada?.relato && String(parada.relato).trim()) ||
      (Array.isArray(parada?.fotos) && parada.fotos.length > 0)
  );

const collectThumbnails = (parada) =>
  (Array.isArray(parada?.fotos) ? parada.fotos : [])
    .map((foto) => (typeof foto === 'string' ? foto : foto?.url))
    .filter(Boolean)
    .slice(0, 4);

const VisorTimelineSection = ({
  paradas = [],
  hoveredStopId = null,
  onHoverStop,
}) => {
  const { t } = useTranslation('visor');
  const orderedStops = useMemo(() => ordenarParadasCronologicamente(paradas), [paradas]);

  return (
    <>
      <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal mb-4 font-extrabold">
        {t('timeline.title', 'La Crónica del Viaje')}
      </h3>
      <div className="flex flex-col gap-0 relative">
        {orderedStops.map((p, i) => {
          const previousStop = i > 0 ? orderedStops[i - 1] : null;
          const dayTripFrom =
            previousStop && esParadaEscapada(p, previousStop) ? previousStop.nombre : null;
          const highlighted = Boolean(hoveredStopId && p.id === hoveredStopId);
          const hasContent = hasNarrativeContent(p);
          const days = calculateTripDays(p.fechaLlegada || p.fecha, p.fechaSalida);
          const dateLabel = formatDateRange(p.fechaLlegada || p.fecha, p.fechaSalida);
          const thumbnails = collectThumbnails(p);
          const storyText = p.relato || p.nota || p.descripcion || p.comentarios || '';

          const stopHoverEvents = {
            onMouseEnter: () => onHoverStop?.(p.id),
            onMouseLeave: () => onHoverStop?.(null),
          };

          const cardVariants = {
            hidden: { opacity: 0, y: 30, scale: 0.98 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
            },
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
                {i < orderedStops.length - 1 && (
                  <div className="w-0.5 grow bg-border min-h-[24px] mt-1" />
                )}
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
                  <div className="flex justify-between items-baseline gap-2">
                    <span
                      data-testid={`visor-stop-name-${p.id || i}`}
                      className="text-base font-bold text-charcoalBlue"
                    >
                      {p.nombre}
                    </span>
                    <span className="text-[0.75rem] text-textSecondary whitespace-nowrap">
                      {dateLabel}
                    </span>
                  </div>

                  {dayTripFrom && (
                    <span
                      data-testid={`visor-day-trip-${p.id || i}`}
                      className="inline-flex items-center gap-1 self-start rounded-full bg-mutedTeal/10 text-mutedTeal text-[0.72rem] font-bold border border-mutedTeal/30 px-2.5 py-1"
                    >
                      📍{' '}
                      {t('timeline.dayTripFrom', {
                        city: dayTripFrom,
                        defaultValue: 'Escapada de día desde {{city}}',
                      })}
                    </span>
                  )}

                  {storyText && (
                    <div className="mt-1.5 p-[10px_14px] bg-background rounded-sm border-l-[3px] border-mutedTeal">
                      <p className="text-[0.88rem] leading-[1.6] text-textPrimary whitespace-pre-wrap m-0">
                        {storyText}
                      </p>
                    </div>
                  )}

                  {thumbnails.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {thumbnails.map((url, idx) => (
                        <img
                          key={`${url}-${idx}`}
                          src={url}
                          alt={p.nombre || ''}
                          loading="lazy"
                          className="w-16 h-16 rounded-lg object-cover border border-border"
                        />
                      ))}
                    </div>
                  )}

                  {(p.clima || p.transporte || p.notaCorta) && (
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mt-1">
                      {p.clima && (
                        <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1">
                          <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">
                            {t('timeline.climate', 'Clima')}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-[1.1rem]">{climaEmoji(p.clima.desc)}</span>
                            <span className="text-[0.9rem] text-textPrimary font-semibold">
                              {Math.round(p.clima.max)}°C
                            </span>
                          </div>
                        </div>
                      )}
                      {p.transporte && (
                        <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1">
                          <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">
                            {t('timeline.transport', 'Transporte')}
                          </span>
                          <span className="text-[0.9rem] text-textPrimary font-semibold">
                            {transporteEmoji[p.transporte] || '\ud83d\udeb6'} {p.transporte}
                          </span>
                        </div>
                      )}
                      {p.notaCorta && (
                        <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1 col-span-2">
                          <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">
                            {t('timeline.highlight', 'Destacado')}
                          </span>
                          <span className="text-[0.9rem] text-textPrimary font-semibold">
                            ✨ {p.notaCorta}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
                  <span
                    data-testid={`visor-stop-name-${p.id || i}`}
                    className="text-sm font-bold text-charcoalBlue truncate"
                  >
                    {p.nombre}
                  </span>
                  {dateLabel && (
                    <span className="text-[0.72rem] text-textSecondary font-mono whitespace-nowrap">
                      {dateLabel}
                    </span>
                  )}
                  {days > 0 && (
                    <span className="text-[0.68rem] font-bold text-mutedTeal bg-mutedTeal/10 border border-mutedTeal/25 rounded-full px-2 py-0.5 whitespace-nowrap">
                      {t('timeline.days', { count: days, defaultValue: '{{count}} días' })}
                    </span>
                  )}
                  {dayTripFrom && (
                    <span
                      data-testid={`visor-day-trip-${p.id || i}`}
                      className="inline-flex items-center gap-1 rounded-full bg-mutedTeal/10 text-mutedTeal text-[0.68rem] font-bold border border-mutedTeal/25 px-2 py-0.5 whitespace-nowrap"
                    >
                      📍{' '}
                      {t('timeline.dayTripFrom', {
                        city: dayTripFrom,
                        defaultValue: 'Escapada de día desde {{city}}',
                      })}
                    </span>
                  )}
                </div>
              )}

              {i < orderedStops.length - 1 && orderedStops[i + 1]?.transporte && (
                <div className="absolute left-0 bottom-[-4px] w-5 text-center text-[0.9rem] z-[3]">
                  {transporteEmoji[orderedStops[i + 1].transporte] || '\ud83d\udeb6'}
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
