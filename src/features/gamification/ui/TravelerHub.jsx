import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { getTravelerLevel, getNextLevel, TRAVELER_LEVELS } from '../model/travelerLevel';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import AchievementsGrid from './AchievementsGrid';
// DEPRECATED: TravelStatsWidget - now uses new API with logStats hook and variant prop
// import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';
import { styles } from './TravelerHub.styles';
import { COLORS, RADIUS } from '@shared/config';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { Share } from 'lucide-react';
import { useToast } from '@app/providers';
import { BottomSheet, BottomSheetHeader, BottomSheetContent } from '@shared/ui/components';

// Inject shimmer keyframes once
const injectShimmerCSS = () => {
  const id = 'keeptrip-shimmer-anim';
  if (typeof document === 'undefined' || document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @keyframes shimmerSweep {
      0%   { transform: translateX(-100%); }
      60%  { transform: translateX(200%); }
      100% { transform: translateX(200%); }
    }
  `;
  document.head.appendChild(style);
};

/**
 * TravelerHub — 2026 Prestige Edition
 * - Glassmorphic Hero Card with animated level progress ring
 * - canvas-confetti unlock celebration on new achievement detection
 * - AchievementsGrid with 3D Prestige Tokens
 */
const TravelerHub = ({ paisesVisitados, achievementsWithProgress }) => {
  const { isMobile } = useWindowSize(768);
  const { t } = useTranslation('hub');
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('hub'));
  injectShimmerCSS();

  const [showLevels, setShowLevels] = useState(false);

  const countryCount = paisesVisitados.length;
  const level = getTravelerLevel(countryCount);
  const next  = getNextLevel(countryCount);
  const { pushToast } = useToast();
  
  // DEPRECATED: statsArray - used for old TravelStatsWidget integration
  // Stats are now properly integrated in DashboardPage and TripsPage

  // ── Confetti on first unlock detection (Guardrail #3) ──
  const prevUnlockedCount = useRef(null);

  useEffect(() => {
    if (!achievementsWithProgress) return;
    const currentUnlocked = achievementsWithProgress.filter((a) => a.unlocked).length;

    if (prevUnlockedCount.current !== null && currentUnlocked > prevUnlockedCount.current) {
      // New achievement unlocked — fire confetti in tier color
      const lastUnlocked = achievementsWithProgress.filter((a) => a.unlocked).at(-1);
      const tierColor = lastUnlocked
        ? { bronze: '#CD7F32', silver: '#94A3B8', gold: '#FBBF24', platinum: '#8B5CF6', diamond: '#22D3EE' }[lastUnlocked.tier]
        : COLORS.atomicTangerine;

      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.55 },
          colors: [tierColor, '#fff', tierColor + 'aa'],
          zIndex: 9999,
        });
      });

      if (lastUnlocked) {
        const name = t(`achievements.${lastUnlocked.id}`, lastUnlocked.id);
        pushToast(`🏆 ¡Desbloqueado! ${name}`, 'success');
      }
    }

    prevUnlockedCount.current = currentUnlocked;
  }, [achievementsWithProgress, pushToast, t]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: tNav('hub'), url }); } catch {
        // Shareexnıot available
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        pushToast(t('shareCopied'), 'success');
      } catch {
        // Clipboard not available
      }
    }
  }, [pushToast, tNav, t]);

  const progressPercent = Math.round((next.progress || 0) * 100);

  return (
    <div style={styles.container(isMobile)}>
      <div style={styles.scrollArea} className="custom-scroll">

        {/* ── Glassmorphic Hero Card ── */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          style={{
            ...styles.heroCard(level.color),
            // Glassmorphic overlay
            background: `linear-gradient(135deg, ${level.color}22, ${level.color}08)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${level.color}30`,
            boxShadow: `0 8px 40px ${level.color}30, inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          {/* Ambient glow blob */}
          <div style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${level.color}40, transparent 70%)`,
            top: '-60px',
            right: '-60px',
            pointerEvents: 'none',
          }} />

          <div style={styles.heroLeft}>
            {/* Level Icon — floating on a glowing ring */}
            <div style={{
              position: 'relative',
              width: '72px',
              height: '72px',
              flexShrink: 0,
            }}>
              {/* Ring glow */}
              <div style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: `3px solid ${level.color}60`,
                boxShadow: `0 0 16px ${level.color}60, inset 0 0 8px ${level.color}30`,
              }} />
              <div style={{
                position: 'absolute',
                inset: '8px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${level.color}30, transparent)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.2rem',
                lineHeight: 1,
              }}>
                {level.icon}
              </div>
            </div>

            <div>
              <h2 style={styles.heroLabel}>{level.label}</h2>
              <p style={styles.heroSublabel}>
                {next.level
                  ? `${next.remaining} ${next.remaining !== 1 ? t('goals.units.countries_other') : t('goals.units.countries_one')} para ${next.level.label}`
                  : t('progress.maxLevel')}
              </p>

              {/* Progress bar */}
              {next.level && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={styles.heroProgressOuter}>
                    <Motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      style={styles.heroProgressInner(level.color)}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: level.color }}>
                    {progressPercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={styles.heroRight}>
            <Motion.button
              type="button"
              onClick={handleShare}
              style={styles.shareBtn}
              aria-label={t('share')}
              title={t('share')}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share size={18} />
            </Motion.button>

            <Motion.button
              type="button"
              onClick={() => setShowLevels(true)}
              style={styles.levelsBtn}
              aria-label={t('levels.viewAll')}
              title={t('levels.viewAll')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('levels.viewAll')}
            </Motion.button>
          </div>
        </Motion.div>

        {/* ── Global Stats ── */}
        {/* DEPRECATED: TravelStatsWidget integration removed - use DashboardPage or TripsPage for updated stats display */}
        {/* Stats are now properly displayed in:
            - Home: DashboardPage (via WelcomeBento with variant="home")
            - Trips: TripsPage (via TripCommandBar with variant="trips")
        */}

        {/* ── Achievement Grid ── */}
        <AchievementsGrid achievementsWithProgress={achievementsWithProgress} isMobile={isMobile} />

        <BottomSheet isOpen={showLevels} onClose={() => setShowLevels(false)} ariaLabel={t('levels.title')}>
          <BottomSheetHeader />
          <BottomSheetContent>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: COLORS.charcoalBlue }}>
                  {t('levels.title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLevels(false)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: COLORS.textSecondary,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {t('common.close')}
                </button>
              </div>
              {TRAVELER_LEVELS.map((lvl) => (
                <div key={lvl.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: RADIUS.lg,
                  background: lvl.id === level.id ? `${lvl.color}20` : 'rgba(255,255,255,0.6)',
                  border: lvl.id === level.id ? `1px solid ${lvl.color}` : '1px solid rgba(0,0,0,0.08)',
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: lvl.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {lvl.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: COLORS.charcoalBlue }}>{lvl.label}</div>
                    <div style={{ fontSize: '0.8rem', color: COLORS.textSecondary }}>
                      {t('levels.requirement', { count: lvl.min })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </div>
    </div>
  );
};

export default TravelerHub;
