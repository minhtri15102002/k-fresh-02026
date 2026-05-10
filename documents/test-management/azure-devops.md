# Azure DevOps Test Plans Integration Guideline

> How this repo uses **Azure DevOps Test Plans** (part of Azure Boards) as the **execution + reporting surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. ADO Test Plans' strength is being **bundled with Azure Pipelines** (zero-friction CI integration if you're already on the stack); its weakness is being a Microsoft-only ecosystem and having a heavier UI than TestRail / Zephyr. This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q5.
>
> Canonical vendor docs: [Azure DevOps Test Plans docs](https://learn.microsoft.com/en-us/azure/devops/test/) · [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/).

## When to pick Azure DevOps Test Plans

| Use ADO Test Plans when… | Don't pick ADO Test Plans when… |
|---|---|
| Org is already on Azure Boards / Azure Pipelines | Org is on GitHub-only / Atlassian-only stack (it's a heavy second tool) |
| .NET / Microsoft-stack development; team prefers single Microsoft surface | Team prefers separation of concerns (test cases lighter than full Boards) |
| Need GovCloud / Azure Government posture for compliance | Strong BDD round-trip (use [`xray.md`](./xray.md)) |
| Bundling cost (~$52/user/month for Basic + Test Plans) is acceptable | TCO > $30 / user / month is a deal-breaker (use [`testrail.md`](./testrail.md) or [`clickup.md`](./clickup.md)) |
| You want the Test Hub UI for manual exec (Test Runner browser app) | Lightweight TM is the only need (use [`zephyr.md`](./zephyr.md) or [`clickup.md`](./clickup.md)) |

## Project shape (ADO Test Plans)

ADO Test Plans is a tab inside an Azure DevOps project. Test Cases are **work items** of type "Test Case" — first-class citizens alongside User Story / Bug / Task.

```
Azure DevOps Organisation: contoso
└── Project: Phoenix
    ├── Boards (Stories / Bugs / Tasks)
    ├── Repos (Git)
    ├── Pipelines (CI/CD)
    └── Test Plans
        ├── Test Plan: v2.5 Regression
        │   ├── Test Suite (Static): Cart Smoke
        │   │   ├── Test Case 5001  External ID: TC-CART-04
        │   │   └── Test Case 5002  External ID: TC-CART-05
        │   ├── Test Suite (Requirement-based): from User Story 1234
        │   │   └── (auto-populated from linked Test Cases)
        │   └── Test Suite (Query-based): "Tag = @P1 AND Component = Cart"
        │       └── (auto-populated by query)
        └── Test Plan: v2.6 Regression
```

> **Convention.** ADO assigns each Test Case an internal ID (e.g., `5001`). The `External ID` custom field on every Test Case is the join key — it equals the `TC-<MODULE>-<NN>` from [`documents/manual-testcases/`](../manual-testcases/). Without this, the dashboard contract breaks.

ADO supports three suite types — **use all three**:

- **Static** — hand-curated; the default
- **Requirement-based** — auto-populated from a linked User Story; the cleanest for traceability
- **Query-based** — populated from a work-item query; useful for `tag = @P1` rollups

## Required custom fields

Add these to the Test Case work item type **once** via the project's **Process Customization** (Inheritance process or XML for older projects).

| Field name | Type | Purpose |
|---|---|---|
| `External ID` | Plain Text | The `TC-<MODULE>-<NN>` join key. Required. |
| `Test Priority` | Picklist | `P1 / P2 / P3 / P4` — derived from `@P*` tag |
| `Test Severity` | Picklist | `critical / major / minor / trivial` |
| `Module` | Picklist | Reuse Areas (`/Phoenix/Cart`, `/Phoenix/Checkout`, …) instead of a custom field |
| `Spec Path` | Plain Text | Populated by the push script |
| `Owner` (built-in `Assigned To`) | User | |

> ADO has a built-in `Priority` (1-4 numeric) — close enough; map `1=P1`, `2=P2`, etc. Don't add a redundant `Test Priority` field unless the team wants a different scale.

## Install / configuration

ADO is SaaS (`dev.azure.com`) or self-hosted (Azure DevOps Server). Repo-side wiring is just credentials + a thin push script. Most teams use the **Microsoft REST API directly**; the Azure CLI works too.

### 1. Get a Personal Access Token (PAT)

In ADO → **User Settings → Personal Access Tokens → New Token**. Scopes required: `Test Management (Read & Write)`, `Work Items (Read & Write)`, `Project (Read)`.

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
AZDO_ORG_URL=https://dev.azure.com/contoso
AZDO_PROJECT=Phoenix
AZDO_PAT=<paste-PAT-here>
AZDO_TEST_PLAN_ID=42
AZDO_TEST_SUITE_ID=43
```

### 3. Mirror them as CI secrets

Same convention as [`testrail.md`](./testrail.md) §3. **Never** commit the PAT; pre-commit `gitleaks` blocks it.

> **Tip:** if your CI is **Azure Pipelines** (not GitHub Actions), use the built-in `System.AccessToken` instead of a PAT — it's auto-issued per pipeline run and respects the project's permissions automatically.

## Import existing Markdown TCs (one-time)

```bash
# scripts/test-management/import-from-markdown.ts --tool azdo
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. POSTs to /_apis/wit/workitems/$Test%20Case for each new External ID
# 3. PATCH /_apis/wit/workitems/{id} for changed cases
# 4. Adds the new TC to the configured Test Suite via /_apis/test/Plans/{planId}/suites/{suiteId}/testcases
# 5. Idempotent
```

Endpoints used:
- `POST /{org}/{project}/_apis/wit/workitems/$Test Case?api-version=7.1` — create new (use [JSON Patch document](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create))
- `PATCH /{org}/{project}/_apis/wit/workitems/{id}?api-version=7.1` — update existing
- `POST /{org}/{project}/_apis/test/Plans/{planId}/suites/{suiteId}/testcases/{testCaseIds}` — attach to suite

> ADO Test Steps live in a special XML field (`Microsoft.VSTS.TCM.Steps`) — pivot Markdown steps into the XML format on import. Most importers wrap this; see the script.

## Push run results from Playwright (per-CI-run)

ADO has a **first-class `PublishTestResults@2` task** for Azure Pipelines that ingests JUnit XML directly. For GitHub Actions, use the REST API.

### Option A — Azure Pipelines `PublishTestResults@2` (zero-code)

```yaml
# azure-pipelines.yml
- task: PublishTestResults@2
  displayName: 'Publish Playwright JUnit results to Test Plans'
  condition: succeededOrFailed()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: 'reports/junit.xml'
    mergeTestResults: true
    testRunTitle: 'Playwright $(Build.BuildId) on $(Build.SourceBranchName)'
    publishRunAttachments: true
```

ADO matches each `<testcase classname="TC-CART-04 - …">` to the Test Case with the matching `External ID` and creates a Test Run automatically.

### Option B — REST API push (for GitHub Actions or richer payloads)

```ts
// scripts/test-management/push-results-azdo.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN: { tc_id: string; status: 'Passed'|'Failed'|'NotExecuted'|'Blocked'; duration_ms: number; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

// 1. Resolve TC-CART-04 → ADO test case id via External ID (cached)
// 2. Create a Test Run
const run = await azdo('POST', `/_apis/test/runs?api-version=7.1`, {
  name: `CI ${process.env.GITHUB_SHA?.slice(0,7)} on ${process.env.ENV ?? 'qa'}`,
  plan: { id: PLAN_ID },
  pointIds: pointIdsForCases(RUN.map(r => idMap[r.tc_id])),
});

// 3. Set results in bulk
await azdo('PATCH', `/_apis/test/Runs/${run.id}/results?api-version=7.1`,
  RUN.map(r => ({
    id: pointToResultId[idMap[r.tc_id]],
    outcome: r.status,                      // 'Passed' | 'Failed' | 'NotExecuted' | 'Blocked'
    durationInMs: r.duration_ms,
    state: 'Completed',
    comment: `Spec: ${r.spec_path}\nCI: ${process.env.GITHUB_RUN_URL}`,
  }))
);

// 4. Close the run
await azdo('PATCH', `/_apis/test/runs/${run.id}?api-version=7.1`, { state: 'Completed' });
```

> ADO's Test Run / Test Result model is the most complex of any tool in this folder; the push script is ~150 LOC vs ~80 for TestRail. Plan accordingly.

## GitHub Actions snippet

```yaml
  - name: Push run results to Azure DevOps Test Plans
    if: always() && env.AZDO_PAT != ''
    env:
      AZDO_ORG_URL: ${{ vars.AZDO_ORG_URL }}
      AZDO_PROJECT: ${{ vars.AZDO_PROJECT }}
      AZDO_PAT: ${{ secrets.AZDO_PAT }}
      AZDO_TEST_PLAN_ID: ${{ vars.AZDO_TEST_PLAN_ID }}
      AZDO_TEST_SUITE_ID: ${{ vars.AZDO_TEST_SUITE_ID }}
    run: npx ts-node scripts/test-management/push-results-azdo.ts
```

## Defect filing on failure

When an ADO Test Result is `Failed`, the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files a GitHub Issue with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). The push script then **also** creates an ADO Bug work item linked to the failing Test Case (because the dev team lives in ADO):

```ts
// after a Failed result:
const bug = await azdo('POST', `/_apis/wit/workitems/$Bug?api-version=7.1`, [
  { op: 'add', path: '/fields/System.Title', value: `[${tcId}] ${title}` },
  { op: 'add', path: '/fields/Microsoft.VSTS.Common.Severity', value: severityToAzdo(severity) },
  { op: 'add', path: '/fields/System.AreaPath', value: `Phoenix\\${module}` },
  { op: 'add', path: '/fields/System.Tags', value: `bug; severity:${severity}; module:${module}; phase:e2e; found-in:qa` },
  { op: 'add', path: '/fields/System.Description', value: `Auto-filed by CI: ${ciUrl}\nGitHub Issue: ${ghIssueUrl}` },
]);
// Link the Bug to the Test Case via "Tested By"
await azdo('PATCH', `/_apis/wit/workitems/${testCaseId}?api-version=7.1`, [
  { op: 'add', path: '/relations/-', value: {
    rel: 'Microsoft.VSTS.Common.TestedBy-Reverse',
    url: bug.url,
  }},
]);
```

The ADO Bug is a **mirror**, not the system of record. The system of record is the GitHub Issue (or Jira Bug if Jira is the dev tracker). If your dev team lives **only** in ADO and doesn't use GitHub Issues at all, treat the ADO Bug as system of record and skip the GitHub mirror — but document the choice in the team's [`quality-org-charter`](../../.agents/skills/quality-org-charter/SKILL.md).

## Reporting → QA Metrics Dashboard

ADO runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly.

ADO's own **Analytics views** (Power BI integration via OData) are useful for cross-cutting metrics (trend across multiple Test Plans). Use them as a **read-only cross-check** for the [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html).

## Test Hub & Test Runner — the manual exec surface

ADO Test Plans includes the **Test Hub** (web) and **Test Runner** (browser-based) for manual execution by non-engineers. Reasonable for:

- Stakeholder sign-off runs at release time
- Exploratory testing sessions (with the Test & Feedback browser extension)
- Re-running a small TC subset on a different env

Don't use it for what Playwright already does (regression). Manual hours are scarce; spend them on exploratory.

## Anti-patterns specific to ADO Test Plans

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Nesting Test Suites > 3 levels | UI navigation slows; users lose tests | Flatten; use Tags / Areas for sub-categorisation |
| Storing test data in the Test Case `Parameters` field for hundreds of cases | Hard to maintain; no version control | Test data in repo (`tests/data/`); reference by file path |
| Skipping `External ID` because ADO's internal ID seems unique enough | Tied to one ADO project; project rename / migration breaks everything | `External ID = TC-<MODULE>-<NN>` is the canonical join key |
| Letting ADO's Severity field disagree with `@severity:*` tags | Reports mismatch the dashboard | Push script normalises tag → enum on every run |
| Using ADO Test Plans without Azure Boards | Mixed dev tracker = doubled overhead | Either commit to ADO end-to-end or use [`testrail.md`](./testrail.md) instead |
| Manual exec without Test Runner; just clicking through Test Hub | Pass / fail not captured per step | Use Test Runner; it captures step state and screenshots |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick ADO Test Plans vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that ADO mirrors
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that ADO fields must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — skills that read / write ADO-formatted artifacts
- [Azure DevOps Test Plans docs](https://learn.microsoft.com/en-us/azure/devops/test/), [Azure DevOps REST API](https://learn.microsoft.com/en-us/rest/api/azure/devops/) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Project shape + Suite types | ✅ v1 | QA Platform |
| Import from Markdown | ✅ v1 (script ≤ 200 LOC target) | QA Platform |
| Push results (Pipelines task + REST) | ✅ v1 | QA Platform |
| Defect mirror to ADO Bug | ✅ v1 (mirror, not source-of-truth) | QA Lead |
