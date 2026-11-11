/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, within } from '@testing-library/react';
import TripCommandBar from '../TripCommandBar';

const mockSetBusqueda = vi.fn();
const mockLimpiarBusqueda = vi.fn();
let mockQuery = '';

vi.mock('@app/providers', () => ({
  useSearch: () => ({
    busqueda: mockQuery,
    setBusqueda: mockSetBusqueda,
    limpiarBusqueda: mockLimpiarBusqueda,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        searchTripsPlaceholder: 'Filtrar viajes por título, ciudad o país...',
        viewModeGrid: 'Cuadrícula',
        viewModeList: 'Lista',
        yearPrefix: 'Año',
        countryPrefix: 'País',
        scopePrefix: 'Tipo',
        durationPrefix: 'Duración',
        curationPrefix: 'Estado',
        sortPrefix: 'Ordenar',
        sortBy: 'Ordenar por',
        filterAllYearsShort: 'Todos',
        filterAllCountriesShort: 'Todos',
        filterThisYear: 'Este año',
        filterAllScopes: 'Todos',
        filterLocal: 'Aventuras Locales',
        filterInternational: 'Internacionales',
        filterAllDurations: 'Todas',
        filterDurationShort: 'Escapadas (<4d)',
        filterDurationMedium: 'Viajes Medios (5-14d)',
        filterDurationLong: 'Grandes Expediciones (15+d)',
        filterAllCuration: 'Todos',
        filterCompleted: 'Completos',
        filterIncomplete: 'Por enriquecer',
        sortRecent: 'Más recientes',
        sortOldest: 'Más antiguos',
        sortDuration: 'Mayor duración',
        sortStops: 'Más paradas',
        clearFilters: 'Limpiar filtros',
        clearSearch: 'Limpiar búsqueda',
        filtersButton: 'Filtros',
        applyFilters: 'Aplicar',
      };
      if (translations[key] !== undefined) return translations[key];
      if (typeof options === 'string') return options;
      if (options && typeof options.defaultValue === 'string') {
        return options.defaultValue.replace(/\{\{(\w+)\}\}/g, (_, token) =>
          String(options[token] ?? '')
        );
      }
      return key;
    },
  }),
}));

vi.mock('@shared/ui/components/BottomSheet/BottomSheet', () => ({
  default: ({ isOpen, children }) =>
    isOpen ? <div data-testid="bottom-sheet">{children}</div> : null,
}));

const baseFilters = {
  viewMode: 'grid',
  year: 'all',
  country: 'all',
  scope: 'all',
  duration: 'all',
  curation: 'all',
  sort: 'recent',
};

const openDropdown = (testId, label) => {
  const container = screen.getByTestId(testId);
  fireEvent.click(within(container).getByRole('button', { name: label }));
  return container;
};

describe('TripCommandBar Component', () => {
  const mockOnChange = vi.fn();
  const mockOnClear = vi.fn();

  const renderBar = (overrides = {}) =>
    render(
      <TripCommandBar
        filters={baseFilters}
        onChange={mockOnChange}
        onClearFilters={mockOnClear}
        yearOptions={[2026, 2025]}
        countryOptions={[{ code: 'JP', name: 'Japón', count: 2 }]}
        {...overrides}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = '';
    window.localStorage.clear();
  });

  afterEach(() => cleanup());

  it('debounces the unified live-filter search input', async () => {
    renderBar();
    const input = screen.getByPlaceholderText('Filtrar viajes por título, ciudad o país...');
    fireEvent.change(input, { target: { value: 'Japón' } });
    await waitFor(() => expect(mockSetBusqueda).toHaveBeenCalledWith('Japón'), { timeout: 1000 });
  });

  it('switches view mode, persists the preference and fires onChange', () => {
    renderBar();
    const listButton = screen.getByRole('button', { name: 'Lista' });
    expect(listButton.className).toContain('min-h-[44px]');
    expect(listButton.className).toContain('min-w-[44px]');
    fireEvent.click(listButton);
    expect(mockOnChange).toHaveBeenCalledWith({ viewMode: 'list' });
    expect(window.localStorage.getItem('keeptrip_trips_view_mode')).toBe('list');
  });

  it('Año dropdown updates the year filter', () => {
    renderBar();
    openDropdown('filter-year', 'Año');
    fireEvent.click(screen.getByText('2025'));
    expect(mockOnChange).toHaveBeenCalledWith({ year: '2025' });
  });

  it('País dropdown renders flag + count and updates the country filter', () => {
    renderBar();
    openDropdown('filter-country', 'País');
    expect(screen.getByText('Japón')).toBeTruthy();
    expect(screen.getByText('(2)')).toBeTruthy();
    fireEvent.click(screen.getByText('Japón'));
    expect(mockOnChange).toHaveBeenCalledWith({ country: 'JP' });
  });

  it('Alcance dropdown updates the scope filter', () => {
    renderBar();
    openDropdown('filter-scope', 'Alcance geográfico');
    fireEvent.click(screen.getByText('Aventuras Locales'));
    expect(mockOnChange).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('Duración dropdown updates the duration filter', () => {
    renderBar();
    openDropdown('filter-duration', 'Duración');
    fireEvent.click(screen.getByText('Escapadas (<4d)'));
    expect(mockOnChange).toHaveBeenCalledWith({ duration: 'short' });
  });

  it('Estado dropdown updates the curation filter', () => {
    renderBar();
    openDropdown('filter-curation', 'Estado de curación');
    fireEvent.click(screen.getByText('Completos'));
    expect(mockOnChange).toHaveBeenCalledWith({ curation: 'complete' });
  });

  it('sort dropdown updates the sort order', () => {
    renderBar();
    openDropdown('sort-dropdown', 'Ordenar');
    fireEvent.click(screen.getByText('Más antiguos'));
    expect(mockOnChange).toHaveBeenCalledWith({ sort: 'oldest' });
  });

  it('shows results indicator + clear button when filters are active', () => {
    renderBar({ filters: { ...baseFilters, scope: 'local' }, resultCount: 3, totalCount: 10 });
    expect(screen.getByText(/Mostrando 3 de 10 viajes/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(mockOnChange).toHaveBeenCalledWith({ sort: 'recent' });
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('opens the mobile filters BottomSheet with a sort section', () => {
    renderBar();
    fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
    expect(screen.getByTestId('bottom-sheet')).toBeTruthy();
    expect(screen.getByText('Ordenar por')).toBeTruthy();
  });

  it('renders a removable active country chip for a deep-linked country filter', () => {
    renderBar({ filters: { ...baseFilters, country: 'JP' } });
    const pill = screen.getByTestId('active-country-filter-pill');
    expect(pill).toBeTruthy();
    fireEvent.click(pill);
    expect(mockOnChange).toHaveBeenCalledWith({ country: 'all' });
  });
});
