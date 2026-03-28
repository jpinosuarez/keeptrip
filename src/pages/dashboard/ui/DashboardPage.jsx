import React, { useMemo, useState } from 'react';
import { WifiOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardPage.styles';
import { HomeMap } from '@features/mapa';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { getTravelerLevel, getNextLevel } from '@features/gamification';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';

import WelcomeBento from './components/WelcomeBento';
import EmptyDashboardState from './components/EmptyDashboardState';
import TripCard from '@widgets/tripGrid/ui/TripCard';

const DashboardPage = ({ countriesVisited = [], log = [], isMobile = false, loading = false, isError = false, fetchError = null }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  const { width, height } = useWindowSize();
  useDocumentTitle(tNav('home'));

  const name = usuario?.displayName ? usuario.displayName.split(' ')[0] : t('fallbackName');
  const recentTrips = useMemo(
    () => [...log].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio)),
    [log]
  );

  const recentTripsLimit = useMemo(() => {
    if (isMobile) return 2;
    if (width >= 1500 && height >= 880) return 3;
    return 2;
  }, [height, isMobile, width]);

  const visibleRecentTrips = useMemo(
    () => recentTrips.slice(0, recentTripsLimit),
    [recentTrips, recentTripsLimit]
  );
  const isNewTraveler = log.length === 0;
  const [mapRenderKey, setMapRenderKey] = useState(0);

  // dashboard stats
  const tripDataMap = useMemo(() => {
    const m = {};
    log.forEach((t) => {
      if (t.id) m[t.id] = t;
    });
    return m;
  }, [log]);

  const logStatsDashboard = useLogStats(log, tripDataMap);

  const visitedCount = countriesVisited.length;

  const level = getTravelerLevel(visitedCount);
  const next = getNextLevel(visitedCount);

  const mapFallback = (
    <div style={styles.mapErrorFallback(isMobile)} role="status" aria-live="polite">
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

  const openTripEditor = (tripId) => {
    const params = new URLSearchParams(location.search);
    params.set('editing', tripId);
    navigate({ pathname: location.pathname, search: params.toString() });
  };

  return (
    <div style={styles.dashboardContainer(isMobile)}>
      {/* Welcome area (Traveler Identity Bento) */}
      <div style={styles.welcomeContainer}>
        <WelcomeBento 
          name={name}
          visitedCount={visitedCount}
          level={level}
          nextLevel={next}
          logStatsDashboard={logStatsDashboard}
          isMobile={isMobile}
        />
      </div>

      {/* Main grid: map + recents */}
      <div style={styles.mainGrid(isMobile)}>
  {/* Map Section with Real Title */}
  <div style={styles.mapSection}>
    <h3 style={styles.mapSectionTitle}>{t('explorationMap')}</h3>
    <div style={styles.mapCard(isMobile)}>
      <ErrorBoundary fallback={mapFallback}>
        <HomeMap key={mapRenderKey} paisesVisitados={countriesVisited} isMobile={isMobile} />
      </ErrorBoundary>
    </div>
  </div>
  {/* Recents Section */}
  <div style={styles.recentsContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>{t('recentAdventures')}</h2>
            {!isNewTraveler && (
              <button
                onClick={() => navigate('/trips')}
                style={styles.viewAllBtn}
                aria-label={t('viewAllTripSummary')}
              >
                {t('viewAll')} <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={styles.cardsList(isMobile)} className="custom-scroll">
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
              visibleRecentTrips.map((trip) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  isMobile={isMobile} 
                  variant="home"
                  onClick={() => openTripEditor(trip.id)} 
                />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyDashboardState onNewTrip={openBuscador} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
