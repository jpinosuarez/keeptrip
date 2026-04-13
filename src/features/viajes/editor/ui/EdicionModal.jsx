import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { styles } from './EdicionModal.styles';
import { COLORS } from '@shared/config';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { useUpload } from '@app/providers/UploadContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { useOperationalFlags } from '@shared/lib';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from '@shared/lib/utils/viajeUtils';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useEdicionGalleryManager } from '../model/hooks/useEdicionGalleryManager';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';
import EdicionHeaderSection from './components/EdicionHeaderSection';

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
  const { isMobile } = useWindowSize(768);
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

  return (
    <AnimatePresence>
      <Motion.div style={styles.overlay(isMobile)} onClick={isBusy ? undefined : onClose} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
        <Motion.div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()} initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:30,opacity:0}} transition={{duration:0.3,ease:[0.25,1,0.5,1]}}>
          {/* Mobile drag-handle affordance */}
          {isMobile && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px 0 2px',
              flexShrink: 0,
              background: '#F8FAFC',
            }}>
              <div style={{
                width: '36px',
                height: '4px',
                borderRadius: '2px',
                background: '#CBD5E1',
              }} />
            </div>
          )}
          {/* Sección esencial: imágenes y fechas */}
          <EdicionHeaderSection
            styles={styles}
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
          <div style={{ ...styles.body, paddingBottom: 'calc(16px + 64px)' }} className="custom-scroll">
            {/* Itinerary / Stops */}
            <EdicionParadasSection
              styles={styles}
              t={t}
              paradas={paradas}
              setParadas={setParadas}
              fechaRangoDisplay={fechaRangoDisplay}
              sinParadas={sinParadas}
              isReadOnlyMode={isReadOnlyMode}
            />

            {/* Photo gallery */}
            <EdicionGallerySection
              styles={styles}
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
          <div style={styles.stickyFooter}>
              <Motion.button
                onClick={onClose}
                style={styles.cancelBtn(isBusy, isMobile)}
                disabled={isBusy}
                whileHover={!isBusy ? { backgroundColor: COLORS.background } : {}}
                whileTap={!isBusy ? { scale: 0.97 } : {}}
                transition={{ duration: 0.15 }}
              >{t('button.cancel')}</Motion.button>
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
                style={{
                  ...styles.saveBtn(isBusy, isMobile),
                  opacity: canSave ? 1 : 0.5,
                  cursor: canSave ? 'pointer' : 'not-allowed',
                }}
              >
                {isBusy ? <LoaderCircle size={18} className="spin" /> : <Save size={18} />}
                {isProcessingImage ? t('button.processing') : (isSaving ? t('button.saving') : (esBorrador ? t('button.createTrip') : t('button.save')))}
              </Motion.button>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default EdicionModal;
