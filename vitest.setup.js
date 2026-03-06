/**
 * Vitest global setup.
 *
 * Heavy module mocks (lucide-react, framer-motion) are handled via
 * resolve.alias in vite.config.js, which redirects imports to __mocks__/
 * stubs at the Vite resolver level (before the worker loads any code).
 * This avoids OOM from barrel-file expansion.
 *
 * Extends Vitest's expect with @testing-library/jest-dom matchers
 * (toHaveValue, toHaveTextContent, toBeInTheDocument, etc.)
 */
import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock react-i18next globally — return the key as-is for all t() calls
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      // If interpolation params exist, return key with replacements
      if (opts && typeof opts === 'object') {
        return Object.entries(opts).reduce(
          (str, [k, v]) => str.replace(`{{${k}}}`, v),
          key
        );
      }
      return key;
    },
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

