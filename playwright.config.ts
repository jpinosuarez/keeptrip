import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  // Retries in CI to reduce flakiness on transient failures
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20000,
    trace: 'on-first-retry',
    video: 'on'
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_ENABLE_TEST_LOGIN: 'true',
      VITE_E2E_ENABLE_INVITATIONS: 'true',
      VITE_E2E_ENABLE_IMMERSIVE_VIEWER: 'true',
      VITE_E2E_ENABLE_GAMIFICATION: 'true'
    }
  }
});
