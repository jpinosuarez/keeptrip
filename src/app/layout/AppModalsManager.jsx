import React, { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useMatch } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { BentoCardSkeleton } from '@shared/ui/components';
import UserMenuBottomSheet from '@shared/ui/components/UserMenuBottomSheet';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';

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
  const match = useMatch('/trips/:id');
  const tripId = match?.params?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  if (import.meta.env.DEV) {
    console.debug('AppModalsManager params', { tripId, searchParams: Object.fromEntries(searchParams.entries()) });
  }

  const {
    searchPaletteOpen,
    closeSearchPalette,
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
      // React Router only detects changes when a new URLSearchParams object is provided.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('editing');
        return next;
      });
    } else {
      setViajeBorrador(null);
      setCiudadInicialBorrador(null);
    }
  };

  const handleAfterSave = esBorrador
    ? () => {
        setViajeBorrador(null);
        setCiudadInicialBorrador(null);
      }
    : undefined;

  // ── ConfirmModal ──────────────────────────────────────────────────────────────
  const viajeAEliminar = confirmarEliminacion
    ? (bitacoraData[confirmarEliminacion] || bitacora.find((v) => v.id === confirmarEliminacion))
    : null;
  const tituloViajeAEliminar = viajeAEliminar?.titulo || viajeAEliminar?.nombreEspanol || 'este viaje';

  const searchPaletteFallback = (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 10002,
        maxWidth: 360,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.lg,
        boxShadow: SHADOWS.lg,
        padding: 14,
        color: COLORS.textPrimary,
      }}
      role="status"
      aria-live="polite"
    >
      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, lineHeight: 1.4 }}>
        El buscador tuvo un tropiezo. Puedes cerrarlo y abrirlo de nuevo.
      </p>
      <button
        type="button"
        onClick={() => {
          closeSearchPalette();
          pushToast?.('Buscador cerrado. Puedes abrirlo de nuevo cuando quieras.', 'info', 2400);
        }}
        style={{
          marginTop: 10,
          border: 'none',
          borderRadius: 9999,
          minHeight: 38,
          padding: '8px 12px',
          background: COLORS.atomicTangerine,
          color: COLORS.surface,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Cerrar buscador
      </button>
    </div>
  );

  return (
    <>
      <ErrorBoundary fallback={searchPaletteFallback}>
        <Suspense fallback={null}>
          <SearchPalette
            isOpen={searchPaletteOpen}
            onClose={closeSearchPalette}
            allTrips={bitacora}
            onSelectPlace={onLugarSeleccionado}
            onSelectTrip={(tripId) => navigate({ pathname: '/trips', search: `editing=${tripId}` })}
          />
        </Suspense>
      </ErrorBoundary>

      <UserMenuBottomSheet />

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
