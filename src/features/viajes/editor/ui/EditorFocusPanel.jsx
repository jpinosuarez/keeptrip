import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';
import { normalizeToIsoDate, resolveCoverPhotoUrl } from '@shared/lib/utils/viajeUtils';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useEdicionGalleryManager } from '../model/hooks/useEdicionGalleryManager';
import { useEdicionCompanions } from '../model/hooks/useEdicionCompanions';
import { useVirtualKeyboard } from '../model/hooks/useVirtualKeyboard';
import { useAuth } from '@app/providers/AuthContext';
import { useUpload } from '@app/providers/UploadContext';
import { useToast } from '@app/providers/ToastContext';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { cn } from '@shared/lib/utils/cn';
import { Z_INDEX } from '@shared/config/theme';

// Import editor sections
import EditableTripHeader from './components/EditableTripHeader';
import EdicionParadasSection from './components/EdicionParadasSection';
import EdicionContextSection from './components/EdicionContextSection';
import EdicionHighlightsSection from './components/EdicionHighlightsSection';
import EdicionNotesSection from './components/EdicionNotesSection';
import EdicionGallerySection from './components/EdicionGallerySection';
import EditorTabBar from './components/EditorTabBar';

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
  esBorrador = false,
  ciudadInicial = null,
  paradasIniciales = [],
  isProcessingImage = false,
  galleryFiles,
  setGalleryFiles,
  galleryPortada,
  setGalleryPortada,
  setCaptionDrafts,
  galeria: galeriaProp = null,
  frequentCompanions = [],
  onAfterSave = null,
}) => {
  const { t, i18n } = useTranslation(['editor', 'countries']);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyMode = Boolean(appReadonlyMode) || operationalLevel >= 3;
  const { usuario, userProfile, eliminarDeWishlist } = useAuth();
  const { pushToast: pushToastFromContext } = useToast();
  const pushToast = pushToastFromContext || (() => {});
  const uploadCtx = useUpload();
  const usuarioUid = usuario?.uid || null;
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosingAfterSave, setIsClosingAfterSave] = useState(false);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    // Deep-link uses the Spanish token `galeria`; internal tab id is `gallery`.
    return tabParam === 'galeria' || tabParam === 'gallery' ? 'gallery' : 'route';
  });
  const [captionDraftsState, setCaptionDraftsState] = useState({});
  const [draftTags, setDraftTags] = useState({});
  const [defaultParadaId, setDefaultParadaId] = useState(null);

  const { keyboardOffset, isKeyboardOpen } = useVirtualKeyboard();

  // Track initial state for unsaved changes detection
  const initialFormDataRef = useRef(null);
  const initialParadasRef = useRef(null);
  const initialTripIdRef = useRef(null);
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
    titulo: effectiveFormData?.titulo || viaje?.titulo || viaje?.nombreEspanol || '',
    fechaInicio: normalizeToIsoDate(effectiveFormData?.fechaInicio || viaje?.fechaInicio || viaje?.startDate || viaje?.date) || '',
    fechaFin: normalizeToIsoDate(effectiveFormData?.fechaFin || viaje?.fechaFin || viaje?.endDate) || '',
    portadaUrl: resolveCoverPhotoUrl(effectiveFormData?.portadaUrl || effectiveFormData?.foto || viaje) || null,
  };
  const effectiveSetFormData = setFormData ?? setLocalFormData;
  const effectiveParadas = paradas ?? localParadas;
  const effectiveSetParadas = setParadas ?? setLocalParadas;
  const effectiveGalleryFiles = galleryFiles ?? localGalleryFiles;
  const effectiveSetGalleryFiles = setGalleryFiles ?? setLocalGalleryFiles;
  const effectiveGalleryPortada = galleryPortada ?? localGalleryPortada;
  const effectiveSetGalleryPortada = setGalleryPortada ?? setLocalGalleryPortada;
  const effectiveSetCaptionDrafts = setCaptionDrafts ?? setLocalCaptionDrafts;

  // Gallery subscription for EXISTING trips (drafts have no Firestore viajeId yet).
  const isPersistedTrip = Boolean(viaje?.id && viaje.id !== 'new');
  const serverGallery = useGaleriaViaje(isPersistedTrip ? viaje.id : null);
  const galeria = galeriaProp || serverGallery;

  // Explicit user-edit tracking. Dirty detection is driven ONLY by genuine manual
  // edits, so async hydration / gallery loading / auto-title normalization can never
  // flag an untouched trip as "dirty" (that caused the Cancelar double-click + wipe).
  const userEditedRef = useRef(false);

  // "User" setters mark the editor dirty. The RAW setters are still handed to the
  // lifecycle hook so hydration / auto-generation never counts as a manual edit.
  const userSetFormData = useCallback((updater) => {
    userEditedRef.current = true;
    effectiveSetFormData(updater);
  }, [effectiveSetFormData]);

  const userSetParadas = useCallback((updater) => {
    userEditedRef.current = true;
    effectiveSetParadas(updater);
  }, [effectiveSetParadas]);

  const userSetGalleryFiles = useCallback((files) => {
    userEditedRef.current = true;
    effectiveSetGalleryFiles(files);
  }, [effectiveSetGalleryFiles]);

  // Dirty detection: only genuine manual edits (userEditedRef) count.
  const hasUnsavedChanges = useCallback(() => userEditedRef.current, []);

  const {
    isTituloAuto: autoTitleMode,
    setIsTituloAuto: setAutoTitleMode,
    limpiarEstado,
    handleTituloChange,
  } = useEdicionModalLifecycle({
    viaje,
    esBorrador,
    ciudadInicial,
    paradasIniciales,
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

  // Reset per-trip guards exactly once when the editor opens a (new) trip.
  // Dirty detection is now driven by explicit manual edits (userEditedRef), so async
  // hydration / gallery / auto-title never flag an untouched trip as "dirty".
  useEffect(() => {
    if (!viaje?.id) return;
    // Never reset the closing guard while a close is in flight — otherwise an
    // identity change during teardown can re-open the panel with blank state.
    if (isClosingRef.current) return;
    if (initialTripIdRef.current === viaje.id) return;

    initialTripIdRef.current = viaje.id;
    isClosingRef.current = false;
    setIsClosingAfterSave(false);
    userEditedRef.current = false;
  }, [viaje?.id]);

  const userHandleTituloChange = useCallback((titulo) => {
    userEditedRef.current = true;
    handleTituloChange(titulo);
  }, [handleTituloChange]);

  const iniciarSubida = uploadCtx?.iniciarSubida;
  const hasUploadContext = typeof iniciarSubida === 'function';
  const { isUploading } = viaje?.id
    ? (uploadCtx?.getEstadoViaje?.(viaje.id) || { isUploading: false })
    : { isUploading: false };

  const isImageBusy = Boolean(isProcessingImage || isUploading || galeria?.uploading);

  // Block 2.5 — wishlist auto-completion on save.
  const wishlistItems = Array.isArray(userProfile?.wishlist) ? userProfile.wishlist : [];
  const handleWishlistFulfilled = useCallback(async (matched) => {
    if (typeof eliminarDeWishlist === 'function') {
      await eliminarDeWishlist((matched || []).map((entry) => entry.id));
    }
  }, [eliminarDeWishlist]);

  // Manual save handler (explicit, not auto-save)
  const handleSaveManual = useEdicionModalSave({
    isProcessingImage: isImageBusy,
    isSaving: isSavingManual,
    isUploading,
    formData: effectiveFormData,
    viaje,
    ciudadInicial,
    paradas: effectiveParadas,
    onSave,
    galleryFiles: effectiveGalleryFiles,
    galleryPortada: effectiveGalleryPortada,
    draftTags,
    hasUploadContext,
    iniciarSubida,
    pushToast,
    t,
    limpiarEstado,
    onClose,
    resetDirty: limpiarEstado,
    autoFinalize: false,
    wishlist: wishlistItems,
    onWishlistFulfilled: handleWishlistFulfilled,
  });

  // Gallery manager (network photo cover/delete/caption/stop assignment)
  const galleryManager = useEdicionGalleryManager({
    galeria,
    captionDrafts: captionDraftsState,
    setCaptionDrafts: setCaptionDraftsState,
    pushToast,
    t,
    viajeId: isPersistedTrip ? viaje.id : null,
    ownerUid: usuarioUid,
    activeTab,
  });

  // Companion autocomplete (Level 1 companions)
  const companions = useEdicionCompanions({
    formData: effectiveFormData,
    setFormData: effectiveSetFormData,
    viaje,
    usuario,
    pushToast,
    t,
  });

  const handleDraftTagChange = useCallback((index, paradaId) => {
    setDraftTags((prev) => ({ ...prev, [index]: { paradaId: paradaId || null } }));
  }, []);

  // Pre-tag newly selected gallery drafts with the stop that launched "Upload photos".
  const handleGalleryFilesChange = useCallback((nextFiles) => {
    userEditedRef.current = true;
    effectiveSetGalleryFiles(nextFiles);
    if (defaultParadaId) {
      setDraftTags((prev) => {
        const updated = { ...prev };
        (Array.isArray(nextFiles) ? nextFiles : []).forEach((_, i) => {
          if (!prev[i]?.paradaId) updated[i] = { paradaId: defaultParadaId };
        });
        return updated;
      });
    }
  }, [effectiveSetGalleryFiles, defaultParadaId]);

  const stopPhotos = galeria?.fotos || [];

  const hasValidStops = Array.isArray(effectiveParadas) && effectiveParadas.length > 0;
  const hasValidTitle = Boolean((formDataWithFallback?.titulo || '').trim());
  const hasValidStartDate = Boolean((effectiveFormData?.fechaInicio || viaje?.fechaInicio || '').toString().trim());
  const canSave = hasValidStops && hasValidTitle && hasValidStartDate && !isSavingManual && !isReadOnlyMode && !isImageBusy;

  // Manual save wrapper with loading state
  const handleSaveWithLoading = useCallback(async () => {
    if (!canSave) return;

    setIsSavingManual(true);
    try {
      const savedId = await handleSaveManual();
      if (!savedId) {
        // Save genuinely failed; keep the editor open so the user can retry.
        return;
      }

      // Save succeeded → guarantee a single atomic close.
      const effectiveTripId = savedId || (viaje?.id && viaje.id !== 'new' ? viaje.id : null);
      initialFormDataRef.current = structuredClone(effectiveFormData || {});
      initialParadasRef.current = structuredClone(effectiveParadas || []);
      setIsClosingAfterSave(true);
      isClosingRef.current = true;
      userEditedRef.current = false;
      limpiarEstado();
      // `onAfterSave` (handleCloseEditor) strips `?editing` / `?new` with
      // { replace: true } and unmounts the editor. It is the SOLE closer.
      if (onAfterSave) {
        onAfterSave(effectiveTripId);
      } else {
        onClose?.();
      }
    } catch (error) {
      console.error('Save error:', error);
      // Only a genuine exception (network / Firestore) reaches here — the save
      // hook already surfaces validation failures as inline warning toasts and
      // a falsy return exits quietly above without a generic red toast.
      pushToast(
        t('error.saveFailed', 'No pudimos guardar tu viaje. Revisa tu conexión e intenta de nuevo.'),
        'error'
      );
    } finally {
      setIsSavingManual(false);
    }
  }, [canSave, handleSaveManual, onAfterSave, onClose, limpiarEstado, effectiveFormData, effectiveParadas, viaje?.id, pushToast, t]);

  const handleConfirmClose = () => {
    setShowConfirmModal(false);
    isClosingRef.current = true;
    // No pre-unmount state wipe: the unmount (via handleCloseEditor param strip)
    // discards the editor state, so the panel never flashes blank stops while
    // leaving the screen.
    onClose();
  };

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    if (hasUnsavedChanges()) {
      setShowConfirmModal(true);
      return;
    }
    isClosingRef.current = true;
    onClose();
  }, [onClose, hasUnsavedChanges]);

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
    const firstPhotoUrl = galeria?.fotos?.[0]?.url;

    // Transition from 0→1+ photos: auto-set first photo as portada
    if (prevLength === 0 && currentGalleryLength > 0 && !effectiveFormData.portadaUrl) {
      if (firstPhotoUrl) {
        effectiveSetFormData((prev) => ({
          ...prev,
          portadaUrl: firstPhotoUrl,
        }));
      }
    }

    previousGalleryLengthRef.current = currentGalleryLength;
  }, [galeria?.fotos, galeria?.fotos?.length, effectiveFormData.portadaUrl, effectiveSetFormData]);

  if (!viaje) return null;

  // Animation variants
  const panelVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 },
  };

  const scrimVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      <AnimatePresence>
        {/* Scrim */}
        <Motion.div
          key="scrim"
          className="fixed inset-0 z-[90] bg-black/40 md:bg-black/20"
          style={{
            pointerEvents: isClosingAfterSave ? 'none' : 'auto',
          }}
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
          data-testid="editor-focus-panel"
          className="fixed bg-background z-modal flex flex-col inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-full md:max-w-[640px] lg:max-w-[680px] md:shadow-2xl md:border-l md:border-border"
          style={{
            pointerEvents: isClosingAfterSave ? 'none' : 'auto',
            ...(isKeyboardOpen && keyboardOffset > 0 ? { bottom: `${keyboardOffset}px` } : {}),
          }}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto custom-scroll overscroll-contain">
            {/* Header Section (WYSIWYG) */}
            <EditableTripHeader
              formData={formDataWithFallback}
              setFormData={userSetFormData}
              paradas={effectiveParadas}
              galleryFiles={effectiveGalleryFiles}
              setGalleryFiles={userSetGalleryFiles}
              isProcessingImage={isImageBusy}
              onTituloChange={userHandleTituloChange}
              isTituloAuto={autoTitleMode}
              onRegenerateTitle={() => setAutoTitleMode(true)}
            />

            <EditorTabBar
              t={t}
              activeTab={activeTab}
              onChange={setActiveTab}
              stopsCount={effectiveParadas?.length || 0}
              photosCount={(galeria?.fotos?.length || 0) + effectiveGalleryFiles.length}
            />

            <div className="p-4">
              {activeTab === 'route' && effectiveParadas !== undefined && (
                <EdicionParadasSection
                  t={t}
                  paradas={effectiveParadas}
                  setParadas={userSetParadas}
                  fechaRangoDisplay={`${formDataWithFallback.fechaInicio || '--'} - ${formDataWithFallback.fechaFin || '--'}`}
                  tripStartDate={formDataWithFallback.fechaInicio}
                  tripEndDate={formDataWithFallback.fechaFin}
                  sinParadas={effectiveParadas.length === 0}
                  isReadOnlyMode={isReadOnlyMode}
                  fotos={stopPhotos}
                  onRequestPhotos={(parada) => { setDefaultParadaId(parada?.id || null); setActiveTab('gallery'); }}
                />
              )}

              {activeTab === 'essence' && (
                <div className="flex flex-col gap-3">
                  <EdicionContextSection
                    t={t}
                    formData={formDataWithFallback}
                    setFormData={userSetFormData}
                    showCompanions
                    frequentCompanions={frequentCompanions}
                    companionDraft={companions.companionDraft}
                    companionResults={companions.companionResults}
                    onCompanionSearch={companions.handleCompanionSearch}
                    onAddCompanionFreeform={companions.handleAddCompanionFreeform}
                    onAddCompanionFromResult={companions.handleAddCompanionFromResult}
                  />
                  <EdicionHighlightsSection
                    t={t}
                    formData={formDataWithFallback}
                    setFormData={userSetFormData}
                    paradas={effectiveParadas}
                  />
                  <EdicionNotesSection
                    t={t}
                    formData={formDataWithFallback}
                    setFormData={userSetFormData}
                    isBusy={isSavingManual}
                  />
                </div>
              )}

              {activeTab === 'gallery' && (
                <EdicionGallerySection
                  t={t}
                  files={effectiveGalleryFiles}
                  onFilesChange={handleGalleryFilesChange}
                  defaultParadaId={defaultParadaId}
                  portadaIndex={effectiveGalleryPortada}
                  onPortadaChange={(urlOrIndex) => {
                    // Cover auto-selection on open must NOT count as a manual edit,
                    // so this keeps the raw setters (no userEditedRef marking).
                    if (typeof urlOrIndex === 'number') {
                      effectiveSetGalleryPortada(urlOrIndex);
                    } else if (typeof urlOrIndex === 'string') {
                      effectiveSetFormData((prev) => ({ ...prev, portadaUrl: urlOrIndex }));
                    }
                  }}
                  isBusy={isSavingManual || isImageBusy}
                  galeria={galeria}
                  captionDrafts={captionDraftsState}
                  onCaptionChange={galleryManager.handleCaptionChange}
                  onCaptionSave={galleryManager.handleCaptionSave}
                  onSetPortadaExistente={galleryManager.handleSetPortadaExistente}
                  onEliminarFoto={galleryManager.handleEliminarFoto}
                  onAssignParada={galleryManager.handleAssignParada}
                  paradas={effectiveParadas}
                  draftTags={draftTags}
                  onDraftTagChange={handleDraftTagChange}
                  portadaUrl={formDataWithFallback.portadaUrl}
                  isReadOnlyMode={isReadOnlyMode}
                  maxFiles={15}
                />
              )}
            </div>
          </div>

          <div
            className={cn(
              "p-4 border-t border-border flex justify-end gap-3 bg-background sticky bottom-0 z-10 transition-[padding] duration-150",
              isKeyboardOpen
                ? "pb-3 sm:pb-4"
                : "pb-[max(16px,env(safe-area-inset-bottom,16px))]"
            )}
          >
            <button
              onClick={handleClose}
              disabled={isSavingManual}
              className="min-h-[44px] min-w-[44px] px-4 py-2 text-[0.875rem] font-bold text-textSecondary rounded-lg hover:bg-surface transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
            >
              {t('button.cancel') || 'Cancelar'}
            </button>
            <button
              onClick={handleSaveWithLoading}
              disabled={!canSave}
              data-testid="editor-save-btn"
              className={cn(
                "min-h-[44px] px-6 py-2 bg-atomicTangerine text-white rounded-full font-bold text-[0.875rem] shadow-sm transition-all flex items-center gap-2",
                canSave ? "hover:shadow-md hover:bg-atomicTangerine/90 cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}
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
              {isSavingManual && <LoaderCircle size={16} className="animate-spin" />}
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
