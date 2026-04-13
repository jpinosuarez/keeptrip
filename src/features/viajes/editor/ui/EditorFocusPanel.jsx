import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@shared/config';
import { styles } from './EditorFocusPanel.styles';
import { styles as edicionModalStyles } from './EdicionModal.styles';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useOperationalFlags } from '@shared/lib';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useAuth } from '@app/providers/AuthContext';
import { useUpload } from '@app/providers/UploadContext';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';

// Import editor sections
import EditableTripHeader from './components/EditableTripHeader';
import EdicionParadasSection from './components/EdicionParadasSection';

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
  galeria = { fotos: [], uploading: false },
  onAfterSave = null,
}) => {
  const { t, i18n } = useTranslation(['editor', 'countries']);
  const { isMobile } = useWindowSize(768);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyMode = Boolean(appReadonlyMode) || operationalLevel >= 3;
  const { usuario } = useAuth();
  const uploadCtx = useUpload();
  const usuarioUid = usuario?.uid || null;
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
  const formDataWithFallback = {
    ...viaje,
    ...effectiveFormData,
    titulo: effectiveFormData?.titulo || viaje?.titulo || viaje?.nombreEspanol || ''
  };
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
    t,
    i18n,
  });

  const iniciarSubida = uploadCtx?.iniciarSubida;
  const hasUploadContext = typeof iniciarSubida === 'function';
  const { isUploading } = viaje?.id
    ? (uploadCtx?.getEstadoViaje?.(viaje.id) || { isUploading: false })
    : { isUploading: false };

  // Manual save handler (explicit, not auto-save)
  const handleSaveManual = useEdicionModalSave({
    isProcessingImage,
    isSaving: isSavingManual,
    isUploading,
    formData: effectiveFormData,
    viaje,
    ciudadInicial,
    paradas: effectiveParadas,
    onSave,
    galleryFiles: effectiveGalleryFiles,
    galleryPortada: effectiveGalleryPortada,
    hasUploadContext,
    iniciarSubida,
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
    if (!canSave) return;

    setIsSavingManual(true);
    try {
      const savedId = await handleSaveManual();
      if (!savedId) {
        // Save failed; keep the editor open so user can retry.
        return;
      }

      onAfterSave?.(savedId);

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

  const hasValidStops = Array.isArray(effectiveParadas) && effectiveParadas.length > 0;
  const hasValidTitle = Boolean((formDataWithFallback?.titulo || '').trim());
  const hasValidStartDate = Boolean((effectiveFormData?.fechaInicio || viaje?.fechaInicio || '').toString().trim());
  const canSave = hasValidStops && hasValidTitle && hasValidStartDate && !isSavingManual && !isReadOnlyMode;

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
        {/* Scrollable Body */}
        <div style={styles.scrollableBody} className="custom-scroll">
          {/* Header Section (WYSIWYG) */}
          <EditableTripHeader
            formData={formDataWithFallback}
            setFormData={effectiveSetFormData}
            paradas={effectiveParadas}
            galleryFiles={effectiveGalleryFiles}
            setGalleryFiles={effectiveSetGalleryFiles}
            isMobile={isMobile}
            isProcessingImage={isProcessingImage}
            onTituloChange={handleTituloChange}
            isTituloAuto={autoTitleMode}
            onRegenerateTitle={() => setAutoTitleMode(true)}
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
              isReadOnlyMode={isReadOnlyMode}
            />
          )}

        </div>

        <div style={styles.stickyBottomActionBar}>
          <button
            onClick={handleClose}
            style={styles.topBarSecondaryBtn}
            disabled={isSavingManual}
          >
            {t('button.cancel') || 'Cancelar'}
          </button>
          <button
            onClick={handleSaveWithLoading}
            disabled={!canSave}
            style={{
              ...styles.topBarPrimaryBtn,
              cursor: canSave ? 'pointer' : 'not-allowed',
              opacity: canSave ? 1 : 0.5,
            }}
            aria-disabled={!canSave}
            aria-label={
              isReadOnlyMode
                ? t(
                    'common:operational.readOnlyBlockedAction',
                    'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
                  )
                : !hasValidStops
                  ? t('error.tripNeedsStop', 'El viaje debe tener al menos un destino')
                  : !hasValidTitle
                    ? t('error.tripNeedsTitle', 'El viaje debe tener un titulo')
                    : !hasValidStartDate
                      ? t('error.tripNeedsStartDate', 'El viaje debe tener fecha de inicio')
                      : undefined
            }
            title={
              isReadOnlyMode
                ? t(
                    'common:operational.readOnlyBlockedAction',
                    'Keeptrip is in Read-Only mode. Your data is safe, but edits are paused.'
                  )
                : !hasValidStops
                  ? t('error.tripNeedsStop', 'El viaje debe tener al menos un destino')
                  : !hasValidTitle
                    ? t('error.tripNeedsTitle', 'El viaje debe tener un titulo')
                    : !hasValidStartDate
                      ? t('error.tripNeedsStartDate', 'El viaje debe tener fecha de inicio')
                      : ''
            }
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

    </>
  );
};

export default EditorFocusPanel;
