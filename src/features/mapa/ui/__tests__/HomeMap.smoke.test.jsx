/* @vitest-environment jsdom */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import HomeMap from '../HomeMap';
import MapaView from '../MapaView';

vi.mock('react-map-gl', () => ({
  default: vi.fn(({ children }) => <div data-testid="mock-map">{children}</div>),
  Source: vi.fn(({ children }) => <div data-testid="mock-source">{children}</div>),
  Layer: vi.fn(() => <div data-testid="mock-layer" />),
  Popup: vi.fn(({ children }) => <div data-testid="mock-popup">{children}</div>),
  NavigationControl: vi.fn(() => <div data-testid="mock-nav-control" />),
  FullscreenControl: vi.fn(() => <div data-testid="mock-fullscreen-control" />),
}));

vi.mock('@shared/lib/hooks/useOperationalFlags', () => ({
  useOperationalFlags: () => ({
    flags: { level: 0 },
  }),
}));

vi.mock('@shared/lib/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@shared/lib/geo', () => ({
  setMapLanguage: vi.fn(),
  isMapStyleLoaded: vi.fn(() => true),
}));

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({
    usuario: { uid: 'test-user', displayName: 'Test' },
  }),
}));

vi.mock('@app/providers', () => ({
  useAuth: () => ({
    usuario: { uid: 'test-user', displayName: 'Test' },
  }),
  useUI: () => ({
    openBuscador: vi.fn(),
  }),
}));

describe('HomeMap and MapaView smoke tests', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it('renders HomeMap without throwing ReferenceError', () => {
    expect(() => {
      render(<HomeMap paisesVisitados={['ESP', 'FRA']} isMobile={false} />);
    }).not.toThrow();
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('renders HomeMap with empty countries array without crashing', () => {
    expect(() => {
      render(<HomeMap paisesVisitados={[]} isMobile={true} />);
    }).not.toThrow();
  });

  it('renders MapaView without throwing ReferenceError', () => {
    expect(() => {
      render(
        <MapaView
          paises={['ESP']}
          paradas={[{ id: '1', nombre: 'Madrid', coordenadas: [-3.7, 40.4] }]}
          trips={[]}
          tripData={{}}
        />
      );
    }).not.toThrow();
  });
});
