import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MapPin, Globe, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { styles } from './InteractiveCardStack.styles';

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const InteractiveCardStack = () => {
  const { t } = useTranslation(['landing']);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const HERO_CARDS = [
    { id: 1, title: t('landing:mockCards.card1.title', 'Tailandia Backpacking'), location: t('landing:mockCards.card1.location', 'Asia'), date: t('landing:mockCards.card1.date', 'Oct 2024 • 14 días'), icon: MapPin, img: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=800&auto=format&fit=crop' },
    { id: 2, title: t('landing:mockCards.card2.title', 'París Inolvidable'), location: t('landing:mockCards.card2.location', 'Europa'), date: t('landing:mockCards.card2.date', 'Mar 2025 • 7 días'), icon: Globe, img: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop' },
    { id: 3, title: t('landing:mockCards.card3.title', 'Ruta 40'), location: t('landing:mockCards.card3.location', 'Sudamérica'), date: t('landing:mockCards.card3.date', 'Ene 2026 • 20 días'), icon: Navigation, img: 'https://images.unsplash.com/photo-1596422846543-74fc8e6138c8?q=80&w=800&auto=format&fit=crop' }
  ];

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + HERO_CARDS.length) % HERO_CARDS.length);
  };

  return (
    <motion.div style={styles.heroVisual} variants={itemVariants} aria-hidden="true">
      {/* Orb atmosférico de fondo */}
      <div style={styles.heroBackground} />
      
      {/* The Interactive Trip Cards Deck */}
      <div style={styles.tripCardsStack} role="region" aria-label="Tarjetas de muestra">
        <AnimatePresence>
          {HERO_CARDS.map((card, idx) => {
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
  );
};

export default InteractiveCardStack;
