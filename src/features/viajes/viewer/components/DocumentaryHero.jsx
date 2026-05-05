import React from 'react';
import { motion as Motion } from 'framer-motion';
import { Calendar, ArrowLeft, Trash2, LoaderCircle, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDateRange, getInitials, FOTO_DEFAULT_URL } from '@shared/lib/utils/viajeUtils';    
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';
import { cn } from '@shared/lib/utils/cn';
import ShareStoryButton from '@shared/ui/components/ShareStoryButton';
import DocumentaryFlagHero from '@shared/ui/components/DocumentaryFlagHero';

/**
 * Premium editorial cover with dynamic flag shards and spatial typography.
 */
const DocumentaryHero = ({
  isMobile,
  fotoMostrada,
  isBusy,
  onClose,
  storyData,
  isSharedTrip,
  onDelete,
  isDeleting,
  onOpenEdit,
  data,
  viajeBase,
  ownerDisplayName,
  isRouteMode,
}) => {
  const { t, i18n } = useTranslation(['countries', 'visor']);

  const isDefaultPhoto = !fotoMostrada || fotoMostrada === FOTO_DEFAULT_URL;
  const countryCode = data?.paisCodigo || data?.code || viajeBase?.paisCodigo || viajeBase?.code || null;
  const localizedCountryName = getLocalizedCountryName(countryCode, i18n.language, t);
  const legacyCountryName = data?.nombreEspanol || data?.nameSpanish || viajeBase?.nombreEspanol || viajeBase?.nameSpanish;
  const fallbackTitle = localizedCountryName || legacyCountryName || t('untitledTrip', { ns: 'visor', defaultValue: 'Travesía Sin Nombre' });
  const heroTitle = data?.titulo || fallbackTitle;

  return (
    <div className={cn(
      "relative w-full flex flex-col justify-end overflow-hidden",
      isMobile ? "min-h-[45vh]" : "min-h-[65vh]"
    )}>
      {/* Background Layer */}
      <div className="absolute inset-0 h-full overflow-hidden z-[1] bg-charcoalBlue">
        {!isDefaultPhoto ? (
          <div className={cn(
            "w-full relative flex flex-col justify-end overflow-hidden rounded-b-[2rem]",
            isMobile ? "h-[45vh] min-h-[240px]" : "h-[60vh] min-h-[320px]"
          )}>
            <img
              src={fotoMostrada}
              alt={heroTitle}
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover z-[1]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85 pointer-events-none z-[5]" />
          </div>
        ) : (
          <DocumentaryFlagHero banderas={data.banderas} className="w-full h-full bg-charcoalBlue" />
        )}
        
        {/* Film Grain & Noise Overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none z-[4] bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_400_400%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noiseFilter%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.65%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        <div className="absolute inset-0 z-[3] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      </div>

      {/* Navigation UI */}
      <div className="absolute top-[max(16px,env(safe-area-inset-top,16px))] left-4 right-4 flex justify-between items-center z-[20]">
        <button 
          onClick={onClose} 
          className={cn(
            "backdrop-blur-md bg-black/40 border border-white/20 rounded-full w-11 h-11 flex items-center justify-center text-white shadow-md transition-all cursor-pointer",
            isBusy && "opacity-50 cursor-not-allowed"
          )}
          disabled={isBusy}
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex gap-2 items-center">
          <ShareStoryButton data={storyData} />
          {!isSharedTrip && (
            <button 
              onClick={onDelete} 
              data-testid="documentary-hero-delete"
              className={cn(
                "backdrop-blur-md bg-black/40 border border-white/20 rounded-full w-11 h-11 flex items-center justify-center text-white shadow-md transition-all cursor-pointer",
                isBusy && "opacity-50 cursor-not-allowed"
              )}
              disabled={isBusy} 
              title="Eliminar viaje"
            >
              {isDeleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} className="text-danger" />}
            </button>
          )}
          {!isSharedTrip && (
            <button 
              onClick={onOpenEdit} 
              data-testid="documentary-hero-open-edit"
              className={cn(
                "backdrop-blur-md bg-black/40 text-white border border-white/20 rounded-full px-[22px] py-[10px] font-bold text-[0.85rem] flex gap-2 items-center shadow-md transition-all cursor-pointer",
                isBusy && "opacity-50 cursor-not-allowed"
              )}
              disabled={isBusy}
            >
              <Edit3 size={15} /> Editar
            </button>
          )}
        </div>
      </div>

      {/* Content Layer (Editorial Typography) */}
      <div className={cn(
        "relative z-[10] px-4 md:px-8 pb-5 md:pb-8 max-w-[1100px] mx-auto w-full flex flex-col gap-2.5",
        isMobile ? "pt-[100px]" : "pt-[150px]"
      )}>
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex gap-2 items-center">
            {data.banderas && data.banderas.length > 0 ? (
              data.banderas.slice(0, 5).map((b, i) => (
                <img 
                  key={i} 
                  src={b.startsWith('http') ? b : getFlagUrl(b)} 
                  alt="flag" 
                  loading="lazy" 
                  className="w-9 h-auto rounded shadow-sm border border-white/20"
                />
              ))
            ) : (
              <span className="text-[2.4rem] [text-shadow:0_4px_10px_rgba(0,0,0,0.3)]">✈️</span>
            )}
          </div>

          <h1 
            data-testid="visor-title" 
            className={cn(
              "text-white font-black my-2 leading-[0.95] tracking-tighter [text-shadow:0_10px_40px_rgba(0,0,0,0.6)] max-w-[900px] font-heading",
              isMobile ? "text-[2.8rem]" : "text-[4.5rem]"
            )}
          >
            {heroTitle}
          </h1>

          <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
            <span className="inline-flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3.5 py-[7px] rounded-full text-white text-[0.82rem] font-semibold border border-white/20">
              <Calendar size={13} strokeWidth={2.5} /> {formatDateRange(data.fechaInicio, data.fechaFin)}
            </span>

            {isSharedTrip && (
              <span data-testid="visor-shared-badge" className="inline-flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3.5 py-[7px] rounded-full text-[#e0e7ff] text-[0.82rem] font-semibold border border-white/10">
                🤝 Compartido por {ownerDisplayName || '...'}
              </span>
            )}
          </div>

          {isRouteMode && (
            <div data-testid="visor-storytelling" className="mt-5">
              <div className="flex gap-2 items-center flex-wrap mt-1">
                {data.presupuesto && (
                  <span className="px-2.5 py-[5px] rounded-full backdrop-blur-md bg-black/40 text-white/90 text-[0.78rem] font-semibold border border-white/10">💰 {data.presupuesto}</span>
                )}
                {(data.vibe || []).map((v, i) => (
                  <span key={i} className="px-2.5 py-[5px] rounded-full bg-atomicTangerine/20 text-[#ffd4b8] text-[0.78rem] font-semibold border border-atomicTangerine/25">{v}</span>
                ))}
                
                <div className="flex -space-x-2">
                  {(data.companions || []).slice(0, 4).map((c, idx) => (
                    <div key={idx} title={c.name || c.email} className="w-[26px] h-[26px] rounded-full backdrop-blur-md bg-black/40 flex items-center justify-center text-[0.65rem] font-bold text-white/90 border border-white/15">
                      {getInitials(c.name || c.email)}
                    </div>
                  ))}
                  {(data.companions || []).length > 4 && (
                    <span className="flex items-center text-[0.7rem] text-white font-black pl-3">+{(data.companions || []).length - 4}</span>
                  )}
                </div>
              </div>

              {(data.highlights?.topFood || data.highlights?.topView || data.highlights?.topTip) && (
                <div className="flex gap-2 items-center flex-wrap mt-2.5">
                  {data.highlights?.topFood && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">🍽️ {data.highlights.topFood}</span>}
                  {data.highlights?.topView && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">👀 {data.highlights.topView}</span>}
                  {data.highlights?.topTip && <span className="backdrop-blur-md bg-black/40 px-3 py-[6px] rounded-full text-white/90 text-[0.78rem] font-semibold border border-white/10">💡 {data.highlights.topTip}</span>}
                </div>
              )}
            </div>
          )}
        </Motion.div>
      </div>
    </div>
  );
};

export default DocumentaryHero;
