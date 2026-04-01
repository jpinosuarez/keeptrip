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
    { id: "4", titulo: "Safari en el Serengeti", paisCodigo: "TZ", fechas: "Ago 2025", paradas: 5, coverUrl: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80" },
    { id: "5", titulo: "Círculo Dorado", paisCodigo: "IS", fechas: "Nov 2025", paradas: 3, coverUrl: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=600&q=80" },
    { id: "6", titulo: "Roadtrip Costa Oeste", paisCodigo: "US", fechas: "Abr 2026", paradas: 8, coverUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80" },
    { id: "7", titulo: "Verano en Amalfi", paisCodigo: "IT", fechas: "Jul 2026", paradas: 4, coverUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80" }
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

        {/* Mock LogStats UI */}
        <motion.div 
          style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, paddingTop: '24px' }} 
          variants={containerVariants}
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <motion.div variants={itemVariants} style={{ flex: 1, minWidth: '120px', background: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
               <Globe size={18} color={COLORS.mutedTeal} style={{ marginBottom: '8px' }} />
               <h4 style={{ fontSize: '2rem', fontWeight: 800, color: COLORS.charcoalBlue, margin: 0, lineHeight: 1 }}>12</h4>
               <span style={{ fontSize: '0.85rem', color: COLORS.mutedTeal, fontWeight: 600 }}>Países</span>
            </motion.div>
            <motion.div variants={itemVariants} style={{ flex: 1, minWidth: '120px', background: 'rgba(251, 146, 60, 0.08)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(251, 146, 60, 0.15)' }}>
               <MapPin size={18} color={COLORS.atomicTangerine} style={{ marginBottom: '8px' }} />
               <h4 style={{ fontSize: '2rem', fontWeight: 800, color: COLORS.charcoalBlue, margin: 0, lineHeight: 1 }}>15<span style={{fontSize: '1.2rem', color: COLORS.background}}>%</span></h4>
               <span style={{ fontSize: '0.85rem', color: COLORS.atomicTangerine, fontWeight: 600 }}>Mundo visualizado</span>
            </motion.div>
          </div>
          <motion.div variants={itemVariants} style={{ background: 'rgba(15, 23, 42, 0.04)', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarDays size={20} color={COLORS.charcoalBlue} />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: COLORS.charcoalBlue }}>142</div>
              <div style={{ fontSize: '0.8rem', color: COLORS.border, fontWeight: 600 }}>Días viajando</div>
            </div>
          </motion.div>
        </motion.div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div style={styles.featureCardTitle(isMobile, 1)}>{typeof t('landing:features.stats.title') === 'string' ? t('landing:features.stats.title') : 'Travel Stats'}</div>
          <p style={styles.featureDesc(isMobile, 1)}>{typeof t('landing:features.stats.description') === 'string' ? t('landing:features.stats.description') : 'Explore your impact...'}</p>
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

        <motion.div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px', 
            flex: 1, 
            marginTop: '16px',
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 95%)'
          }} 
          variants={containerVariants}
        >
          {mockGrid.map((card, idx) => (
            <motion.div key={card.id || idx} variants={itemVariants}>
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
        </motion.div>

        <div style={{ paddingTop: '16px', zIndex: 1 }}>
          <div style={styles.featureCardTitle(isMobile, 2)}>{t('landing:features.gallery.title')}</div>
          <p style={styles.featureDesc(isMobile, 2)}>{t('landing:features.gallery.description')}</p>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default BentoFeatures;
