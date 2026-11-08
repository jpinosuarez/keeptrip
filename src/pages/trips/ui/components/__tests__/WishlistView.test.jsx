/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WishlistView from '../WishlistView';
import { normalizeWishlistItem } from '@shared/lib/wishlist/wishlistUtils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'es' },
  }),
}));

vi.mock('@shared/api/services/mapboxGeocoding', () => ({
  fetchGeocoding: vi.fn(async () => ({ features: [] })),
}));

// Avoid booting the full i18n instance through countryI18n in the test env.
vi.mock('@shared/lib/utils/countryI18n', () => ({
  getLocalizedCountryName: (code) => code || '',
  getCountryNameKey: (code) => (code ? `countries:${code}` : ''),
}));

const buildItems = () => [
  normalizeWishlistItem({ tipo: 'pais', nombre: 'Japón', paisCodigo: 'JP', paisNombre: 'Japón' }),
  normalizeWishlistItem({ tipo: 'ciudad', nombre: 'Kioto', paisCodigo: 'JP', paisNombre: 'Japón' }),
  normalizeWishlistItem({ tipo: 'pais', nombre: 'Portugal', paisCodigo: 'PT', paisNombre: 'Portugal' }),
];

describe('WishlistView', () => {
  beforeEach(() => cleanup());

  it('renders the evocative empty state and triggers the add CTA', () => {
    const onAddDestination = vi.fn();
    render(<WishlistView items={[]} onAddDestination={onAddDestination} />);

    expect(screen.getByText('Tu bucket list te espera')).toBeTruthy();
    fireEvent.click(screen.getByText('Añadir destino'));
    expect(onAddDestination).toHaveBeenCalledTimes(1);
  });

  it('groups destinations by country and renders city tags', () => {
    render(<WishlistView items={buildItems()} />);

    expect(screen.getByText('Japón')).toBeTruthy();
    expect(screen.getByText('Kioto')).toBeTruthy();
    expect(screen.getByText('Portugal')).toBeTruthy();
  });

  it('calls onCreateTrip and onDeleteCountry with the correct country group', () => {
    const onCreateTrip = vi.fn();
    const onDeleteCountry = vi.fn();
    render(<WishlistView items={buildItems()} onCreateTrip={onCreateTrip} onDeleteCountry={onDeleteCountry} />);

    const createButtons = screen.getAllByText('Crear viaje');
    fireEvent.click(createButtons[0]);
    expect(onCreateTrip).toHaveBeenCalledTimes(1);
    expect(onCreateTrip.mock.calls[0][0]).toMatchObject({ paisCodigo: 'JP' });

    fireEvent.click(screen.getAllByLabelText('Quitar país de la Wishlist')[0]);
    expect(onDeleteCountry).toHaveBeenCalledTimes(1);
    expect(onDeleteCountry.mock.calls[0][0]).toMatchObject({ paisCodigo: 'JP' });
  });

  it('removes a single city via its × button', () => {
    const onDeleteItem = vi.fn();
    render(<WishlistView items={buildItems()} onDeleteItem={onDeleteItem} />);

    fireEvent.click(screen.getByLabelText('Quitar Kioto'));
    expect(onDeleteItem).toHaveBeenCalledTimes(1);
  });

  it('filters the saved cards as the user types and shows the no-results state', () => {
    render(<WishlistView items={buildItems()} />);

    const input = screen.getByPlaceholderText('Filtrar destinos guardados...');
    fireEvent.change(input, { target: { value: 'lisboa' } });

    expect(screen.getByText(/No tienes destinos que coincidan con/)).toBeTruthy();
    expect(screen.queryByText('Kioto')).toBeNull();
  });
});
