---
name: trend-analysis
description: "Analyses QA metrics trends across the last N runs to surface drift before it becomes a crisis: pass-rate decay, defect-arrival rate vs. fix rate, mean CI duration creep, flakiness trend, traceability decline, per-tag pass-rate slopes. Reads the persisted reports/run-trend.json (multi-run rollup) and the current reports/run-summary.json. Use when explicitly asked to 'show the trend', 'is quality getting worse', 'compare the last N runs', 'why is CI slower', or before a sprint retro. Emits chart-ready data, slope-per-week, and prose call-outs for the top three changes (positive or negative). Wraps prompts/reporting/trend-analysis.md."
optionalRefs:
  - reports/run-trend.json
  - reports/run-summary.json
  - reports/trend-analysis.md   # output
---

# Trend Analysis

Single snapshots lie. Trends tell the truth. This skill compares the last N runs and shows where quality is drifting — early enough to act on, instead of in a retro three months later.

## When to use this skill

- "Show the trend"
- "Is quality getting worse?"
- "Compare the last N runs"
- "Why is CI slower than last sprint?"
- Before sprint retros / monthly QA review

## How to use it

1. Read `reports/run-trend.json` (persisted by the CI workflow). If absent, generate from the last N `run-summary.json` artefacts via `gh run download`.
2. For each metric below, compute slope-per-week and call out the top 3 changes (positive or negative).

| Metric | Source | Concern threshold |
|---|---|---|
| P1 pass-rate | run-trend.priority['@P1'] | -2pp/week |
| Mean CI duration | run-trend.duration.mean | +10%/week |
| Open `severity:critical` | defects-trend | any positive slope |
| Flaky-test count | flaky-trend | +2/week |
| Traceability `Fully covered` % | traceability-trend | -1pp/week |
| Per-feature pass-rate | run-trend.byFeature | any feature -5pp/week |

3. Emit `reports/trend-analysis.md` with one chart-ready table per metric, plus 3 prose callouts ("⚠ Cart pass-rate dropped 8pp over 3 weeks; suspect commit X").
4. Hand off:
   - Decay → [`failure-analyzer`](../failure-analyzer/SKILL.md) on the worst-affected suite
   - Flake increase → [`flaky-test-triage`](../flaky-test-triage/SKILL.md)
   - Defect-arrival > fix-rate → [`defect-insights`](../defect-insights/SKILL.md)

## Best practices

- **Compare like-for-like.** Don't compare a `--grep @smoke` run to a full regression run.
- **Slope, not snapshot.** "P1 is 98%" is fine; "P1 dropped from 100% to 98% over 3 runs" is actionable.
- **Cite the suspect commit.** If pass-rate declined at run #N, run `git log` between N-1 and N.
- **Top 3, not top 30.** A wall of metrics gets ignored.

## Related

- [`prompts/reporting/trend-analysis.md`](../../../prompts/reporting/trend-analysis.md)
- [`.agents/skills/quality-score/SKILL.md`](../quality-score/SKILL.md)
- [`.agents/skills/defect-insights/SKILL.md`](../defect-insights/SKILL.md)
- [`.agents/skills/flaky-test-triage/SKILL.md`](../flaky-test-triage/SKILL.md)
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md)
