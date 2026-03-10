import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { SearchModal } from '@features/search/ui/SearchModal';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { EdicionModal, VisorViaje } from '@features/viajes';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';

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
      <SearchModal
        isOpen={mostrarBuscador}
        onClose={closeBuscador}
        query={filtro}
        setQuery={setFiltro}
        selectPlace={onLugarSeleccionado}
        onSearchError={() => pushToast('Connection error while searching', 'error')}
        onNoResults={(query) => pushToast(`No results for "${query}"`, 'info', 2500)}
      />

      {viajeParaEditar && (
        <ErrorBoundary>
          <EdicionModal
            viaje={viajeParaEditar}
            bitacoraData={bitacoraData}
            onClose={closeEditor}
            onSave={handleGuardarModal}
            isSaving={isSavingModal}
            esBorrador={esBorrador}
            ciudadInicial={ciudadInicialBorrador}
            onAfterSave={handleAfterSave}
          />
        </ErrorBoundary>
      )}

      {/* VisorViaje: montado/desmontado por la URL /trips/:id
          AnimatePresence aquí (no dentro de VisorViaje) garantiza las
          exit animations incluso con createPortal, ya que el PresenceContext
          propaga a través del árbol de fibras de React. */}
      <ErrorBoundary>
        <AnimatePresence>
          {tripId && (
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
