# MySQL Workbench — MySQL/MariaDB GUI Workflow Guideline

> The **MySQL-specialist** GUI for this repo. Oracle-stewarded but freely available (Community Edition, GPLv2). Used when the SUT is MySQL or MariaDB and the team needs first-class modelling, visual EXPLAIN, or user/privilege management — features DBeaver covers acceptably but not idiomatically.
>
> Read [`README.md`](./README.md) first for the shared discipline (idempotency, secret hygiene, dashboard contract). This doc is the **MySQL-Workbench-specific implementation** of that contract.

## TL;DR

- Install MySQL Workbench Community (free; GPLv2). Pin `>= 8.0.36`.
- One model per repo (`documents/database-testing/diagrams/<service>.mwb`); one connection per `profiles/.env.<ENV>` (`qa-mysql`, `uat-mysql`, `prod-mysql-readonly`).
- Credentials come from a secret manager at connect time — **never** "Save password in keychain" against `uat` / `prod`.
- Saved queries land in `documents/database-testing/queries/module/<area>/<name>.sql` with the canonical header from [`README.md`](./README.md).
- Visual EXPLAIN is the killer feature; commit it next to the SQL as `<name>.explain.png`.

## When to reach for MySQL Workbench

Use MySQL Workbench when:

- The SUT is **MySQL or MariaDB only** (no Postgres / SQLite in scope).
- You're **modelling a new schema** (5+ tables, FKs, normalisation) — Workbench's modeller is best-in-class for MySQL idioms (engine, charset, collation, generated columns, partitioning).
- You need to **visualise an EXPLAIN** — Workbench's visual EXPLAIN renders the join order graphically and labels MySQL-specific cost columns clearly.
- You're running a **user / privilege audit** — Workbench's "Users and Privileges" panel beats DBeaver's generic UI.
- You're **forward/reverse-engineering** between a `.mwb` model and a live schema.

Avoid MySQL Workbench when:

- The codebase has **Postgres or SQLite** alongside MySQL — use [DBeaver](./dbeaver.md) so testers don't context-switch.
- You're on **macOS Sonoma+** and the build is stuck on an old Workbench version (Workbench has had recurring stability issues on recent macOS) — fall back to DBeaver.
- You need **`tests/db/`-grade migration safety** — promote to the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md), don't lean on Workbench's "Synchronize Model" feature in CI.
- You're tempted to use the modeller's "Forward Engineer" output verbatim — it's not idempotent (see §Anti-patterns).

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local | `brew install --cask mysqlworkbench` | `>= 8.0.36` |
| Linux local | `.deb` / `.rpm` from [dev.mysql.com/downloads/workbench](https://dev.mysql.com/downloads/workbench/) | `>= 8.0.36` |
| Windows local | `.msi` installer from dev.mysql.com | `>= 8.0.36` |
| Docker (CI / headless) | Workbench is GUI-only; for headless use, drop to `mysql` CLI — see [`tool-comparison.md`](./tool-comparison.md) §"One-liner in a CI step" | n/a |

> **Workbench Enterprise is not free.** It adds Audit, Backup, and Cloud features Community doesn't have. This repo does not require it; an RFC ([`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md)) is required to provision it.

## Workspace structure (this repo's convention)

```
<your local Workbench>
└── Connections (Workbench Home tab)
    ├── qa-mysql                ← reads from profiles/.env.qa
    ├── uat-mysql               ← reads from profiles/.env.uat
    └── prod-mysql-readonly     ← reads from profiles/.env.prod (read-only role)

<repo>
└── documents/database-testing/
    ├── queries/module/<area>/<name>.sql           ← canonical SQL artifacts
    ├── queries/module/<area>/<name>.explain.png   ← Workbench Visual EXPLAIN export
    ├── diagrams/<service>-er.mwb                  ← Workbench model file (committed)
    └── diagrams/<service>-er.png                  ← exported PNG of the model
```

> **Why commit the `.mwb`?** Unlike DBeaver's `.erd`, MySQL Workbench's `.mwb` is the canonical interchange format for MySQL schemas — many DBA workflows (forward-engineer, sync model with live, generate diff DDL) round-trip through it. Pin Workbench `>= 8.0.36` so the `.mwb` stays readable across the team.

## Connections

Mirror the repo's [`profiles/.env.<ENV>`](../../profiles/) one-for-one. Three environments only — `qa-mysql`, `uat-mysql`, `prod-mysql-readonly`. **No `prod` write-capable connection is ever saved on a tester laptop.**

| Workbench setting | Source in repo |
|---|---|
| **Connection Name** | `<env>-mysql` |
| **Hostname** | `DB_HOST` from `profiles/.env.<ENV>` |
| **Port** | `DB_PORT` (default `3306`) |
| **Username** | `DB_USER` (read-only role for `prod-mysql-readonly`) |
| **Default Schema** | `DB_NAME` |
| **Password — "Store in Keychain"** | **OFF for `uat` / `prod`**; allowed for `qa` only (and even then, prefer the secret-manager pattern below) |
| **Advanced → Others → `program_name`** | `mysql-workbench-<your-handle>` so DBA can find you in `SHOW PROCESSLIST` |
| **SQL Editor → Confirm Data Changes** | **ON** for every connection |
| **SQL Editor → Safe Updates** | **ON** for `uat` and `prod-mysql-readonly` (rejects `UPDATE` / `DELETE` without a `WHERE` on a key column) |

### Safe Updates (the killer setting)

Workbench's "Safe Updates" mode is the single best protection against the `DELETE FROM cart;` typo. With it on, Workbench refuses to run any `UPDATE` or `DELETE` that doesn't reference an indexed key in the `WHERE` clause — the server rejects it with `Error Code: 1175`.

Turn it on **for every non-`qa` connection**. To run a legitimately unindexed mass update (rare; should be in a hotfix, not the GUI), explicitly run `SET SQL_SAFE_UPDATES = 0;` for that session and turn it back on immediately.

## Secrets

> **Workbench's "Store in Keychain" is encrypted-at-rest using macOS Keychain (good) but the credential is *also* cached in `~/.mysql/workbench/` plain-text on Linux versions until 8.0.34 — verify the box you're on.**

### The rule

**Never** "Store in Keychain" on `uat` / `prod`. For `qa`, it's tolerated; the secret-manager pattern below is preferred.

### Pattern: macOS Keychain via the OS, not Workbench's setting

If you've already added the password to Keychain ([`dbeaver.md`](./dbeaver.md) §Secrets), Workbench cannot read it directly. Two workarounds:

1. **Manual paste at connect time** — slow, but bulletproof for `prod-mysql-readonly`. Workbench prompts; you paste from Keychain Access; nothing persists.
2. **Wrapper script** that exports `MYSQL_PWD` before launching Workbench:
   ```bash
   #!/usr/bin/env bash
   export MYSQL_PWD="$(security find-generic-password -a "$USER" -s ai-qa-training/qa-mysql -w)"
   open -a "MySQLWorkbench"
   ```
   Caveat: `MYSQL_PWD` is read by the `mysql` client, **not** by Workbench's GUI; this only helps if you also drop to a CLI tab. For Workbench-GUI auth, use option 1.

### Pattern: 1Password CLI (recommended for teams)

Workbench has no native "external password program" hook. The team-friendly path:

1. Per session, `op signin`.
2. `op item get qa-mysql --fields password --reveal | pbcopy` (macOS).
3. Workbench prompts; paste with `Cmd+V`. The clipboard auto-clears in ~30 sec on macOS Sonoma+.

It's manual, but auditable; no credential ever lives in a Workbench config file.

## Saving a query (the canonical header)

Same shape as [`dbeaver.md`](./dbeaver.md) §"Saving a query" — see [`README.md`](./README.md) §"Shared discipline" item 4 / 5. Reproduced here for self-containment:

```sql
-- OWNER: @khanhdo
-- INTENT: invariant
-- ENGINE: mysql
-- WHEN-TO-RUN: per-PR + nightly
-- MODULE: cart
-- DESCRIPTION:
--   Every cart total must equal the sum of its line items (MySQL).
--   Returns the IDs of carts that violate the invariant.
--   Expected result on green: zero rows.

SELECT c.id
FROM   cart c
LEFT   JOIN cart_item ci ON ci.cart_id = c.id
GROUP  BY c.id, c.total
HAVING c.total <> COALESCE(SUM(ci.qty * ci.unit_price), 0);
```

The `ENGINE: mysql` line is non-negotiable for the lint job — it lets the next tester know not to translate this to Postgres without re-testing.

## Visual EXPLAIN — the killer feature

Workbench's visual EXPLAIN (Query → **Explain Current Statement**) is the best of any free tool for MySQL. It renders the query plan as a tree where each node is colour-coded by cost (red = full table scan, yellow = index scan, green = covering index).

For any saved query that touches > 10k rows:

1. Run `EXPLAIN <query>` first to confirm the plan parses (occasionally Workbench's renderer chokes on complex CTEs; fall back to text `EXPLAIN FORMAT=JSON`).
2. Query → **Explain Current Statement** (`Cmd+Alt+X` on macOS).
3. Right-click the diagram → **Save image as…** → `<query-name>.explain.png`.
4. Also paste the text plan output into `<query-name>.explain.txt` for diff-ability.
5. Commit all three (`<name>.sql`, `<name>.explain.png`, `<name>.explain.txt`) together.

> **Don't trust visual EXPLAIN blindly.** On MySQL 8.0.32+, a known bug occasionally swaps the join order in the diagram. Cross-check with `EXPLAIN FORMAT=JSON` text output if the picture surprises you. Reference: [MySQL Bugs #110528](https://bugs.mysql.com/bug.php?id=110528) (occasionally re-emerges).

## Modelling — the second killer feature

Use Workbench's **Modeller** when you're authoring a new schema with 5+ tables and FK relationships. The MySQL-specific niceties (engine choice, charset, collation, partitioning, generated columns, JSON type) all have first-class UI.

### Workflow

1. **File → New Model** (a `.mwb` file, not the live DB).
2. Add tables, columns, FKs visually.
3. **File → Save** as `documents/database-testing/diagrams/<service>-er.mwb`.
4. **File → Export → PNG** as `documents/database-testing/diagrams/<service>-er.png` for the docs site / Slack.
5. Use **Database → Forward Engineer…** to *generate* DDL — but **do not commit the output verbatim**. The DDL needs to be wrapped per the workspace rule (`IF OBJECT_ID … IS NULL CREATE TABLE` for SQL Server, `CREATE TABLE IF NOT EXISTS` for MySQL).
6. Hand-edit the generated DDL into a migration file under `tests/db/migrations/<YYYY-MM-DD>_<description>.sql`.
7. Wrap the migration in a `tests/db/migrations/<filename>.spec.ts` via the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) — that's what gates the PR.

### "Synchronize Model" — when (and when not) to use it

Workbench's **Database → Synchronize Model** can compare a `.mwb` model against the live schema and emit ALTER statements. Useful for *understanding* drift; **dangerous** as a CI input, because:

- The generated `ALTER TABLE` is not idempotent.
- It assumes the model is the source-of-truth, but in this repo the source-of-truth is the migration files under `tests/db/migrations/`.

**Use it as a diagnostic** ("what drifted?"), **not as a code generator**. The migration is hand-authored.

## User / privilege management

Workbench's **Server → Users and Privileges** is the cleanest UI for `CREATE USER` / `GRANT` / `REVOKE` against MySQL.

When auditing privileges:

1. Server → **Users and Privileges**.
2. Pick the user → **Schema Privileges** tab.
3. Verify least-privilege:
   - `prod-readonly` user → `SELECT` on application schemas only; no `SUPER`, `RELOAD`, `PROCESS`, `FILE`, `SHUTDOWN`.
   - Application user → `SELECT, INSERT, UPDATE, DELETE` on application schemas; no `DROP`, `ALTER`, `CREATE`.
   - Migration user (used by `tests/db/migrations/`) → `CREATE`, `ALTER`, `DROP`, `INDEX` on application schemas only; never on `mysql` system schema.
4. Export the privilege grid (`File → Export grid`) and commit to `documents/database-testing/audits/<env>-privileges-<YYYY-MM-DD>.csv` for change-history.

> **Quarterly cadence:** privilege audit lives in `documents/database-testing/audits/`; the cron job in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Quarterly DB privilege audit" reads the latest CSV and files a `severity:major` `module:auth` defect if a non-readonly account holds more than its declared grants.

## Hotfix authoring (MySQL flavour)

Same shape as [`dbeaver.md`](./dbeaver.md) §"Hotfix authoring", with MySQL-specific idempotency idioms:

```sql
-- OWNER: @khanhdo
-- INTENT: hotfix
-- ENGINE: mysql
-- TARGET: Database/Scripts/Hotfix/2026-05-09_fix-cart-currency-default.sql
-- WORKSPACE-RULE: Database Merge Procedures for Staging and PreProd
-- DESCRIPTION:
--   Backfills cart.currency where NULL after the 2026-05-08 deploy (MySQL).

-- Idempotent column add (MySQL 8.0.29+ supports IF NOT EXISTS)
ALTER TABLE cart
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD';

-- Idempotent backfill (LIMIT to avoid Safe Updates, batch if > 100k rows)
UPDATE cart
   SET currency = 'USD'
 WHERE currency IS NULL OR currency = '';
```

For older MySQL versions (`< 8.0.29`) where `ADD COLUMN IF NOT EXISTS` isn't supported, wrap with `INFORMATION_SCHEMA` lookup:

```sql
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'cart' AND column_name = 'currency'
);
SET @sql := IF(@col_exists = 0,
               'ALTER TABLE cart ADD COLUMN currency CHAR(3) NOT NULL DEFAULT ''USD''',
               'SELECT ''cart.currency already exists, skipping'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

Re-run twice on `qa` to verify idempotency. Save under `documents/database-testing/queries/hotfix/YYYY-MM-DD_<Description>.sql` per the workspace rule's naming convention.

## Workbench-specific anti-patterns

> The cross-tool anti-patterns in [`README.md`](./README.md) still apply. These are Workbench-only.

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Use `Database → Forward Engineer` output verbatim as a migration | Output is not idempotent — fails the workspace rule on the next Staging → PreProd merge | Hand-edit; wrap with `IF NOT EXISTS` / `INFORMATION_SCHEMA` guard per §"Hotfix authoring" |
| Use `Database → Synchronize Model` as a CI step | Assumes model is source-of-truth; in this repo, the migration file is | Use Synchronize as a *diagnostic* only; author migrations by hand |
| Run Workbench against `prod` with **Safe Updates OFF** | One typo in `DELETE` corrupts customer data | Safe Updates **ON** for every non-`qa` connection |
| Open the SQL editor against `prod-mysql-readonly` and forget to set the default schema | Stray `USE production_db;` selects the wrong DB; queries return wrong data | Always set "Default Schema" in the connection profile; never let Workbench infer it |
| Save the `.mwb` to iCloud / Dropbox | The model file may contain hashed-but-recoverable connection metadata | Save under `documents/database-testing/diagrams/` (committed in repo); never under a synced folder |
| Trust Visual EXPLAIN's diagram on MySQL 8.0.32+ without cross-checking text EXPLAIN | Known renderer bug occasionally swaps join order in the picture | Always paste `EXPLAIN FORMAT=JSON` text output next to the PNG |
| Open `Server → Status` against `prod` during peak | Workbench polls `SHOW GLOBAL STATUS` every 3 sec — adds load | Status panel is for `qa` / `uat`; use Datadog / Percona PMM for `prod` |
| Edit a row directly in the result grid against `uat` / `prod` | Workbench's inline edit fires `UPDATE … WHERE <pk> = …` immediately on Enter | Result grid editing is **disabled** by Safe Updates anyway; if it isn't, you've turned Safe Updates off — turn it back on |

## CI integration (Workbench is not in CI; CLI is)

Workbench is GUI-only; CI uses the `mysql` CLI driver. Translation:

| Workbench action | CI equivalent |
|---|---|
| Run query (`Cmd+Enter`) | `mysql -h $DB_HOST -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < query.sql` |
| Verify "zero rows" invariant | `mysql -BN -e "$(cat query.sql)" \| wc -l` → assert `0` |
| Save EXPLAIN (text fallback) | `mysql -e "EXPLAIN FORMAT=JSON $(cat query.sql)" > query.explain.json` |
| Run hotfix | `mysql --execute "SOURCE hotfix.sql"` (or `mysql < hotfix.sql`) |
| Forward-engineer DDL → migration | n/a — author migration files by hand under `tests/db/migrations/` |

The full GitHub Actions snippet lives in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job". The `tests/db/invariants/*.spec.ts` files (added by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md)) wrap these CLI invocations in jest and assert on the result.

## Cross-references

- [`README.md`](./README.md) — the shared discipline (idempotency, secrets, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when MySQL Workbench is the right tool vs DBeaver / pgAdmin / `tests/db/`.
- [`dbeaver.md`](./dbeaver.md) — default cross-engine GUI; same shape, broader engine coverage.
- [`pgadmin.md`](./pgadmin.md) — Postgres-specialist GUI; the symmetric tool for the other dominant engine.
- [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md) — promote a Workbench-authored query / migration into a CI-gated spec.
- [`documents/security/toolchain.md`](../security/toolchain.md) §"gitleaks" — pre-commit hook that catches credentials accidentally committed.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — concrete CI implementation for the "Database invariants job".
- Workspace rule **"Database Merge Procedures for Staging and PreProd"** — the canonical idempotency contract Workbench-authored hotfix scripts must satisfy.
