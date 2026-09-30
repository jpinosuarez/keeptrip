/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

afterEach(() => cleanup());

describe('Footer Component', () => {
  it('renders footer with Keeptrip brand name', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const keeptrip = screen.getByText('Keeptrip');
    expect(keeptrip).toBeInTheDocument();
  });

  it('renders footer with navigation links', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    
    expect(links[0]).toHaveTextContent('footer.terms');
    expect(links[1]).toHaveTextContent('footer.privacy');
    expect(links[2]).toHaveTextContent('footer.contact');
  });

  it('renders links with correct href attributes', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    
    expect(links[0]).toHaveAttribute('href', '/legal#terms');
    expect(links[1]).toHaveAttribute('href', '/legal#privacy');
    expect(links[2]).toHaveAttribute('href', '#contact');
  });

  it('renders dynamic copyright year', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const currentYear = new Date().getFullYear().toString();
    const copyrightElement = screen.getByText(new RegExp(`© ${currentYear}.*Keeptrip`));
    expect(copyrightElement).toBeInTheDocument();
  });

  it('renders copyright text using i18n', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const paragraphs = screen.getAllByText(/© \d{4}/);
    const copyrightPara = paragraphs[0];
    expect(copyrightPara).toBeInTheDocument();
  });

  it('has correct semantic footer element', () => {
    const { container } = render(<MemoryRouter><Footer /></MemoryRouter>);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders footer content within proper wrapper structure', () => {
    const { container } = render(<MemoryRouter><Footer /></MemoryRouter>);
    const footer = container.querySelector('footer');
    const wrapper = footer?.querySelector('div');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders three navigation links total', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
  });
});
