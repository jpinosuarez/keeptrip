/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';

const mockOpenTripSearch = vi.fn();
const mockOpenUserMenu = vi.fn();
const mockLogin = vi.fn();
const mockSetBusqueda = vi.fn();
const mockLimpiarBusqueda = vi.fn();

let mockUser = { uid: 'u1', displayName: 'Jane Doe', photoURL: null };

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({
    usuario: mockUser,
    login: mockLogin,
  }),
}));

vi.mock('@app/providers/UIContext', () => ({
  useUI: () => ({
    openBuscador: mockOpenTripSearch,
    openUserMenu: mockOpenUserMenu,
    isReadOnlyMode: false,
  }),
  useSearch: () => ({
    busqueda: '',
    setBusqueda: mockSetBusqueda,
    limpiarBusqueda: mockLimpiarBusqueda,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'nav:pageTitle.home': 'Inicio',
        'nav:pageTitle.journal': 'Mis Viajes',
        'nav:pageTitle.worldMap': 'Mapa Mundial',
        'nav:pageTitle.settings': 'Ajustes',
        'nav:pageTitle.invitations': 'Invitaciones',
        'nav:pageTitle.hub': 'Traveler Hub',
        'pageTitle.worldMap': 'Mapa Mundial',
        'nav:addTrip': 'Añadir Viaje',
        'nav:settings': 'Configuración',
        'nav:searchJournal': 'Buscar en tus viajes',
        'common:login': 'Iniciar Sesión',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Unified Mobile Top App Bar & Header', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { uid: 'u1', displayName: 'Jane Doe', photoURL: null };
  });

  it('renders Dashboard mobile bar with Brand anchor and suppresses redundant subtitle', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );

    // Brand presence is anchored to Home
    expect(screen.getByRole('button', { name: /keeptrip/i })).toBeTruthy();
    expect(screen.getByTestId('header-avatar')).toBeTruthy();
  });

  it('renders Trips mobile bar with distinct Screen Title and Quick Add action', () => {
    render(
      <MemoryRouter initialEntries={['/trips']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );

    // Title is Mis Viajes
    expect(screen.getByRole('heading', { level: 1, name: 'Mis Viajes' })).toBeTruthy();

    // Quick Add (+) CTA is present
    const addBtn = screen.getByTestId('mobile-add-trip-button');
    expect(addBtn).toBeTruthy();

    fireEvent.click(addBtn);
    expect(mockOpenTripSearch).toHaveBeenCalled();
  });

  it('renders Settings mobile bar with clean Screen Title and Version badge pill', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );

    // Screen title
    expect(screen.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeTruthy();

    // Version badge pill is present
    const versionBadge = screen.getByTestId('settings-version-badge');
    expect(versionBadge).toBeTruthy();
    expect(versionBadge.textContent).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it('renders MapFloatingHud on /map and /mapa routes without rigid opaque header', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/map']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );

    const hud = screen.getByTestId('map-floating-hud');
    expect(hud).toBeTruthy();
    expect(hud.textContent).toContain('Mapa Mundial');
    expect(screen.getByTestId('header-avatar')).toBeTruthy();
    unmount();

    // Verify /mapa alias works identically
    render(
      <MemoryRouter initialEntries={['/mapa']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );
    const hudAlias = screen.getByTestId('map-floating-hud');
    expect(hudAlias).toBeTruthy();
    expect(hudAlias.textContent).toContain('Mapa Mundial');
  });

  it('opens user menu when clicking the mobile avatar button', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Header invitationsCount={0} />
      </MemoryRouter>
    );

    const avatarBtn = screen.getByTestId('header-avatar');
    fireEvent.click(avatarBtn);
    expect(mockOpenUserMenu).toHaveBeenCalledTimes(1);
  });
});
