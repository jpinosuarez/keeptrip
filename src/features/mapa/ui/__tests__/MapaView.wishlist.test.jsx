/* @vitest-environment jsdom */
/**
 * Block 2.5 regression: wishlist map layer (dashed country outline + teal city
 * pins). Guards that:
 *   1. A dashed "wishlist-country-outline" <Layer> is rendered for wishlist countries.
 *   2. Wishlist city items produce an imperative teardrop marker (🔖) on the raw map.
 */

import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import MapaView from '../MapaView';

const addedMarkers = [];
const layerProps = [];

vi.mock('mapbox-gl', () => {
  class Marker {
    constructor(options = {}) {
      this.options = options;
      this.element = options.element;
    }
    setLngLat() {
      return this;
    }
    addTo() {
      addedMarkers.push(this);
      return this;
    }
    remove() {}
  }
  return { default: { Marker, accessToken: 'test-token' }, Marker };
});

const fakeMap = { flyTo: vi.fn(), resize: vi.fn() };

vi.mock('react-map-gl', () => ({
  default: function MockMap({ children, onLoad }) {
    useEffect(() => {
      onLoad?.({ target: fakeMap });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mock-map">{children}</div>;
  },
  Source: ({ children }) => <div>{children}</div>,
  Layer: (props) => {
    layerProps.push(props);
    return <div data-testid={`layer-${props.id}`} />;
  },
  Popup: () => null,
  NavigationControl: () => null,
  FullscreenControl: () => null,
}));

vi.mock('../components/SpinGlobe', () => ({
  createSpinGlobe: () => ({ start: vi.fn(), destroy: vi.fn(), setOccluded: vi.fn() }),
}));

vi.mock('@shared/lib/geo', async () => {
  const actual = await vi.importActual('@shared/lib/geo');
  return {
    ...actual,
    setMapLanguage: vi.fn(),
    isMapStyleLoaded: vi.fn(() => true),
  };
});

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }));

useAuthMock.mockReturnValue({
  userProfile: {
    birthCountry: 'ES',
    birthCity: null,
    baseCity: null,
    wishlist: [
      { id: 'w1', tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP', coordenadas: null, creadoEn: 'now' },
      { id: 'w2', tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP', coordenadas: [135.7, 35.0], creadoEn: 'now' },
    ],
  },
});

vi.mock('@app/providers/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('@app/providers', () => ({
  useAuth: useAuthMock,
  useUI: () => ({ openBuscador: vi.fn() }),
}));

vi.mock('@shared/lib/hooks/useOperationalFlags', () => ({
  useOperationalFlags: () => ({ flags: { level: 0 } }),
}));

vi.mock('@shared/lib/hooks/useDocumentTitle', () => ({ useDocumentTitle: vi.fn() }));

const renderMapaView = () =>
  render(
    <MemoryRouter>
      <MapaView paises={['ESP']} paradas={[]} trips={[]} tripData={{}} />
    </MemoryRouter>
  );

describe('MapaView wishlist layer', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    addedMarkers.length = 0;
    layerProps.length = 0;
    useAuthMock.mockClear();
  });

  it('renders the dashed wishlist country outline layer', async () => {
    renderMapaView();
    await waitFor(() => {
      expect(layerProps.some((p) => p.id === 'wishlist-country-outline')).toBe(true);
    });
    const outline = layerProps.find((p) => p.id === 'wishlist-country-outline');
    expect(outline.paint['line-dasharray']).toEqual([2, 2]);
    expect(outline.paint['line-color']).toBe('#45B0A8');
  });

  it('creates a teal teardrop pin marker for wishlist cities', async () => {
    renderMapaView();
    await waitFor(() => {
      const wishlistPin = addedMarkers.find(
        (m) => m.options?.element?.textContent?.includes('🔖')
      );
      expect(wishlistPin).toBeTruthy();
    });
  });
});
