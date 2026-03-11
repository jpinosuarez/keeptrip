import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { styles } from './EdicionModal.styles';
import { COLORS } from '@shared/config';
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
import AccordionSection from './components/AccordionSection';

const EdicionModal = ({ viaje, onClose, onSave, esBorrador, ciudadInicial, isSaving = false, onAfterSave }) => {
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
  const [formData, setFormData] = useState({
    vibe: [],
    highlights: { topFood: '', topView: '', topTip: '' },
    companions: [],
    texto: '',
    presupuesto: null,
  });
  const [paradas, setParadas] = useState([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPortada, setGalleryPortada] = useState(0);
  const [captionDrafts, setCaptionDrafts] = useState({});
  const [hasTried, setHasTried] = useState(false);

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
    onAfterSave,
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

  // Badges para acordeones: cuentan campos con datos
  const contextBadge = (() => {
    const n = [
      formData.presupuesto ? 1 : 0,
      (formData.vibe || []).length,
      (formData.companions || []).length,
    ].reduce((a, b) => a + b, 0);
    return n > 0 ? String(n) : null;
  })();

  const highlightsBadge = (() => {
    const n = Object.values(formData.highlights || {}).filter(Boolean).length;
    return n > 0 ? String(n) : null;
  })();

  const notesBadge = formData.texto?.trim() ? '●' : null;

  return (
    <AnimatePresence>
      <Motion.div style={styles.overlay(isMobile)} onClick={isBusy ? undefined : onClose} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
        <Motion.div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()} initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} exit={{y:30,opacity:0}} transition={{duration:0.3,ease:[0.25,1,0.5,1]}}>
          {/* Sección esencial: imágenes y fechas */}
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
              sinParadas={sinParadas && hasTried}
            />
            {/* Secciones secundarias agrupadas en acordeón */}
            <AccordionSection title={t('accordion.details')} badge={contextBadge}>
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
            </AccordionSection>
            <AccordionSection title={t('accordion.highlights')} badge={highlightsBadge}>
              <EdicionHighlightsSection
                styles={styles}
                t={t}
                formData={formData}
                setFormData={setFormData}
              />
            </AccordionSection>
            <AccordionSection title={t('accordion.notes')} badge={notesBadge}>
              <EdicionNotesSection
                styles={styles}
                t={t}
                texto={formData.texto}
                onChange={(texto) => setFormData((prev) => ({ ...prev, texto }))}
                isBusy={isBusy}
              />
            </AccordionSection>
          </div>
          <div style={styles.footer(isMobile)}>
              <Motion.button
                onClick={onClose}
                style={styles.cancelBtn(isBusy, isMobile)}
                disabled={isBusy}
                whileHover={!isBusy ? { backgroundColor: COLORS.background } : {}}
                whileTap={!isBusy ? { scale: 0.97 } : {}}
                transition={{ duration: 0.15 }}
              >{t('button.cancel')}</Motion.button>
              <Motion.button
                onClick={() => { setHasTried(true); handleSave(); }}
                style={styles.saveBtn(isBusy, isMobile)}
                disabled={isBusy}
                whileHover={!isBusy ? { scale: 1.02, boxShadow: '0 4px 20px rgba(255,107,53,0.35)' } : {}}
                whileTap={!isBusy ? { scale: 0.97 } : {}}
                transition={{ duration: 0.15 }}
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
