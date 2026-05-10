# ai-qa-training — E-Commerce Playground Automation Testing

> AI-assisted QA automation training repo built on **Playwright + TypeScript** with a strict **Page Object Model (POM)** structure, Allure reporting, multi-channel run notifications, a live **QA Metrics Dashboard** (test execution + defects + requirements traceability), and a curated library of prompts/skills for AI-assisted test authoring.

**Website Under Test:** https://ecommerce-playground.lambdatest.io/

**Wiki:** https://github.com/khanhdodang/ai-qa-training/wiki

---

## Table of Contents

- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [npm Scripts](#npm-scripts)
- [Running Tests](#running-tests)
- [Tooling & Conventions](#tooling--conventions)
- [Git Hooks (Husky)](#git-hooks-husky)
- [Reporting](#reporting)
- [QA Metrics Dashboard](#qa-metrics-dashboard)
- [Run-Result Notifications](#run-result-notifications)
- [Test Tagging Convention](#test-tagging-convention)
- [Defect Labels](#defect-labels)
- [Knowledge Base](#knowledge-base)
- [AI Prompt Library](#ai-prompt-library)
- [Agent Skills](#agent-skills)
- [Coding Standards](#coding-standards)
- [Contributing](#contributing)
- [Notes](#notes)
- [License](#license)

---

## Technologies

- Playwright
- TypeScript (strict mode, `bundler` module resolution)
- Node.js (>= 18, LTS v24.x recommended, latest v25.x supported)
- Page Object Model (POM)
- ESLint (flat config) + Husky + lint-staged + Commitlint
- Allure Report 3

---

## Project Structure

| Folder/File | Description |
|---|---|
| `.agents/skills/` | Reusable agent skills (test gen, eval, etc.) |
| `.github/` | GitHub workflows and CI/CD configurations |
| `.husky/` | Git hooks (`pre-commit`, `pre-push`, `commit-msg`, `post-merge`) |
| `artifacts/` | Generated dashboard outputs (`qa-metrics-dashboard.pdf`, `.live.html`) — gitignored |
| `data/` | Test data files |
| `documents/` | Framework docs + manual test cases (POM, automation-framework/*, manual-testcases/) |
| `knowledge-base/` | UI + API domain knowledge fed to AI prompts |
| `locators/` | Pure locator definitions (no behavior) |
| `models/` | Data models and interfaces |
| `pages/` | Page Object Model (POM) classes (`api/`, `ui/`); `base-page.ts` enforces test-tag guardrail |
| `profiles/` | Per-environment `.env` configurations |
| `prompts/` | AI prompt library (core / advanced / devops / reporting) |
| `reports/` | Custom Playwright reporter (Slack / Google Chat / Email) + run/defect JSON outputs |
| `scripts/` | Operational scripts: `fetch-defects.ts`, `export-dashboard-pdf.ts` |
| `templates/` | Source-of-truth dashboard HTML (`qa-metrics-dashboard.html`) |
| `tests/` | UI + API test cases (`tests/ui/`, `tests/api/`, including `tests/api/test-security.spec.ts`) |
| `utilities/` | Helper functions and reusable utilities |
| `wiki/` | Source-controlled wiki pages (mirror of GitHub Wiki, including `QA-Metrics-Dashboard.md`) |
| `allurerc.mjs` | Allure 3 configuration |
| `eslint.config.mjs` | ESLint flat configuration |
| `playwright.config.ts` | Playwright projects + reporters |
| `tsconfig.json` | TypeScript strict configuration |

---

## Prerequisites

Before running this project, make sure the following are installed:

- Node.js (>= 18, LTS v24.x recommended, latest v25.x supported)
- npm

Check installed versions:

```bash
node -v
npm -v
```

---

## Installation

```bash
# 1. Clone
git clone https://github.com/khanhdodang/ai-qa-training.git
cd ai-qa-training

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
```

---

## npm Scripts

| Script | What it does |
|---|---|
| `npm test` | Run tests on Chromium (default). Auto-runs `posttest` → `export:dashboard`. |
| `npm run test:all` | Run on Chromium + Firefox + WebKit. Auto-runs `posttest:all` → `export:dashboard`. |
| `npm run test:chrome` | Run tests on Chromium. |
| `npm run test:firefox` | Run tests on Firefox. |
| `npm run test:webkit` | Run tests on WebKit. |
| `npm run test:ui` | Open Playwright UI Mode. |
| `npm run test:debug` | Run with the Playwright Inspector. |
| `npm run codegen` | Launch Playwright Codegen against the UAT site. |
| `npm run linter` | ESLint with `--fix`. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run check:all` | Lint + typecheck (used by `pre-push`). |
| `npm run allure-generate` | Generate static Allure HTML into `allure-report/` (config in `allurerc.mjs`). |
| `npm run allure-serve` | Live Allure server. |
| `npm run report` | Generate + serve the Allure report in one go. |
| `npm run show-report` | Open Playwright HTML report. |
| `npm run fetch:defects` | Pull `bug`-labelled GitHub Issues into `reports/defects.json` (see [Defect Labels](#defect-labels)). |
| `npm run export:dashboard` | Refresh `reports/defects.json`, render the QA Metrics Dashboard to `artifacts/qa-metrics-dashboard.pdf` + `.live.html`. |

---

## Running Tests

### Chromium (default)

```bash
npm test
# or
npm run test:chrome
```

### All browsers

```bash
npm run test:all
```

### Firefox / WebKit

```bash
npm run test:firefox
npm run test:webkit
```

### UI Mode

```bash
npm run test:ui
```

### Debug Mode

```bash
npm run test:debug
```

### Playwright Code Generator

Generate locators and test actions automatically:

```bash
npm run codegen
```

---

## Tooling & Conventions

- **TypeScript** in strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`.
- **Path aliases:** `@pages/*`, `@locators/*`, `@utilities/*`, `@models/*`, `@data/*`, `@tests/*`.
- **Module resolution:** `bundler` (TS 6+ compatible, no deprecation warnings).
- **Page Object Model:** locators live in `locators/`, behavior in `pages/`, assertions in `tests/`. Never put a selector in a test file.
- **Naming:** kebab-case files, PascalCase classes, camelCase methods. Locator naming convention (cheat sheet of element prefixes): [`prompts/core/locators-naming.md`](./prompts/core/locators-naming.md).
- **Test tags:** every test carries one priority + one severity tag (see [Test Tagging Convention](#test-tagging-convention)).
- **Imports:** absolute path aliases for cross-folder imports, relative for siblings.

See [`documents/OOP_POM_Documentation.md`](./documents/OOP_POM_Documentation.md) and [`documents/automation-framework/`](./documents/automation-framework/) for the full framework spec.

---

## Git Hooks (Husky)

| Hook | Command | Purpose |
|---|---|---|
| `pre-commit` | `npx lint-staged` | ESLint `--fix` on staged `*.{js,ts}`. |
| `commit-msg` | `commitlint` | Enforce Conventional Commits. |
| `pre-push` | `npm run check:all` + `.only` guard | Lint + typecheck, blocks pushes containing `.only` in `tests/`. |
| `post-merge` | post-merge automations | Refresh deps when `package-lock.json` changes. |

> **Tip:** if `pre-push` blocks you with `Detected '.only' left in the tests code!`, remove the `test.only(...)` / `describe.only(...)` and re-push.

Full guide: [`documents/husky-guidelines.md`](./documents/husky-guidelines.md).

---

## Reporting

### Playwright HTML

After execution, open the HTML report:

```bash
npx playwright show-report
```

### Allure Report 3

The Allure CLI is a project devDependency, so no global install is needed. Configuration lives in [`allurerc.mjs`](./allurerc.mjs).

Generate a static HTML report into `./allure-report/`:

```bash
npm run allure-report
```

Or serve it on the fly with a live local server:

```bash
npm run allure-serve
```

---

## QA Metrics Dashboard

A single-page report covering execution health, defects, and requirements traceability. Renders from `templates/qa-metrics-dashboard.html` (the source-of-truth template) into two artifacts under `artifacts/`:

| Artifact | Use |
|---|---|
| `artifacts/qa-metrics-dashboard.pdf` | Stakeholder-friendly print export. Light theme, A4. |
| `artifacts/qa-metrics-dashboard.live.html` | Self-contained snapshot — JSON inputs are inlined as base64 data URLs, so it opens directly in a browser (no server, no CORS). |

A Markdown mirror of the same content lives at [`wiki/QA-Metrics-Dashboard.md`](./wiki/QA-Metrics-Dashboard.md) for the [GitHub Wiki](https://github.com/khanhdodang/ai-qa-training/wiki).

### Refresh the dashboard

```bash
npm run export:dashboard
```

This (1) pulls fresh defect data from GitHub Issues via `scripts/fetch-defects.ts` → `reports/defects.json`, then (2) renders the template into the two artifacts using Playwright's headless Chromium. After every `npm test` / `npm run test:all` the `posttest` hook regenerates them automatically — silently ignored if the export fails so it never blocks a test run.

### Live data sources

| File | Produced by | Consumed by |
|---|---|---|
| `reports/run-summary.json` | `reports/custom-reporter.ts` after each test run | Hero pass-rate, suite table, By-priority/severity/type/feature charts |
| `reports/run-trend.json` | Same reporter (appended each run, capped at 10) | Pass-rate trend chart |
| `reports/defects.json` | `scripts/fetch-defects.ts` from `bug`-labelled GitHub Issues | Defect totals, severity/module charts, and the **Issues** table |

If a JSON file is missing the dashboard falls back to baked-in demo numbers, so the artifact is never empty.

### Dark / Light mode

The live HTML carries a floating toggle in the top-right corner. First-load preference comes from `localStorage` → `prefers-color-scheme: light` → defaults to dark; the choice persists per browser. The PDF export always renders light (Playwright forces print media), and the toggle is hidden in print so it never appears in stakeholder PDFs.

---

## Run-Result Notifications

After every `playwright test` run, the custom reporter ([`reports/custom-reporter.ts`](./reports/custom-reporter.ts)) builds a one-page run summary (env, target, pass-rate, first failed tests, …) and **fans it out to every configured channel in parallel**. If no channel is configured, the reporter is a no-op.

> **Full guide:** [`reports/README.md`](./reports/README.md) — quick-start per channel, full env-var reference, troubleshooting, and how to add a new channel.

Channels are enabled by setting the matching env vars (typically in `profiles/.env.<env>.local`):

| Channel | Required env vars | Notes |
| --- | --- | --- |
| **Google Chat** | `GOOGLE_CHAT_WEBHOOK` (or legacy `LOCAL_CI_GOOGLE_CHAT_WEBHOOK`) | Plain text body. Set `PLAYWRIGHT_DISABLE_GOOGLE_CHAT_REPORTER=1` to mute just this channel. |
| **Slack** | `SLACK_WEBHOOK_URL` (or `SLACK_WEBHOOK`) | Sends a Slack [Block Kit](https://api.slack.com/block-kit) card with header + monospace body. |
| **Email** | `EMAIL_SMTP_HOST`, `EMAIL_FROM`, `EMAIL_TO` (comma-sep). Optional: `EMAIL_SMTP_PORT` (default `587`), `EMAIL_SMTP_SECURE` (`true` for SMTPS port 465), `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`, `EMAIL_CC`, `EMAIL_BCC`, `EMAIL_SUBJECT_PREFIX`. | SMTP via `nodemailer`. Sends multipart text + HTML. |

Optional global controls:

- `NOTIFY_CHANNELS=googlechat,slack,email` — explicit allow-list. If unset, all channels with config auto-enable; if set, **only the listed channels fire** even when others are configured.
- `PLAYWRIGHT_DISABLE_NOTIFICATIONS=1` — kills every channel for this run (CI emergency switch).

Output you'll see at the end of `npx playwright test`:

```text
Notification sent: googlechat
Notification sent: slack
Notification failed (email): connect ECONNREFUSED 127.0.0.1:587
```

A single channel failing does **not** affect the others — they're dispatched via `Promise.allSettled`.

---

## Test Tagging Convention

Every test must declare exactly **one priority** (`@P1` / `@P2` / `@P3`) and **one severity** (`@critical` / `@major` / `@minor` / `@trivial`). A `test.beforeEach` guardrail in [`pages/base-page.ts`](./pages/base-page.ts) fails any test that's missing either tag (downgradable to a warning with `STRICT_TAGS=false`).

```ts
test('TC_CHK_001: Successful checkout via different shipping address',
  { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@checkout'] },
  async ({ checkoutPage }) => { /* ... */ });
```

The same tags drive `--grep` filtering in CI, the **By priority / By severity / By type / By feature** cards in the dashboard, and the Allure severity column + "priority" / "feature" labels (auto-bridged at runtime).

| Dimension | Tags |
|---|---|
| **Priority** | `@P1`, `@P2`, `@P3` (release blocker / should-pass / nice-to-have) |
| **Severity** | `@critical`, `@major`, `@minor`, `@trivial` |
| **Suite** | `@smoke`, `@regression` |
| **Type** | `@ui`, `@api`, `@hybrid` (inferred from path; override needed for hybrid) |
| **Feature** | `@auth`, `@cart`, `@checkout`, `@profile`, `@product`, `@compare`, `@wishlist`, `@home`, `@security` |

Full convention + worked examples: [`prompts/core/test-tags.md`](./prompts/core/test-tags.md).

---

## Defect Labels

Defects (GitHub Issues with the `bug` label) need consistent metadata so the dashboard's **Defects** panel can categorise them. Required labels per issue:

| Label group | Allowed values | Maps to |
|---|---|---|
| Kind | `bug` | The issue is a defect (without it the fetcher ignores it) |
| Severity | `severity:critical`, `severity:major`, `severity:minor`, `severity:trivial` | "By severity" chart |
| Module | `module:auth`, `module:cart`, `module:checkout`, `module:profile`, `module:product`, `module:compare`, `module:wishlist`, `module:home` | "By module" chart |
| Status (optional) | `status:in-progress` on open issues | "In Progress" stat card |

Anything missing a `severity:*` or `module:*` label drops into an `unknown` bucket and triggers the **Defect-label gap** callout in the dashboard. Bootstrap commands + worked examples: [`prompts/core/defect-labels.md`](./prompts/core/defect-labels.md).

```bash
gh issue create \
  --title "Add to cart shows wrong total when qty > 9" \
  --label "bug,severity:major,module:cart"

npm run fetch:defects   # pulls into reports/defects.json
npm run export:dashboard  # rebuilds the PDF + live HTML
```

---

## Knowledge Base

Domain documentation under [`knowledge-base/`](./knowledge-base/) is the source of truth feeding the AI prompts:

- **UI:** `home`, `register`, `product`, `cart`, `checkout`, `wish-list`, `address-book`, `compare-products`, `profile`
- **API:** `cart`, `cart-ui-api`

When generating new tests with AI, point the agent at the relevant knowledge-base file first so it picks up the right selectors, payloads, and acceptance criteria.

---

## AI Prompt Library

Curated prompts under [`prompts/`](./prompts/), organised by lifecycle stage:

| Category | Prompts |
| --- | --- |
| **Core** | `pom-orchestrator`, `pom-generator`, `locators-naming`, `test-tags`, `defect-labels`, `playwright-test-generator-prompt`, `test-generator`, `test-data-generator`, `manual-test-case-generator`, `failure-analyzer` |
| **Advanced** | `risk-analysis`, `visual-ai`, `visual-regression-reviewer`, `selector-healing`, `performance-analyzer`, `release-readiness` |
| **DevOps** | `ci-optimizer`, `docker-runner`, `parallel-sharding` |
| **Reporting** | `executive-summary`, `quality-score`, `sprint-health-dashboard`, `trend-analysis`, `defect-insights`, `report-summarizer` |

Each prompt is self-contained Markdown — paste it into Cursor / Claude / ChatGPT and provide the requested inputs.

---

## Agent Skills

Reusable, progressive-disclosure skills under [`.agents/skills/`](./.agents/skills/) covering:

- E2E + API testing patterns (`e2e-testing`, `api-testing-mock`, `api-security-testing`, `api-fuzzer-generator`)
- Test generation (`generate-testcase`, `generate-manual-testcase`, `playwright-test-generator`)
- Test fixing & healing (`test-fixing`, `playwright-test-healer`)
- Evaluation (`llm-evaluation`, `agent-evaluation`, `advanced-evaluation`)
- Workflow (`git-pr-workflows-git-workflow`, `git-pushing`, `git-advanced-workflows`)
- Engineering quality (`typescript-expert`, `spec-to-code-compliance`, `data-quality-frameworks`)

Skills are loaded on demand by the agent — see each `SKILL.md` for trigger conditions and usage.

---

## Coding Standards

- Use TypeScript best practices
- Follow Page Object Model structure (locators → pages → tests)
- Keep locators separated from test logic
- Reuse common methods through utility/helper classes
- Maintain readable and scalable test scripts
- Use **Conventional Commits** (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, …) — enforced by `commit-msg`

---

## Contributing

1. Branch from `main` using a descriptive name (e.g. `feat/checkout-discount-codes`).
2. Follow the POM structure — no selectors in tests, no assertions in pages.
3. Run `npm run check:all` locally; the `pre-push` hook will run it again.
4. Use Conventional Commits; messages are linted by `commit-msg`.
5. Open a PR; CI runs the full Playwright matrix.

---

## Notes

- This project is intended for learning and automation practice purposes.
- The test website is publicly available for testing and demonstration.
- Make sure the environment and dependencies are properly installed before execution.

---

## License

This project is for educational and testing purposes only. See [`SECURITY.md`](./SECURITY.md) for the security policy.
