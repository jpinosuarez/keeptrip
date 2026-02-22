import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Sidebar from './components/Layout/Sidebar';
import Header from './components/Header/Header';
import DashboardHome from './components/Dashboard/DashboardHome';
import StatsMapa from './components/Dashboard/StatsMapa';
import MapaViajes from './components/Mapa/MapaView';
import BentoGrid from './components/Bento/BentoGrid';
import LandingPage from './components/Landing/LandingPage';

import BuscadorModal from './components/Buscador/BuscadorModal';
import EdicionModal from './components/Modals/EdicionModal';
import ConfirmModal from './components/Modals/ConfirmModal';
import VisorViaje from './components/VisorViaje/VisorViaje';
import SettingsPage from './pages/Configuracion/SettingsPage';
import CuracionPage from './pages/Curacion/CuracionPage';
import InvitationsList from './components/Invitations/InvitationsList';

import { ErrorBoundary } from './components/ErrorBoundary';
import { useViajes } from './hooks/useViajes';
import { useWindowSize } from './hooks/useWindowSize';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useSearch, useUI } from './context/UIContext';
import { styles } from './App.styles';
import { COUNTRIES_DATA, getFlagUrl } from './utils/countryUtils';

function App() {
  const { usuario, cargando, isAdmin } = useAuth();
  const { pushToast } = useToast();
  const { isMobile } = useWindowSize(768);

  const {
    paisesVisitados,
    bitacora,
    bitacoraData,
    todasLasParadas,
    guardarNuevoViaje,
    actualizarDetallesViaje,
    eliminarViaje,
    agregarParada
  } = useViajes();

  const {
    vistaActiva,
    sidebarCollapsed,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    mostrarBuscador,
    closeBuscador,
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
    abrirEditor,
    abrirVisor,
    setVistaActiva
  } = useUI();

  const { filtro, setFiltro, busqueda, setBusqueda } = useSearch();

  const [isSavingModal, setIsSavingModal] = useState(false);
  const [isSavingViewer, setIsSavingViewer] = useState(false);
  const [viajesEliminando, setViajesEliminando] = useState(new Set());

  const isDeletingViaje = (id) => viajesEliminando.has(id);

  const onLugarSeleccionado = useCallback((lugar) => {
    let datosPais = null;
    let ciudad = null;

    if (lugar.esPais) {
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === lugar.code);
      datosPais = {
        code: lugar.code,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.nombre,
        flag: getFlagUrl(lugar.code),
        continente: 'Mundo',
        latlng: lugar.coordenadas
      };
    } else {
      const paisInfo = COUNTRIES_DATA.find((c) => c.code === lugar.paisCodigo);
      datosPais = {
        code: lugar.paisCodigo,
        nombreEspanol: paisInfo ? paisInfo.name : lugar.paisNombre,
        flag: getFlagUrl(lugar.paisCodigo)
      };
      ciudad = {
        nombre: lugar.nombre,
        coordenadas: lugar.coordenadas,
        fecha: new Date().toISOString().split('T')[0],
        paisCodigo: lugar.paisCodigo,
        flag: getFlagUrl(lugar.paisCodigo)
      };
    }

    closeBuscador();
    setFiltro('');

    const nuevoBorrador = {
      id: 'new',
      code: datosPais.code,
      nombreEspanol: datosPais.nombreEspanol,
      flag: datosPais.flag,
      continente: 'Mundo',
      titulo: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      foto: null
    };

    setViajeBorrador(nuevoBorrador);
    setCiudadInicialBorrador(ciudad);
  }, [closeBuscador, setFiltro, setViajeBorrador, setCiudadInicialBorrador]);

  const handleGuardarModal = async (id, datosCombinados) => {
    if (isSavingModal) return null;
    setIsSavingModal(true);
    const { paradasNuevas, ...datosViaje } = datosCombinados;

    try {
      if (id === 'new') {
        const todasLasParadasLocal = [...(paradasNuevas || [])];
        if (ciudadInicialBorrador) {
          const yaExiste = todasLasParadasLocal.some((p) => p.nombre === ciudadInicialBorrador.nombre);
          if (!yaExiste) todasLasParadasLocal.unshift(ciudadInicialBorrador);
        }

        const nuevoId = await guardarNuevoViaje(datosViaje, todasLasParadasLocal);
        if (!nuevoId) {
          return null;
        }

        setViajeBorrador(null);
        setCiudadInicialBorrador(null);
        setTimeout(() => abrirVisor(nuevoId), 500);
        return nuevoId; // Retornar el ID del nuevo viaje
      }

      const okViaje = await actualizarDetallesViaje(id, datosViaje);
      let okParadas = true;

      if (paradasNuevas && paradasNuevas.length > 0) {
        const nuevasReales = paradasNuevas.filter((p) => p.id && p.id.toString().startsWith('temp'));
        for (const parada of nuevasReales) {
          const okParada = await agregarParada(parada, id);
          if (!okParada) okParadas = false;
        }
      }

      if (okViaje && okParadas) {
        return id; // Retornar el ID existente
      }

      if (okViaje && !okParadas) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
        return id; // Retornar el ID aunque haya error parcial
      }
      return null;
    } finally {
      setIsSavingModal(false);
    }
  };

  const handleGuardarDesdeVisor = async (id, datosCombinados) => {
    if (isSavingViewer) return false;
    setIsSavingViewer(true);
    const { paradasNuevas, ...datosViaje } = datosCombinados;

    try {
      const okViaje = await actualizarDetallesViaje(id, datosViaje);
      let okParadas = true;

      if (paradasNuevas && paradasNuevas.length > 0) {
        const nuevas = paradasNuevas.filter((p) => p.id && p.id.toString().startsWith('temp'));
        for (const parada of nuevas) {
          const okParada = await agregarParada(parada, id);
          if (!okParada) okParadas = false;
        }
      }

      if (okViaje && okParadas) {
        return true;
      }

      if (okViaje && !okParadas) {
        pushToast('El viaje se actualizo, pero algunas paradas no se pudieron guardar', 'error');
      }
      return false;
    } finally {
      setIsSavingViewer(false);
    }
  };

  const solicitarEliminarViaje = (id) => {
    if (!id || viajesEliminando.has(id)) return;
    setConfirmarEliminacion(id);
  };

  const handleDeleteViaje = async () => {
    const id = confirmarEliminacion;
    if (!id || viajesEliminando.has(id)) return false;

    setViajesEliminando((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const ok = await eliminarViaje(id);
      if (!ok) return false;
      setViajeExpandidoId(null);
      setViajeEnEdicionId(null);
      return true;
    } finally {
      setConfirmarEliminacion(null);
      setViajesEliminando((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (vistaActiva !== 'bitacora' && busqueda) {
      setBusqueda('');
    }
  }, [vistaActiva, busqueda, setBusqueda]);

  useEffect(() => {
    if (isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [vistaActiva, isMobile, mobileDrawerOpen, setMobileDrawerOpen]);

  useEffect(() => {
    if (!isMobile && mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [isMobile, mobileDrawerOpen, setMobileDrawerOpen]);

  useEffect(() => {
    if (vistaActiva === 'curacion' && !isAdmin) {
      setVistaActiva('home');
    }
  }, [vistaActiva, isAdmin, setVistaActiva]);

  if (!cargando && !usuario) return <LandingPage />;

  const viajeParaEditar = viajeEnEdicionId ? bitacora.find((v) => v.id === viajeEnEdicionId) : viajeBorrador;
  const viajeAEliminar = confirmarEliminacion
    ? (bitacoraData[confirmarEliminacion] || bitacora.find((v) => v.id === confirmarEliminacion))
    : null;
  const tituloViajeAEliminar = viajeAEliminar?.titulo || viajeAEliminar?.nombreEspanol || 'este viaje';

  return (
    <div style={styles.appWrapper}>
      <Sidebar isMobile={isMobile} />

      <motion.main
        style={{
          ...styles.mainContent(isMobile),
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? '80px' : '260px')
        }}
      >
        <Header isMobile={isMobile} />

        <section style={styles.sectionWrapper(isMobile)}>
          <AnimatePresence mode="wait">
            {vistaActiva === 'home' && (
              <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
                <DashboardHome
                  paisesVisitados={paisesVisitados}
                  bitacora={bitacora}
                  isMobile={isMobile}
                />
              </motion.div>
            )}
            {vistaActiva === 'mapa' && (
              <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.containerMapaStyle(isMobile)}>
                <div style={styles.mapStatsOverlay(isMobile)}><StatsMapa bitacora={bitacora} paisesVisitados={paisesVisitados} /></div>
                <ErrorBoundary>
                  <MapaViajes paises={paisesVisitados} paradas={todasLasParadas} />
                </ErrorBoundary>
              </motion.div>
            )}
            {vistaActiva === 'bitacora' && (
              <motion.div key="bitacora" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
                <ErrorBoundary>
                  <BentoGrid
                    viajes={bitacora}
                    bitacoraData={bitacoraData}
                    manejarEliminar={solicitarEliminarViaje}
                    isDeletingViaje={isDeletingViaje}
                  />
                </ErrorBoundary>
              </motion.div>
            )}
            {vistaActiva === 'config' && (
              <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
                <SettingsPage />
              </motion.div>
            )}

            {vistaActiva === 'invitations' && (
              <motion.div key="invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
                <ErrorBoundary>
                  <div style={{ padding: 20 }}>
                    <h3>Invitaciones</h3>
                    <p style={{ color: '#6b7280' }}>Invitaciones recibidas para ver viajes compartidos.</p>
                    <div style={{ marginTop: 12 }}>
                      <React.Suspense fallback={<div>Cargando...</div>}>
                        <InvitationsList />
                      </React.Suspense>
                    </div>
                  </div>
                </ErrorBoundary>
              </motion.div>
            )}
            {vistaActiva === 'curacion' && isAdmin && (
              <motion.div key="curacion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
                <CuracionPage />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </motion.main>

      <BuscadorModal
        isOpen={mostrarBuscador}
        onClose={closeBuscador}
        filtro={filtro}
        setFiltro={setFiltro}
        seleccionarLugar={onLugarSeleccionado}
        onSearchError={() => pushToast('Error de conexion al buscar ciudad', 'error')}
        onNoResults={(query) => pushToast(`Sin resultados para "${query}"`, 'info', 2500)}
      />


      {/* Renderizar modales solo si hay viaje para editar o expandir */}
      {viajeParaEditar && (
        <ErrorBoundary>
          <EdicionModal
            viaje={viajeParaEditar}
            bitacoraData={bitacoraData}
            onClose={() => { setViajeEnEdicionId(null); setViajeBorrador(null); }}
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
            onEdit={abrirEditor}
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
    </div>
  );
}

export default App;
