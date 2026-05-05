import { cn } from '@shared/lib/utils/cn';
import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Save, LoaderCircle } from 'lucide-react';
import { useAuth, useUpload, useToast } from '@app/providers';
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
  
  // useUpload puede no estar disponible en tests aislados; usar fallback seguro
  let uploadCtx = null;
  try {
    uploadCtx = useUpload();
  } catch (e) {
    // skip
  }

  const {
    activeTab,
    setActiveTab,
    headerFormData,
    setHeaderFormData,
    paradas,
    setParadas,
    galleryFiles,
    setGalleryFiles,
    isProcessingImage,
    isTituloAuto,
    handleTituloChange,
    handleRegenerateTitle,
    handleSave,
    modalRef,
  } = useEdicionModalSave({
    viaje,
    esBorrador,
    ciudadInicial,
    onSave,
    onAfterSave,
    onClose,
  });

  const {
    galeria,
    captionDrafts,
    handleCaptionChange,
    handleCaptionSave,
    handleSetPortadaExistente,
    handleEliminarFoto,
  } = useEdicionGalleryManager(viaje?.id, setParadas);

  useEdicionModalLifecycle(onClose);

  const { t } = useTranslation('editor');

  const tabs = [
    { id: 'info', label: t('tabs.info') },
    { id: 'stops', label: t('tabs.stops') },
    { id: 'gallery', label: t('tabs.gallery') },
  ];

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
      <Motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[900px] max-h-[90dvh] bg-surface rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header con Imagen de Portada y Título */}
        <div className="flex-shrink-0">
          <EdicionHeaderSection
            t={t}
            formData={headerFormData}
            setFormData={setHeaderFormData}
            paradas={paradas}
            galleryFiles={galleryFiles}
            setGalleryFiles={setGalleryFiles}
            isProcessingImage={isProcessingImage}
            onTituloChange={handleTituloChange}
            isTituloAuto={isTituloAuto}
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
                "pb-2 text-[0.85rem] font-bold uppercase tracking-widest transition-all relative",
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background/50 custom-scrollbar">
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
                  <h3 id="modal-title" className="text-lg font-bold text-charcoalBlue mb-4">{t('info.generalTitle')}</h3>
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
                  galeria={galeria}
                  captionDrafts={captionDrafts}
                  onCaptionChange={handleCaptionChange}
                  onCaptionSave={handleCaptionSave}
                  onSetPortadaExistente={handleSetPortadaExistente}
                  onEliminarFoto={handleEliminarFoto}
                  portadaUrl={headerFormData.portadaUrl}
                  onPortadaChange={(url) => setHeaderFormData(prev => ({ ...prev, portadaUrl: url }))}
                />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-6 bg-surface border-t border-border flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-[0.9rem] font-bold text-textSecondary hover:text-textPrimary transition-colors"
            disabled={isSaving}
          >
            {t('button.cancel', { ns: 'common' })}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || isProcessingImage}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-full text-[0.9rem] font-black tracking-wide shadow-lg transition-all",
              "bg-gradient-to-r from-atomicTangerine to-orange-500 text-white hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            )}
          >
            {isSaving ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                {t('button.saving', { ns: 'common' })}
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
