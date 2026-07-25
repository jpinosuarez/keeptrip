import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { motion as Motion } from 'framer-motion';
import { formatDateRange } from '@shared/lib/utils/viajeUtils';

const transporteEmoji = { avion: '✈️', tren: '🚆', auto: '🚗', bus: '🚌', otro: '🚶' };

const climaEmoji = (desc) => {
  if (!desc) return '🌡️';
  const d = desc.toLowerCase();
  if (d.includes('sol') || d.includes('despejado')) return '☀️';
  if (d.includes('nub') || d.includes('parcial')) return '⛅';
  if (d.includes('lluvia') || d.includes('llovi')) return '🌧️';
  if (d.includes('nieve')) return '❄️';
  if (d.includes('tormenta')) return '⚡';
  return '🌤️';
};

const VisorTimelineSection = ({
  paradas,
  isMobile,
  activeParadaIndex,
  hoveredIndex,
  setParadaRef,
  onHover,
  onHoverEnd,
}) => {
  return (
    <>
      <h3 className="text-[0.85rem] uppercase tracking-widest text-mutedTeal mb-4 font-extrabold">La Crónica del Viaje</h3>
      <div className="flex flex-col gap-0 relative">
        {paradas.map((p, i) => {
          const isActive = activeParadaIndex === i && !isMobile;
          const isHovered = hoveredIndex === i && !isMobile;
          const highlighted = isActive || isHovered;

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
                <div className={cn(
                  "rounded-full relative z-[2] flex-shrink-0 transition-all",
                  highlighted 
                    ? "w-3 h-3 bg-atomicTangerine border-[3px] border-white shadow-[0_0_15px_rgba(255,107,53,0.5)]" 
                    : "w-[10px] h-[10px] bg-border border-2 border-white shadow-sm"
                )} />
                {i < paradas.length - 1 && <div className="w-0.5 grow bg-border min-h-[24px] mt-1" />}
              </div>

              <div
                ref={(node) => setParadaRef(i, node)}
                className={cn(
                  "bg-surface p-6 rounded-lg border border-border shadow-md flex flex-col gap-3 transition-all relative overflow-hidden mb-6 w-full",
                  highlighted && "border-atomicTangerine shadow-[0_8px_30px_rgba(0,0,0,0.12)] scale-[1.02] z-10"
                )}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={onHoverEnd}
              >
                <div className="flex justify-between items-baseline gap-2">
                  <span data-testid={`visor-stop-name-${p.id || i}`} className="text-base font-bold text-charcoalBlue">
                    {p.nombre}
                  </span>
                  <span className="text-[0.75rem] text-textSecondary whitespace-nowrap">{formatDateRange(p.fechaLlegada || p.fecha, p.fechaSalida)}</span>
                </div>

                {p.relato && p.relato.trim() && (
                  <div className="mt-1.5 p-[10px_14px] bg-background rounded-sm border-l-[3px] border-mutedTeal">
                    <p className="text-[0.88rem] leading-[1.6] text-textPrimary whitespace-pre-wrap m-0">{p.relato}</p>
                  </div>
                )}

                {/* Bento Metadata Grid */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 mt-3">
                  {p.clima && (
                    <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1">
                      <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">Clima</span>
                      <div className="flex items-center gap-1">
                         <span className="text-[1.1rem]">{climaEmoji(p.clima.desc)}</span>
                         <span className="text-[0.9rem] text-textPrimary font-semibold">{Math.round(p.clima.max)}°C</span>
                      </div>
                    </div>
                  )}
                  {p.transporte && (
                    <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1">
                      <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">Transporte</span>
                      <span className="text-[0.9rem] text-textPrimary font-semibold">{transporteEmoji[p.transporte] || '🚶'} {p.transporte}</span>
                    </div>
                  )}
                  {p.notaCorta && (
                    <div className="bg-background p-2.5 rounded-md border border-border flex flex-col gap-1 col-span-2">
                      <span className="text-[0.65rem] uppercase tracking-[0.05em] text-textSecondary font-bold">Destacado</span>
                      <span className="text-[0.9rem] text-textPrimary font-semibold">✨ {p.notaCorta}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transport indicator on the line */}
              {i < paradas.length - 1 && paradas[i + 1]?.transporte && (
                <div className="absolute left-0 bottom-[-4px] w-5 text-center text-[0.9rem] z-[3]">{transporteEmoji[paradas[i + 1].transporte] || '🚶'}</div>
              )}
            </Motion.div>
          );
        })}
      </div>
    </>
  );
};

export default VisorTimelineSection;
