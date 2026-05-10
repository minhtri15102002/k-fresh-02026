---
name: quality-score
description: "Computes a single composite quality score (0–100) from the QA Metrics Dashboard inputs: weighted blend of P1 pass-rate, defect density (open critical+major per kLoC or per feature), traceability coverage, mean CI duration, flake rate, and visual/a11y/perf pass. Emits the score, the per-component breakdown, and a delta vs. last sprint. Use when explicitly asked for 'a quality score', 'one number for quality', 'how good is the build right now', or as a leading indicator in trend-analysis. Wraps prompts/reporting/quality-score.md."
optionalRefs:
  - reports/run-summary.json
  - reports/defects.json
  - reports/traceability.json
  - reports/quality-score.md   # output
---

# Quality Score

A single number is reductive — but a single number gets read. This skill produces one, with the breakdown so the reader can argue with it intelligently.

## When to use this skill

- "Give me a quality score"
- "One number for quality"
- "How good is the build right now?"
- As a leading indicator inside [`trend-analysis`](../trend-analysis/SKILL.md)

## How to use it

1. Read the canonical formula from [`prompts/reporting/quality-score.md`](../../../prompts/reporting/quality-score.md).
2. Default weights (override per the prompt if leadership has agreed different ones):

| Component | Weight | Source | Computation |
|---|---|---|---|
| P1 pass-rate | 30 | run-summary | `(P1.passed / P1.total) × 30` |
| Critical+major defect density | 25 | defects.json | `max(0, 25 - (open_critical × 5 + open_major × 1))` |
| Traceability `Fully covered` | 20 | traceability.json | `(fully / total) × 20` |
| Flakiness penalty | 10 | run-summary.flaky | `max(0, 10 - flaky_count)` |
| CI duration | 10 | run-summary.duration | `10 × min(1, baseline / actual)` |
| Visual / a11y / perf pass | 5 | run-summary.byType | `5 × pass_pct_of_those_three` |

3. Emit `reports/quality-score.md`:

```markdown
# Quality Score — YYYY-MM-DD

## Score: 87 / 100   (▲ +3 vs. last week)

| Component | Earned | Possible |
|---|---|---|
| P1 pass-rate | 30 | 30 |
| Defect density | 19 | 25 |
| Traceability | 18 | 20 |
| Flakiness | 8 | 10 |
| CI duration | 7 | 10 |
| V/A/P | 5 | 5 |

### Why the change
- ✅ Cart bug closed → +5
- ❌ Mean CI duration up 12% → -2
```

## Best practices

- **Always show the breakdown.** A score without components is a vibe.
- **Don't tune weights to hit a number.** Tune them to match the team's actual priorities, then leave them alone.
- **Compare to the same formula.** If you change weights, re-baseline.
- **Use it as a leading indicator, not a KPI.** Scores are for steering, not for performance reviews.

## Related

- [`prompts/reporting/quality-score.md`](../../../prompts/reporting/quality-score.md)
- [`.agents/skills/trend-analysis/SKILL.md`](../trend-analysis/SKILL.md)
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md)
- [`.agents/skills/executive-summary/SKILL.md`](../executive-summary/SKILL.md)
