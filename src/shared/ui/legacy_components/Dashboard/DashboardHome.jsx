import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Compass, Calendar, Flag, TrendingUp, MapPin, ArrowRight, Trophy, Sparkles, Stamp } from 'lucide-react';
import { useAuth } from '@app/providers/AuthContext';
import { useUI } from '@app/providers/UIContext';
import { COLORS } from '@shared/config';
import { styles } from './DashboardHome.styles';
import { HomeMap } from '@features/mapa';
import { getTravelerLevel, getNextLevel } from '@features/gamification';
import { useTranslation } from 'react-i18next';

import { SkeletonList, TripCardSkeleton } from '../Shared/Skeletons';

const DashboardHome = ({ paisesVisitados, bitacora, isMobile = false, loading = false }) => {
  const { usuario } = useAuth();
  const { setVistaActiva, abrirVisor, openBuscador } = useUI();
  const { t } = useTranslation('dashboard');
  const nombre = usuario?.displayName ? usuario.displayName.split(' ')[0] : 'Viajero';

  const recientes = [...bitacora].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  const isNewTraveler = bitacora.length === 0;

  const totalPaises = 195;
  const visitadosCount = paisesVisitados.length;
  const porcentaje = visitadosCount > 0 ? ((visitadosCount / totalPaises) * 100).toFixed(0) : '--';
  const viajesCountLabel = bitacora.length > 0 ? bitacora.length : '--';
  const paisesCountLabel = visitadosCount > 0 ? visitadosCount : '--';

  const level = getTravelerLevel(visitadosCount);
  const next = getNextLevel(visitadosCount);

  return (
    <div style={styles.dashboardContainer(isMobile)}>
      <div style={styles.welcomeArea}>
        <div>
          <h1 style={styles.title}>{t('greeting', { name: nombre })}</h1>
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
          <div style={styles.statPill} title={visitadosCount === 0 ? t('tooltip.awaitingFirstCountry') : undefined}>
            <div style={styles.pillIcon(COLORS.atomicTangerine)}><Flag size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{paisesCountLabel} <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '400' }}>/ 195</span></span>
              <span style={styles.pillLabel}>{t('countries')}</span>
            </div>
          </div>

          <div style={styles.statPill} title={bitacora.length === 0 ? t('tooltip.awaitingFirstStop') : undefined}>
            <div style={styles.pillIcon(COLORS.charcoalBlue)}><Compass size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{viajesCountLabel}</span>
              <span style={styles.pillLabel}>{t('trips')}</span>
            </div>
          </div>

          <div style={styles.statPill} title={visitadosCount === 0 ? t('tooltip.awaitingProgress') : undefined}>
            <div style={styles.pillIcon(COLORS.mutedTeal)}><Trophy size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{porcentaje}%</span>
              <span style={styles.pillLabel}>{t('world')}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid(isMobile)}>
        <div style={styles.mapCard(isMobile)}>
          <HomeMap paisesVisitados={paisesVisitados} />
        </div>

        <div style={styles.recentsContainer}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}><TrendingUp size={16} /> {t('recentAdventures')}</span>
            {!isNewTraveler && (
              <button onClick={() => setVistaActiva('bitacora')} style={styles.viewAllBtn}>
                {t('viewAll')} <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={styles.cardsList} className="custom-scroll">
            {loading ? (
              <SkeletonList count={3} Component={TripCardSkeleton} />
            ) : !isNewTraveler ? recientes.map((viaje) => (
              <div
                key={viaje.id}
                className="tap-scale"
                style={styles.travelCard}
                onClick={() => abrirVisor(viaje.id)}
              >
                <div
                  style={{
                    ...styles.cardBackground,
                    backgroundImage: viaje.foto ? `url(${viaje.foto})` : 'none',
                    backgroundColor: viaje.foto ? 'transparent' : COLORS.mutedTeal
                  }}
                />
                <div style={styles.cardGradient} />

                <div style={styles.cardContent}>
                  <div style={styles.cardTop}>
                    {viaje.banderas && viaje.banderas.length > 0 ? (
                      <img src={viaje.banderas[0]} alt="flag" loading="lazy" style={styles.flagImg} />
                    ) : (
                      <Compass size={18} color="white" />
                    )}
                  </div>

                  <div style={styles.cardBottom}>
                    <h4 style={styles.cardTitle}>{viaje.titulo || viaje.nombreEspanol}</h4>
                    <div style={styles.cardMeta}>
                      <span style={styles.metaItem}>
                        <Calendar size={12} /> {viaje.fechaInicio}
                      </span>
                      {viaje.ciudades && (
                        <span style={styles.metaItem}>
                          <MapPin size={12} /> {viaje.ciudades.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
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
                <h3 style={styles.welcomeTitle}>{t('emptyPassport')}</h3>
                <p style={styles.welcomeText}>
                  {t('firstSealMessage')}
                </p>
                <button type="button" className="tap-btn" style={styles.welcomeCta} onClick={openBuscador}>
                  {t('stampFirstDestination')}
                </button>
              </Motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
