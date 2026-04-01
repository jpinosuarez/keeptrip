import React from 'react';
import { motion } from 'framer-motion';
import { Map, BarChart2, Camera, MapPin, Globe, CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { COLORS, SHADOWS } from '@shared/config';
import { WorldMapSVG } from '../../WorldMapSVG';
import { styles } from './BentoFeatures.styles';
import TripCard from '../../../../../widgets/tripGrid/ui/TripCard';

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const BentoFeatures = () => {
  const { t } = useTranslation(['landing']);
  const { isMobile } = useWindowSize();

  const rawGridCards = t('landing:mockTrips.grid', { returnObjects: true });
  const fallbackGrid = [
    { id: "4", titulo: "Safari en el Serengeti", mensaje: "Tanzania", paisCodigo: "TZ", fechas: "Ago 2025", paradas: 5, coverUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=90" },
    { id: "5", titulo: "Círculo Dorado", mensaje: "Islandia", paisCodigo: "IS", fechas: "Nov 2025", paradas: 3, coverUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=90" },
    { id: "6", titulo: "Roadtrip Costa Oeste", mensaje: "USA", paisCodigo: "US", fechas: "Abr 2026", paradas: 8, coverUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=90" },
    { id: "7", titulo: "Verano en Amalfi", mensaje: "Italia", paisCodigo: "IT", fechas: "Jul 2026", paradas: 4, coverUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=90" }
  ];
  const mockGrid = Array.isArray(rawGridCards) && rawGridCards.length > 0 ? rawGridCards : fallbackGrid;

  return (
    <motion.section 
      style={styles.featuresSection(isMobile)} 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      {/* Card 1: Rutas Vivas (Index 0) */}
      <motion.div
        style={styles.featureCard(isMobile, 0)}
        variants={itemVariants}
        whileHover={{ scale: 1.005, y: -4, boxShadow: SHADOWS?.float || '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div style={styles.featureCardHeader}>
          <div style={styles.featureCardIconWrap(COLORS.atomicTangerine)}>
            <Map size={24} color={COLORS.atomicTangerine} strokeWidth={2} />
          </div>
          <span style={styles.featureCardNum(COLORS.atomicTangerine)}>01</span>
        </div>

        <div style={styles.worldMapContainer}>
          <WorldMapSVG color={COLORS.atomicTangerine} />
        </div>

        <div>
           <div style={styles.featureCardTitle(isMobile, 0)}>{typeof t('landing:features.liveRoutes.title') === 'string' ? t('landing:features.liveRoutes.title') : 'Living Routes'}</div>
           <p style={styles.featureDesc(isMobile, 0)}>{typeof t('landing:features.liveRoutes.description') === 'string' ? t('landing:features.liveRoutes.description') : 'Document each stop...'}</p>
        </div>
      </motion.div>

      {/* Card 2: Travel Stats (Index 1) */}
      <motion.div
        style={styles.featureCard(isMobile, 1)}
        variants={itemVariants}
        whileHover={{ scale: 1.01, y: -4, boxShadow: SHADOWS?.float || '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div style={styles.featureCardHeader}>
          <div style={styles.featureCardIconWrap(COLORS.mutedTeal)}>
            <BarChart2 size={24} color={COLORS.mutedTeal} strokeWidth={2} />
          </div>
          <span style={styles.featureCardNum(COLORS.mutedTeal)}>02</span>
        </div>

        {/* Premium Marketing Stats UI */}
        <div style={styles.statsGrid}>
          <div style={styles.statsRow}>
            <div style={styles.statSubCard}>
              <div style={styles.statIconWrap}>
                 <Globe size={20} color={COLORS.atomicTangerine} />
              </div>
              <div style={styles.statNumber}>
                {t('landing:features.stats.países.value')}
              </div>
              <div style={styles.statLabel}>
                {t('landing:features.stats.países.label')}
              </div>
            </div>
            
            <div style={styles.statSubCard}>
              <div style={styles.statIconWrap}>
                 <MapPin size={20} color={COLORS.atomicTangerine} />
              </div>
              <div style={styles.statNumber}>
                {t('landing:features.stats.mundo.value')}<span style={{fontSize: '1.5rem', color: COLORS.atomicTangerine, marginLeft: '2px'}}>%</span>
              </div>
              <div style={styles.statLabel}>
                {t('landing:features.stats.mundo.label')}
              </div>
            </div>
          </div>

          <div style={{...styles.statSubCard, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <div style={{...styles.statNumber, fontSize: '2.5rem'}}>
                {t('landing:features.stats.destinos.value')}
              </div>
              <div style={styles.statLabel}>
                {t('landing:features.stats.destinos.label')}
              </div>
            </div>
            <div style={{width: '56px', height: '56px', borderRadius: '50%', background: `${COLORS.atomicTangerine}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
               <Map size={28} color={COLORS.atomicTangerine} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div style={styles.featureCardTitle(isMobile, 1)}>{t('landing:features.stats.title')}</div>
          <p style={styles.featureDesc(isMobile, 1)}>{t('landing:features.stats.description')}</p>
        </div>
      </motion.div>

      {/* Card 3: Your Digital Archive (Index 2) */}
      <motion.div
        style={styles.featureCard(isMobile, 2)}
        variants={itemVariants}
        whileHover={{ scale: 1.01, y: -4, boxShadow: SHADOWS?.float || '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div style={styles.featureCardHeader}>
          <div style={styles.featureCardIconWrap(COLORS.charcoalBlue)}>
            <Camera size={24} color={COLORS.charcoalBlue} strokeWidth={2} />
          </div>
          <span style={styles.featureCardNum(COLORS.charcoalBlue)}>03</span>
        </div>

        <div style={styles.masonryVisualContainer}>
          {mockGrid.map((card, idx) => (
            <motion.div 
              key={card.id || idx} 
              variants={itemVariants}
              style={{ 
                marginBottom: '16px', // Clean separation instead of overlapping
                zIndex: 1,
                opacity: 1
              }}
            >
              <div style={{ height: '220px', pointerEvents: 'none' }}>
                <TripCard 
                  trip={{
                    ...card,
                    foto: card.coverUrl,
                    fechaInicio: card.fechas,
                    paradaCount: card.paradas,
                    banderas: card.paisCodigo ? [`https://flagcdn.com/${card.paisCodigo.toLowerCase()}.svg`] : [],
                  }}
                  isMobile={true}
                  variant="list"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ paddingTop: '12px', zIndex: 10, position: 'relative', background: 'white' }}>
          <div style={styles.featureCardTitle(isMobile, 2)}>{t('landing:features.gallery.title')}</div>
          <p style={styles.featureDesc(isMobile, 2)}>{t('landing:features.gallery.description')}</p>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default BentoFeatures;
