import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Image as ImageIcon, Trash2, Calendar, MapPin, Clock, LoaderCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  FOTO_DEFAULT_URL,
  formatStorytellingDate,
  formatCitiesSummary,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode, getFlagUrl } from '@shared/lib/utils/countryUtils';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { cn } from '@shared/lib/utils/cn';

const getAuraGridStyle = (count) => {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count === 2) return "grid-cols-1 grid-rows-2";
  return "grid-cols-2 grid-rows-2";
};

const getAuraFlagClass = (count, index) => {
  if (count === 3 && index === 2) return "col-span-2";
  return "";
};

const EditableTripHeader = ({
  formData,
  setFormData,
  paradas,
  galleryFiles,
  setGalleryFiles,
  isMobile,
  isProcessingImage,
  onTituloChange,
  isTituloAuto,
  onRegenerateTitle,
}) => {
  const { t, i18n } = useTranslation(['dashboard', 'common', 'countries']);
  const fileInputRef = useRef(null);
  const titleTextareaRef = useRef(null);
  
  const [showMenu, setShowMenu] = useState(false);
  const [titleFontSize, setTitleFontSize] = useState(isMobile ? 24 : 28);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isCameraHovered, setIsCameraHovered] = useState(false);

  // Drag logic for Cover image
  const [dragProgress, setDragProgress] = useState(formData?.coverPositionY ?? 50);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartProgress = useRef(0);
  const imageContainerRef = useRef(null);

  // Derivar preview actual (fotoFile tiene precedencia, luego portadaUrl)
  const currentPreview = useMemo(() => {
    if (galleryFiles && galleryFiles.length > 0 && galleryFiles[0]) {
      return URL.createObjectURL(galleryFiles[0]);
    }
    if (formData?.portadaUrl && formData.portadaUrl !== FOTO_DEFAULT_URL) {
      return formData.portadaUrl;
    }
    return null;
  }, [galleryFiles, formData?.portadaUrl]);

  // Mosaico Reactivo Nivel 2
  const auraFlags = useMemo(() => {
    const normalizedStopCountries = [...new Set(
      (Array.isArray(paradas) ? paradas : [])
        .map((parada) => normalizeCountryCode(parada?.paisCodigo || parada?.code || null))
        .filter(Boolean)
    )];

    const fallbackFormCountry = normalizeCountryCode(formData?.code || formData?.paisCodigo || formData?.countryCode || null);
    const normalizedCountries = normalizedStopCountries.length > 0
      ? normalizedStopCountries
      : [...new Set([fallbackFormCountry].filter(Boolean))];

    const flagUrls = normalizedCountries
      .map(code => getFlagUrl(code))
      .filter(Boolean);

    return (flagUrls.length > 0 ? flagUrls : [FOTO_DEFAULT_URL]).slice(0, 4);
  }, [paradas, formData?.code, formData?.paisCodigo, formData?.countryCode]);

  // Título Auto-Ajustable
  const adjustTitleHeight = React.useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto'; // Reset
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 1.25;
    const maxHeight = lineHeight * 3;
    const currentHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${currentHeight}px`;
  }, []);

  const adjustTitleFont = React.useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth || el.parentElement?.clientWidth || 200;
    const maxSize = isMobile ? 28 : 32;
    const minSize = isMobile ? 18 : 20;
    const target = Math.round(Math.max(minSize, Math.min(maxSize, maxSize - (formData?.titulo?.length || 0) * 0.15)));
    
    if (target !== titleFontSize) setTitleFontSize(target);

    // Ajuste extra si sigue habiendo overflow (aunque tenemos wrap)
    let recalculated = target;
    while (el.scrollWidth > containerWidth && recalculated > minSize) {
      recalculated -= 1;
    }
    if (recalculated !== target) setTitleFontSize(recalculated);
    el.style.fontSize = `${recalculated}px`;
  }, [formData?.titulo, isMobile, titleFontSize]);

  useEffect(() => {
    adjustTitleFont();
    adjustTitleHeight();
  }, [adjustTitleFont, adjustTitleHeight]);

  // Manejo de Fotos
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryFiles([file]);
    setShowMenu(false);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setGalleryFiles([]);
    setFormData(prev => ({ ...prev, portadaUrl: null }));
    setShowMenu(false);
  };

  // Drag Handlers para Reposicionamiento Vertical
  const handlePointerDown = (e) => {
    if (!currentPreview || isMobile) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartProgress.current = dragProgress;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !imageContainerRef.current) return;
    const deltaY = e.clientY - dragStartY.current;
    
    const containerHeight = imageContainerRef.current.offsetHeight;
    const scrollableRatio = 1; // Controla la sensibilidad del drag
    const deltaPercent = (deltaY / Math.max(containerHeight, 1)) * 100 * scrollableRatio;
    
    const newProgress = Math.max(0, Math.min(100, dragStartProgress.current - deltaPercent));
    setDragProgress(newProgress);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragProgress !== formData?.coverPositionY) {
      setFormData(prev => ({ ...prev, coverPositionY: Math.round(dragProgress) }));
    }
  };

  // Pills format
  const startDate = formData?.fechaInicio || null;
  const endDate = formData?.fechaFin || null;
  const datePillText = formatStorytellingDate(startDate, endDate, i18n.language) || '--';
  
  const parsedCities = Array.isArray(paradas) && paradas.length > 0 ? paradas : [];
  const citiesPillText = formatCitiesSummary(parsedCities, t) || t('labels.noStopsSummary', { ns: 'dashboard', defaultValue: '--' });
  
  const daysCount = calculateTripDays(startDate, endDate);
  const durationPillText = daysCount > 0 
    ? t('days', { count: daysCount, ns: 'common', defaultValue: `${daysCount} días` })
    : '--';

  const MenuItemButton = ({ onClick, isDanger, icon: IconComponent, children }) => {
    return (
      <button 
        type="button" 
        className={cn(
          "w-full flex items-center gap-3 p-3.5 text-left font-semibold text-[0.95rem] transition-colors rounded-lg",
          isDanger ? "text-danger hover:bg-danger/10" : "text-textPrimary hover:bg-black/5"
        )}
        onClick={onClick}
      >
        <IconComponent size={20} strokeWidth={2} />
        {children}
      </button>
    );
  };

  const ActionMenu = () => {
    const content = (
      <>
        <MenuItemButton onClick={() => { fileInputRef.current?.click(); }} icon={ImageIcon} isDanger={false}>
          {t('gallery.changeCover', { ns: 'editor', defaultValue: 'Cambiar portada' })}
        </MenuItemButton>
        {currentPreview && (
          <MenuItemButton onClick={handleRemovePhoto} icon={Trash2} isDanger={true}>
            {t('gallery.removeCover', { ns: 'editor', defaultValue: 'Quitar foto' })}
          </MenuItemButton>
        )}
      </>
    );

    if (isMobile) {
      return (
        <AnimatePresence>
          {showMenu && (
            <>
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99]"
                onClick={() => setShowMenu(false)} 
              />
              <Motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 p-5 bg-surface rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.15)] z-[100] flex flex-col gap-2"
              >
                {content}
                <button 
                  type="button" 
                  className="w-full flex items-center justify-center gap-3 p-3.5 text-left font-bold text-[0.95rem] transition-colors rounded-lg mt-2 bg-black/5"
                  onClick={() => setShowMenu(false)}
                >
                  {t('button.cancel', { ns: 'common', defaultValue: 'Cancelar' })}
                </button>
              </Motion.div>
            </>
          )}
        </AnimatePresence>
      );
    }

    return (
      <AnimatePresence>
        {showMenu && (
          <Motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 w-56 bg-surface/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-xl overflow-hidden z-50 p-1"
          >
            {content}
          </Motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden flex flex-col justify-end bg-slate-900 transition-[height] duration-200",
        isMobile ? "aspect-[4/3] min-h-[280px] rounded-b-3xl" : "aspect-[16/6] min-h-[380px] rounded-xl shadow-lg"
      )}
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <div 
          ref={imageContainerRef}
          className={cn(
            "w-full h-full relative overflow-hidden select-none touch-none",
            isMobile ? "cursor-default" : (isDragging ? "cursor-grabbing" : "cursor-grab")
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {currentPreview ? (
            <img 
              src={currentPreview} 
              alt="Cover preview" 
              draggable={false}
              className="w-full h-full object-cover select-none"
              style={{ 
                objectPosition: `center ${dragProgress}%`,
              }} 
            />
          ) : (
            <div className="w-full h-full relative overflow-hidden bg-slate-800" aria-hidden="true">
              <div className={cn("grid w-[120%] h-[120%] -translate-x-[10%] -translate-y-[10%] blur-[40px] opacity-40", getAuraGridStyle(auraFlags.length))}>
                {auraFlags.map((flag, idx) => (
                  <img
                    key={`header-flag-${idx}`}
                    src={flag}
                    alt=""
                    className={cn("w-full h-full object-cover", getAuraFlagClass(auraFlags.length, idx))}
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" />
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent z-[1] pointer-events-none" />
      </div>

      {/* Top Floating Actions */}
      <div className="absolute top-4 left-4 right-4 flex justify-end items-center z-[10] pointer-events-none">
        {isProcessingImage && (
          <div className="mr-auto flex items-center gap-1.5 text-white text-[0.8rem] font-bold">
            <LoaderCircle size={16} className="animate-spin" /> Optimizando
          </div>
        )}
        
        <div className="relative pointer-events-auto">
          <button 
            type="button" 
            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/25 backdrop-blur-md border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/35 hover:scale-105 active:scale-95"
            onMouseEnter={() => setIsCameraHovered(true)}
            onMouseLeave={() => setIsCameraHovered(false)}
            onClick={() => setShowMenu(!showMenu)}
            aria-label={t('gallery.changeCover', { ns: 'editor', defaultValue: 'Cambiar portada' })}
          >
            <Camera size={20} strokeWidth={1.5} className="text-white" />
          </button>
          <ActionMenu />
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        ref={fileInputRef} 
        className="hidden"
        onChange={handleFileChange} 
      />

      {/* Bottom Content: Title and Pills */}
      <div className="relative z-[2] px-6 pb-6 w-full flex flex-col gap-4">
        <div className="flex flex-col gap-1 max-w-[90%] items-start">
          {/* Magic Button shown when title is manually modified */}
          {!isTituloAuto && (
            <button
              className="self-start mb-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[0.75rem] font-bold flex items-center gap-1.5 transition-all hover:bg-white/20 active:scale-95 shadow-sm"
              onClick={onRegenerateTitle}
              type="button"
              aria-label={t('editor.header.regenerateTitleBtn', { defaultValue: 'Generar título automático' })}
            >
              <Sparkles size={14} />
              {t('editor.header.regenerateTitleBtn', { defaultValue: 'Generar título automático' })}
            </button>
          )}

          <textarea
            ref={titleTextareaRef}
            value={formData?.titulo || ''}
            aria-label={t('tripTitleAriaLabel', { ns: 'editor', defaultValue: 'Título del viaje' })}
            onChange={(e) => {
              onTituloChange && onTituloChange(e.target.value);
              adjustTitleFont();
              adjustTitleHeight();
            }}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            placeholder={t('tripTitlePlaceholder', { ns: 'editor', defaultValue: 'Título del viaje' })}
            className={cn(
              "w-full bg-transparent border-none text-white font-extrabold tracking-tight p-0 m-0 outline-none resize-none overflow-hidden transition-all placeholder:text-white/40 shadow-sm",
              isTitleFocused && "border-b border-dashed border-white/40"
            )}
            rows={1}
            maxLength={80}
            onInput={() => {
              adjustTitleFont();
              adjustTitleHeight();
            }}
            style={{ fontSize: `${titleFontSize}px` }}
          />

          {/* Hint text shown when title is manually modified or affordance to edit */}
          {!isTituloAuto ? (
            <small className="text-white/50 text-[0.7rem] font-bold uppercase tracking-wider mt-0.5">
              {t('editor.header.manualTitleHint', { defaultValue: 'Estás usando un título manual' })}
            </small>
          ) : (
            <small className={cn(
              "text-white/40 text-[0.7rem] font-bold uppercase tracking-wider mt-0.5 transition-opacity duration-300 pointer-events-none",
              isTitleFocused ? "opacity-0" : "opacity-100"
            )}>
              {t('editor.header.editTitleHint', { defaultValue: 'Toca para editar el título' })}
            </small>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/90 text-[0.8rem] font-semibold whitespace-nowrap shadow-sm">
            <Calendar size={14} /> {datePillText}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/90 text-[0.8rem] font-semibold whitespace-nowrap shadow-sm">
            <MapPin size={14} /> {citiesPillText}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white/90 text-[0.8rem] font-semibold whitespace-nowrap shadow-sm">
            <Clock size={14} /> {durationPillText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditableTripHeader;