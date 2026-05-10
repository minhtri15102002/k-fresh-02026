# Zephyr Integration Guideline (Scale & Squad)

> How this repo uses **Zephyr Scale** (formerly **TM4J / Test Management for Jira** by SmartBear) and **Zephyr Squad** as the **execution + reporting surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. Zephyr's strength is being **Jira-native** (one workspace, no second login); its weakness is API surface differences between Cloud / Server / DataCenter and a reduced feature set in Squad. This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q2-Q4.
>
> Canonical vendor docs:
> - Zephyr Scale Cloud — [Zephyr Scale REST API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/)
> - Zephyr Squad Cloud — [Zephyr Squad Cloud REST API](https://zephyrsquad.docs.apiary.io/)

## Zephyr Scale vs Zephyr Squad — pick one

| Question | Zephyr Scale | Zephyr Squad |
|---|---|---|
| TC count grows past 200? | ✅ scales to 100k+ | ⚠️ degrades past ~500 |
| Hierarchy: folders + parameters + shared steps? | ✅ all of the above | ⚠️ flat list + cycles |
| BDD / Cucumber steps as first-class? | ⚠️ supported, awkward | ❌ no |
| REST API quality | ⭐⭐⭐⭐ Cloud, ⭐⭐⭐ Server | ⭐⭐⭐ (Cloud has improved 2023+) |
| Reusable test data / parameters | ✅ | ❌ |
| Cost / user / month | ~$10-20 | ~$5-10 |
| Best for | Real Test Management at scale | Tiny teams / pilot programmes |

**Pick Scale unless:** you have < 100 cases AND < 5 QA AND know you'll never grow. The "Squad now, migrate later" path costs more than starting on Scale; both bills already include Atlassian Marketplace overhead.

The rest of this file documents **Zephyr Scale** unless the section is explicitly marked **Zephyr Squad**. Squad-specific deltas are called out in §"Zephyr Squad deltas" at the end.

## Project shape (Zephyr Scale)

Zephyr Scale lives **inside a Jira project** — there is no separate "Zephyr project". The Test cases are a tab next to Issues / Boards.

```
Jira Project: PHX (Phoenix product)
├── Issues  (Stories / Bugs / Tasks per documents/jira/)
├── Boards  (Scrum / Kanban)
└── Tests   ← Zephyr Scale
    ├── Folder: UI Regression
    │   ├── Folder: Cart
    │   │   ├── Test PHX-T101  External ID: TC-CART-04
    │   │   └── Test PHX-T102  External ID: TC-CART-05
    │   ├── Folder: Checkout
    │   └── …
    ├── Folder: API Regression
    │   └── Folder: Cart
    │       └── Test PHX-T301  External ID: TC-CART-API-03
    └── Folder: Mobile
└── Test Cycles    ← one per release / sprint / CI run
└── Test Plans     ← optional umbrella over multiple Cycles
```

> **Convention.** Zephyr Scale creates an internal Test key (`PHX-T101`). The `External ID` custom field on every Test is the join key to the rest of the repo and equals the `TC-<MODULE>-<NN>` from [`documents/manual-testcases/`](../manual-testcases/). Without this, the dashboard contract breaks.

## Required custom fields (Zephyr Scale)

Add these to the Test custom-field set **once** via Zephyr Scale's settings.

| Field name | Type | Purpose |
|---|---|---|
| `External ID` | Single-line text | The `TC-<MODULE>-<NN>` join key. Required. |
| `Priority` | Single-select | `P1 / P2 / P3 / P4` — derived from `@P*` tag |
| `Severity` | Single-select | `critical / major / minor / trivial` |
| `Module` | Single-select | `cart / checkout / register / wishlist / profile / address / compare / product / home` |
| `Feature` | Single-line text | `@feature:*` tag value |
| `Spec Path` | Single-line text | `tests/ui/test-cart.spec.ts:42` — populated by push script |
| `Owner` | Single-line text | Owner GitHub handle |

> Zephyr Scale already has its own native `priority` enum, but it doesn't map cleanly to our `@P1..@P4`. Use a separate custom field. Reuse the same taxonomy as [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md).

## Install / configuration

Zephyr Scale is installed at the **Jira instance level** by an Atlassian admin. The repo-side wiring is just credentials + a thin push script.

### 1. Get an API token

Cloud: log in to Jira → **App switcher → Zephyr Scale → … → API Tokens → Create**. Copy the token.

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
ZEPHYR_BASE_URL=https://api.zephyrscale.smartbear.com/v2   # Cloud; Server differs
ZEPHYR_API_TOKEN=<paste-token-here>
ZEPHYR_PROJECT_KEY=PHX
ZEPHYR_DEFAULT_FOLDER_ID=10042                              # parent folder for new tests
```

### 3. Mirror them as CI secrets

Same convention as [`testrail.md`](./testrail.md) §3. **Never** commit the token; pre-commit `gitleaks` blocks it.

## Import existing Markdown TCs (one-time)

```bash
# scripts/test-management/import-from-markdown.ts --tool zephyr-scale
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. POSTs to Zephyr Scale /testcases for each new External ID
# 3. PUTs /testcases/{key} for any existing case with a changed .md hash
# 4. Idempotent
```

Endpoints used:
- `GET /testcases?projectKey=PHX&fields=key,name,customFields` — list existing
- `POST /testcases` — create new (set `customFields.External ID`)
- `PUT /testcases/{testCaseKey}` — update existing
- `POST /folders` — create folder hierarchy on first run

## Push run results from Playwright (per-CI-run)

Zephyr Scale supports **JUnit ingest natively** (zero custom code) and **REST API for richer payloads** (recommended for this repo).

### Option A — JUnit ingest (simplest)

Zephyr Scale Cloud has a `/automations/executions/junit` endpoint that ingests a Playwright JUnit XML. Map `<testcase classname="TC-CART-04 - …">` to the External ID.

```yaml
  - name: Push run results to Zephyr Scale (JUnit)
    if: always() && env.ZEPHYR_API_TOKEN != ''
    run: |
      curl -X POST \
        -H "Authorization: Bearer ${{ secrets.ZEPHYR_API_TOKEN }}" \
        -F "file=@reports/junit.xml;type=application/xml" \
        -F "projectKey=PHX" \
        -F "autoCreateTestCases=false" \
        "${{ vars.ZEPHYR_BASE_URL }}/automations/executions/junit"
```

> The JUnit pattern is the fastest to wire but loses some metadata (no per-step results, no run-level comments).

### Option B — REST API push (recommended)

Same shape as [`testrail.md`](./testrail.md) §"Push run results":

```ts
// scripts/test-management/push-results-zephyr.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN: { tc_id: string; status: 'Pass'|'Fail'|'Not Executed'|'Blocked'; duration_ms: number; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

// 1. Resolve TC-CART-04 → Zephyr testCaseKey via External ID (cached locally)
// 2. Create a Test Cycle for this CI build
const cycle = await zs('POST', '/testcycles', {
  projectKey: 'PHX',
  name: `CI ${process.env.GITHUB_SHA?.slice(0,7)} on ${process.env.ENV ?? 'qa'}`,
});

// 3. POST one execution per result (no bulk endpoint as of May 2026 — batch in parallel with rate-limit guard)
for (const r of RUN) {
  await zs('POST', '/testexecutions', {
    projectKey: 'PHX',
    testCaseKey: idMap[r.tc_id],
    testCycleKey: cycle.key,
    statusName: { passed: 'Pass', failed: 'Fail', skipped: 'Not Executed' }[r.status] ?? 'Fail',
    executionTime: r.duration_ms,
    comment: `Spec: ${r.spec_path}\nCI: ${process.env.GITHUB_RUN_URL}`,
  });
}
```

> **Rate-limit guard:** Zephyr Scale Cloud caps at ~50 req/s. Use `p-limit` or similar to avoid 429s. JUnit ingest (Option A) sidesteps this entirely.

## GitHub Actions snippet

```yaml
  - name: Push run results to Zephyr Scale
    if: always() && env.ZEPHYR_API_TOKEN != ''
    env:
      ZEPHYR_BASE_URL: ${{ vars.ZEPHYR_BASE_URL }}
      ZEPHYR_API_TOKEN: ${{ secrets.ZEPHYR_API_TOKEN }}
      ZEPHYR_PROJECT_KEY: ${{ vars.ZEPHYR_PROJECT_KEY }}
    run: npx ts-node scripts/test-management/push-results-zephyr.ts
```

## Defect filing on failure

When a Zephyr execution is `Fail`, the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files a Jira Bug with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Zephyr Scale's `linkedIssues` field on the execution carries the Jira issue key — populated by the same push script.

```ts
// after POST /testexecutions, for each failure:
await zs('POST', `/testexecutions/${execution.key}/issuelinks`, {
  issueId: jiraBugId,
});
```

Because Zephyr Scale **is** in the Jira project, this is a single first-class link (unlike TestRail's mirror-by-CSV pattern).

## Reporting → QA Metrics Dashboard

Same as the rest of the folder — Zephyr Scale runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly. Zephyr Scale's own **Traceability Report** (Test ↔ Story ↔ Bug) is a useful cross-check; if it disagrees with `reports/traceability.json` by > 5%, the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill flags it.

## Reusable assets in Zephyr Scale (use these)

- **Test Steps library** — share a step (e.g., "Login as standard user") across many tests; one update propagates. Maps to a snippet in `documents/manual-testcases/_shared-steps.md` (added when needed).
- **Parameters / Datasets** — table-driven testing; Zephyr ingests CSV. Same pattern as Playwright's `test.describe.parallel.each`.
- **Test Plans** — one Test Plan can group several Test Cycles for a release; useful for "Sprint 5 release" rollups.

## BDD / Cucumber in Zephyr Scale

Zephyr Scale **supports** BDD steps (Given / When / Then) but it's not first-class — Xray is better here ([`xray.md`](./xray.md)). If you need full BDD round-trip with playwright-bdd, plan to migrate to Xray within a year. Workable for now: store the `.feature` file under `documents/manual-testcases/<module>/<TC-id>.feature` and link it from the Zephyr Test description.

## Anti-patterns specific to Zephyr

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Storing TC steps in the Test description (rich text), not in the dedicated Steps section | Breaks Zephyr's per-step result reporting | Use the Steps tab; one row per step |
| Squad for > 200 TCs | API quota pain + missing features | Migrate to Scale (or Xray) before you hit the wall |
| Ignoring the `External ID` field because Zephyr already gives you `PHX-T101` | Couples the dashboard to the vendor key — tool migration breaks everything | `External ID = TC-<MODULE>-<NN>` is the join key, always |
| Rate-limiting the push script with `Promise.all([…big array])` | Cloud 429s; some executions silently dropped | `p-limit(10)` or use the JUnit ingest endpoint |
| Server / DataCenter without a backup plan | Self-hosted Zephyr DB outage = QA outage | Daily DB backup; document RTO/RPO |
| Letting Zephyr's native `priority` field drift from `@P*` | Reports don't match dashboard | Custom-field `Priority` is the source-of-truth; native `priority` is unused |

## Zephyr Squad deltas

Squad has a **different API** and a **flatter model** (Tests, not Folders; Cycles only). The push-results script needs a separate variant — `push-results-zephyr-squad.ts`. Key differences:

| Concern | Zephyr Scale | Zephyr Squad |
|---|---|---|
| Hierarchy | Folders | Flat (Components only) |
| Parameters / data tables | ✅ | ❌ |
| Reusable steps | ✅ | ❌ |
| API host | `api.zephyrscale.smartbear.com` | `prod-api.zephyr4jiracloud.com/connect/public/rest` |
| Auth | Bearer token | JWT signed against the addon (`zephyr-squad-cloud-jira-rest-client` library) |
| Bulk endpoints | Limited | None |

**Recommendation:** if you're starting fresh, pick Scale. Squad's lower price disappears once you account for migration cost in year 2.

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick Zephyr Scale vs Squad vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that Zephyr mirrors
- [`documents/jira/`](../jira/) — the AI Agent ↔ Jira contract; Zephyr lives in the same Jira project but the Agent's input contract is unchanged
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that Zephyr custom fields must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — skills that read / write Zephyr-formatted artifacts
- [Zephyr Scale REST API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/), [Zephyr Squad REST API](https://zephyrsquad.docs.apiary.io/) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Scale project shape + custom fields | ✅ v1 | QA Platform |
| Import from Markdown | ✅ v1 (script ≤ 200 LOC target) | QA Platform |
| Push results (REST + JUnit) | ✅ v1 (rate-limit guard) | QA Platform |
| Defect mirror to Jira | ✅ v1 (first-class link) | QA Lead |
| Squad deltas | ✅ v1 (called out as discouraged) | QA Lead |
