import { cn } from '@shared/lib/utils/cn';
import React from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '@features/auth';
import { useToast } from '@shared/lib/hooks/useToast';
import { useUpload } from '@features/viajes/upload';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import EdicionModal from '@features/viajes/editor/ui/EdicionModal/EdicionModal';

import { useVisorViajeData } from './hooks/useVisorViajeData';
import { useVisorViajeUI } from './hooks/useVisorViajeUI';
import { useVisorViajeGallery } from './hooks/useVisorViajeGallery';
import { useVisorViajeStory } from './hooks/useVisorViajeStory';
import { useDocumentaryState } from './hooks/useDocumentaryState';

import VisorContextSection from './components/VisorContextSection';
import VisorStorySection from './components/VisorStorySection';
import VisorGallerySection from './components/VisorGallerySection';
import VisorTimelineSection from './components/VisorTimelineSection';
import VisorRouteLayout from './components/VisorRouteLayout';
import VisorDestinoLayout from './components/VisorDestinoLayout';
import DocumentaryHero from './components/DocumentaryHero';

const VisorViaje = ({
  viajeId,
  tripData,
  tripList,
  MapRoutePreview,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { getEstadoViaje, reintentarFoto } = useUpload();
  // We keep isMobile here for structural component toggling (BottomSheet vs Modal in EdicionModal)
  // but internal layout is handled by Tailwind responsive prefixes.
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 900 : false;

  const dataVM = useVisorViajeData({
    viajeId,
    bitacoraData: tripData,
    bitacoraLista: tripList,
    usuario,
  });

  const { viajeBase, hasViajeData, data, ownerUid, paradas, isSharedTrip, ownerDisplayName, reloadParadas } = dataVM;
  const isRouteMode = paradas.length > 1;
  const isBusy = isSaving || isDeleting;

  // Título dinámico: se actualiza cuando carga el nombre del viaje
  useDocumentTitle(viajeBase?.titulo);

  const galleryVM = useVisorViajeGallery({
    viajeId,
    ownerUid,
    pushToast,
    getEstadoViaje,
    reintentarFoto,
  });

  const uiVM = useVisorViajeUI({ isRouteMode, isMobile });

  const docVM = useDocumentaryState({
    paradas,
    isMobile,
    enabled: isRouteMode && !uiVM.showEditModal
  });

  const storyVM = useVisorViajeStory({
    data,
    viajeBase,
    paradas,
  });

  const handleDeleteViaje = () => onDelete(viajeId);

  const handleEditSave = async (id, payload) => {
    const result = await onSave(id, payload);
    if (result) {
      await reloadParadas();
      galleryVM.galeria.recargar?.();
    }
    return result;
  };

  if (!hasViajeData) return null;

  const sectionsVM = {
    context: (
      <VisorContextSection
        data={data}
        isMobile={isMobile}
        carouselRef={uiVM.carouselRef}
        activeCarouselDot={uiVM.activeCarouselDot}
        onCarouselScroll={uiVM.handleCarouselScroll}
      />
    ),
    timeline: (
      <VisorTimelineSection
        paradas={paradas}
        isMobile={isMobile}
        activeParadaIndex={docVM.activeIndex}
        hoveredIndex={uiVM.hoveredIndex}
        setParadaRef={docVM.setParadaRef}
        onHover={uiVM.setHoveredIndex}
        onHoverEnd={() => uiVM.setHoveredIndex(null)}
        galeria={galleryVM.galeria}
      />
    ),
    story: <VisorStorySection stops={paradas} text={data.texto} />,
    gallery: (
      <VisorGallerySection
        isSharedTrip={isSharedTrip}
        showGalleryTools={galleryVM.showGalleryTools}
        onToggleGalleryTools={galleryVM.toggleGalleryTools}
        galeria={galleryVM.galeria}
        fotosSubiendo={galleryVM.fotosSubiendo}
        onReintentarFoto={galleryVM.onReintentarFoto}
        isMobile={isMobile}
        captionDrafts={galleryVM.captionDrafts}
        onCaptionChange={galleryVM.handleCaptionChange}
        onCaptionSave={galleryVM.handleCaptionSave}
        onSetPortada={galleryVM.handleSetPortadaExistente}
        onEliminarFoto={galleryVM.handleEliminarFoto}
        isBusy={isBusy}
        storyData={storyVM.storyData}
      />
    ),
  };

  return createPortal(
    <Motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-0 bg-background z-[10000] overflow-y-auto"
    >
        <DocumentaryHero
          isMobile={isMobile}
          fotoMostrada={storyVM.fotoMostrada}
          isBusy={isBusy}
          onClose={onClose}
          storyData={storyVM.storyData}
          isSharedTrip={isSharedTrip}
          onDelete={handleDeleteViaje}
          isDeleting={isDeleting}
          onOpenEdit={() => uiVM.setShowEditModal(true)}
          data={data}
          viajeBase={viajeBase}
          ownerDisplayName={ownerDisplayName}
          isRouteMode={isRouteMode}
        />

        {isRouteMode ? (
          <VisorRouteLayout
            isMobile={isMobile}
            paradas={paradas}
            activeParadaIndex={docVM.activeIndex}
            mapSyncIndex={docVM.mapSyncIndex}
            hoveredIndex={uiVM.hoveredIndex}
            onMarkerHover={uiVM.handleMarkerHover}
            onMarkerHoverEnd={uiVM.handleMarkerHoverEnd}
            onMarkerClick={(i) => {
              const node = docVM.getParadaNode(i);
              if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            showMapModal={uiVM.showMapModal}
            onOpenMap={() => uiVM.setShowMapModal(true)}
            onCloseMap={() => uiVM.setShowMapModal(false)}
            sections={sectionsVM}
          />
        ) : (
          <VisorDestinoLayout
            isMobile={isMobile}
            paradas={paradas}
            sections={sectionsVM}
            MapRoutePreview={MapRoutePreview}
          />
        )}

        {uiVM.showEditModal && (
          <EdicionModal
            viaje={{ ...data, id: viajeId }}
            onClose={() => uiVM.setShowEditModal(false)}
            onSave={handleEditSave}
            esBorrador={false}
            isSaving={isSaving}
          />
        )}
      </Motion.div>,
    document.body
  );
};

export default VisorViaje;
