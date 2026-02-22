import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, LogOut, User, X, Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearch, useUI } from '../../context/UIContext';
import { styles } from './Header.styles';
import useInvitations from '../../hooks/useInvitations';

const Header = ({ isMobile = false }) => {
  const { usuario, login, logout } = useAuth();
  const {
    tituloHeader,
    mostrarBusqueda,
    searchPlaceholder,
    openBuscador,
    setVistaActiva,
    openMobileDrawer
  } = useUI();
  const { busqueda, setBusqueda, limpiarBusqueda } = useSearch();
  const { invitations } = useInvitations();
  const [avatarError, setAvatarError] = useState(false);
  const iniciales = useMemo(() => usuario?.displayName?.trim()?.[0]?.toUpperCase() || '', [usuario?.displayName]);

  useEffect(() => {
    setAvatarError(false);
  }, [usuario?.photoURL]);

  return (
    <header style={styles.header(isMobile)}>
      <div style={styles.leftSide}>
        {isMobile && (
          <button type="button" style={styles.menuButton} onClick={openMobileDrawer} aria-label="Abrir menu">
            <Menu size={18} />
          </button>
        )}
        {!isMobile && <span style={styles.breadcrumb}>Keeptrip</span>}
        {!isMobile && <span style={styles.separator}>/</span>}
        <h2 style={styles.titulo(isMobile)}>{tituloHeader}</h2>
      </div>

      <div style={styles.rightSide(isMobile)}>
        {mostrarBusqueda && (
          <div style={styles.searchContainer(isMobile)}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              aria-label="Buscar en la bitacora"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              style={styles.searchInput}
            />
            {busqueda && (
              <button
                type="button"
                onClick={limpiarBusqueda}
                style={styles.clearButton}
                aria-label="Limpiar busqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <button style={styles.addButton(isMobile)} onClick={openBuscador}>
          <Plus size={18} />
          {!isMobile && <span style={styles.addButtonLabel}>Anadir Viaje</span>}
        </button>

        {usuario ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              data-testid="header-invitations-button"
              onClick={() => setVistaActiva('invitations')}
              aria-label={`Invitaciones (${invitations?.length || 0})`}
              title="Invitaciones"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
            >
              <Bell size={18} />
              {invitations?.length > 0 && (
                <span data-testid="header-invitations-count" aria-live="polite" style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '2px 6px', fontSize: 11, marginLeft: 6 }}>
                  {invitations.length}
                </span>
              )}
            </button>

            <div
              data-testid="header-avatar"
              style={{ ...styles.avatar, cursor: 'pointer' }}
              onClick={() => setVistaActiva('config')}
              title="Configurar Perfil"
              role="button"
            >
              {usuario.photoURL && !avatarError ? (
                <img
                  src={usuario.photoURL}
                  alt={`Foto de ${usuario.displayName || 'usuario'}`}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  onError={() => setAvatarError(true)}
                />
              ) : iniciales ? (
                <span style={styles.avatarInitials}>{iniciales}</span>
              ) : (
                <User size={20} />
              )}
            </div>

            {!isMobile && (
              <button
                data-testid="header-logout-button"
                onClick={logout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                title="Cerrar Sesion"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        ) : (
          <button data-testid="header-login-button" onClick={login} style={{ ...styles.addButton(isMobile), backgroundColor: '#4285F4' }}>
            Iniciar Sesion
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
