---
name: sprint-health-dashboard
description: "Composes a sprint-scoped health view: progress against committed scope (% of P1/P2 cases executed), defect inflow vs. outflow this sprint, blocked items, release-readiness verdict, and the next-sprint risk forecast. Reads the QA Dashboard inputs filtered to the current sprint window, the active test plan, and the milestone in .github/MILESTONES.md. Use when explicitly asked for 'sprint health', 'standup status', 'mid-sprint check', 'how is the sprint going', or daily during a release sprint. Wraps prompts/reporting/sprint-health-dashboard.md."
optionalRefs:
  - reports/run-summary.json
  - reports/defects.json
  - reports/sprint-health.md   # output
---

# Sprint Health Dashboard

Sprint health is mid-flight visibility — what's the trajectory before the demo, before the deploy, before the retro. This skill gives the QA Lead a 90-second read.

## When to use this skill

- "Sprint health"
- "Standup status from QA"
- "Mid-sprint check"
- "How is the sprint going?"
- Daily during a release sprint

## How to use it

1. Determine the sprint window (start / end dates) from `.github/MILESTONES.md` or user input.
2. Filter the dashboard inputs to that window.
3. Compute, per [`prompts/reporting/sprint-health-dashboard.md`](../../../prompts/reporting/sprint-health-dashboard.md):

| Section | What to include |
|---|---|
| **Burndown** | committed P1/P2 cases vs. executed (so far) |
| **Defects** | inflow this sprint, outflow this sprint, net change, oldest open critical |
| **Blockers** | items in `status:blocked` ≥ 24h, with owner + age |
| **Release readiness** | mini-version of the [`release-readiness`](../release-readiness/SKILL.md) verdict (GO / WATCH / RED) |
| **Next-sprint risk** | top 3 items spilling over, top 3 risks for the next plan |

4. Emit `reports/sprint-health.md`. Keep it under one page. Use checkbox lists for blockers so they're trackable.

## Best practices

- **One sprint per file.** Don't accumulate; archive completed sprint files.
- **Same status word as `release-readiness`.** Cross-skill consistency keeps stakeholders calibrated.
- **Always list owners for blockers.** "QA is blocked" doesn't unblock anyone.
- **Forecast, don't just report.** The "next-sprint risk" section is the most valuable.

## Related

- [`prompts/reporting/sprint-health-dashboard.md`](../../../prompts/reporting/sprint-health-dashboard.md)
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md)
- [`.agents/skills/executive-summary/SKILL.md`](../executive-summary/SKILL.md)
- [`.agents/skills/defect-insights/SKILL.md`](../defect-insights/SKILL.md)
- [`.agents/skills/test-plan-author/SKILL.md`](../test-plan-author/SKILL.md)
