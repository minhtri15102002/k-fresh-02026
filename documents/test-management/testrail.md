# TestRail Integration Guideline

> How this repo uses **TestRail** as the **execution + reporting surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. TestRail's strength is project-isolation, clean REST API, and stakeholder reports; its weakness is being a **separate vendor from Jira** (sync is one-way and lossy). This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q7.
>
> Canonical vendor docs: [TestRail Customer API](https://support.gurock.com/hc/en-us/categories/7077979742868-TestRail-API).

## When to pick TestRail

| Use TestRail when… | Don't pick TestRail when… |
|---|---|
| Standalone QA org or QA-at-an-agency with multi-client work | Org is fully Jira-locked and refuses a second vendor (use [`xray.md`](./xray.md) or [`zephyr.md`](./zephyr.md) instead) |
| You need clean project-isolation (one project per client / product line) | You need first-class BDD round-trip (use [`xray.md`](./xray.md)) |
| You need the cleanest REST API of the bunch (the `add_results_for_cases` endpoint is the gold standard for Playwright integration) | You're regulated by FDA / GxP and need a full validation pack out of the box (use [`qtest.md`](./qtest.md)) |
| You will live in TestRail's UI for stakeholder reports | You're a Microsoft / Azure shop with paid ADO licences (use [`azure-devops.md`](./azure-devops.md)) |
| TCO of ~$36-72/user/month is acceptable | Free / cheap-tier mandatory (consider [`clickup.md`](./clickup.md) or staying with Markdown only) |

## Project shape

```
TestRail Project (one per product / client)
└── Suite Mode: "Multiple Suites with Baseline Support" (recommended)
    ├── Suite: UI Regression
    │   ├── Section: Cart
    │   │   ├── Case C-101  External ID: TC-CART-04   ← matches documents/manual-testcases/ui/cart/TC-CART-04.md
    │   │   └── Case C-102  External ID: TC-CART-05
    │   ├── Section: Checkout
    │   ├── Section: Register
    │   └── …
    ├── Suite: API Regression
    │   └── Section: Cart
    │       ├── Case C-301  External ID: TC-CART-API-03
    │       └── …
    └── Suite: Mobile
        └── Section: Cart
            └── …
└── Milestones (one per release / sprint)
└── Test Plans (one per environment / config combo)
└── Test Runs (one per CI run; created by push-results-testrail.ts)
```

> **Convention.** The `External ID` custom field on every Case is the join key — it equals the `TC-<MODULE>-<NN>` from [`documents/manual-testcases/`](../manual-testcases/). Without this, the dashboard contract breaks.

## Required custom fields

Add these to your TestRail Case template **once**. They are populated by the import script and updated by the push script.

| Field name | Type | Purpose |
|---|---|---|
| `external_id` (Text) | Text | The `TC-<MODULE>-<NN>` join key. Required. |
| `priority` | Dropdown | `P1 / P2 / P3 / P4` — derived from the `@P*` tag on the Playwright spec |
| `severity` | Dropdown | `critical / major / minor / trivial` — derived from the `@severity:*` tag |
| `module` | Dropdown | `cart / checkout / register / wishlist / profile / address / compare / product / home` |
| `feature` | Text | The `@feature:*` tag value (free text) |
| `spec_path` | Text | `tests/ui/test-cart.spec.ts:42` — populated by push-results script |
| `owner` | Text | Owner GitHub handle |

> Do **not** add a "Test Type" field that disagrees with [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md). Reuse the same taxonomy.

## Install / configuration

TestRail is SaaS or self-hosted; setup is via the admin UI. The repo-side wiring is just credentials + a thin push script.

### 1. Get an API key

In TestRail, go to **My Settings → API Keys → Add Key**. Copy the key.

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
TESTRAIL_URL=https://yourorg.testrail.io
TESTRAIL_USER=ci-bot@yourorg.com
TESTRAIL_API_KEY=<paste-key-here>
TESTRAIL_PROJECT_ID=12
TESTRAIL_SUITE_ID=4
```

### 3. Mirror them as CI secrets

GitHub Actions: **Settings → Secrets and variables → Actions → New repository secret**. Mirror every var above. The `env.loader.ts` already handles the local-vs-CI fallback.

> **Never** commit the API key. Pre-commit `gitleaks` blocks it; if it ever lands, rotate the key immediately and follow [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks".

## Import existing Markdown TCs (one-time)

```bash
# scripts/test-management/import-from-markdown.ts --tool testrail
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. Parses front-matter + steps
# 3. POSTs to TestRail add_case for each new external_id
# 4. PATCHes update_case for any existing case where the .md hash has changed
# 5. Idempotent — safe to run on every PR that touches manual-testcases/
```

The script is added per-repo when you adopt TestRail; keep it ≤ 200 lines. The TestRail REST endpoints used:

- `GET /index.php?/api/v2/get_cases/{project_id}&suite_id={suite_id}` — list existing
- `POST /index.php?/api/v2/add_case/{section_id}` — create new
- `POST /index.php?/api/v2/update_case/{case_id}` — update existing

## Push run results from Playwright (per-CI-run)

This is where TestRail earns its keep. After Playwright finishes, post results in **one bulk call** per run.

```ts
// scripts/test-management/push-results-testrail.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN_SUMMARY: { tc_id: string; status: 'passed'|'failed'|'skipped'; duration_ms: number; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

// 1. Resolve TC-CART-04 → TestRail case_id via external_id (cached locally as reports/testrail-id-map.json)
// 2. Create a Run for this CI build
const run = await tr('POST', `add_run/${PROJECT_ID}`, {
  suite_id: SUITE_ID,
  name: `CI ${process.env.GITHUB_SHA?.slice(0,7)} on ${process.env.ENV ?? 'qa'}`,
  include_all: false,
  case_ids: RUN_SUMMARY.map(r => idMap[r.tc_id]).filter(Boolean),
});

// 3. Bulk-add results in one call (TestRail's killer feature; avoids per-case round-trips)
await tr('POST', `add_results_for_cases/${run.id}`, {
  results: RUN_SUMMARY.map(r => ({
    case_id: idMap[r.tc_id],
    status_id: { passed: 1, blocked: 2, untested: 3, retest: 4, failed: 5 }[r.status] ?? 5,
    elapsed: secondsToTrFormat(r.duration_ms),
    comment: `Spec: ${r.spec_path}\nCI: ${process.env.GITHUB_RUN_URL}`,
  })),
});

// 4. Close the run if this is a release tag, else leave open for retest
if (process.env.GITHUB_REF?.startsWith('refs/tags/')) {
  await tr('POST', `close_run/${run.id}`, {});
}
```

The `add_results_for_cases` endpoint is **the** reason TestRail integrates well — one HTTP call per run, no rate-limit pain.

## GitHub Actions snippet

Add to the post-test job in `.github/workflows/e2e.yml`:

```yaml
  - name: Push run results to TestRail
    if: always() && env.TESTRAIL_URL != ''
    env:
      TESTRAIL_URL: ${{ secrets.TESTRAIL_URL }}
      TESTRAIL_USER: ${{ secrets.TESTRAIL_USER }}
      TESTRAIL_API_KEY: ${{ secrets.TESTRAIL_API_KEY }}
      TESTRAIL_PROJECT_ID: ${{ vars.TESTRAIL_PROJECT_ID }}
      TESTRAIL_SUITE_ID: ${{ vars.TESTRAIL_SUITE_ID }}
    run: npx ts-node scripts/test-management/push-results-testrail.ts
```

> The `if: always()` ensures the run is recorded even on test failure. The `env.TESTRAIL_URL != ''` guard makes the step a no-op for forks / contributors who don't have the secret.

## Defect filing on failure

When a TestRail result is `failed`, the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files a GitHub Issue with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Then back-link the GitHub Issue URL into the TestRail result comment via the same push script (one extra `update_result` call).

```ts
// after POSTing results, for each failure:
await tr('POST', `update_result/${result_id}`, {
  comment: existingComment + `\n\nDefect: ${githubIssueUrl}`,
  defects: githubIssueNumber,        // TestRail's "Defects" field accepts a CSV
});
```

The TestRail "Defects" field is **a mirror, not a system of record**. The system of record is the GitHub Issue.

## Reporting → QA Metrics Dashboard

TestRail run data flows into `reports/run-summary.json` (the dashboard contract — see [`README.md`](./README.md) §"How tool runs reach the QA Metrics Dashboard"). The push script writes one row per TC; the dashboard's Panel #1 / #4 / #5 read it directly.

Optional second step: TestRail's own **Reports → Defects** export can be cross-checked against `reports/defects.json` to surface drift. If the two disagree by > 5% in any run, the [`defect-insights`](../../.agents/skills/defect-insights/SKILL.md) skill flags it as a process issue (someone edited a defect in TestRail without a GitHub round-trip).

## Anti-patterns specific to TestRail

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Single-Suite mode | Re-naming and folder-renaming becomes painful at scale | Use **Multiple Suites with Baseline Support** from day 1 |
| TestRail as the test text source-of-truth | Breaks portability; tool migration becomes a nightmare | Markdown is canonical; TestRail is derived |
| Hand-creating Test Runs in the UI for every CI build | Drift; humans forget; runs go missing | `push-results-testrail.ts` creates the run automatically |
| Storing Playwright spec text in TestRail's Case "Steps" field | Two truths; impossible to keep in sync | TestRail Case has a brief title + link to spec; Markdown TC carries the steps |
| Letting TestRail's "Type" / "Priority" enums drift from `@P*` tag taxonomy | Reports don't match the dashboard | Push script normalises tag → enum on every run |
| Using TestRail Server (self-hosted) without a backup plan | Single-machine outage = total QA outage | Either Cloud or Server with daily DB backup; document RTO/RPO |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick TestRail vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that TestRail mirrors
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that TestRail enums must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md) — reads TestRail to build Panel #4 of the dashboard
- [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — files GitHub Issues; TestRail mirrors via the Defects field
- [TestRail Customer API](https://support.gurock.com/hc/en-us/categories/7077979742868-TestRail-API) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Project shape + custom fields | ✅ v1 | QA Platform |
| Import from Markdown | ✅ v1 (script ≤ 200 LOC target) | QA Platform |
| Push results from Playwright | ✅ v1 (`add_results_for_cases` bulk pattern) | QA Platform |
| Defect mirror to GitHub | ✅ v1 (mirror, not source-of-truth) | QA Lead |
