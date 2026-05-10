# pgAdmin 4 — PostgreSQL GUI Workflow Guideline

> The **PostgreSQL-specialist** GUI for this repo. Web-app architecture (Python/Flask backend + React frontend), PostgreSQL-licensed, community-led. Used when the SUT is PostgreSQL and the team needs first-class `EXPLAIN ANALYZE`, `pg_stat_statements`, role/RLS management, or `auto_explain` integration — features DBeaver covers acceptably but not idiomatically.
>
> Read [`README.md`](./README.md) first for the shared discipline (idempotency, secret hygiene, dashboard contract). This doc is the **pgAdmin-specific implementation** of that contract.

## TL;DR

- Install pgAdmin 4 Desktop (free; PostgreSQL-licensed). Pin `>= 8.5`.
- One server group per repo (`ai-qa-training`); one server per `profiles/.env.<ENV>` (`qa-postgres`, `uat-postgres`, `prod-postgres-readonly`).
- Credentials come from a secret manager at connect time — **never** "Save password".
- Saved queries land in `documents/database-testing/queries/module/<area>/<name>.sql` with the canonical header.
- `EXPLAIN ANALYZE … BUFFERS` rendered as a tree is the killer feature; commit the JSON next to the SQL as `<name>.explain.json`.

## When to reach for pgAdmin

Use pgAdmin when:

- The SUT is **PostgreSQL only** (no MySQL / SQLite in scope).
- You're **debugging a slow query** — `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` rendered as a graphical tree with cost / rows / actual-time per node.
- You're **auditing roles, GRANTs, and RLS policies** — pgAdmin's UI for these beats DBeaver's generic schema browser.
- You're using **`pg_stat_statements`** to find the top 10 slowest queries on `prod-readonly` — pgAdmin's Dashboard tab surfaces it without you typing the query.
- You need **`auto_explain` log analysis** — pgAdmin can tail and parse the log on a server.

Avoid pgAdmin when:

- The codebase has **MySQL or SQLite** alongside Postgres — use [DBeaver](./dbeaver.md) so testers don't context-switch.
- You're **on a slow laptop / over a VPN** — pgAdmin's web-app architecture feels heavy compared to DBeaver's native UI; query results > 100k rows in the data grid will stall the browser.
- You need **`tests/db/`-grade migration safety** — promote to the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md), not pgAdmin's "Backup/Restore" wizard.
- You're tempted to use the GUI's **"ERD Tool"** generated DDL verbatim — it's not idempotent (see §Anti-patterns).

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local | `brew install --cask pgadmin4` | `>= 8.5` |
| Linux local | Repo per [pgadmin.org/download](https://www.pgadmin.org/download/) (Debian/Ubuntu has `pgadmin4-desktop`) | `>= 8.5` |
| Windows local | `.exe` installer from pgadmin.org | `>= 8.5` |
| Docker (server mode, shared) | `docker run -p 5050:80 -e PGADMIN_DEFAULT_EMAIL=… -e PGADMIN_DEFAULT_PASSWORD=… dpage/pgadmin4` | only with an RFC ([`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md)) — shared-server mode introduces a credential-aggregation risk |

> **Desktop vs Server mode.** Desktop runs locally; one user, one machine. Server mode runs in a container shared by multiple users — convenient for a team, but every user's connection profile (and saved password, if anyone clicks "Save") lives in the same `pgadmin_database`. **Default to Desktop.** Server mode requires a vendor-decision RFC.

## Workspace structure (this repo's convention)

```
<your local pgAdmin Desktop>
└── Servers
    └── Server Group: "ai-qa-training"
        ├── Server: "qa-postgres"            ← reads from profiles/.env.qa
        ├── Server: "uat-postgres"           ← reads from profiles/.env.uat
        └── Server: "prod-postgres-readonly" ← reads from profiles/.env.prod (read-only role)

<repo>
└── documents/database-testing/
    ├── queries/module/<area>/<name>.sql            ← canonical SQL artifacts
    ├── queries/module/<area>/<name>.explain.json   ← pgAdmin's "Download" of the EXPLAIN tree
    ├── queries/module/<area>/<name>.explain.txt    ← text fallback for diff-ability
    ├── diagrams/<service>-er.png                   ← exported PNG of pgAdmin's ERD Tool output
    └── audits/<env>-roles-<YYYY-MM-DD>.csv         ← exported privilege grid (quarterly)
```

> **Why no `.pgerd` (pgAdmin's ERD file)?** pgAdmin 4 has shipped multiple breaking changes to the `.pgerd` JSON format between minor versions. PNG/SVG exports are portable; the `.pgerd` is throwaway. If you need a re-editable model file for MySQL, use [`mysql-workbench.md`](./mysql-workbench.md)'s `.mwb` instead.

## Connections (Servers)

Mirror the repo's [`profiles/.env.<ENV>`](../../profiles/) one-for-one. Three servers only — `qa-postgres`, `uat-postgres`, `prod-postgres-readonly`. **No `prod` write-capable connection is ever saved on a tester laptop.**

| pgAdmin setting (Server → Properties) | Source in repo |
|---|---|
| **General → Name** | `<env>-postgres` |
| **Connection → Host name/address** | `DB_HOST` from `profiles/.env.<ENV>` |
| **Connection → Port** | `DB_PORT` (default `5432`) |
| **Connection → Maintenance database** | `DB_NAME` |
| **Connection → Username** | `DB_USER` (read-only role for `prod-postgres-readonly`) |
| **Connection → Password** | **NEVER STORED** — see §Secrets |
| **Connection → Save password?** | **OFF** for every server (no exceptions, not even `qa`) |
| **Parameters → `application_name`** | `pgadmin-<your-handle>` so DBA can `SELECT * FROM pg_stat_activity` and find you |
| **SSL → SSL mode** | `require` for `uat` / `prod-postgres-readonly`; `prefer` allowed for `qa` |
| **Advanced → Role to use after connect** | `app_readonly` for `prod-postgres-readonly`; never blank, never `postgres` superuser |
| **Advanced → Auto-rollback on error** | **ON** for every server (default in pgAdmin 4 ≥ 6, but verify) |

## Secrets

> **pgAdmin's "Save password" is the worst of the three GUIs.** It stores the password in `~/.pgadmin/pgadmin4.db` (a SQLite file) using a master password (set on first launch). The master password is *also* user-controlled, and many testers set it to `password` and never rotate. One stolen laptop + a Time-Machine backup = a recoverable credential per server.

### The rule

**Never** check "Save password" in pgAdmin. Always paste at connect time from a secret manager.

### Pattern: macOS Keychain (manual paste)

```bash
security add-generic-password \
  -a "$USER" \
  -s "ai-qa-training/qa-postgres" \
  -w "<paste password once>"

# At pgAdmin connect time:
security find-generic-password -a "$USER" -s "ai-qa-training/qa-postgres" -w | pbcopy
# pgAdmin prompts → Cmd+V
```

The clipboard auto-clears in ~30 sec on macOS Sonoma+. No credential ever lives in pgAdmin's SQLite.

### Pattern: 1Password CLI (recommended for teams)

```bash
op item get "qa-postgres" --fields password --reveal | pbcopy
# pgAdmin prompts → Cmd+V
```

### Pattern: `~/.pgpass` (works for `psql` and pgAdmin's "Use libpq" mode)

`~/.pgpass` is the libpq-native credentials file. pgAdmin honours it when "Password" is left blank in the connection profile (because pgAdmin uses libpq under the hood for the actual connection).

```
# ~/.pgpass — chmod 0600
qa-postgres-host:5432:cart:app_readonly:<password>
```

```bash
chmod 0600 ~/.pgpass   # libpq refuses to read it otherwise
```

> **Why `~/.pgpass` is acceptable here but DBeaver's "Save password" isn't:** `~/.pgpass` is a well-known, OS-level convention (PostgreSQL ships with it); it's `chmod 0600` enforced by libpq; it doesn't get cloud-synced by default; and most importantly, it is the *same file* `psql` / migration tools use, so there's no separate copy of the credential to leak.

> **Audit:** run `grep -ri 'savePassword.*true' ~/.pgadmin/` periodically. Any hit is a violation. The pre-commit hook in [`documents/security/toolchain.md`](../security/toolchain.md) §"gitleaks" catches credentials that escape into the repo.

## Saving a query (the canonical header)

Same shape as [`dbeaver.md`](./dbeaver.md) §"Saving a query" — see [`README.md`](./README.md) §"Shared discipline" item 4 / 5. Reproduced here for self-containment:

```sql
-- OWNER: @khanhdo
-- INTENT: invariant
-- ENGINE: postgres
-- WHEN-TO-RUN: per-PR + nightly
-- MODULE: cart
-- DESCRIPTION:
--   Every cart total must equal the sum of its line items (Postgres).
--   Returns the IDs of carts that violate the invariant.
--   Expected result on green: zero rows.

SELECT c.id
FROM   cart c
LEFT   JOIN cart_item ci ON ci.cart_id = c.id
GROUP  BY c.id, c.total
HAVING c.total <> COALESCE(SUM(ci.qty * ci.unit_price), 0);
```

The `ENGINE: postgres` line is non-negotiable for the lint job — it tells the next tester not to translate this to MySQL without re-testing. Postgres-specific operators (`->>`, `JSONB`, `RETURNING`, `ILIKE`) won't survive a copy-paste.

## EXPLAIN ANALYZE — the killer feature

pgAdmin's Query Tool has a dedicated **EXPLAIN** button (the play-with-magnifying-glass icon, or **F7** for `EXPLAIN`, **Shift+F7** for `EXPLAIN ANALYZE`). The output renders as a graphical tree where each node is colour-coded by cost — and uniquely on Postgres, you can also see actual time, actual rows, and buffer usage per node.

For any saved query that touches > 10k rows:

1. Open the Query Tool against the right server (`qa` for development; `staging` for prod-shadow data).
2. Run the query first to verify it parses (`F5`).
3. **Shift+F7** for `EXPLAIN ANALYZE`. Add buffers via the gear icon → check **Buffers** and **Verbose**.
4. The tree appears in the **Explain** tab. Hover any node to see actual time + rows + buffer hits.
5. **Download** (top-right of the Explain tab) → save as `<name>.explain.json` for machine-diffability.
6. Also run `EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <query>` in the SQL editor and copy the text output to `<name>.explain.txt`.
7. Commit all three (`<name>.sql`, `<name>.explain.json`, `<name>.explain.txt`) together.

> **CRITICAL: Do not run `EXPLAIN ANALYZE` on `prod` during business hours.** `ANALYZE` actually executes the query — for an `UPDATE` or `DELETE` it actually mutates rows (then rolls back, but the locks are real). For a slow `SELECT` on a 100M-row table, you just doubled the load on a struggling DB. Use **`EXPLAIN`** alone (no `ANALYZE`) on `prod`; use `EXPLAIN ANALYZE` only on `staging` with prod-shadow data.

## `pg_stat_statements` — top-10 slow queries

If the DBA has enabled `pg_stat_statements` (the canonical Postgres slow-query log), pgAdmin surfaces it in the **Dashboard** tab when you select the server. The default ordering is by `mean_exec_time` — perfect for "which query do I optimise next?".

To turn a `pg_stat_statements` row into a saved invariant query:

1. Dashboard → click the slow query → **Copy** the SQL.
2. New query in the SQL editor → paste, run `EXPLAIN ANALYZE`.
3. Save as `documents/database-testing/queries/module/<area>/perf-debug-<descriptor>.sql` with header `-- INTENT: perf-debug`.
4. If the optimisation lands, the same SQL becomes a **performance budget assertion** under [`documents/performance/README.md`](../performance/README.md) §"SLO discipline" — query latency budgets follow the same shape as API budgets.

## ERD Tool

pgAdmin 4 ships with an **ERD Tool** (Tools → **ERD Tool**) that reverse-engineers a schema into a visual diagram. Adequate for documentation, mediocre for design.

### Workflow

1. Right-click the database → **Generate ERD**.
2. Customise (hide audit columns, group related tables).
3. **File → Export → PNG** as `documents/database-testing/diagrams/<service>-er.png`.
4. Optionally **File → Save** the `.pgerd` — but warn the team about format-drift between pgAdmin minor versions (see §"Workspace structure").

### "Generate SQL" — when (and when not) to use it

ERD Tool's **Generate SQL** emits `CREATE TABLE` statements. **Do not commit verbatim** — output is not idempotent and fails the workspace rule. Hand-edit:

```sql
-- pgAdmin generates:
CREATE TABLE public.cart ( id SERIAL PRIMARY KEY, … );

-- Your committed migration must be:
CREATE TABLE IF NOT EXISTS public.cart ( id SERIAL PRIMARY KEY, … );

-- Or, for `ALTER` on an existing table:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'cart' AND column_name = 'currency'
    ) THEN
        ALTER TABLE public.cart ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'USD';
    END IF;
END $$;
```

## Role / RLS audit

Postgres's role + Row-Level Security (RLS) model is more granular than MySQL's. pgAdmin's UI for it (right-click the database → **Properties** → **Security** tab; or expand `Login/Group Roles` in the navigator) is the cleanest of any free tool.

When auditing privileges:

1. Server → **Login/Group Roles**.
2. Pick the role → **Properties** → **Privileges** + **Membership**.
3. Verify least-privilege:
   - `app_readonly` → `SELECT` on application schemas only; no `CONNECT` to non-application DBs; not member of `pg_read_all_data` (Postgres 14+).
   - `app_writer` → `SELECT, INSERT, UPDATE, DELETE` on application schemas; **never** `CREATE` (DDL is the migration user's privilege).
   - `app_migrator` → `CREATE`, `ALTER`, `DROP` on application schemas only; not on `pg_catalog`.
4. For each table with RLS — right-click the table → **Properties** → **RLS Policies** tab — verify the policy hasn't been disabled.
5. Export the privilege grid via the SQL output (right-click role → **CREATE Script**) and commit to `documents/database-testing/audits/<env>-roles-<YYYY-MM-DD>.sql` for change-history.

> **Quarterly cadence:** privilege audit lives in `documents/database-testing/audits/`; the cron job in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Quarterly DB privilege audit" reads the latest export and files a `severity:major` `module:auth` defect if a non-readonly role holds more than its declared grants.

## Hotfix authoring (Postgres flavour)

Same shape as [`dbeaver.md`](./dbeaver.md) §"Hotfix authoring", with Postgres-specific idempotency idioms:

```sql
-- OWNER: @khanhdo
-- INTENT: hotfix
-- ENGINE: postgres
-- TARGET: Database/Scripts/Hotfix/2026-05-09_fix-cart-currency-default.sql
-- WORKSPACE-RULE: Database Merge Procedures for Staging and PreProd
-- DESCRIPTION:
--   Backfills cart.currency where NULL after the 2026-05-08 deploy (Postgres).

BEGIN;

-- Idempotent column add
ALTER TABLE public.cart ADD COLUMN IF NOT EXISTS currency CHAR(3);

-- Idempotent default + backfill
ALTER TABLE public.cart ALTER COLUMN currency SET DEFAULT 'USD';

UPDATE public.cart
   SET currency = 'USD'
 WHERE currency IS NULL;

-- Idempotent NOT NULL (only after backfill)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'cart'
           AND column_name = 'currency' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.cart ALTER COLUMN currency SET NOT NULL;
    END IF;
END $$;

COMMIT;
```

The `BEGIN; … COMMIT;` wrapper is critical on Postgres — DDL is transactional, so a failure mid-script leaves the schema clean. (MySQL does **not** transactionally wrap DDL; its hotfixes are riskier.)

Re-run twice on `qa` to verify idempotency. Save under `documents/database-testing/queries/hotfix/YYYY-MM-DD_<Description>.sql` per the workspace rule's naming convention.

## pgAdmin-specific anti-patterns

> The cross-tool anti-patterns in [`README.md`](./README.md) still apply. These are pgAdmin-only.

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Run `EXPLAIN ANALYZE` against `prod` during peak | `ANALYZE` actually executes the query — for `UPDATE` / `DELETE` it actually mutates and rolls back; for slow `SELECT` it doubles load | `EXPLAIN` (no `ANALYZE`) on `prod`; `EXPLAIN ANALYZE` on `staging` only |
| Save the master password as `password` (or empty) | The `pgadmin4.db` SQLite is decryptable from a stolen laptop + Time Machine backup | Use a real master password, rotate quarterly; better — set `MASTER_PASSWORD_REQUIRED = False` and `OS_KEYRING_BACKEND` to delegate to the OS keychain (pgAdmin 4 ≥ 6.6) |
| Use `Tools → Backup` against `prod` for "just in case" | Generates pg_dump on the server; locks tables; floods the WAL on a busy DB | Use the platform's snapshot/backup mechanism (RDS, GCP Cloud SQL, Aurora); pgAdmin's backup is for `qa` / `uat` only |
| Use `Tools → Restore` to reset `qa` data | Restores are slow (hours on big DBs) and require reconnecting; partial restores are footguns | Drop & recreate the `qa` schema via `psql -f schema.sql && psql -f seed.sql`; or use a containerised disposable DB per the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md) |
| Click "Auto-rollback OFF" because "I want to see what failed" | Subsequent queries pile up; one accidental `INSERT` ships when you finally `COMMIT` | Auto-rollback **ON** for every server; investigate failures via `\errverbose` in the next query |
| Open the Data View (`View All Rows`) on a 10M-row table | pgAdmin loads the entire result set into the browser; tab freezes; OOM | Always `LIMIT` in the query editor; or right-click the table → **View First 100 Rows** |
| Edit a row inline in the data grid against `uat` / `prod` | pgAdmin fires `UPDATE … WHERE <pk> = …` immediately on commit-row | Disable inline editing in **Preferences → SQL Editor → Editor → Editable** for `uat` / `prod` connections |
| Use the ERD Tool's "Generate SQL" verbatim | Output is not idempotent — fails the workspace rule | Hand-edit; wrap with `IF NOT EXISTS` / `DO $$ … $$` per §"Hotfix authoring" |
| Run pgAdmin in Server (Docker) mode without an RFC | Shared-server mode aggregates every user's credentials in one DB; concentration risk | Desktop mode by default; Server mode only via [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) |

## CI integration (pgAdmin is not in CI; CLI is)

pgAdmin is GUI-only; CI uses the `psql` CLI driver. Translation:

| pgAdmin action | CI equivalent |
|---|---|
| Run query (`F5`) | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f query.sql` |
| Verify "zero rows" invariant | `psql -tAc "$(cat query.sql)" \| wc -l` → assert `0` |
| Save EXPLAIN tree as JSON | `psql -c "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) $(cat query.sql)" > query.explain.json` (staging only) |
| Run hotfix | `psql -1 -f hotfix.sql` (`-1` wraps in a single transaction; works for idempotent hotfixes) |
| Audit roles | `psql -c "\du+" -tA > audit.txt` (the `\du+` meta-command lists all roles + grants) |

The full GitHub Actions snippet lives in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job". The `tests/db/invariants/*.spec.ts` files (added by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md)) wrap these CLI invocations in jest and assert on the result.

## Cross-references

- [`README.md`](./README.md) — the shared discipline (idempotency, secrets, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when pgAdmin is the right tool vs DBeaver / MySQL Workbench / `tests/db/`.
- [`dbeaver.md`](./dbeaver.md) — default cross-engine GUI; same shape, broader engine coverage.
- [`mysql-workbench.md`](./mysql-workbench.md) — MySQL-specialist GUI; the symmetric tool for the other dominant engine.
- [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md) — promote a pgAdmin-authored query / migration into a CI-gated spec.
- [`documents/security/toolchain.md`](../security/toolchain.md) §"gitleaks" — pre-commit hook that catches credentials accidentally committed.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — concrete CI implementation for the "Database invariants job".
- [`documents/performance/README.md`](../performance/README.md) §"SLO discipline" — query latency budgets follow the same shape as API budgets; `pg_stat_statements` is the source data.
- Workspace rule **"Database Merge Procedures for Staging and PreProd"** — the canonical idempotency contract pgAdmin-authored hotfix scripts must satisfy.
