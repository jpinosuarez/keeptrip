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
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

