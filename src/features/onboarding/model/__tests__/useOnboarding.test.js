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

  it('syncs residenceCountry to birthCountry when sameAsBirth is true', () => {
    const { result } = renderHook(() => useOnboarding());

    expect(result.current.sameAsBirth).toBe(true);

    act(() => {
      result.current.setBirthCountry('AR');
    });

    expect(result.current.birthCountry).toBe('AR');
    expect(result.current.residenceCountry).toBe('AR');
  });

  it('allows distinct birthCountry and residenceCountry when sameAsBirth is false', () => {
    const { result } = renderHook(() => useOnboarding());

    act(() => {
      result.current.setBirthCountry('AR');
      result.current.setSameAsBirth(false);
      result.current.setResidenceCountry('DE');
    });

    expect(result.current.sameAsBirth).toBe(false);
    expect(result.current.birthCountry).toBe('AR');
    expect(result.current.residenceCountry).toBe('DE');
  });

  it('completes onboarding with fallback centroid coordinates when baseCity text is entered manually', async () => {
    mockUpdateUserProfile.mockResolvedValue(true);
    const onComplete = vi.fn();
    const { result } = renderHook(() => useOnboarding({ onComplete }));

    act(() => {
      result.current.setDisplayName('Mateo Explorer');
      result.current.setBirthCountry('ES');
      result.current.setSameAsBirth(false);
      result.current.setResidenceCountry('FR');
      result.current.setCityQuery('Paris');
    });

    await act(async () => {
      await result.current.completeOnboarding({ navigateToNew: true });
    });

    expect(mockUpdateUserProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Mateo Explorer',
        birthCountry: 'ES',
        residenceCountry: 'FR',
        hasCompletedOnboarding: true,
        baseCity: expect.objectContaining({
          name: 'Paris',
          countryCode: 'FR',
          coordinates: [2.2137, 46.2276], // Centroid of France
        }),
      })
    );

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        navigateToNew: true,
      })
    );
  });
});
