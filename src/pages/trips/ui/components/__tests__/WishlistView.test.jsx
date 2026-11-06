/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WishlistView from '../WishlistView';
import { normalizeWishlistItem } from '@shared/lib/wishlist/wishlistUtils';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
  }),
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
    fireEvent.click(screen.getByText('Añadir mi primer destino'));
    expect(onAddDestination).toHaveBeenCalledTimes(1);
  });

  it('groups destinations by country and renders city tags', () => {
    render(<WishlistView items={buildItems()} />);

    expect(screen.getByText('Japón')).toBeTruthy();
    expect(screen.getByText('Kioto')).toBeTruthy();
    expect(screen.getByText('Portugal')).toBeTruthy();
  });

  it('calls onCreateTrip with the country group and onRemove with the same group', () => {
    const onCreateTrip = vi.fn();
    const onRemove = vi.fn();
    const items = buildItems();
    render(<WishlistView items={items} onCreateTrip={onCreateTrip} onRemove={onRemove} />);

    const createButtons = screen.getAllByText('Crear viaje');
    fireEvent.click(createButtons[0]);
    expect(onCreateTrip).toHaveBeenCalledTimes(1);
    expect(onCreateTrip.mock.calls[0][0]).toMatchObject({ paisCodigo: 'JP' });

    fireEvent.click(screen.getAllByLabelText('Quitar de la Wishlist')[0]);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove.mock.calls[0][0]).toMatchObject({ paisCodigo: 'JP' });
  });

  it('filters by query and shows the no-results state', () => {
    render(<WishlistView items={buildItems()} query="lisboa" />);
    expect(screen.getByText('No hay destinos que coincidan con tu búsqueda.')).toBeTruthy();
    expect(screen.queryByText('Japón')).toBeNull();
  });
});
