import './env.loader';
import { defineConfig, devices } from '@playwright/test';
import { Constants } from '@utilities/constants';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: Constants.MAX_RETRY_ATTEMPTS,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? Constants.WORKERS : Constants.LOCAL_WORKERS,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters
   *
   * IMPORTANT: when an explicit `reporter:` array is provided, Playwright does
   * NOT merge in its default `list` reporter — it replaces it. If every entry
   * here writes to a file (html / junit / allure / custom webhooks), the
   * terminal stays silent for the entire run and a failing build looks
   * indistinguishable from a hung process. The leading `list` reporter keeps
   * stdout informative.
   */
  reporter:
    [['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: true,
      },
    ],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
    // Custom reporter: fans out a run summary to Slack / Google Chat / Email.
    // No-op when no channel is configured (see reports/notifiers/index.ts).
    ['./reports/custom-reporter.ts'],
    ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',
    launchOptions: {
      args: ['--start-maximized'],
    },
    viewport: null,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    /* Default: headless. Opt in to a visible browser locally with `HEADED=true npx playwright test`.
       This avoids the classic "headed without XServer" failure on Linux/CI runners and the
       previous inverted `!process.env.HEADLESS` logic which silently forced headed mode whenever
       the workflow exported `HEADLESS=true`. */
    headless: process.env['HEADLESS'] !== 'true',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: Constants.TIMEOUTS.DEFAULT * 2,
  expect: {
    timeout: Constants.TIMEOUTS.WAIT_LOCATOR,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

});
