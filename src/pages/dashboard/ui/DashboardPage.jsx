import React, { useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { AlertTriangle, Compass, Calendar, Globe, MapPin, ArrowRight, Sparkles, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardPage.styles';
import { HomeMap } from '@features/mapa';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { getTravelerLevel, getNextLevel } from '@features/gamification';
import { useLogStats } from '@shared/lib/hooks/useLogStats';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';

import WelcomeBento from './components/WelcomeBento';
import EmptyDashboardState from './components/EmptyDashboardState';
import TripCard from '@widgets/tripGrid/ui/TripCard';

const DashboardPage = ({ countriesVisited = [], log = [], isMobile = false, loading = false, isError = false, fetchError = null }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('home'));

  const name = usuario?.displayName ? usuario.displayName.split(' ')[0] : t('fallbackName', 'Explorer');
  const recentTrips = useMemo(
    () => [...log].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio)),
    [log]
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
  const worldPercent = visitedCount > 0 ? ((visitedCount / 195) * 100).toFixed(0) : '0';

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
        <p style={styles.mapErrorText}>{t('mapUnavailable', 'El mapa no esta disponible ahora mismo.')}</p>
        <button
          type="button"
          style={styles.mapRetryBtn}
          onClick={() => setMapRenderKey((prev) => prev + 1)}
        >
          {t('retryMap', 'Reintentar mapa')}
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.dashboardContainer(isMobile)}>
      {/* Welcome area (Traveler Identity Bento) */}
      <WelcomeBento 
        name={name}
        visitedCount={visitedCount}
        worldPercent={worldPercent}
        tripsCount={log.length}
        level={level}
        nextLevel={next}
        logStatsDashboard={logStatsDashboard}
        isNewTraveler={isNewTraveler}
        isMobile={isMobile}
      />

      {/* Main grid: map + recents */}
      <div style={styles.mainGrid(isMobile)}>
        <div style={styles.mapCard(isMobile)}>
          <ErrorBoundary fallback={mapFallback}>
            <HomeMap key={mapRenderKey} paisesVisitados={countriesVisited} isMobile={isMobile} />
          </ErrorBoundary>
        </div>

        <div style={styles.recentsContainer}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>{t('recentAdventures')}</span>
            {!isNewTraveler && (
              <button onClick={() => navigate('/trips')} style={styles.viewAllBtn}>
                {t('viewAll')} <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={styles.cardsList(isMobile)} className="custom-scroll">
            {loading ? (
              <SkeletonList count={3} Component={TripCardSkeleton} />
            ) : isError ? (
              <div style={styles.dashboardErrorCard} role="status" aria-live="polite">
                <WifiOff size={18} color={COLORS.warning} />
                <p style={styles.dashboardErrorText}>
                  {t('loadTripsError', "We couldn't load your trips. Please check your connection.")}
                </p>
                {fetchError?.message && (
                  <p style={styles.dashboardErrorHint}>{fetchError.message}</p>
                )}
              </div>
            ) : !isNewTraveler ? (
              recentTrips.map((trip) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  isMobile={isMobile} 
                  onClick={() => navigate('/trips/' + trip.id)} 
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
