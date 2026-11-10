/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BentoTripGrid from '../BentoTripGrid';
import { getGridSpan } from '../bentoGridUtils';
import WelcomeBento from '../WelcomeBento';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        loadTripsError: 'No se pudieron cargar los viajes',
        'welcome.emptyStateTitle': 'Tu bitácora está esperando',
        'welcome.recentPlaceholder': 'Comienza a explorar',
      };
      return translations[key] || key;
    },
    i18n: { language: 'es' },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

// Mock TripCard to avoid subcomponent dependencies in layout testing
vi.mock('@widgets/tripGrid/ui/TripCard', () => ({
  default: ({ trip, variant, priorityImage, onEdit, onDelete }) => (
    <div data-testid={`trip-card-${trip.id}`} data-variant={variant} data-priority={priorityImage}>
      <span>{trip.titulo || trip.nombreEspanol || 'Trip'}</span>
      <button onClick={() => onEdit?.(trip.id)}>Edit</button>
      {onDelete && <button onClick={() => onDelete?.(trip.id)}>Delete</button>}
    </div>
  ),
}));

const { mockWelcomeProfile } = vi.hoisted(() => ({ mockWelcomeProfile: { current: null } }));

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({ userProfile: mockWelcomeProfile.current }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

describe('BentoTripGrid', () => {
  afterEach(() => {
    cleanup();
  });

  describe('getGridSpan logic', () => {
    it('returns 2x2 hero card span for single trip', () => {
      expect(getGridSpan(1, 0)).toEqual({ colSpan: 2, rowSpan: 2 });
    });

    it('returns full-width row span for 2 trips', () => {
      expect(getGridSpan(2, 0)).toEqual({ colSpan: 2, rowSpan: 1 });
      expect(getGridSpan(2, 1)).toEqual({ colSpan: 2, rowSpan: 1 });
    });

    it('returns hero span for first of 3 trips and half-width for remaining', () => {
      expect(getGridSpan(3, 0)).toEqual({ colSpan: 2, rowSpan: 1 });
      expect(getGridSpan(3, 1)).toEqual({ colSpan: 1, rowSpan: 1 });
      expect(getGridSpan(3, 2)).toEqual({ colSpan: 1, rowSpan: 1 });
    });

    it('returns 1x1 equal grid spans for 4 trips', () => {
      for (let i = 0; i < 4; i++) {
        expect(getGridSpan(4, i)).toEqual({ colSpan: 1, rowSpan: 1 });
      }
    });
  });

  describe('Lifecycle states', () => {
    it('renders skeleton loading state when loading is true', () => {
      render(<BentoTripGrid loading={true} />);
      expect(screen.getByTestId('bento-loading-state')).toBeInTheDocument();
    });

    it('renders error state when isError is true', () => {
      render(
        <BentoTripGrid
          isError={true}
          fetchError={{ message: 'Network disconnected' }}
        />
      );
      expect(screen.getByTestId('bento-error-state')).toBeInTheDocument();
      expect(screen.getByText('No se pudieron cargar los viajes')).toBeInTheDocument();
      expect(screen.getByText('Network disconnected')).toBeInTheDocument();
    });

    it('renders empty state when isNewTraveler is true', () => {
      render(<BentoTripGrid isNewTraveler={true} trips={[]} />);
      expect(screen.getByTestId('bento-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Tu bitácora está esperando')).toBeInTheDocument();
    });

    it('renders empty state when trips array is empty', () => {
      render(<BentoTripGrid trips={[]} />);
      expect(screen.getByTestId('bento-empty-state')).toBeInTheDocument();
    });

    it('renders trip cards for provided trips', () => {
      const mockTrips = [
        { id: 'trip-1', titulo: 'Japón 2026' },
        { id: 'trip-2', titulo: 'Noruega Fjord' },
      ];

      render(
        <BentoTripGrid
          trips={mockTrips}
          tripData={{
            'trip-1': { id: 'trip-1', titulo: 'Japón 2026' },
            'trip-2': { id: 'trip-2', titulo: 'Noruega Fjord' },
          }}
          priorityImageId="trip-1"
        />
      );

      expect(screen.getByTestId('bento-trip-grid')).toBeInTheDocument();
      expect(screen.getByTestId('trip-card-trip-1')).toBeInTheDocument();
      expect(screen.getByTestId('trip-card-trip-2')).toBeInTheDocument();
      expect(screen.getByText('Japón 2026')).toBeInTheDocument();
      expect(screen.getByText('Noruega Fjord')).toBeInTheDocument();
    });
  });
});

describe('WelcomeBento canonical identity badges', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the canonical Roots pill (#2C3E50) for a birth-only profile', () => {
    mockWelcomeProfile.current = {
      birthCountry: 'AR',
      residenceCountry: 'DE',
      birthCity: { name: 'Córdoba' },
    };
    render(<WelcomeBento name="Mateo" />);
    const pill = screen.getByTestId('welcome-identity-roots');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveStyle({ backgroundColor: '#2C3E50' });
  });

  it('renders the canonical Base pill (#45B0A8) for a residence-only profile', () => {
    mockWelcomeProfile.current = { residenceCountry: 'DE', baseCity: { name: 'Berlín' } };
    render(<WelcomeBento name="Mateo" />);
    const pill = screen.getByTestId('welcome-identity-base');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveStyle({ backgroundColor: '#45B0A8' });
  });

  it('renders the combined Roots & Base pill (#45B0A8 bg + #2C3E50 border)', () => {
    mockWelcomeProfile.current = {
      birthCountry: 'AR',
      residenceCountry: 'AR',
      baseCity: { name: 'Córdoba' },
    };
    render(<WelcomeBento name="Mateo" />);
    const pill = screen.getByTestId('welcome-identity-roots-and-base');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveStyle({ backgroundColor: '#45B0A8', borderColor: '#2C3E50' });
  });
});
