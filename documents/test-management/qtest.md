# Tricentis qTest Integration Guideline

> How this repo uses **Tricentis qTest** as the **execution + reporting + audit-trail surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. qTest's strength is **enterprise / regulated programme support** (FDA / GxP / SOX validation packs, full audit trail, modular product family); its weakness is cost and overhead — it's overkill for teams of 10. This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q4.
>
> Canonical vendor docs: [qTest Manager API](https://api.qasymphony.com/) · [qTest Help Center](https://documentation.tricentis.com/qtest/).

## When to pick qTest

| Use qTest when… | Don't pick qTest when… |
|---|---|
| Regulated industry (FDA medical-device, GxP pharma, SOX finance, HIPAA health) | Team < 20 QA engineers (TestRail / Zephyr scale better economically) |
| Multi-year programme that will consolidate around the Tricentis ecosystem (Tosca, qTest, Pulse, Insights) | Org is fully Atlassian / Jira-locked (use [`xray.md`](./xray.md) instead — same audit posture, lower cost) |
| Need a full validation pack (IQ / OQ / PQ deliverables) out of the box | You're a startup or small product team — wait until volume justifies it |
| Strict audit trail required: who changed which step, when, and why | Lightweight TM is sufficient ([`zephyr.md`](./zephyr.md), [`testrail.md`](./testrail.md)) |
| Multi-project rollups across hundreds of releases per year | TCO > $50/user/month is a deal-breaker |

## The qTest product family

qTest is **modular**. You buy what you need; this repo's integration touches mostly **Manager** and **Insights**.

| Module | What it does | This repo's role |
|---|---|---|
| **qTest Manager** | Test case management, Test Plans, Test Runs, defect linkage | **Primary** — equivalent of TestRail / Zephyr / Xray |
| **qTest Insights** | BI / dashboards / cross-project analytics | Cross-check for Panel #4 / #5 of [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html) |
| **qTest Scenario** | BDD / Cucumber editor with Jira sync | Use only if Tosca + qTest = single ecosystem decision |
| **qTest Pulse** | Real-time CI feed of Test Runs into Manager | Optional; the push script does the same job |
| **qTest Launch** | Test runner for manual exec sessions | UI-only; no repo integration needed |
| **qTest Explorer** | Exploratory testing capture | Manual surface only |

For integration, **focus on Manager + Insights**. Pulse is nice-to-have; the push script in this repo achieves the same goal without an extra licence line.

## Project shape (qTest Manager)

```
qTest Project (one per programme — usually larger than a TestRail project)
└── Release (e.g., Phoenix v2.5)
    └── Test Cycle (e.g., Sprint 12 Regression)
        └── Test Suite (e.g., Cart Smoke)
            └── Test Run (one per scheduled execution; created by push script)
                └── Test Case (linked to a master Test Case in the Test Design tab)
                    └── Test Step
                        └── Test Step Log

Test Design (the case library, separate from Test Execution)
├── Test Module: UI Regression
│   ├── Sub-module: Cart
│   │   ├── Test Case TC-CART-04 (External ID = the same)
│   │   └── …
│   └── Sub-module: Checkout
└── Test Module: API Regression
```

> **Convention.** qTest's internal IDs (`TC-CART-04` is conveniently also a qTest "TC-" prefix) — but don't confuse them. Use the **`External ID`** custom field on every Test Case. Set it equal to the `TC-<MODULE>-<NN>` from [`documents/manual-testcases/`](../manual-testcases/).

## Required custom fields

qTest's data model is rich; only add custom fields where the built-in ones don't fit.

| Field | Type | Notes |
|---|---|---|
| `External ID` | Text | The `TC-<MODULE>-<NN>` join key. Required. |
| `Priority` (built-in) | Single-select | Map to `P1 / P2 / P3 / P4` |
| `Severity` (built-in on Defect) | Single-select | `critical / major / minor / trivial` |
| `Module` (use built-in `Test Module` hierarchy) | n/a | Folder-driven |
| `Spec Path` | Text | Populated by push script |
| `Owner` (built-in Assigned-to) | User | |
| `Validation Status` (regulated only) | Single-select | `draft / reviewed / approved / retired` — for IQ/OQ/PQ workflows |

The **Validation Status** field is what makes qTest worth its price tag in regulated shops; it gates progression of a Test Case through formal review and signature steps.

## Install / configuration

qTest is SaaS or self-hosted (OnDemand). Repo-side wiring is credentials + a thin push script.

### 1. Get an API token

In qTest Manager → **Resources → User Profile → API Token → Create Token**.

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
QTEST_BASE_URL=https://yourorg.qtestnet.com/api/v3
QTEST_API_TOKEN=<paste-token-here>
QTEST_PROJECT_ID=10042
QTEST_DEFAULT_RELEASE_ID=20084           # current release
QTEST_DEFAULT_TEST_CYCLE_ID=30126        # current sprint cycle
```

### 3. Mirror them as CI secrets

Same convention as [`testrail.md`](./testrail.md) §3. **Never** commit. Pre-commit `gitleaks` blocks it.

## Import existing Markdown TCs (one-time)

```bash
# scripts/test-management/import-from-markdown.ts --tool qtest
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. POSTs to /projects/{pid}/test-cases for each new External ID
# 3. PUTs /projects/{pid}/test-cases/{id} for changed cases
# 4. Idempotent
```

Endpoints used:
- `GET /projects/{pid}/test-cases?fields=id,name,properties` — list existing (filter client-side by External ID)
- `POST /projects/{pid}/test-cases` — create new
- `PUT /projects/{pid}/test-cases/{id}` — update existing
- `POST /projects/{pid}/modules` — build module hierarchy on first run

> qTest's `properties` array is how custom fields are read / written; map by `field_id` (cache once at startup).

## Push run results from Playwright (per-CI-run)

qTest doesn't have a JUnit ingest as clean as Xray's. Use the REST API directly with a small script.

```ts
// scripts/test-management/push-results-qtest.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN: { tc_id: string; status: 'PASS'|'FAIL'|'SKIP'|'BLOCKED'; duration_ms: number; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

// 1. Resolve TC-CART-04 → qTest test_case_id via External ID (cached)
// 2. Create or reuse a Test Run for each Test Case (qTest doesn't allow bulk run-create)
// 3. POST one execution per result
for (const r of RUN) {
  const testRunId = await ensureTestRun(idMap[r.tc_id], TEST_CYCLE_ID);
  await q('POST', `/projects/${PID}/test-runs/${testRunId}/test-logs`, {
    status: { id: STATUS_IDS[r.status] },          // resolve to qTest status_id once
    exe_start_date: new Date(Date.now() - r.duration_ms).toISOString(),
    exe_end_date: new Date().toISOString(),
    note: `Spec: ${r.spec_path}\nCI: ${process.env.GITHUB_RUN_URL}`,
    attachments: [],                                // optionally attach the trace zip via separate endpoint
  });
}
```

> **Rate-limit guard:** qTest Cloud is generous (~100 req/s) but bursts can 429. Use `p-limit(20)`.

## GitHub Actions snippet

```yaml
  - name: Push run results to qTest
    if: always() && env.QTEST_API_TOKEN != ''
    env:
      QTEST_BASE_URL: ${{ vars.QTEST_BASE_URL }}
      QTEST_API_TOKEN: ${{ secrets.QTEST_API_TOKEN }}
      QTEST_PROJECT_ID: ${{ vars.QTEST_PROJECT_ID }}
      QTEST_DEFAULT_RELEASE_ID: ${{ vars.QTEST_DEFAULT_RELEASE_ID }}
      QTEST_DEFAULT_TEST_CYCLE_ID: ${{ vars.QTEST_DEFAULT_TEST_CYCLE_ID }}
    run: npx ts-node scripts/test-management/push-results-qtest.ts
```

## Defect filing on failure

qTest has a **native Defect issue type**. For this repo's discipline (defects-as-GitHub-Issues per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)), do **both**:

1. The [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files the GitHub Issue (system of record).
2. The push script also creates a qTest Defect issue **linked to the Test Run** for stakeholder visibility:

```ts
// after a FAIL test-log post:
const defect = await q('POST', `/projects/${PID}/defects`, {
  summary: `[${tcId}] ${title}`,
  properties: [
    { field_id: SEVERITY_FIELD_ID, field_value: severityToQtest(severity) },
    { field_id: STATUS_FIELD_ID, field_value: 'New' },
    { field_id: GITHUB_ISSUE_URL_FIELD_ID, field_value: ghIssueUrl },
  ],
});
await q('POST', `/projects/${PID}/test-runs/${testRunId}/defects`, { defect_id: defect.id });
```

The qTest Defect is a **mirror**, not the system of record. The audit trail lives in qTest (good for regulated work); the workflow / triage lives in GitHub.

## Sync with Jira / Azure DevOps (the qTest "Data Heatmap")

qTest sells a paid **Manager Sync** add-on that bidirectionally syncs Test Cases / Defects with Jira (or Azure DevOps). Most teams **don't need it**:

- If you use Jira for stories, the [`documents/jira/`](../jira/) AI Agent contract already reads stories.
- The defect mirror is one-way (GitHub Issue → qTest Defect) and adequate.

Buy Manager Sync only if a regulator demands a single audit-trail surface; otherwise it doubles licence cost for marginal value.

## Reporting → QA Metrics Dashboard

qTest runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly.

qTest **Insights** is qTest's BI module — useful for cross-project rollups your custom dashboard doesn't yet handle. Two options:

- Use Insights as a **read-only cross-check** for the [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html) (recommended).
- Replace the custom dashboard with Insights (only if your auditors require Insights specifically).

## Validation pack (regulated programmes only)

For FDA / GxP work, qTest produces an **IEEE 829-style validation package** out of the box: Test Plan → Test Cases → Test Runs → Test Logs → Defects, all signed and audit-trailed. The matching artifacts in this repo:

| qTest artifact | Repo equivalent |
|---|---|
| Test Plan | [`documents/test-plans/`](../test-plans/) (when populated) + qTest Test Plan |
| Test Case | [`documents/manual-testcases/`](../manual-testcases/) **+** qTest Test Case (signed) |
| Test Run / Log | qTest (signed); `reports/run-summary.json` is the technical input |
| Defect | GitHub Issue (workflow) **+** qTest Defect (audit) |
| Sign-off | qTest's electronic-signature step (CFR Part 11 compliant); not in repo |

For non-regulated programmes, this pack is overkill — use [`xray.md`](./xray.md) or [`testrail.md`](./testrail.md).

## Anti-patterns specific to qTest

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Buying every qTest module ("Manager + Pulse + Scenario + Insights + Launch") on day 1 | TCO explodes; team uses < 30% of features | Start with Manager; add modules only after an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) |
| Storing TC text in qTest only | Migration to a cheaper tool in 3 years is a multi-month project | Markdown is canonical; qTest is derived |
| Authoring BDD scenarios in qTest Scenario AND in the repo | Round-trip drift; expensive | Pick one; if you keep both, formalise the import direction |
| Skipping the `External ID` field because qTest's own ID is "TC-…" already | Tied to one qTest project; clone breaks everything | `External ID = TC-<MODULE>-<NN>` (the canonical join key) |
| Letting qTest's status enum disagree with `@P*` / `@severity` | Reports mismatch | Push script normalises tag → enum on every run |
| Using qTest Manager Sync for Jira when the AI Agent contract already covers it | Doubled licence; doubled audit log | Skip Manager Sync unless an auditor demands it |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick qTest vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that qTest mirrors
- [`documents/test-plans/`](../test-plans/) — pairs with qTest Test Plan in regulated work
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that qTest fields must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md), [`.agents/skills/roi-brief/SKILL.md`](../../.agents/skills/roi-brief/SKILL.md) — skills that read / write qTest-formatted artifacts
- [qTest Manager API](https://api.qasymphony.com/), [qTest Help Center](https://documentation.tricentis.com/qtest/) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Project shape + module overview | ✅ v1 | QA Platform |
| Import from Markdown | ✅ v1 (script ≤ 200 LOC target) | QA Platform |
| Push results from Playwright | ✅ v1 (rate-limit guard) | QA Platform |
| Defect mirror to GitHub | ✅ v1 (mirror, not source-of-truth) | QA Lead |
| Validation pack (regulated) | ✅ v1 (FDA / GxP path documented) | QA Manager |
