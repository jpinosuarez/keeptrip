import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Globe, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { styles } from './InteractiveCardStack.styles';

// Ensure we import TripCard
import TripCard from '../../../../../widgets/tripGrid/ui/TripCard';

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const InteractiveCardStack = ({ isMobile = false }) => {
  const { t } = useTranslation(['landing']);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Fetch localized data with extreme safety
  let heroData = t('landing:mockTrips.hero', { returnObjects: true });
  
  // High-fidelity fallback in case i18n is not ready or key is missing
  const fallbackHero = [
    { id: "1", titulo: "Misterios de Kioto", mensaje: "Japón", paisCodigo: "JP", fechas: "Oct 2024 • 14 días", paradas: 6, coverUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=90" },
    { id: "2", titulo: "Expedición Patagonia", mensaje: "Argentina", paisCodigo: "AR", fechas: "Ene 2025 • 10 días", paradas: 4, coverUrl: "https://images.unsplash.com/photo-1526761122248-c31c93f8b2b9?auto=format&fit=crop&w=1200&q=90" },
    { id: "3", titulo: "Fin de semana en París", mensaje: "Francia", paisCodigo: "FR", fechas: "Mar 2025 • 4 días", paradas: 2, coverUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=90" }
  ];

  // Robust array validation
  const HERO_CARDS = Array.isArray(heroData) && heroData.length > 0 ? heroData : fallbackHero;

  console.log('Keeptrip - Hero Cards Data:', { length: HERO_CARDS.length, isI18n: Array.isArray(heroData) });

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + HERO_CARDS.length) % HERO_CARDS.length);
  };

  return (
    <Motion.div style={styles.heroVisual} variants={itemVariants} aria-hidden="true">
      <div style={styles.heroBackground} />
      
      <div style={styles.tripCardsStack} role="region" aria-label="Tarjetas de muestra">
        <AnimatePresence>
          {HERO_CARDS.map((card, idx) => {
              const rawOffset = idx - activeCardIndex;
              const offset = rawOffset < 0 ? HERO_CARDS.length + rawOffset : rawOffset;
              const isFront = offset === 0;

              return (
                <Motion.div
                  key={card.id || idx}
                  layout
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: HERO_CARDS.length - offset,
                    cursor: isFront ? 'grab' : 'auto',
                    pointerEvents: isFront ? 'auto' : 'none',
                    transformOrigin: 'bottom center',
                  }}
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{
                    opacity: offset >= 2 ? 0 : 1 - (offset * 0.15),
                    scale: 1 - (offset * 0.05),
                    y: offset * 25,
                    rotate: offset === 0 ? 0 : (offset === 1 ? -4 : 4),
                  }}
                  exit={{ opacity: 0, scale: 0.8, x: -100 }}
                  drag={isFront ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={(e, { offset }) => {
                    const swipe = offset.x;
                    if (swipe > 80) handlePrevCard();
                    else if (swipe < -80) handleNextCard();
                  }}
                  whileHover={isFront ? { scale: 1.05, y: -8, rotate: 1 } : {}}
                  transition={springTransition}
                >
                  <div style={{ pointerEvents: 'none', width: '100%', height: '100%' }}>
                    <TripCard 
                      trip={{
                        ...card,
                        foto: card.coverUrl,
                        fechaInicio: card.fechas,
                        paradaCount: card.paradas,
                        banderas: card.paisCodigo ? [`https://flagcdn.com/${card.paisCodigo.toLowerCase()}.svg`] : [],
                      }} 
                      isMobile={isMobile} 
                      variant="home" 
                    />
                  </div>
                </Motion.div>
              )
          })}
        </AnimatePresence>

        {/* Glassmorphic Nav Buttons */}
        <div style={styles.heroNavControls}>
          <Motion.div 
              style={styles.heroNavBtn} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevCard}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Motion.div>
          <Motion.div 
              style={styles.heroNavBtn} 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleNextCard}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </Motion.div>
        </div>
      </div>
    </Motion.div>
  );
};

export default InteractiveCardStack;
