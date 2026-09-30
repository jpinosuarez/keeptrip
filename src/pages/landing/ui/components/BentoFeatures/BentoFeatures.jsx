import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Map, BarChart2, Camera, MapPin, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorldMapSVG } from '@shared/ui/components/WorldMapSVG';
import TripCard from '../../../../../widgets/tripGrid/ui/TripCard';
import { mapLandingMockTripToCard } from '../../lib/mapLandingMockTripToCard';

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

  const rawGridCards = t('landing:mockTrips.grid', { returnObjects: true });
  const fallbackGrid = [
    { id: '4', titulo: 'Safari en el Serengeti', paisCodigo: 'TZ', fechaInicio: '2025-08-03', fechaFin: '2025-08-11', ciudades: 'Arusha, Serengeti, Ngorongoro', coverUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=90' },
    { id: '5', titulo: 'Circulo Dorado', paisCodigo: 'IS', fechaInicio: '2025-11-14', fechaFin: '2025-11-18', ciudades: 'Reikiavik, Geysir, Gullfoss', coverUrl: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1200&q=90' },
    { id: '6', titulo: 'Roadtrip Costa Oeste', paisCodigo: 'US', fechaInicio: '2026-04-05', fechaFin: '2026-04-17', ciudades: 'Los Angeles, San Francisco, Yosemite', coverUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=90' },
    { id: '7', titulo: 'Verano en Amalfi', paisCodigo: 'IT', fechaInicio: '2026-07-02', fechaFin: '2026-07-08', ciudades: 'Napoles, Positano, Amalfi', coverUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=90' }
  ];
  const mockGrid = Array.isArray(rawGridCards) && rawGridCards.length > 0 ? rawGridCards : fallbackGrid;

  return (
    <Motion.section 
      className="relative z-10 w-full max-w-[1200px] mx-auto px-6 md:px-12 py-8 md:py-10 mb-24 grid grid-cols-1 md:grid-cols-12 md:grid-rows-[minmax(220px,auto)] gap-8 md:gap-6"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      {/* Card 1: Rutas Vivas */}
      <Motion.div
        className="md:col-span-7 relative flex flex-col justify-between gap-4 p-8 md:p-10 rounded-3xl bg-white/70 backdrop-blur-md border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] min-h-[260px] overflow-hidden"
        variants={itemVariants}
        whileHover={{ scale: 1.005, y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div className="flex justify-between items-start w-full">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-atomicTangerine/15 shrink-0" aria-hidden="true">
            <Map size={24} className="text-atomicTangerine" strokeWidth={2} />
          </div>
          <span className="text-[0.8rem] font-black text-atomicTangerine opacity-50 tracking-[1.5px] uppercase" aria-hidden="true">01</span>
        </div>

        <div className="relative w-full flex-1 min-h-[240px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#E2E8F0] flex items-stretch justify-center">
          <WorldMapSVG color="#ff7e42" />
        </div>

        <div>
           <div className="text-[1.3rem] md:text-[1.8rem] font-black text-charcoalBlue tracking-tight leading-tight mt-auto">{t('landing:features.liveRoutes.title', 'Living Routes')}</div>
           <p className="m-0 text-[0.95rem] md:text-[1.05rem] text-text-secondary leading-relaxed font-body md:max-w-[80%]">{t('landing:features.liveRoutes.description', 'Document each stop...')}</p>
        </div>
      </Motion.div>

      {/* Card 2: Travel Stats */}
      <Motion.div
        className="md:col-span-5 relative flex flex-col justify-between gap-4 p-8 md:p-10 rounded-3xl bg-white/70 backdrop-blur-md border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] min-h-[260px] overflow-hidden"
        variants={itemVariants}
        whileHover={{ scale: 1.01, y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div className="flex justify-between items-start w-full">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-mutedTeal/15 shrink-0" aria-hidden="true">
            <BarChart2 size={24} className="text-mutedTeal" strokeWidth={2} />
          </div>
          <span className="text-[0.8rem] font-black text-mutedTeal opacity-50 tracking-[1.5px] uppercase" aria-hidden="true">02</span>
        </div>

        {/* Premium Marketing Stats UI */}
        <div className="flex flex-col gap-5 py-6 flex-1">
          <div className="flex gap-4 w-full">
            <div className="flex-1 flex flex-col gap-2 p-6 md:px-5 md:py-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all">
              <div className="mb-1 flex items-center justify-start">
                 <Globe size={20} className="text-atomicTangerine" />
              </div>
              <div className="text-[3.2rem] font-black text-charcoalBlue leading-none tracking-[-2px] flex items-baseline gap-0.5">
                {t('landing:features.stats.países.value')}
              </div>
              <div className="text-[0.85rem] font-extrabold text-text-secondary uppercase tracking-widest">
                {t('landing:features.stats.países.label')}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-2 p-6 md:px-5 md:py-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all">
              <div className="mb-1 flex items-center justify-start">
                 <MapPin size={20} className="text-atomicTangerine" />
              </div>
              <div className="text-[3.2rem] font-black text-charcoalBlue leading-none tracking-[-2px] flex items-baseline gap-0.5">
                {t('landing:features.stats.mundo.value')}<span className="text-[1.5rem] text-atomicTangerine ml-0.5">%</span>
              </div>
              <div className="text-[0.85rem] font-extrabold text-text-secondary uppercase tracking-widest">
                {t('landing:features.stats.mundo.label')}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-2 p-6 md:px-6 md:py-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all">
            <div className="flex flex-col gap-1">
              <div className="text-[2.5rem] font-black text-charcoalBlue leading-none tracking-[-2px] flex items-baseline gap-0.5">
                {t('landing:features.stats.destinos.value')}
              </div>
              <div className="text-[0.85rem] font-extrabold text-text-secondary uppercase tracking-widest">
                {t('landing:features.stats.destinos.label')}
              </div>
            </div>
            <div className="w-14 h-14 rounded-full bg-atomicTangerine/15 flex items-center justify-center">
               <Map size={28} className="text-atomicTangerine" />
            </div>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="text-[1.3rem] font-black text-charcoalBlue tracking-tight leading-tight mt-auto">{t('landing:features.stats.title')}</div>
          <p className="m-0 text-[0.95rem] text-text-secondary leading-relaxed font-body">{t('landing:features.stats.description')}</p>
        </div>
      </Motion.div>

      {/* Card 3: Your Digital Archive */}
      <Motion.div
        className="md:col-span-12 relative flex flex-col justify-between gap-4 p-8 md:p-10 rounded-3xl bg-white/70 backdrop-blur-md border border-white shadow-[0_4px_12px_rgba(0,0,0,0.03)] min-h-[260px] overflow-hidden"
        variants={itemVariants}
        whileHover={{ scale: 1.01, y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
        transition={springTransition}
      >
        <div className="flex justify-between items-start w-full">
          <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-charcoalBlue/15 shrink-0" aria-hidden="true">
            <Camera size={24} className="text-charcoalBlue" strokeWidth={2} />
          </div>
          <span className="text-[0.8rem] font-black text-charcoalBlue opacity-50 tracking-[1.5px] uppercase" aria-hidden="true">03</span>
        </div>

        <div className="flex flex-col gap-4 flex-1 mt-4 overflow-hidden relative">
          {mockGrid.map((card, idx) => (
            <Motion.div 
              key={card.id || idx} 
              variants={itemVariants}
              className="mb-4 z-[1]"
            >
              <div className="h-[220px] pointer-events-none">
                <TripCard 
                  trip={mapLandingMockTripToCard(card)}
                  isMobile={true}
                  variant="list"
                />
              </div>
            </Motion.div>
          ))}
        </div>

        <div className="pt-3 z-10 relative bg-white/95 -mx-8 -mb-8 px-8 pb-8 rounded-b-3xl">
          <div className="text-[1.3rem] font-black text-charcoalBlue tracking-tight leading-tight mt-auto">{t('landing:features.gallery.title')}</div>
          <p className="m-0 text-[0.95rem] text-text-secondary leading-relaxed font-body">{t('landing:features.gallery.description')}</p>
        </div>
      </Motion.div>
    </Motion.section>
  );
};

export default BentoFeatures;
