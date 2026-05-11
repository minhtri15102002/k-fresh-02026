# ReportPortal — Setup & Guideline

> How this repo wires **ReportPortal** (`reportportal/agent-js-playwright`) into the existing Playwright reporter array, alongside `list`, `html`, `junit`, and `allure-playwright`. ReportPortal earns its keep as the **multi-run, cross-team aggregation** layer — Allure is per-run + local; ReportPortal is the persistent dashboard the whole org reads.
>
> **Versions verified (2026-05):**
>
> | Component | Version | Notes |
> |---|---|---|
> | ReportPortal server | `v26.0.2` | Released 2026-03-12 — adds dashboard locking, 256-char description filters, nested-step attachment export |
> | `service-api` / `service-ui` | `5.15.1` / `5.15.2` | Bundled with v26.0.2 |
> | `@reportportal/agent-js-playwright` | `5.4.0` | npm — released 2026-02-05 |
> | `@reportportal/client-javascript` | `5.5.10` | transitive dep of the agent |
> | `@playwright/test` | `^1.59.1` | already in [`package.json`](../../package.json) |
> | `allure-playwright` | `^3.7.2` | already in [`package.json`](../../package.json); kept in parallel — see §When to use what |

---

## When to reach for ReportPortal

Use when:

- You need **multi-run trend analytics** across weeks of CI runs (pass-rate slope, defect-arrival vs fix-rate, flake history per spec). Allure shows one run; ReportPortal shows the last 100.
- You need a **cross-team dashboard** that PMs, SREs, and engineers all open at the same URL — without an HTML artefact download dance.
- You want **AI-assisted defect classification** (auto-analysis, unique-error grouping) on failures — ReportPortal's auto-analyzer (`service-auto-analyzer 5.15.1`) clusters identical stack traces across runs.
- You need to **link a failed test directly to a Jira / Azure / GitLab ticket** from the report (via `plugin-bts-jira-cloud 5.13.9` or the Azure / GitLab plugins listed in the v26.0.2 release).
- You're already submitting JUnit XML elsewhere and want to **upgrade reporting depth** without rewriting the suite.

Avoid when:

- You only need a single-run report for a local debug session — `npx playwright show-report` is faster.
- You don't have somewhere to host the server (it's a backend service: PostgreSQL + RabbitMQ + Elasticsearch + several Spring services). Use ReportPortal's [SaaS](https://reportportal.io/installation) tier, or stay on Allure + the in-repo dashboard, until ops budget is real.
- You're tempted to make ReportPortal the **only** reporter. Keep `list` for live CI logs and `junit` for the existing dashboard contract — see §Reporter array discipline.

---

## The picture

```
┌──────────────────────┐         ┌────────────────────────────────────┐
│  Playwright workers  │ ──HTTP→ │  ReportPortal server  (v26.0.2)    │
│  (each test = item)  │         │   ├── service-api   5.15.1         │
└──────────────────────┘         │   ├── service-ui    5.15.2         │
   │                             │   ├── auto-analyzer 5.15.1 (AI)    │
   │ also writes locally:        │   └── plugin-bts-jira-cloud 5.13.9 │
   ├──► html  → playwright-report/                                    │
   ├──► junit → reports/junit.xml  ──► QA Metrics Dashboard panels    │
   ├──► allure → allure-results/   ──► single-run deep dive           │
   └──► list  → stdout (CI tail)                                      │
```

ReportPortal complements the existing reporters — it does **not** replace any of them. The JUnit feed still drives [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html); ReportPortal sits in parallel.

---

## Step-by-step setup

### Step 1 — Provision the server

Pick one path:

| Path | Effort | When to use |
|---|---|---|
| **SaaS** at [reportportal.io](https://reportportal.io/) | 0 ops, paid above free tier | Pilots, < 5 contributors, no infra team |
| **Docker Compose (self-host)** | ~30 min on a small VM | The standard team install — see below |
| **Helm chart on Kubernetes** | ~2 hr + ongoing ops | Large orgs with platform team — see [`reportportal/kubernetes`](https://github.com/reportportal/kubernetes) |

For the Docker Compose lane, pin to the v26.0.2 manifest:

```bash
mkdir -p ~/reportportal && cd ~/reportportal

curl -L -o docker-compose.yml \
  https://raw.githubusercontent.com/reportportal/reportportal/v26.0.2/docker-compose.yml

docker compose -p reportportal up -d --force-recreate
```

The UI is then served at `http://<host>:8080` (default). First-login creds: `superadmin / erebus` — **rotate immediately**, and do it before opening the port to a wider network.

### Step 2 — Create a project + API key

In the UI:

1. **Administrate → Projects → Create Project** — name it after the repo (e.g. `ai-qa-training`).
2. **User Profile (top-right) → Configuration examples → Profile** — copy your **API key** (UUID-shaped).
3. **Settings → Defect Types** — verify the four built-in defect categories (`Product Bug`, `Auto Bug`, `System Issue`, `To Investigate`) match your team's bug taxonomy. If not, add sub-types now — renames after you've classified 1000 failures are painful.

### Step 3 — Install the Playwright agent

```bash
npm install --save-dev @reportportal/agent-js-playwright@5.4.0
```

This pulls in `@reportportal/client-javascript@5.5.10` transitively. **Pin** the agent version — pre-5.x agents won't talk to a v26.0.2 server's `/api/v2` endpoint.

### Step 4 — Wire credentials via env vars (never commit them)

Add to `profiles/.env.<ENV>` (already gitignored — see [`env.loader.ts`](../../env.loader.ts)):

```bash
# profiles/.env.qa
RP_ENDPOINT=https://reportportal.example.com/api/v2
RP_API_KEY=<paste-uuid-from-Step-2>
RP_PROJECT=ai-qa-training
RP_LAUNCH=qa-nightly
```

Three rules, no exceptions:

1. **Never** put the API key in `playwright.config.ts` literally — always read via `process.env.*`.
2. Use the **`/api/v2`** endpoint (asynchronous). The v1 endpoint blocks each request and is ~5x slower for big suites.
3. The launch name should be **stable per pipeline** (e.g. `qa-nightly`, `pr-smoke`) so ReportPortal groups them in the trend view. A timestamped launch name (`qa-2026-05-11T08:41`) breaks the trend.

### Step 5 — Add the reporter to `playwright.config.ts`

The repo's reporter array currently has `list`, `html`, `junit`, `allure-playwright`, and a custom Slack/email reporter at `./reports/custom-reporter.ts` (see lines 18-41 of [`playwright.config.ts`](../../playwright.config.ts)). **Append** ReportPortal — do not remove anything:

```typescript
import { defineConfig } from '@playwright/test';

const RP_ENABLED =
  Boolean(process.env.RP_ENDPOINT) && Boolean(process.env.RP_API_KEY);

const reporters: any[] = [
  ['list'],
  ['html', { open: 'never' }],
  ['junit', { outputFile: 'reports/junit.xml' }],
  ['allure-playwright', { detail: true, outputFolder: 'allure-results' }],
  ['./reports/custom-reporter.ts'],
];

if (RP_ENABLED) {
  reporters.push([
    '@reportportal/agent-js-playwright',
    {
      apiKey: process.env.RP_API_KEY,
      endpoint: process.env.RP_ENDPOINT,
      project: process.env.RP_PROJECT,
      launch: process.env.RP_LAUNCH ?? 'local-debug',
      attributes: [
        { key: 'env', value: process.env.ENV ?? 'qa' },
        { key: 'branch', value: process.env.GITHUB_REF_NAME ?? 'local' },
        { key: 'sha', value: (process.env.GITHUB_SHA ?? '').slice(0, 7) },
      ],
      description: `Playwright run for ${process.env.GITHUB_REPOSITORY ?? 'local'}`,
      includeTestSteps: true,            // surface test.step() blocks as nested items
      uploadVideo: true,
      uploadTrace: true,
      launchUuidPrintOutput: 'ENVIRONMENT', // exposes RP_LAUNCH_UUID to subsequent CI steps
      launchUuidPrint: true,
      restClientConfig: { timeout: 30_000, retry: 3 },
    },
  ]);
}

export default defineConfig({
  reporter: reporters,
  // ...rest of existing config unchanged
});
```

The `RP_ENABLED` gate is deliberate — local runs without `RP_*` vars stay quiet (no failed network calls polluting stdout); CI sets the vars and the reporter activates.

### Step 6 — Verify with a single test

```bash
ENV=qa \
RP_LAUNCH=smoke-verify \
npx playwright test tests/ui/test-cart.spec.ts:1 --project="Desktop Chrome"
```

Then in the UI: **Launches → qa-nightly (or whatever launch you used) → click in**. You should see the test, its `test.step()` nesting, video, trace, and console output as attachments.

If nothing appears:

- 401 / 403 → `RP_API_KEY` invalid or rotated.
- 404 → the `RP_PROJECT` doesn't exist (case-sensitive!) or the `/api/v2` suffix is missing on `RP_ENDPOINT`.
- Hang at run-end → asynchronous queue still flushing; the reporter waits up to ~30s. Increase `restClientConfig.timeout` if your network is slow.

### Step 7 — Wire CI

Add the env vars to your CI secrets. For GitHub Actions, in [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml):

```yaml
env:
  RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
  RP_API_KEY: ${{ secrets.RP_API_KEY }}
  RP_PROJECT: ${{ vars.RP_PROJECT }}      # non-secret; visible in logs
  RP_LAUNCH: ${{ github.workflow }}-${{ github.ref_name }}
```

After the run step, you can pin the launch URL into the job summary:

```yaml
- name: Append ReportPortal launch link to job summary
  if: always() && env.RP_LAUNCH_UUID != ''
  run: |
    echo "## ReportPortal launch" >> "$GITHUB_STEP_SUMMARY"
    echo "[Open in ReportPortal]($RP_ENDPOINT/ui/#${RP_PROJECT}/launches/all/${RP_LAUNCH_UUID})" \
      >> "$GITHUB_STEP_SUMMARY"
```

`RP_LAUNCH_UUID` is exported because we set `launchUuidPrintOutput: 'ENVIRONMENT'` in Step 5.

---

## Reporting API — when you need more than the defaults

The agent exposes a `ReportingApi` for in-test enrichment. Use it sparingly — **most cases are covered by `test.step()` and `testInfo.attach()`**, which the agent picks up automatically.

```typescript
import { test, expect } from '@playwright/test';
import { ReportingApi } from '@reportportal/agent-js-playwright';

test('add item to cart @P1 @smoke @cart', async ({ page }) => {
  // Tag the test in ReportPortal with the same priority/severity used in
  // prompts/core/test-tags.md so the dashboards line up
  ReportingApi.addAttributes([
    { key: 'priority', value: 'P1' },
    { key: 'module', value: 'cart' },
  ]);

  // Stable test-case ID across reruns / refactors — preserves history when
  // the spec file moves
  ReportingApi.setTestCaseId('cart.add-item.happy-path');

  await test.step('open product page', async () => {
    await page.goto('/product/imac');
  });

  await test.step('add to cart', async () => {
    await page.getByRole('button', { name: /add to cart/i }).click();
  });

  await expect(page.getByTestId('cart-counter')).toHaveText('1');
});
```

Map the agent's attributes to the repo's tag taxonomy ([`prompts/core/test-tags.md`](../../prompts/core/test-tags.md)) and defect labels ([`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)) so a failure routes the same way whether it's read from the dashboard or from ReportPortal.

---

## ReportPortal vs the other reporters in this repo

| Concern | `list` | `html` | `junit` | `allure-playwright` | **ReportPortal** |
|---|---|---|---|---|---|
| **Best for** | CI live tail | Local single-run deep dive | Dashboard feed (machine-readable) | Local rich single-run report | **Multi-run trends, cross-team UI, AI defect grouping** |
| **Audience** | Engineer reading CI log | Engineer post-run | The QA Dashboard | Engineer / QA lead | PMs, SREs, QA leads, engineers |
| **Persisted across runs** | ❌ (in CI log only) | ❌ (artefact per run) | ⚠️ via dashboard | ❌ (artefact per run) | ✅ (server-side) |
| **Trend analytics (last N runs)** | ❌ | ❌ | ⚠️ via dashboard SQL | ❌ | ✅ native widgets |
| **Per-test history** | ❌ | ❌ | ❌ | ❌ | ✅ via `setTestCaseId` |
| **Auto-grouping of identical failures** | ❌ | ❌ | ❌ | ⚠️ manual categories | ✅ auto-analyzer 5.15.1 |
| **Bug-tracker linking** | ❌ | ❌ | ❌ | ⚠️ manual links | ✅ Jira/Azure/GitLab plugins |
| **Run-time overhead** | 0 ms | ~50 ms | ~10 ms | ~100 ms | ~200 ms (async) |
| **Hosting required** | none | none | none | none (HTML artefact) | ⚠️ server (or SaaS) |
| **Vendor lock-in** | none | none | none | low (OSS, JSON) | medium (server schema; OSS) |

**Rule of thumb:** keep all four local reporters; **add** ReportPortal as a parallel feed. Only retire `allure-playwright` if (a) ReportPortal has been your team's daily-driver for 3+ months and (b) nobody opens the Allure HTML any more.

For a full side-by-side decision matrix across reporting tools, see (forthcoming) `tool-comparison.md` in this folder — author it via the [`write-document` skill](../../.agents/skills/write-document/SKILL.md), Type B.

---

## Worked example — wiring the cart-discount-expiry case

Recall the cart-discount-expiry incident (referenced in [`documents/api-testing/postman.md`](../api-testing/postman.md)). Here's how the failure surfaces across the stack with ReportPortal added:

1. **CI run starts**, `RP_LAUNCH=qa-nightly` is set; agent opens a launch.
2. The test [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) fails on the expired-discount assertion.
3. The agent ships the failure (status, stack, video, trace, attached request/response) to ReportPortal in real-time.
4. **Auto-analyzer 5.15.1** matches the stack to two prior `qa-nightly` failures and auto-classifies as `Product Bug` (because past humans labelled it so).
5. The Jira plugin (`plugin-bts-jira-cloud 5.13.9`) is configured to one-click-create a `bug` + `severity:major` + `module:cart` ticket using the labels in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md).
6. PM opens the **shared dashboard URL** (no artefact download) and sees: this is the third occurrence in 14 days; conversion rate dipped 0.6% on those days. Decision: hold the release.

The same incident, reported only via Allure HTML, would have required someone to download the artefact, open it, and manually correlate against past runs from memory. The real work ReportPortal does is **collapse that gap**.

---

## Anti-patterns this guideline rules out

- ❌ **Putting `apiKey` literally in `playwright.config.ts`.** Always `process.env.RP_API_KEY`. A leaked key = rotated key + an incident write-up.
- ❌ **Replacing `junit` with ReportPortal.** The dashboard contract (Panel #1, #2, #3, #4) consumes JUnit; killing it kills the dashboard.
- ❌ **Replacing `allure-playwright` "because RP is better".** They overlap on single-run depth but RP isn't optimised for the local debug loop. Run them in parallel until the team stops opening Allure for 3 consecutive months.
- ❌ **Timestamped launch names.** Every CI build creates a "new" thing in the trend view. Use stable launch names per pipeline; ReportPortal stamps each launch automatically.
- ❌ **One ReportPortal project for the whole org.** Project-per-repo (or per-major-product) — the launch list becomes unreadable past ~5 unrelated pipelines.
- ❌ **Letting auto-analyzer run unsupervised forever.** Spot-check classifications weekly. A wrong auto-classification trains the next wrong one.
- ❌ **Skipping `setTestCaseId`** for tests that get refactored often. Without it, the rename-then-move sequence breaks the historical trend for that test.
- ❌ **`includeTestSteps: false` on a suite that uses `test.step()`.** You lose the most useful failure-localisation feature for free.

---

## Upgrade path

| From | To | What changes |
|---|---|---|
| `agent-js-playwright` 5.3.x | `5.4.0` | Drop-in. Adds OAuth 2.0 password-grant auth (alternative to API key) — see the agent's [README.md](https://github.com/reportportal/agent-js-playwright#oauth-configuration) if SSO is in scope. |
| ReportPortal server `5.x` | `26.0.2` (current) | Versioning jumped from `5.x` → `24.x` in 2024 then to `26.x` in 2026; follow [`reportportal/migrations`](https://github.com/reportportal/migrations) (pinned to `5.15.1` in v26.0.2) before bumping — a major-version skip without running migrations corrupts launch history. |
| Allure-only → Allure + ReportPortal | (parallel) | Just append the reporter as in Step 5. No spec changes. |
| Allure → ReportPortal-only | — | **Don't.** Run parallel for ≥3 months first, then revisit. |

---

## Refresh due

**2026-11** — ReportPortal cuts a major roughly every 6 months and the Playwright agent moves with Playwright's own release cadence. Re-run the [`write-document` skill](../../.agents/skills/write-document/SKILL.md) with the latest-version sweep at that point.

---

## Related

- [`documents/metrics-reports/README.md`](./README.md) — the 64 essential QA metrics that ReportPortal widgets visualise
- [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) — the in-repo dashboard ReportPortal complements (does not replace)
- [`playwright.config.ts`](../../playwright.config.ts) — reporter array this guideline appends to (lines 18-41)
- [`profiles/`](../../profiles/) + [`env.loader.ts`](../../env.loader.ts) — where `RP_*` env vars live
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — tag taxonomy mapped to ReportPortal attributes
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — defect labels mapped to ReportPortal defect types + the Jira plugin
- [`.agents/skills/write-document/SKILL.md`](../../.agents/skills/write-document/SKILL.md) — the skill that authored this doc; re-run for the 2026-11 refresh
- [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — converts a ReportPortal failure into a labelled GitHub/Jira issue
- [`.agents/skills/trend-analysis/SKILL.md`](../../.agents/skills/trend-analysis/SKILL.md) — the trend skill that ReportPortal widgets externalise
- ReportPortal docs: [reportportal.io/docs](https://reportportal.io/docs/)
- Agent source: [reportportal/agent-js-playwright](https://github.com/reportportal/agent-js-playwright)
