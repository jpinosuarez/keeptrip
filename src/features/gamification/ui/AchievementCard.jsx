import React from 'react';
import { Lock, Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TIER_COLORS } from '../model/achievementDefinitions';
import { formatLocalizedNumber } from '@shared/lib/utils';
import { cn } from '@shared/lib/utils/cn';

const TIER_STEPS = [
  { key: 'bronze', labelKey: 'achievements.tiers.bronze', defaultLabel: 'Bronce', icon: '🥉' },
  { key: 'silver', labelKey: 'achievements.tiers.silver', defaultLabel: 'Plata', icon: '🥈' },
  { key: 'gold', labelKey: 'achievements.tiers.gold', defaultLabel: 'Oro', icon: '🥇' },
  { key: 'legend', labelKey: 'achievements.tiers.legend', defaultLabel: 'Leyenda', icon: '👑' },
];

export default function AchievementCard({ achievement, unlocked: propUnlocked }) {
  const { t, i18n } = useTranslation('hub');
  if (!achievement) return null;

  const lang = i18n.language || 'es';
  const {
    id,
    icon = '🏆',
    type = 'milestone',
    tiers = null,
    unlocked: achUnlocked,
    current = 0,
    progress = 0,
    target = 1,
    attainedTierIndex = -1,
    nextTierThreshold = null,
    defaultTitle,
    defaultDescription,
    unitLabel = '',
  } = achievement;

  const isUnlocked = Boolean(propUnlocked ?? achUnlocked);
  const isTiered = type === 'tiered' && Array.isArray(tiers) && tiers.length > 0;
  const currentValue = Number(current) || Number(progress) * Number(target) || 0;

  const title = t(`achievements.${id}`, defaultTitle || id);
  const description = t(`achievements.${id}_desc`, defaultDescription || '');

  const activeStep =
    isTiered && attainedTierIndex >= 0
      ? TIER_STEPS[Math.min(attainedTierIndex, TIER_STEPS.length - 1)]
      : null;
  const nextStep =
    isTiered && attainedTierIndex + 1 < tiers.length
      ? TIER_STEPS[Math.min(attainedTierIndex + 1, TIER_STEPS.length - 1)]
      : null;

  const effectiveTarget = isTiered
    ? nextTierThreshold ?? tiers[tiers.length - 1]
    : target || achievement?.criteria?.threshold || 1;

  const barPct =
    isUnlocked && (!isTiered || !nextTierThreshold)
      ? 100
      : Math.min(99, Math.max(4, Math.round((currentValue / Math.max(1, effectiveTarget)) * 100)));

  return (
    <div
      className={cn(
        'relative rounded-[24px] border p-5 flex flex-col justify-between gap-4 transition-all duration-300',
        isUnlocked
          ? type === 'milestone'
            ? 'bg-gradient-to-br from-amber-50/70 via-white to-white border-amber-300/80 shadow-[0_6px_24px_rgba(245,158,11,0.10)]'
            : 'bg-white border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
          : 'bg-slate-50/80 border-slate-200/70 text-slate-500 opacity-90',
      )}
      data-testid={`achievement-card-${id}`}
      data-type={type}
      data-unlocked={String(isUnlocked)}
    >
      {/* Icon + type/tier pill */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-2xs',
            isUnlocked
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-200/70 border-slate-300/80 grayscale opacity-70',
          )}
        >
          <span>{icon}</span>
        </div>

        {isTiered ? (
          <span
            style={
              activeStep
                ? {
                    backgroundColor: `${TIER_COLORS[activeStep.key] || '#FF6B35'}18`,
                    color: TIER_COLORS[activeStep.key] || '#FF6B35',
                    borderColor: `${TIER_COLORS[activeStep.key] || '#FF6B35'}40`,
                  }
                : undefined
            }
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border',
              !activeStep && 'bg-slate-200/70 text-slate-500 border-slate-300',
            )}
            data-testid={`achievement-tier-pill-${id}`}
          >
            {activeStep ? (
              <>
                <span>{activeStep.icon}</span>
                <span>{t(activeStep.labelKey, activeStep.defaultLabel)}</span>
              </>
            ) : (
              <>
                <Lock size={10} />
                <span>{t('achievements.tiers.locked', 'Evolutiva')}</span>
              </>
            )}
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border',
              isUnlocked
                ? 'bg-amber-500/15 text-amber-700 border-amber-400/50'
                : 'bg-slate-200/70 text-slate-500 border-slate-300',
            )}
            data-testid={`achievement-milestone-pill-${id}`}
          >
            <Sparkles className={isUnlocked ? 'text-amber-500' : 'text-slate-400'} size={10} />
            <span>{t('achievements.milestoneTag', 'Hito Único')}</span>
          </span>
        )}
      </div>

      {/* Title + description (replaces the broken criteriaMet key) */}
      <div className="space-y-1">
        <h4
          className={cn(
            'font-heading font-extrabold text-base tracking-tight',
            isUnlocked ? 'text-slate-900' : 'text-slate-700',
          )}
        >
          {title}
        </h4>
        <p className="font-sans text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
      {isTiered ? (
        <div className="pt-2 border-t border-slate-100 space-y-2.5" data-testid={`achievement-stepper-${id}`}>
          <div className="grid grid-cols-4 gap-1">
            {tiers.slice(0, 4).map((thresholdValue, idx) => {
              const stepMeta = TIER_STEPS[idx] || TIER_STEPS[0];
              const stepCompleted = currentValue >= thresholdValue;
              const isCurrentTarget = !stepCompleted && (idx === 0 || currentValue >= tiers[idx - 1]);
              return (
                <div
                  key={stepMeta.key}
                  className={cn(
                    'px-1.5 py-1 rounded-lg border text-center flex flex-col items-center justify-center transition-colors',
                    stepCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                      : isCurrentTarget
                        ? 'bg-[#FF6B35]/10 border-[#FF6B35]/40 text-[#FF6B35]'
                        : 'bg-slate-100/80 border-slate-200/70 text-slate-400',
                  )}
                >
                  <span className="text-[10px] leading-none">{stepMeta.icon}</span>
                  <span className="font-mono text-[10px] font-bold mt-0.5">
                    {formatLocalizedNumber(thresholdValue, lang)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-sans font-semibold text-slate-600">
                {nextStep
                  ? `${t('achievements.nextTierLabel', 'Siguiente')}: ${t(nextStep.labelKey, nextStep.defaultLabel)}`
                  : t('achievements.maxTierReached', '¡Nivel Leyenda completado!')}
              </span>
              <span className="font-mono font-bold text-slate-700">
                {formatLocalizedNumber(currentValue, lang)} / {formatLocalizedNumber(effectiveTarget, lang)}{' '}
                {unitLabel}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{ width: `${barPct}%` }}
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  nextStep ? 'bg-[#FF6B35]' : 'bg-emerald-500',
                )}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          {isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 font-sans font-bold text-emerald-600">
              <Check className="stroke-[2.5]" size={14} />
              <span>{t('achievements.milestoneCompleted', 'Hito desbloqueado')}</span>
            </span>
          ) : (
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-sans text-slate-500">{t('achievements.progressLabel', 'Progreso')}</span>
                <span className="font-mono font-bold text-slate-600">
                  {formatLocalizedNumber(currentValue, lang)} / {formatLocalizedNumber(effectiveTarget, lang)}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200/70 overflow-hidden">
                <div style={{ width: `${barPct}%` }} className="h-full rounded-full bg-[#FF6B35]" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}