/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { BrandLogo, BrandIsotype } from '../index';

describe('Brand Components', () => {
  afterEach(() => cleanup());
  describe('BrandIsotype', () => {
    it('renders the standalone flight mark with default accessible role and label', () => {
      render(<BrandIsotype className="text-atomicTangerine" size={32} />);
      const svg = screen.getByRole('img', { name: 'Keeptrip' });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 110 124');
      expect(svg).toHaveClass('text-atomicTangerine');
    });

    it('supports custom aria-label', () => {
      render(<BrandIsotype ariaLabel="Custom Label" />);
      expect(screen.getByRole('img', { name: 'Custom Label' })).toBeInTheDocument();
    });
  });

  describe('BrandLogo', () => {
    it('renders the full horizontal lockup with default role and label', () => {
      render(<BrandLogo className="text-charcoalBlue" />);
      const svg = screen.getByRole('img', { name: 'Keeptrip' });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 418 122');
      expect(svg).toHaveClass('text-charcoalBlue');
    });

    it('renders the flight mark and wordmark with custom token classNames', () => {
      const { container } = render(
        <BrandLogo
          isotypeClassName="text-atomicTangerine"
          textClassName="text-charcoalBlue"
        />
      );
      const markPaths = container.querySelectorAll('.text-atomicTangerine');
      expect(markPaths.length).toBe(3);
      const textPaths = container.querySelectorAll('.text-charcoalBlue');
      expect(textPaths.length).toBeGreaterThan(0);
    });
  });
});
