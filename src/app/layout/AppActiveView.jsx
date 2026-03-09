import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import DashboardPage from '@pages/dashboard/ui/DashboardPage';
import MapStats from '../../pages/dashboard/ui/components/MapStats';
import { MapaView as MapaViajes } from '@features/mapa';
import BentoGrid from '@shared/ui/legacy_components/Bento/BentoGrid';
import SettingsPage from '../../pages/Configuracion/SettingsPage';
import CuracionPage from '../../pages/Curacion/CuracionPage';
import { InvitationsList } from '@features/invitations';
import { TravelerHub } from '@features/gamification';
import { ErrorBoundary } from '@shared/ui/components/ErrorBoundary';
import { styles } from './App.styles';

const Motion = motion;

function AppActiveView({
  view,
  data,
  crud,
  gamification,
  invitations,
}) {
  const { vistaActiva, isAdmin, isMobile } = view;
  const { paisesVisitados, bitacora, loadingViajes, todasLasParadas, bitacoraData } = data;
  const { solicitarEliminarViaje, isDeletingViaje } = crud;
  const { achievementsWithProgress, achievementStats } = gamification;

  return (
    <AnimatePresence mode="wait">
      {vistaActiva === 'home' && (
        <Motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <DashboardPage
            countriesVisited={paisesVisitados}
            log={bitacora}
            logData={bitacoraData}
            isMobile={isMobile}
            loading={loadingViajes}
          />
        </Motion.div>
      )}
      {vistaActiva === 'mapa' && (
        <Motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.containerMapaStyle(isMobile)}>
          <div style={styles.mapStatsOverlay(isMobile)}><MapStats log={bitacora} countriesVisited={paisesVisitados} /></div>
          <ErrorBoundary>
            <MapaViajes paises={paisesVisitados} paradas={todasLasParadas} />
          </ErrorBoundary>
        </Motion.div>
      )}
      {vistaActiva === 'bitacora' && (
        <Motion.div key="bitacora" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <ErrorBoundary>
            <BentoGrid
              viajes={bitacora}
              bitacoraData={bitacoraData}
              manejarEliminar={solicitarEliminarViaje}
              isDeletingViaje={isDeletingViaje}
            />
          </ErrorBoundary>
        </Motion.div>
      )}
      {vistaActiva === 'config' && (
        <Motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <SettingsPage />
        </Motion.div>
      )}

      {vistaActiva === 'hub' && (
        <Motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <TravelerHub
            paisesVisitados={paisesVisitados}
            bitacora={bitacora}
            achievementsWithProgress={achievementsWithProgress}
            stats={achievementStats}
          />
        </Motion.div>
      )}

      {vistaActiva === 'invitations' && (
        <Motion.div key="invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <ErrorBoundary>
            <div style={{ padding: 20 }}>
              <h3>Invitaciones</h3>
              <p style={{ color: '#6b7280' }}>Invitaciones recibidas para ver viajes compartidos.</p>
              <div style={{ marginTop: 12 }}>
                <React.Suspense fallback={<div>Cargando...</div>}>
                  <InvitationsList hook={invitations} />
                </React.Suspense>
              </div>
            </div>
          </ErrorBoundary>
        </Motion.div>
      )}
      {vistaActiva === 'curacion' && isAdmin && (
        <Motion.div key="curacion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.scrollableContent} className="custom-scroll">
          <CuracionPage />
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

export default AppActiveView;
