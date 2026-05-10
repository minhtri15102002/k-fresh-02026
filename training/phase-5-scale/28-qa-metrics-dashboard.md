# Module 28 — QA Metrics Dashboard

> Phase 5 · Effort: 5h · Prerequisites: Module 27

## Learning objectives

After this module you can:

- Read every panel in `templates/qa-metrics-dashboard.html`.
- Trace a chart back to its data source: `run-summary.json`, `run-trend.json`, `defects.json`.
- Add a new panel sourced from live test data.
- Toggle dark/light mode and explain how the theming works.
- Generate the dashboard PDF + live HTML and publish to GitHub Pages.

## Why it matters

Stakeholders don't read test reports — they read dashboards. A good dashboard tells a release manager **"is this build ready to ship?"** in 30 seconds. This is the #1 visible artifact of a senior QA engineer.

## Concepts

### What's on it

The dashboard has 6 sections:

1. **Headline KPIs** — pass rate, total tests, P1 health, defect count
2. **Test execution** — pass/fail trend, duration, browsers
3. **Test inventory** — by priority, severity, type, feature
4. **Requirements traceability** — REQ → tests → coverage %
5. **Defects** — by severity, status, module + live issue list
6. **Quality gate** — release-readiness verdict

### Data flow

```
npm test
  │
  ├─► reports/custom-reporter.ts
  │       writes reports/run-summary.json     (current run)
  │       writes reports/run-trend.json       (history)
  │
  └─► npm run posttest
          ├─► npm run fetch:defects
          │      writes reports/defects.json  (from GitHub Issues)
          │
          └─► npm run export:dashboard
                 reads ↑ those 3 files
                 renders templates/qa-metrics-dashboard.html
                 writes artifacts/qa-metrics-dashboard.pdf
                 writes artifacts/qa-metrics-dashboard.live.html
                 writes artifacts/index.html (clone of .live.html)
```

### Live HTML vs static template

- `templates/qa-metrics-dashboard.html` — checked-in template with sample data
- `artifacts/qa-metrics-dashboard.live.html` — same template but with **inlined** JSON data (so it works from `file://`, no CORS issues)
- `artifacts/qa-metrics-dashboard.pdf` — print-ready snapshot

### Hydration

The template's `hydrateFromReports()` function:

1. Tries to fetch each JSON file via `__SUMMARY_URL__`, `__TREND_URL__`, `__DEFECTS_URL__` (set by the export script).
2. If found, replaces the static placeholders.
3. If not found (someone opens the bare template), uses static demo data.

This means the same HTML works:
- During CI (data fetched from artifact paths)
- Standalone (with live data inlined)
- For human preview (template alone shows demo data)

### Defects from GitHub Issues

`scripts/fetch-defects.ts`:

1. Resolves a GitHub token (env → `gh auth token` fallback).
2. Resolves the repo from `git remote`.
3. Pulls all issues with the `bug` label.
4. Aggregates by status / severity / module label.
5. Stores per-issue details (URL, assignee, dates) for the live table.
6. Writes `reports/defects.json`.

Label conventions (`prompts/core/defect-labels.md`):

```
bug                    (always)
severity:critical|major|minor|trivial
module:auth|cart|checkout|profile|security|…
status:in-progress     (optional)
priority:p1|p2|p3      (optional)
```

### Theming (dark/light)

```html
<button id="theme-toggle">🌗</button>
```

```js
// boot.js inline
const saved = localStorage.getItem('qa-theme');
const initial = saved ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initial;
```

```css
:root[data-theme="dark"] {
  --bg: #0f1115;
  --fg: #e7e9ee;
  /* … */
}
```

Charts re-render on theme change to pick up the new palette (Chart.js doesn't theme reactively).

### Adding a new panel

Recipe:

1. Decide the metric. Where does it come from? (custom reporter? a tag? a defect label?)
2. If new: add aggregation to `reports/custom-reporter.ts` → write to `run-summary.json`.
3. Add a `<section class="card">` to `templates/qa-metrics-dashboard.html` with a `<canvas id="chart-X">`.
4. Add a render function `renderChartX(data)` that pulls from `state.summary`.
5. Wire it into `hydrateFromReports()` or `renderTables()`.
6. Add a self-test in `scripts/_verify-theme-toggle.ts` (one-off).

### Publishing to GitHub Pages

`.github/workflows/playwright.yml` `deploy-pages` job (only on `main`):

```yaml
deploy-pages:
  if: github.ref == 'refs/heads/main' && success()
  needs: test
  permissions: { pages: write, id-token: write }
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - uses: actions/download-artifact@v4
      with: { pattern: 'qa-metrics-dashboard-*', merge-multiple: true, path: site/ }
    - uses: actions/upload-pages-artifact@v3
      with: { path: site/ }
    - id: deployment
      uses: actions/deploy-pages@v4
```

Result: `https://<owner>.github.io/<repo>/qa-metrics-dashboard.live.html` (or `index.html`).

## Hands-on lab

1. Run `npm test` then `npm run export:dashboard`. Open `artifacts/qa-metrics-dashboard.live.html` in a browser.
2. Toggle dark mode. Confirm charts repaint with the new palette.
3. Add a new chart card: **average test duration per `@feature` tag** (last run). You'll modify:
   - `reports/custom-reporter.ts` — emit `byFeatureDuration: { auth: 1200, cart: 850, … }`
   - `templates/qa-metrics-dashboard.html` — add `<canvas id="chart-feature-duration">` and the render function
4. Open a PR. Confirm the artifact in CI shows your new card.

## Self-check

- [ ] When you open the bare template (no live data), where does the data come from?
- [ ] Why does the export script create `index.html` as well as `.live.html`?
- [ ] What does `fetch-defects.ts` do when no GitHub token is available?
- [ ] Why do charts need to be destroyed and re-created on theme change?

## Further reading

- This repo's `templates/qa-metrics-dashboard.html`
- This repo's `scripts/export-dashboard-pdf.ts`, `scripts/fetch-defects.ts`
- DORA metrics — dora.dev (for inspiration on what to add)

---

**Prev:** [27 — Reporting & Allure](./27-reporting-and-allure.md) · **Next:** [29 — Flaky test triage](./29-flaky-test-triage.md)
