# DBeaver — Cross-Engine GUI Workflow Guideline

> The **default** GUI database client for this repo. Open-source (Apache 2.0), Java-based, supports every engine the SUT might run on (Postgres, MySQL, MariaDB, SQLite, MS SQL, Oracle, …). Used as the **exploration + ad-hoc invariant + hotfix authoring** layer that feeds into [`tests/db/`](../../) and the workspace rule's Staging → PreProd path.
>
> Read [`README.md`](./README.md) first for the shared discipline (idempotency, secret hygiene, dashboard contract). This doc is the **DBeaver-specific implementation** of that contract.

## TL;DR

- Install DBeaver Community Edition (free; Apache 2.0).
- One workspace per repo (`~/dbeaver/ai-qa-training`); one connection per `profiles/.env.<ENV>` (`qa`, `uat`, `prod-readonly`).
- Credentials come from a secret manager at connect time — **never** "Save password".
- Save useful queries to `documents/database-testing/queries/module/<area>/<name>.sql` with the canonical header.
- Hotfix scripts go to `documents/database-testing/queries/hotfix/YYYY-MM-DD_<Description>.sql`, idempotency-wrapped per the workspace rule.

## When to reach for DBeaver

Use DBeaver when:

- You're **exploring schema** on a new module (tables / FKs / triggers unknown).
- You need to **run an invariant query** across both Postgres and MySQL.
- You're **authoring a hotfix** that will eventually land in `Database/Scripts/Hotfix/`.
- You need an **ER diagram** to show the dev team the FK graph for `cart` / `cart_item` / `order`.
- You're **demoing for a non-engineer** (PM, support) and need a clickable artifact.

Avoid DBeaver when:

- The query is already in `documents/database-testing/queries/` — open the existing file; don't re-author.
- The check needs to **fail the build** — promote it to `tests/db/invariants/` via [`database-testing`](../../.agents/skills/database-testing/SKILL.md).
- You need engine-specific perf-debug Postgres features (`EXPLAIN ANALYZE … BUFFERS` rendered as a tree) — use [`pgadmin.md`](./pgadmin.md).
- You need MySQL's visual EXPLAIN — use [`mysql-workbench.md`](./mysql-workbench.md).
- You're tempted to save a password in the connection profile — see §Secrets below.

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local (recommended) | `brew install --cask dbeaver-community` | `>= 24.1` |
| macOS local (manual) | Download from [dbeaver.io/download](https://dbeaver.io/download/), drag to `/Applications` | `>= 24.1` |
| Linux local | `sudo snap install dbeaver-ce` or `.deb` from dbeaver.io | `>= 24.1` |
| Windows local | `.exe` installer from dbeaver.io | `>= 24.1` |
| Docker (CI / headless) | DBeaver is GUI-only; for headless use, see [`tool-comparison.md`](./tool-comparison.md) §"One-liner in a CI step" — drop to `psql` / `mysql` CLI | n/a |

> **Don't install DBeaver PRO** unless your team has a paid licence and a documented reason ([`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md)). Community covers everything in this doc.

## Workspace structure (this repo's convention)

```
<your local DBeaver>
└── Workspace: "ai-qa-training" (.dbeaver/workspace under your home dir)
    ├── Connection: "qa-postgres"            ← reads from profiles/.env.qa
    ├── Connection: "qa-mysql"               ← reads from profiles/.env.qa
    ├── Connection: "uat-postgres"           ← reads from profiles/.env.uat
    ├── Connection: "prod-postgres-readonly" ← reads from profiles/.env.prod (read-only role)
    └── Project: "ai-qa-training"
        └── Scripts (point to repo, not DBeaver storage):
            ▶ documents/database-testing/queries/module/cart/
            ▶ documents/database-testing/queries/module/auth/
            ▶ documents/database-testing/queries/hotfix/
```

**Mirror to the repo:** every saved query lives under `documents/database-testing/queries/`, not in DBeaver's local "Scripts" tree. DBeaver only *views* the file from disk via "Project → Link folder". The repo is source-of-truth — DBeaver's local storage is a workspace, not a database.

To wire it once:

```text
DBeaver UI:
  1. View → Database Navigator (Cmd+P) — confirm Workspace exists.
  2. Window → Preferences → General → Workspace → Workspace folder:
       /Users/<you>/dbeaver/ai-qa-training
  3. Database Navigator → right-click "Scripts" → Link Folder...
       ↳ Folder: /Users/<you>/Documents/KD/ai-qa-training/documents/database-testing/queries
       ↳ Recursive: ✅
```

## Connections

Mirror the repo's [`profiles/.env.<ENV>`](../../profiles/) one-for-one. Three environments only — `qa`, `uat`, `prod-readonly` — matching the repo's existing matrix. **No `prod` write-capable connection is ever saved on a tester laptop.**

| DBeaver setting | Source in repo |
|---|---|
| **Connection name** | `<env>-<engine>` — e.g. `qa-postgres`, `uat-mysql` |
| **Host** | `DB_HOST` from `profiles/.env.<ENV>` |
| **Port** | `DB_PORT` from `profiles/.env.<ENV>` |
| **Database** | `DB_NAME` from `profiles/.env.<ENV>` |
| **Username** | `DB_USER` from `profiles/.env.<ENV>` (read-only role for `prod-readonly`) |
| **Password** | **NOT STORED** — fetched from secret manager at connect time (see §Secrets) |
| **Role** (Postgres) | `DB_ROLE` (e.g. `app_readonly`) — **never** `postgres` superuser |
| **Default schema** | `DB_SCHEMA` (e.g. `public`) |
| **Connection settings → Initialization → Auto-commit** | **OFF** for `uat` and `prod-readonly`; **ON** allowed for `qa` only |
| **Connection settings → Transactions → Confirm transaction execute** | **ON** for `uat` / `prod-readonly` |
| **Driver properties → ApplicationName** | `dbeaver-<your-handle>` so the DBA can grep `pg_stat_activity` and find you |

## Secrets

> **The single biggest DBeaver footgun.** "Save password" stores credentials in `~/.local/share/DBeaverData/workspace6/General/.dbeaver/credentials-config.json` — encrypted, but with a key DBeaver itself can read, and the file ends up in cloud-synced backups (Time Machine, iCloud, Dropbox). One lost laptop = full DB compromise.

### The rule

**Never** check "Save password" in DBeaver. Always read the credential at connect time from a secret manager.

### Pattern: macOS Keychain (simplest)

```bash
security add-generic-password \
  -a "$USER" \
  -s "ai-qa-training/qa-postgres" \
  -w "<paste password once>"
```

In DBeaver:

1. Connection → Edit Connection → Connection settings → Driver properties.
2. Add a property `passwordCommand` = `security find-generic-password -a $USER -s ai-qa-training/qa-postgres -w`
3. Use a small wrapper script in `~/bin/dbeaver-launch.sh` that exports the password before launching DBeaver, OR use DBeaver's **"Use external password command"** option (Connection → Authentication → Use external program).

### Pattern: 1Password CLI (recommended for teams)

```bash
op signin                                # one-time per session
op item get "qa-postgres" --fields password   # used by DBeaver auth hook
```

In DBeaver Authentication: **"External password program"** → command:

```bash
op item get "qa-postgres" --fields password --reveal
```

DBeaver will prompt 1Password to unlock per session; nothing is written to disk.

### Pattern: gopass / pass / Bitwarden CLI

Same shape — DBeaver's "External password program" calls the CLI, which prompts for the master passphrase once per session.

### What goes in the connection profile (committed to repo if shared)

```json
{
  "name": "qa-postgres",
  "driver": "postgres",
  "host": "${DB_HOST_FROM_ENV}",
  "port": "${DB_PORT_FROM_ENV}",
  "database": "${DB_NAME_FROM_ENV}",
  "username": "${DB_USER_FROM_ENV}",
  "passwordCommand": "op item get qa-postgres --fields password --reveal",
  "applicationName": "dbeaver-${USER}"
}
```

> **Audit:** run `grep -ri 'savePassword.*true' ~/Library/DBeaverData ~/.local/share/DBeaverData 2>/dev/null` periodically. Any hit is a violation. The pre-commit hook in [`documents/security/toolchain.md`](../security/toolchain.md) §"gitleaks" catches credentials that escape into the repo.

## Saving a query (the canonical header)

The moment a query proves useful, save it under `documents/database-testing/queries/module/<area>/<name>.sql` with this exact header:

```sql
-- OWNER: @khanhdo
-- INTENT: invariant            -- one of: invariant | exploratory | hotfix | seed-check | perf-debug
-- ENGINE: postgres             -- one of: postgres | mysql | sqlite | sqlserver | oracle | engine-agnostic
-- WHEN-TO-RUN: per-PR + nightly  -- per-PR | nightly | manual | on-demand
-- MODULE: cart                 -- matches module:* in prompts/core/defect-labels.md
-- DESCRIPTION:
--   Every cart total must equal the sum of its line items.
--   Returns the IDs of carts that violate the invariant.
--   Expected result on green: zero rows.

SELECT c.id
FROM   cart c
LEFT   JOIN cart_item ci ON ci.cart_id = c.id
GROUP  BY c.id, c.total
HAVING c.total <> COALESCE(SUM(ci.qty * ci.unit_price), 0);
```

The `WHEN-TO-RUN` line lets the cron job in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job" pick up only the right files.

## EXPLAIN — capturing the plan next to the query

For any query that touches > 10k rows, store the plan as `<name>.explain.txt` so plan regressions are caught by `git diff`, not by re-eyeballing slow runs.

In DBeaver:

1. Run the query (`Ctrl+Enter` / `Cmd+Enter`).
2. SQL Editor → **Explain Execution Plan** (`Ctrl+Shift+E`) — text view.
3. Right-click the plan → **Save as text** → `<same-folder>/<query-name>.explain.txt`.
4. Commit both files together.

For Postgres specifically, also paste the JSON plan output (`EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) <query>`) into `<name>.explain.json` — it's machine-readable for the perf-analyzer skill. **Do not run `EXPLAIN ANALYZE` on `prod` during business hours**; it actually executes the query.

## ER diagrams

DBeaver's ER diagram is generated from live schema, not committed. To document the schema for stakeholders:

1. Database Navigator → expand the schema → right-click → **View Diagram**.
2. Customise (hide audit columns, group related tables).
3. Diagram pane → **File → Save → Image (PNG / SVG)**.
4. Commit to `documents/database-testing/diagrams/<module>-er.png` (PNG for Slack, SVG for the docs site).

> **Don't commit DBeaver's `.erd` file.** It's tied to the DBeaver version; PNG/SVG are portable.

## Data export — anonymisation discipline

Tester exports `cart` for "show the PM how big our top customers are" → real emails leak into a Slack screenshot. Don't.

DBeaver export wizard supports an SQL transform per column. Use it:

| Column | Transform | DBeaver SQL transform |
|---|---|---|
| `email` | one-way hash | `MD5(email) AS email` |
| `full_name` | initials only | `LEFT(full_name, 1) \|\| '.'` (Postgres) / `LEFT(full_name, 1)` (MySQL) |
| `phone` | last-4 only | `'***-***-' \|\| RIGHT(phone, 4)` |
| `address_line1` | redacted | `'<redacted>'` |
| `dob` | year-only | `EXTRACT(YEAR FROM dob)` |

> **Default deny.** If you're about to export from `prod-readonly` and you haven't decided what to redact, stop. The `prod-readonly` role should already block PII columns at the DB level (column-level GRANTs); the GUI is the second line of defence, not the first.

## Hotfix authoring — Staging → PreProd

Hotfixes that will eventually land in `Database/Scripts/Hotfix/` start in DBeaver. The workspace rule **"Database Merge Procedures for Staging and PreProd"** is the contract; this section is the **DBeaver-specific recipe** for satisfying it.

### Recipe

1. **Author in the SQL editor** against `qa` first. Iterate until correct.
2. **Capture the dialect** in the header:
   ```sql
   -- OWNER: @khanhdo
   -- INTENT: hotfix
   -- ENGINE: sqlserver
   -- TARGET: Database/Scripts/Hotfix/2026-05-09_fix-cart-currency-default.sql
   -- WORKSPACE-RULE: Database Merge Procedures for Staging and PreProd
   -- DESCRIPTION:
   --   Backfills cart.currency where NULL after the 2026-05-08 deploy.
   ```
3. **Wrap with idempotency guards** (rule requirements #1, #2, #4 from [`README.md`](./README.md) §"Idempotency contract"):
   ```sql
   IF OBJECT_ID('dbo.cart', 'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM   sys.columns
           WHERE  object_id = OBJECT_ID('dbo.cart')
             AND  name      = 'currency'
       )
       BEGIN
           ALTER TABLE dbo.cart ADD currency NVARCHAR(3) NOT NULL DEFAULT 'USD';
       END;

   UPDATE dbo.cart
      SET currency = 'USD'
    WHERE currency IS NULL;
   ```
4. **For `@clientId` Tiger scripts** (rule requirement #5): rewrite to the Multi-Client Template loop:
   ```sql
   declare @clientIds table (clientId int);
   insert  into @clientIds (clientId) select clientId from Master.dbo.Client where IsActive = 1;

   declare @clientId int;
   while exists (select 1 from @clientIds)
   begin
       select  top 1 @clientId = clientId from @clientIds;
       /* per-client work goes here */
       delete  from @clientIds where clientId = @clientId;
   end;
   ```
5. **Save** under `documents/database-testing/queries/hotfix/2026-05-09_<Description>.sql` (filename matches rule requirement #6 — `YYYY-MM-DD_<Description>.sql`).
6. **Re-run twice on `qa`** to verify idempotency. The second run must complete without error and without changing row counts on the affected tables.
7. **Capture EXPLAIN** (`<filename>.explain.txt`) if any statement scans > 10k rows.
8. **Open a PR** that copies the file from `documents/database-testing/queries/hotfix/` to `Database/Scripts/Hotfix/` (the location the workspace rule actually governs). The PR description cites the workspace rule and the `qa` re-run evidence.

> **Why both folders?** `Database/Scripts/Hotfix/` is the path the workspace rule lints on the Staging → PreProd merge. `documents/database-testing/queries/hotfix/` is the path the QA-team's idempotency-lint runs on every PR. Same file content, two enforcement points.

## DBeaver-specific anti-patterns

> The cross-tool anti-patterns in [`README.md`](./README.md) still apply. These are DBeaver-only.

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Save password in connection profile | One stolen laptop = full DB compromise (cloud-synced backups) | External password command — see §Secrets |
| Auto-commit ON against `uat` / `prod-readonly` | One typo in a `DELETE` rolls into the next deploy | Auto-commit OFF on every non-`qa` profile |
| Use the "Compare Schemas" generated DDL verbatim | Output isn't idempotent — fails the workspace rule | Hand-edit to wrap with `IF OBJECT_ID …` / `IF NOT EXISTS …` per §"Hotfix authoring" |
| Open multiple "qa-postgres" connections in parallel and run different transactions | Hard to remember which tab you're in; cross-tab mistakes | One connection per env per session; explicit "Set active database" |
| Run `EXPLAIN ANALYZE` on `prod` during peak | `ANALYZE` actually executes the query — you just doubled the load | `EXPLAIN` (no `ANALYZE`) on `prod`; `EXPLAIN ANALYZE` on `staging` only |
| Store DBeaver workspace under `iCloud Drive` / `Dropbox` / `OneDrive` | Connection profiles + cached query results sync to cloud — credential exposure surface | Workspace under `~/dbeaver/`, **not** under any synced folder; verify with `ls -la ~/dbeaver` |
| "Just for this one query" — open a `prod` write-capable connection | Will become the default; the next typo is a customer incident | Read-only role; write goes through the Staging → PreProd workspace-rule path |
| Bookmark the result grid screenshot in Slack with PII | GDPR/CCPA violation; lawsuit risk | Anonymise (DBeaver export transform) before sharing |
| Commit `.dbeaver-data-sources.xml` (the connection-profiles file) to the repo | The file may contain hashed-but-recoverable passwords | `.gitignore` `**/*.dbeaver*`; share connection metadata via the docs in this folder, not the binary file |

## CI integration (DBeaver is not in CI; CLI is)

DBeaver itself is GUI-only; in CI we drop to the engine's CLI driver. The translation is mechanical:

| DBeaver action | CI equivalent |
|---|---|
| Run query (Cmd+Enter) | `psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f query.sql` (Postgres) |
| | `mysql -h $DB_HOST -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < query.sql` (MySQL) |
| Verify "zero rows" invariant | `psql -tAc "$(cat query.sql)" \| wc -l` → assert `0` |
| Save EXPLAIN plan | `psql -c "EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) $(cat query.sql)"` → diff against `query.explain.json` |
| Run hotfix | `psql -1 -f hotfix.sql` (`-1` wraps in a single transaction; works for idempotent hotfixes) |

The full GitHub Actions snippet lives in [`documents/ci/github-actions.md`](../ci/github-actions.md) §"Database invariants job". The `tests/db/invariants/*.spec.ts` files (added by the [`database-testing` skill](../../.agents/skills/database-testing/SKILL.md)) wrap these CLI invocations in jest and assert on the result.

## Cross-references

- [`README.md`](./README.md) — the shared discipline (idempotency, secrets, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when DBeaver is the right tool vs MySQL Workbench / pgAdmin / `tests/db/`.
- [`mysql-workbench.md`](./mysql-workbench.md) — when MySQL-specific features (visual EXPLAIN, modeller) win.
- [`pgadmin.md`](./pgadmin.md) — when Postgres-specific features (EXPLAIN ANALYZE BUFFERS, RLS, `pg_stat_statements`) win.
- [`.agents/skills/database-testing/SKILL.md`](../../.agents/skills/database-testing/SKILL.md) — promote a saved query into a CI-gated invariant spec.
- [`documents/security/toolchain.md`](../security/toolchain.md) §"gitleaks" — pre-commit hook that catches credentials accidentally committed.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — concrete CI implementation for the "Database invariants job".
- Workspace rule **"Database Merge Procedures for Staging and PreProd"** — the canonical idempotency contract DBeaver-authored hotfix scripts must satisfy.
