import React, { lazy, Suspense, useMemo, useState } from 'react';
import { WifiOff, AlertTriangle, ArrowRight, Map } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardPage.styles';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { useLogStats } from '@features/gamification/model';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';

import WelcomeBento from './components/WelcomeBento';
import EmptyDashboardState from './components/EmptyDashboardState';
import TripCard from '@widgets/tripGrid/ui/TripCard';
import TravelStatsWidget from '@widgets/travelStats/ui/TravelStatsWidget';

const HomeMap = lazy(() => import('@features/mapa/ui/HomeMap'));

const DashboardPage = ({ countriesVisited = [], log = [], logData = {}, loading = false, isError = false, fetchError = null }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const isMobileLayout = !isDesktop;
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

  const recentTripsLimit = useMemo(() => {
    if (isMobileLayout) return 2;
    return Math.min(recentTrips.length, 4);
  }, [isMobileLayout, recentTrips.length]);

  const visibleRecentTrips = useMemo(
    () => (isDesktop ? recentTrips : recentTrips.slice(0, recentTripsLimit)),
    [isDesktop, recentTrips, recentTripsLimit]
  );
  const isNewTraveler = log.length === 0;
  const [mapRenderKey, setMapRenderKey] = useState(0);

  const [isMapRequested, setIsMapRequested] = useState(false);

  // Performance architecture: Interaction-based deferred map loading.
  // We wait for the first genuine user interaction (scroll, touch, or mousemove) 
  // before triggering the 1.6MB Mapbox payload. This keeps Lighthouse TBT perfect.
  React.useEffect(() => {
    let interactionFired = false;
    let fallbackTimer;

    const onUserInteraction = () => {
      if (interactionFired) return;
      interactionFired = true;
      
      // Use requestIdleCallback to ensure the map doesn't freeze the exact moment of interaction
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

    // Attach passive listeners listening unconditionally to early interactions.
    window.addEventListener('scroll', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('mousemove', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('touchstart', onUserInteraction, { capture: true, once: true, passive: true });
    window.addEventListener('keydown', onUserInteraction, { capture: true, once: true, passive: true });

    // Maximum wait fallback stringency: If idle for 10s, auto-load assuming they might be reading.
    fallbackTimer = setTimeout(() => {
      onUserInteraction();
    }, 10000);

    return () => {
      removeListeners();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  // dashboard stats
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
    <div style={styles.mapErrorFallback(isMobileLayout)} role="status" aria-live="polite">
      <div style={styles.mapErrorBackdrop} aria-hidden="true">
        <div style={styles.mapErrorGlowA} />
        <div style={styles.mapErrorGlowB} />
        <div style={styles.mapErrorGrid} />
      </div>
      <div style={styles.mapErrorPanel}>
        <AlertTriangle size={20} color={COLORS.warning} />
        <p style={styles.mapErrorText}>{t('mapUnavailable')}</p>
        <button
          type="button"
          style={styles.mapRetryBtn}
          onClick={() => setMapRenderKey((prev) => prev + 1)}
        >
          {t('retryMap')}
        </button>
      </div>
    </div>
  );

  const mapLoadingFallback = (
    <div style={styles.mapErrorFallback(isMobileLayout)} role="status" aria-live="polite">
      <div style={styles.mapErrorBackdrop} aria-hidden="true">
        <div style={styles.mapErrorGlowA} />
        <div style={styles.mapErrorGlowB} />
        <div style={styles.mapErrorGrid} />
      </div>
      <div style={styles.mapErrorPanel}>
        <p style={styles.mapErrorText}>{t('mapLoading')}</p>
      </div>
    </div>
  );

  const openTripEditor = (tripId) => {
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div style={styles.dashboardContainer(isDesktop)}>
      <div style={styles.welcomeContainer(isDesktop)}>
        <WelcomeBento 
          name={name}
          isMobile={isMobileLayout}
          isNewTraveler={isNewTraveler}
          onNewTrip={openBuscador}
        />
      </div>

      <div style={styles.statsContainer(isDesktop)}>
        <TravelStatsWidget
          logStats={logStatsDashboard}
          ariaLabel={t('stats.tripSummary')}
          variant="hero"
          isMobile={isMobileLayout}
        />
      </div>

      <div style={styles.mapContainer(isDesktop)}>
        <div style={styles.mapSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t('explorationMap')}</h2>
            <Motion.button
              onClick={() => navigate('/map')}
              style={styles.viewAllBtn}
              aria-label={t('viewFullMap')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('viewFullMap')} <Map size={14} />
            </Motion.button>
          </div>
          <div style={styles.mapCard(isDesktop)}>
            <ErrorBoundary fallback={mapFallback}>
              {isMapRequested ? (
                <Suspense fallback={mapLoadingFallback}>
                  <HomeMap key={mapRenderKey} paisesVisitados={countriesVisited} isMobile={isMobileLayout} />
                </Suspense>
              ) : (
                <div 
                  style={{ ...styles.mapErrorFallback(isMobileLayout), width: '100%', height: '100%' }}
                  aria-label={t('map.tapToExploreMap')}
                >
                  <div style={styles.mapErrorBackdrop} aria-hidden="true">
                    <div style={styles.mapErrorGlowA} />
                    <div style={styles.mapErrorGlowB} />
                    <div style={styles.mapErrorGrid} />
                  </div>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      <div style={styles.recentsContainer(isDesktop)}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>{t('recentAdventures')}</h2>
          {log.length > 0 && (
            <Motion.button
              onClick={() => navigate('/trips')}
              style={styles.viewAllBtn}
              aria-label={t('viewAllTripSummary')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('viewAll')} <ArrowRight size={14} />
            </Motion.button>
          )}
        </div>

        <div style={styles.cardsList(isDesktop, visibleRecentTrips.length)} className="custom-scroll">
          {loading ? (
            <SkeletonList count={2} Component={TripCardSkeleton} />
          ) : isError ? (
            <div style={styles.dashboardErrorCard} role="status" aria-live="polite">
              <WifiOff size={18} color={COLORS.warning} />
              <p style={styles.dashboardErrorText}>
                {t('loadTripsError')}
              </p>
              {fetchError?.message && (
                <p style={styles.dashboardErrorHint}>{fetchError.message}</p>
              )}
            </div>
          ) : !isNewTraveler ? (
            visibleRecentTrips.map((trip, index) => {
              const isThreeItems = visibleRecentTrips.length === 3;
              const isFirstOfThree = isThreeItems && index === 0;
              const enrichedTrip = tripDataMap[trip.id] || trip;
              return (
                <div 
                  key={trip.id} 
                  style={{ 
                    minHeight: 0, 
                    height: '100%', 
                    gridColumn: isDesktop && isFirstOfThree ? '1 / -1' : undefined,
                    overflow: 'hidden'
                  }}
                >
                  <TripCard 
                    trip={enrichedTrip} 
                    isMobile={isMobileLayout} 
                    variant="home" priorityImage={index === 0}
                    onClick={() => openTripEditor(trip.id)} 
                  />
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', minWidth: 0, minHeight: 0, width: '100%' }}>
              <EmptyDashboardState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
