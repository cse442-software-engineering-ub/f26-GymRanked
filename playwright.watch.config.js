import { defineConfig } from '@playwright/test'
import baseConfig from './playwright.config.js'

// `npm run test:e2e:watch`, the standard way to run the tests: a visible browser at a human pace, one test at a
// time, with the results page opening in your browser at the end. `npm run test:e2e` is the quick headless run.
process.env.E2E_WATCH = '1'

export default defineConfig({
  ...baseConfig,
  workers: 1,
  // Allow up to 4 minutes per test: at this pace the longest (story 72, test 4) takes over a minute.
  timeout: 240_000,
  reporter: [['list'], ['html', { open: 'never' }], ['./tests/e2e/summary-reporter.js', { open: true }]],
  use: {
    ...baseConfig.use,
    headless: false,
    // Wait this long before each browser action, and helpers.js types one key at a time.
    launchOptions: { slowMo: 1200 },
  },
})
