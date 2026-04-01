import React from 'react';
import { motion } from 'framer-motion';
import { Map, BookOpen, Camera, MapPin, Sun, Coffee, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { COLORS, SHADOWS } from '@shared/config';
import { WorldMapSVG } from '../../WorldMapSVG';
import { styles } from './BentoFeatures.styles';

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
          <div style={styles.featureCardTitle(isMobile, 0)}>{t('landing:features.liveRoutes.title')}</div>
          <p style={styles.featureDesc(isMobile, 0)}>{t('landing:features.liveRoutes.description')}</p>
        </div>
      </motion.div>

      {/* Card 2: Timeline (Index 1) */}
      <motion.div
        style={styles.featureCard(isMobile, 1)}
        variants={itemVariants}
        whileHover={{ scale: 1.01, y: -4, boxShadow: SHADOWS?.float || '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div style={styles.featureCardHeader}>
          <div style={styles.featureCardIconWrap(COLORS.mutedTeal)}>
            <BookOpen size={24} color={COLORS.mutedTeal} strokeWidth={2} />
          </div>
          <span style={styles.featureCardNum(COLORS.mutedTeal)}>02</span>
        </div>

        <motion.div style={styles.timelineVisual} variants={containerVariants}>
           <div style={styles.timelineLine} />
           
           <motion.div style={styles.timelineItem} variants={itemVariants}>
             <div style={{...styles.timelineDot, background: COLORS.mutedTeal, border: '2px solid #fff'}} />
             <div style={styles.timelineItemContent}>
               <span style={styles.timelineItemDate}>2 Mar, 10:00 AM</span>
               <span style={styles.timelineItemTitle}>Aeropuerto Suvarnabhumi</span>
             </div>
           </motion.div>

           <motion.div style={styles.timelineItem} variants={itemVariants}>
             <div style={{...styles.timelineDot, background: COLORS.background, border: `2px solid ${COLORS.mutedTeal}`}} />
             <div style={styles.timelineItemContent}>
               <span style={styles.timelineItemDate}>2 Mar, 14:30 PM</span>
               <span style={styles.timelineItemTitle}>Check-in Khaosan Road</span>
             </div>
           </motion.div>
           
           <motion.div style={styles.timelineItem} variants={itemVariants}>
             <div style={{...styles.timelineDot, background: COLORS.background, border: `2px solid ${COLORS.border}`}} />
             <div style={styles.timelineItemContent}>
               <span style={styles.timelineItemDate}>3 Mar, 09:00 AM</span>
               <span style={styles.timelineItemTitle}>Wat Pho</span>
             </div>
           </motion.div>
        </motion.div>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <div style={styles.featureCardTitle(isMobile, 1)}>{t('landing:features.timeline.title')}</div>
          <p style={styles.featureDesc(isMobile, 1)}>{t('landing:features.timeline.description')}</p>
        </div>
      </motion.div>

      {/* Card 3: Galería (Index 2) */}
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

        <motion.div style={styles.masonryVisualContainer} variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
           <div style={styles.masonryCol}>
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=300&auto=format&fit=crop', '140px')} variants={itemVariants}>
               <div style={styles.galleryContextPill}>
                 <Sun size={11} color={COLORS.atomicTangerine} />
                 <span style={styles.galleryContextLabel}>32°C • Bangkok</span>
               </div>
             </motion.div>
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1542051842920-c51d6ed5ec69?q=80&w=300&auto=format&fit=crop', '115px')} variants={itemVariants} />
           </div>
           <div style={{...styles.masonryCol, marginTop: '24px'}}>
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=300&auto=format&fit=crop', '115px')} variants={itemVariants}>
               <div style={styles.galleryContextPill}>
                 <MapPin size={11} color={COLORS.charcoalBlue} />
                 <span style={styles.galleryContextLabel}>Tour Eiffel</span>
               </div>
             </motion.div>
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=300&auto=format&fit=crop', '148px')} variants={itemVariants}>
               <div style={styles.galleryContextPill}>
                 <Coffee size={11} color={COLORS.charcoalBlue} />
                 <span style={styles.galleryContextLabel}>Café de Mago</span>
               </div>
             </motion.div>
           </div>
           <div style={styles.masonryCol}>
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1596422846543-74fc8e6138c8?q=80&w=300&auto=format&fit=crop', '120px')} variants={itemVariants} />
             <motion.div style={styles.masonryImg('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=300&auto=format&fit=crop', '140px')} variants={itemVariants}>
               <div style={styles.masonryOverlayCount}><Plus size={14}/> 18</div>
             </motion.div>
           </div>
        </motion.div>

        <div style={{ paddingTop: '16px' }}>
          <div style={styles.featureCardTitle(isMobile, 2)}>{t('landing:features.gallery.title')}</div>
          <p style={styles.featureDesc(isMobile, 2)}>{t('landing:features.gallery.description')}</p>
        </div>
      </motion.div>

    </motion.section>
  );
};

export default BentoFeatures;
