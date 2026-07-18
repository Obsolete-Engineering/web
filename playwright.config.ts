import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/*.test.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  workers: 4,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bunx astro dev --host localhost --port 4321',
    env: {
      ...process.env,
      PUBLIC_WEB3FORMS_ACCESS_KEY: 'test-access-key',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    url: baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
