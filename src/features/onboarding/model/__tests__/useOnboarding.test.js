/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';

const mockUpdateUserProfile = vi.fn();

vi.mock('@app/providers/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Valeria Traveler' },
    userProfile: {
      displayName: 'Valeria Traveler',
      birthCountry: null,
      birthCity: null,
      residenceCountry: null,
      baseCity: null,
      hasCompletedOnboarding: false,
    },
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k, def) => def || k,
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('useOnboarding', () => {
  it('manages 3-step progression (1 -> 2 -> 3)', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.step).toBe(1);

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(2);

    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(3);

    // Bound at step 3
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.step).toBe(3);

    act(() => {
      result.current.prevStep();
    });
    expect(result.current.step).toBe(2);
  });

  it('handles residenceMode: same_city automatically copying birthCity to baseCity', async () => {
    mockUpdateUserProfile.mockResolvedValue(true);
    const onComplete = vi.fn();
    const { result } = renderHook(() => useOnboarding({ onComplete }));

    act(() => {
      result.current.setBirthCountry('AR');
      result.current.setBirthCityQuery('Rosario');
      result.current.setResidenceMode('same_city');
    });

    expect(result.current.sameAsBirth).toBe(true);
    expect(result.current.residenceCountry).toBe('AR');

    await act(async () => {
      await result.current.completeOnboarding({ navigateToNew: false });
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        birthCountry: 'AR',
        birthCity: expect.objectContaining({ name: 'Rosario', countryCode: 'AR' }),
        residenceCountry: 'AR',
        baseCity: expect.objectContaining({ name: 'Rosario', countryCode: 'AR' }),
        hasCompletedOnboarding: true,
      })
    );
  });

  it('handles residenceMode: same_country setting distinct baseCity in same country', async () => {
    mockUpdateUserProfile.mockResolvedValue(true);
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setBirthCountry('AR');
      result.current.setBirthCityQuery('Rosario');
      result.current.setResidenceMode('same_country');
      result.current.setBaseCityQuery('Buenos Aires');
    });

    expect(result.current.sameAsBirth).toBe(true);
    expect(result.current.residenceCountry).toBe('AR');

    await act(async () => {
      await result.current.completeOnboarding({ navigateToNew: false });
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        birthCountry: 'AR',
        birthCity: expect.objectContaining({ name: 'Rosario', countryCode: 'AR' }),
        residenceCountry: 'AR',
        baseCity: expect.objectContaining({ name: 'Buenos Aires', countryCode: 'AR' }),
        hasCompletedOnboarding: true,
      })
    );
  });

  it('handles residenceMode: different_country with distinct country and city', async () => {
    mockUpdateUserProfile.mockResolvedValue(true);
    const onComplete = vi.fn();
    const { result } = renderHook(() => useOnboarding({ onComplete }));

    act(() => {
      result.current.setDisplayName('Mateo Explorer');
      result.current.setBirthCountry('ES');
      result.current.setBirthCityQuery('Madrid');
      result.current.setResidenceMode('different_country');
      result.current.setResidenceCountry('FR');
      result.current.setBaseCityQuery('Paris');
    });

    expect(result.current.sameAsBirth).toBe(false);

    await act(async () => {
      await result.current.completeOnboarding({ navigateToNew: true });
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Mateo Explorer',
        birthCountry: 'ES',
        birthCity: expect.objectContaining({ name: 'Madrid', countryCode: 'ES' }),
        residenceCountry: 'FR',
        baseCity: expect.objectContaining({
          name: 'Paris',
          countryCode: 'FR',
          coordinates: [2.2137, 46.2276], // Centroid of France
        }),
        hasCompletedOnboarding: true,
      })
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        navigateToNew: true,
      })
    );
  });
});

