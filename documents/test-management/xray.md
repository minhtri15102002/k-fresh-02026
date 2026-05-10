# Xray for Jira Integration Guideline

> How this repo uses **Xray for Jira** (Xpand IT) as the **execution + reporting + BDD-round-trip surface** while [`documents/manual-testcases/`](../manual-testcases/) stays the canonical text and [`tests/`](../../tests/) stays the regression gate. Xray's strength is **first-class Jira issue types** for Test / Test Set / Test Plan / Test Execution, plus the cleanest Cucumber / BDD round-trip in the market; its weakness is pricing growth and a steeper learning curve than Zephyr. This file is the operational guideline; pick it via [`tool-comparison.md`](./tool-comparison.md) §Q3.
>
> Canonical vendor docs:
> - Cloud — [Xray Cloud REST API](https://docs.getxray.app/display/XRAYCLOUD/REST+API), [Xray Cloud GraphQL](https://docs.getxray.app/display/XRAYCLOUD/GraphQL+API)
> - Server / DataCenter — [Xray Server REST API](https://docs.getxray.app/display/XRAY/REST+API)

## When to pick Xray

| Use Xray when… | Don't pick Xray when… |
|---|---|
| Strong BDD / Cucumber culture (or planned within a year) | You don't use BDD and don't plan to (Zephyr Scale is cheaper for the same job) |
| Strict requirement-coverage rigour required (regulated, audit, ISO 25010) | Tiny team, < 100 TCs (Jira native or ClickUp suffice) |
| Org is fully Jira-locked and refuses a second vendor | Org is fully on Microsoft / Azure stack (use [`azure-devops.md`](./azure-devops.md)) |
| Multi-project rollup of Test Plans across release trains | qTest's modular ecosystem fits better (regulated medical / pharma) |
| Need both REST + GraphQL APIs | Pricing (~$10-20+/user/month plus the Premium tier squeeze) is a deal-breaker |

## Project shape (Xray)

Xray's killer feature is that **Test, Test Set, Test Plan, and Test Execution are all real Jira issue types**. They behave like every other issue: linkable, JQL-able, agile-board-able.

```
Jira Project: PHX (Phoenix product)
└── Issue types installed by Xray
    ├── Test               ← one per TC; type = Manual / Cucumber / Generic
    ├── Pre-Condition      ← reusable setup ("user is logged in as standard")
    ├── Test Set           ← grouping (e.g., "Cart Smoke Pack")
    ├── Test Plan          ← release umbrella ("v1.4 Regression")
    ├── Test Execution     ← one per CI run; carries the actual results
    └── Sub Test Execution ← per-environment execution slice (optional)
```

Stories / Bugs are **the same Jira issue types** as elsewhere; Xray adds the Test-* types alongside them. This is why Xray's traceability is the strongest in the market — every link is a native Jira issue link.

## Test types in Xray (pick the right one per TC)

| Type | When | Steps live where? |
|---|---|---|
| **Manual** | A human runs the steps; canonical for [`documents/manual-testcases/`](../manual-testcases/) imports | Xray "Test Steps" tab; mirrored from the `.md` file |
| **Cucumber** | BDD; spec is `.feature` Gherkin | Xray "Gherkin Definition" tab; round-trips to `tests/bdd/<feature>/<scenario>.feature` |
| **Generic** | Automated test owned outside Xray (e.g., a Playwright spec) | Xray "Generic Test Definition" tab — usually the spec path / link |
| **Cucumber Scenario Outline** | BDD with parameters | Same as Cucumber + Examples table |
| **Exploratory** | Charter-based exploratory testing | Charter only; results are session notes |

> **Convention.** For automated TCs in this repo, use **Cucumber** (if a `.feature` file exists) or **Generic** (if it's a TS spec). Both still carry the `External ID = TC-<MODULE>-<NN>` for the dashboard contract.

## Required custom fields

Xray ships with most fields you need. Add these only if the tag taxonomy can't be expressed via existing fields.

| Field | Type | Notes |
|---|---|---|
| `External ID` | Text | The `TC-<MODULE>-<NN>` join key. Required (Xray's own `Test ID` like `PHX-T123` is not portable across instances). |
| `Priority` (built-in) | Single-select | Map to `P1 / P2 / P3 / P4` via project-level enum config |
| `Severity` | Single-select | `critical / major / minor / trivial` (custom field) |
| `Module` (Components or label) | Multi-select | Reuse Jira Components: `cart / checkout / register / …` |
| `Spec Path` | Text | Populated by push script |
| `Owner` (built-in Assignee) | User | Owner is the Test's Assignee |

## Install / configuration

Xray is installed at the **Jira instance level** by an Atlassian admin. Repo-side wiring is credentials + a thin push script.

### 1. Get an API client ID + secret

Cloud: in Jira → **Apps → Xray → API Keys → Create API Key**. Copy the Client ID and Client Secret.

### 2. Add credentials to `.env`

```bash
# profiles/.env.qa  — never committed
XRAY_BASE_URL=https://xray.cloud.getxray.app/api/v2     # Cloud; Server is on the Jira host
XRAY_CLIENT_ID=<paste-id>
XRAY_CLIENT_SECRET=<paste-secret>
JIRA_PROJECT_KEY=PHX
```

Xray Cloud uses an **OAuth-style two-step auth**: POST `client_id` + `client_secret` to `/api/v2/authenticate` to get a Bearer token, valid 24 h. Cache the token in `~/.cache/xray-token.json` to avoid auth churn in CI.

### 3. Mirror them as CI secrets

Same convention as [`testrail.md`](./testrail.md) §3. **Never** commit. Pre-commit `gitleaks` blocks it.

## Import existing Markdown TCs (one-time)

Xray's REST endpoint `POST /api/v2/import/test/csv` ingests a CSV with one row per Manual test. Map columns:

| CSV column | Source |
|---|---|
| `Test Type` | `Manual` (or `Cucumber` if `.feature` exists alongside) |
| `Summary` | First line of `.md` (after `# TC-…-…`) |
| `Action` | One row per step; pivot the Markdown |
| `Expected Result` | Per step |
| `External ID` | `TC-<MODULE>-<NN>` |
| `Priority` | From `@P*` tag |
| `Components` | Module |

```bash
# scripts/test-management/import-from-markdown.ts --tool xray
# 1. Reads documents/manual-testcases/**/TC-*.md
# 2. Pivots steps → rows
# 3. Builds CSV per Xray's documented schema
# 4. POSTs to /api/v2/import/test/csv
# 5. Diffs with existing Tests via JQL `project = PHX AND issuetype = Test AND "External ID" in (...)`
# 6. Idempotent — only creates / updates changed cases
```

## Push run results from Playwright (per-CI-run)

Xray's headline integration is **`POST /api/v2/import/execution/{format}`** — one HTTP call to ingest a whole run's results in JUnit, Cucumber JSON, or Xray's own JSON format.

### Option A — JUnit ingest (zero-code, recommended for Generic / Manual tests)

```yaml
  - name: Push run results to Xray (JUnit)
    if: always() && env.XRAY_CLIENT_ID != ''
    env:
      XRAY_CLIENT_ID: ${{ secrets.XRAY_CLIENT_ID }}
      XRAY_CLIENT_SECRET: ${{ secrets.XRAY_CLIENT_SECRET }}
      JIRA_PROJECT_KEY: ${{ vars.JIRA_PROJECT_KEY }}
    run: |
      TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
        --data "{\"client_id\":\"$XRAY_CLIENT_ID\",\"client_secret\":\"$XRAY_CLIENT_SECRET\"}" \
        https://xray.cloud.getxray.app/api/v2/authenticate | tr -d '"')

      curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: text/xml" \
        --data @reports/junit.xml \
        "https://xray.cloud.getxray.app/api/v2/import/execution/junit?projectKey=$JIRA_PROJECT_KEY"
```

> Xray maps each `<testcase classname="TC-CART-04 - …">` to the matching Test by `External ID`. A new **Test Execution** issue is created automatically and linked to the matching Tests.

### Option B — Cucumber JSON ingest (for BDD / playwright-bdd tests)

If your tests are BDD (`.feature` files via [`bdd-gherkin-author`](../../.agents/skills/bdd-gherkin-author/SKILL.md)):

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @reports/cucumber.json \
  "https://xray.cloud.getxray.app/api/v2/import/execution/cucumber?projectKey=$JIRA_PROJECT_KEY"
```

Xray's **Cucumber round-trip** is the magic: you can author the scenario in Jira (as a Test of type Cucumber), export `.feature` files via `GET /api/v2/export/cucumber?keys=PHX-T123,PHX-T124`, run them with playwright-bdd, then re-import the JSON — the same Test issue tracks both authoring and execution. No other tool in this folder does this as cleanly.

### Option C — Xray JSON (richest payload)

For multi-step results, evidence attachments, or custom fields per execution, build the Xray JSON shape and POST to `/api/v2/import/execution`. See `scripts/test-management/push-results-xray.ts` (sketch ≤ 200 lines).

## GitHub Actions snippet

```yaml
  - name: Push run results to Xray
    if: always() && env.XRAY_CLIENT_ID != ''
    env:
      XRAY_CLIENT_ID: ${{ secrets.XRAY_CLIENT_ID }}
      XRAY_CLIENT_SECRET: ${{ secrets.XRAY_CLIENT_SECRET }}
      JIRA_PROJECT_KEY: ${{ vars.JIRA_PROJECT_KEY }}
    run: npx ts-node scripts/test-management/push-results-xray.ts
```

## GraphQL — when to reach for it

Xray Cloud exposes a GraphQL endpoint at `https://xray.cloud.getxray.app/api/v2/graphql`. Use it for:

- Bulk reads (`getTests(jql: "project = PHX AND issuetype = Test")` → 100 tests in one call)
- Coverage queries (`getTestExecution(issueId: …) { tests { issueId, status, lastModified } }`)
- Programmatic test plan rollups across multiple projects

REST is fine for writes; GraphQL is faster for reads. The [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill prefers GraphQL when Xray is the source.

## Defect filing on failure

When an Xray execution result is `FAIL`, the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files a Jira Bug with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Xray then **automatically links** the Bug to the failing Test via the standard Jira "is detected by" link type — no extra API call needed if both live in the same Jira project.

For BDD failures, Xray also captures **per-step status** in the Test Execution, so the Bug description can quote the exact failing Given / When / Then.

## Reporting → QA Metrics Dashboard

Xray runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly.

Xray's own **Test Execution → Overall Execution Status** report is a useful cross-check; the **Traceability Report** (Story → Test → Execution → Defect) directly mirrors Panel #4. If they disagree by > 5%, the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill flags it.

## BDD round-trip in detail

The most valuable Xray-only workflow:

```
1. Author scenario in Jira UI
   - Create a Test, type = Cucumber
   - Write Gherkin in the "Gherkin Definition" tab
   - Link to a Story
   ↓
2. Export feature file to repo
   GET /api/v2/export/cucumber?keys=PHX-T123
   → tests/bdd/cart/discount-expiry.feature
   ↓
3. Run with playwright-bdd
   npx bddgen && npx playwright test
   ↓
4. Push JSON results back
   POST /api/v2/import/execution/cucumber
   → updates the same Test, creates a Test Execution issue
```

The [`bdd-gherkin-author`](../../.agents/skills/bdd-gherkin-author/SKILL.md) skill knows this round-trip and obeys it.

## Anti-patterns specific to Xray

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Using Xray's `Test ID` (`PHX-T123`) as the join key everywhere | Tied to one Jira instance; clone-to-new-instance breaks everything | `External ID = TC-<MODULE>-<NN>` is the join key, always |
| Authoring Cucumber tests in the Jira UI **and** in the repo | Two truths; round-trip drifts | Pick one origin (repo OR Jira); the other is the export |
| Mixing Manual + Generic + Cucumber Test types in the same Test Set without convention | Reports get confusing fast | One Test Set = one Test type; or use clear Component tags |
| Letting Xray's `Severity` field drift from `@severity:*` tags | Reports don't match the dashboard | Custom-field `Severity` is mirrored; tag is source-of-truth |
| Buying Xray Premium tier (~2x base price) without an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) | TCO compounds at 50+ users | RFC required for any tier change |
| Token-cache leak (committing `~/.cache/xray-token.json`) | Token valid 24h; pre-commit `gitleaks` should catch but verify | Add `.cache/` to `.gitignore`; rotate Client Secret if leaked |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick Xray vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer that Xray mirrors
- [`documents/jira/`](../jira/) — the AI Agent ↔ Jira contract; Xray issue types live in the same Jira project
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that Xray fields must mirror
- [`.agents/skills/bdd-gherkin-author/SKILL.md`](../../.agents/skills/bdd-gherkin-author/SKILL.md) — the BDD authoring path; pairs with Xray Cucumber round-trip
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — skills that read / write Xray-formatted artifacts
- [Xray Cloud REST API](https://docs.getxray.app/display/XRAYCLOUD/REST+API), [Xray Cloud GraphQL](https://docs.getxray.app/display/XRAYCLOUD/GraphQL+API) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Project shape + Test types | ✅ v1 | QA Platform |
| Import from Markdown (CSV) | ✅ v1 | QA Platform |
| Push results (JUnit + Cucumber + Xray JSON) | ✅ v1 | QA Platform |
| BDD round-trip | ✅ v1 (canonical pattern) | QA Lead |
| GraphQL usage | ✅ v1 (read-only optimisation) | QA Platform |
