import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@shared/config';
import { styles } from './EditorFocusPanel.styles';
import { styles as edicionModalStyles } from './EdicionModal.styles';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useAuth } from '@app/providers/AuthContext';
import { getFlagUrl } from '@shared/lib/utils/countryUtils';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';

// Import original editor sections (reusing existing components)
import EdicionHeaderSection from './components/EdicionHeaderSection';
import EdicionContextSection from './components/EdicionContextSection';
import EdicionHighlightsSection from './components/EdicionHighlightsSection';
import EdicionNotesSection from './components/EdicionNotesSection';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';
import CoverPickerModal from './components/CoverPickerModal';

/**
 * EditorFocusPanel: Desktop slide-over + Mobile full-screen sheet
 * with manual save (explicit, no auto-save) and keyboard shortcuts.
 */
const EditorFocusPanel = ({
  isOpen = true,
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
  galleryFiles,
  setGalleryFiles,
  galleryPortada,
  setGalleryPortada,
  captionDrafts,
  setCaptionDrafts,
  onCaptionChange,
  onCaptionSave,
  onSetPortadaExistente,
  onEliminarFoto,
  companionDraft = '',
  companionResults = [],
  onCompanionSearch = () => {},
  onAddCompanionFreeform = () => {},
  onAddCompanionFromResult = () => {},
  galeria = { fotos: [], uploading: false },
}) => {
  const { t } = useTranslation('editor');
  const { isMobile } = useWindowSize(768);
  const { usuario } = useAuth();
  const usuarioUid = usuario?.uid || null;
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Track initial state for unsaved changes detection
  const initialFormDataRef = useRef(null);
  const initialParadasRef = useRef(null);
  const isClosingRef = useRef(false);
  const previousGalleryLengthRef = useRef(0);

  // Local state (fallback when parent doesn't provide managed form state)
  const [localFormData, setLocalFormData] = useState({});
  const [localParadas, setLocalParadas] = useState([]);
  const [localGalleryFiles, setLocalGalleryFiles] = useState([]);
  const [localGalleryPortada, setLocalGalleryPortada] = useState(0);
  const [localCaptionDrafts, setLocalCaptionDrafts] = useState({});

  const effectiveFormData = formData ?? localFormData;
  const effectiveSetFormData = setFormData ?? setLocalFormData;
  const effectiveParadas = paradas ?? localParadas;
  const effectiveSetParadas = setParadas ?? setLocalParadas;
  const effectiveGalleryFiles = galleryFiles ?? localGalleryFiles;
  const effectiveSetGalleryFiles = setGalleryFiles ?? setLocalGalleryFiles;
  const effectiveGalleryPortada = galleryPortada ?? localGalleryPortada;
  const effectiveSetGalleryPortada = setGalleryPortada ?? setLocalGalleryPortada;
  const effectiveCaptionDrafts = captionDrafts ?? localCaptionDrafts;
  const effectiveSetCaptionDrafts = setCaptionDrafts ?? setLocalCaptionDrafts;

  // Initialize tracking refs on mount (snapshots for change detection)
  useEffect(() => {
    // Reset flag when editing a new trip
    isClosingRef.current = false;
    initialFormDataRef.current = structuredClone(effectiveFormData || {});
    initialParadasRef.current = structuredClone(effectiveParadas || []);
  }, [viaje?.id]);

  // Check for unsaved changes
  const hasUnsavedChanges = () => {
    const current = {
      form: structuredClone(effectiveFormData),
      paradas: structuredClone(effectiveParadas),
    };
    const initial = {
      form: initialFormDataRef.current || {},
      paradas: initialParadasRef.current || [],
    };
    return JSON.stringify(current) !== JSON.stringify(initial);
  };

  const {
    isTituloAuto: autoTitleMode,
    setIsTituloAuto: setAutoTitleMode,
    titlePulse: titlePulseState,
    limpiarEstado,
    handleTituloChange,
  } = useEdicionModalLifecycle({
    viaje,
    esBorrador,
    ciudadInicial,
    usuarioUid,
    galeria,
    formData: effectiveFormData,
    setFormData: effectiveSetFormData,
    paradas: effectiveParadas,
    setParadas: effectiveSetParadas,
    setGalleryFiles: effectiveSetGalleryFiles,
    setGalleryPortada: effectiveSetGalleryPortada,
    setCaptionDrafts: effectiveSetCaptionDrafts,
  });

  // Manual save handler (explicit, not auto-save)
  const handleSaveManual = useEdicionModalSave({
    isProcessingImage,
    isSaving: isSavingManual,
    formData: effectiveFormData,
    viaje,
    ciudadInicial,
    paradas: effectiveParadas,
    onSave,
    galleryFiles: effectiveGalleryFiles,
    galleryPortada: effectiveGalleryPortada,
    hasUploadContext: true,
    iniciarSubida: () => {},
    pushToast: () => {},
    t,
    limpiarEstado,
    onClose,
    onAfterSave: () => {
      // Refresh initial state after successful save
      initialFormDataRef.current = structuredClone(effectiveFormData);
      initialParadasRef.current = structuredClone(effectiveParadas);
    },
  });

  // Manual save wrapper with loading state
  const handleSaveWithLoading = async () => {
    setIsSavingManual(true);
    try {
      const savedId = await handleSaveManual();
      if (!savedId) {
        // Save failed; keep the editor open so user can retry.
        return;
      }

      // After successful save, close the editor (AppModalsManager will navigate if needed)
      isClosingRef.current = true;
      limpiarEstado();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    isClosingRef.current = true;
    limpiarEstado();
    onClose();
  };

  const handleClose = () => {
    if (isClosingRef.current) return;

    // GUARDRAIL: Check for unsaved changes
    if (hasUnsavedChanges()) {
      setShowConfirmModal(true);
      return;
    }

    isClosingRef.current = true;
    limpiarEstado();
    onClose();
  };

  // Prevent background scroll while the panel is open (iOS-friendly)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape closes panel (with unsaved changes check)
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      // Cmd/Ctrl+S saves manually
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveWithLoading();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleSaveWithLoading]);

  // Auto-set first photo as cover when gallery goes from 0→1 photos
  useEffect(() => {
    const currentGalleryLength = galeria?.fotos?.length || 0;
    const prevLength = previousGalleryLengthRef.current;

    // Transition from 0→1+ photos: auto-set first photo as portada
    if (prevLength === 0 && currentGalleryLength > 0 && !effectiveFormData.portadaUrl) {
      const firstPhotoUrl = galeria.fotos[0]?.url;
      if (firstPhotoUrl) {
        effectiveSetFormData((prev) => ({
          ...prev,
          portadaUrl: firstPhotoUrl,
        }));
      }
    }

    previousGalleryLengthRef.current = currentGalleryLength;
  }, [galeria?.fotos?.length, effectiveFormData.portadaUrl, effectiveSetFormData]);

  if (!viaje) return null;

  // Cover picker handlers
  const handleOpenCoverPicker = () => {
    setShowCoverPicker(true);
  };

  const handleSelectCover = (coverUrl, coverId) => {
    effectiveSetFormData((prev) => ({
      ...prev,
      portadaUrl: coverUrl,
    }));
    setShowCoverPicker(false);
  };

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

  const safeOnCaptionChange = onCaptionChange || (() => {});
  const safeOnCaptionSave = onCaptionSave || (() => {});
  const safeOnSetPortadaExistente = onSetPortadaExistente || (() => {});
  const safeOnEliminarFoto = onEliminarFoto || (() => {});

  return (
    <>
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
        onClick={handleClose}
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
              <div style={styles.headerBadge}>{esBorrador ? t('labels.draft') || 'Draft' : t('labels.editing') || 'Editing'}</div>
            </div>
          </div>

          <button
            onClick={handleClose}
            style={styles.headerCloseBtn}
            aria-label={t('button.close') || 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={styles.scrollableBody} className="custom-scroll">
          {/* Header Section (Photo + Title) - PREMIUM LAYOUT */}
          <EdicionHeaderSection
            styles={edicionModalStyles}
            t={t}
            formData={effectiveFormData}
            isMobile={isMobile}
            isBusy={isBusy}
            esBorrador={esBorrador}
            isTituloAuto={autoTitleMode}
            titlePulse={titlePulseState}
            isProcessingImage={isProcessingImage}
            onTituloChange={handleTituloChange}
            onToggleTituloAuto={() => setAutoTitleMode((prev) => !prev)}
            onPortadaChange={(url) => effectiveSetFormData((prev) => ({ ...prev, portadaUrl: url }))}
          />

          {/* Core Context (Dates, Companions, Vibe) */}
          <EdicionContextSection
            styles={edicionModalStyles}
            t={t}
            formData={effectiveFormData}
            setFormData={effectiveSetFormData}
            companionDraft={companionDraft}
            companionResults={companionResults}
            onCompanionSearch={onCompanionSearch}
            onAddCompanionFreeform={onAddCompanionFreeform}
            onAddCompanionFromResult={onAddCompanionFromResult}
          />

          {/* Itinerary / Stops */}
          {effectiveParadas !== undefined && (
            <EdicionParadasSection
              styles={edicionModalStyles}
              t={t}
              paradas={effectiveParadas}
              setParadas={effectiveSetParadas}
              fechaRangoDisplay={`${effectiveFormData.fechaInicio} - ${effectiveFormData.fechaFin}`}
              sinParadas={effectiveParadas.length === 0}
            />
          )}

          {/* Gallery Section */}
          {effectiveGalleryFiles && (
            <EdicionGallerySection
              styles={edicionModalStyles}
              t={t}
              files={effectiveGalleryFiles}
              onFilesChange={effectiveSetGalleryFiles}
              portadaIndex={effectiveGalleryPortada}
              onPortadaChange={(url) => effectiveSetFormData((prev) => ({ ...prev, portadaUrl: url }))}
              portadaUrl={effectiveFormData.portadaUrl}
              isBusy={isBusy}
              isMobile={isMobile}
              galeria={galeria}
              captionDrafts={effectiveCaptionDrafts}
              onCaptionChange={safeOnCaptionChange}
              onCaptionSave={safeOnCaptionSave}
              onSetPortadaExistente={safeOnSetPortadaExistente}
              onEliminarFoto={safeOnEliminarFoto}
            />
          )}

          {/* Notes Section */}
          <EdicionNotesSection
            styles={edicionModalStyles}
            t={t}
            texto={effectiveFormData.texto}
            onChange={(texto) => effectiveSetFormData((prev) => ({ ...prev, texto }))}
            isBusy={isBusy}
          />

          {/* Highlights Section */}
          <EdicionHighlightsSection
            styles={edicionModalStyles}
            t={t}
            formData={effectiveFormData}
            setFormData={effectiveSetFormData}
          />
        </div>

        {/* Sticky Footer with Manual Save & Cancel */}
        <div style={styles.stickyFooter}>
          <button
            onClick={handleClose}
            style={styles.secondaryFooterBtn}
            disabled={isSavingManual}
          >
            {t('button.cancel') || 'Cancelar'}
          </button>
          <button
            onClick={handleSaveWithLoading}
            disabled={isSavingManual}
            style={{
              ...styles.primaryFooterBtn,
              cursor: isSavingManual ? 'not-allowed' : 'pointer',
              opacity: isSavingManual ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSavingManual && <LoaderCircle size={16} className="spin" />}
            {t('button.save') || 'Guardar'}
          </button>
        </div>
      </Motion.div>
    </AnimatePresence>

    {/* Unsaved Changes Confirmation Modal */}
    <ConfirmModal
      isOpen={showConfirmModal}
      title={t('unsavedChanges.title') || 'Discard changes?'}
      message={
        t('unsavedChanges.message') ||
        'You have unsaved edits in your trip. Are you sure you want to close?'
      }
      confirmText={t('unsavedChanges.discard') || 'Discard'}
      cancelText={t('unsavedChanges.keepEditing') || 'Keep editing'}
      onConfirm={handleConfirmClose}
      onClose={() => setShowConfirmModal(false)}
    />

    {/* Cover Photo Picker Modal - Single Source of Truth */}
    <CoverPickerModal
      isOpen={showCoverPicker}
      fotos={galeria?.fotos || []}
      currentPortadaUrl={effectiveFormData?.portadaUrl}
      onSelectCover={handleSelectCover}
      onClose={() => setShowCoverPicker(false)}
    />
    </>
  );
};

export default EditorFocusPanel;
