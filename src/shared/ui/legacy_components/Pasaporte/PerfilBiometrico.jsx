import React from 'react';
import { motion as Motion } from 'framer-motion';
import { User } from 'lucide-react';
import { COLORS, SHADOWS, RADIUS, FONTS, TRANSITIONS } from '@shared/config';
import { getTravelerLevel, getNextLevel } from '@features/gamification';

/**
 * Perfil biométrico del pasaporte — ahora dinámico.
 * @param {{ displayName: string, email: string, photoURL: string|null, countriesCount: number, tripsCount: number }} props
 */
const PerfilBiometrico = ({ displayName, photoURL, countriesCount = 0, tripsCount = 0 }) => {
  const level = getTravelerLevel(countriesCount);
  const next = getNextLevel(countriesCount);

  const nombre = displayName || 'Viajero';
  // Línea MRZ estilo pasaporte: P<PAIS<NOMBRE<<NIVEL<<PAISES
  const mrzLine = `P<KTP<${nombre.toUpperCase().replace(/\s+/g, '<')}<${level.label.toUpperCase().replace(/\s+/g, '<')}<${countriesCount}<<<`;

  return (
    <Motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <h3 style={{
        borderBottom: `2px solid ${COLORS.border}`, paddingBottom: '10px',
        color: COLORS.textPrimary, fontFamily: FONTS.heading, margin: '0 0 24px 0'
      }}>
        PERFIL BIOMÉTRICO
      </h3>

      {/* Foto + datos */}
      <div style={{ display: 'flex', gap: '25px' }}>
        <div style={{
          width: '140px', height: '170px', backgroundColor: COLORS.background,
          border: `4px solid ${COLORS.surface}`, boxShadow: SHADOWS.md,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: RADIUS.xs, overflow: 'hidden', flexShrink: 0
        }}>
          {photoURL ? (
            <img src={photoURL} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={60} color={COLORS.borderLight} />
          )}
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.8rem', fontFamily: FONTS.mono }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>TITULAR</label>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: COLORS.textPrimary }}>{nombre}</div>
          </div>
          <div>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>PAÍSES</label>
            <div style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{countriesCount}</div>
          </div>
          <div>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>VIAJES</label>
            <div style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{tripsCount}</div>
          </div>
        </div>
      </div>

      {/* Nivel de viajero + barra de progreso Duolingo-style */}
      <div style={{
        marginTop: '24px', padding: '16px', backgroundColor: COLORS.background,
        border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{
            fontSize: '0.85rem', fontWeight: '800', color: level.color,
            fontFamily: FONTS.heading, display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{level.icon}</span> {level.label}
          </span>
          {next.level && (
            <span style={{ fontSize: '0.7rem', color: COLORS.textSecondary, fontFamily: FONTS.mono }}>
              {next.remaining} país{next.remaining !== 1 ? 'es' : ''} → {next.level.icon} {next.level.label}
            </span>
          )}
        </div>

        {/* Barra de progreso */}
        {next.level ? (
          <div style={{
            height: '8px', borderRadius: RADIUS.full, backgroundColor: COLORS.border, overflow: 'hidden'
          }}>
            <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(next.progress * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: RADIUS.full,
                background: `linear-gradient(90deg, ${level.color}, ${next.level.color})`,
                transition: TRANSITIONS.slow
              }}
            />
          </div>
        ) : (
          <div style={{
            fontSize: '0.75rem', color: COLORS.textSecondary, fontStyle: 'italic', fontFamily: FONTS.body
          }}>
            🏆 Nivel máximo alcanzado — eres una leyenda.
          </div>
        )}
      </div>

      {/* MRZ line */}
      <div style={{
        marginTop: 'auto', padding: '12px', backgroundColor: COLORS.background,
        border: `1px dashed ${COLORS.border}`, borderRadius: RADIUS.sm,
        fontSize: '0.7rem', color: COLORS.textSecondary, letterSpacing: '1px',
        fontFamily: FONTS.mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {mrzLine}
      </div>
    </Motion.div>
  );
};

export default PerfilBiometrico;