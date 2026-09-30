import { defineConfig } from '@playwright/test'

// Automated acceptance tests: tests/e2e/ reads each story's tests from stories/. This is the quick headless run
// (`npm run test:e2e`); playwright.watch.config.js builds on it for `npm run test:e2e:watch`.
// By default they run against the local Vite + PHP servers, which Playwright starts itself.
// Set E2E_BASE_URL to run against a deployed copy instead (it creates e2e-…@example.com accounts there).
const LOCAL_URL = 'http://localhost:5173/CSE442/2026-Fall/cse-442y/'
const baseURL = process.env.E2E_BASE_URL || LOCAL_URL

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.js',
  forbidOnly: !!process.env.CI,
  // list: the terminal. html: Playwright's technical report with traces (`npx playwright show-report`).
  // summary-reporter: the plain-language results page in e2e-report/, listed last so its line prints last.
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/e2e/summary-reporter.js']],
  use: {
    baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Desktop runs every test. Mobile runs only the tests a spec marks as layout-sensitive (tagged @mobile),
  // because each test logs in, and the API allows 50 logins and 50 sign-ups per IP address every 15 minutes.
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'mobile',
      grep: /@mobile/,
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          // The PHP built-in server handles one request at a time unless it is given workers. Its log of every
          // request is hidden; to see PHP errors, start the servers yourself (TestingAndDebuggingGuide.md).
          command: 'php -S localhost:8000 -t api',
          port: 8000,
          env: { PHP_CLI_SERVER_WORKERS: '4' },
          stderr: 'ignore',
          reuseExistingServer: true,
        },
        {
          command: 'npm run dev -- --strictPort',
          url: LOCAL_URL,
          reuseExistingServer: true,
        },
      ],
})
