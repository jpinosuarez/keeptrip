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
  styles,
  isMobile,
  activeParadaIndex,
  hoveredIndex,
  setParadaRef,
  onHover,
  onHoverEnd,
}) => {
  return (
    <>
      <h3 style={styles.sectionTitle}>Itinerario</h3>
      <div style={styles.timelineContainer}>
        {paradas.map((p, i) => {
          const isActive = activeParadaIndex === i && !isMobile;
          const isHovered = hoveredIndex === i && !isMobile;
          const highlighted = isActive || isHovered;

          const cardVariants = {
            hidden: { opacity: 0, y: 24, scale: 0.97 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
            },
          };

          return (
            <Motion.div
              key={p.id || i}
              data-testid={`visor-stop-card-${p.id || i}`}
              style={styles.timelineRow}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              <div style={styles.timelineTrack}>
                <div style={highlighted ? styles.timelineDotActive : styles.timelineDotInactive} />
                {i < paradas.length - 1 && <div style={styles.timelineLine} />}
              </div>

              <div
                ref={(node) => setParadaRef(i, node)}
                style={{
                  ...styles.enrichedStopCard,
                  ...(highlighted ? styles.enrichedStopCardActive : {}),
                }}
                onMouseEnter={() => onHover(i)}
                onMouseLeave={onHoverEnd}
              >
                <div style={styles.stopCardHeader}>
                  <span data-testid={`visor-stop-name-${p.id || i}`} style={styles.stopCardName}>
                    {p.nombre}
                  </span>
                  <span style={styles.stopCardDate}>{formatDateRange(p.fechaLlegada || p.fecha, p.fechaSalida)}</span>
                </div>
                {p.clima && (
                  <div style={styles.climaBadge}>
                    <span style={{ fontSize: '1.1rem' }}>{climaEmoji(p.clima.desc)}</span>
                    {p.clima.max != null && <span>{Math.round(p.clima.max)}°C</span>}
                    <span style={styles.verifiedBadge}>Histórico</span>
                  </div>
                )}
                {p.notaCorta && <p style={styles.notaCorta}>{p.notaCorta}</p>}
                {p.relato && p.relato.trim() && (
                  <div style={styles.paradaRelato}>
                    <p style={styles.paradaRelatoText}>{p.relato}</p>
                  </div>
                )}
              </div>

              {i < paradas.length - 1 && paradas[i + 1]?.transporte && (
                <div style={styles.transportIconOnLine}>{transporteEmoji[paradas[i + 1].transporte] || '🚶'}</div>
              )}
            </Motion.div>
          );
        })}
      </div>
    </>
  );
};

export default VisorTimelineSection;
