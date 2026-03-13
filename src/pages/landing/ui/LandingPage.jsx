import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { styles } from './LandingPage.styles';
import { Map, BookOpen, Shield, Globe, ArrowRight, MapPin, Award, Navigation, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Sun, Coffee, Camera } from 'lucide-react';
import { IMAGENES_SELLOS } from '../../../assets/sellos';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '@shared/config';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { WorldMapSVG } from './WorldMapSVG';

const FEATURES = [
  { num: '01', icon: Map,      key: 'map',      color: COLORS.atomicTangerine, bentoSpan: 'col-span-12 md:col-span-8' }, // 2/3 width
  { num: '02', icon: BookOpen, key: 'journal',   color: COLORS.mutedTeal,      bentoSpan: 'col-span-12 md:col-span-4' }, // 1/3 width
  { num: '03', icon: Shield,   key: 'security',  color: COLORS.charcoalBlue,   bentoSpan: 'col-span-12 md:col-span-12' }, // full width
];

const HERO_CARDS = [
  { id: 1, title: 'Tailandia Backpacking', location: 'Asia', date: 'Oct 2024 • 14 días', icon: MapPin, img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=800&auto=format&fit=crop' },
  { id: 2, title: 'París Inolvidable', location: 'Europa', date: 'Mar 2025 • 7 días', icon: Globe, img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop' },
  { id: 3, title: 'Ruta 40', location: 'Sudamérica', date: 'Ene 2026 • 20 días', icon: Navigation, img: 'https://images.unsplash.com/photo-1596422846543-74fc8e6138C8?q=80&w=800&auto=format&fit=crop' } // Temporary placeholder, unpslash search for patagonia
];

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const hoverScaleVariants = {
  hover: { scale: 1.02, y: -4, transition: springTransition },
  tap: { scale: 0.96, transition: springTransition },
};

const LandingPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation(['landing', 'common']);
  const { isMobile } = useWindowSize();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + HERO_CARDS.length) % HERO_CARDS.length);
  };

  return (
    <motion.div
      style={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Visual, deliberate Background Map */}
      <div style={styles.backgroundMap} />

      {/* Nav */}
      <motion.nav style={styles.nav(isMobile)} variants={itemVariants}>
        <div style={styles.logo}>Keeptrip</div>
        <motion.button
          onClick={login}
          className="tap-btn"
          style={styles.loginBtn}
          variants={hoverScaleVariants}
          whileHover="hover"
          whileTap="tap"
        >
          {t('common:login')}
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <motion.main style={styles.hero(isMobile)} variants={itemVariants}>
        {/* Columna izquierda: copy */}
        <motion.div style={styles.content} variants={itemVariants}>
          <motion.div style={styles.kicker} variants={itemVariants}>
            <Globe size={14} color={COLORS.mutedTeal} strokeWidth={2.5} />
            {t('landing:kicker', 'Para viajeros de alma')}
          </motion.div>

          <motion.h1 style={styles.title(isMobile)} variants={itemVariants}>
            {t('landing:titleTop')}
            <br />
            <span style={styles.highlight}>{t('landing:titleHighlight')}</span>
          </motion.h1>

          <motion.p style={styles.subtitle} variants={itemVariants}>
            {t('landing:subtitle')}
          </motion.p>

          <motion.button
            onClick={login}
            className="tap-btn"
            style={styles.ctaBtn}
            variants={{ ...itemVariants, hover: { scale: 1.02, y: -2, boxShadow: `0 12px 28px ${COLORS.atomicTangerine}50` }, tap: { scale: 0.95 } }}
            whileHover="hover"
            whileTap="tap"
          >
            {t('landing:ctaButton')}
            <ArrowRight size={18} strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* Columna derecha: sneak-peek del producto (solo desktop) */}
        {!isMobile && (
          <motion.div style={styles.heroVisual} variants={itemVariants} aria-hidden="true">
            {/* Orb atmosférico de fondo */}
            <div style={styles.heroBackground} />
            
            {/* The Interactive Trip Cards Deck */}
            <div style={styles.tripCardsStack} role="region" aria-label="Tarjetas de muestra">
              {/* Renderizamos las tarjetas mapeando el arreglo. 
                  Calculamos su "profundidad" (offset) respecto a activeCardIndex para posicionarlas.
              */}
              <AnimatePresence>
                {HERO_CARDS.map((card, idx) => {
                   // Offset: 0 significa front, 1 significa second, 2 significa back
                   const rawOffset = idx - activeCardIndex;
                   const offset = rawOffset < 0 ? HERO_CARDS.length + rawOffset : rawOffset;
                   const isFront = offset === 0;

                   return (
                     <motion.div
                        key={card.id}
                        layout
                        style={{ 
                          ...styles.tripCardMock, 
                          zIndex: HERO_CARDS.length - offset,
                        }}
                        initial={false}
                        animate={{
                          opacity: offset === 2 ? 0 : 1 - (offset * 0.15),
                          scale: 1 - (offset * 0.05),
                          y: offset * 25,
                          rotate: offset === 0 ? 0 : (offset === 1 ? -4 : 4),
                        }}
                        whileHover={isFront ? { scale: 1.02, y: -4, rotate: 2 } : {}}
                        transition={springTransition}
                     >
                        <div style={styles.tripCardMockImage(card.img)} />
                        <div style={styles.tripCardMockOverlay}>
                          <div style={styles.tripCardMockPill}>
                            <card.icon size={10} style={{marginRight: 4}}/> {card.location}
                          </div>
                          <div style={styles.tripCardMockContent}>
                            <h3 style={styles.tripCardMockTitle}>{card.title}</h3>
                            <p style={styles.tripCardMockDate}>{card.date}</p>
                          </div>
                        </div>
                     </motion.div>
                   )
                })}
              </AnimatePresence>

              {/* Glassmorphic Nav Buttons */}
              <div style={styles.heroNavControls}>
                <motion.div 
                   style={styles.heroNavBtn} 
                   whileHover={{ scale: 1.05 }} 
                   whileTap={{ scale: 0.95 }}
                   onClick={handlePrevCard}
                >
                  <ChevronLeft size={20} strokeWidth={2.5} />
                </motion.div>
                <motion.div 
                   style={styles.heroNavBtn} 
                   whileHover={{ scale: 1.05 }} 
                   whileTap={{ scale: 0.95 }}
                   onClick={handleNextCard}
                >
                  <ChevronRight size={20} strokeWidth={2.5} />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.main>

      {/* Features: Dashboard Fragments Bento Grid (Option A) */}
      <motion.section 
        style={styles.featuresSection(isMobile)} 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
      >
        {/* Card 1: Rutas Vivas (Index 0) - 2/3 Width */}
        <motion.div
            style={{ ...styles.featureCard(isMobile, 0), display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
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

          {/* SVG World Map — Zero API, Mobile-Safe */}
          <div style={styles.worldMapContainer}>
            <WorldMapSVG color={COLORS.atomicTangerine} />
          </div>

          <div>
            <div style={styles.featureCardTitle(isMobile, 0)}>Rutas Vivas</div>
            <p style={styles.featureDesc(isMobile, 0)}>Tus viajes no son puntos estáticos. Documenta cada parada y deja que el mapa conecte tu historia en una interfaz diseñada para exploradores.</p>
          </div>
        </motion.div>

        {/* Card 2: Pasaporte / Timeline (Index 1) - 1/3 Width */}
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

          {/* SaaS Fragment: Timeline vertical feed */}
          <div style={{...styles.timelineVisual, maxHeight: '160px', overflow: 'hidden', paddingTop: '12px', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'}}>
             <div style={{...styles.timelineLine, left: '16px', background: `${COLORS.mutedTeal}40`}} />
             
             <div style={styles.timelineItem}>
               <div style={{...styles.timelineDot, background: COLORS.mutedTeal, border: '2px solid #fff'}} />
               <div style={styles.timelineItemContent}>
                 <span style={styles.timelineItemDate}>2 Mar, 10:00 AM</span>
                 <span style={styles.timelineItemTitle}>Aeropuerto Suvarnabhumi</span>
               </div>
             </div>

             <div style={styles.timelineItem}>
               <div style={{...styles.timelineDot, background: COLORS.background, border: `2px solid ${COLORS.mutedTeal}`}} />
               <div style={styles.timelineItemContent}>
                 <span style={styles.timelineItemDate}>2 Mar, 14:30 PM</span>
                 <span style={styles.timelineItemTitle}>Check-in Khaosan Road</span>
               </div>
             </div>
             
             <div style={styles.timelineItem}>
               <div style={{...styles.timelineDot, background: COLORS.background, border: `2px solid ${COLORS.border}`}} />
               <div style={styles.timelineItemContent}>
                 <span style={styles.timelineItemDate}>3 Mar, 09:00 AM</span>
                 <span style={styles.timelineItemTitle}>Wat Pho</span>
               </div>
             </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <div style={styles.featureCardTitle(isMobile, 1)}>Relatos de Viaje</div>
            <p style={styles.featureDesc(isMobile, 1)}>Reemplaza la galería fría por una bitácora inmersiva. Agrega anécdotas, sensaciones y conecta cada fotografía con su momento histórico.</p>
          </div>
        </motion.div>


         {/* Card 3: Memorias / Galería (Index 2) - Full Width */}
         <motion.div
            style={{ ...styles.featureCard(isMobile, 2), display: 'flex', flexDirection: 'column' }}
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

          {/* Expanded Masonry: 3 columns, 6 photos, context pills */}
          <div style={styles.masonryVisualContainer}>
             {/* Col 1 */}
             <div style={styles.masonryCol}>
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=300&auto=format&fit=crop', '140px')}>
                 <div style={styles.galleryContextPill}>
                   <Sun size={11} color={COLORS.atomicTangerine} />
                   <span style={styles.galleryContextLabel}>32°C • Bangkok</span>
                 </div>
               </div>
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1542051842920-c51d6ed5ec69?q=80&w=300&auto=format&fit=crop', '115px')} />
             </div>
             {/* Col 2 */}
             <div style={{...styles.masonryCol, marginTop: '24px'}}>
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=300&auto=format&fit=crop', '115px')}>
                 <div style={styles.galleryContextPill}>
                   <MapPin size={11} color={COLORS.charcoalBlue} />
                   <span style={styles.galleryContextLabel}>Tour Eiffel</span>
                 </div>
               </div>
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?q=80&w=300&auto=format&fit=crop', '148px')}>
                 <div style={styles.galleryContextPill}>
                   <Coffee size={11} color={COLORS.charcoalBlue} />
                   <span style={styles.galleryContextLabel}>Café de Mago</span>
                 </div>
               </div>
             </div>
             {/* Col 3 */}
             <div style={styles.masonryCol}>
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1596422846543-74fc8e6138c8?q=80&w=300&auto=format&fit=crop', '120px')} />
               <div style={styles.masonryImg('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=300&auto=format&fit=crop', '140px')}>
                 <div style={styles.masonryOverlayCount}><Plus size={14}/> 18</div>
               </div>
             </div>
          </div>

          <div style={{ paddingTop: '16px' }}>
            <div style={styles.featureCardTitle(isMobile, 2)}>Archivo Digital Moderno</div>
            <p style={styles.featureDesc(isMobile, 2)}>Tus momentos inolvidables, curados automáticamente sin esfuerzo. Olvídate de carpetas perdidas y galerías genéricas.</p>
          </div>
        </motion.div>

      </motion.section>

    </motion.div>
  );
};

export default LandingPage;