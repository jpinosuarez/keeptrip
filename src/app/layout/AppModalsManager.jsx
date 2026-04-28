import React, { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate, useMatch } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import ConfirmModal from '@shared/ui/modals/ConfirmModal';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { LoaderCircle } from 'lucide-react';
import UserMenuBottomSheet from '@widgets/userMenu/ui/UserMenuBottomSheet';
import { COLORS, RADIUS, SHADOWS } from '@shared/config';
import { getLocalizedCountryName } from '@shared/lib/utils/countryI18n';

// ── Lazy-loaded heavy components ───────────────────────────────────────────────
// Cada uno genera su propio chunk de Rolldown y solo se descarga cuando el
// usuario abre la funcionalidad por primera vez. Las visitas siguientes usan
// la caché del SW de Workbox.
const SearchPalette = lazy(() => import('@features/search/ui/SearchPalette/SearchPalette'));
const EditorFocusPanel = lazy(() =>
  import('@features/viajes/editor/ui/EditorFocusPanel').catch(() => {
    // Retry once on chunk-load failure (stale hash after deploy)
    return import('@features/viajes/editor/ui/EditorFocusPanel');
  })
);
const VisorViaje   = lazy(() => import('@features/viajes/viewer/VisorViaje'));
const MiniMapaRuta = lazy(() => import('@features/mapa/ui/components/MiniMapaRuta'));

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
      <LoaderCircle 
        className="animate-spin" 
        size={32} 
        color={COLORS.atomicTangerine} 
      />
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
  const { i18n } = useTranslation();
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
    deletingTripIds,
    handleSaveModal,
    handleSaveFromViewer,
    requestTripDelete,
    handleDeleteTrip,
  } = crud;

  // ── EdicionModal: ?editing=<id> para viajes existentes, viajeBorrador para nuevos ──
  const editingId = searchParams.get('editing');
  const viajeParaEditar = editingId
    ? bitacoraData[editingId] || bitacora.find((v) => v.id === editingId)
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
  const countryCodeAEliminar = viajeAEliminar?.paisCodigo || viajeAEliminar?.code || viajeAEliminar?.countryCode;
  const localizedCountryAEliminar = getLocalizedCountryName(countryCodeAEliminar, i18n.language);
  const tituloViajeAEliminar = viajeAEliminar?.titulo || localizedCountryAEliminar || viajeAEliminar?.nombreEspanol || 'este viaje';

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
      {searchPaletteOpen && (
        <ErrorBoundary fallback={searchPaletteFallback}>
          <Suspense fallback={searchPaletteFallback}>
            <SearchPalette
              isOpen={searchPaletteOpen}
              onClose={closeSearchPalette}
              allTrips={bitacora}
              onSelectPlace={onLugarSeleccionado}
              onSelectTrip={(tripId) => navigate({ pathname: '/trips', search: `editing=${tripId}` })}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <UserMenuBottomSheet />

      {viajeParaEditar && (
        <ErrorBoundary>
          <Suspense fallback={<VisorViajeFallback />}>
            <EditorFocusPanel
              viaje={viajeParaEditar}
              bitacoraData={bitacoraData}
              onClose={closeEditor}
              onSave={handleSaveModal}
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
                tripList={bitacora}
                tripData={bitacoraData}
                MapRoutePreview={MiniMapaRuta}
                onClose={() => navigate('/trips')}
                onSave={handleSaveFromViewer}
                onDelete={requestTripDelete}
                isSaving={isSavingViewer}
                isDeleting={!!(tripId && deletingTripIds.has(tripId))}
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
        onConfirm={handleDeleteTrip}
        onClose={() => setConfirmarEliminacion(null)}
        isLoading={!!(confirmarEliminacion && deletingTripIds.has(confirmarEliminacion))}
      />
    </>
  );
}

export default AppModalsManager;
