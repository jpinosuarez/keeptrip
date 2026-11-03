import React, { useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUpload, useToast } from '@app/providers';
import { useDocumentTitle } from '@shared/lib/hooks/useDocumentTitle';
import { useWindowSize } from '@shared/lib/hooks/useWindowSize';
import {
  ordenarParadasCronologicamente,
  computeRouteTelemetry,
} from '@shared/lib/utils/viajeUtils';
import { normalizeCountryCode } from '@shared/lib/utils/countryUtils';
import { calculateTripXP } from '@features/gamification/model/travelerLevel';

import { useVisorViajeData } from './hooks/useVisorViajeData';
import { useVisorViajeUI } from './hooks/useVisorViajeUI';
import { useVisorViajeGallery } from './hooks/useVisorViajeGallery';
import { useVisorViajeStory } from './hooks/useVisorViajeStory';
import { useDocumentaryState } from './hooks/useDocumentaryState';
import { buildTripStoryDeck, getHomeConnectionStatus } from './lib/buildTripStoryDeck';

import DocumentaryHero from './components/DocumentaryHero';
import VisorRouteLayout from './components/VisorRouteLayout';
import VisorDestinoLayout from './components/VisorDestinoLayout';
import VisorContextSection from './components/VisorContextSection';
import VisorStorySection from './components/VisorStorySection';
import VisorGallerySection from './components/VisorGallerySection';
import VisorTimelineSection from './components/VisorTimelineSection';
import VisorFooterSection from './components/VisorFooterSection';
import TripStoriesPlayerModal from './components/TripStoriesPlayerModal';

const VisorViaje = ({
  viajeId,
  tripData,
  tripList,
  onClose,
  onDelete,
  openEditor,
  onNavigateTrip,
  isDeleting = false,
  MapRoutePreview,
}) => {
  const { usuario, userProfile } = useAuth();
  const { pushToast } = useToast();
  const { getEstadoViaje, reintentarFoto } = useUpload();
  const { isMobile } = useWindowSize();

  const {
    viajeBase,
    hasViajeData,
    data,
    ownerUid,
    paradas,
    isSharedTrip,
    ownerDisplayName,
  } = useVisorViajeData({ viajeId, bitacoraData: tripData, bitacoraLista: tripList, usuario });

  const {
    hoveredIndex,
    hoveredStopId,
    activeParadaIndex,
    setParadaRef,
    showStories,
    setShowStories,
    handleMarkerHover,
    handleMarkerHoverEnd,
    handleStopHover,
    handleStopHoverEnd,
    handleMarkerClick,
  } = useVisorViajeUI({ isRouteMode: paradas.length > 1, isMobile });

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
    reintentarFoto,
  });

  const { fotoMostrada, storyData } = useVisorViajeStory({ data, viajeBase, paradas });
  const { mapSyncIndex } = useDocumentaryState({ enabled: true });

  useDocumentTitle(storyData?.titulo || 'Keeptrip');

  const paradasOrdenadas = useMemo(
    () => ordenarParadasCronologicamente(paradas),
    [paradas]
  );

  const countryCodes = useMemo(() => {
    const codes = new Set();
    const push = (value) => {
      const iso2 = normalizeCountryCode(value);
      if (iso2) codes.add(iso2);
    };
    push(data?.paisCodigo);
    push(data?.code);
    paradasOrdenadas.forEach((parada) => push(parada?.paisCodigo));
    return [...codes];
  }, [data?.paisCodigo, data?.code, paradasOrdenadas]);

  const telemetry = useMemo(
    () =>
      computeRouteTelemetry(paradasOrdenadas, {
        fechaInicio: data?.fechaInicio,
        fechaFin: data?.fechaFin,
      }),
    [paradasOrdenadas, data?.fechaInicio, data?.fechaFin]
  );

  const homeStatus = useMemo(
    () => getHomeConnectionStatus({ viaje: data, paradasOrdenadas, userProfile }),
    [data, paradasOrdenadas, userProfile]
  );

  const xpEarned = useMemo(
    () => calculateTripXP(data, paradasOrdenadas, galeria?.fotos || []),
    [data, paradasOrdenadas, galeria?.fotos]
  );

  const storyDeck = useMemo(
    () =>
      showStories
        ? buildTripStoryDeck({
            viaje: data,
            paradasOrdenadas,
            photos: galeria?.fotos || [],
            telemetry,
            userProfile,
          })
        : [],
    [showStories, data, paradasOrdenadas, galeria?.fotos, telemetry, userProfile]
  );

  const handleOpenEditor = () => {
    if (typeof openEditor === 'function') openEditor(viajeId);
  };

  if (!hasViajeData) return null;

  const isOwner = !isSharedTrip;
  const isRouteMode = paradasOrdenadas.length > 1;
  const Layout = isRouteMode ? VisorRouteLayout : VisorDestinoLayout;
  const tripStoryText = data?.texto || data?.relato || '';

  const sections = {
    context: (
      <VisorContextSection
        data={data}
        isMobile={isMobile}
      />
    ),
    timeline: (
      <VisorTimelineSection
        paradas={paradasOrdenadas}
        isMobile={isMobile}
        activeParadaIndex={activeParadaIndex}
        setParadaRef={setParadaRef}
        hoveredIndex={hoveredIndex}
        hoveredStopId={hoveredStopId}
        onMarkerHover={handleMarkerHover}
        onMarkerHoverEnd={handleMarkerHoverEnd}
        onHoverStop={handleStopHover}
        onHoverStopEnd={handleStopHoverEnd}
        onMarkerClick={handleMarkerClick}
      />
    ),
    bitacora: (
      <VisorStorySection
        stops={paradasOrdenadas}
        text={tripStoryText}
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
        isMobile={isMobile}
        onAddPhotos={handleOpenEditor}
      />
    ),
  };

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 md:left-[var(--sidebar-width,256px)] z-30 bg-[#F8FAFC] flex flex-col overflow-hidden transition-[left] duration-300"
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <DocumentaryHero
            data={data}
            viajeBase={viajeBase}
            storyData={storyData}
            fotoMostrada={fotoMostrada}
            onClose={onClose}
            onDelete={() => onDelete(viajeId)}
            onOpenEdit={handleOpenEditor}
            isSharedTrip={isSharedTrip}
            ownerDisplayName={ownerDisplayName}
            isRouteMode={isRouteMode}
            isMobile={isMobile}
            isDeleting={isDeleting}
            countryCodes={countryCodes}
            telemetry={telemetry}
            homeStatus={homeStatus}
            onOpenStories={() => setShowStories(true)}
          />

          <Layout
            isMobile={isMobile}
            paradas={paradasOrdenadas}
            countryCodes={countryCodes}
            paisCodigo={data?.paisCodigo || data?.code || null}
            sections={sections}
            activeParadaIndex={activeParadaIndex}
            mapSyncIndex={mapSyncIndex}
            hoveredIndex={hoveredIndex}
            hoveredStopId={hoveredStopId}
            onMarkerHover={handleMarkerHover}
            onMarkerHoverEnd={handleMarkerHoverEnd}
            onHoverStop={handleStopHover}
            onHoverStopEnd={handleStopHoverEnd}
            onMarkerClick={handleMarkerClick}
            MapRoutePreview={MapRoutePreview}
          />

          <div className="max-w-[960px] mx-auto w-full px-4 md:px-6 pb-10">
            <VisorFooterSection
              tripList={tripList}
              viajeId={viajeId}
              xp={xpEarned}
              shareData={storyData}
              onNavigateTrip={onNavigateTrip}
            />
          </div>
        </div>

        <TripStoriesPlayerModal
          isOpen={showStories}
          slides={storyDeck}
          onClose={() => setShowStories(false)}
          shareData={storyData}
        />
      </Motion.div>
    </AnimatePresence>
  );
};

export default VisorViaje;
