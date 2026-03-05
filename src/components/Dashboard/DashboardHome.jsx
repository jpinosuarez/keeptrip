import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Calendar, Flag, TrendingUp, MapPin, ArrowRight, Trophy, Sparkles, Stamp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { COLORS } from '../../theme';
import { styles } from './DashboardHome.styles';
import HomeMap from '../Mapa/HomeMap';
import { getTravelerLevel, getNextLevel } from '../../utils/travelerLevel';

const DashboardHome = ({ paisesVisitados, bitacora, isMobile = false }) => {
  const { usuario } = useAuth();
  const { setVistaActiva, abrirVisor, openBuscador } = useUI();
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
          <h1 style={styles.title}>Hola, {nombre}</h1>
          <p style={styles.subtitle}>
            {level.icon} {level.label}
            {next.level && (
              <span style={{ opacity: 0.6, fontSize: '0.8rem', marginLeft: '8px' }}>
                · {next.remaining} país{next.remaining !== 1 ? 'es' : ''} para {next.level.label}
              </span>
            )}
          </p>
        </div>

        <div style={styles.headerStatsRow}>
          <div style={styles.statPill} title={visitadosCount === 0 ? 'A la espera de tu primer pais visitado.' : undefined}>
            <div style={styles.pillIcon(COLORS.atomicTangerine)}><Flag size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{paisesCountLabel} <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: '400' }}>/ 195</span></span>
              <span style={styles.pillLabel}>Paises</span>
            </div>
          </div>

          <div style={styles.statPill} title={bitacora.length === 0 ? 'A la espera de tu primera parada registrada.' : undefined}>
            <div style={styles.pillIcon(COLORS.charcoalBlue)}><Compass size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{viajesCountLabel}</span>
              <span style={styles.pillLabel}>Viajes</span>
            </div>
          </div>

          <div style={styles.statPill} title={visitadosCount === 0 ? 'A la espera de progreso global.' : undefined}>
            <div style={styles.pillIcon(COLORS.mutedTeal)}><Trophy size={14} color="white" /></div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={styles.pillValue}>{porcentaje}%</span>
              <span style={styles.pillLabel}>Mundo</span>
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
            <span style={styles.sectionTitle}><TrendingUp size={16} /> Aventuras Recientes</span>
            {!isNewTraveler && (
              <button onClick={() => setVistaActiva('bitacora')} style={styles.viewAllBtn}>
                Ver todas <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={styles.cardsList} className="custom-scroll">
            {!isNewTraveler ? recientes.map((viaje) => (
              <div
                key={viaje.id}
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
                      <img src={viaje.banderas[0]} alt="flag" style={styles.flagImg} />
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
              <motion.div
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
                <h3 style={styles.welcomeTitle}>Tu pasaporte está en blanco</h3>
                <p style={styles.welcomeText}>
                  Cada gran viajero empezó con un primer sello. ¿Cuál será el tuyo?
                </p>
                <button type="button" style={styles.welcomeCta} onClick={openBuscador}>
                  Estampar mi primer destino ✈️
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
