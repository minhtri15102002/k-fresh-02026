---
name: executive-summary
description: "Composes a one-page executive summary of QA status (3 paragraphs + 1 metrics table + a verdict line) suitable for a leadership email or steerco. Reads reports/run-summary.json, reports/defects.json, reports/traceability.json, the latest CI run on main, and the active test plan; emits a concise narrative free of jargon, with a single GO / WATCH / RED status. Use when explicitly asked to 'write an exec summary', 'give me the leadership update', 'one-page status for the steerco', 'send to PM/CTO'. Wraps prompts/reporting/executive-summary.md and references the QA Metrics Dashboard for evidence links."
optionalRefs:
  - reports/run-summary.json
  - reports/defects.json
  - reports/traceability.json
  - reports/executive-summary.md   # output
---

# Executive Summary

Leadership reads exec summaries; they don't read dashboards. This skill compresses the dashboard to a one-page narrative they will read.

## When to use this skill

- "Write an exec summary"
- "Leadership update"
- "One-page status for the steerco"
- "Send to PM / CTO / VP"

## How to use it

1. Pull the same evidence as [`release-readiness`](../release-readiness/SKILL.md) Phase 1.
2. Compose three paragraphs: **what shipped / what's in flight / what's at risk** — no jargon, no test-IDs.
3. Add a 5-row metrics table (P1 pass-rate, open critical defects, traceability coverage, mean CI duration, this-week velocity).
4. End with a single verdict line: `Status: GO | WATCH | RED — <one-sentence reason>`.
5. Save to `reports/executive-summary.md`. Cite each metric with a Dashboard panel number.

Follow the structure in [`prompts/reporting/executive-summary.md`](../../../prompts/reporting/executive-summary.md) verbatim.

## Best practices

- **One page max.** If it doesn't fit on a phone screen, it's wrong.
- **No test-IDs in the body.** TC-CART-04 is for engineers; "the cart-update flow" is for leadership.
- **Numbers cite their source.** `P1 pass-rate 100% (Dashboard panel #2)`.
- **Same status word as `release-readiness`.** Don't say "GO" here and "CONDITIONAL GO" there.

## Related

- [`prompts/reporting/executive-summary.md`](../../../prompts/reporting/executive-summary.md)
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md)
- [`.agents/skills/quality-score/SKILL.md`](../quality-score/SKILL.md)
- [`.agents/skills/sprint-health-dashboard/SKILL.md`](../sprint-health-dashboard/SKILL.md)
