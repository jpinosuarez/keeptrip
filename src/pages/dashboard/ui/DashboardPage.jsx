import React, { lazy, Suspense, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Map } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useLogStats } from '@features/gamification/model';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';

import WelcomeBento from './components/WelcomeBento';
import BentoTripGrid from './components/BentoTripGrid';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const HomeMap = lazy(() => import('@features/mapa/ui/HomeMap'));

const DashboardPage = ({ countriesVisited = [], log = [], logData = {}, loading = false, isError = false, fetchError = null }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  const { isMobile } = useWindowSize();
  useDocumentTitle(tNav('home'));

  const name = usuario?.displayName ? usuario.displayName.split(' ')[0] : t('fallbackName');
  const recentTrips = useMemo(() => {
    return [...log].sort((a, b) => {
      const dateA = a.fechaInicio ? new Date(a.fechaInicio).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.fechaInicio ? new Date(b.fechaInicio).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA;
      return 0;
    });
  }, [log]);

  const visibleRecentTrips = useMemo(
    () => recentTrips.slice(0, 4),
    [recentTrips]
  );
  const isNewTraveler = log.length === 0;
  const [mapRenderKey, setMapRenderKey] = useState(0);

  const [isMapRequested, setIsMapRequested] = useState(false);

  // Performance architecture: Interaction-based deferred map loading.
  React.useEffect(() => {
    let interactionFired = false;
    let fallbackTimer;

    const onUserInteraction = () => {
      if (interactionFired) return;
      interactionFired = true;
      
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setIsMapRequested(true), { timeout: 2000 });
      } else {
        setIsMapRequested(true);
      }
      
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener('scroll', onUserInteraction, { capture: true });
      window.removeEventListener('mousemove', onUserInteraction, { capture: true });
      window.removeEventListener('touchstart', onUserInteraction, { capture: true });
      window.removeEventListener('keydown', onUserInteraction, { capture: true });
    };

    window.addEventListener('scroll', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('mousemove', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true, once: true, passive: true });

    fallbackTimer = setTimeout(() => {
      onUserInteraction();
    }, 10000);

    return () => {
      removeListeners();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  const tripDataMap = useMemo(() => {
    if (logData && typeof logData === 'object' && !Array.isArray(logData)) {
      return logData;
    }

    const fallbackMap = {};
    log.forEach((trip) => {
      if (trip?.id) fallbackMap[trip.id] = trip;
    });
    return fallbackMap;
  }, [log, logData]);

  const logStatsDashboard = useLogStats(log, tripDataMap);

  const mapFallback = (
    <div className="relative w-full h-full min-h-[144px] lg:min-h-[220px] flex justify-center items-center p-4 overflow-hidden bg-[#e0e6ed] rounded-2xl" role="status" aria-live="polite">
      <div className="absolute inset-0 blur-[0.2px]" aria-hidden="true">
        <div className="absolute w-[40%] aspect-square top-[10%] right-[25%] rounded-full bg-white blur-[30px] opacity-50" />
        <div className="absolute w-[50%] aspect-square left-[10%] bottom-[10%] rounded-full bg-white blur-[40px] opacity-40" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:24px_24px] [mask-image:radial-gradient(circle_at_50%_50%,black_20%,transparent_80%)]" />
      </div>
      <div className="relative z-[1] flex flex-col items-center gap-3 p-4 text-center">
        <AlertTriangle size={20} className="text-warning" />
        <p className="m-0 text-[0.9rem] font-semibold text-text-secondary max-w-[34ch]">{t('mapUnavailable')}</p>
        <button
          type="button"
          className="border border-atomicTangerine/30 rounded-full bg-atomicTangerine text-white min-h-[44px] px-[18px] py-[10px] text-[0.86rem] font-bold cursor-pointer tracking-wide shadow-[0_10px_20px_theme(colors.atomicTangerine/0.4)]"
          onClick={() => setMapRenderKey((prev) => prev + 1)}
        >
          {t('retryMap')}
        </button>
      </div>
    </div>
  );

  const mapLoadingFallback = (
    <div className="relative w-full h-full min-h-[144px] lg:min-h-[220px] flex justify-center items-center p-4 overflow-hidden bg-[#e0e6ed] rounded-2xl" role="status" aria-live="polite">
      <div className="absolute inset-0 blur-[0.2px]" aria-hidden="true">
        <div className="absolute w-[40%] aspect-square top-[10%] right-[25%] rounded-full bg-white blur-[30px] opacity-50" />
        <div className="absolute w-[50%] aspect-square left-[10%] bottom-[10%] rounded-full bg-white blur-[40px] opacity-40" />
        <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:24px_24px] [mask-image:radial-gradient(circle_at_50%_50%,black_20%,transparent_80%)]" />
      </div>
      <div className="relative z-[1] flex flex-col items-center gap-3 p-4 text-center">
        <p className="m-0 text-[0.9rem] font-semibold text-text-secondary max-w-[34ch]">{t('mapLoading')}</p>
      </div>
    </div>
  );

  const openTripEditor = (tripId) => {
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div className="w-full box-border min-w-0 grid gap-4 p-4 h-full overflow-y-auto overflow-x-hidden grid-cols-1 auto-rows-max pb-[calc(80px+max(16px,env(safe-area-inset-bottom,0px)))] lg:grid-cols-[minmax(350px,5fr)_minmax(400px,7fr)] lg:grid-rows-[auto_1fr] lg:gap-6 lg:p-6 lg:h-full lg:overflow-hidden lg:pb-6">
      <div className="min-w-0 w-full lg:col-start-1 lg:row-start-1 lg:self-stretch">
        <WelcomeBento 
          name={name}
          isNewTraveler={isNewTraveler}
          onNewTrip={openBuscador}
        />
      </div>

      <div className="min-w-0 w-full lg:col-start-2 lg:row-start-1 lg:self-stretch">
        <TravelStatsWidget
          logStats={logStatsDashboard}
          ariaLabel={t('stats.tripSummary')}
          variant="hero"
        />
      </div>

      <div className="min-w-0 w-full lg:col-start-2 lg:row-start-2 lg:min-h-0 lg:h-full">
        <div className="flex flex-col gap-2 w-full h-full min-w-0 min-h-0">
          <div className="flex items-center justify-between flex-shrink-0 gap-2 min-h-[44px]">
            <h2 className="m-0 text-[0.8rem] font-extrabold text-charcoalBlue uppercase tracking-widest leading-none min-w-0 flex-1 font-heading">{t('explorationMap')}</h2>
            <Motion.button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 bg-atomicTangerine/5 border border-atomicTangerine/15 cursor-pointer text-[0.82rem] font-extrabold text-atomicTangerine px-[18px] py-2 min-h-[44px] rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 font-heading"
              aria-label={t('viewFullMap')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('viewFullMap')} <Map size={14} />
            </Motion.button>
          </div>
          <div className="flex items-center justify-center rounded-2xl overflow-hidden w-full min-w-0 min-h-0 shadow-md bg-background relative h-36 sm:h-40 flex-shrink-0 lg:flex-1 lg:h-full">
            <ErrorBoundary fallback={mapFallback}>
              {isMapRequested ? (
                <Suspense fallback={mapLoadingFallback}>
                  <HomeMap key={mapRenderKey} paisesVisitados={countriesVisited} isMobile={isMobile} />
                </Suspense>
              ) : (
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate('/map')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/map');
                    }
                  }}
                  className="relative w-full h-full min-h-[144px] lg:min-h-[220px] flex justify-center items-center p-4 overflow-hidden bg-[#e0e6ed] rounded-2xl cursor-pointer"
                  aria-label={t('map.tapToExploreMap')}
                >
                  <div className="absolute inset-0 blur-[0.2px]" aria-hidden="true">
                    <div className="absolute w-[40%] aspect-square top-[10%] right-[25%] rounded-full bg-white blur-[30px] opacity-50" />
                    <div className="absolute w-[50%] aspect-square left-[10%] bottom-[10%] rounded-full bg-white blur-[40px] opacity-40" />
                    <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[length:24px_24px] [mask-image:radial-gradient(circle_at_50%_50%,black_20%,transparent_80%)]" />
                  </div>
                </div>
              )}
            </ErrorBoundary>

            {/* Mobile exploration CTA pill */}
            <button
              type="button"
              onClick={() => navigate('/map')}
              className="lg:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-charcoalBlue/85 hover:bg-charcoalBlue text-white backdrop-blur-md px-4 py-2 min-h-[44px] rounded-full text-[0.8rem] font-bold shadow-md transition-all font-heading border border-white/10 cursor-pointer"
              aria-label={t('viewFullMap')}
            >
              <Map size={14} className="text-atomicTangerine" />
              <span>{t('viewFullMap')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-w-0 w-full min-h-0 lg:col-start-1 lg:row-start-2 lg:h-full lg:overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0 gap-2 min-h-[44px]">
          <h2 className="m-0 text-[0.8rem] font-extrabold text-charcoalBlue uppercase tracking-widest leading-none min-w-0 flex-1 font-heading">{t('recentAdventures')}</h2>
          {log.length > 0 && (
            <Motion.button
              onClick={() => navigate('/trips')}
              className="flex items-center gap-1.5 bg-atomicTangerine/5 border border-atomicTangerine/15 cursor-pointer text-[0.82rem] font-extrabold text-atomicTangerine px-[18px] py-2 min-h-[44px] rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 font-heading"
              aria-label={t('viewAllTripSummary')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('viewAll')} <ArrowRight size={14} />
            </Motion.button>
          )}
        </div>

        <BentoTripGrid
          trips={visibleRecentTrips}
          tripData={tripDataMap}
          loading={loading}
          isError={isError}
          fetchError={fetchError}
          isNewTraveler={isNewTraveler}
          onEdit={openTripEditor}
          onNewTrip={openBuscador}
          priorityImageId={visibleRecentTrips[0]?.id}
        />

      </div>
    </div>
  );
};

export default DashboardPage;

