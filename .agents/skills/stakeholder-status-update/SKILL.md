---
name: stakeholder-status-update
description: "Composes weekly QA status updates for stakeholders (PM, Eng Lead, Director): wins, in-flight items, blockers (with owners + asks), upcoming risks, and one ask of the reader. Pulls evidence from reports/run-summary.json, reports/defects.json, the active test plan, and the most recent sprint-health-dashboard. Use when explicitly asked to 'write the QA status update', 'weekly status', 'Friday update', 'send the status to leadership', or every Friday during a release sprint. Different from executive-summary (one-page exec narrative): this skill produces a four-paragraph collaborative update with explicit asks."
---

# Stakeholder Status Update

A weekly status update is the QA Lead's most-read artefact. Done well it builds trust and unblocks problems early; done badly it becomes "just sending updates" and gets ignored. This skill makes it crisp and actionable.

## When to use this skill

- "Write the QA status update"
- "Weekly status from QA"
- "Friday update"
- "Send the status to leadership"
- Every Friday during release sprints

## How to use it

### Phase 1 — Pull evidence

| Source | What it gives |
|---|---|
| `reports/run-summary.json` | pass-rates, this-week velocity |
| `reports/defects.json` | inflow / outflow / open critical |
| Latest [`sprint-health-dashboard`](../sprint-health-dashboard/SKILL.md) output | sprint trajectory |
| Active [`test-plan-author`](../test-plan-author/SKILL.md) artefact | exit-criteria status |
| Last week's status update | for "vs. last week" deltas |

### Phase 2 — Compose the four paragraphs

```markdown
**This week's QA status — Week of YYYY-MM-DD**

✅ **Wins**
- Cart regression suite back to 100% pass-rate (PR #199 fixed the locator drift).
- Authored 24 manual cases for the wishlist-share feature; 14 already automated.

🔄 **In flight**
- Checkout-v2 release: 92% of @P1 cases executed (target 100% by Wed). On track.
- 3 visual diffs under triage (PR #214); expect resolved by Mon.

🚧 **Blockers (asks below)**
- @alice : Issue #312 (cart total miscalc, severity:major) open for 4 days; needs eng pickup.
- @bob   : Staging env unstable since Tue; SRE ticket #89 pending.
- @carol : Need Jira admin to add `@i18n` label to taxonomy.

⚠ **Risks for next week**
- New PSP integration lands Wed; no contract tests yet (R3 in test plan).
- Mobile-web regression suite is at 40% coverage; below the 70% bar in the test plan.

🙏 **One ask**: prioritise #312 in Mon's triage so we don't carry it into release week.
```

### Phase 3 — Tailor the audience

| Stakeholder | Emphasis | Things to drop |
|---|---|---|
| PM | wins, blockers, ask | engineering deltas, CI duration |
| Eng Lead | risks, blockers, asks | feature wins (PM has those) |
| Director | wins + risks + one ask | everything else |
| Whole team | full version | nothing |

### Phase 4 — Same status word as `release-readiness`

If the release-readiness verdict is `RED`, the status update is not "we're doing fine, just one blocker". Match the verdict word for stakeholder calibration.

## Best practices

- **One ask per update.** Asks are leverage. Three asks dilute to zero.
- **Owners by name.** "Eng" is not an owner; "@alice" is.
- **Wins first.** Stakeholders read the first line — make it positive when honestly possible, but never sugar-coat blockers.
- **Same shape every week.** Predictable structure trains stakeholders to scan it.
- **Numbers cite source.** "Pass-rate 92% (Dashboard panel #2)" — never bare percentages.
- **Don't repeat last week's update verbatim.** If nothing changed, say "no change in <area>; see last week".

## Related

- [`prompts/reporting/sprint-health-dashboard.md`](../../../prompts/reporting/sprint-health-dashboard.md)
- [`.agents/skills/sprint-health-dashboard/SKILL.md`](../sprint-health-dashboard/SKILL.md) — feeds this skill
- [`.agents/skills/executive-summary/SKILL.md`](../executive-summary/SKILL.md) — one-page leadership variant
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md) — verdict word source
- [`.agents/skills/defect-insights/SKILL.md`](../defect-insights/SKILL.md) — for the "Risks for next week" section
