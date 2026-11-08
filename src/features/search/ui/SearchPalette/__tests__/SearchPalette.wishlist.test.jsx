/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import RichResultCard from '../RichResultCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
    i18n: { language: 'es' },
  }),
}));

// Avoid booting the real i18n instance pulled transitively via viajeUtils/countryI18n.
vi.mock('@shared/lib/utils/countryI18n', () => ({
  getLocalizedCountryName: () => '',
  getCountryNameKey: () => '',
}));

const place = { id: 'jp', name: 'Japon', isCountry: true, countryCode: 'JP', subtitle: 'Asia, Japon' };

describe('SearchPalette wishlist action pills (RichResultCard)', () => {
  beforeEach(() => cleanup());

  it('renders neutral Create trip + Wishlist pills for a place', () => {
    render(<RichResultCard item={place} type="place" showWishlistActions onClick={vi.fn()} onCreateTrip={vi.fn()} onAddToWishlist={vi.fn()} />);
    expect(screen.getByTestId('create-trip-jp')).toBeTruthy();
    expect(screen.getByTestId('add-wishlist-jp')).toBeTruthy();
  });

  it('fires onCreateTrip from the Create trip pill without triggering row onClick', () => {
    const onCreateTrip = vi.fn();
    const onClick = vi.fn();
    render(<RichResultCard item={place} type="place" showWishlistActions onClick={onClick} onCreateTrip={onCreateTrip} onAddToWishlist={vi.fn()} />);
    fireEvent.click(screen.getByTestId('create-trip-jp'));
    expect(onCreateTrip).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires onAddToWishlist with the place from the Wishlist pill', () => {
    const onAddToWishlist = vi.fn();
    render(<RichResultCard item={place} type="place" showWishlistActions onClick={vi.fn()} onCreateTrip={vi.fn()} onAddToWishlist={onAddToWishlist} />);
    fireEvent.click(screen.getByTestId('add-wishlist-jp'));
    expect(onAddToWishlist).toHaveBeenCalledTimes(1);
    expect(onAddToWishlist.mock.calls[0][0]).toMatchObject({ id: 'jp' });
  });

  it('renders a disabled Guardado state when already saved', () => {
    const onAddToWishlist = vi.fn();
    render(<RichResultCard item={place} type="place" showWishlistActions isSaved onClick={vi.fn()} onCreateTrip={vi.fn()} onAddToWishlist={onAddToWishlist} />);
    const btn = screen.getByTestId('add-wishlist-jp');
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(onAddToWishlist).not.toHaveBeenCalled();
  });
});
