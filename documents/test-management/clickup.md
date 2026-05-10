# ClickUp Integration Guideline

> How this repo uses **ClickUp** as a **lightweight execution + reporting surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. ClickUp's strength is being **already paid for** at most product orgs (it's the PM tool, not a TM tool); its weakness is **not being a Test Management tool** — you build TM on top of Tasks + Custom Fields, and the pattern degrades past ~200 cases. This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q6.
>
> Canonical vendor docs: [ClickUp API Docs](https://clickup.com/api).

## When to pick ClickUp

| Use ClickUp when… | Don't pick ClickUp when… |
|---|---|
| Team already lives in ClickUp daily for project management | TC volume > 200 (rebuilding TM on Custom Fields breaks down) |
| ≤ 5 QA AND ≤ 200 TCs total | Per-step pass / fail is required (use [`xray.md`](./xray.md) or [`zephyr.md`](./zephyr.md)) |
| Cost-sensitive / startup; Free Forever or Unlimited tier already covers the seat | Stakeholders need a **proper** test-run dashboard (use any real TM tool) |
| Lightweight TM as a stopgap while evaluating a real tool | Regulated industry / audit posture (use [`qtest.md`](./qtest.md)) |
| You value "one tool, end-to-end" over "best of breed" | You need cross-project rollups across many programmes |

> **Honest assessment:** ClickUp is **not a Test Management tool**. It is a project-management tool that you can **bend** into one for ≤ 200 cases. If you stay below that threshold, it's a fine choice. Above it, plan to migrate.

## Project shape (ClickUp Hierarchy)

ClickUp's hierarchy is `Workspace → Space → Folder → List → Task`. Use it like this:

```
Workspace: Phoenix
└── Space: QA
    ├── Folder: Manual Test Cases
    │   ├── List: Cart           ← one List per Module
    │   │   ├── Task TC-CART-04 (custom-fielded as a Test Case)
    │   │   ├── Task TC-CART-05
    │   │   └── …
    │   ├── List: Checkout
    │   ├── List: Register
    │   └── …
    ├── Folder: Test Runs
    │   ├── List: 2026-Sprint-12 ← one List per CI run / sprint cycle
    │   │   ├── Task TC-CART-04 (linked to canonical TC; status = Pass/Fail)
    │   │   └── …
    │   └── List: 2026-Sprint-13
    └── Folder: Defects (optional)
        └── List: Open Bugs       ← only if you don't use GitHub Issues / Jira
```

> **Convention.** The Task name is `TC-<MODULE>-<NN>` (so it's also the External ID without needing a separate field). The Task description holds the steps in Markdown. If you outgrow this, move to a real TM tool.

## Required Custom Fields (per List)

ClickUp's **Custom Fields** carry the tag taxonomy. Set them up at the **Folder level** so all child Lists inherit them.

| Field | Type | Purpose |
|---|---|---|
| `Priority` (built-in) | Dropdown | `P1 / P2 / P3 / P4` (rename ClickUp's Urgent/High/Normal/Low) |
| `Severity` | Dropdown | `critical / major / minor / trivial` |
| `Module` | Dropdown | `cart / checkout / register / wishlist / profile / address / compare / product / home` |
| `Spec Path` | Short Text | Populated by push script |
| `External ID` | Short Text | Mirrors Task name; redundant but stable across renames |
| `Last Run Result` | Dropdown | `Pass / Fail / Skip / Not Run` — overwritten on every CI run |
| `Last Run Build` | URL | GitHub Actions run URL |

> Reuse the same taxonomy as [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — never invent ClickUp-only enums.

## Install / configuration

ClickUp is SaaS. Repo-side wiring is just credentials + a thin push script.

### 1. Get an API token

In ClickUp → **Settings → Apps → API Token**. Copy the personal token. (For team automation, use a **bot user** with its own token — easier to rotate than a personal one.)

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
CLICKUP_API_TOKEN=pk_<paste-token-here>
CLICKUP_TEAM_ID=12345                          # the workspace ID
CLICKUP_TC_FOLDER_ID=98765                     # "Manual Test Cases" folder
CLICKUP_RUNS_FOLDER_ID=98766                   # "Test Runs" folder
```

### 3. Mirror them as CI secrets

Same convention as [`testrail.md`](./testrail.md) §3. **Never** commit. Pre-commit `gitleaks` blocks it.

### 4. Look up Custom Field IDs once

ClickUp identifies custom fields by UUID. Cache them:

```bash
# scripts/test-management/cache-clickup-fields.ts
# Calls GET /list/{list_id}/field, writes reports/clickup-field-ids.json
```

## Import existing Markdown TCs (one-time)

```bash
# scripts/test-management/import-from-markdown.ts --tool clickup
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. For each TC:
#    - Resolve the Module → corresponding List ID
#    - POST /list/{list_id}/task with name = TC-CART-04, description = Markdown body
#    - PUT custom field values (Priority / Severity / Module / External ID)
# 3. Idempotent (looks up by name = TC-<MODULE>-<NN>; updates if exists)
```

Endpoints used:
- `GET /list/{list_id}/task?archived=false` — list existing
- `POST /list/{list_id}/task` — create new
- `PUT /task/{task_id}/field/{field_id}` — set a custom field value
- `PUT /task/{task_id}` — update name / description

## Push run results from Playwright (per-CI-run)

Two patterns; pick one based on whether you want history.

### Pattern A — overwrite-in-place (simplest)

Update `Last Run Result` and `Last Run Build` on the canonical TC task. **Loses run history**.

```ts
// scripts/test-management/push-results-clickup.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN: { tc_id: string; status: 'passed'|'failed'|'skipped'; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

for (const r of RUN) {
  const taskId = idMap[r.tc_id];                                 // resolved by name
  if (!taskId) continue;
  await cu('PUT', `/task/${taskId}/field/${LAST_RUN_RESULT_FIELD_ID}`, {
    value: { passed: 'Pass', failed: 'Fail', skipped: 'Skip' }[r.status] ?? 'Fail',
  });
  await cu('PUT', `/task/${taskId}/field/${LAST_RUN_BUILD_FIELD_ID}`, {
    value: process.env.GITHUB_RUN_URL ?? '',
  });
}
```

### Pattern B — duplicate into a "Test Runs" List per cycle (preserves history)

Create a new List per sprint / CI run; clone TC tasks into it; record status on the clones. **Preserves history**, costs more API calls.

```ts
// At the start of CI:
const runList = await cu('POST', `/folder/${RUNS_FOLDER_ID}/list`, { name: `${cycleName}` });

for (const r of RUN) {
  const sourceTaskId = idMap[r.tc_id];
  // Duplicate the TC task into the run list
  const cloned = await cu('POST', `/list/${runList.id}/task`, {
    name: `${r.tc_id} — ${cycleName}`,
    description: `Linked: clickup://t/${sourceTaskId}\nSpec: ${r.spec_path}\nCI: ${process.env.GITHUB_RUN_URL}`,
  });
  await cu('PUT', `/task/${cloned.id}/field/${LAST_RUN_RESULT_FIELD_ID}`, {
    value: { passed: 'Pass', failed: 'Fail', skipped: 'Skip' }[r.status] ?? 'Fail',
  });
}
```

> Pattern B is what real TM tools do natively. If you find yourself needing this beyond a quarter, you've outgrown ClickUp — move to [`zephyr.md`](./zephyr.md) or [`testrail.md`](./testrail.md).

## GitHub Actions snippet

```yaml
  - name: Push run results to ClickUp
    if: always() && env.CLICKUP_API_TOKEN != ''
    env:
      CLICKUP_API_TOKEN: ${{ secrets.CLICKUP_API_TOKEN }}
      CLICKUP_TEAM_ID: ${{ vars.CLICKUP_TEAM_ID }}
      CLICKUP_TC_FOLDER_ID: ${{ vars.CLICKUP_TC_FOLDER_ID }}
      CLICKUP_RUNS_FOLDER_ID: ${{ vars.CLICKUP_RUNS_FOLDER_ID }}
    run: npx ts-node scripts/test-management/push-results-clickup.ts
```

## Defect filing on failure

Same path as everywhere else: the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files a **GitHub Issue** with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Optionally, also create a ClickUp Task (in a `Defects` List) **linked to** the failing TC task — useful if your dev team works in ClickUp:

```ts
// after a Fail status update:
const bug = await cu('POST', `/list/${DEFECTS_LIST_ID}/task`, {
  name: `[${tcId}] ${title}`,
  description: `Auto-filed by CI: ${ciUrl}\nGitHub Issue: ${ghIssueUrl}\nFailed TC: clickup://t/${tcTaskId}`,
  priority: severityToClickUpPriority(severity),                 // 1=Urgent, 2=High, 3=Normal, 4=Low
  tags: [`severity:${severity}`, `module:${module}`, `phase:e2e`, `found-in:qa`],
});
// Link the bug to the failing TC
await cu('POST', `/task/${tcTaskId}/link/${bug.id}`, {});
```

The ClickUp Task is a **mirror**, not the system of record. The system of record is the GitHub Issue.

## Reporting → QA Metrics Dashboard

ClickUp runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly.

ClickUp's own **Dashboards** feature (paid tier; widgets aggregating Tasks by Custom Field) can produce a basic stakeholder view:

- Pie chart: tasks in "2026-Sprint-12" List grouped by `Last Run Result`
- Bar chart: same, grouped by `Module × Last Run Result`
- Table: failed tasks with `Last Run Build` link

This is **good enough** at < 200 TCs. Beyond that, the [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html) is the system of record.

## Automations (use sparingly)

ClickUp's **Automations** feature is tempting but easily over-used. Useful for TM:

- "When `Last Run Result` changes to `Fail` → send Slack to #qa-alerts"
- "When `Last Run Result` changes to `Fail` for a P1 task → assign to QA Lead"

Avoid:

- "When task is created in TC List → trigger an external webhook" — too easy to break the import script
- Multi-step Automations that depend on Custom Field IDs — they break when fields are renamed

> Document every Automation in `documents/test-management/clickup-automations.md` (added when needed). Undocumented Automations rot fast.

## Anti-patterns specific to ClickUp

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Building TM on the **Free Forever** tier | Custom Fields cap (60 uses) hits hard at scale | Unlimited tier or migrate to a real TM tool |
| Storing TC steps in ClickUp Subtasks instead of the description | Subtasks pollute reporting; loses ordering on export | Steps in description Markdown; subtasks reserved for tracking issues |
| Different Module taxonomies per Folder | Reports fragment | One project-wide Custom Field set inherited from the Space |
| Skipping ClickUp's `Tags` feature in favour of a Custom Field for tags | Tags have built-in filtering / reporting | Use Tags for `@suite:smoke`, `@feature:cart-discount`, etc. |
| Using ClickUp Goals to track "% TCs Passing" | Goals API is read-only and quota-limited | Numbers belong in the [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html) |
| > 200 TCs in ClickUp | API rate-limits + UI slowness + missing TM features | File an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) for Zephyr Scale at TC #150 |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick ClickUp vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that ClickUp mirrors
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that ClickUp Custom Fields must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md), [`.agents/skills/roi-brief/SKILL.md`](../../.agents/skills/roi-brief/SKILL.md) — supporting skills
- [ClickUp API Docs](https://clickup.com/api) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Hierarchy + Custom Fields | ✅ v1 | QA Lead |
| Import from Markdown | ✅ v1 (script ≤ 200 LOC target) | QA Platform |
| Push results (overwrite + history patterns) | ✅ v1 | QA Platform |
| Defect mirror | ✅ v1 (mirror, not source-of-truth) | QA Lead |
| Honest "you'll outgrow it at 200" warning | ✅ v1 | QA Lead |
