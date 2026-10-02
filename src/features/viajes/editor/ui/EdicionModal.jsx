import { cn } from '@shared/lib/utils/cn';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUpload, useToast } from '@app/providers';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';
import { normalizeToIsoDate, resolveCoverPhotoUrl } from '@shared/lib/utils/viajeUtils';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useEdicionGalleryManager } from '../model/hooks/useEdicionGalleryManager';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import { useVirtualKeyboard } from '../model/hooks/useVirtualKeyboard';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';
import EdicionHeaderSection from './components/EdicionHeaderSection';
import { createPortal } from 'react-dom';

const EdicionModal = ({
  viaje,
  onClose,
  onSave,
  esBorrador = false,
  ciudadInicial = null,
  isSaving: isSavingProp = false,
  onAfterSave,
}) => {
  const { t, i18n } = useTranslation(['editor', 'common', 'countries']);
  const { usuario } = useAuth();
  const { pushToast } = useToast();

  const usuarioUid = usuario?.uid || null;

  const uploadCtx = useUpload();
  const iniciarSubida = uploadCtx?.iniciarSubida || (() => {});
  const hasUploadContext = typeof uploadCtx?.iniciarSubida === 'function';
  const uploadStatus = viaje?.id ? uploadCtx?.getEstadoViaje?.(viaje.id) : null;

  // Local UI & Form state with lazy initialization
  const [activeTab, setActiveTab] = useState('info');
  const [headerFormData, setHeaderFormData] = useState(() => ({
    vibe: Array.isArray(viaje?.vibe) ? viaje.vibe : [],
    highlights: viaje?.highlights || { topFood: '', topView: '', topTip: '' },
    companions: Array.isArray(viaje?.companions) ? viaje.companions : [],
    texto: viaje?.texto || '',
    presupuesto: viaje?.presupuesto || null,
    titulo: viaje?.titulo || viaje?.nombreEspanol || '',
    fechaInicio: normalizeToIsoDate(viaje?.fechaInicio || viaje?.startDate || viaje?.date) || '',
    fechaFin: normalizeToIsoDate(viaje?.fechaFin || viaje?.endDate) || '',
    portadaUrl: resolveCoverPhotoUrl(viaje) || '',
    ...viaje,
  }));
  const [paradas, setParadas] = useState(() => viaje?.paradas || viaje?.destinos || []);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPortada, setGalleryPortada] = useState(0);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [isSaving, setIsSaving] = useState(() => isSavingProp);
  const [isUploading, setIsUploading] = useState(() => Boolean(uploadStatus?.isUploading));

  const { keyboardOffset, isKeyboardOpen } = useVirtualKeyboard();

  const modalRef = useRef(null);

  useEffect(() => {
    setIsSaving(isSavingProp);
  }, [isSavingProp]);

  useEffect(() => {
    if (uploadStatus?.isUploading !== undefined) {
      setIsUploading(Boolean(uploadStatus.isUploading));
    }
  }, [uploadStatus?.isUploading]);

  // Gallery hook (disabled for drafts)
  const galeria = useGaleriaViaje(!esBorrador && viaje?.id ? viaje.id : null);
  const isProcessingImage = Boolean(uploadStatus?.isUploading || isUploading || galeria?.uploading);

  // Gallery manager hook
  const {
    handleSetPortadaExistente,
    handleEliminarFoto,
    handleCaptionChange,
    handleCaptionSave,
  } = useEdicionGalleryManager({
    galeria,
    captionDrafts,
    setCaptionDrafts,
    pushToast,
    t,
  });

  // Modal lifecycle hook for smart title generation and state hydration
  const {
    isTituloAuto,
    setIsTituloAuto,
    limpiarEstado,
    handleTituloChange,
  } = useEdicionModalLifecycle({
    viaje,
    esBorrador,
    ciudadInicial,
    usuarioUid,
    galeria,
    formData: headerFormData,
    setFormData: setHeaderFormData,
    paradas,
    setParadas,
    setGalleryFiles,
    setGalleryPortada,
    setCaptionDrafts,
    t,
    i18n,
  });

  // Title regeneration handlers
  const handleRegenerateTitle = useCallback(() => {
    setIsTituloAuto(true);
  }, [setIsTituloAuto]);

  const handleToggleTituloAuto = useCallback(() => {
    setIsTituloAuto((prev) => !prev);
  }, [setIsTituloAuto]);

  // Save handler hook
  const handleSave = useEdicionModalSave({
    isProcessingImage,
    isSaving,
    isUploading,
    formData: headerFormData,
    viaje,
    ciudadInicial,
    paradas,
    onSave,
    galleryFiles,
    galleryPortada,
    hasUploadContext,
    iniciarSubida,
    pushToast,
    t,
    limpiarEstado,
    onClose,
    onAfterSave,
    autoFinalize: true,
  });

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSaving && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  const tabs = [
    { id: 'info', label: t('tabs.info') },
    { id: 'stops', label: t('tabs.stops') },
    { id: 'gallery', label: t('tabs.gallery') },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-gradient-to-t from-black/40 via-black/10 to-transparent p-4 md:p-6 overflow-hidden"
      style={
        isKeyboardOpen && keyboardOffset > 0
          ? { paddingBottom: `calc(${keyboardOffset}px + 1rem)` }
          : undefined
      }
      onClick={isSaving ? undefined : onClose}
    >
      <Motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[900px] max-h-[90dvh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border/50"
        style={
          isKeyboardOpen && keyboardOffset > 0
            ? { maxHeight: `calc(100dvh - ${keyboardOffset}px - 2rem)` }
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header con Imagen de Portada y Título */}
        <div className="flex-shrink-0">
          <EdicionHeaderSection
            t={t}
            formData={headerFormData}
            isBusy={isSaving || isProcessingImage}
            esBorrador={esBorrador}
            isTituloAuto={isTituloAuto}
            isProcessingImage={isProcessingImage}
            paradas={paradas}
            onTituloChange={handleTituloChange}
            onToggleTituloAuto={handleToggleTituloAuto}
            onRegenerateTitle={handleRegenerateTitle}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex-shrink-0 px-6 py-4 bg-surface border-b border-border flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "min-h-[44px] pb-2 text-[0.85rem] font-bold uppercase tracking-widest transition-all relative flex items-center",
                activeTab === tab.id 
                  ? "text-atomicTangerine" 
                  : "text-textSecondary hover:text-textPrimary"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <Motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-atomicTangerine rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background/50 custom-scroll overscroll-contain">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <Motion.div
                key="info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-8"
              >
                {/* Aquí irían otros campos de info general si los hubiera */}
                <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                  <h3 id="modal-title" className="text-lg font-bold text-charcoalBlue mb-4 drop-shadow-lg">{t('info.generalTitle')}</h3>
                  <p className="text-[0.9rem] text-textSecondary leading-relaxed">
                    {t('info.generalDescription')}
                  </p>
                </div>
              </Motion.div>
            )}

            {activeTab === 'stops' && (
              <Motion.div
                key="stops"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <EdicionParadasSection
                  t={t}
                  paradas={paradas}
                  setParadas={setParadas}
                />
              </Motion.div>
            )}

            {activeTab === 'gallery' && (
              <Motion.div
                key="gallery"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <EdicionGallerySection
                  t={t}
                  files={galleryFiles}
                  onFilesChange={setGalleryFiles}
                  portadaIndex={galleryPortada}
                  onPortadaChange={(urlOrIndex) => {
                    if (typeof urlOrIndex === 'number') {
                      setGalleryPortada(urlOrIndex);
                    } else if (typeof urlOrIndex === 'string') {
                      setHeaderFormData((prev) => ({ ...prev, portadaUrl: urlOrIndex }));
                    }
                  }}
                  isBusy={isSaving || isProcessingImage}
                  galeria={galeria}
                  captionDrafts={captionDrafts}
                  onCaptionChange={handleCaptionChange}
                  onCaptionSave={handleCaptionSave}
                  onSetPortadaExistente={handleSetPortadaExistente}
                  onEliminarFoto={handleEliminarFoto}
                  portadaUrl={headerFormData?.portadaUrl}
                />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div
          className={cn(
            "flex-shrink-0 p-4 sm:p-6 bg-surface border-t border-border flex items-center justify-between gap-4 transition-[padding] duration-150",
            isKeyboardOpen
              ? "pb-3 sm:pb-4"
              : "pb-[max(16px,env(safe-area-inset-bottom,16px))] md:pb-6"
          )}
        >
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] px-6 py-2.5 text-[0.9rem] font-bold text-textSecondary hover:text-textPrimary transition-colors inline-flex items-center justify-center"
            disabled={isSaving}
          >
            {t('button.cancel', { ns: 'common' })}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || isProcessingImage || isUploading}
            className={cn(
              "min-h-[44px] flex items-center gap-2 px-8 py-3 rounded-full text-[0.9rem] font-black tracking-wide shadow-lg transition-all",
              "bg-gradient-to-r from-atomicTangerine to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            )}
          >
            {isSaving ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                {t('button.saving', { ns: 'common' })}
              </>
            ) : (isProcessingImage || isUploading) ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                {t('optimizing', { ns: 'editor', defaultValue: 'Optimizando...' })}
              </>
            ) : (
              <>
                <Save size={18} />
                {t('button.save', { ns: 'common' })}
              </>
            )}
          </button>
        </div>
      </Motion.div>
    </div>,
    document.body
  );
};

export default EdicionModal;
