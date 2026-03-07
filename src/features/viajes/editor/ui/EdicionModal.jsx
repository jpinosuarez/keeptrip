import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { styles } from './EdicionModal.styles';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { useUpload } from '@app/providers/UploadContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { compressImage } from '@shared/lib/utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from '@shared/lib/utils/viajeUtils';
import { useGaleriaViaje } from '@shared/lib/hooks/useGaleriaViaje';
import { useEdicionModalSave } from '../model/hooks/useEdicionModalSave';
import { useEdicionCompanions } from '../model/hooks/useEdicionCompanions';
import { useEdicionGalleryManager } from '../model/hooks/useEdicionGalleryManager';
import { useEdicionModalLifecycle } from '../model/hooks/useEdicionModalLifecycle';
import EdicionContextSection from './components/EdicionContextSection';
import EdicionHighlightsSection from './components/EdicionHighlightsSection';
import EdicionNotesSection from './components/EdicionNotesSection';
import EdicionGallerySection from './components/EdicionGallerySection';
import EdicionParadasSection from './components/EdicionParadasSection';
import EdicionHeaderSection from './components/EdicionHeaderSection';

const EdicionModal = ({ viaje, onClose, onSave, esBorrador, ciudadInicial, isSaving = false }) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { t } = useTranslation('editor');
  // useUpload puede no estar disponible en tests aislados; usar fallback seguro
  let iniciarSubida = () => {};
  let hasUploadContext = false;
  try {
    const uploadCtx = useUpload();
    iniciarSubida = uploadCtx?.iniciarSubida || (() => {});
    hasUploadContext = typeof uploadCtx?.iniciarSubida === 'function';
  } catch {
    iniciarSubida = () => {};
    hasUploadContext = false;
  }
  const { isMobile } = useWindowSize(768);
  const usuarioUid = usuario?.uid || null;
  const [formData, setFormData] = useState({});
  const [paradas, setParadas] = useState([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPortada, setGalleryPortada] = useState(0);
  const [captionDrafts, setCaptionDrafts] = useState({});

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
  });

  const handleSave = useEdicionModalSave({
    isProcessingImage,
    isSaving,
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

  const {
    companionDraft,
    companionResults,
    handleCompanionSearch,
    handleAddCompanionFromResult,
    handleAddCompanionFreeform,
  } = useEdicionCompanions({
    formData,
    setFormData,
    viaje,
    usuario,
    pushToast,
    t,
  });

  const handleFileChange = async (e) => {
    setIsProcessingImage(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsProcessingImage(false);
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      pushToast(t('error.unsupportedFormat'), 'error');
      e.target.value = '';
      setIsProcessingImage(false);
      return;
    }

    try {
      const { blob, dataUrl } = await compressImage(file, 1920, 0.8);
      const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setFormData((prev) => ({ ...prev, foto: dataUrl, fotoFile: optimizedFile, fotoCredito: null }));
    } catch (error) {
      console.error('Error optimizando imagen:', error);
      pushToast(t('error.optimizationFailed'), 'error');
    } finally {
      setIsProcessingImage(false);
      e.target.value = '';
    }
  };

  if (!viaje) return null;

  const isBusy = isSaving || isProcessingImage;
  const sinParadas = paradas.length === 0;
  const fechaRangoDisplay = formatDateRange(formData.fechaInicio, formData.fechaFin);

  return (
    <AnimatePresence>
      <Motion.div style={styles.overlay(isMobile)} onClick={isBusy ? undefined : onClose} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <Motion.div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()} initial={{y:50}} animate={{y:0}} exit={{y:50}}>
          <EdicionHeaderSection
            styles={styles}
            t={t}
            formData={formData}
            isMobile={isMobile}
            isBusy={isBusy}
            esBorrador={esBorrador}
            isTituloAuto={isTituloAuto}
            titlePulse={titlePulse}
            isProcessingImage={isProcessingImage}
            onTituloChange={handleTituloChange}
            onToggleTituloAuto={() => setIsTituloAuto((prev) => !prev)}
            onFileChange={handleFileChange}
          />

          <div style={styles.body} className="custom-scroll">
            <EdicionGallerySection
              styles={styles}
              t={t}
              files={galleryFiles}
              onFilesChange={setGalleryFiles}
              portadaIndex={galleryPortada}
              onPortadaChange={setGalleryPortada}
              isBusy={isBusy}
              isMobile={isMobile}
              galeria={galeria}
              esBorrador={esBorrador}
              viajeId={viaje?.id}
              captionDrafts={captionDrafts}
              onCaptionChange={handleCaptionChange}
              onCaptionSave={handleCaptionSave}
              onSetPortadaExistente={handleSetPortadaExistente}
              onEliminarFoto={handleEliminarFoto}
            />

            <EdicionParadasSection
              styles={styles}
              t={t}
              paradas={paradas}
              setParadas={setParadas}
              fechaRangoDisplay={fechaRangoDisplay}
              sinParadas={sinParadas}
            />

            {/* Contexto del viaje: presupuesto, vibe, companions */}
            <EdicionContextSection
              styles={styles}
              t={t}
              formData={formData}
              setFormData={setFormData}
              companionDraft={companionDraft}
              companionResults={companionResults}
              onCompanionSearch={handleCompanionSearch}
              onAddCompanionFreeform={handleAddCompanionFreeform}
              onAddCompanionFromResult={handleAddCompanionFromResult}
            />

            <EdicionHighlightsSection
              styles={styles}
              t={t}
              formData={formData}
              setFormData={setFormData}
            />

            <EdicionNotesSection
              styles={styles}
              t={t}
              texto={formData.texto}
              onChange={(texto) => setFormData((prev) => ({ ...prev, texto }))}
              isBusy={isBusy}
            />
            <div style={styles.footer}>
                <button onClick={onClose} style={styles.cancelBtn(isBusy)} disabled={isBusy}>{t('button.cancel')}</button>
                <button onClick={handleSave} style={styles.saveBtn(isBusy)} disabled={isBusy}>
                  {isBusy ? <LoaderCircle size={18} className="spin" /> : <Save size={18} />}
                  {isProcessingImage ? t('button.processing') : (isSaving ? t('button.saving') : (esBorrador ? t('button.createTrip') : t('button.save')))}
                </button>
            </div>
          </div>
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default EdicionModal;
