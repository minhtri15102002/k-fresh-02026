# Module 10 — Playwright Setup & Config

> Phase 2 · Effort: 3h · Prerequisites: Phase 1

## Learning objectives

After this module you can:

- Install Playwright from scratch in a fresh repo.
- Read & explain every line of `playwright.config.ts` in this repo.
- Configure **projects**, **browsers**, **retries**, **workers**, **reporters**, **timeouts**.
- Choose between **headed** and **headless** modes for local debugging vs CI.

## Why it matters

Playwright config is where flakiness either lives or dies. A misconfigured `headless`, `retries`, or `expect.timeout` can mask real bugs or amplify environmental flakes for months.

## Concepts

### Install

```bash
npm init playwright@latest    # interactive scaffold
# or in this repo (already set up):
npm ci
npx playwright install --with-deps   # downloads browser binaries
```

### Anatomy of `playwright.config.ts`

```ts
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,                          // per-test timeout
  expect: { timeout: 10_000 },              // per-assertion timeout
  fullyParallel: true,                      // tests in same file run in parallel
  forbidOnly: !!process.env.CI,             // fails CI if .only left in
  retries: process.env.CI ? 2 : 0,          // retry flakes in CI only
  workers: process.env.CI ? 4 : undefined,  // parallelism
  reporter: [
    ['html'],
    ['allure-playwright'],
    ['./reports/custom-reporter.ts'],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    headless: process.env['HEADED'] !== 'true',   // headless by default
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Headless vs headed (this repo's gotcha)

Playwright is **headless by default**. Use `HEADED=true npx playwright test` to see the browser.

This repo had a bug previously: `headless: !process.env['HEADLESS']` inverted the logic and forced headed mode in CI, breaking it ("XServer not running"). The fix in `playwright.config.ts`:

```ts
headless: process.env['HEADED'] !== 'true'
```

Lesson: read the boolean *out loud* before committing. "headless when HEADED is not true" → correct.

### Trace, video, screenshot

| Setting | Value | When |
|---|---|---|
| `trace` | `'on'` / `'on-first-retry'` / `'retain-on-failure'` / `'off'` | `'on-first-retry'` in CI saves disk |
| `video` | similar values | `'retain-on-failure'` is the sweet spot |
| `screenshot` | `'on'` / `'only-on-failure'` / `'off'` | `'only-on-failure'` is standard |

### Projects = environments / browsers

Use a `project` per browser, per environment, per device, or per test "kind" (smoke vs regression):

```ts
projects: [
  { name: 'chromium-qa',     use: { baseURL: 'https://qa.example.com' } },
  { name: 'chromium-uat',    use: { baseURL: 'https://uat.example.com' } },
  { name: 'mobile-chrome',   use: { ...devices['Pixel 7'] } },
]
```

Run one: `npx playwright test --project=chromium-qa`.

### Timeouts hierarchy

```
test.setTimeout()                   ← per-test override
config.timeout                      ← default per-test
config.expect.timeout               ← per assertion
locator.click({ timeout })          ← per action
expect(...).toHaveText(text, { timeout })   ← per assertion override
```

Most-specific wins.

### Environment variables

This repo loads `.env.<ENV>` from `profiles/` via `env.loader.ts`. Pattern:

```bash
ENV=qa npm test                # loads profiles/.env.qa
ENV=uat npm test               # loads profiles/.env.uat
HEADED=true ENV=qa npm test    # local headed debug
```

## Hands-on lab

1. Read `playwright.config.ts` line-by-line. Annotate each option in your `training/sandbox/<name>/notes-playwright-config.md`.
2. Add a new project `mobile-iphone` with `devices['iPhone 14']` viewport. Run a test against it.
3. Set `trace: 'on'` locally, run a single test, open the trace with `npx playwright show-trace test-results/.../trace.zip`. Walk through every step.
4. Misconfigure `expect.timeout` to `100` ms. Watch tests fail. Restore. Now you understand the safety margin.
5. Switch headless on/off to verify the fix that was applied to this repo.

## Self-check

- [ ] What's the difference between `timeout` and `expect.timeout`?
- [ ] Why does CI use `retries: 2` but local uses `retries: 0`?
- [ ] When does `trace: 'on-first-retry'` produce a trace file?
- [ ] Where do environment-specific URLs come from in this repo?

## Further reading

- playwright.dev — Configuration
- This repo's `playwright.config.ts`, `env.loader.ts`, `profiles/.env.*`

---

**Next:** [11 — Locators](./11-locators.md) · **Up:** [Phase 2 README](./README.md)
