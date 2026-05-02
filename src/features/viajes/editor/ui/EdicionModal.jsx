import { cn } from '@shared/lib/utils/cn';
import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { useAuth } from '@features/auth';
import { useToast } from '@shared/lib/hooks/useToast';
import { useUpload } from '@features/viajes/upload';
import { useOperationalFlags } from '@shared/lib/hooks/useOperationalFlags';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from '@shared/lib/utils/viajeUtils';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useEdicionGalleryManager } from '../model/hooks/useEdicionGalleryManager';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';
import EdicionHeaderSection from './components/EdicionHeaderSection';
import { createPortal } from 'react-dom';

const EdicionModal = ({ viaje, onClose, onSave, esBorrador, ciudadInicial, isSaving = false, onAfterSave }) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { t, i18n } = useTranslation(['editor', 'countries']);
  const {
    flags: { level: operationalLevel, appReadonlyMode },
  } = useOperationalFlags();
  const isReadOnlyMode = Boolean(appReadonlyMode) || operationalLevel >= 3;

  // useUpload puede no estar disponible en tests aislados; usar fallback seguro
  let iniciarSubida = () => {};
  let hasUploadContext = false;
  let getEstadoViaje = () => ({ isUploading: false });
  try {
    const uploadCtx = useUpload();
    iniciarSubida = uploadCtx?.iniciarSubida || (() => {});
    getEstadoViaje = uploadCtx?.getEstadoViaje || (() => ({ isUploading: false }));
    hasUploadContext = typeof uploadCtx?.iniciarSubida === 'function';
  } catch {
    iniciarSubida = () => {};
    hasUploadContext = false;
  }

  // structural toggle check for components that still depend on it
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const usuarioUid = usuario?.uid || null;
  const [formData, setFormData] = useState({
    vibe: [],
    highlights: { topFood: '', topView: '', topTip: '' },
    companions: [],
    texto: '',
    presupuesto: null,
  });
  const [paradas, setParadas] = useState([]);
  const isProcessingImage = false;
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPortada, setGalleryPortada] = useState(0);
  const [captionDrafts, setCaptionDrafts] = useState({});

  const handlePortadaChange = (value) => {
    if (typeof value === 'number') {
      setGalleryPortada(value);
    } else if (typeof value === 'string') {
      setFormData((prev) => ({ ...prev, portadaUrl: value }));
    }
  };
  const previousGalleryLengthRef = useRef(0);

  // Hook de galería: no cargar para borradores (id 'new') — solo cuando es un viaje guardado
  const galeria = useGaleriaViaje(!esBorrador && viaje?.id ? viaje.id : null);

  const {
    isTituloAuto,
    setIsTituloAuto,
    titlePulse,
    limpiarEstado,
    handleTituloChange,
  } = useEdicionModalLifecycle({
    viaje,
    esBorrador,
    ciudadInicial,
    usuarioUid,
    galeria,
    formData,
    setFormData,
    paradas,
    setParadas,
    setGalleryFiles,
    setGalleryPortada,
    setCaptionDrafts,
    t,
    i18n,
  });

  const { isUploading } = viaje?.id ? getEstadoViaje(viaje.id) : { isUploading: false };

  const handleAfterSave = (savedId) => {
    if (onAfterSave) {
      onAfterSave(savedId);
      return;
    }
    onClose();
  };

  const handleSave = useEdicionModalSave({
    isProcessingImage,
    isSaving,
    isUploading,
    formData,
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
    onAfterSave: handleAfterSave,
  });

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
  const firstGalleryPhotoUrl = galeria?.fotos?.[0]?.url || null;

  // Auto-set first photo as cover when gallery goes from 0→1 photos
  useEffect(() => {
    const currentGalleryLength = galeria?.fotos?.length || 0;
    const prevLength = previousGalleryLengthRef.current;

    // Transition from 0→1+ photos: auto-set first photo as portada
    if (prevLength === 0 && currentGalleryLength > 0 && !formData.portadaUrl) {
      if (firstGalleryPhotoUrl) {
        setFormData((prev) => ({
          ...prev,
          portadaUrl: firstGalleryPhotoUrl,
        }));
      }
    }

    previousGalleryLengthRef.current = currentGalleryLength;
  }, [galeria?.fotos?.length, firstGalleryPhotoUrl, formData.portadaUrl]);

  if (!viaje) return null;

  const isBusy = isSaving || isProcessingImage || isUploading;
  const sinParadas = paradas.length === 0;
  const fechaRangoDisplay = formatDateRange(formData.fechaInicio, formData.fechaFin);
  const headerFormData = {
    ...viaje,
    ...formData,
    titulo: formData?.titulo ?? viaje?.titulo ?? viaje?.nombreEspanol ?? '',
  };
  const hasValidStops = Array.isArray(paradas) && paradas.length > 0;
  const hasValidTitle = Boolean((headerFormData?.titulo || '').trim());
  const hasValidStartDate = Boolean((formData?.fechaInicio || viaje?.fechaInicio || '').toString().trim());
  const canSave = hasValidStops && hasValidTitle && hasValidStartDate && !isBusy && !isReadOnlyMode;

  return createPortal(
    <AnimatePresence>
      <Motion.div 
        className="fixed inset-0 z-[20000] flex justify-center backdrop-blur-md bg-black/50 transition-opacity outline-none items-stretch md:items-center p-0 md:p-5"
        onClick={isBusy ? undefined : onClose} 
        initial={{ opacity: 0, visibility: 'hidden' }} 
        animate={{ opacity: 1, visibility: 'visible' }} 
        exit={{ opacity: 0 }} 
        transition={{ duration: 0.2 }}
        tabIndex="-1"
      >
        <Motion.div 
          className="bg-slate-50 flex flex-col overflow-hidden shadow-2xl relative w-full h-[94vh] rounded-t-3xl md:w-[640px] md:max-w-full md:h-[92vh] md:rounded-xl md:border md:border-white/20 outline-none"
          onClick={e => e.stopPropagation()} 
          initial={{ y: 10, opacity: 0, scale: 0.98, visibility: 'hidden' }} 
          animate={{ y: 0, opacity: 1, scale: 1, visibility: 'visible' }} 
          exit={{ y: 15, opacity: 0, scale: 0.98 }} 
          transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          tabIndex="-1"
        >
          {/* Mobile drag-handle affordance */}
          <div className="flex md:hidden justify-center pt-[10px] pb-0.5 shrink-0 bg-[#F8FAFC]">
            <div className="w-9 h-1 rounded-[2px] bg-[#CBD5E1]" />
          </div>

          {/* Sección esencial: imágenes y fechas */}
          <EdicionHeaderSection
            t={t}
            formData={headerFormData}
            isMobile={isMobile}
            isBusy={isBusy}
            esBorrador={esBorrador}
            isTituloAuto={isTituloAuto}
            titlePulse={titlePulse}
            isProcessingImage={isProcessingImage}
            paradas={paradas}
            onTituloChange={handleTituloChange}
            onToggleTituloAuto={() => setIsTituloAuto((prev) => !prev)}
            onRegenerateTitle={() => setIsTituloAuto(true)}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col gap-6 scrollbar-hide pb-[calc(24px+80px)]">
            {/* Itinerary / Stops */}
            <EdicionParadasSection
              t={t}
              paradas={paradas}
              setParadas={setParadas}
              fechaRangoDisplay={fechaRangoDisplay}
              tripStartDate={formData?.fechaInicio}
              sinParadas={sinParadas}
              isReadOnlyMode={isReadOnlyMode}
            />

            {/* Photo gallery */}
            <EdicionGallerySection
              t={t}
              files={galleryFiles}
              onFilesChange={setGalleryFiles}
              portadaIndex={galleryPortada}
              onPortadaChange={handlePortadaChange}
              portadaUrl={formData.portadaUrl}
              isBusy={isBusy}
              isMobile={isMobile}
              galeria={galeria}
              captionDrafts={captionDrafts}
              onCaptionChange={handleCaptionChange}
              onCaptionSave={handleCaptionSave}
              onSetPortadaExistente={handleSetPortadaExistente}
              onEliminarFoto={handleEliminarFoto}
              isReadOnlyMode={isReadOnlyMode}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md bg-white/90 border-t border-slate-200/80 flex items-center justify-between z-10 gap-3 min-h-[64px] pb-[max(16px,env(safe-area-inset-bottom,0px))]">
              <Motion.button
                onClick={onClose}
                className={cn(
                  "flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-[0.9rem] border border-slate-200 cursor-pointer flex items-center justify-center transition-all",
                  isBusy && "opacity-60 cursor-not-allowed"
                )}
                disabled={isBusy}
                whileHover={!isBusy ? { backgroundColor: '#f1f5f9' } : {}}
                whileTap={!isBusy ? { scale: 0.97 } : {}}
                transition={{ duration: 0.15 }}
              >
                {t('button.cancel')}
              </Motion.button>
              <Motion.button
                onClick={handleSave}
                disabled={!canSave}
                whileHover={canSave ? { scale: 1.02, boxShadow: '0 4px 20px rgba(255,107,53,0.35)' } : {}}
                whileTap={canSave ? { scale: 0.97 } : {}}
                transition={{ duration: 0.15 }}
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
                className={cn(
                  "flex-[1.5] md:flex-none md:min-w-[200px] h-11 rounded-xl bg-atomicTangerine text-white font-bold text-[0.9rem] border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all",
                  !canSave ? "opacity-50 cursor-not-allowed shadow-none" : "opacity-100"
                )}
              >
                {isBusy ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                {isProcessingImage ? t('button.processing') : (isSaving ? t('button.saving') : (esBorrador ? t('button.createTrip') : t('button.save')))}
              </Motion.button>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default EdicionModal;
