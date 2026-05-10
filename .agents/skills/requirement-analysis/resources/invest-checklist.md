# INVEST + SMART Checklist

Use one row per criterion. Each row gets `pass` / `weak` / `fail` and a one-line justification anchored in a quote from the requirement.

---

## INVEST (Bill Wake)

### I — Independent
- Can this story be delivered without depending on another in-flight story?
- Are external blockers (API, design, data, legal) explicit?
- **Pass** — story stands alone or its dependencies are listed.
- **Weak** — depends on something already in-flight in the same sprint.
- **Fail** — depends on a story that hasn't been written yet.

### N — Negotiable
- Is the *what* fixed but the *how* still open?
- Watch for implementation leakage ("use Redis", "must be a modal").
- **Pass** — describes user behaviour, not technical solution.
- **Weak** — mentions one technical hint, defensible.
- **Fail** — locks the implementation, leaves no room for design.

### V — Valuable
- Whose problem does this solve? Stated or implicit?
- Connect to user role, business goal, or OKR.
- **Pass** — user value is explicit ("As a customer I want…").
- **Weak** — value implied but not stated.
- **Fail** — pure tech debt with no user link.

### E — Estimable
- Could a sprint team plan effort with the info given?
- Hidden complexity (third-party integration, data migration) explicit?
- **Pass** — team could estimate confidently.
- **Weak** — team would estimate with a wide range.
- **Fail** — too vague to estimate at all.

### S — Small
- Fits comfortably in one sprint?
- If "epic", refuse — it must be split first.
- **Pass** — clearly fits 1–5 days of work.
- **Weak** — borderline; could split.
- **Fail** — needs to be broken into multiple stories.

### T — Testable — **HARD GATE**
- Can a tester write a passing/failing test from this requirement?
- If `fail`, the verdict is `REJECT` regardless of other scores.
- **Pass** — observable, deterministic outcomes stated.
- **Weak** — outcomes implied but not directly observable.
- **Fail** — outcomes subjective ("user-friendly", "fast") with no measure.

---

## SMART

### S — Specific
- One actor, one trigger, one observable outcome per criterion?
- **Pass** — single, narrow scope.
- **Weak** — two related behaviours bundled.
- **Fail** — vague or sprawling scope.

### M — Measurable
- Are success conditions quantifiable or directly observable?
- **Pass** — explicit metric or assertion.
- **Weak** — directly observable but not quantified.
- **Fail** — purely subjective.

### A — Achievable
- Within technical reality (current stack, team skill, data, infra)?
- **Pass** — feasible.
- **Weak** — feasible with extra investment that's not budgeted.
- **Fail** — requires capability the team doesn't have.

### R — Relevant
- Tied to a stated goal or OKR?
- **Pass** — link present.
- **Weak** — link inferable.
- **Fail** — orphan story.

### T — Time-bound
- Performance budget, deadline, or freshness constraint stated?
- For non-perf stories, mark `n/a` only when truly irrelevant.
- **Pass** — explicit budget or freshness window.
- **Weak** — implicit ("real-time" without number).
- **Fail** — not stated where it should be.

---

## Scoring template

```
INVEST
  I  : pass | weak | fail   — <quote / justification>
  N  : pass | weak | fail   — …
  V  : pass | weak | fail   — …
  E  : pass | weak | fail   — …
  S  : pass | weak | fail   — …
  T  : pass | weak | fail   — …      ← HARD GATE: fail ⇒ REJECT

SMART
  S  : pass | weak | fail   — …
  M  : pass | weak | fail   — …
  A  : pass | weak | fail   — …
  R  : pass | weak | fail   — …
  T  : pass | weak | fail   — …

Aggregate
  pass count: X / 11
  weak count: Y / 11
  fail count: Z / 11
```

Verdict influence:
- `Testable = fail` ⇒ **REJECT**
- `fail` count ≥ 2 ⇒ **NEEDS-REFINEMENT** (or **REJECT** if both fails are critical)
- Otherwise scoring contributes to verdict alongside ambiguity, completeness, and assumption passes.
