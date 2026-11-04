/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TravelStatsWidget from './ui/TravelStatsWidget';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => {
        const translations = {
          'stats.worldExploredPercentage': 'World explored',
          'stats.worldExploredPercentageHint': 'Percentage of the world covered',
          'stats.uniqueCountries': 'Countries',
          'stats.uniqueCountriesHint': 'Unique countries visited',
          'stats.completedTrips': 'Trips',
          'stats.completedTripsHint': 'Trips completed',
          'stats.totalDays': 'Days',
          'stats.totalDaysHint': 'Days across all trips',
          'stats.totalStops': 'Stops',
          'stats.totalStopsHint': 'Stops recorded',
          'stats.totalKm': 'Kilometers',
          'stats.viewMoreStats': 'View more statistics',
          'stats.emptyStateHint': 'Your next journey awaits',
          'stats.emptyStateMessage': 'Start your first adventure to see your travel story unfold',
        };
        return translations[key] || key;
      },
    }),
  };
});

describe('TravelStatsWidget', () => {
  afterEach(() => cleanup());

  const mockLogStats = {
    worldExploredPercentage: '2.1',
    uniqueCountries: 4,
    completedTrips: 3,
    totalDays: 9,
    totalStops: 12,
    totalKm: 980,
  };

  const renderWidget = (stats) =>
    render(
      <MemoryRouter>
        <TravelStatsWidget logStats={stats} ariaLabel="test" />
      </MemoryRouter>
    );

  it('renders the five storytelling metrics in bento layout', () => {
    renderWidget(mockLogStats);

    expect(screen.getByRole('region', { name: 'test' })).toBeInTheDocument();
    expect(screen.getByText('World explored')).toBeInTheDocument();
    expect(screen.getByText('Countries')).toBeInTheDocument();
    expect(screen.getByText('Trips')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Stops')).toBeInTheDocument();
    expect(screen.getByText('Kilometers')).toBeInTheDocument();

    const kmValue = screen.getByText(/980 km/);
    expect(kmValue).toHaveClass('font-mono', 'text-slate-900');
  });

  it('renders empty state when there are no completed trips', () => {
    renderWidget({ ...mockLogStats, completedTrips: 0 });

    expect(screen.getByText('Your next journey awaits')).toBeInTheDocument();
  });
});
