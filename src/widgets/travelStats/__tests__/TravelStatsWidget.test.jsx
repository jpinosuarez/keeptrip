/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import TravelStatsWidget from '../ui/TravelStatsWidget';

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => {
        const translations = {
          'stats.completedTrips': 'Trips',
          'stats.totalDays': 'Total days',
          'stats.totalDaysHint': 'Days across all trips',
          'stats.totalStops': 'Stops',
          'stats.totalStopsHint': 'Stops recorded',
          'stats.totalKm': 'Kilometers',
          'stats.viewMoreStats': 'View more statistics',
          'stats.worldExploredPercentage': 'World explored',
          'stats.worldExploredPercentageHint': 'Of global 195 countries',
          'stats.uniqueCountries': 'Countries',
          'stats.uniqueCountriesHint': 'Unique countries visited',
          'stats.emptyStateHint': 'Your next journey awaits',
          'stats.emptyStateMessage': 'Start your first adventure to see your travel story unfold',
        };
        return translations[key] || key;
      },
    }),
  };
});

const mockLogStats = {
  completedTrips: 5,
  totalDays: 42,
  totalStops: 8,
  totalKm: 1240,
  worldExploredPercentage: '4',
  uniqueCountries: 3,
};

const renderWidget = (stats) =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<TravelStatsWidget logStats={stats} ariaLabel="test" />} />
        <Route path="/hub" element={<div>HUB ROUTE</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('TravelStatsWidget', () => {
  afterEach(() => cleanup());

  it('renders the storytelling metrics including total kilometres', () => {
    renderWidget(mockLogStats);
    expect(screen.getByRole('region', { name: 'test' })).toBeInTheDocument();
    expect(screen.getByText(/World explored/i)).toBeInTheDocument();
    expect(screen.getByText(/Trips/i)).toBeInTheDocument();
    expect(screen.getByText(/Stops/i)).toBeInTheDocument();
    expect(screen.getByText('Kilometers')).toBeInTheDocument();
    expect(screen.getByText(/1[.,]?240 km/)).toBeInTheDocument();
  });

  it('renders the empty state when there are no completed trips', () => {
    renderWidget({ ...mockLogStats, completedTrips: 0 });
    expect(screen.getByText('Your next journey awaits')).toBeInTheDocument();
  });

  it('navigates to /hub when the trailing statistics pill is clicked', async () => {
    renderWidget(mockLogStats);
    const action = screen.getByRole('button', { name: /View more statistics/i });
    await action.click();
    expect(screen.getByText('HUB ROUTE')).toBeInTheDocument();
  });
});
