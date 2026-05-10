---
name: defect-insights
description: "Mines the open and recently-closed defects in reports/defects.json to surface the patterns no individual ticket reveals: hottest module by inflow rate, top recurring root cause, mean time to fix by severity, % of defects re-opened, defects per release tag, escape rate from QA → prod. Use when explicitly asked for 'defect insights', 'where are bugs concentrating', 'mean time to fix', 'are we re-opening too many bugs', or before a sprint retro / quarterly review. Wraps prompts/reporting/defect-insights.md and feeds prevention recommendations back to test-plan-author and risk-analysis."
optionalRefs:
  - reports/defects.json
  - reports/defect-insights.md   # output
---

# Defect Insights

Defects are individual events; insights are the pattern across events. This skill finds the patterns and turns them into a prevention plan.

## When to use this skill

- "Defect insights for this sprint / release / quarter"
- "Where are bugs concentrating?"
- "Mean time to fix by severity"
- "Are we re-opening too many bugs?"
- Before sprint retros, quarterly QA reviews, OKR check-ins

## How to use it

1. Read `reports/defects.json` (refresh first via `npm run fetch:defects`).
2. Compute the canonical metrics from [`prompts/reporting/defect-insights.md`](../../../prompts/reporting/defect-insights.md):

| Metric | What it tells you |
|---|---|
| Hottest module (by inflow rate) | which area needs more upstream testing |
| Top 3 recurring root causes | what to add to risk-analysis going forward |
| Mean Time To Fix by `severity:*` | are critical bugs really being prioritised |
| Re-open rate | are fixes superficial |
| Defects-per-release | is this release riskier than the last |
| Escape rate (prod-found ÷ total) | how good is QA's pre-release coverage |

3. Emit `reports/defect-insights.md` with one section per metric, an example issue link per finding, and a top-3 prevention recommendations list.

4. Hand off:
   - Hot module → [`risk-analysis`](../risk-analysis/SKILL.md) bumps Likelihood for that module
   - Recurring root cause → [`test-plan-author`](../test-plan-author/SKILL.md) adds explicit coverage in next plan
   - High re-open rate → [`test-code-review`](../test-code-review/SKILL.md) audit of the fixing PRs
   - High flake-related defects → [`flaky-test-triage`](../flaky-test-triage/SKILL.md)

## Best practices

- **One sample issue link per finding.** "Many bugs in cart" is unhelpful; "see #123, #145, #160" is.
- **Compare windows.** "12 critical bugs this sprint" is meaningless without "vs. 4 last sprint".
- **Don't moralise.** "Eng is shipping bugs" is bad framing; "the cart module's defect inflow is 3× the next module's" is data.
- **Prevention > diagnosis.** Every insight ends with "next time, do X".

## Related

- [`prompts/reporting/defect-insights.md`](../../../prompts/reporting/defect-insights.md)
- [`prompts/core/defect-labels.md`](../../../prompts/core/defect-labels.md)
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md)
- [`.agents/skills/risk-analysis/SKILL.md`](../risk-analysis/SKILL.md)
- [`.agents/skills/trend-analysis/SKILL.md`](../trend-analysis/SKILL.md)
- [`.agents/skills/test-plan-author/SKILL.md`](../test-plan-author/SKILL.md)
