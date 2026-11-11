/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  useMotionValue: (v) => ({ get: () => v, set: () => {} }),
  useSpring: (v) => v,
  useTransform: () => ({ get: () => 0, set: () => {} }),
  AnimatePresence: ({ children }) => children,
}));

vi.mock('lucide-react', () => {
  const IconStub = () => null;
  return {
    Lock: IconStub,
    Bookmark: IconStub,
    Compass: IconStub,
    Heart: IconStub,
    Home: IconStub,
    Star: IconStub,
    Sparkles: IconStub,
    X: IconStub,
    RotateCw: IconStub,
    MapPin: IconStub,
    Calendar: IconStub,
    ArrowRight: IconStub,
    Plus: IconStub,
    ExternalLink: IconStub,
    Globe2: IconStub,
    Search: IconStub,
  };
});

const { mockedNavigate } = vi.hoisted(() => ({ mockedNavigate: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

vi.mock('canvas-confetti', () => ({ default: () => {} }));

import CountryEmblem3D from '../CountryEmblem3D';
import CountryEmblemCard from '../CountryEmblemCard';
import CountryEmblemModal from '../CountryEmblemModal';
import CountryEmblemGrid from '../CountryEmblemGrid';
import CelebrationQueue from '../CelebrationQueue';
import { getCountryEmblemSpec } from '../../../model/countryEmblemsCatalog';

const mockCatalogSpec = {
  iso2: 'AR',
  iso3: 'ARG',
  type: 'country',
  continent: 'South America',
  isMicrostate: false,
  viewBox: '0 0 256 256',
  svgPath: 'M100,50 L150,50 L150,150 L100,150 Z',
  palette: {
    colors: ['#74ACDF', '#FFFFFF', '#74ACDF'],
    proportions: [0.33, 0.34, 0.33],
    direction: 'horizontal',
    accent: '#F6B40E',
  },
};

const mockEmblemVisited = {
  countryCode: 'AR',
  iso2: 'AR',
  iso3: 'ARG',
  countryName: 'Argentina',
  status: 'visited',
  tier: 'explorador',
  stars: 1,
  tierName: 'Explorador',
  visitsCount: 1,
  cities: ['Buenos Aires'],
  firstVisitedAt: '2025-03-10',
  discoveryCode: '#01',
  identityBadge: { type: 'roots', label: 'Raíces' },
  trips: [{ id: 'trip-ar-1', titulo: 'Aventura Porteña', fechaInicio: '2025-03-10' }],
  catalogSpec: mockCatalogSpec,
};

const mockEmblemMultiTrip = {
  ...mockEmblemVisited,
  visitsCount: 2,
  cities: ['Buenos Aires', 'Bariloche'],
  trips: [
    { id: 'trip-ar-1', titulo: 'Aventura Porteña', fechaInicio: '2025-03-10' },
    { id: 'trip-ar-2', titulo: 'Ruta 40 Sur', fechaInicio: '2026-01-15' },
  ],
};

const mockEmblemWishlist = {
  countryCode: 'JP',
  iso2: 'JP',
  iso3: 'JPN',
  countryName: 'Japón',
  status: 'wishlist',
  tier: 'wishlist',
  stars: 0,
  tierName: 'En Wishlist',
  visitsCount: 0,
  cities: ['Tokio'],
  trips: [],
  identityBadge: null,
  catalogSpec: {
    ...mockCatalogSpec,
    iso2: 'JP',
    iso3: 'JPN',
    continent: 'Asia',
    palette: { colors: ['#FFFFFF', '#BC002D'], proportions: [0.72, 0.28], direction: 'radial' },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('CountryEmblem UI Component Suite (Phase B)', () => {
  it('renders sculpted metallic fill + flag medallion for visited, dashed wishlist, slate locked', () => {
    const { container: visited } = render(
      <CountryEmblem3D catalogSpec={mockCatalogSpec} countryCode="AR" status="visited" tier="explorador" />,
    );
    expect(visited.innerHTML).toContain('clipPath');
    expect(visited.innerHTML).toContain('metal-grad-explorador');
    expect(visited.querySelector('[data-testid="emblem-flag-medallion"]')).not.toBeNull();

    const { container: wishlist } = render(
      <CountryEmblem3D catalogSpec={mockEmblemWishlist.catalogSpec} countryCode="JP" status="wishlist" tier="wishlist" />,
    );
    expect(wishlist.innerHTML).toContain('stroke-dasharray="6 4"');
    expect(wishlist.innerHTML).toContain('#45B0A8');

    const { container: locked } = render(
      <CountryEmblem3D catalogSpec={mockCatalogSpec} countryCode="AR" status="locked" tier="locked" />,
    );
    expect(locked.innerHTML).toContain('#334155');
    expect(locked.querySelector('[data-testid="emblem-flag-medallion"]')).toBeNull();
  });

  it('renders real multi-vertex GIS microstate geometries (no synthetic Bézier)', () => {
    for (const code of ['MC', 'VA', 'SM', 'LI', 'AD']) {
      const spec = getCountryEmblemSpec(code);
      const lCount = (spec.svgPath.match(/L/g) || []).length;

      expect(spec.svgPath.startsWith('M')).toBe(true);
      expect(spec.svgPath.includes('C')).toBe(false);
      expect(lCount).toBeGreaterThanOrEqual(30);

      const { container, unmount } = render(
        <CountryEmblem3D countryCode={code} status="locked" tier="locked" />,
      );
      const rendered = Array.from(container.querySelectorAll('path')).some(
        (path) => path.getAttribute('d') === spec.svgPath,
      );
      expect(rendered).toBe(true);
      unmount();
    }
  });

  it('renders CountryEmblemCard thumbnail and card variants with discovery code and identity badge', () => {
    const { unmount } = render(<CountryEmblemCard emblem={mockEmblemVisited} variant="thumbnail" />);
    expect(screen.getByTestId('emblem-card-thumbnail-AR')).toBeDefined();
    unmount();

    render(<CountryEmblemCard emblem={mockEmblemVisited} variant="card" />);
    expect(screen.getByTestId('emblem-card-AR')).toBeDefined();
    expect(screen.getByTestId('identity-badge-roots')).toBeDefined();
    expect(screen.getByText(/#01/)).toBeDefined();
  });

  it('resolves CountryEmblemModal flip and Case A (single trip) / Case B (multi-trip) navigation', () => {
    const { rerender } = render(<CountryEmblemModal emblem={mockEmblemVisited} isOpen onClose={vi.fn()} />);

    // Portal + rigid width: never collapses to a narrow min-content column.
    expect(screen.getByTestId('country-emblem-modal').parentElement).toBe(document.body);
    const modalCard = screen.getByTestId('country-emblem-modal-card');
    expect(modalCard.style.maxWidth).toBe('520px');
    expect(modalCard.className).toContain('shrink-0');

    fireEvent.click(screen.getByTestId('emblem-flip-button'));
    expect(screen.getByTestId('emblem-backplate')).toBeDefined();

    const singleTripWrapper = screen.getByTestId('emblem-modal-single-trip');
    fireEvent.click(singleTripWrapper.querySelector('button'));
    expect(mockedNavigate).toHaveBeenCalledWith('/trips/trip-ar-1');

    rerender(<CountryEmblemModal emblem={mockEmblemMultiTrip} isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByTestId('emblem-filter-all-trips-btn'));
    expect(mockedNavigate).toHaveBeenCalledWith('/trips?country=AR');
  });

  it('switches tabs in CountryEmblemGrid and opens the detail modal on card selection', () => {
    render(
      <CountryEmblemGrid
        emblems={[mockEmblemVisited, mockEmblemWishlist]}
        allEmblemsWithLocked={[mockEmblemVisited, mockEmblemWishlist]}
      />,
    );

    expect(screen.getByTestId('emblem-card-AR')).toBeDefined();

    fireEvent.click(screen.getByTestId('emblem-filter-wishlist'));
    expect(screen.getByTestId('emblem-card-JP')).toBeDefined();

    fireEvent.click(screen.getByTestId('emblem-card-JP'));
    expect(screen.getByTestId('country-emblem-modal')).toBeDefined();
  });
});

describe('CelebrationQueue country discovery', () => {
  it('renders the 3D country emblem + XP badge for a country discovery event', () => {
    render(
      <CelebrationQueue
        celebrations={[
          { type: 'country', data: { countryCode: 'AR', discoveryCode: '#01' } },
        ]}
        onDismiss={vi.fn()}
        onDismissAll={vi.fn()}
      />,
    );
    expect(screen.getByTestId('celebration-country-emblem')).toBeDefined();
    expect(screen.getByTestId('celebration-country-xp')).toBeDefined();
    expect(screen.getByTestId('country-emblem-3d-AR')).toBeDefined();
  });
});
