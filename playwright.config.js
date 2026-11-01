// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.(js|ts)/,
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'https://pragency.pages.dev',
    headless: true,
    channel: 'chrome',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'Chrome E2E',
      use: {
        channel: 'chrome',
      },
    },
  ],
});
