import React, { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { BentoCardSkeleton } from '@shared/ui/components';

// ── Lazy-loaded heavy components ───────────────────────────────────────────────
// Cada uno genera su propio chunk de Rolldown y solo se descarga cuando el
// usuario abre la funcionalidad por primera vez. Las visitas siguientes usan
// la caché del SW de Workbox.
const SearchPalette = lazy(() => import('@features/search/ui/SearchPalette/SearchPalette'));
const EditorFocusPanel = lazy(() => import('@features/viajes/editor/ui/EditorFocusPanel'));
const SearchModal  = lazy(() => import('@features/search/ui/SearchModal/SearchModal'));
const EdicionModal = lazy(() => import('@features/viajes/editor/ui/EdicionModal'));
const VisorViaje   = lazy(() => import('@features/viajes/viewer/VisorViaje'));

/**
 * Skeleton de pantalla completa para la carga inicial de VisorViaje.
 * Usa createPortal para renderizar en el mismo layer visual que el viewer
 * (z-index 9999), evitando flashes en el contenido subyacente.
 */
function VisorViajeFallback() {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BentoCardSkeleton />
    </div>,
    document.body
  );
}

function AppModalsManager({
  modalController,
  data,
  crud,
  onLugarSeleccionado,
  pushToast,
}) {
  const { id: tripId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    mostrarBuscador,
    closeBuscador,
    searchPaletteOpen,
    closeSearchPalette,
    filtro,
    setFiltro,
    viajeBorrador,
    setViajeBorrador,
    ciudadInicialBorrador,
    setCiudadInicialBorrador,
    confirmarEliminacion,
    setConfirmarEliminacion,
  } = modalController;

  const { bitacora, bitacoraData } = data;
  const {
    isSavingModal,
    isSavingViewer,
    viajesEliminando,
    handleGuardarModal,
    handleGuardarDesdeVisor,
    solicitarEliminarViaje,
    handleDeleteViaje,
  } = crud;

  // ── EdicionModal: ?editing=<id> para viajes existentes, viajeBorrador para nuevos ──
  const editingId = searchParams.get('editing');
  const viajeParaEditar = editingId
    ? bitacora.find((v) => v.id === editingId)
    : viajeBorrador;
  const esBorrador = !editingId && !!viajeBorrador;

  const closeEditor = () => {
    if (editingId) {
      setSearchParams((prev) => { prev.delete('editing'); return prev; });
    } else {
      setViajeBorrador(null);
      setCiudadInicialBorrador(null);
    }
  };

  // Al guardar un nuevo viaje, limpiar borrador y navegar al visor vía URL
  const handleAfterSave = esBorrador
    ? (savedId) => {
        setViajeBorrador(null);
        setCiudadInicialBorrador(null);
        setTimeout(() => navigate('/trips/' + savedId), 400);
      }
    : undefined;

  // ── ConfirmModal ──────────────────────────────────────────────────────────────
  const viajeAEliminar = confirmarEliminacion
    ? (bitacoraData[confirmarEliminacion] || bitacora.find((v) => v.id === confirmarEliminacion))
    : null;
  const tituloViajeAEliminar = viajeAEliminar?.titulo || viajeAEliminar?.nombreEspanol || 'este viaje';

  return (
    <>
      <Suspense fallback={null}>
        <SearchPalette
          isOpen={searchPaletteOpen}
          onClose={closeSearchPalette}
          allTrips={bitacora}
          onSelectPlace={onLugarSeleccionado}
          onSelectTrip={(tripId) => navigate('/trips/' + tripId)}
        />
      </Suspense>

      {viajeParaEditar && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <EditorFocusPanel
              viaje={viajeParaEditar}
              bitacoraData={bitacoraData}
              onClose={closeEditor}
              onSave={handleGuardarModal}
              isSaving={isSavingModal}
              esBorrador={esBorrador}
              ciudadInicial={ciudadInicialBorrador}
              onAfterSave={handleAfterSave}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* VisorViaje: montado/desmontado por la URL /trips/:id
          AnimatePresence aquí (no dentro de VisorViaje) garantiza las
          exit animations incluso con createPortal, ya que el PresenceContext
          propaga a través del árbol de fibras de React. */}
      <ErrorBoundary>
        <AnimatePresence>
          {tripId && (
            <Suspense fallback={<VisorViajeFallback />}>
              <VisorViaje
                key={tripId}
                viajeId={tripId}
                bitacoraLista={bitacora}
                bitacoraData={bitacoraData}
                onClose={() => navigate('/trips')}
                onSave={handleGuardarDesdeVisor}
                onDelete={solicitarEliminarViaje}
                isSaving={isSavingViewer}
                isDeleting={!!(tripId && viajesEliminando.has(tripId))}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </ErrorBoundary>

      <ConfirmModal
        isOpen={!!confirmarEliminacion}
        title={`Eliminar ${tituloViajeAEliminar}?`}
        message="Esta accion eliminara el viaje y sus recuerdos asociados de forma permanente. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteViaje}
        onClose={() => setConfirmarEliminacion(null)}
        isLoading={!!(confirmarEliminacion && viajesEliminando.has(confirmarEliminacion))}
      />
    </>
  );
}

export default AppModalsManager;
