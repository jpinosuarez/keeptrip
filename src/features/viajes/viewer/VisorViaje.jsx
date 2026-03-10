import React from 'react';
import { createPortal } from 'react-dom';
import { motion as Motion } from 'framer-motion';
import { useAuth } from '@app/providers/AuthContext';
import { useToast } from '@app/providers/ToastContext';
import { useUpload } from '@app/providers/UploadContext';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import { styles } from './VisorViaje.styles';
import EdicionModal from '@features/viajes/editor/ui/EdicionModal';
import { useVisorViajeData } from './hooks/useVisorViajeData';
import { useVisorViajeGallery } from './hooks/useVisorViajeGallery';
import { useVisorViajeUI } from './hooks/useVisorViajeUI';
import { useVisorViajeStory } from './hooks/useVisorViajeStory';
import VisorHero from './components/VisorHero';
import VisorBitacoraSection from './components/VisorBitacoraSection';
import VisorGallerySection from './components/VisorGallerySection';
import VisorTimelineSection from './components/VisorTimelineSection';
import VisorContextSection from './components/VisorContextSection';
import VisorRouteLayout from './components/VisorRouteLayout';
import VisorDestinoLayout from './components/VisorDestinoLayout';

const VisorViaje = ({
  viajeId,
  bitacoraData,
  bitacoraLista,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}) => {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const { getEstadoViaje, reintentarFoto } = useUpload();
  const { isMobile } = useWindowSize(900);

  const dataVM = useVisorViajeData({
    viajeId,
    bitacoraData,
    bitacoraLista,
    usuario,
  });

  const { viajeBase, hasViajeData, data, ownerUid, paradas, isSharedTrip, ownerDisplayName, reloadParadas } = dataVM;
  const isRouteMode = paradas.length > 1;
  const isBusy = isSaving || isDeleting;

  const galleryVM = useVisorViajeGallery({
    viajeId,
    ownerUid,
    pushToast,
    getEstadoViaje,
    reintentarFoto,
  });

  const uiVM = useVisorViajeUI({ isRouteMode, isMobile });

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
        styles={styles}
        carouselRef={uiVM.carouselRef}
        activeCarouselDot={uiVM.activeCarouselDot}
        onCarouselScroll={uiVM.handleCarouselScroll}
      />
    ),
    timeline: (
      <VisorTimelineSection
        paradas={paradas}
        styles={styles}
        isMobile={isMobile}
        activeParadaIndex={uiVM.activeParadaIndex}
        hoveredIndex={uiVM.hoveredIndex}
        setParadaRef={uiVM.setParadaRef}
        onHover={uiVM.setHoveredIndex}
        onHoverEnd={() => uiVM.setHoveredIndex(null)}
      />
    ),
    bitacora: <VisorBitacoraSection paradas={paradas} texto={data.texto} styles={styles} />,
    gallery: (
      <VisorGallerySection
        styles={styles}
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
      />
    ),
  };

  return createPortal(
    <Motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      style={styles.expandedOverlay}
    >
        <VisorHero
          styles={styles}
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
          galeriaFotosCount={galleryVM.galeria.fotos.length}
        />

        {isRouteMode ? (
          <VisorRouteLayout
            isMobile={isMobile}
            styles={styles}
            paradas={paradas}
            activeParadaIndex={uiVM.activeParadaIndex}
            hoveredIndex={uiVM.hoveredIndex}
            onMarkerHover={uiVM.handleMarkerHover}
            onMarkerHoverEnd={uiVM.handleMarkerHoverEnd}
            onMarkerClick={uiVM.handleMarkerClick}
            showMapModal={uiVM.showMapModal}
            onOpenMap={() => uiVM.setShowMapModal(true)}
            onCloseMap={() => uiVM.setShowMapModal(false)}
            sections={sectionsVM}
          />
        ) : (
          <VisorDestinoLayout
            isMobile={isMobile}
            styles={styles}
            paradas={paradas}
            sections={sectionsVM}
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
