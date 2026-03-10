import React from 'react';
import { motion as Motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTravelerLevel, getNextLevel } from '../model/travelerLevel';
import { COLORS, SHADOWS, RADIUS, FONTS, TRANSITIONS } from '@shared/config';

/**
 * TravelerProgress — shows avatar, level badge, and an animated progress bar
 * toward the next traveler level. Replaces the legacy "PerfilBiometrico" component.
 *
 * @param {{
 *   displayName: string,
 *   photoURL: string|null,
 *   countriesCount: number,
 *   tripsCount: number
 * }} props
 */
const TravelerProgress = ({ displayName, photoURL, countriesCount = 0, tripsCount = 0 }) => {
  const { t } = useTranslation('hub');
  const level = getTravelerLevel(countriesCount);
  const next = getNextLevel(countriesCount);
  const name = displayName || t('progress.fallbackName');

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <h3 style={{
        borderBottom: `2px solid ${COLORS.border}`,
        paddingBottom: '10px',
        color: COLORS.textPrimary,
        fontFamily: FONTS.heading,
        margin: '0 0 24px 0',
      }}>
        {t('progress.title')}
      </h3>

      {/* Avatar + stats */}
      <div style={{ display: 'flex', gap: '25px' }}>
        <div style={{
          width: '140px',
          height: '170px',
          backgroundColor: COLORS.background,
          border: `4px solid ${COLORS.surface}`,
          boxShadow: SHADOWS.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: RADIUS.xs,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {photoURL ? (
            <img src={photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={60} color={COLORS.borderLight} />
          )}
        </div>

        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          fontSize: '0.8rem',
          fontFamily: FONTS.mono,
        }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>
              {t('progress.labelName')}
            </label>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: COLORS.textPrimary }}>
              {name}
            </div>
          </div>
          <div>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>
              {t('stats.countries')}
            </label>
            <div style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{countriesCount}</div>
          </div>
          <div>
            <label style={{ color: COLORS.textSecondary, fontSize: '0.65rem', letterSpacing: '1.5px' }}>
              {t('stats.trips')}
            </label>
            <div style={{ fontWeight: 'bold', color: COLORS.textPrimary }}>{tripsCount}</div>
          </div>
        </div>
      </div>

      {/* Level badge + progress bar */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: COLORS.background,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.md,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '800',
            color: level.color,
            fontFamily: FONTS.heading,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ fontSize: '1.2rem' }}>{level.icon}</span> {level.label}
          </span>
          {next.level && (
            <span style={{ fontSize: '0.7rem', color: COLORS.textSecondary, fontFamily: FONTS.mono }}>
              {next.remaining} {next.remaining !== 1 ? t('goals.units.countries_other') : t('goals.units.countries_one')} → {next.level.icon} {next.level.label}
            </span>
          )}
        </div>

        {next.level ? (
          <div style={{
            height: '8px',
            borderRadius: RADIUS.full,
            backgroundColor: COLORS.border,
            overflow: 'hidden',
          }}>
            <Motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(next.progress * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: RADIUS.full,
                background: `linear-gradient(90deg, ${level.color}, ${next.level.color})`,
                transition: TRANSITIONS.slow,
              }}
            />
          </div>
        ) : (
          <div style={{
            fontSize: '0.75rem',
            color: COLORS.textSecondary,
            fontStyle: 'italic',
            fontFamily: FONTS.body,
          }}>
            {t('progress.maxLevel')}
          </div>
        )}
      </div>
    </Motion.div>
  );
};

export default TravelerProgress;
