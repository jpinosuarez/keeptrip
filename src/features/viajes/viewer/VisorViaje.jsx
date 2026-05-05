import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUpload, useToast } from '@app/providers';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import EdicionModal from '@features/viajes/editor/ui/EdicionModal';

import { useVisorViajeData } from './hooks/useVisorViajeData';
import { useVisorViajeUI } from './hooks/useVisorViajeUI';
import { useVisorViajeGallery } from './hooks/useVisorViajeGallery';
import { useVisorViajeStory } from './hooks/useVisorViajeStory';
import { useDocumentaryState } from './hooks/useDocumentaryState';

import DocumentaryHero from './components/DocumentaryHero';
import VisorRouteLayout from './components/VisorRouteLayout';
import VisorDestinoLayout from './components/VisorDestinoLayout';
import VisorContextSection from './components/VisorContextSection';
import VisorStorySection from './components/VisorStorySection';
import VisorGallerySection from './components/VisorGallerySection';
import VisorTimelineSection from './components/VisorTimelineSection';

const VisorViaje = ({
  viajeId,
  tripData,
  tripList,
  onClose,
  onSave,
  onDelete,
}) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { getEstadoViaje, reintentarFoto } = useUpload();
  
  const { 
    viajeBase, 
    hasViajeData, 
    data, 
    ownerUid, 
    paradas, 
    isSharedTrip,
    ownerDisplayName,
    reloadParadas 
  } = useVisorViajeData({ viajeId, bitacoraData: tripData, bitacoraLista: tripList, usuario });

  const {
    showEditModal,
    setShowEditModal,
    hoveredIndex,
    setHoveredIndex,
    activeParadaIndex,
    setParadaRef,
    showMapModal,
    setShowMapModal,
    handleMarkerHover,
    handleMarkerHoverEnd,
    handleMarkerClick,
  } = useVisorViajeUI({ isRouteMode: paradas.length > 1, isMobile: false });

  const {
    galeria,
    fotosSubiendo,
    captionDrafts,
    showGalleryTools,
    toggleGalleryTools,
    onReintentarFoto,
    handleCaptionChange,
    handleCaptionSave,
    handleSetPortadaExistente,
    handleEliminarFoto,
  } = useVisorViajeGallery({ 
    viajeId, 
    ownerUid, 
    pushToast, 
    getEstadoViaje, 
    reintentarFoto 
  });

  const {
    fotoMostrada,
    storyData,
  } = useVisorViajeStory({ data, viajeBase, paradas });

  const {
    mapSyncIndex
  } = useDocumentaryState({ isMobile: false, enabled: true });

  useDocumentTitle(storyData?.titulo || 'Keeptrip');

  if (!hasViajeData) return null;

  const isOwner = !isSharedTrip;
  const isRouteMode = paradas.length > 1;
  const Layout = isRouteMode ? VisorRouteLayout : VisorDestinoLayout;

  const sections = {
    context: (
      <VisorContextSection
        data={data}
        isMobile={false}
      />
    ),
    timeline: (
      <VisorTimelineSection
        paradas={paradas}
        activeParadaIndex={activeParadaIndex}
        setParadaRef={setParadaRef}
        hoveredIndex={hoveredIndex}
        onMarkerHover={handleMarkerHover}
        onMarkerHoverEnd={handleMarkerHoverEnd}
        onMarkerClick={handleMarkerClick}
      />
    ),
    bitacora: (
      <VisorStorySection 
        storyData={storyData} 
        fotoMostrada={fotoMostrada}
      />
    ),
    gallery: (
      <VisorGallerySection
        galeria={galeria}
        fotosSubiendo={fotosSubiendo}
        captionDrafts={captionDrafts}
        showGalleryTools={showGalleryTools}
        toggleGalleryTools={toggleGalleryTools}
        onReintentarFoto={onReintentarFoto}
        onCaptionChange={handleCaptionChange}
        onCaptionSave={handleCaptionSave}
        onSetPortadaExistente={handleSetPortadaExistente}
        onEliminarFoto={handleEliminarFoto}
        isOwner={isOwner}
      />
    ),
  };

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-modal bg-background flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <DocumentaryHero 
            data={data}
            viajeBase={viajeBase}
            storyData={storyData}
            fotoMostrada={fotoMostrada}
            onClose={onClose}
            onDelete={() => onDelete(viajeId)}
            onOpenEdit={() => setShowEditModal(true)}
            isSharedTrip={isSharedTrip}
            ownerDisplayName={ownerDisplayName}
            isRouteMode={isRouteMode}
            isMobile={false}
          />

          <Layout 
            isMobile={false}
            paradas={paradas}
            sections={sections}
            activeParadaIndex={activeParadaIndex}
            mapSyncIndex={mapSyncIndex}
            hoveredIndex={hoveredIndex}
            onMarkerHover={handleMarkerHover}
            onMarkerHoverEnd={handleMarkerHoverEnd}
            onMarkerClick={handleMarkerClick}
            showMapModal={showMapModal}
            onOpenMap={() => setShowMapModal(true)}
            onCloseMap={() => setShowMapModal(false)}
          />
        </div>

        {showEditModal && (
          <EdicionModal
            viaje={data}
            onClose={() => setShowEditModal(false)}
            onSave={async (id, newData) => {
              const success = await onSave(id, newData);
              if (success) {
                reloadParadas();
                if (galeria.recargar) galeria.recargar();
                setShowEditModal(false);
              }
            }}
          />
        )}
      </Motion.div>
    </AnimatePresence>
  );
};

export default VisorViaje;
