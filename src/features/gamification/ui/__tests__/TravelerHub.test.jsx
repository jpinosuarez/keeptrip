/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Deterministic i18n — return the fallback string (or the key)
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key, fallback) =>
        typeof fallback === 'string' ? fallback : (fallback && fallback.defaultValue) || key,
      i18n: { language: 'es' },
    }),
  };
});

const { mockUpdateUserProfile, mockPushToast } = vi.hoisted(() => ({
  mockUpdateUserProfile: vi.fn(),
  mockPushToast: vi.fn(),
}));

vi.mock('@app/providers', () => ({
  useAuth: () => ({
    userProfile: {
      displayName: 'Mateo',
      photoURL: null,
      birthCountry: 'AR',
      residenceCountry: 'DE',
    },
    updateUserProfile: mockUpdateUserProfile,
    usuario: { displayName: 'Mateo', photoURL: null },
  }),
  useToast: () => ({ pushToast: mockPushToast }),
}));

vi.mock('@shared/config', () => ({
  ENABLE_GAMIFICATION: true,
  ENABLE_TRAVEL_STATS: true,
}));

vi.mock('../AchievementsGrid', () => ({ default: () => <div data-testid="achievements" /> }));
vi.mock('../components/TravelStatsDashboard', () => ({
  default: () => <div data-testid="travel-stats-dashboard" />,
}));
vi.mock('../components/CountryEmblemGrid', () => ({
  default: () => <div data-testid="emblem-grid" />,
}));

import TravelerHub from '../TravelerHub';

const baseProps = {
  paisesVisitados: [],
  bitacora: [],
  bitacoraData: {},
  todasLasParadas: [],
  achievementsWithProgress: [],
};

const renderHub = (props = {}) =>
  render(
    <MemoryRouter>
      <TravelerHub {...baseProps} {...props} />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('TravelerHub 3-tab showcase', () => {
  it('renders the three tabs and defaults to the stats view', () => {
    renderHub();
    expect(screen.getByTestId('traveler-hub-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('hub-tab-stats')).toBeInTheDocument();
    expect(screen.getByTestId('hub-tab-emblems')).toBeInTheDocument();
    expect(screen.getByTestId('hub-tab-badges')).toBeInTheDocument();
    expect(screen.getByTestId('travel-stats-dashboard')).toBeInTheDocument();
  });

  it('switches from stats to emblems and badges', () => {
    renderHub();
    fireEvent.click(screen.getByTestId('hub-tab-emblems'));
    expect(screen.getByTestId('emblem-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('travel-stats-dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('hub-tab-badges'));
    expect(screen.getByTestId('achievements')).toBeInTheDocument();
  });

  it('renders the TravelerProgress header and the conquest colour picker', () => {
    renderHub();
    expect(screen.getByTestId('traveler-progress-card')).toBeInTheDocument();
    expect(screen.getByTestId('conquest-color-picker')).toBeInTheDocument();
    expect(screen.getByTestId('conquest-swatch-atomic_tangerine')).toBeInTheDocument();
  });

  it('saves the conquest colour when the Level 3 perk is unlocked', () => {
    renderHub({ xpBreakdown: { totalXP: 4000, curationTotalXP: 0 } });
    fireEvent.click(screen.getByTestId('conquest-swatch-ruby_crimson'));
    expect(mockUpdateUserProfile).toHaveBeenCalledWith({ conquestColor: '#E11D48' });
  });

  it('locks the conquest swatches below Level 3', () => {
    renderHub();
    expect(screen.getByTestId('conquest-swatch-atomic_tangerine')).toBeDisabled();
  });
});
