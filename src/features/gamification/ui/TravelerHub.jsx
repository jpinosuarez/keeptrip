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

  const allEmblemsWithLocked = useMemo(() => {
    const localAtlas = calculateCountryEmblems(compositeViajes, effectiveProfile, { includeLocked: true });
    // DEV God Mode injects the full simulated atlas through `countryEmblems`;
    // prefer it only when it is richer, so the real locked atlas never shrinks.
    if (Array.isArray(propCountryEmblems) && propCountryEmblems.length > localAtlas.length) {
      return propCountryEmblems;
    }
    return localAtlas;
  }, [propCountryEmblems, compositeViajes, effectiveProfile]);

  const resolvedNextBadges = useMemo(
    () =>
      Array.isArray(propNextBadges)
        ? propNextBadges
        : getNextAchievableBadges(achievementsWithProgress, 2),
    [propNextBadges, achievementsWithProgress],
  );

  const isDiscoveredEmblem = useCallback(
    (emblem) => (emblem?.visitsCount || 0) > 0 || emblem?.status === 'origin_unvisited',
    [],
  );

  const discoveredCount = useMemo(
    () => resolvedEmblems.filter(isDiscoveredEmblem).length || paisesVisitados.length,
    [resolvedEmblems, paisesVisitados.length, isDiscoveredEmblem],
  );

  const unlockedBadgesCount = useMemo(
    () => achievementsWithProgress.filter((a) => a.unlocked).length,
    [achievementsWithProgress],
  );

  const displayName = effectiveProfile?.displayName || effectiveProfile?.nombre || '';
  const photoURL = effectiveProfile?.photoURL || '';

  return (
    <div className="flex-1 w-full min-h-0 overflow-y-auto px-4 md:px-8 py-4 md:py-6 pb-28 md:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="hidden md:block space-y-1">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
            {t('hubTitle', 'Tu Progreso de Explorador')}
          </h1>
          <p className="font-sans text-sm text-slate-500">
            {t('hubSubtitle', 'Tus estadísticas de viaje, emblemas 3D e insignias de ruta')}
          </p>
        </header>

        {ENABLE_GAMIFICATION && (
          <TravelerProgress
            displayName={displayName}
            photoURL={photoURL}
            countriesCount={discoveredCount}
            tripsCount={bitacora.length}
            unlockedBadgesCount={unlockedBadgesCount}
            totalBadgesCount={achievementsWithProgress.length}
            xpBreakdown={resolvedXpBreakdown}
          />
        )}

        {ENABLE_GAMIFICATION && (
          <div
            role="tablist"
            aria-label={t('tabs.ariaLabel', 'Secciones del Hub de Viajero')}
            className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex sm:flex-nowrap sm:items-center sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl sm:rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs"
            data-testid="traveler-hub-tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'stats'}
              onClick={() => handleTabChange('stats')}
              className={cn(
                'min-h-[44px] min-w-0 px-2 sm:px-5 py-2 rounded-xl sm:rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer',
                activeTab === 'stats' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-stats"
            >
              <BarChart3 className="text-[#FF6B35] shrink-0" size={16} />
              <span>{t('tabs.stats', 'Estadísticas')}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'emblems'}
              onClick={() => handleTabChange('emblems')}
              className={cn(
                'min-h-[44px] min-w-0 px-2 sm:px-5 py-2 rounded-xl sm:rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer',
                activeTab === 'emblems' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-emblems"
            >
              <Shield className="text-[#45B0A8] shrink-0" size={16} />
              <span className="sm:hidden">{t('tabs.emblemsShort', 'Emblemas')}</span>
              <span className="hidden sm:inline">{t('tabs.emblems', 'Emblemas de Destino')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 shrink-0">
                {discoveredCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'badges'}
              onClick={() => handleTabChange('badges')}
              className={cn(
                'min-h-[44px] min-w-0 px-2 sm:px-5 py-2 rounded-xl sm:rounded-full font-sans text-xs md:text-sm font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer',
                activeTab === 'badges' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900',
              )}
              data-testid="hub-tab-badges"
            >
              <Trophy className="text-amber-500 shrink-0" size={16} />
              <span className="sm:hidden">{t('tabs.badgesShort', 'Insignias')}</span>
              <span className="hidden sm:inline">{t('tabs.badges', 'Insignias e Hitos')}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 shrink-0">
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
