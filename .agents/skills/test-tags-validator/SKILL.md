---
name: test-tags-validator
description: "Validates that every Playwright test in tests/ carries the required tag taxonomy (priority @P1..@P4, severity @critical|major|minor|trivial, optional type and feature tags) per prompts/core/test-tags.md, and reports violations with file:line. Use when explicitly asked to 'validate tags', 'check test tags', 'audit tagging', before merging a PR that adds tests, or as a pre-push / CI gate. Wraps a runnable validator (scripts/validate-tags.ts) that exits non-zero on violations."
---

# Test Tags Validator

`pages/base-page.ts` has a runtime guardrail that fails any test missing required tags — but only when that test runs. PRs add tests faster than CI runs them, so the guardrail catches violations *late*.

This skill closes the loop with a static linter: scan `tests/**/*.spec.ts`, parse every `test(…, { tag: […] }, …)` block, and confirm each carries the canonical priority + severity tags (and ideally a type + feature tag too).

Companion: [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) (the convention); [`pages/base-page.ts`](../../../pages/base-page.ts) (the runtime guardrail).

---

## When to use this skill

Trigger on:
- "Validate test tags"
- "Check tags on the new specs"
- "Audit tagging convention"
- "Are all my tests tagged?"
- Pre-push, pre-PR-merge, CI gate

**Do NOT use when:**
- The user wants to **add** tags to one spec → just edit it, don't run the validator.
- The user wants to **change the convention** → update `prompts/core/test-tags.md` first, then re-run.

---

## How to use it

### Phase 1 — Run the validator

```bash
# fast path
npm run validate:tags

# verbose (lists every test, not just violations)
.agents/skills/test-tags-validator/scripts/validate-tags.ts --verbose

# scope to a path
.agents/skills/test-tags-validator/scripts/validate-tags.ts --path tests/ui/test-cart.spec.ts

# treat warnings as errors (CI mode)
.agents/skills/test-tags-validator/scripts/validate-tags.ts --strict
```

Exit codes:
- `0` — all tests compliant
- `1` — at least one test missing a required tag
- `2` — script invocation error (bad path, parse error)

### Phase 2 — Read the report

```
✗ tests/ui/test-search.spec.ts:14
    test('TC-SEARCH-01 surfaces results for partial keyword'
    missing: priority (@P1|@P2|@P3|@P4)
    has: ['@regression', '@ui', '@home']

▸ tests/ui/test-cart.spec.ts:42
    test('TC-CART-09 quantity counter increments'
    warning: missing type tag (@smoke|@regression|@ui|@api|@security|@visual|@a11y|@perf)
    has: ['@P2', '@major', '@cart']

✓ tests/api/test-cart-api.spec.ts — 12 tests, all compliant

Summary: 46 tests scanned, 1 error, 3 warnings
```

### Phase 3 — Fix the violations

Apply tags inline:
```ts
test('TC-CART-09 quantity counter increments',
  { tag: ['@P2', '@major', '@regression', '@ui', '@cart'] },   // ← add @regression
  async ({ cartPage }) => {
    /* ... */
  });
```

Re-run the validator. Repeat until exit `0`.

### Phase 4 — Wire as a guardrail

For local pre-push (already in `.husky/pre-push`):
```bash
# add to .husky/pre-push, before `npm run check:all`
npm run validate:tags --silent || exit 1
```

For CI (`.github/workflows/playwright.yml`):
```yaml
    - name: Validate test tags
      run: npm run validate:tags -- --strict
```

---

## Tag taxonomy (quick reference)

Always include exactly **one priority** + **one severity**. Type and feature are RECOMMENDED.

| Class | Allowed values | Required |
|---|---|---|
| Priority | `@P1`, `@P2`, `@P3`, `@P4` | yes (1 of) |
| Severity | `@critical`, `@major`, `@minor`, `@trivial` | yes (1 of) |
| Type | `@smoke`, `@regression`, `@ui`, `@api`, `@hybrid`, `@security`, `@visual`, `@a11y`, `@perf` | recommended |
| Feature | `@auth`, `@cart`, `@checkout`, `@profile`, `@product`, `@compare`, `@wishlist`, `@home` | recommended |

The validator's source-of-truth list lives in [`scripts/validate-tags.ts`](scripts/validate-tags.ts). When the convention changes, update **`prompts/core/test-tags.md` AND `validate-tags.ts`** in the same PR — drift between them creates false positives.

---

## Decision tree

```
Validator output ?
├── 0 errors, 0 warnings        → Ship it.
├── 0 errors, N warnings        → Fix in the same PR if you authored the tests; else open a follow-up.
├── ≥ 1 error                   → Block; fix before merge.
└── exit 2 (parse error)        → Bug in the validator; file an issue, not a tag.
```

```
Adding a new tag class ?
├── Update prompts/core/test-tags.md (the convention)
├── Update validate-tags.ts (the regex)
├── Update pages/base-page.ts (the runtime guardrail) if it should fail tests at runtime too
└── Run the validator across the suite to migrate existing tests
```

---

## Best practices

- **Validate before push.** It costs < 1 second and catches what the runtime guard catches only mid-suite.
- **Don't tag in two places.** Tags go on the `test(…)` call (`{ tag: […] }`), not on `test.describe` only — the validator targets per-test granularity.
- **No free-form tags.** `@cool-feature` is invisible to the dashboard; if you need a new tag, propose it in the convention doc first.
- **One severity, not two.** `'@major', '@minor'` is a contradiction. Pick.
- **Ignore the noise warnings.** A test marked `@trivial` but missing a feature tag is fine; one marked `@critical` without a feature tag is a smell — the dashboard's "By feature" panel will mis-bucket it.
- **Re-run after rebases.** Merge conflicts in tag arrays produce surprising results.

---

## Related

- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — the canonical convention.
- [`pages/base-page.ts`](../../../pages/base-page.ts) — runtime guardrail (`STRICT_TAGS=false` to downgrade to warning).
- [`scripts/validate-tags.ts`](scripts/validate-tags.ts) — the validator (run with `--help`).
- [`reports/custom-reporter.ts`](../../../reports/custom-reporter.ts) — consumes tags into the dashboard's By-priority / By-severity / By-feature panels.
- [`.agents/skills/requirements-traceability`](../requirements-traceability/SKILL.md) — depends on tags being correct.
