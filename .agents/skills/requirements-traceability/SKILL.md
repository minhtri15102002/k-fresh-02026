---
name: requirements-traceability
description: "Builds and maintains the Requirements ↔ Manual Test Case ↔ Spec File traceability matrix that feeds Panel #4 of the QA Metrics dashboard. Use when explicitly asked to 'build a traceability matrix', 'map requirements to tests', 'check coverage of REQ-…', 'find untested requirements', or before a release-readiness review. Parses requirements, scans documents/manual-testcases/ + tests/, emits a structured matrix (REQ ↔ TC ↔ Spec ↔ Status), surfaces gaps, and proposes fixes (new TCs, new specs, or 'Won't Fix' justifications)."
optionalRefs:
  - documents/requirements.md          # optional input — used if present
  - documents/traceability-matrix.md   # output — produced by this skill
  - reports/traceability.json          # output — consumed by the QA dashboard
---

# Requirements Traceability

A test that doesn't trace back to a requirement is a test that nobody can defend in a release review. This skill produces — and keeps fresh — the matrix that links every requirement to its manual cases and automated specs, then powers Panel #4 of the QA Metrics dashboard.

Companion training module: [`training/phase-0-foundations/03-test-types-and-levels.md`](../../../training/phase-0-foundations/03-test-types-and-levels.md) (coverage section).

---

## When to use this skill

Trigger on:
- "Build a traceability matrix"
- "Which REQs are untested?"
- "Map REQ-… to its tests"
- "Update the dashboard's traceability panel"
- Before a release-readiness review or audit

**Do NOT use when:**
- The user wants test cases generated from a single requirement → use `test-design-techniques` then `generate-manual-testcase`.
- The user wants the matrix to drive testing prioritisation → that's risk-based testing (out of scope; combine this skill's output with risk).

---

## How to use it

### Phase 1 — Collect requirements

Inputs (in order of preference):
1. **`documents/requirements.md`** if present — the canonical list, REQ-IDs already assigned.
2. **GitHub Issues with the `requirement` label** — federated source of truth.
3. **Acceptance criteria from PR descriptions** — last resort; flag for backfill.

For each requirement capture: `id`, `title`, `module`, `priority`, `acceptance_criteria[]`, `status` (active / deprecated / wontfix).

### Phase 2 — Inventory existing coverage

Two sweeps:

**a) Manual test cases** under `documents/manual-testcases/*.md`:
- Parse the front-matter `requirement_id:` (or grep for `REQ-…` in body).
- Collect `tc_id`, `title`, `requirement_id`, `priority`, `severity`, `module`.

**b) Automated specs** under `tests/`:
- For each `test(…, async ({ … }) => …)` block, capture:
  - `spec_path` — e.g. `tests/ui/test-cart.spec.ts`
  - `tc_id` — from the test title's leading `TC-…` prefix (per repo convention)
  - `tags` — extract `@P*`, `@severity:*`, `@feature:*`, `@requirement:REQ-…` if present
  - `module` — derive from path (`tests/ui/test-cart…` → `cart`)

Use the [`test-tags-validator`](../test-tags-validator/SKILL.md) script to bail out early if tags are missing — traceability is unreliable without them.

### Phase 3 — Compose the matrix

Pivot REQ → TC → Spec:

```
| REQ ID     | Requirement                       | Module   | Manual TCs               | Spec(s)                                | Status         |
|------------|-----------------------------------|----------|--------------------------|----------------------------------------|----------------|
| REQ-CART-01| Add to cart from PDP              | cart     | TC-CART-01, TC-CART-02   | tests/ui/test-cart.spec.ts             | Fully covered  |
| REQ-CART-02| Update quantity in cart           | cart     | TC-CART-03               | tests/api/test-cart-api.spec.ts        | Fully covered  |
| REQ-PAY-01 | Payment gateway integration       | checkout | —                        | —                                      | Won't Fix (out of SUT scope) |
| REQ-SEC-01 | Session security & authorization  | auth     | TC-SEC-01..05            | tests/api/test-security.spec.ts        | Fully covered  |
| REQ-WL-03  | Move from wishlist to cart        | wishlist | TC-WL-04                 | —                                      | Partial (manual only) |
```

Status values (mutually exclusive):
- **Fully covered** — manual TC exists AND ≥ 1 automated spec exists.
- **Partial** — manual TC exists OR automated spec exists, but not both.
- **Uncovered** — neither exists. **HIGH RISK; surface in dashboard alert.**
- **Won't Fix** — explicitly de-scoped; MUST carry a justification (e.g. "payment gateway not in demo SUT"). Counted separately so coverage % stays honest.
- **Deprecated** — REQ retired; row stays for audit trail with strikethrough.

### Phase 4 — Emit artefacts

1. **`documents/traceability-matrix.md`** — the human-readable matrix, including the Coverage Decisions section for any `Won't Fix` rows.
2. **`reports/traceability.json`** (consumed by the dashboard):
   ```json
   {
     "generatedAt": "2026-05-10T18:00:00Z",
     "totals": { "total": 14, "fullyCovered": 11, "partial": 2, "uncovered": 0, "wontFix": 1 },
     "rows": [ { "id": "REQ-CART-01", "title": "...", "module": "cart", "tcs": ["TC-CART-01"], "specs": ["tests/ui/test-cart.spec.ts"], "status": "fully" } ]
   }
   ```
3. **GitHub Issues** for `Uncovered` REQs — file via [`defect-report`](../defect-report/SKILL.md) with kind `coverage-gap` (label `test-coverage` + `module:*`).

### Phase 5 — Wire to the dashboard

> **Status today:** `templates/qa-metrics-dashboard.html` Panel #4 ("Requirements Traceability") currently embeds the matrix as a **hard-coded** JS array around line 1144 of the template. It does NOT yet hydrate from `reports/traceability.json`.
>
> **What this skill does today:** produces `reports/traceability.json` (machine-readable) and `documents/traceability-matrix.md` (human-readable) — both are stable artefacts that downstream consumers can read.
>
> **What's left to do (separate PR):** wire the dashboard's `hydrateFromReports()` block to read `reports/traceability.json` (mirroring how `defects.json` is consumed today). Until then, the dashboard's traceability panel must be hand-edited in lockstep with the JSON, OR you can add a `posttest:traceability` hook to `package.json` to regenerate the JSON and the markdown mirror on every run.

---

## Decision tree

```
What's the ask ?
├── "build the matrix"
│   → Phase 1+2+3+4; output traceability-matrix.md + traceability.json
├── "is REQ-X covered ?"
│   → Lookup; if Uncovered → propose plan (TCs via test-design-techniques)
├── "regenerate after a release"
│   → Re-run Phase 2 (auto-discovery); diff against previous matrix; surface NEW uncovered rows
├── "investigate a coverage gap"
│   → Phase 1 (REQ exists?) → Phase 2 (any TC/spec mentions it?)
│   → If genuinely uncovered: propose author plan; don't silently mark "Won't Fix"
└── "audit / release-readiness"
    → Output the full matrix; include % coverage; flag every NEW uncovered REQ since last audit
```

---

## Coverage thresholds

| Repo / module | Minimum | Action if below |
|---|---|---|
| `auth`, `checkout`, `cart` (revenue paths) | **100%** Fully covered | Block release |
| `profile`, `product`, `wishlist` | ≥ 90% | Open issues, no release block |
| `home`, `compare` | ≥ 70% | Open issues |
| Anything tagged `Won't Fix` | n/a | Must have written justification — no naked rows |

---

## Best practices

- **REQ-IDs are immutable.** Never recycle. Deprecated REQs stay in the matrix forever (with `Deprecated` status) so historical audits remain meaningful.
- **One TC per acceptance criterion, not per REQ.** A REQ with 4 ACs needs 4 TCs minimum; one giant TC is unauditable.
- **Won't Fix needs a name on it.** Add `wontFixDecidedBy` and `wontFixDate` fields — undefended de-scopes are how coverage rots.
- **Don't fudge with `partial`.** If something is truly half-covered, that's an issue, not a status quo. File the gap.
- **Regenerate, don't hand-edit.** The matrix is derived data; running this skill should produce the same output every time for the same inputs. If you find yourself hand-editing, your inputs are wrong.
- **Cross-link to the dashboard.** Every Uncovered REQ in the matrix should appear as a `test-coverage` issue with the same REQ ID in the title, so reviewers can pivot from dashboard → issue → plan.

---

## Related

- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — `@requirement:REQ-…` tag for direct linking.
- [`prompts/core/manual-test-case-generator.md`](../../../prompts/core/manual-test-case-generator.md) — fills coverage gaps with manual TCs.
- [`templates/qa-metrics-dashboard.html`](../../../templates/qa-metrics-dashboard.html) — Panel #4 consumes the JSON output.
- [`.agents/skills/test-design-techniques`](../test-design-techniques/SKILL.md) — design TCs to close uncovered REQs.
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — file `test-coverage` issues for uncovered REQs.
- [`.agents/skills/test-tags-validator`](../test-tags-validator/SKILL.md) — pre-flight to ensure spec discovery is reliable.
