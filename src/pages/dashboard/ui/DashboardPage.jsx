import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Compass, Calendar, Globe, MapPin, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardPage.styles';
import { HomeMap } from '@features/mapa';
import { getTravelerLevel, getNextLevel } from '@features/gamification';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';

const DashboardPage = ({ countriesVisited = [], log = [], logData = {}, isMobile = false, loading = false }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const { t: tNav } = useTranslation('nav');
  useDocumentTitle(tNav('home'));

  const name = usuario?.displayName ? usuario.displayName.split(' ')[0] : t('fallbackName', 'Explorer');
  const recentTrips = [...log].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  const isNewTraveler = log.length === 0;

  const visitedCount = countriesVisited.length;
  const worldPercent = visitedCount > 0 ? ((visitedCount / 195) * 100).toFixed(0) : '0';

  const level = getTravelerLevel(visitedCount);
  const next = getNextLevel(visitedCount);

  return (
    <div style={styles.dashboardContainer(isMobile)}>
      {/* Welcome area */}
      <div style={styles.welcomeArea(isMobile)}>
        <div>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          <p style={styles.subtitle}>
            {visitedCount > 0
              ? t('subtitleStats', { countries: visitedCount, percent: worldPercent, trips: log.length })
              : t('firstTripMessage')}
          </p>
          <p style={styles.levelLine}>
            {level.icon} {level.label}
            {next.level && (
              <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '8px' }}>
                · {next.remaining} {next.remaining !== 1 ? t('stats.countriesPlural') : t('stats.countrySingular')} para {next.level.label}
              </span>
            )}
          </p>
        </div>

        {!isMobile && !isNewTraveler && (
          <Motion.button
            type="button"
            className="tap-btn"
            style={styles.ctaDesktop}
            onClick={openBuscador}
            whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
            whileTap={{ scale: 0.97 }}
            aria-label={t('newTrip')}
          >
            <Plus size={16} />
            {t('newTrip', 'Crear viaje')}
          </Motion.button>
        )}
        {isMobile && !isNewTraveler && (
          <Motion.button
            type="button"
            style={styles.fabMobile}
            onClick={openBuscador}
            whileTap={{ scale: 0.97 }}
            aria-label={t('newTrip')}
          >
            <Plus size={20} style={{ color: '#fff', filter: 'drop-shadow(0 2px 8px #FF6B35)' }} />
            {t('newTrip', 'Crear viaje')}
          </Motion.button>
        )}
      </div>

      {/* Main grid: map + recents */}
      <div style={styles.mainGrid(isMobile)}>
        <div style={styles.mapCard(isMobile)}>
          <HomeMap paisesVisitados={countriesVisited} />
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
            ) : !isNewTraveler ? (
              recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  role="button"
                  tabIndex={0}
                  aria-label={trip.titulo || trip.nombreEspanol || 'Ver viaje'}
                  className="tap-scale"
                  style={styles.travelCard(isMobile)}
                  onClick={() => navigate('/trips/' + trip.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/trips/' + trip.id);
                    }
                  }}
                >
                  <div
                    style={{
                      ...styles.cardBackground,
                      backgroundImage: trip.foto ? `url(${trip.foto})` : 'none',
                      backgroundColor: trip.foto ? 'transparent' : COLORS.mutedTeal,
                    }}
                  />
                  <div style={styles.cardGradient} />
                  <div style={styles.cardContent}>
                    <div style={styles.cardTop}>
                      {trip.banderas && trip.banderas.length > 0 ? (
                        <img
                          src={trip.banderas[0]}
                          alt={`Bandera de ${trip.titulo || trip.nombreEspanol || 'este viaje'}`}
                          loading="lazy"
                          style={styles.flagImg}
                        />
                      ) : (
                        <Compass size={18} color="white" />
                      )}
                    </div>
                    <div style={styles.cardBottom}>
                      <h4 style={styles.cardTitle}>{trip.titulo || trip.nombreEspanol}</h4>
                      <div style={styles.cardMeta}>
                        <span style={styles.metaItem}>
                          <Calendar size={12} /> {trip.fechaInicio}
                        </span>
                        {trip.ciudades && (
                          <span style={styles.metaItem}>
                            <MapPin size={12} /> {trip.ciudades.split(',')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={styles.welcomeCard}
              >
                <div style={styles.welcomeArt}>
                  <Globe size={56} color={COLORS.atomicTangerine} strokeWidth={1.25} />
                  <div style={styles.welcomeArtOrbit}>
                    <Sparkles size={18} color={COLORS.mutedTeal} />
                  </div>
                </div>
                <h3 style={styles.welcomeTitle}>{t('emptyLog')}</h3>
                <p style={styles.welcomeText}>{t('firstTripMessage')}</p>
                <button type="button" className="tap-btn" style={styles.welcomeCta} onClick={openBuscador}>
                  {t('addFirstTrip')}
                </button>
              </Motion.div>
            )}
          </div>
        </div>
      </div>
      {/* FAB mobile: solo cuando hay viajes */}
      {isMobile && !isNewTraveler && (
        <Motion.button
          type="button"
          className="tap-btn"
          style={styles.fabMobile}
          onClick={openBuscador}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t('newBitacora')}
        >
          <Plus size={18} />
          {t('newBitacora')}
        </Motion.button>
      )}
    </div>
  );
};

export default DashboardPage;
