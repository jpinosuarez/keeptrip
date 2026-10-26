/** @vitest-environment jsdom */
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockNavigate, mockOpenBuscador, mockClearSearch } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockOpenBuscador: vi.fn(),
  mockClearSearch: vi.fn(),
}));

let mockSearchState = {
  busqueda: '',
  limpiarBusqueda: mockClearSearch,
};

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/', search: '' }),
    Outlet: () => null,
  };
});

vi.mock('@app/providers/UIContext', () => ({
  useSearch: () => mockSearchState,
  useUI: () => ({ openBuscador: mockOpenBuscador }),
}));

vi.mock('lucide-react', () => {
  const createIcon = () => function IconStub() {
    return null;
  };

  return {
    Trash2: createIcon(),
    Edit3: createIcon(),
    Calendar: createIcon(),
    MapPin: createIcon(),
    LoaderCircle: createIcon(),
    Globe: createIcon(),
    Telescope: createIcon(),
    ArrowRight: createIcon(),
    Plus: createIcon(),
    Search: createIcon(),
  };
});

vi.mock('@widgets/travelStats/ui/TravelStatsWidget', () => ({
  default: ({ stats, ariaLabel }) => (
    <div data-testid="travel-stats" role="region" aria-label={ariaLabel}>
      {stats?.map((stat, idx) => (
        <div key={idx} data-testid={`stat-${stat.label}`}>
          <span>{stat.value}</span>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useMotionValue: (v) => ({ get: () => v, set: () => {} }),
  useTransform: () => ({ get: () => 0, set: () => {} }),
  animate: () => {},
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@pages/trips/ui/components/GhostEmptyState', () => {
  // Access mockOpenBuscador from the outer scope via the mocked UIContext
  return {
    default: () => {
      // Use a simple render of what GhostEmptyState provides
      // The mockOpenBuscador is already defined in the mocked UIContext above
      return (
        <div data-testid="ghost-empty-state">
          <h2>¡Tu viaje espera aventuras!</h2>
          <p>Las mejores historias aún está por escribirse.</p>
          <button onClick={() => mockOpenBuscador()}>Registrar aventura</button>
        </div>
      );
    },
  };
});

vi.mock('./ui/TripCard', () => ({
  default: ({ trip, onEdit, onDelete }) => (
    <div data-testid={`trip-card-${trip.id}`}>
      <h3>{trip.titulo || trip.nombreEspanol || trip.nameSpanish}</h3>
      <button onClick={() => onEdit?.(trip.id)}>Edit</button>
      {onDelete && <button onClick={() => onDelete?.(trip.id)}>Delete</button>}
    </div>
  ),
}));

vi.mock('@shared/ui/components/Skeletons', () => ({
  TripCardSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

import TripGrid from './TripGrid';

afterEach(() => cleanup());

describe('TripGrid', () => {
  const trips = [
    { id: 'trip-1', nameSpanish: 'Spain', date: '2026-02-12' },
    { id: 'trip-2', nameSpanish: 'Italy', date: '2026-03-02' },
  ];

  const tripData = {
    'trip-1': {
      titulo: 'Madrid Escape',
      startDate: '2026-02-10',
      endDate: '2026-02-12',
      ciudades: 'Madrid, Toledo',
      rating: 4,
    },
    'trip-2': {
      titulo: 'Rome Weekend',
      startDate: '2026-03-01',
      endDate: '2026-03-02',
      ciudades: 'Rome',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders GhostEmptyState when totalLogCount is 0', () => {
    render(<TripGrid trips={[]} totalLogCount={0} />);
    expect(screen.getByTestId('ghost-empty-state')).toBeInTheDocument();
  });

  it('renders trip cards for provided trips', () => {
    render(
      <TripGrid
        trips={trips}
        tripData={tripData}
        totalLogCount={2}
        handleDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('trips-grid')).toBeInTheDocument();
    expect(screen.getByTestId('trip-card-trip-1')).toBeInTheDocument();
    expect(screen.getByTestId('trip-card-trip-2')).toBeInTheDocument();
    expect(screen.getByText('Madrid Escape')).toBeInTheDocument();
    expect(screen.getByText('Rome Weekend')).toBeInTheDocument();
  });

  it('renders no results message when search returns 0 trips but user has logs', () => {
    render(
      <TripGrid
        trips={[]}
        tripData={{}}
        totalLogCount={5}
        handleDelete={vi.fn()}
      />
    );

    expect(screen.getByText('noResults')).toBeInTheDocument();
    expect(screen.getByText('noResultsMessage')).toBeInTheDocument();
  });

  it('triggers edit navigation when edit button is clicked on a trip card', async () => {
    render(
      <TripGrid
        trips={trips}
        tripData={tripData}
        totalLogCount={2}
        handleDelete={vi.fn()}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await userEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith({ pathname: '/', search: 'editing=trip-1' });
  });

  it('triggers handleDelete when delete button is clicked on a trip card', async () => {
    const mockDelete = vi.fn();
    render(
      <TripGrid
        trips={trips}
        tripData={tripData}
        totalLogCount={2}
        handleDelete={mockDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith('trip-1');
  });
});