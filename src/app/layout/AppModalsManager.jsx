import React from 'react';

import BuscadorModal from '@shared/ui/legacy_components/Buscador/BuscadorModal';
import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { EdicionModal, VisorViaje } from '@features/viajes';
import { ErrorBoundary } from '@shared/ui/legacy_components/ErrorBoundary';

function AppModalsManager({
  modalController,
  data,
  crud,
  onLugarSeleccionado,
  pushToast,
}) {
  const {
    mostrarBuscador,
    closeBuscador,
    filtro,
    setFiltro,
    viajeEnEdicionId,
    setViajeEnEdicionId,
    viajeExpandidoId,
    setViajeExpandidoId,
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

  const viajeParaEditar = viajeEnEdicionId ? bitacora.find((v) => v.id === viajeEnEdicionId) : viajeBorrador;
  const viajeAEliminar = confirmarEliminacion
    ? (bitacoraData[confirmarEliminacion] || bitacora.find((v) => v.id === confirmarEliminacion))
    : null;
  const tituloViajeAEliminar = viajeAEliminar?.titulo || viajeAEliminar?.nombreEspanol || 'este viaje';

  return (
    <>
      <BuscadorModal
        isOpen={mostrarBuscador}
        onClose={closeBuscador}
        filtro={filtro}
        setFiltro={setFiltro}
        seleccionarLugar={onLugarSeleccionado}
        onSearchError={() => pushToast('Error de conexion al buscar ciudad', 'error')}
        onNoResults={(query) => pushToast(`Sin resultados para "${query}"`, 'info', 2500)}
      />

      {viajeParaEditar && (
        <ErrorBoundary>
          <EdicionModal
            viaje={viajeParaEditar}
            bitacoraData={bitacoraData}
            onClose={() => { setViajeEnEdicionId(null); setViajeBorrador(null); setCiudadInicialBorrador(null); }}
            onSave={handleGuardarModal}
            isSaving={isSavingModal}
            esBorrador={!!viajeBorrador}
            ciudadInicial={ciudadInicialBorrador}
          />
        </ErrorBoundary>
      )}

      {viajeExpandidoId && (
        <ErrorBoundary>
          <VisorViaje
            viajeId={viajeExpandidoId}
            bitacoraLista={bitacora}
            bitacoraData={bitacoraData}
            onClose={() => setViajeExpandidoId(null)}
            onSave={handleGuardarDesdeVisor}
            onDelete={solicitarEliminarViaje}
            isSaving={isSavingViewer}
            isDeleting={!!(viajeExpandidoId && viajesEliminando.has(viajeExpandidoId))}
          />
        </ErrorBoundary>
      )}

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
