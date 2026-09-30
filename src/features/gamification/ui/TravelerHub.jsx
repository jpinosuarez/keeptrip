import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { getTravelerLevel, getNextLevel, TRAVELER_LEVELS } from '../model/travelerLevel';
import { cn } from '@shared/lib/utils/cn';
import AchievementsGrid from './AchievementsGrid';
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
  const { t } = useTranslation('hub');
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('hub'));
  injectShimmerCSS();

  const [showLevels, setShowLevels] = useState(false);

  const countryCount = paisesVisitados.length;
  const level = getTravelerLevel(countryCount);
  const next  = getNextLevel(countryCount);
  const { pushToast } = useToast();
  
  const prevUnlockedCount = useRef(null);

  useEffect(() => {
    if (!achievementsWithProgress) return;
    const currentUnlocked = achievementsWithProgress.filter((a) => a.unlocked).length;

    if (prevUnlockedCount.current !== null && currentUnlocked > prevUnlockedCount.current) {
      const lastUnlocked = achievementsWithProgress.filter((a) => a.unlocked).at(-1);
      const tierColor = lastUnlocked
        ? { bronze: '#CD7F32', silver: '#94A3B8', gold: '#FBBF24', platinum: '#8B5CF6', diamond: '#22D3EE' }[lastUnlocked.tier]
        : '#ff7e42';

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
        // Share not available
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
    <div className="w-full h-full flex flex-col md:pr-5 md:pb-5 overflow-hidden box-border">
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1.5 pb-10 custom-scroll">

        {/* ── Glassmorphic Hero Card ── */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="relative px-6 py-[22px] md:px-8 md:py-6 rounded-3xl mb-5 flex flex-wrap items-center justify-between gap-[18px] overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${level.color}22, ${level.color}08)`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${level.color}30`,
            boxShadow: `0 8px 40px ${level.color}30, inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          {/* Ambient glow blob */}
          <div 
            className="absolute w-[220px] h-[220px] rounded-full top-[-60px] right-[-60px] pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${level.color}40, transparent 70%)`,
            }} 
          />

          <div className="flex flex-col gap-2 z-[1]">
            <div className="flex items-center gap-4">
              {/* Level Icon — floating on a glowing ring */}
              <div className="relative w-[72px] h-[72px] shrink-0">
                {/* Ring glow */}
                <div 
                  className="absolute inset-0 rounded-full border-[3px]"
                  style={{
                    borderColor: `${level.color}60`,
                    boxShadow: `0 0 16px ${level.color}60, inset 0 0 8px ${level.color}30`,
                  }} 
                />
                <div 
                  className="absolute inset-2 rounded-full flex items-center justify-center text-[2.2rem] leading-none"
                  style={{
                    background: `radial-gradient(circle, ${level.color}30, transparent)`,
                  }}
                >
                  {level.icon}
                </div>
              </div>

              <div>
                <h2 className="m-0 text-2xl font-black text-charcoalBlue leading-tight font-heading">{level.label}</h2>
                <p className="m-0 text-[0.85rem] font-bold text-text-primary font-body">
                  {next.level
                    ? `${next.remaining} ${next.remaining !== 1 ? t('goals.units.countries_other') : t('goals.units.countries_one')} para ${next.level.label}`
                    : t('progress.maxLevel')}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {next.level && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="w-[200px] max-w-full h-2 rounded-full bg-black/10 overflow-hidden">
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ background: level.color }}
                  />
                </div>
                <span className="text-[0.72rem] font-black" style={{ color: level.color }}>
                  {progressPercent}%
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 z-[1] flex-wrap">
            <Motion.button
              type="button"
              onClick={handleShare}
              className="w-11 h-11 p-0 border-none bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg transition-all"
              aria-label={t('share')}
              title={t('share')}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share size={18} className="text-charcoalBlue" />
            </Motion.button>

            <Motion.button
              type="button"
              onClick={() => setShowLevels(true)}
              className="px-6 py-2.5 rounded-full bg-white text-charcoalBlue font-black text-[0.7rem] uppercase tracking-widest shadow-lg border-none cursor-pointer"
              aria-label={t('levels.viewAll')}
              title={t('levels.viewAll')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t('levels.viewAll')}
            </Motion.button>
          </div>
        </Motion.div>

        {/* ── Achievement Grid ── */}
        <AchievementsGrid achievementsWithProgress={achievementsWithProgress} />

        <BottomSheet isOpen={showLevels} onClose={() => setShowLevels(false)} ariaLabel={t('levels.title')}>
          <BottomSheetHeader />
          <BottomSheetContent>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="m-0 text-[1.1rem] font-black text-charcoalBlue font-heading">
                  {t('levels.title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLevels(false)}
                  className="border-none bg-none text-text-secondary font-bold cursor-pointer p-0"
                >
                  {t('common.close')}
                </button>
              </div>
              {TRAVELER_LEVELS.map((lvl) => (
                <div key={lvl.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                    lvl.id === level.id ? "border-solid" : "border-black/5 bg-white/60"
                  )}
                  style={{
                    backgroundColor: lvl.id === level.id ? `${lvl.color}20` : undefined,
                    borderColor: lvl.id === level.id ? lvl.color : undefined,
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[1.2rem] shrink-0 shadow-sm" style={{ backgroundColor: lvl.color }}>
                    {lvl.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-charcoalBlue leading-tight">{lvl.label}</div>
                    <div className="text-[0.8rem] text-text-secondary">
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
