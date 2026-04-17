import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Image as ImageIcon, Trash2, Calendar, MapPin, Clock, LoaderCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { styles } from './EditableTripHeader.styles';
import { 
  FOTO_DEFAULT_URL,
  formatStorytellingDate,
  formatCitiesSummary,
  calculateTripDays,
} from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode, getFlagUrl } from '@shared/lib/utils/countryUtils';
import { AnimatePresence, motion as Motion } from 'framer-motion';

const getAuraGridStyle = (count) => {
  if (count <= 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
  if (count === 2) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' };
  return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
};

const getAuraFlagStyle = (count, index) => {
  if (count === 3 && index === 2) return { gridColumn: '1 / span 2' };
  return null;
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

  const auraGridStyle = getAuraGridStyle(auraFlags.length);

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
    
    // We update the formdata as well to clear the URL since we have a local file preview now.
    // If the hook prefers keeping the URL we leave it, the memo uses galleryFiles preview first.
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
    const [isHovered, setIsHovered] = useState(false);
    const iconNode = React.createElement(IconComponent, { size: 20, strokeWidth: 2 });
    return (
      <button 
        type="button" 
        style={{ 
          ...styles.menuItem(isDanger), 
          backgroundColor: isHovered 
            ? (isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.04)') 
            : 'transparent' 
        }} 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        {iconNode}
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
                style={styles.mobileSheetOverlay} 
                onClick={() => setShowMenu(false)} 
              />
              <Motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                style={styles.cameraMenuMobileSheet}
              >
                {content}
                <button 
                  type="button" 
                  style={{ ...styles.menuItem(false), justifyContent: 'center', marginTop: '8px', backgroundColor: 'rgba(0,0,0,0.05)', fontWeight: '700' }} 
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
            style={styles.cameraMenuDesktop}
          >
            {content}
          </Motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div style={styles.headerWrapper(isMobile)}>
      {/* Dynamic Background */}
      <div style={styles.bgWrapper}>
        <div 
          ref={imageContainerRef}
          style={{ ...styles.bgImageHolder, cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp} // cancel Si el ratón sale mientras arrastra
        >
          {currentPreview ? (
            <img 
              src={currentPreview} 
              alt="Cover preview" 
              draggable={false} // previene el arrastre nativo de imagen
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: `center ${dragProgress}%`,
                userSelect: 'none'
              }} 
            />
          ) : (
            <div style={styles.fallbackAuraContainer} aria-hidden="true">
              <div style={{ ...styles.fallbackAuraTrack, ...auraGridStyle }}>
                {auraFlags.map((flag, idx) => (
                  <img
                    key={`header-flag-${idx}`}
                    src={flag}
                    alt=""
                    style={{ ...styles.fallbackAuraFlag, ...getAuraFlagStyle(auraFlags.length, idx) }}
                    loading="lazy"
                  />
                ))}
              </div>
              <div style={styles.fallbackAuraOverlay} />
            </div>
          )}
        </div>
        <div style={styles.overlay} />
      </div>

      {/* Top Floating Actions */}
      <div style={styles.topContent}>
        {isProcessingImage && (
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
            <LoaderCircle size={16} className="spin" /> Optimizando
          </div>
        )}
        
        <div style={{ position: 'relative' }}>
          <button 
            type="button" 
            style={{
              ...styles.cameraBtn,
              backgroundColor: isCameraHovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.25)',
              transform: isCameraHovered ? 'scale(1.05)' : 'scale(1)',
            }} 
            onMouseEnter={() => setIsCameraHovered(true)}
            onMouseLeave={() => setIsCameraHovered(false)}
            onClick={() => setShowMenu(!showMenu)}
            aria-label={t('gallery.changeCover', { ns: 'editor', defaultValue: 'Cambiar portada' })}
          >
            <Camera size={20} strokeWidth={1.5} color="#ffffff" />
          </button>
          <ActionMenu />
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />

      {/* Bottom Content: Title and Pills */}
      <div style={styles.bottomContent}>
        <div style={styles.titleWrapper}>
          {/* Magic Button shown when title is manually modified */}
          {!isTituloAuto && (
            <button
              style={styles.regenerateBtn}
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
            style={{ 
              ...styles.titleInput, 
              ...(isTitleFocused ? styles.titleInputFocus : {}),
              fontSize: `${titleFontSize}px` 
            }}
            rows={1}
            maxLength={80}
            onInput={() => {
              adjustTitleFont();
              adjustTitleHeight();
            }}
          />

          {/* Hint text shown when title is manually modified or affordance to edit */}
          {!isTituloAuto ? (
            <small style={styles.titleHint}>
              {t('editor.header.manualTitleHint', { defaultValue: 'Estás usando un título manual' })}
            </small>
          ) : (
            <small style={styles.titleAffordance(!isTitleFocused)}>
              {t('editor.header.editTitleHint', { defaultValue: 'Toca para editar el título' })}
            </small>
          )}
        </div>
        
        <div style={styles.metaRow}>
          <span style={styles.glassPill}>
            <Calendar size={14} /> {datePillText}
          </span>
          <span style={styles.glassPill}>
            <MapPin size={14} /> {citiesPillText}
          </span>
          <span style={styles.glassPill}>
            <Clock size={14} /> {durationPillText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EditableTripHeader;