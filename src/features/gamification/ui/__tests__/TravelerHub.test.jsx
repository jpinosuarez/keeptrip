/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// deterministic i18n — return the provided fallback string (or the key)
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
      i18n: { language: 'es' },
    }),
  };
});

// mock toast so that useToast is available inside TravelerHub
const mockPushToast = vi.fn();
vi.mock('@app/providers/ToastContext', () => ({ useToast: () => ({ pushToast: mockPushToast }) }));

// stub heavy subcomponents to keep this a pure unit test
vi.mock('../AchievementsGrid', () => ({ default: () => <div data-testid="achievements" /> }));
vi.mock('../components/TravelStatsDashboard', () => ({
  default: () => <div data-testid="travel-stats-dashboard" />,
}));

import TravelerHub from '../TravelerHub';

describe('TravelerHub', () => {
  const defaultProps = {
    paisesVisitados: [],
    bitacora: [],
    bitacoraData: {},
    achievementsWithProgress: [],
  };

  it('renders the deep travel statistics header and dashboard', () => {
    render(<TravelerHub {...defaultProps} />);
    expect(screen.getByText(/Estadísticas de Viaje/i)).toBeInTheDocument();
    expect(screen.getByTestId('travel-stats-dashboard')).toBeInTheDocument();
  });

  it('keeps the gamification sections gated behind ENABLE_GAMIFICATION', () => {
    render(<TravelerHub {...defaultProps} />);
    expect(screen.queryByTestId('achievements')).not.toBeInTheDocument();
  });
});
