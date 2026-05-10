# Database Testing Tooling Guidelines (DBeaver · MySQL Workbench · pgAdmin)

> Source-of-truth folder for **how this repo uses GUI database clients alongside the automated DB tests authored by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md)**. Three tools, one shared contract: every query, schema check, or invariant run from a GUI must be reproducible as a versioned `.sql` file in `tests/db/` so that what a tester confirmed clicking around becomes a CI gate the next sprint.
>
> Anchored on the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) (which authors migration / invariant / seed-lifecycle tests) and the workspace rule **"Database Merge Procedures for Staging and PreProd"** (idempotency, multi-client templates, hotfix naming). This folder is the **operational guideline** the skill and the rule lean on.

## The picture

```
                                                                ┌──────────────────────┐
┌──────────┐  Explore   ┌──────────────┐  Promote /             │  tests/db/           │
│ Schema / │ ─────────► │  DBeaver     │  Save query ──────────►│   migrations.spec.ts │
│ Migration│            │  MySQL WB    │  to .sql file          │   invariants/*.sql   │
│ Hotfix   │ ─────────► │  pgAdmin     │  (versioned in repo)   │   seeds/*.sql        │
│  .sql    │   Author   │              │                        │  (CI gate; idempotent│
│          │            │  GUI session │                        │   per workspace rule)│
└──────────┘            └──────┬───────┘                        └──────────┬───────────┘
                               │                                           │
                               │ Run ad-hoc                                │ Run in CI
                               ▼                                           ▼
                       ┌────────────────┐                          ┌────────────────┐
                       │  Result grid / │                          │  jest / vitest │
                       │  ER diagram /  │                          │  + dockerised  │
                       │  EXPLAIN plan  │                          │  Postgres/MySQL│
                       └──────┬─────────┘                          └──────┬─────────┘
                              │                                           │
                              ▼                                           ▼
                       ┌──────────────────────────────────────────────────────────┐
                       │  Shared evidence contract (rows / schema / plan / latency│
                       │  / invariant pass-rate) flows into qa-metrics-dashboard  │
                       │  Section 3 (defects) and the self-healing loop           │
                       └──────────────────────────────────────────────────────────┘
```

The three GUIs sit on the **left side** of the lifecycle (exploration, schema verification, ad-hoc invariant checks, hotfix authoring, support escalations). [`tests/db/`](../../) (added by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md)) sits on the right (regression gate, migration safety, in-CI invariant assertions). The same evidence shape — *"row count, schema columns, EXPLAIN cost, invariant SQL = 0 rows"* — connects them.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | Orientation, three-tool picture, shared discipline (saved queries, secrets, EXPLAIN, idempotency), reading order, anti-patterns | Always read first |
| [`tool-comparison.md`](./tool-comparison.md) | Decision matrix — DBeaver vs MySQL Workbench vs pgAdmin vs the in-repo `tests/db/` (and when to reach for `psql` / `mysql` CLI). Migration paths in both directions | Choosing the tool for a new module, or justifying the choice in a vendor RFC |
| [`dbeaver.md`](./dbeaver.md) | DBeaver Community workflow — connections, projects, saved queries, ER diagrams, data export, secret hygiene, EXPLAIN. **Default tool for cross-engine work in this repo (Postgres + MySQL + SQLite + …).** | Multi-engine codebase; first time setting up a tester for DB access |
| [`mysql-workbench.md`](./mysql-workbench.md) | MySQL Workbench — connections, schemas, query browser, EXPLAIN, model designer, secret hygiene. **Use when the SUT is MySQL/MariaDB and the team already lives in MySQL idioms.** | MySQL-only stack; DBA-grade modelling work |
| [`pgadmin.md`](./pgadmin.md) | pgAdmin 4 — server groups, query tool, EXPLAIN ANALYZE / `auto_explain`, role-based access, secret hygiene. **Use when the SUT is Postgres and you need first-class Postgres features (`pg_stat_statements`, `EXPLAIN (FORMAT JSON)`, RLS).** | Postgres-only stack; performance-debug a slow query |

## Reading order

1. **`README.md`** — the contract every implementation must preserve. If you skip this, your GUI session won't reproduce in CI and the dashboard stays blind.
2. **`tool-comparison.md`** — pick the right tool before you spend a week learning the wrong one.
3. **`dbeaver.md`** — the default. If a stakeholder just says "I need a DB client", this is what you reach for.
4. **`mysql-workbench.md`** OR **`pgadmin.md`** — when the engine-specific lane is the right call (per the matrix).
5. The [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) — once your GUI exploration is complete and you're ready to make it a CI gate.

## Position vs the in-repo `tests/db/` (Playwright + jest + dockerised DB)

| Concern | DBeaver / MySQL WB / pgAdmin | `psql` / `mysql` CLI | `tests/db/` (jest + docker) |
|---|---|---|---|
| **Best for** | Exploration, ER inspection, ad-hoc invariant checks, support escalations, "show the PM" | Scripted ad-hoc work, tiny one-liners in CI runbooks | Migration safety gate, invariant assertions on every PR, seed/teardown lifecycle |
| **Source-of-truth** | `.sql` files exported to `documents/database-testing/queries/<module>/<name>.sql` (versioned in repo) | Same `.sql` file, run via `psql -f` / `mysql <` | TypeScript spec files + SQL invariants under `tests/db/` |
| **Audience** | Non-engineers welcome (DBA, support, PM) | DevOps / SRE | Engineers (TS, jest/vitest, docker) |
| **AI assistance** | Copy a query into the agent and ask `database-testing` to convert | Same | [`database-testing`](../../.agents/skills/database-testing/SKILL.md), [`data-quality-frameworks`](../../.agents/skills/data-quality-frameworks/SKILL.md) |
| **Promotion path** | Export → save SQL to repo → wrap with the [`database-testing`](../../.agents/skills/database-testing/SKILL.md) skill into a `.spec.ts` | Same | Stays in `tests/db/` permanently |
| **CI runtime** | n/a (manual) | seconds (one-liner in a CI step) | tens of seconds (per migration spec; container boot dominates) |
| **Idempotency** | n/a (read-mostly) | ⚠️ author beware | ✅ enforced by the workspace rule — see §"Idempotency contract" below |

**Rule of thumb in this repo:** explore in DBeaver / MySQL WB / pgAdmin → once the query stabilises and is **idempotent**, save it as `.sql` under `documents/database-testing/queries/` → if it's a release-blocker invariant, wrap it via the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) into a `tests/db/*.spec.ts` so it becomes a regression gate.

## The shared discipline (all three tools must satisfy)

Every GUI session in this repo, no matter the tool:

1. **Connects via a named profile**, not ad-hoc DSNs typed at the prompt. The profile name matches `profiles/.env.<ENV>` (`qa`, `uat`, `prod-readonly`). No `prod` write-capable profile is ever saved on a tester laptop.
2. **Reads credentials from a secret manager** (1Password CLI, macOS Keychain, gopass) — **never** typed into the GUI's "remember password" box, **never** pasted into a saved query. See each tool doc's §Secrets section for the exact wiring.
3. **Saves queries to `documents/database-testing/queries/<module>/<name>.sql`** the moment they prove useful. A query that lives only inside a `.dbeaver` workspace is gone the day the laptop dies.
4. **Names queries with the `module` prefix** so they line up with the defect-label `module:*` taxonomy in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). E.g. `module/cart/cart-totals-invariant.sql`, `module/auth/orphan-sessions.sql`.
5. **Tags queries with intent** in the SQL header — `-- INTENT: invariant | exploratory | hotfix | seed-check | perf-debug`. Lets CI pick up only `INTENT: invariant` files for the nightly invariant job.
6. **Writes idempotent SQL** when the query mutates state — re-runnable without error. This matches the workspace rule **"Database Merge Procedures for Staging and PreProd"** for `Database/Tiger/**`, `Database/MasterTiger/**`, and `Database/Scripts/Hotfix/**`. See §"Idempotency contract" below.
7. **Captures EXPLAIN for any query that touches > 10k rows** and stores the plan next to the SQL (`<name>.explain.txt`). Performance regressions are caught by diffing plans, not by re-eyeballing slow runs.
8. **Has an owner** — `-- OWNER: <github-handle>` in the SQL header. No owner = no query.

> **Operating principle:** a GUI session that doesn't leave a versioned `.sql` artifact is *fishing*, not testing. Every guideline above turns the fish into a regression net.

## Idempotency contract (the bar)

The workspace rule **"Database Merge Procedures for Staging and PreProd"** defines six idempotency requirements for SQL that touches Staging → PreProd. Every guideline below in this folder enforces them. Cite the rule, don't re-invent it.

| # | Requirement (from the rule) | What the GUI tooling must do |
|---|---|---|
| 1 | Tables: `IF OBJECT_ID … IS NULL CREATE TABLE` (or `CREATE OR ALTER`) | DBeaver / MySQL WB / pgAdmin "Generate DDL" output is **never** committed verbatim — wrap it in the idempotent guard the rule requires before saving the `.sql` |
| 2 | Stored procedures: `IF OBJECT_ID(…, 'P') IS NOT NULL DROP PROCEDURE` then `CREATE PROCEDURE` | Same: scripted via the GUI, but hand-edited to add the `IF OBJECT_ID … DROP` guard before commit |
| 3 | Provisioning data load via `EXEC Provisioning.<Sproc>` not raw `INSERT` | Tester writes raw `INSERT` in the GUI scratchpad to debug, **never** commits it; the committed file calls the load sproc |
| 4 | FKs: `IF NOT EXISTS … FOREIGN KEY` (rule severity: warning) | GUI-generated FK DDL is wrapped in the existence check before commit |
| 5 | `@clientId` Tiger scripts use the **Multi-Client Template** (`declare @clientIds table … loop`) | GUI scratch single-tenant query is rewritten to the loop template before commit |
| 6 | Hotfix naming `YYYY-MM-DD_<Description>.sql` under `Database/Scripts/Hotfix/**` | Tester names the file at save time — see [`dbeaver.md`](./dbeaver.md) §"Save query to repo" |

> **Convention.** A `.sql` file under `documents/database-testing/queries/` that fails any of #1–#6 fails the lint job. The lint script lives next to the workspace rule definition; it's the same regex set the rule uses, only re-targeted at `documents/**`.

## Where the artifacts live

```
documents/database-testing/
├── README.md                          ← this file
├── tool-comparison.md
├── dbeaver.md
├── mysql-workbench.md
├── pgadmin.md
└── queries/                           ← versioned `.sql` files; the actual deliverable
    ├── module/
    │   ├── cart/
    │   │   ├── cart-totals-invariant.sql       ← INTENT: invariant
    │   │   ├── cart-totals-invariant.explain.txt
    │   │   └── cart-orphan-rows.sql            ← INTENT: exploratory
    │   ├── auth/
    │   │   └── orphan-sessions.sql             ← INTENT: invariant
    │   └── checkout/
    │       └── duplicate-charge-detection.sql  ← INTENT: invariant
    └── hotfix/
        └── 2026-05-09_fix-cart-currency-default.sql  ← naming per rule #6

tests/db/                              ← added by the database-testing skill (separate folder)
├── migrations/
│   └── 2026-05-09_add-cart-currency.spec.ts
├── invariants/
│   └── cart-totals.spec.ts            ← reads the .sql from documents/database-testing/queries
└── _helpers/
    ├── postgres-container.ts
    └── mysql-container.ts
```

`documents/database-testing/queries/` is the **GUI deliverable folder**; `tests/db/` is the **CI gate folder**. The `tests/db/invariants/*.spec.ts` files import the `.sql` from `documents/database-testing/queries/module/*/...` so the file is run from one place — no copy-paste drift.

## CI shape (every tool)

Every GUI-derived query lands in one of three CI shapes:

| Shape | When | Cadence | What happens on failure |
|---|---|---|---|
| **Gate on PR** | The query is an `INTENT: invariant` against a hot table (cart, account, checkout) | per PR | Block merge; file a `severity:critical` `module:<area>` defect via [`defect-report`](../../.agents/skills/defect-report/SKILL.md) |
| **Cron invariant sweep** | All `INTENT: invariant` queries; runs against `qa` and `staging` | nightly | File a `severity:major` defect; page if same invariant fails 2 nights in a row |
| **Manual investigation** | `INTENT: exploratory` and `INTENT: perf-debug` queries | on demand | n/a; output is a triage artifact |

Hotfix scripts (`documents/database-testing/queries/hotfix/YYYY-MM-DD_*.sql`) are out-of-cadence by definition — they ship via the same Staging → PreProd path the workspace rule governs, **never** via the regular PR gate.

The matching GitHub Actions snippet lives in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job".

## How DB findings reach the QA Metrics Dashboard

```
GUI session → save query.sql → tests/db/invariants/<module>.spec.ts imports it
          → jest run on PR / cron
          → on fail: scripts/file-defect.ts opens GitHub issue
                     (bug + severity:* + module:<area> + root-cause:integration + found-in:qa)
          → npm run fetch:defects → reports/defects.json
          → templates/qa-metrics-dashboard.html Section 3
```

DB invariant failures are **just another flavour of defect** — same `bug` + `severity:*` + `module:*` labels as functional bugs, same `found-in:*` and `root-cause:*` taxonomy from [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Don't build a parallel reporting pipeline; the dashboard already shows them next to UI bugs.

For SUT-side data-integrity bugs (the kind a *test* finds), use:
- `module:data` for invariants on tables shared across modules
- `module:<area>` (e.g. `module:cart`) when the invariant is module-local
- `root-cause:integration` for FK / cross-table issues
- `root-cause:logic` for in-row arithmetic (e.g. `total <> sum(line_items)`)

## Conventions used here (cross-references)

- **The skill that authors DB tests** — [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md). Picks the right pattern (in-memory unit / dockerised integration / SQL invariant / dbt) and emits the spec.
- **Production data quality (live)** — [`.agents/skills/data-quality-frameworks/SKILL.md`](../../.agents/skills/data-quality-frameworks/SKILL.md). Distinct lane: this folder is *pre-production* DB testing; that skill is live monitoring.
- **Test data fixtures** — [`.agents/skills/test-data-generator/SKILL.md`](../../.agents/skills/test-data-generator/SKILL.md). Seeds used by `tests/db/` come from there, not from a tester's GUI scratchpad.
- **Defect filing** — [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md). DB invariant failures use `module:<area>` + `severity:*` + `root-cause:logic|integration|requirements`.
- **The bar** — [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) for the canonical label catalogue.
- **CI implementation** — [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job"; `tests/db/` jobs follow the same env-matrix and artifact contract.
- **Workspace rule (Staging → PreProd)** — *"Database Merge Procedures for Staging and PreProd"* in your local IDE rules. Idempotency contract above is a re-statement of that rule, not a new one.
- **Dashboard panel** — [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) Section 3 (Defects). DB findings ride the same pipe as functional bugs.
- **Performance budgets for queries** — [`documents/performance/README.md`](../performance/README.md) §"SLO discipline". Query latency budgets follow the same shape as API budgets.

## Anti-patterns (do NOT do these)

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Querying `prod` with a write-capable user from a GUI | One stray `UPDATE … WHERE id = 1` (no `WHERE` filter pasted by accident) corrupts customer data | Use a `prod-readonly` profile; write-capable access requires a runbook + a second pair of eyes |
| Saving credentials in DBeaver / Workbench / pgAdmin's "remember password" | Laptop theft = full DB compromise; credentials end up in a `.dbeaver-data-sources.xml` synced to Dropbox | Read from 1Password CLI / Keychain / gopass at connect time; see each tool's §Secrets |
| Pasting `prod` data into a Slack DM to "ask the dev team" | PII leak; lawsuit risk; violation of SECURITY.md | Anonymise (`hash(email)`, `'X' for X in name`) before sharing; or share the **query**, not the result |
| Committing `SELECT * FROM cart LIMIT 100` as an "invariant" | Doesn't assert anything; just dumps rows | An invariant returns **zero rows on success**. See `tests/db/invariants/cart-totals.spec.ts` |
| Using DBeaver's "auto-commit on" against `staging` | One typo in a `DELETE` rolls into the next deploy | Auto-commit OFF on every non-`qa` profile; explicit `BEGIN; ... COMMIT;` per session |
| Hand-typing the same diagnostic query for the third time | Drift: each tester has a slightly different version | Save it as `documents/database-testing/queries/module/<area>/<name>.sql` the second time you write it |
| Generating DDL from the GUI's "Compare Schemas" and committing the output verbatim | Output isn't idempotent — fails the workspace rule on the next Staging → PreProd merge | Hand-edit to wrap with `IF OBJECT_ID … IS NULL` / `IF NOT EXISTS …` per the idempotency contract |
| Running `EXPLAIN ANALYZE` against `prod` for a slow OLTP query during business hours | `ANALYZE` actually executes the query; you just doubled the load on a struggling table | `EXPLAIN` (no `ANALYZE`) on `prod`, or run on `staging` with prod-shadow data |
| Storing query history only in the GUI's local cache | History is lost on tool re-install; not auditable | Saved queries under `queries/`; SQL log to `~/.<tool>/log/` rotated and archived |
| Mixing engines in one saved query (Postgres-flavoured `JSONB ->>` against MySQL) | Query "works on my laptop" because the tester's DBeaver is connected to Postgres; fails in CI | Header line `-- ENGINE: postgres` or `mysql`; lint rejects mismatches |

## Out of scope

This folder is **not**:

- A general "what is SQL" tutorial — see Markus Winand's [Use The Index, Luke](https://use-the-index-luke.com/) for indexing, or the [PostgreSQL](https://www.postgresql.org/docs/) / [MySQL](https://dev.mysql.com/doc/) docs for engine-specific syntax.
- A licence to skip [`tests/db/`](../../) — GUI saved queries are not a substitute for a CI-gated invariant spec; they're the **fast-iteration on-ramp**.
- Vendor advocacy — [`tool-comparison.md`](./tool-comparison.md) is honest about each tool's weaknesses (DBeaver's UI density, MySQL Workbench's macOS instability, pgAdmin 4's web-app sluggishness).
- A guide to the cloud-only features (DBeaver Cloud, MySQL Workbench Enterprise, pgAdmin shared servers) that require licences this repo does not provision.
- A licence to query `prod` write-capable. Read-only access is the rule; write access goes through the Staging → PreProd path the workspace rule governs.
- A replacement for **observability**. GUI saved queries answer point-in-time questions; live `pg_stat_statements` / `performance_schema` / Datadog DB monitoring tells you what's happening *right now*. Both are required.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (orientation, three-tool picture, idempotency contract, anti-patterns) | QA Lead |
| [`tool-comparison.md`](./tool-comparison.md) | ✅ v1 (decision matrix + migration paths) | QA Lead |
| [`dbeaver.md`](./dbeaver.md) | ✅ v1 (default cross-engine tool; secret hygiene + EXPLAIN + ER diagrams) | QA Platform |
| [`mysql-workbench.md`](./mysql-workbench.md) | ✅ v1 (MySQL/MariaDB lane; modelling + visual EXPLAIN) | QA Platform |
| [`pgadmin.md`](./pgadmin.md) | ✅ v1 (Postgres lane; EXPLAIN ANALYZE + role-based access) | QA Platform |

## Phase / curriculum connection

For the curriculum framing of where database testing fits in the QA learning arc:

- [`training/phase-4-api-and-quality/`](../../training/phase-4-api-and-quality/) — where DB testing fundamentals live alongside API testing.
- [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md) — the **how** for promoting GUI exploration to a CI-gated migration / invariant spec.

For the manager-tier framing (vendor decision RFC for paid tiers, e.g. DBeaver PRO / MySQL Workbench Enterprise / pgAdmin enterprise support):

- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — use this when proposing any paid DB-tool licence.
- [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) — worked example of the RFC pattern (visual regression, but the structure transfers).
