# Database Tool Comparison — When to Use What

> Decision aid for choosing between **[DBeaver](./dbeaver.md)**, **[MySQL Workbench](./mysql-workbench.md)**, **[pgAdmin](./pgadmin.md)**, and the **in-repo `tests/db/`** authored by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md). All four can co-exist; this doc tells you which one earns its keep for which scenario.
>
> **TL;DR:**
> - **Multi-engine codebase (Postgres + MySQL + SQLite)** → DBeaver
> - **MySQL/MariaDB only, modelling-heavy** → MySQL Workbench
> - **Postgres only, perf-debug heavy (`EXPLAIN ANALYZE`, `pg_stat_statements`)** → pgAdmin
> - **CI gate on every PR / migration safety** → `tests/db/` (jest + dockerised engine)
> - **One-liner in a CI step** → `psql -f` / `mysql <` directly (no GUI in the loop)
> - **Hotfix authoring (Staging → PreProd)** → DBeaver scratchpad → idempotency-wrapped `.sql` per the workspace rule

## The 5-criterion matrix

Score each tool 1-5 (5 = best fit) for the criteria the team weights highest.

| Criterion | DBeaver | MySQL Workbench | pgAdmin | `tests/db/` |
|---|---|---|---|---|
| **Engine breadth (Postgres + MySQL + SQLite + …)** | ⭐⭐⭐⭐⭐ | ⭐ (MySQL only) | ⭐ (Postgres only) | ⭐⭐⭐⭐⭐ (engine-agnostic) |
| **Speed of first connection** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (MySQL) | ⭐⭐⭐⭐⭐ (Postgres) | ⭐⭐ (docker-compose up) |
| **ER diagram / schema visualisation** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (best-in-class) | ⭐⭐⭐ | ⭐ (n/a) |
| **EXPLAIN / query plan UX** | ⭐⭐⭐⭐ (text + tree) | ⭐⭐⭐⭐⭐ (visual EXPLAIN) | ⭐⭐⭐⭐⭐ (`EXPLAIN ANALYZE` + buffers) | ⭐⭐ (assertion-only) |
| **PR-gating in CI** | ⭐ | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **Migration safety (idempotency, rollback)** | ⭐⭐ (manual) | ⭐⭐ (manual) | ⭐⭐ (manual) | ⭐⭐⭐⭐⭐ (enforced by skill + workspace rule) |
| **Non-engineer friendly (PM, support)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ (web-app feels heavy) | ⭐ |
| **AI-assist for query authoring** | ⭐⭐⭐⭐ (DBeaver AI plugin) | ⭐⭐ (limited) | ⭐⭐ (limited) | ⭐⭐⭐⭐⭐ ([`database-testing`](../../.agents/skills/database-testing/SKILL.md)) |
| **Vendor lock-in risk** | ⭐⭐⭐⭐⭐ (Apache 2.0 + open formats) | ⭐⭐⭐ (Oracle-stewarded; free tier shrinking) | ⭐⭐⭐⭐⭐ (PostgreSQL-licenced; community-led) | ⭐⭐⭐⭐⭐ (in-repo) |
| **TCO at 5+ engineers/year** | $ (Community is free) | $ (Community is free; Enterprise is $$) | $ (free) | $ (already paid) |

The repo's default weighting puts **engine breadth + idempotency + lock-in risk** at the top, which is why **DBeaver is the canonical GUI** and `tests/db/` is the canonical regression layer. The two engine-specific tools are complements for teams that have already standardised on one engine.

## The decision tree

```
Q1. Is this a one-shot ad-hoc query you'll run once, never again?
       │
       ├─ Yes  → Whatever GUI is open. Don't over-engineer it.
       │        (But if you find yourself running it twice, save it — see Q4.)
       │
       └─ No   → Q2

Q2. Is the SUT MySQL/MariaDB, Postgres, or both/other?
       │
       ├─ Both / multiple engines    → DBeaver. Do not maintain two GUIs.
       │
       ├─ MySQL/MariaDB only         → DBeaver (default) OR MySQL Workbench
       │                               (if your team is already deep in MySQL idioms
       │                                or you need the visual modeller)
       │
       └─ Postgres only              → DBeaver (default) OR pgAdmin
                                        (if you need first-class EXPLAIN ANALYZE,
                                         pg_stat_statements, RLS, or `auto_explain`)

Q3. Does the query need to fail the build if it returns rows?
       │
       ├─ Yes  → It's an INVARIANT. Save the .sql to
       │        documents/database-testing/queries/module/<area>/<name>.sql,
       │        then ask the database-testing skill to wrap it in a tests/db/invariants/*.spec.ts
       │
       └─ No   → It's exploration / debug. Save the .sql anyway (header
                 INTENT: exploratory or perf-debug) so the next tester finds it.

Q4. Are you about to run it for the second time?
       │
       ├─ Yes  → Save it. Right now. Before you run it.
       │        documents/database-testing/queries/module/<area>/<name>.sql
       │        Header: -- OWNER: -- INTENT: -- ENGINE: -- WHEN-TO-RUN:
       │
       └─ No   → Run it; if useful, come back to Q4.

Q5. Is this a Staging → PreProd hotfix (the workspace rule's domain)?
       │
       ├─ Yes  → Author in DBeaver scratchpad → wrap with idempotency guard
       │        (IF OBJECT_ID … IS NULL / IF NOT EXISTS) per the workspace rule →
       │        save under documents/database-testing/queries/hotfix/YYYY-MM-DD_<Description>.sql →
       │        promote to Database/Scripts/Hotfix/ via the team's release process.
       │
       └─ No   → Stay in documents/database-testing/queries/module/<area>/.
```

## Per-scenario verdicts

| Scenario | Best fit | Why | Watch-out |
|---|---|---|---|
| New tester onboarding ("set up a DB client") | **DBeaver** | One install covers every engine they'll meet | They will try to save the password; redirect to the secret-manager pattern in [`dbeaver.md`](./dbeaver.md) §Secrets |
| "Why is this query slow on Postgres?" | **pgAdmin** | `EXPLAIN ANALYZE … BUFFERS` rendered as a tree; couples with `pg_stat_statements` view | Don't run `EXPLAIN ANALYZE` on `prod` during peak; it actually executes |
| "Why is this query slow on MySQL?" | **MySQL Workbench** | Visual EXPLAIN renders the join order; MySQL-specific cost columns labeled clearly | The visual EXPLAIN occasionally lies on > 8.0; cross-check with text `EXPLAIN FORMAT=JSON` |
| Designing a new schema (5+ tables, FKs, normalisation) | **MySQL Workbench** (MySQL) / **pgAdmin** (Postgres) / **DBeaver** (cross-engine) | The engine-specific modellers know the engine's quirks (ON UPDATE CASCADE, generated columns, partial indexes) | DBeaver's modeller is generic; for one-engine modelling work, the native tool wins |
| Cross-engine migration (Postgres → MySQL or v.v.) | **DBeaver** | Connect both side-by-side; data export/import wizard handles the translation | Dialect differences (`JSONB` vs `JSON`, `RETURNING` vs `LAST_INSERT_ID()`) still need hand work |
| Daily smoke check that all clients have ≥ 1 row in `clients` | **`tests/db/`** invariant | A one-line SQL invariant gated in CI is more reliable than "I run it every Monday" | Don't forget to wire it into the cron invariant sweep ([`README.md`](./README.md) §"CI shape") |
| Migration safety: "does `2026-05-09_add-cart-currency.sql` actually preserve rows?" | **`tests/db/`** migration spec | Dockerised engine; seed → migrate → assert; idempotency check; rollback check | The GUI **cannot** reliably do this; you'd have to script it by hand and it's been done already in [`database-testing`](../../.agents/skills/database-testing/SKILL.md) |
| Hotfix authoring | **DBeaver** scratchpad → save under `queries/hotfix/YYYY-MM-DD_*.sql` | Authoring is iterative — GUI is faster than `psql -f`; saving makes it auditable | The workspace rule's idempotency contract applies — wrap with `IF OBJECT_ID …` / `IF NOT EXISTS …` before commit |
| "Show the PM how many users churned last month" | **DBeaver** | The result grid + chart export is good enough for a Slack screenshot | Don't paste PII into Slack; redact or hash before sharing |
| Stored procedure debugging on SQL Server | **DBeaver** (or SQL Server Management Studio if available) | DBeaver has decent T-SQL support; SSMS is the canonical tool but isn't open-source | Neither MySQL Workbench nor pgAdmin help here at all |
| Postgres role / privilege audit | **pgAdmin** | Native UI for roles, GRANTs, RLS policies | DBeaver shows them but the workflow is clunky |
| MySQL user / privilege audit | **MySQL Workbench** | Native "Users and Privileges" panel | DBeaver shows them but the workflow is clunky |

## Migration paths

### "We're standardising on one GUI — what do we delete?"

1. **DBeaver wins by default.** Move all per-engine queries into the standard `documents/database-testing/queries/module/<area>/` shape; the engine-specific tools become optional secondary clients.
2. **Keep MySQL Workbench / pgAdmin** only for engine-specific operations the unified GUI doesn't do well (visual EXPLAIN on MySQL, role management on Postgres). Document the exception in the per-tool doc.
3. **Don't keep all three on every laptop.** That's three places passwords could leak from. Tester laptops have DBeaver + at most one engine-native client.

### "We were using a GUI; now we want CI gates"

1. Audit `documents/database-testing/queries/` for queries with `INTENT: invariant` in their header.
2. For each, ask the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) to generate `tests/db/invariants/<area>.spec.ts` that imports the `.sql` and asserts the result set is empty.
3. Wire the spec into the CI matrix per [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job".
4. Track adoption: count of `INTENT: invariant` `.sql` files vs count of `tests/db/invariants/*.spec.ts` files. Goal: 1:1.

### "We were using `tests/db/`; now a stakeholder wants ad-hoc access"

1. Read-only credentials → 1Password / Keychain / gopass per the secret-hygiene pattern.
2. DBeaver install for cross-engine, or the engine-native tool if they're an engine specialist.
3. Show them `documents/database-testing/queries/` so they don't re-author what's already there.
4. Tell them about the `INTENT:` header convention so anything they save lands in the right shape for promotion.

## Anti-patterns common to *all* GUIs

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| "I'll just save the password in DBeaver / Workbench / pgAdmin" | The connection file ends up in cloud-synced backups; one stolen laptop = full DB compromise | Read the credential at connect time from a secret manager — see each tool's §Secrets |
| Connecting to `prod` with a write-capable user | One stray `UPDATE` corrupts customer data | `prod-readonly` profile only; write requires runbook + second pair of eyes |
| Pasting query results into Slack | PII leak | Anonymise before sharing; or share the **query**, not the result |
| Generating DDL via "Compare Schemas" and committing it verbatim | Output isn't idempotent — fails the workspace rule on the next merge | Hand-edit to wrap with the idempotency guards the workspace rule mandates |
| Maintaining the same query across all three GUIs | The day someone updates one and forgets the other two, you have a drift bug | Single canonical `.sql` under `documents/database-testing/queries/`; every GUI just opens that file |

## Cross-references

- [`README.md`](./README.md) — orientation, three-tool picture, idempotency contract, the shared discipline.
- [`dbeaver.md`](./dbeaver.md) — default tool; install, connections, secret hygiene, EXPLAIN, ER diagrams.
- [`mysql-workbench.md`](./mysql-workbench.md) — MySQL lane; modelling, visual EXPLAIN, user management.
- [`pgadmin.md`](./pgadmin.md) — Postgres lane; EXPLAIN ANALYZE, role-based access, `pg_stat_statements`.
- [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md) — the skill that promotes saved queries into CI-gated specs.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — concrete CI implementation for the "Database invariants" job.
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — DB findings ride the same `module:*` / `severity:*` taxonomy.
