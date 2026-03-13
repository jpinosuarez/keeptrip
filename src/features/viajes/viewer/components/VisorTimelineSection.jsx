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
      <h3 style={styles.sectionTitle}>La Crónica del Viaje</h3>
      <div style={styles.timelineContainer}>
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
              style={styles.timelineRow}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
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

                {p.relato && p.relato.trim() && (
                  <div style={styles.paradaRelato}>
                    <p style={styles.paradaRelatoText}>{p.relato}</p>
                  </div>
                )}

                {/* Bento Metadata Grid */}
                <div style={styles.stopCardBentoGrid}>
                  {p.clima && (
                    <div style={styles.bentoItem}>
                      <span style={styles.bentoLabel}>Clima</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <span style={{ fontSize: '1.1rem' }}>{climaEmoji(p.clima.desc)}</span>
                         <span style={styles.bentoValue}>{Math.round(p.clima.max)}°C</span>
                      </div>
                    </div>
                  )}
                  {p.transporte && (
                    <div style={styles.bentoItem}>
                      <span style={styles.bentoLabel}>Transporte</span>
                      <span style={styles.bentoValue}>{transporteEmoji[p.transporte] || '🚶'} {p.transporte}</span>
                    </div>
                  )}
                  {p.notaCorta && (
                    <div style={{ ...styles.bentoItem, gridColumn: 'span 2' }}>
                      <span style={styles.bentoLabel}>Destacado</span>
                      <span style={styles.bentoValue}>✨ {p.notaCorta}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transport indicator on the line */}
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
