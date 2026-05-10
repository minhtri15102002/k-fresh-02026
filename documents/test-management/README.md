# Test Management & Collaboration Tooling Guidelines (TestRail · Zephyr · Xray · qTest · Jira · Azure DevOps · ClickUp)

> Source-of-truth folder for **how this repo uses Test Management & Collaboration tools alongside the Playwright suites in [`tests/`](../../tests/) and the manual cases in [`documents/manual-testcases/`](../manual-testcases/)**. Seven tools, one shared contract: every test case, run, and defect produces the same evidence (TC ID ↔ spec ↔ requirement ↔ defect ↔ dashboard panel) the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill and the [QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html) already understand.
>
> Companion to [`documents/jira/`](../jira/) (Jira-as-issue-input contract). Where that folder describes **how the AI Agent reads stories / requirements / bugs**, this folder describes **where manual TCs live, where test runs are recorded, and how runs flow back to the dashboard** when the team uses a third-party Test Management tool instead of (or alongside) the in-repo Markdown TCs.

## The picture

```
                                                       ┌──────────────────────────┐
┌────────────┐  Author    ┌──────────────────┐         │ documents/manual-testcases│
│ Requirement│ ─────────► │ Test Management  │ ──────► │   TC-MODULE-NN.md        │
│ / Story /  │            │   (TestRail /    │  Sync   │   (canonical text + AC)  │
│ Epic       │ ─────────► │    Zephyr / Xray │   ◄──   │                          │
│ (Jira / ADO│            │    / qTest /     │         └──────────┬───────────────┘
│  / ClickUp)│            │    ClickUp /     │                    │
└────────────┘            │    ADO Test      │                    │ generate-testcase
                          │    Plans /       │                    ▼
                          │    Jira native)  │           ┌──────────────────────┐
                          └──────┬───────────┘           │ tests/ui/*.spec.ts   │
                                 │                       │ tests/api/*.spec.ts  │
                                 │ Run / Execute         │ (Playwright; @P*;    │
                                 ▼                       │  regression gate)    │
                          ┌──────────────────┐           └──────────┬───────────┘
                          │ Test Run         │                      │
                          │   (in-tool       │  Push run results    │
                          │    runner OR     │ ◄────────────────────┘
                          │    Playwright)   │
                          └──────┬───────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────────────────────────────────┐
                  │ Shared evidence contract                                 │
                  │   reports/run-summary.json (Playwright → tool API)       │
                  │   reports/traceability.json (TC ↔ spec ↔ REQ ↔ defect)   │
                  │   reports/defects.json (failures → defect-report skill)  │
                  └────────────────────┬─────────────────────────────────────┘
                                       ▼
                  ┌──────────────────────────────────────────────────────────┐
                  │ QA METRICS DASHBOARD                                     │
                  │   Panel #1 Run summary · Panel #3 Defects                │
                  │   Panel #4 Traceability · Panel #5 Coverage by module    │
                  └──────────────────────────────────────────────────────────┘
```

The Test Management tool sits on the **left side** of the lifecycle (case authoring, organisation by module / suite / release, run scheduling, stakeholder dashboards). [`tests/`](../../tests/) sits on the right (regression gate, in-IDE TDD, AI-assisted authoring). The [`documents/manual-testcases/`](../manual-testcases/) folder is the **bridge** — the canonical Markdown that survives a tool migration.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | Orientation, decision matrix anchors, shared evidence contract, cross-refs | Always read first |
| [`tool-comparison.md`](./tool-comparison.md) | Decision matrix across **TestRail · Zephyr (Scale & Squad) · Xray · qTest · Jira native · Azure DevOps Test Plans · ClickUp** + the in-repo `documents/manual-testcases/` Markdown lane. Migration paths in both directions | Choosing the tool for a new project, justifying it in a vendor RFC, or planning a tool swap |
| [`testrail.md`](./testrail.md) | Standalone test-case management — projects / suites / sections / cases, runs, milestones, REST API, JUnit ingest from Playwright, GitHub Actions snippet, secret hygiene | When the team owns the QA stack independently of the dev tracker |
| [`zephyr.md`](./zephyr.md) | Zephyr Scale (formerly TM4J) and Zephyr Squad — Jira-native test management, folders / cycles / executions, REST API, `playwright-zephyr` reporter, when to pick each | Jira-first orgs that want test cases inside the same project as stories |
| [`xray.md`](./xray.md) | Xray for Jira — first-class issue types (Test, Test Set, Test Plan, Test Execution), Cucumber / Generic / Manual test types, GraphQL + REST API, Playwright JUnit + Cucumber JSON ingest, BDD round-trip | Jira-first orgs that need BDD / requirement-coverage rigour |
| [`qtest.md`](./qtest.md) | Tricentis qTest — enterprise-scale test management, Manager / Pulse / Scenario / Insights / Launch, REST API, Playwright integration, JIRA / ADO sync | Large enterprise programmes; Tricentis Tosca shops; regulated industries (pharma / finance / health) |
| [`jira-native.md`](./jira-native.md) | Native Jira **without** a TM add-on — issue-type abuse for tests, GitHub label mirroring, what you give up vs Zephyr / Xray. References [`documents/jira/`](../jira/) for the canonical AI Agent contract | Small teams that already pay for Jira and don't want a second licence |
| [`azure-devops.md`](./azure-devops.md) | Azure DevOps Test Plans — Suites / Test Cases / Test Plans, Test Hub, Test Runner, Azure Pipelines integration, `PublishTestResults@2`, REST API | .NET shops; teams already on Azure Boards / Pipelines |
| [`clickup.md`](./clickup.md) | ClickUp — Spaces / Folders / Lists / Tasks / Custom Fields, "Test Case" custom-fielded list pattern, automations, REST API, GitHub Actions snippet | Small / mid teams using ClickUp as their PM tool; lightweight TM needs |

## Reading order

1. **`tool-comparison.md`** — pick the right tool for your scenario before you commit to a workflow that's hard to reverse. Test Management tool-switching costs are *high* (case migration, history loss, broken links to defects).
2. **`testrail.md`** OR **`zephyr.md`** OR **`xray.md`** OR **`qtest.md`** OR **`jira-native.md`** OR **`azure-devops.md`** OR **`clickup.md`** — your tool of choice from the matrix.
3. The other tool docs — only when you maintain a multi-tool org (acquisitions, regulated programme islands, multi-vendor estate).
4. [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the in-repo Markdown lane that stays canonical regardless of which tool wins this quarter.
5. [`documents/jira/`](../jira/) — the AI-Agent ↔ Jira input contract; orthogonal to the Test Management tool choice and survives all of them.

## Position vs the in-repo Markdown lane

| Concern | Test Management tool (any) | [`documents/manual-testcases/`](../manual-testcases/) | [`tests/`](../../tests/) (Playwright) |
|---|---|---|---|
| **Best for** | Stakeholder reporting, run management, manual exec by non-engineers | Canonical text of one TC, version-controlled with the code | Regression gate, TDD, multi-step flows |
| **Source-of-truth** | Vendor DB (TestRail / Jira / ADO / etc.) | Markdown file `TC-<MODULE>-<NN>.md` in git | TypeScript spec files in git |
| **Audience** | PM, manual QA, leadership, auditors | QA engineers, dev-PR reviewers | Engineers (TS, Playwright, IDE) |
| **AI assistance** | [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) reads / writes the matrix | [`generate-manual-testcase`](../../.agents/skills/generate-manual-testcase/SKILL.md), [`test-design-techniques`](../../.agents/skills/test-design-techniques/SKILL.md) | [`generate-testcase`](../../.agents/skills/generate-testcase/SKILL.md), [`pom-architect`](../../.agents/skills/pom-architect/SKILL.md), [`selector-healing`](../../.agents/skills/selector-healing/SKILL.md) |
| **Promotion path** | Manual TC → tool case → automated when stable | Markdown stays as the human-readable spec | Stays in `tests/` permanently |
| **Survives tool swap?** | ❌ migration cost is high | ✅ pure git; portable | ✅ pure git; portable |
| **Lives in repo?** | ❌ vendor cloud (or self-host for some) | ✅ | ✅ |

**Rule of thumb in this repo:** the **Markdown TC** under [`documents/manual-testcases/`](../manual-testcases/) is the **canonical text**; the Test Management tool is the **execution surface and stakeholder report**; the **Playwright spec** under [`tests/`](../../tests/) is the **regression gate**. All three carry the same `TC-<MODULE>-<NN>` ID so a Jira / TestRail / ADO swap loses no link.

## Shared discipline (every tool must satisfy)

Every Test Management integration in this repo, no matter the tool:

1. **One TC ID, three locations** — `TC-CART-04` exists as a Markdown file (canonical), as a tool record (run surface), and as a tag in the Playwright spec (`test('TC-CART-04 - ...', ...)`). The ID is the join key. Tools that don't let you set an external ID are downgraded in [`tool-comparison.md`](./tool-comparison.md).
2. **Tag taxonomy is non-negotiable** — `@P1` / `@P2` / `@severity` / `@suite` / `@feature` per [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md). Tool-side priority and labels are **derived**, never the other way around.
3. **Defect labels mirror, never replace** — when a tool-driven run fails, the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill files an issue with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). The tool's own bug status is a side-effect, not the system of record.
4. **Run results post both ways** — Playwright produces JUnit / JSON; CI posts to the tool's API to update run status; the tool emits a webhook (where supported) to refresh the dashboard.
5. **No secrets in repo** — all tool API tokens come from `profiles/.env.<ENV>` or the CI secret store; never committed.
6. **Traceability is computed, not curated** — the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill builds the REQ ↔ TC ↔ Spec matrix from git + tool API on each run; humans review, they do not maintain.
7. **Tool decisions are logged in an RFC** — paid licences require [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) and the [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) skill output. No "we just picked Zephyr" without a paper trail.

## Where the integration code lives

```
documents/test-management/                ← guidelines (this folder)
├── README.md
├── tool-comparison.md
├── testrail.md
├── zephyr.md
├── xray.md
├── qtest.md
├── jira-native.md
├── azure-devops.md
└── clickup.md

scripts/test-management/                  ← thin wrappers, added per tool you adopt
├── push-results-testrail.ts              ← Playwright JSON → TestRail run
├── push-results-zephyr.ts
├── push-results-xray.ts
├── push-results-qtest.ts
├── push-results-azdo.ts                  ← uses az CLI / REST
└── push-results-clickup.ts

reports/                                  ← Playwright outputs (existing)
├── run-summary.json                      ← canonical run shape
├── traceability.json                     ← REQ ↔ TC ↔ Spec matrix
└── defects.json
```

`scripts/test-management/` is added per-tool as you adopt each lane; nothing else in the repo writes there. Keep each script ≤ 200 lines; if it grows, the tool API is fighting you and the [`tool-comparison.md`](./tool-comparison.md) decision should be revisited.

## How tool runs reach the QA Metrics Dashboard

Every Test Management tool funnels output through the **same dashboard contract** (already used by Playwright, Newman, k6, ZAP):

```
Playwright run            tool-side run (manual or auto-import)
       │                                │
       ▼                                ▼
reports/run-summary.json   ←  scripts/test-management/push-results-<tool>.ts
       │                                │
       ▼                                ▼
       └──────────────► reports/traceability.json (computed)
                                        │
                                        ▼
                       templates/qa-metrics-dashboard.html
                       Panels #1 / #3 / #4 / #5
```

The intermediate `reports/run-summary.json` is the **dashboard contract**. Every tool integration must emit a compatible row per TC:

```json
{
  "tc_id": "TC-CART-04",
  "title": "Add multiple items to cart",
  "module": "cart",
  "priority": "P1",
  "severity": "major",
  "spec_path": "tests/ui/test-cart.spec.ts:42",
  "tool": "testrail",
  "tool_run_id": "R-1234",
  "tool_case_id": "C-456",
  "status": "passed",
  "duration_ms": 4321,
  "env": "qa",
  "ts_iso": "2026-05-10T22:32:00Z",
  "owner": "@khanhdo",
  "linked_req_id": "REQ-CART-01",
  "linked_defect_ids": []
}
```

Per-tool docs explain how to emit this from each tool's native API. **Don't ship a Test Management integration that doesn't produce this row** — the dashboard panel is blind to it, and the team won't know it ran.

## Cadences

| Cadence | Action | Owner |
|---|---|---|
| **Pre-commit** | Author / update Markdown TC under [`documents/manual-testcases/`](../manual-testcases/) when scope changes | Author |
| **Per-PR** | If the PR adds / changes a TC, the corresponding tool record is created / updated by `scripts/test-management/push-results-<tool>.ts --sync-cases` (idempotent) | CI |
| **Per-PR** (regression) | Playwright run posts pass / fail back to the tool run for the current branch | CI |
| **Per-release** | Tool-side **Test Plan / Milestone / Cycle** is closed; coverage report exported and attached to the release tag | Release owner |
| **Weekly** | Audit orphan TCs (in tool but not in [`documents/manual-testcases/`](../manual-testcases/) or vice-versa) via the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill | QA Lead |
| **Quarterly** | Tool ROI review — licence cost vs. value delivered. Use [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md). | QA Manager |

## Cross-references

- **Manual TC IDs** — `TC-<MODULE>-<NN>` per [`documents/manual-testcases/README.md`](../manual-testcases/README.md). Tool integrations **must** preserve this ID; tool-side internal IDs (`C-456`, `Test-DEV-123`) are an implementation detail.
- **Test tags** — [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md). Tag values flow **from the spec to the tool**, not the other way around.
- **Defect labels** — [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Tool-side bug records are mirrored to GitHub Issues with the same labels via [`defect-report`](../../.agents/skills/defect-report/SKILL.md).
- **Traceability** — [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md) builds the matrix; the tool is one of three inputs (the others being [`documents/manual-testcases/`](../manual-testcases/) and [`tests/`](../../tests/)).
- **AI Agent ↔ Jira input contract** — [`documents/jira/`](../jira/). Orthogonal to the Test Management tool choice; even if you use TestRail / Xray / ADO, the AI Agent still reads requirements / stories from Jira.
- **Coverage requirements** — [`documents/automation-framework/coverage-requirements.md`](../automation-framework/coverage-requirements.md). Each row maps to one or more Test Management cases.
- **CI implementation** — [`documents/ci/github-actions.md`](../ci/github-actions.md). The `push-results-<tool>` step is appended to the post-test job.
- **Vendor RFC for paid licences** — [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) + the [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) skill. Required for any paid Test Management licence.
- **Dashboard panel** — [`wiki/QA-Metrics-Dashboard.md`](../../wiki/QA-Metrics-Dashboard.md) §"Panel #4 — Traceability".

## Anti-patterns this folder is designed to prevent

| Anti-pattern | Why it's bad | Counter built into this folder |
|---|---|---|
| TC text only in the tool, not in git | Tool migration loses years of testing history | Markdown TC is the canonical surface; tool record is derived |
| Multiple tools "for now" without a deprecation plan | Doubled cost, halved trust, dashboard fragments | [`tool-comparison.md`](./tool-comparison.md) requires a single primary tool per programme; multi-tool only by RFC |
| Tool-side custom fields drift from the tag taxonomy | Reports don't match the dashboard | Tool fields are **derived** from `@P*` / `@severity` / `@module` tags via the push script |
| Manually copying run results into the tool every Friday | Stale numbers; nobody trusts them | `push-results-<tool>.ts` posts on every CI run; manual sync forbidden |
| Treating the tool as the issue tracker instead of GitHub / Jira | Defect leakage KPI breaks because there are two truths | Bugs live where the dev team lives ([`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)); tool-side bug field is a mirror |
| Buying a paid tier without an ROI brief | Renewal-driven licence growth, no measurable benefit | [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) mandatory for any tier > free |
| "We use the tool's own automation tests" (TestRail Cases→Cases automation, Xray "Generic" tests as ground truth) | Locks regression evidence into vendor format; breaks the in-IDE TDD loop | Playwright stays canonical; tool records the **outcome**, not the source-of-truth |

## Out of scope

This folder is **not**:

- A general "what is test case management" tutorial — read [ISTQB CTFL §4 Test Management](https://www.istqb.org/) or your training material.
- A replacement for the vendor's own admin / API documentation. Each per-tool file links to canonical docs at the top.
- A licence to skip [`documents/manual-testcases/`](../manual-testcases/). The Markdown lane survives every tool change; the tool does not.
- A licence to skip [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Tool-side bug fields and GitHub labels both apply; this folder makes them consistent, not optional.
- A vendor advocacy doc — [`tool-comparison.md`](./tool-comparison.md) is honest about each tool's weaknesses (Zephyr's API quirks, Xray's pricing, qTest's enterprise overhead, ClickUp's lack of test-first features, etc.).
- A guide to features that require licence tiers this repo does not provision (TestRail Cloud Enterprise, Xray Premium, qTest Manager + Pulse + Scenario stack).

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (orientation + decision matrix anchors + shared evidence contract) | QA Lead |
| [`tool-comparison.md`](./tool-comparison.md) | ✅ v1 (matrix + RFC scaffold + migration paths) | QA Lead |
| [`testrail.md`](./testrail.md) | ✅ v1 | QA Platform |
| [`zephyr.md`](./zephyr.md) | ✅ v1 (Scale + Squad split) | QA Platform |
| [`xray.md`](./xray.md) | ✅ v1 (REST + GraphQL + BDD round-trip) | QA Platform |
| [`qtest.md`](./qtest.md) | ✅ v1 (Manager + Insights; Pulse / Scenario referenced) | QA Platform |
| [`jira-native.md`](./jira-native.md) | ✅ v1 (no add-on; cross-refs `documents/jira/`) | QA Lead |
| [`azure-devops.md`](./azure-devops.md) | ✅ v1 (Test Plans + Pipelines integration) | QA Platform |
| [`clickup.md`](./clickup.md) | ✅ v1 (custom-field test-case pattern) | QA Lead |

## Phase / curriculum connection

For the curriculum framing of where Test Management fits in the QA learning arc:

- [`training/phase-3-framework/`](../../training/phase-3-framework/) — manual TC design and the framework discipline that the Test Management surface formalises
- [`training/phase-7-ai-era-leadership/`](../../training/phase-7-ai-era-leadership/) — Test Management as the **leadership view** in an AI-augmented QA org

For the manager-tier framing (vendor decision RFC for paid tiers):

- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — required when proposing a paid Test Management licence
- [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) — worked example (visual regression vendor); the same scoring shape applies to TM tools
