/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TripListView from './ui/TripListView';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@pages/trips/ui/components/GhostEmptyState', () => ({
  default: () => <div data-testid="ghost-empty-state" />,
}));

vi.mock('@features/viajes/viewer/lib/buildTripStoryDeck', () => ({
  buildTripStoryDeck: () => [{ id: 'cover' }],
}));

vi.mock('@features/viajes/viewer/components/TripStoriesPlayerModal', () => ({
  default: ({ isOpen }) =>
    isOpen ? <div data-testid="trip-stories-player-stub" /> : null,
}));

const stub = {
  id: 't1',
  titulo: 'Ruta Europa',
  fechaInicio: '2024-06-01',
  fechaFin: '2024-06-07',
};

const tripData = {
  t1: {
    id: 't1',
    titulo: 'Ruta Europa',
    fechaInicio: '2024-06-01',
    fechaFin: '2024-06-07',
    // Intentionally reversed input order to prove chronological sorting.
    paradas: [
      { id: 'p2', nombre: 'Praga', paisCodigo: 'CZ', fechaLlegada: '2024-06-05' },
      { id: 'p1', nombre: 'Budapest', paisCodigo: 'HU', fechaLlegada: '2024-06-01' },
    ],
  },
};

const renderList = (overrides = {}) =>
  render(
    <TripListView
      trips={[stub]}
      tripData={tripData}
      crud={{}}
      userProfile={null}
      totalTripsCount={1}
      {...overrides}
    />
  );

describe('TripListView', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders the Year Header and chronological stop sequence (Budapest ➔ Praga)', () => {
    renderList();

    expect(screen.getByTestId('trips-list-view')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '2024' })).toBeTruthy();
    expect(screen.getByText('Budapest \u2794 Praga')).toBeTruthy();
  });

  it('always renders the Story Ring and the thumbnail tap opens Stories without navigating', () => {
    renderList();

    const thumbnail = screen.getByTestId('trip-list-row-stories-t1');
    expect(thumbnail.className).toContain('ring-[#FF6B35]');
    expect(thumbnail.className).toContain('hover:scale-105');

    expect(screen.queryByTestId('trip-stories-player-stub')).toBeNull();
    fireEvent.click(thumbnail);
    expect(screen.getByTestId('trip-stories-player-stub')).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to the viewer on row-body click and on Enter keydown', () => {
    renderList();

    const body = screen.getByTestId('trip-list-row-body-t1');
    fireEvent.click(body);
    expect(mockNavigate).toHaveBeenCalledWith('/trips/t1');

    mockNavigate.mockClear();
    fireEvent.keyDown(body, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/trips/t1');
  });

  it('renders the onboarding ghost when the archive has zero trips', () => {
    renderList({ trips: [], totalTripsCount: 0 });

    expect(screen.getByTestId('ghost-empty-state')).toBeTruthy();
    expect(screen.queryByTestId('trips-list-view')).toBeNull();
  });

  it('renders filtered no-results + clear button when filters return zero results', () => {
    const onClear = vi.fn();
    renderList({ trips: [], totalTripsCount: 3, onClearFilters: onClear });

    expect(screen.getByTestId('trips-list-no-results')).toBeTruthy();
    fireEvent.click(screen.getByTestId('trips-list-clear-filters'));
    expect(onClear).toHaveBeenCalled();
  });
});
