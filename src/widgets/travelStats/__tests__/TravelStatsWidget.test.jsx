/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import TravelStatsWidget from '../ui/TravelStatsWidget';

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key) => {
        const translations = {
          'stats.completedTrips': 'Trips completed',
          'stats.totalDays': 'Total days',
          'stats.totalDaysHint': 'Days across all trips',
          'stats.totalStops': 'Registered stops',
          'stats.totalStopsHint': 'Stops across all trips',
          'stats.uniqueCountries': 'Countries',
          'stats.uniqueCountriesHint': 'Unique countries visited',
          'stats.worldExploredPercentage': '% of World',
          'stats.percentHint': 'Of global 195 countries',
          'stats.emptyStateHint': 'No trips yet',
          'stats.emptyStateMessage': 'Create your first trip',
        };
        return translations[key] || key;
      }
    })
  };
});

describe('TravelStatsWidget', () => {
  afterEach(() => cleanup());

  const mockLogStats = {
    completedTrips: 5,
    totalDays: 42,
    totalStops: 8,
    uniqueCountries: 4,
    worldExploredPercentage: '4.0',
  };

  it('renders all stats in home variant with biography layout', () => {
    render(<TravelStatsWidget logStats={mockLogStats} ariaLabel="test" variant="hero" />);
    expect(screen.getByRole('region', { name: 'test' })).toBeInTheDocument();
    expect(screen.getByText(/% of World/i)).toBeInTheDocument();
    expect(screen.getByText(/Countries/i)).toBeInTheDocument();
    expect(screen.getByText(/Trips completed/i)).toBeInTheDocument();
  });

  it('renders compact layout in trips variant', () => {
    render(<TravelStatsWidget logStats={mockLogStats} ariaLabel="test" variant="compact" />);
    expect(screen.getByRole('region', { name: 'test' })).toBeInTheDocument();
    expect(screen.getByText(/% of World/i)).toBeInTheDocument();
  });
});