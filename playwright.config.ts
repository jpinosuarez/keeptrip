import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 120000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  // Retries in CI to reduce flakiness on transient failures
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_ENABLE_TEST_LOGIN: 'true'
    }
  }
});
