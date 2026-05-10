---
name: test-pyramid-audit
description: "Audits the test distribution of a codebase against the test pyramid (unit ≫ integration > E2E) — counts tests per layer, computes the pyramid shape (healthy / hourglass / ice-cream-cone), surfaces coverage gaps where E2E is doing unit's job, and recommends specific tests to demote (E2E → integration) or add (missing unit / integration). Use when explicitly asked for a 'test pyramid audit', 'is our test distribution healthy', 'why is CI so slow', 'why do we have so many flaky E2E', or as part of a quarterly QA review. Distinct from test-code-review (per-spec smells); this skill audits the macro shape."
optionalRefs:
  - tests/unit/         # aspirational — directory the audit recommends adopting
  - tests/integration/  # aspirational — directory the audit recommends adopting
---

# Test Pyramid Audit

The shape of a test suite is destiny: ice-cream-cone suites (lots of E2E, no unit) are slow, flaky, and expensive. Pyramid suites (lots of unit, fewer E2E) are fast, stable, and cheap. This skill measures the shape and proposes the corrective actions.

## When to use this skill

- "Test pyramid audit"
- "Is our test distribution healthy?"
- "Why is CI so slow?"
- "Why do we have so many flaky E2E?"
- Quarterly QA review

## How to use it

### Phase 1 — Count tests by layer

Use file-path conventions + tag heuristics:

| Layer | This repo's marker |
|---|---|
| Unit | `*.test.ts` next to source under `src/`, `utilities/`, `pages/` (or `tests/unit/`) |
| Integration | `tests/integration/` OR `tests/api/test-*.spec.ts` (API-only) |
| E2E (UI) | `tests/ui/test-*.spec.ts` |
| Visual | `@visual` tag |
| Perf | `@perf` tag |
| A11y | `@a11y` tag |

Count via:
```bash
echo "Unit:        $(rg --type=ts -l '\bdescribe\(' src/ utilities/ pages/ 2>/dev/null | wc -l)"
echo "Integration: $(rg --type=ts -l '^test\(' tests/api/ 2>/dev/null | wc -l)"
echo "E2E (UI):    $(rg --type=ts -l '^test\(' tests/ui/ 2>/dev/null | wc -l)"
```

### Phase 2 — Classify shape

| Shape | Ratios | Diagnosis |
|---|---|---|
| Healthy pyramid | 70–80% unit, 15–25% integration, 5–10% E2E | keep going |
| Hourglass | 40% unit, 10% integration, 50% E2E | integration layer missing |
| Ice-cream cone | 10% unit, 10% integration, 80% E2E | systemic over-reliance on E2E |
| Inverted cone | 0% unit, 0% integration, 100% E2E | rebuild needed |

### Phase 3 — Identify specific over-tested behaviours in E2E

For each E2E spec, ask: "Could a unit OR integration test cover this?"

| Pattern | Demote to |
|---|---|
| Pure data transformation (`formatPrice`, `validateEmail`) | unit |
| Logic in a single page object method (no real navigation) | unit on the method |
| API request validation (status, schema) without UI | integration (`tests/api/`) |
| Auth-flow happy path covered ×7 in different specs | one shared fixture; remove duplicates |
| Negative input validation (empty, too-long, special chars) | unit on validator OR `api-fuzzer-generator` |

### Phase 4 — Identify specific under-tested behaviours

```
Surface                    | Currently tested at | Should also be tested at
───────────────────────────────────────────────────────────────────────────
formatCurrency util        | E2E only            | unit
addItem() in cart-page     | E2E only            | unit (mocked dependencies)
POST /api/cart/items       | E2E only            | integration
zod schema validation      | not tested          | unit
```

### Phase 5 — Emit the report

```markdown
# Test Pyramid Audit — YYYY-MM-DD

## Current shape: hourglass (45% unit / 8% integration / 47% E2E)
## Target shape:  pyramid  (70% / 20% / 10%)

## Top 5 demotions (E2E → integration)
1. `tests/ui/test-cart.spec.ts:18-42` — POST /api/cart validation; demote to `tests/api/test-cart.spec.ts`
2. ...

## Top 5 additions (currently uncovered)
1. `utilities/format.ts:formatCurrency` — write unit tests; cover EU locales
2. ...

## Estimated impact
- CI duration: -28% (E2E count drops 47 → 30)
- Flake rate:  -40% (E2E flake-rate is 4× integration's)
```

### Phase 6 — Hand off

- For each demotion → file a `test-coverage` issue per [`.github/ISSUE_TEMPLATE/test_coverage_request.md`](../../../.github/ISSUE_TEMPLATE/test_coverage_request.md)
- For each addition → same; tag with the appropriate `@<feature>`
- Track the shape over time via [`trend-analysis`](../trend-analysis/SKILL.md)

## Best practices

- **Don't audit and abandon.** Without follow-through, the audit becomes wallpaper. File the issues.
- **Demote one cluster at a time.** Don't try to remove 30 E2E tests in one PR.
- **Measure CI duration before/after.** That's the metric leadership cares about.
- **Don't measure coverage by line %.** A 90% line-covered codebase with no integration tests is still ice-cream-cone.

## Related

- [`.agents/skills/test-code-review/SKILL.md`](../test-code-review/SKILL.md) — per-spec smells (this skill is the macro view)
- [`.agents/skills/test-design-techniques/SKILL.md`](../test-design-techniques/SKILL.md) — derive cases for the right layer
- [`.agents/skills/javascript-testing-patterns/SKILL.md`](../javascript-testing-patterns/SKILL.md) — unit/integration patterns
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../api-fuzzer-generator/SKILL.md) — for negative-input cases at API layer
- [`.agents/skills/trend-analysis/SKILL.md`](../trend-analysis/SKILL.md) — track pyramid shape over time
