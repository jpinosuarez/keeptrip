import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const InteractiveCardStack = () => {
  const { t } = useTranslation(['landing']);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Fallback data in case translations don't return objects properly
  const rawHeroCards = t('landing:mockTrips.hero', { returnObjects: true });
  const fallbackHero = [
    { id: "1", titulo: "Misterios de Kioto", paisCodigo: "JP", fechas: "Oct 2024 • 14 días", paradas: 6, coverUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80" },
    { id: "2", titulo: "Expedición Patagonia", paisCodigo: "AR", fechas: "Ene 2025 • 10 días", paradas: 4, coverUrl: "https://images.unsplash.com/photo-1526761122248-c31c93f8b2b9?auto=format&fit=crop&w=600&q=80" },
    { id: "3", titulo: "Fin de semana en París", paisCodigo: "FR", fechas: "Mar 2025 • 4 días", paradas: 2, coverUrl: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=600&q=80" }
  ];
  const HERO_CARDS = Array.isArray(rawHeroCards) && rawHeroCards.length > 0 ? rawHeroCards : fallbackHero;

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + HERO_CARDS.length) % HERO_CARDS.length);
  };

  return (
    <motion.div style={styles.heroVisual} variants={itemVariants} aria-hidden="true">
      <div style={styles.heroBackground} />
      
      <div style={styles.tripCardsStack} role="region" aria-label="Tarjetas de muestra">
        <AnimatePresence>
          {HERO_CARDS.map((card, idx) => {
              const rawOffset = idx - activeCardIndex;
              const offset = rawOffset < 0 ? HERO_CARDS.length + rawOffset : rawOffset;
              const isFront = offset === 0;

              return (
                <motion.div
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
                  initial={false}
                  animate={{
                    opacity: offset === 2 ? 0 : 1 - (offset * 0.15),
                    scale: 1 - (offset * 0.05),
                    y: offset * 25,
                    rotate: offset === 0 ? 0 : (offset === 1 ? -4 : 4),
                  }}
                  drag={isFront ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
                  onDragEnd={(e, { offset }) => {
                    if (offset.x > 50) handlePrevCard();
                    else if (offset.x < -50) handleNextCard();
                  }}
                  whileHover={isFront ? { scale: 1.02, y: -4, rotate: 2 } : {}}
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
                      isMobile={true} 
                      variant="home" 
                    />
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
  );
};

export default InteractiveCardStack;
