import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib/utils/cn';

// Ensure we import TripCard
import TripCard from '../../../../../widgets/tripGrid/ui/TripCard';
import { mapLandingMockTripToCard } from '../../lib/mapLandingMockTripToCard';

const springTransition = { type: 'spring', damping: 20, stiffness: 100 };

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: springTransition },
};

const InteractiveCardStack = () => {
  const { t } = useTranslation(['landing']);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Fetch localized data with extreme safety
  let heroData = t('landing:mockTrips.hero', { returnObjects: true });
  
  // High-fidelity fallback
  const quality = 80;
  const width = 800;
  const fallbackHero = [
    { id: '1', titulo: 'Misterios de Kioto', paisCodigo: 'JP', fechaInicio: '2024-10-02', fechaFin: '2024-10-16', ciudades: 'Kioto, Nara, Osaka', coverUrl: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=${width}&q=${quality}` },
    { id: '2', titulo: 'Expedición Patagonia', paisCodigo: 'AR', fechaInicio: '2025-01-11', fechaFin: '2025-01-21', ciudades: 'El Calafate, El Chalten, Ushuaia', coverUrl: `https://images.unsplash.com/photo-1526761122248-c31c93f8b2b9?auto=format&fit=crop&w=${width}&q=${quality}` },
    { id: '3', titulo: 'Fin de semana en Paris', paisCodigo: 'FR', fechaInicio: '2025-03-08', fechaFin: '2025-03-12', ciudades: 'Paris, Versalles', coverUrl: `https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=${width}&q=${quality}` }
  ];

  const HERO_CARDS = (Array.isArray(heroData) && heroData.length > 0 ? heroData : fallbackHero).map(card => {
    if (card.coverUrl && card.coverUrl.includes('unsplash.com')) {
      const fixedUrl = new URL(card.coverUrl);
      fixedUrl.searchParams.set('w', String(width));
      fixedUrl.searchParams.set('q', String(quality));
      return { ...card, coverUrl: fixedUrl.toString() };
    }
    return card;
  });

  const handleNextCard = () => {
    setActiveCardIndex((prev) => (prev + 1) % HERO_CARDS.length);
  };

  const handlePrevCard = () => {
    setActiveCardIndex((prev) => (prev - 1 + HERO_CARDS.length) % HERO_CARDS.length);
  };

  return (
    <Motion.div className="relative w-full h-[420px] flex justify-center items-center" variants={itemVariants} aria-hidden="true">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[radial-gradient(circle,theme(colors.atomicTangerine/0.3)_0%,transparent_65%)] pointer-events-none z-[1]" />
      
      <div className="relative w-[280px] h-[360px] z-[2] [perspective:1000px]" role="region" aria-label="Tarjetas de muestra">
        <AnimatePresence>
          {HERO_CARDS.map((card, idx) => {
              const rawOffset = idx - activeCardIndex;
              const offset = rawOffset < 0 ? HERO_CARDS.length + rawOffset : rawOffset;
              const isFront = offset === 0;

              return (
                <Motion.div
                  key={card.id || idx}
                  layout
                  className={cn(
                    "absolute top-0 left-0 w-full h-full",
                    isFront ? "cursor-grab pointer-events-auto" : "cursor-auto pointer-events-none"
                  )}
                  style={{ 
                    zIndex: HERO_CARDS.length - offset,
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
                  <div className="pointer-events-none w-full h-full">
                    <TripCard 
                      trip={mapLandingMockTripToCard(card)}
                      isMobile={false} 
                      variant="home" priorityImage={isFront} 
                    />
                  </div>
                </Motion.div>
              )
          })}
        </AnimatePresence>

        {/* Glassmorphic Nav Buttons */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%+72px)] flex justify-between items-center z-10 pointer-events-none">
          <Motion.button 
              type="button"
              className="w-12 h-12 rounded-full border border-white/60 bg-white/85 backdrop-blur-xl flex justify-center items-center cursor-pointer text-charcoalBlue shadow-md pointer-events-auto shrink-0 transition-all" 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevCard}
              aria-label={t('nav:prev', 'Anterior')}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </Motion.button>
          <Motion.button 
              type="button"
              className="w-12 h-12 rounded-full border border-white/60 bg-white/85 backdrop-blur-xl flex justify-center items-center cursor-pointer text-charcoalBlue shadow-md pointer-events-auto shrink-0 transition-all" 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={handleNextCard}
              aria-label={t('nav:next', 'Siguiente')}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </Motion.button>
        </div>
      </div>
    </Motion.div>
  );
};

export default InteractiveCardStack;
