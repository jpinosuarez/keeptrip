/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySearchSelect } from './CountrySearchSelect';
import { CityAutocompleteInput } from './CityAutocompleteInput';
import { fetchGeocoding } from '@shared/api/services/mapboxGeocoding';

afterEach(() => {
  cleanup();
});

vi.mock('@shared/api/services/mapboxGeocoding', () => ({
  fetchGeocoding: vi.fn(async () => ({
    features: [
      {
        text: 'Madrid',
        place_name: 'Madrid, Comunidad de Madrid, España',
        center: [-3.7038, 40.4168],
        context: [{ id: 'country.1', short_code: 'es' }],
      },
    ],
  })),
}));

describe('CountrySearchSelect', () => {
  it('filters the country list by the search query and reports the ISO code on select', async () => {
    const onChange = vi.fn();
    render(<CountrySearchSelect value="" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button'));

    const searchInput = screen.getByPlaceholderText('common:search');
    await userEvent.type(searchInput, 'espa');

    const option = screen.getByRole('button', { name: /España/i });
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('ES');
  });

  it('closes the dropdown and clears the query when a country is picked', async () => {
    render(<CountrySearchSelect value="ES" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button'));

    await userEvent.type(screen.getByPlaceholderText('common:search'), 'arg');
    await userEvent.click(screen.getByRole('button', { name: /Argentina/i }));

    expect(screen.queryByPlaceholderText('common:search')).not.toBeInTheDocument();
  });

  it('closes the dropdown when Escape is pressed', async () => {
    render(<CountrySearchSelect value="" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('common:search')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByPlaceholderText('common:search')).not.toBeInTheDocument();
  });

  it('shows the no-results message when nothing matches', async () => {
    render(<CountrySearchSelect value="" onChange={vi.fn()} />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.type(screen.getByPlaceholderText('common:search'), 'zzzz');

    expect(screen.getByText('common:noResults')).toBeInTheDocument();
  });
});

describe('CityAutocompleteInput', () => {
  it('keeps the typed text in sync when the parent value changes', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CityAutocompleteInput value={null} countryCode="ES" onChange={onChange} />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');

    rerender(
      <CityAutocompleteInput
        value={{ name: 'Madrid', coordinates: [-3.7, 40.4], countryCode: 'ES' }}
        countryCode="ES"
        onChange={onChange}
      />
    );

    expect(input).toHaveValue('Madrid');
  });

  it('shows geocoding suggestions and reports the selected city', async () => {
    const onChange = vi.fn();
    render(<CityAutocompleteInput value={null} countryCode="ES" onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox'), 'Madr');

    const suggestion = await screen.findByRole('button', { name: /Madrid/i });
    await userEvent.click(suggestion);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Madrid', countryCode: 'ES' })
    );
  });

  it('queries Mapbox geocoding from two characters using the country scope', async () => {
    vi.mocked(fetchGeocoding).mockClear();

    render(<CityAutocompleteInput value={null} countryCode="ES" onChange={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'Ma');
    await screen.findByRole('button', { name: /Madrid/i });

    expect(fetchGeocoding).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'Ma', minLength: 2, country: 'ES', types: 'place,locality' })
    );
  });

  it('closes the suggestion list when Escape is pressed', async () => {
    render(<CityAutocompleteInput value={null} countryCode="ES" onChange={vi.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'Ma');
    await screen.findByRole('button', { name: /Madrid/i });

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: /Madrid/i })).not.toBeInTheDocument();
  });
});
