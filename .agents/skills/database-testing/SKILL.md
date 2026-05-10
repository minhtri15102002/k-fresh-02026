---
name: database-testing
description: "Authors database-layer tests: schema-migration safety (idempotency, rollback, no data loss), data-integrity invariants (FK constraints, unique constraints, business rules), seed/teardown lifecycle for test isolation, and ETL / data-pipeline correctness. Picks the right pattern (unit-level repository tests with an in-memory DB; integration tests against a real SQLite/Postgres in Docker; data quality via Great Expectations / dbt tests). Use when explicitly asked to 'test the migration', 'verify data integrity', 'add database tests', 'check the seed', 'pipeline correctness', or before merging any DB schema change. Distinct from data-quality-frameworks (production data validation) — this skill targets pre-production DB tests."
---

# Database Testing

DB bugs are silent and slow: they ship in a green build and corrupt data three days later. This skill catches them at PR time.

## When to use this skill

- "Test the migration"
- "Verify data integrity"
- "Add database tests for `<repo / DAO>`"
- "Check the seed / teardown"
- "Pipeline correctness"
- Before merging any DB schema change

Do **not** use when:
- The concern is production data quality (live monitoring) → use [`data-quality-frameworks`](../data-quality-frameworks/SKILL.md).
- The bug is in business logic above the DAO → write a unit/integration test, not a DB test.

## Pattern decision tree

```
What are you testing ?
├── Repository / DAO logic            → unit tests with in-memory DB (sqlite + drizzle/prisma)
├── Migration safety                  → integration test with real DB engine (docker compose)
├── Data invariants (FK, unique, biz) → SQL assertion suite OR Great Expectations expectations
├── ETL / pipeline transforms         → dbt tests OR custom SQL fixtures (this skill writes them)
└── Stored procedures                 → integration with real engine; assert state pre/post
```

## How to use it

### Phase 1 — Migration safety checklist

For every migration script, the test suite must verify:

| Property | How to test |
|---|---|
| **Idempotent** | apply migration twice; second run must be a no-op (especially for `CREATE TABLE`, `ADD COLUMN`) |
| **Reversible** | apply, then run `down()`; schema must match pre-migration baseline |
| **No data loss** | seed data → apply migration → assert all rows still readable |
| **Constraint preservation** | FKs, uniques, NOT NULL still enforced post-migration |
| **Backward compat for ≥ 1 release** | new columns nullable OR have default; renamed columns shimmed |

This repo's `always_applied_workspace_rule` for SQL idempotency on tables / sprocs / FKs / indexes / hotfixes (see the Cursor workspace rules in your local IDE) is the canonical contract — write the tests to enforce those rules.

### Phase 2 — Integration test scaffold

```ts
// tests/db/migrations.spec.ts
import { describe, beforeAll, afterAll, it, expect } from '@jest/globals';
import { startPostgresContainer, runMigrations, sql } from './_helpers';

describe('migration 2026-05-09_add-cart-currency', () => {
  let db: Database;
  beforeAll(async () => { db = await startPostgresContainer({ image: 'postgres:16' }); });
  afterAll(async () => { await db.stop(); });

  it('adds the cart.currency column with default USD', async () => {
    await runMigrations(db, { upTo: '2026-05-09_add-cart-currency' });
    const cols = await sql(db)`SELECT column_name, column_default FROM information_schema.columns WHERE table_name='cart'`;
    expect(cols).toContainEqual(expect.objectContaining({ column_name: 'currency', column_default: "'USD'::text" }));
  });

  it('is idempotent (safe to apply twice)', async () => {
    await runMigrations(db, { upTo: '2026-05-09_add-cart-currency' });
    await expect(runMigrations(db, { upTo: '2026-05-09_add-cart-currency' })).resolves.not.toThrow();
  });

  it('preserves existing rows', async () => {
    await sql(db)`INSERT INTO cart (id, user_id) VALUES (1, 100)`;
    await runMigrations(db, { upTo: '2026-05-09_add-cart-currency' });
    const rows = await sql(db)`SELECT * FROM cart WHERE id = 1`;
    expect(rows[0]).toMatchObject({ id: 1, user_id: 100, currency: 'USD' });
  });
});
```

### Phase 3 — Data invariants

```sql
-- tests/db/invariants/cart-totals.sql
-- Every cart total must equal the sum of its line items.
SELECT c.id
FROM   cart c
LEFT JOIN cart_item ci ON ci.cart_id = c.id
GROUP  BY c.id, c.total
HAVING c.total <> COALESCE(SUM(ci.qty * ci.unit_price), 0);

-- expected result: 0 rows
```

Run as part of CI (e.g. `psql -f file.sql`) and assert empty result set.

### Phase 4 — Seed / teardown lifecycle

| Strategy | When |
|---|---|
| Truncate + re-seed per test | small DB, fast |
| Transaction rollback per test | preferred for parallel; uses `BEGIN; ... ROLLBACK;` wrapper |
| Disposable container per file | when migrations themselves are under test |

Never share state across test files unless explicitly read-only.

### Phase 5 — Tagging

Use `@db @P1 @critical @regression` on migration tests; `@db @P2 @major @regression` on invariants; the tag-validator may need `@db` added to [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md).

## Best practices

- **Real engine for migrations.** SQLite-pretending-to-be-Postgres lies about types, FKs, and locks.
- **One migration per file under test.** Combined files hide which step caused the failure.
- **Invariants as SQL, not as code.** SQL is the contract; making it code adds an indirection bug-vector.
- **Never test against shared dev DB.** Always disposable / containerised.
- **Default to NOT NULL with defaults**, never to NULL columns "for safety". NULL columns are forever.

## Related

- [`.agents/skills/data-quality-frameworks/SKILL.md`](../data-quality-frameworks/SKILL.md) — production data quality (live monitoring)
- [`.agents/skills/contract-testing/SKILL.md`](../contract-testing/SKILL.md) — service-to-service boundary
- [`.agents/skills/test-data-generator/SKILL.md`](../test-data-generator/SKILL.md) — fixtures used by seeds
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file integrity violations
