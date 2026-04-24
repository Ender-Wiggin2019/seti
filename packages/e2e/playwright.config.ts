import { defineConfig, devices } from '@playwright/test';

const SERVER_URL = process.env.SERVER_URL ?? 'http://localhost:3000';
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';
const SERVER_HEALTHCHECK_URL =
  process.env.SERVER_HEALTHCHECK_URL ?? `${SERVER_URL}/auth/me`;

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 60_000,

  use: {
    baseURL: CLIENT_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : [
        {
          command:
            'pnpm --filter @seti/server db:prepare:e2e && pnpm --filter @seti/server dev',
          url: SERVER_HEALTHCHECK_URL,
          reuseExistingServer: true,
          timeout: 60_000,
          cwd: '../..',
        },
        {
          command: 'pnpm --filter @seti/client dev',
          url: CLIENT_URL,
          reuseExistingServer: true,
          timeout: 60_000,
          cwd: '../..',
        },
      ],
});
