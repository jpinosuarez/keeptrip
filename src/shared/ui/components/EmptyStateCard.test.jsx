/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Globe } from 'lucide-react';
import EmptyStateCard from './EmptyStateCard';

describe('EmptyStateCard', () => {
  afterEach(() => cleanup());

  it('renders the title and description', () => {
    render(<EmptyStateCard title="Tu bucket list te espera" description="Guarda países y ciudades." />);
    expect(screen.getByText('Tu bucket list te espera')).toBeInTheDocument();
    expect(screen.getByText('Guarda países y ciudades.')).toBeInTheDocument();
  });

  it('root is unshrinkable, capped and has a viewport-safe min width', () => {
    render(<EmptyStateCard data-testid="card" title="T" description="D" />);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('shrink-0');
    expect(card.className).toContain('w-full');
    expect(card.className).toContain('max-w-[500px]');
    expect(card.className).toContain('mx-auto');
    expect(card.className).toContain('block');
    // NOTE: jsdom's CSS parser cannot resolve `min()`, so the inline
    // `style.minWidth` floor is validated in the real browser, not here.
  });

  it('renders the icon with the requested accent color', () => {
    render(<EmptyStateCard data-testid="card" icon={Globe} accentColor="teal" title="T" description="D" />);
    const card = screen.getByTestId('card');
    const iconBox = card.querySelector('.rounded-2xl');
    expect(iconBox).toBeTruthy();
    expect(iconBox.className).toContain('text-[#45B0A8]');
  });

  it('fires the primary action with mobile CTA sizing', () => {
    const onClick = vi.fn();
    render(<EmptyStateCard title="T" description="D" primaryAction={{ label: 'Crear viaje', onClick, icon: Globe }} />);
    const button = screen.getByRole('button', { name: /Crear viaje/ });
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[220px]');
    expect(button.className).toContain('bg-[#FF6B35]');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('fires the secondary action', () => {
    const onSecondary = vi.fn();
    render(<EmptyStateCard title="T" description="D" secondaryAction={{ label: 'Explorar', onClick: onSecondary }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Explorar' }));
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('forwards data-testid to the root (keeps ghost-empty-state)', () => {
    render(<EmptyStateCard data-testid="ghost-empty-state" title="T" description="D" />);
    expect(screen.getByTestId('ghost-empty-state')).toBeInTheDocument();
  });

  it('merges a className override without clobbering the base layout', () => {
    render(<EmptyStateCard data-testid="card" title="T" description="D" className="opacity-60 pointer-events-none" />);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('max-w-[500px]');
    expect(card.className).toContain('opacity-60');
  });
});
