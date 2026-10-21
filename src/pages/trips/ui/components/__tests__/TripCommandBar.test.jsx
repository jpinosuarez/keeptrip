/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TripCommandBar from '../TripCommandBar';

const mockPushToast = vi.fn();
const mockSetBusqueda = vi.fn();
const mockLimpiarBusqueda = vi.fn();
let mockQuery = '';

vi.mock('@app/providers', () => ({
  useToast: () => ({ pushToast: mockPushToast }),
  useUI: () => ({ searchPaletteOpen: false }),
  useSearch: () => ({
    busqueda: mockQuery,
    setBusqueda: mockSetBusqueda,
    limpiarBusqueda: mockLimpiarBusqueda,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'filters.all': 'Todos',
        'filters.year': 'Este año',
        'viewGrid': 'Vista cuadrícula',
        'viewList': 'Vista lista',
        'toast.comingSoon': 'Próximamente disponible',
        'searchJournal': 'Buscar en tus viajes',
        'clearSearch': 'Limpiar búsqueda',
      };
      return translations[key] || key;
    },
  }),
}));

describe('TripCommandBar Component', () => {
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = '';
  });

  afterEach(() => cleanup());

  it('renders filter buttons with >= 44x44px touch targets', () => {
    render(<TripCommandBar activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const allButton = screen.getByRole('button', { name: 'Todos' });
    const yearButton = screen.getByRole('button', { name: 'Este año' });

    expect(allButton.className).toContain('min-h-[44px]');
    expect(allButton.className).toContain('min-w-[44px]');
    expect(yearButton.className).toContain('min-h-[44px]');
    expect(yearButton.className).toContain('min-w-[44px]');

    fireEvent.click(yearButton);
    expect(mockOnFilterChange).toHaveBeenCalledWith('year');
  });

  it('renders mobile inline search input and wires to useSearch state', () => {
    render(<TripCommandBar activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText('Buscar en tus viajes');
    expect(searchInput).toBeTruthy();

    fireEvent.change(searchInput, { target: { value: 'Japón' } });
    expect(mockSetBusqueda).toHaveBeenCalledWith('Japón');
  });

  it('renders clear search button when query is present and triggers clearQuery', () => {
    mockQuery = 'Italia';
    render(<TripCommandBar activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const clearBtn = screen.getByRole('button', { name: 'Limpiar búsqueda' });
    expect(clearBtn).toBeTruthy();
    expect(clearBtn.className).toContain('min-h-[44px]');
    expect(clearBtn.className).toContain('min-w-[44px]');

    fireEvent.click(clearBtn);
    expect(mockLimpiarBusqueda).toHaveBeenCalled();
  });

  it('renders view toggle buttons with >= 44x44px touch targets and triggers toast on list toggle', () => {
    render(<TripCommandBar activeFilter="all" onFilterChange={mockOnFilterChange} />);

    const listBtn = screen.getByRole('button', { name: 'Vista lista' });
    expect(listBtn.className).toContain('min-h-[44px]');
    expect(listBtn.className).toContain('min-w-[44px]');

    fireEvent.click(listBtn);
    expect(mockPushToast).toHaveBeenCalledWith('Próximamente disponible', 'info');
  });
});
