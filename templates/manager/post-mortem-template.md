# Post-mortem — <incident-name> — <YYYY-MM-DD>

> Lab artifact for [Track P · M5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) §"Blameless post-mortem facilitation".
> Blameless rule: every "Alice didn't catch it" must be re-written as "our process had no <missing safety net>".

## Severity

**sev-<1-4>** · Customer impact: <N customers for M minutes> · Revenue impact (if known): $<…>

## Summary (3-5 sentences for someone who wasn't here)

<…>

## Timeline (UTC)

| Time | Event | Source |
|---|---|---|
| HH:MM | <e.g. "Deploy A started"> | <e.g. "deploy logs"> |
| HH:MM | <e.g. "Error rate at /checkout exceeded 5 %"> | <e.g. "Datadog alert"> |
| HH:MM | <e.g. "On-call paged"> | <PagerDuty> |
| HH:MM | <e.g. "Comms #1 to #status sent"> | <e.g. "Slack archive"> |
| HH:MM | <e.g. "Hotfix merged"> | <PR link> |
| HH:MM | <e.g. "All-clear"> | <…> |

## What went well

> Specific behaviours, not platitudes.

- <e.g. "Detection from monitoring (3 min from incident → page)">
- <e.g. "Comms cadence (5 updates in first hour)">
- <…>

## What went poorly

> The system, not a human.

- <e.g. "Cart deploy lacked canary">
- <e.g. "Runbook for 'checkout error spike' was 8 months out of date">
- <…>

## Root-cause analysis (5 Whys — blameless)

1. **Why did <observed symptom> happen?** → <…>
2. **Why did that happen?** → <…>
3. **Why did that happen?** → <…>
4. **Why did that happen?** → <…>
5. **Why did that happen? (the systemic root)** → <…>

> If a Why answer names a person, re-write it as a system gap.

## Action items

> No more than 5. Each has owner + ETA + failure mode.

| # | Action | Owner | ETA | Failure mode if it slips |
|---|---|---|---|---|
| 1 | <e.g. "Wire SLO error-budget alert"> | @<name> | <YYYY-MM-DD> | <e.g. "Re-evaluate at next post-mortem"> |
| 2 | <…> | <…> | <…> | <…> |
| 3 | <…> | <…> | <…> | <…> |

## What we'd do differently in the response itself

> Meta-reflection on how the team handled the incident, not the incident itself.

- <e.g. "Earlier customer comms (waited 22 min; should have been 10)">
- <e.g. "Comms lead and IC were the same person — split next time">
- <…>

## Distribution

- 📢 Internal: <#engineering, eng-all, this folder>
- 📊 Dashboard: action-item completion tracked in [`templates/qa-metrics-dashboard.html`](../qa-metrics-dashboard.html) Panel #<n>
- 👥 External (if customer-facing): see [`incident-customer-note-template.md`](./incident-customer-note-template.md)

— Facilitated by: <name> · Attendees: <names> · Date: <YYYY-MM-DD>

---

> Source: [Track P · Module 5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) §"Blameless post-mortem facilitation"
