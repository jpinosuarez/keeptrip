/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Globe } from 'lucide-react';
import EmptyStateCard from './EmptyStateCard';

describe('EmptyStateCard', () => {
  afterEach(() => cleanup());

  it('renders the title and description', () => {
    render(
      <EmptyStateCard title="Tu mundo te espera" description="Cada viaje empieza con un destino." />
    );
    expect(screen.getByText('Tu mundo te espera')).toBeInTheDocument();
    expect(screen.getByText('Cada viaje empieza con un destino.')).toBeInTheDocument();
  });

  it('always expands inside its layout (no narrow-column squish)', () => {
    render(<EmptyStateCard data-testid="card" title="T" description="D" />);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('w-full');
    expect(card.className).toContain('max-w-2xl');
    expect(card.className).toContain('min-w-0');
    expect(card.className).toContain('mx-auto');
    // `self-stretch` stretched the card vertically inside flex-row parents.
    expect(card.className).not.toContain('self-stretch');
  });

  it('renders an optional badge and icon', () => {
    render(<EmptyStateCard icon={Globe} badgeText="Wishlist" title="T" description="D" />);
    expect(screen.getByText('Wishlist')).toBeInTheDocument();
  });

  it('fires the primary action and enforces mobile CTA sizing', () => {
    const onClick = vi.fn();
    render(
      <EmptyStateCard
        title="T"
        description="D"
        primaryAction={{ label: 'Crear viaje', onClick, icon: Globe }}
      />
    );
    const button = screen.getByRole('button', { name: /Crear viaje/ });
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[240px]');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the requested accent color to the primary action', () => {
    render(
      <EmptyStateCard
        accentColor="teal"
        title="T"
        description="D"
        primaryAction={{ label: 'Añadir destino', onClick: () => {} }}
      />
    );
    const button = screen.getByRole('button', { name: /Añadir destino/ });
    expect(button.className).toContain('bg-[#45B0A8]');
  });

  it('fires the secondary action', () => {
    const onSecondary = vi.fn();
    render(
      <EmptyStateCard
        title="T"
        description="D"
        secondaryAction={{ label: 'Explorar', onClick: onSecondary }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Explorar' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('applies className overrides for variant styling (transparent Bento)', () => {
    render(
      <EmptyStateCard
        data-testid="card"
        title="T"
        description="D"
        className="bg-transparent border-0 shadow-none"
      />
    );
    const card = screen.getByTestId('card');
    expect(card.className).toContain('bg-transparent');
    expect(card.className).toContain('border-0');
    expect(card.className).toContain('shadow-none');
  });
});
