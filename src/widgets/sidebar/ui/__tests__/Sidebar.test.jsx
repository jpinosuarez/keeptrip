/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

const mockToggleSidebarCollapse = vi.fn();
const mockOpenTripSearch = vi.fn();
const mockLogout = vi.fn();

let mockSidebarCollapsed = false;

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({
    logout: mockLogout,
    usuario: { uid: 'u1', displayName: 'Test User' },
  }),
}));

vi.mock('@app/providers/UIContext', () => ({
  useUI: () => ({
    sidebarCollapsed: mockSidebarCollapsed,
    toggleSidebarCollapse: mockToggleSidebarCollapse,
    openBuscador: mockOpenTripSearch,
    isReadOnlyMode: false,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        home: 'Home',
        map: 'Map',
        journal: 'Logbook',
        hub: 'Hub',
        adjust: 'Settings',
        exit: 'Exit',
        addTrip: 'Add Trip',
        navLabel: 'Main navigation',
        collapseSidebar: 'Collapse sidebar',
        expandSidebar: 'Expand sidebar',
      };
      return translations[key] || key;
    },
  }),
}));

describe('Sidebar Component', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarCollapsed = false;
  });

  it('renders expanded mode by default with BrandLogo and text labels', () => {
    mockSidebarCollapsed = false;
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByTestId('sidebar-collapse-toggle');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-label', 'Collapse sidebar');

    // Brand logo should be visible inside rigid h-16 header
    const brandImg = screen.getByRole('img', { name: 'Keeptrip' });
    expect(brandImg).toBeInTheDocument();
    const headerSlot = brandImg.closest('.h-16');
    expect(headerSlot).toBeInTheDocument();
    expect(headerSlot).toHaveClass('shrink-0', 'relative', 'overflow-hidden');

    // Nav labels should be present in desktop sidebar
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveTextContent('Home');
    expect(aside).toHaveTextContent('Map');
    expect(aside).toHaveTextContent('Logbook');

    // Stationary icon slot inside nav button
    const homeNav = screen.getByTestId('sidebar-nav-home');
    const iconSlot = homeNav.querySelector('.w-12.h-12.shrink-0');
    expect(iconSlot).toBeInTheDocument();

    // Toggle button click triggers collapse
    fireEvent.click(toggleBtn);
    expect(mockToggleSidebarCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders collapsed mode with BrandIsotype and preserves accessible nav targets', () => {
    mockSidebarCollapsed = true;
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByTestId('sidebar-collapse-toggle');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveAttribute('aria-label', 'Expand sidebar');

    // Standalone isotype should be rendered
    expect(screen.getByRole('img', { name: 'Keeptrip' })).toBeInTheDocument();

    // Nav buttons must maintain stable accessible names and test IDs
    const homeNav = screen.getByTestId('sidebar-nav-home');
    expect(homeNav).toBeInTheDocument();
    expect(homeNav).toHaveAttribute('aria-label', 'Home');

    const mapNav = screen.getByTestId('sidebar-nav-mapa');
    expect(mapNav).toBeInTheDocument();
    expect(mapNav).toHaveAttribute('aria-label', 'Map');
  });

  it('provides accessible logout button', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByTestId('sidebar-logout-button');
    expect(logoutBtn).toBeInTheDocument();
    expect(logoutBtn).toHaveAttribute('aria-label', 'Exit');

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
