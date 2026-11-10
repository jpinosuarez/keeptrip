import React, { useMemo, useCallback } from 'react';
import { BarChart3, Shield, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '@app/providers';
import { ENABLE_GAMIFICATION, ENABLE_TRAVEL_STATS } from '@shared/config';
import TravelerProgress from './TravelerProgress';
import AchievementsGrid from './AchievementsGrid';
import TravelStatsDashboard from './components/TravelStatsDashboard';
import CountryEmblemGrid from './components/CountryEmblemGrid';
import {
  calculateCountryEmblems,
  calculateXPBreakdown,
  getNextAchievableBadges,
} from '../model/achievementsEngine';
import {
  DEFAULT_CONQUEST_COLOR,
  isConquestColorUnlocked as checkConquestUnlocked,
  resolveConquestColor,
} from '../model/travelerLevel';
import { cn } from '@shared/lib/utils/cn';

const VALID_TABS = ['stats', 'emblems', 'badges'];

/**
 * TravelerHub v3 — 3-tab showcase (stats | emblems | badges) with URL-synced
 * tab state, a persistent TravelerProgress header anchor, and 100% in-memory
 * gamification derivation (zero extra Firestore reads).
 */
export default function TravelerHub({
  paisesVisitados = [],
  bitacora = [],
  bitacoraData = {},
  todasLasParadas = [],
  userProfile: propProfile = null,
  achievementsWithProgress = [],
  xpBreakdown: propXpBreakdown = null,
  countryEmblems: propCountryEmblems = null,
  nextAchievableBadges: propNextBadges = null,
  conquestColor: propConquestColor = null,
  isConquestColorUnlocked: propConquestUnlocked = null,
}) {
  const { t } = useTranslation('hub');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = useAuth() || {};
  const toast = useToast?.() || {};
  const pushToast = toast.pushToast || (() => {});
  const effectiveProfile = propProfile || auth.userProfile || null;

  const rawTab = searchParams.get('tab');
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : 'stats';

  const handleTabChange = useCallback(
    (tabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', tabId);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Build composite trips in-memory (bitacora + its stops) for the engines.
  const compositeViajes = useMemo(() => {
    const stopsByTrip = new Map();
    if (Array.isArray(todasLasParadas)) {
      todasLasParadas.forEach((parada) => {
        const tripId = parada?.viajeId || parada?.tripId;
        if (!tripId) return;
        if (!stopsByTrip.has(tripId)) stopsByTrip.set(tripId, []);
        stopsByTrip.get(tripId).push(parada);
      });
    }
    return (Array.isArray(bitacora) ? bitacora : []).map((stub) => {
      const rich = bitacoraData?.[stub.id] || {};
      const paradas = rich.paradas || stub.paradas || stopsByTrip.get(stub.id) || [];
      return { ...stub, ...rich, paradas };
    });
  }, [bitacora, bitacoraData, todasLasParadas]);

  const resolvedXpBreakdown = useMemo(
    () => propXpBreakdown || calculateXPBreakdown(compositeViajes, effectiveProfile),
    [propXpBreakdown, compositeViajes, effectiveProfile],
  );

  const resolvedEmblems = useMemo(() => {
    if (Array.isArray(propCountryEmblems) && propCountryEmblems.length > 0) return propCountryEmblems;
    return calculateCountryEmblems(compositeViajes, effectiveProfile, { includeLocked: false });
  }, [propCountryEmblems, compositeViajes, effectiveProfile]);

  const allEmblemsWithLocked = useMemo(
    () => calculateCountryEmblems(compositeViajes, effectiveProfile, { includeLocked: true }),
    [compositeViajes, effectiveProfile],
  );

  const resolvedNextBadges = useMemo(
    () =>
      Array.isArray(propNextBadges)
        ? propNextBadges
        : getNextAchievableBadges(achievementsWithProgress, 2),
    [propNextBadges, achievementsWithProgress],
  );

  const totalXP = resolvedXpBreakdown?.totalXP ?? 0;
  const resolvedUnlocked =
    propConquestUnlocked !== null ? propConquestUnlocked : checkConquestUnlocked(totalXP);
  const resolvedColor =
    propConquestColor || resolveConquestColor(effectiveProfile, totalXP) || DEFAULT_CONQUEST_COLOR;

  const handleSelectConquestColor = useCallback(
    async (hex) => {
      try {
        if (auth.updateUserProfile) await auth.updateUserProfile({ conquestColor: hex });
        pushToast(t('conquestColorSaved', 'Color de conquista actualizado'), 'success');
      } catch {
        pushToast(t('conquestColorError', 'No se pudo guardar el color'), 'error');
      }
    },
    [auth, pushToast, t],
  );

  const discoveredCount = useMemo(() => {
    const visited = resolvedEmblems.filter((emblem) => (emblem.visitsCount || 0) > 0).length;
    return visited || paisesVisitados.length;
  }, [resolvedEmblems, paisesVisitados.length]);

  const unlockedBadgesCount = useMemo(
    () => achievementsWithProgress.filter((a) => a.unlocked).length,
    [achievementsWithProgress],
  );

  const displayName = effectiveProfile?.displayName || effectiveProfile?.nombre || '';
  const photoURL = effectiveProfile?.photoURL || '';

  return (
    <div className="flex-1 w-full overflow-y-auto px-4 md:px-8 py-6 pb-28 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
            {t('statsDashboard.title', 'Estadísticas de Viaje')}
          </h1>
          <p className="font-sans text-sm text-slate-500">
            {t('statsDashboard.subtitle', 'Resumen de tus destinos, emblemas 3D e insignias de explorador')}
          </p>
        </header>

        {ENABLE_GAMIFICATION && (
          <TravelerProgress
            displayName={displayName}
            photoURL={photoURL}
            countriesCount={discoveredCount}
            tripsCount={bitacora.length}
            xpBreakdown={resolvedXpBreakdown}
            conquestColor={resolvedColor}
            isConquestColorUnlocked={resolvedUnlocked}
            onSelectConquestColor={handleSelectConquestColor}
          />
        )}

        {ENABLE_GAMIFICATION && (
          <div
            role="tablist"
            aria-label={t('tabs.ariaLabel', 'Secciones del Hub de Viajero')}
            className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs"
            data-testid="traveler-hub-tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'stats'}
              onClick={() => handleTabChange('stats')}
              className={cn(
                'min-h-[44px] px-5 py-2 rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-stats"
            >
              <BarChart3 className="text-[#FF6B35]" size={16} />
              <span>{t('tabs.stats', 'Radiografía')}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'emblems'}
              onClick={() => handleTabChange('emblems')}
              className={cn(
                'min-h-[44px] px-5 py-2 rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'emblems' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-emblems"
            >
              <Shield className="text-[#45B0A8]" size={16} />
              <span>{t('tabs.emblems', 'Emblemas de Destino')}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                {discoveredCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'badges'}
              onClick={() => handleTabChange('badges')}
              className={cn(
                'min-h-[44px] px-5 py-2 rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer',
                activeTab === 'badges' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-badges"
            >
              <Trophy className="text-amber-500" size={16} />
              <span>{t('tabs.badges', 'Insignias e Hitos')}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                {unlockedBadgesCount}/{achievementsWithProgress.length}
              </span>
            </button>
          </div>
        )}

        <div className="pt-1">
          {(!ENABLE_GAMIFICATION || activeTab === 'stats') && ENABLE_TRAVEL_STATS && (
            <TravelStatsDashboard trips={bitacora} tripData={bitacoraData} userProfile={effectiveProfile} />
          )}

          {ENABLE_GAMIFICATION && activeTab === 'emblems' && (
            <CountryEmblemGrid
              emblems={resolvedEmblems}
              allEmblemsWithLocked={allEmblemsWithLocked}
              onCreateTrip={(emblem) =>
                navigate(`/trips?new=true&country=${emblem?.countryCode || emblem?.iso2 || ''}`)
              }
            />
          )}

          {ENABLE_GAMIFICATION && activeTab === 'badges' && (
            <AchievementsGrid
              achievementsWithProgress={achievementsWithProgress}
              nextAchievableBadges={resolvedNextBadges}
            />
          )}
        </div>
      </div>
    </div>
  );
}
