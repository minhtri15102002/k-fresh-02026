# Module 27 — Reporting (Allure 3, custom)

> Phase 5 · Effort: 4h · Prerequisites: Module 26

## Learning objectives

After this module you can:

- Read & navigate the **Playwright HTML report**, **Allure 3** report, and this repo's **custom reporter** output.
- Configure `allurerc.mjs` and understand why Allure 2 vs 3 matters.
- Add a custom reporter that writes structured run data (the foundation of dashboards).
- Attach screenshots, videos, and traces to test cases for fast triage.

## Why it matters

A test suite with poor reporting is invisible. Stakeholders don't watch terminals — they look at dashboards. Reporting is what turns "we ran 1000 tests" into "here's why this build is or isn't releasable".

## Concepts

### Three layers of reports in this repo

| Layer | Tool | Output | Purpose |
|---|---|---|---|
| Per-run | Playwright HTML (`playwright-report/`) | Interactive HTML | Triage failures with traces |
| Per-run | Allure 3 (`allure-report/`) | Interactive HTML + history | BI-style features (severity, suites, trends) |
| Aggregated | Custom reporter (`reports/run-summary.json`) | JSON | Feeds the QA Metrics dashboard (Module 28) |

### Configuring reporters

```ts
// playwright.config.ts
reporter: [
  ['list'],                                                   // console
  ['html', { open: 'never' }],                                // playwright-report/
  ['allure-playwright', { resultsDir: 'allure-results' }],
  ['./reports/custom-reporter.ts'],                           // our own
]
```

### Allure 2 vs 3 (the gotcha)

This repo had a bug: `allure-commandline@2.x` (Java CLI) and `allure@3.x` (Node CLI) both installed. The shimmed `node_modules/.bin/allure` pointed at v2 — so `allurerc.mjs` was silently ignored.

Fix:

```bash
npm uninstall allure-commandline
npm install allure --force                       # Node v3 CLI
```

```jsonc
// package.json scripts
{
  "allure-generate": "allure generate allure-results -o allure-report",
  "allure-serve":    "allure open allure-report"
}
```

`allurerc.mjs` (Allure 3 config) is now honored.

### `allurerc.mjs` — what it controls

```js
export default {
  name: 'My QA Report',
  output: 'allure-report',
  history: 'allure-results/history',
  reportLanguage: 'en',
  plugins: { 'screen-diff-plugin': { /* … */ } },
  reportName: 'QA Build #123',
  // logo etc.
};
```

### Allure annotations (this repo)

```ts
import * as allure from 'allure-js-commons';

await allure.label('feature', 'Cart');
await allure.severity('critical');
await allure.story('Discount stacking');
await allure.epic('Commerce');
```

Better: this repo's auto-fixture in `pages/base-page.ts` reads test tags (`@critical`, `@cart`) and pushes them as Allure labels automatically. Tag once, get it everywhere.

### Custom reporter anatomy

```ts
// reports/custom-reporter.ts
import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

export default class CustomReporter implements Reporter {
  onBegin(config, suite) { /* runtime init */ }
  onTestEnd(test: TestCase, result: TestResult) {
    // accumulate per-test stats (priority, severity, feature, duration)
  }
  async onEnd(result) {
    // write reports/run-summary.json + reports/run-trend.json
  }
}
```

This repo's reporter does:

- Classifies each test by tag (`@P1`, `@critical`, `@ui`, `@cart`, …)
- Writes `run-summary.json` (current run aggregates)
- Appends to `run-trend.json` (last N runs for trend charts)
- Sends Slack/Teams notifications (optional)

### Attachments — make failures debuggable

```ts
// in a custom helper
testInfo.attach('cart-snapshot.json', {
  body: JSON.stringify(cart, null, 2),
  contentType: 'application/json',
});
```

Attachments show up in HTML + Allure reports. Use for:

- API request/response bodies on failure
- Computed values that drove the assertion
- Custom screenshots beyond the auto-capture

### Screenshots, videos, traces

```ts
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

Each is a different cost/value trade-off:

| Asset | Size | Triage value |
|---|---|---|
| Screenshot | 50–500 KB | High — see *what* failed |
| Video | 1–10 MB | Medium — see *how* it got there |
| Trace zip | 500 KB – 5 MB | **Highest** — full step + DOM + network replay |

### History and trends

Allure shows pass/fail history if you preserve `allure-report/history` between runs:

```yaml
- uses: actions/cache@v4
  with:
    path: allure-report/history
    key: allure-history-${{ github.run_id }}
    restore-keys: allure-history-
```

`run-trend.json` stores N most recent runs; the dashboard plots its sparklines from this.

## Hands-on lab

1. Run `npm test` then `npm run allure-serve`. Browse the report. Identify:
   - The longest test
   - Tests grouped by `@feature`
   - Severity distribution chart
2. Open `playwright-report/index.html`. Navigate to a failed test. Open the trace. Walk through every step.
3. Read `reports/custom-reporter.ts` end-to-end. Add a new aggregation: count of tests per `@module:*` tag. Write it to `run-summary.json`.
4. Add an attachment to a test that includes the API request body when it fails (use `testInfo.attach` in a try/catch).

## Self-check

- [ ] Why does this repo prefer Allure 3 over 2?
- [ ] Where would you set "always capture trace" temporarily for one investigation?
- [ ] What does the auto-fixture in `pages/base-page.ts` push into Allure labels?
- [ ] You add a custom reporter and tests run twice as long. Likely cause?

## Further reading

- playwright.dev — Reporters
- allurereport.org — Allure 3 docs
- This repo's `reports/custom-reporter.ts`, `allurerc.mjs`

---

**Prev:** [26 — Parallel sharding](./26-parallel-sharding-and-matrix.md) · **Next:** [28 — QA Metrics dashboard](./28-qa-metrics-dashboard.md)
