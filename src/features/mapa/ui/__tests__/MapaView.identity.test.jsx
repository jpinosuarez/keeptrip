/* @vitest-environment jsdom */
/**
 * Regression coverage for the imperative identity pin layer.
 *
 * Guards the console error:
 *   "TypeError: map.setPaintProperty is not a function"
 * Root cause: react-map-gl's MapRef intentionally omits style mutators
 * (`setPaintProperty`, `addLayer`, ...) — imperative work MUST target the raw
 * Mapbox instance captured in `onLoad`, never `mapRef.current`.
 */

import React, { useEffect } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import MapaView from '../MapaView';

const addToArgs = [];
const removedMarkers = [];

vi.mock('mapbox-gl', () => {
  class Marker {
    constructor(options = {}) {
      this.options = options;
      this.element = options.element;
    }
    setLngLat() {
      return this;
    }
    addTo(map) {
      addToArgs.push(map);
      return this;
    }
    remove() {
      removedMarkers.push(this);
    }
  }
  return { default: { Marker, accessToken: 'test-token' }, Marker };
});

// Fake raw Mapbox instance handed over by the mocked <Map onLoad>
const fakeMap = {
  flyTo: vi.fn(),
  resize: vi.fn(),
};

vi.mock('react-map-gl', () => ({
  default: function MockMap({ children, onLoad }) {
    useEffect(() => {
      onLoad?.({ target: fakeMap });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div data-testid="mock-map">{children}</div>;
  },
  Source: ({ children }) => <div>{children}</div>,
  Layer: () => <div data-testid="mock-layer" />,
  Popup: () => null,
  NavigationControl: () => null,
  FullscreenControl: () => null,
}));

vi.mock('../components/SpinGlobe', () => ({
  createSpinGlobe: () => ({
    start: vi.fn(),
    destroy: vi.fn(),
    setOccluded: vi.fn(),
  }),
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

vi.mock('@app/providers/AuthContext', () => ({ useAuth: useAuthMock }));
vi.mock('@app/providers', () => ({
  useAuth: useAuthMock,
  useUI: () => ({ openBuscador: vi.fn() }),
}));

vi.mock('@shared/lib/hooks/useOperationalFlags', () => ({
  useOperationalFlags: () => ({ flags: { level: 0 } }),
}));

vi.mock('@shared/lib/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

const renderMapaView = () =>
  render(
    <MemoryRouter>
      <MapaView
        paises={['ESP']}
        paradas={[]}
        trips={[]}
        tripData={{}}
      />
    </MemoryRouter>
  );

describe('MapaView identity pins', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    addToArgs.length = 0;
    removedMarkers.length = 0;
    fakeMap.flyTo.mockClear();
  });

  it('attaches imperative pins to the raw Mapbox instance (not react-map-gl ref)', () => {
    useAuthMock.mockReturnValue({
      userProfile: {
        birthCity: { name: 'Rosario', coordinates: [-60.6393, -32.9468] },
        baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
      },
    });

    expect(() => renderMapaView()).not.toThrow();

    // Two distinct cities → origin pin + residence pin, both on the raw map
    expect(addToArgs.length).toBe(2);
    addToArgs.forEach((target) => expect(target).toBe(fakeMap));
    expect(fakeMap.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-3.7038, 40.4168] })
    );
  });

  it('renders a single unified pin when origin and residence are the same city', () => {
    useAuthMock.mockReturnValue({
      userProfile: {
        birthCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
        baseCity: { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
      },
    });

    renderMapaView();

    expect(addToArgs.length).toBe(1);
    expect(addToArgs[0]).toBe(fakeMap);
  });

  it('skips pins entirely when the traveler has no city identity', () => {
    useAuthMock.mockReturnValue({ userProfile: { birthCountry: 'AR' } });

    expect(() => renderMapaView()).not.toThrow();
    expect(addToArgs.length).toBe(0);
  });
});
