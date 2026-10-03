/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../NavBar';

afterEach(() => cleanup());

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({
    usuario: null,
    login: vi.fn(),
  }),
}));

describe('NavBar Component', () => {
  it('renders official BrandLogo', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    const logo = screen.getByRole('img', { name: 'Keeptrip' });
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveClass('h-8', 'w-auto', 'text-slate-900');
  });

  it('renders login button when unauthenticated', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('header-login-button')).toBeInTheDocument();
  });
});
