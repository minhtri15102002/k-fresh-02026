---
name: risk-analysis
description: "Builds a risk register for a feature, release, or change set: lists components in scope, scores each on Likelihood × Impact (1–3 each), classifies the result as High / Medium / Low, recommends a coverage strategy per row (smoke-only / regression / E2E + perf + security), and feeds the output directly into the test-plan-author Phase 2 risk register. Use when explicitly asked to 'do a risk assessment', 'what could break', 'risk-based test prioritization', 'where should we focus testing', or before authoring a test plan for a non-trivial change. Wraps prompts/advanced/risk-analysis.md."
---

# Risk Analysis

Risk-based testing is the single biggest lever for QA efficiency: it lets you say no to low-value coverage with evidence. This skill produces that evidence — a structured register that downstream skills consume directly.

---

## When to use this skill

Trigger on:
- "Do a risk assessment for `<feature>`"
- "What could break?"
- "Risk-based test prioritization"
- "Where should we focus testing?"
- Before [`test-plan-author`](../test-plan-author/SKILL.md) Phase 2

Do **not** use when:
- The user already has a test plan and wants exit criteria → use [`release-readiness`](../release-readiness/SKILL.md).
- Risk is purely security → use [`api-security-testing`](../api-security-testing/SKILL.md) or threat-model the feature instead.

---

## How to use it

### Phase 1 — Decompose the change

List components touched:
1. Read the PR / story description; list every module mentioned.
2. Cross-check against `prompts/core/defect-labels.md` module catalogue (`auth/cart/checkout/profile/product/compare/wishlist/home`).
3. Cross-check against the page-object surface in [`pages/ui`](../../../pages/ui) and [`pages/api`](../../../pages/api).
4. Add hidden surfaces: payment flows, session state, reporting jobs, data migrations.

### Phase 2 — Score each component

Per [`prompts/advanced/risk-analysis.md`](../../../prompts/advanced/risk-analysis.md):

| Likelihood | Definition |
|---|---|
| 3 | new code, new dependency, complex logic, recent regressions in this area |
| 2 | refactor of stable code; touches a moderately-tested area |
| 1 | tiny / isolated / heavily-tested |

| Impact | Definition |
|---|---|
| 3 | revenue, security, data loss, public-facing crash |
| 2 | feature unusable for some users; workaround exists |
| 1 | cosmetic; internal only |

Score = Likelihood × Impact.

### Phase 3 — Classify & recommend

| Score | Class | Strategy |
|---|---|---|
| 6–9 | **High** | E2E (`@P1 @critical @smoke @regression`) + manual exploratory + perf budget + security smoke |
| 3–4 | **Medium** | E2E (`@P2 @major @regression`); manual exploratory once; revisit perf if hot path |
| 1–2 | **Low** | Smoke-only (`@P3 @minor @smoke`); rely on broader regression suite |

### Phase 4 — Emit the register

```markdown
## Risk register — Checkout v2.1

| # | Component | Likelihood | Impact | Score | Class | Strategy | Owner |
|---|---|---|---|---|---|---|---|
| R1 | Payment redirect (new PSP) | 3 | 3 | 9 | High | E2E + manual + monitored canary | @alice |
| R2 | Cart total recalc | 2 | 3 | 6 | High | E2E + perf budget | @bob |
| R3 | Wishlist ↔ checkout transfer | 2 | 2 | 4 | Medium | E2E regression | @carol |
| R4 | "Continue shopping" link | 1 | 1 | 1 | Low | smoke only | shared |

## Heat-map (count of rows by class)
- High: 2
- Medium: 1
- Low: 1
```

### Phase 5 — Hand off

- Paste the register into the test plan's Phase 2 (Section 4) as-is.
- Each High-class row maps to ≥ 1 `@P1` automated case via [`generate-testcase`](../generate-testcase/SKILL.md).
- Each Medium-class row maps to ≥ 1 `@P2` case.

---

## Best practices

- **Always score Likelihood AND Impact.** A "we don't know yet" score is `3 × 3` (over-test, then revise once you know more).
- **Score the user impact, not the engineering impact.** "Hard to debug" is not Impact 3.
- **List every component, even Low ones.** The register is also a record of what you considered and rejected.
- **Recompute after every major scope change.** Risk drifts when scope drifts.

---

## Related

- [`prompts/advanced/risk-analysis.md`](../../../prompts/advanced/risk-analysis.md) — full prompt
- [`.agents/skills/test-plan-author/SKILL.md`](../test-plan-author/SKILL.md) — consumes the register in Phase 2
- [`.agents/skills/test-design-techniques/SKILL.md`](../test-design-techniques/SKILL.md) — derives cases for High-class rows
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md) — checks all High rows are green at exit
