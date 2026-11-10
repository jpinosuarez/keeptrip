import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Lock,
  ChevronDown,
  ChevronUp,
  Palette,
  Award,
  Globe2,
  Compass,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CONQUEST_COLOR_THEMES,
  DEFAULT_CONQUEST_COLOR,
  LEVEL_PERKS,
  getTravelerLevel,
} from '../model/travelerLevel';
import { formatLocalizedNumber } from '@shared/lib/utils';
import { cn } from '@shared/lib/utils/cn';

const XP_LEVEL_KEYS = [1, 2, 3, 4, 5];
const XP_LEVEL_ICONS = { 1: '🧭', 2: '🏅', 3: '🎨', 4: '🖼️', 5: '👑' };

const resolveXpLevel = (xp = 0) => {
  let level = 1;
  for (const key of XP_LEVEL_KEYS) {
    if (Number(xp) >= LEVEL_PERKS[key].minXP) level = key;
  }
  return level;
};

/**
 * TravelerProgress v2.0 — persistent hub header anchor.
 * Renders identity + XP 2.0 total, level progress, the Level-3 conquest colour
 * picker, a collapsible XP breakdown drawer and the 5-level perks roadmap.
 */
export default function TravelerProgress({
  displayName,
  photoURL,
  countriesCount = 0,
  tripsCount = 0,
  xpBreakdown = null,
  conquestColor = DEFAULT_CONQUEST_COLOR,
  isConquestColorUnlocked = false,
  onSelectConquestColor,
}) {
  const { t, i18n } = useTranslation('hub');
  const [showXpDrawer, setShowXpDrawer] = useState(false);
  const lang = i18n.language || 'es';

  const totalXP = xpBreakdown?.totalXP ?? countriesCount * 500 + tripsCount * 100;
  const curationXP = xpBreakdown?.curationTotalXP ?? 0;

  const xpLevel = resolveXpLevel(totalXP);
  const currentPerk = LEVEL_PERKS[xpLevel];
  const nextPerk = LEVEL_PERKS[xpLevel + 1] || null;
  const countryLevel = getTravelerLevel(countriesCount);
  const levelIcon = XP_LEVEL_ICONS[xpLevel] || countryLevel.icon;

  const range = nextPerk ? Math.max(1, nextPerk.minXP - currentPerk.minXP) : 1;
  const progressPct = nextPerk
    ? Math.min(100, Math.max(4, Math.round(((totalXP - currentPerk.minXP) / range) * 100)))
    : 100;

  return (
    <section
      className="w-full rounded-[28px] bg-white border border-slate-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-5 md:p-7 space-y-6"
      data-testid="traveler-progress-card"
    >
      {/* Top row: identity, level badge, KPI pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName || 'Explorador'}
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-[#FF6B35]/30 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-heading font-extrabold text-xl shrink-0">
              {String(displayName || 'E').charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] font-mono text-xs font-bold">
              <span>{levelIcon}</span>
              <span>
                {t('levelLabel', 'Nivel')} {xpLevel}
              </span>
            </div>
            <h2 className="mt-1 font-heading font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">
              {displayName || t('defaultTravelerName', 'Explorador Keeptrip')}
            </h2>
            <p className="font-sans text-xs text-slate-500">{currentPerk.defaultPerk}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t('xp2.totalLabel', 'Experiencia Total')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-mono text-lg font-extrabold text-[#FF6B35]" data-testid="traveler-total-xp">
                {formatLocalizedNumber(totalXP, lang)} XP
              </span>
              {curationXP > 0 && (
                <span className="font-mono text-[11px] text-emerald-400 font-bold">
                  (+{formatLocalizedNumber(curationXP, lang)} {t('xp2.curationShort', 'curación')})
                </span>
              )}
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
            <Globe2 className="text-[#FF6B35]" size={16} />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('stats.countries', 'Países')}
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900">{countriesCount}</span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
            <Compass className="text-[#45B0A8]" size={16} />
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('stats.trips', 'Viajes')}
              </span>
              <span className="font-mono text-sm font-extrabold text-slate-900">{tripsCount}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Progress to next XP rank */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans font-bold text-slate-700">
            {nextPerk
              ? t('nextLevelProgress', {
                  level: xpLevel + 1,
                  remaining: Math.max(0, nextPerk.minXP - totalXP),
                  defaultValue: `Próximo rango: Nivel ${xpLevel + 1} (faltan ${Math.max(0, nextPerk.minXP - totalXP)} XP)`,
                })
              : t('maxLevelReached', '¡Has alcanzado el rango máximo de Leyenda!')}
          </span>
          <span className="font-mono font-bold text-slate-600">{progressPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            style={{ width: `${progressPct}%` }}
            className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-amber-500 transition-all duration-500"
          />
        </div>
      </div>

      {/* Conquest colour picker + XP drawer toggle */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3" data-testid="conquest-color-picker">
          <div className="flex items-center gap-2">
            <Palette className="text-[#FF6B35] shrink-0" size={16} />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t('conquestThemes.title', 'Color de Conquista del Mapa')}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {isConquestColorUnlocked
                  ? t('conquestThemes.unlockedSub', 'Beneficio Nivel 3 activo · Personaliza tu mapa')
                  : t('conquestThemes.lockedSub', 'Se desbloquea en Nivel 3 (3.001+ XP)')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {CONQUEST_COLOR_THEMES.map((theme) => {
              const isSelected =
                String(conquestColor || DEFAULT_CONQUEST_COLOR).toLowerCase() === theme.hex.toLowerCase();
              const themeKey = theme.nameKey.replace('hub:', '');
              return (
                <button
                  key={theme.id}
                  type="button"
                  disabled={!isConquestColorUnlocked}
                  onClick={() => isConquestColorUnlocked && onSelectConquestColor?.(theme.hex)}
                  title={
                    isConquestColorUnlocked
                      ? t(themeKey, theme.defaultName)
                      : t(
                          'conquestThemes.lockedTooltip',
                          'Desbloquea en Nivel 3 (Trotamundos) para personalizar el color de tu mapa',
                        )
                  }
                  aria-label={t(themeKey, theme.defaultName)}
                  className={cn(
                    'relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center transition-transform',
                    isConquestColorUnlocked ? 'cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed',
                  )}
                  data-testid={`conquest-swatch-${theme.id}`}
                >
                  <span
                    style={{ backgroundColor: theme.hex }}
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-all',
                      isSelected && 'ring-2 ring-offset-2 ring-slate-900 scale-110',
                    )}
                  >
                    {isConquestColorUnlocked ? (
                      isSelected && <Check className="text-white stroke-[2.5]" size={14} />
                    ) : (
                      <Lock className="text-white/90" size={12} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowXpDrawer((prev) => !prev)}
          className="min-h-[44px] px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer self-start lg:self-auto"
          data-testid="toggle-xp-breakdown-btn"
        >
          <Sparkles className="text-[#FF6B35]" size={14} />
          <span>{t('xp2.breakdownBtn', 'Desglose XP 2.0 y Beneficios')}</span>
          {showXpDrawer ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      {showXpDrawer && (
        <div
          className="pt-4 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-2 gap-4"
          data-testid="xp-breakdown-drawer"
        >
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="text-[#FF6B35]" size={14} />
              <span>{t('xp2.formulaTitle', 'Fórmula XP 2.0 (Exploración + Curación)')}</span>
            </h3>
            <div className="space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-slate-600">
                <span>{t('xp2.countriesLine', 'Países descubiertos (+500 XP c/u)')}</span>
                <span className="font-mono font-bold text-slate-900">
                  +{formatLocalizedNumber(xpBreakdown?.countriesXP ?? countriesCount * 500, lang)} XP
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('xp2.tripsLine', 'Viajes completados (+100 XP c/u)')}</span>
                <span className="font-mono font-bold text-slate-900">
                  +{formatLocalizedNumber(xpBreakdown?.tripsXP ?? tripsCount * 100, lang)} XP
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('xp2.stopsLine', 'Paradas y fotos registradas')}</span>
                <span className="font-mono font-bold text-slate-900">
                  +{formatLocalizedNumber((xpBreakdown?.stopsXP ?? 0) + (xpBreakdown?.photosXP ?? 0), lang)} XP
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200/70">
                <span>{t('xp2.curationLine', 'Bono Curación (Trilogía +30, Crónicas +15, POIs +10)')}</span>
                <span className="font-mono font-bold">+{formatLocalizedNumber(curationXP, lang)} XP</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Award className="text-[#45B0A8]" size={14} />
              <span>{t('perks.roadmapTitle', 'Recompensas por Rango de Viajero')}</span>
            </h3>
            <div className="space-y-1.5">
              {XP_LEVEL_KEYS.map((lvl) => {
                const perk = LEVEL_PERKS[lvl];
                const unlocked = xpLevel >= lvl;
                return (
                  <div
                    key={lvl}
                    className={cn(
                      'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs',
                      unlocked ? 'bg-white border border-slate-200/80 text-slate-800' : 'text-slate-400',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{XP_LEVEL_ICONS[lvl]}</span>
                      <span className="font-bold truncate">{`Nv.${lvl} · ${perk.defaultPerk}`}</span>
                    </div>
                    <span className="font-mono text-[10px] shrink-0">
                      {unlocked ? t('perks.active', 'Activo') : `${formatLocalizedNumber(perk.minXP, lang)} XP`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}