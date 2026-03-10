import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Compass, Calendar, Flag, TrendingUp, MapPin, ArrowRight, Trophy, Sparkles, Stamp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardPage.styles';
import { HomeMap } from '@features/mapa';
import { getTravelerLevel, getNextLevel } from '@features/gamification';
import { SkeletonList, TripCardSkeleton } from '@shared/ui/components/Skeletons';

const DashboardPage = ({ countriesVisited = [], log = [], logData = {}, isMobile = false, loading = false }) => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { abrirVisor, openBuscador } = useUI();
  const { t } = useTranslation('dashboard');

  const name = usuario?.displayName ? usuario.displayName.split(' ')[0] : t('fallbackName', 'Explorer');
  const recentTrips = [...log].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  const isNewTraveler = log.length === 0;

  const visitedCount = countriesVisited.length;
  const worldPercent = visitedCount > 0 ? ((visitedCount / 195) * 100).toFixed(0) : '--';
  const tripsLabel = log.length > 0 ? log.length : '--';
  const countriesLabel = visitedCount > 0 ? visitedCount : '--';

  const level = getTravelerLevel(visitedCount);
  const next = getNextLevel(visitedCount);

  return (
    <div style={styles.dashboardContainer(isMobile)}>
      {/* Welcome area */}
      <div style={styles.welcomeArea}>
        <div>
          <h1 style={styles.title}>{t('greeting', { name })}</h1>
          <p style={styles.subtitle}>
            {level.icon} {level.label}
            {next.level && (
              <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '8px' }}>
                · {next.remaining} {next.remaining !== 1 ? t('stats.countriesPlural') : t('stats.countrySingular')} para {next.level.label}
              </span>
            )}
          </p>
        </div>

        <div style={styles.headerStatsRow}>
          <div style={styles.statPill} title={visitedCount === 0 ? t('tooltip.awaitingFirstCountry') : undefined}>
            <div style={styles.pillIcon(COLORS.atomicTangerine)}><Flag size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{countriesLabel} <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '400' }}>/ 195</span></span>
              <span style={styles.pillLabel}>{t('countries')}</span>
            </div>
          </div>

          <div style={styles.statPill} title={log.length === 0 ? t('tooltip.awaitingFirstStop') : undefined}>
            <div style={styles.pillIcon(COLORS.charcoalBlue)}><Compass size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{tripsLabel}</span>
              <span style={styles.pillLabel}>{t('trips')}</span>
            </div>
          </div>

          <div style={styles.statPill} title={visitedCount === 0 ? t('tooltip.awaitingProgress') : undefined}>
            <div style={styles.pillIcon(COLORS.mutedTeal)}><Trophy size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{worldPercent}%</span>
              <span style={styles.pillLabel}>{t('world')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid: map + recents */}
      <div style={styles.mainGrid(isMobile)}>
        <div style={styles.mapCard(isMobile)}>
          <HomeMap paisesVisitados={countriesVisited} />
        </div>

        <div style={styles.recentsContainer}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}><TrendingUp size={16} /> {t('recentAdventures')}</span>
            {!isNewTraveler && (
              <button onClick={() => navigate('/trips')} style={styles.viewAllBtn}>
                {t('viewAll')} <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={styles.cardsList} className="custom-scroll">
            {loading ? (
              <SkeletonList count={3} Component={TripCardSkeleton} />
            ) : !isNewTraveler ? (
              recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="tap-scale"
                  style={styles.travelCard}
                  onClick={() => abrirVisor(trip.id)}
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
                        <img src={trip.banderas[0]} alt="flag" loading="lazy" style={styles.flagImg} />
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
                  <div style={styles.welcomeArtOrbit}>
                    <Sparkles size={24} color={COLORS.atomicTangerine} />
                  </div>
                  <Stamp size={64} color={COLORS.charcoalBlue} />
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
    </div>
  );
};

export default DashboardPage;
