// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, afterEach, vi } from 'vitest';
import { useVirtualKeyboard } from '../useVirtualKeyboard';

describe('useVirtualKeyboard', () => {
  const originalVisualViewport = window.visualViewport;

  afterEach(() => {
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  test('returns default state when visualViewport is not supported', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVirtualKeyboard());

    expect(result.current.keyboardOffset).toBe(0);
    expect(result.current.isKeyboardOpen).toBe(false);
  });

  test('computes keyboard offset when visualViewport shrinks', () => {
    let resizeCallback = null;
    const listeners = {};

    const mockVisualViewport = {
      height: 500,
      offsetTop: 0,
      addEventListener: vi.fn((event, cb) => {
        listeners[event] = cb;
        if (event === 'resize') resizeCallback = cb;
      }),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useVirtualKeyboard());

    // 844 - 500 - 0 = 344px offset (> 60px -> isKeyboardOpen: true)
    expect(result.current.keyboardOffset).toBe(344);
    expect(result.current.isKeyboardOpen).toBe(true);
    expect(result.current.visualViewportHeight).toBe(500);

    // Simulate keyboard closing
    act(() => {
      mockVisualViewport.height = 844;
      if (resizeCallback) resizeCallback();
    });

    expect(result.current.keyboardOffset).toBe(0);
    expect(result.current.isKeyboardOpen).toBe(false);
    expect(result.current.visualViewportHeight).toBe(844);
  });

  test('cleans up event listeners on unmount', () => {
    const mockVisualViewport = {
      height: 844,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true,
      configurable: true,
    });

    const { unmount } = renderHook(() => useVirtualKeyboard());

    unmount();

    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});

