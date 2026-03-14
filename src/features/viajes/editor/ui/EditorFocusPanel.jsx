import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Save, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@shared/config';
import { styles } from './EditorFocusPanel.styles';
import { styles as edicionModalStyles } from './EdicionModal.styles';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useAutoSaveEditor } from '../model/hooks/useAutoSaveEditor';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';

// Import original editor sections (reusing existing components)
import EdicionHeaderSection from './components/EdicionHeaderSection';
import EdicionContextSection from './components/EdicionContextSection';
import EdicionHighlightsSection from './components/EdicionHighlightsSection';
import EdicionNotesSection from './components/EdicionNotesSection';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';

/**
 * EditorFocusPanel: Desktop slide-over + Mobile full-screen sheet
 * with auto-save and keyboard shortcuts.
 */
const EditorFocusPanel = ({
  isOpen = true, // Always open when component is mounted
  onClose,
  viaje,
  formData,
  setFormData,
  paradas,
  setParadas,
  onSave,
  isSaving = false,
  esBorrador = false,
  ciudadInicial = null,
  isProcessingImage = false,
  setIsProcessingImage,
  onAfterSave,
  // Gallery state
  galleryFiles,
  setGalleryFiles,
  galleryPortada,
  setGalleryPortada,
  captionDrafts,
  setCaptionDrafts,
  // Gallery functions
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
  // Other hooks
  isTituloAuto,
  setIsTituloAuto,
  titlePulse,
  onTituloChange,
  onFileChange,
  // Context/companions
  companionDraft = '',
  companionResults = [],
  onCompanionSearch = () => {},
  onAddCompanionFreeform = () => {},
  onAddCompanionFromResult = () => {},
  // Translations
  t: tOrig,
  galeria = { fotos: [], uploading: false },
  limpiarEstado = () => {},
}) => {
  const { t } = useTranslation('editor');
  const { isMobile } = useWindowSize(768);
  const [showSaveStatus, setShowSaveStatus] = useState(false);

  // Safe fallbacks for undefined props
  const safeFormData = formData || { titulo: viaje?.titulo || '', texto: '', descripcion: '' };
  const safeSetFormData = setFormData || (() => {});
  const safeParadas = paradas || [];
  const safeSetParadas = setParadas || (() => {});
  const safeGalleryFiles = galleryFiles || [];
  const safeSetGalleryFiles = setGalleryFiles || (() => {});
  const safeGalleryPortada = galleryPortada || null;
  const safeSetGalleryPortada = setGalleryPortada || (() => {});
  const safeCaptionDrafts = captionDrafts || {};
  const safeSetCaptionDrafts = setCaptionDrafts || (() => {});
  const safeOnCaptionChange = onCaptionChange || (() => {});
  const safeOnCaptionSave = onCaptionSave || (() => {});
  const safeOnSetPortadaExistente = onSetPortadaExistente || (() => {});
  const safeOnEliminarFoto = onEliminarFoto || (() => {});
  const safeIsTituloAuto = isTituloAuto || false;
  const safeSetIsTituloAuto = setIsTituloAuto || (() => {});
  const safeTitlePulse = titlePulse || false;
  const safeOnTituloChange = onTituloChange || (() => {});
  const safeOnFileChange = onFileChange || (() => {});
  const safeSetIsProcessingImage = setIsProcessingImage || (() => {});

  // Auto-save logic
  const { saveStatus, forceSave } = useAutoSaveEditor(
    safeFormData,
    viaje?.id,
    onSave,
    1500 // 1.5s debounce
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape closes panel
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Cmd/Ctrl+S forces save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        forceSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, forceSave]);

  // Show save status briefly
  useEffect(() => {
    setShowSaveStatus(true);
    const timer = setTimeout(() => {
      if (saveStatus === 'saved') {
        setShowSaveStatus(false);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  if (!viaje) return null;

  const flagUrl = viaje.banderas?.[0] ? getFlagUrl(viaje.banderas[0]) : null;
  const isBusy = isSaving || isProcessingImage;

  // Animation variants
  const desktopVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  };

  const mobileVariants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
  };

  const scrimVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const panelStyle = isMobile ? styles.mobileSheet : styles.desktopPanel;
  const panelVariant = isMobile ? mobileVariants : desktopVariants;

  return (
    <AnimatePresence>
      {/* Scrim */}
      <Motion.div
        key="scrim"
        style={isMobile ? styles.mobileScrim : styles.desktopScrim}
        variants={scrimVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
        onClick={!isBusy ? onClose : undefined}
      />

      {/* Panel */}
      <Motion.div
        key="panel"
        style={panelStyle}
        variants={panelVariant}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div style={styles.stickyHeader}>
          <div style={styles.headerLeft}>
            {flagUrl && (
              <img src={flagUrl} alt="" style={styles.headerFlagImg} />
            )}
            <div>
              <div style={styles.headerTitle}>{viaje.titulo}</div>
              <div style={styles.headerBadge}>Editing</div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {showSaveStatus && (
              <div style={styles.saveStatusBadge(saveStatus)}>
                {saveStatus === 'saving' && <LoaderCircle size={12} className="spin" />}
                {saveStatus === 'saved' && '✓'}
                {saveStatus === 'error' && '✗'}
                {saveStatus === 'unsaved' && ''}
                {saveStatus.charAt(0).toUpperCase() + saveStatus.slice(1)}
              </div>
            )}
            <button
              style={styles.closeBtn}
              onClick={onClose}
              disabled={isBusy}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={styles.scrollableBody} className="custom-scroll">
          {/* Header Section (Photo + Title) */}
          <EdicionHeaderSection
            styles={edicionModalStyles}
            t={t}
            formData={safeFormData}
            isMobile={isMobile}
            isBusy={isBusy}
            esBorrador={esBorrador}
            isTituloAuto={safeIsTituloAuto}
            titlePulse={safeTitlePulse}
            isProcessingImage={isProcessingImage}
            onTituloChange={safeOnTituloChange}
            onToggleTituloAuto={() => safeSetIsTituloAuto((prev) => !prev)}
            onFileChange={safeOnFileChange}
          />

          {/* Gallery Section */}
          {safeGalleryFiles && (
            <EdicionGallerySection
              styles={edicionModalStyles}
              t={t}
              files={safeGalleryFiles}
              onFilesChange={safeSetGalleryFiles}
              portadaIndex={safeGalleryPortada}
              onPortadaChange={safeSetGalleryPortada}
              isBusy={isBusy}
              isMobile={isMobile}
              galeria={galeria}
              captionDrafts={safeCaptionDrafts}
              onCaptionChange={safeOnCaptionChange}
              onCaptionSave={safeOnCaptionSave}
              onSetPortadaExistente={safeOnSetPortadaExistente}
              onEliminarFoto={safeOnEliminarFoto}
            />
          )}

          {/* Paradas Section */}
          {safeParadas !== undefined && (
            <EdicionParadasSection
              styles={edicionModalStyles}
              t={t}
              paradas={safeParadas}
              setParadas={safeSetParadas}
              fechaRangoDisplay={`${safeFormData.fechaInicio} - ${safeFormData.fechaFin}`}
              sinParadas={safeParadas.length === 0}
            />
          )}

          {/* Context Section (Companions, Presupuesto, Vibe) */}
          <EdicionContextSection
            styles={edicionModalStyles}
            t={t}
            formData={safeFormData}
            setFormData={safeSetFormData}
            companionDraft={companionDraft}
            companionResults={companionResults}
            onCompanionSearch={onCompanionSearch}
            onAddCompanionFreeform={onAddCompanionFreeform}
            onAddCompanionFromResult={onAddCompanionFromResult}
          />

          {/* Highlights Section */}
          <EdicionHighlightsSection
            styles={edicionModalStyles}
            t={t}
            formData={safeFormData}
            setFormData={safeSetFormData}
          />

          {/* Notes Section */}
          <EdicionNotesSection
            styles={edicionModalStyles}
            t={t}
            texto={safeFormData.texto}
            onChange={(texto) => safeSetFormData((prev) => ({ ...prev, texto }))}
            isBusy={isBusy}
          />
        </div>

        {/* Sticky Footer */}
        <div style={styles.stickyFooter}>
          <button
            style={styles.closeFooterBtn}
            onClick={onClose}
            disabled={isBusy}
          >
            {t('button.close', 'Close')}
          </button>
          <button
            style={{
              ...styles.closeFooterBtn,
              backgroundColor: COLORS.atomicTangerine,
              color: 'white',
              border: 'none',
              fontWeight: '700',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.6 : 1,
            }}
            onClick={forceSave}
            disabled={isBusy}
            title="Force save (Cmd+S)"
          >
            {isBusy ? (
              <>
                <LoaderCircle size={16} className="spin" /> {t('button.saving')}
              </>
            ) : (
              <>
                <Save size={16} /> {t('button.save')}
              </>
            )}
          </button>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default EditorFocusPanel;
