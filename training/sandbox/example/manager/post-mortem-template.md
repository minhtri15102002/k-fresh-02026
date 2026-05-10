# Phoenix QA Post-mortem Template — v1.2 (adopted 2026-05-01)

> Phoenix QA's adapted version of [`templates/manager/post-mortem-template.md`](../../../../templates/manager/post-mortem-template.md).
> This file is the *team's* template (sev definitions, customer-impact taxonomy, action-item routing) — not a filled post-mortem.
> Filled instances live at `training/sandbox/example/manager/post-mortem-<incident-name>-<date>.md`.

---

## Severity definitions (Phoenix-specific)

| Sev | Customer impact | Examples we've seen |
|---|---|---|
| **sev-1** | Total outage of cart or checkout | Full payment-service outage; cart returns 500 across all users |
| **sev-2** | Partial outage; specific journey broken; revenue loss | Cart-discount-expiry incident (2026-04-22); cart for Safari users only |
| **sev-3** | Degraded experience; workaround exists | Wishlist intermittently shows stale items; cart total slow to render |
| **sev-4** | Cosmetic / non-blocking; no measurable customer harm | Misaligned button on confirmation page |

## Customer-impact taxonomy

Always quantify in this order:
1. **Affected user count** (distinct user IDs hit by the bug)
2. **Affected order/revenue count** ($ value, even if estimated)
3. **Window of impact** (UTC start → end)
4. **Recoverability** (data loss? account corruption? both unrecoverable; everything else has a recovery plan)

## Action-item ownership routing

| Action category | Routes to | Default ETA |
|---|---|---|
| Test coverage gap | Phoenix QA tech lead (Sam) | 2 weeks |
| Monitoring / alert gap | SRE on-call lead (Dan) | 1 week |
| Runbook / docs gap | Incident IC of next shift | 1 week |
| Code change to prevent class | Owning team's tech lead | 2 sprints |
| Process change | QA Director (Khanh) — RFC required | 1 quarter |
| Hiring / capacity gap | QA Director — quarterly plan input | next quarterly cycle |

## Where post-mortems are published

- **Internal:** #engineering Slack + `/post-mortems/` SharePoint folder + linked from the dashboard's incident panel
- **Customer-facing:** only if sev-1/sev-2 with >50 affected users — see [`incident-customer-note.md`](./incident-customer-note.md) format
- **External (status page):** any sev-1/sev-2 incident regardless of size

---

## The template (copy below this line for a new post-mortem)

```markdown
# Post-mortem — <incident-name> — <YYYY-MM-DD>

## Severity
sev-<1-4> · Customer impact: <N users for M minutes>; <$ revenue impact if known> · Recoverability: <yes/no/partial>

## Summary (3-5 sentences for someone who wasn't here)

## Timeline (UTC)
| Time | Event | Source |
|---|---|---|

## What went well

## What went poorly

## Root-cause analysis (5 Whys — blameless; no human names in the chain)
1. Why did <symptom> happen? →
2. Why → 3. Why → 4. Why → 5. Why (the systemic root) →

## Action items (max 5; owner + ETA + failure mode)
| # | Action | Owner | ETA | Failure mode |
|---|---|---|---|---|

## What we'd do differently in the response itself

— Facilitated by: <name> · Attendees: <names>
```

---

## Anti-patterns we explicitly forbid in Phoenix post-mortems

- ❌ Naming an individual in a Why chain (always re-write to "the system / the process / the runbook")
- ❌ More than 5 action items (means none get done; cut and re-prioritise)
- ❌ Action items without a named owner ("we should…" is not an action item)
- ❌ Skipping the "what we'd do differently in the response" section (the response craft compounds across incidents)
- ❌ Publishing without the IC + Comms + Scribe agreeing on the timeline

## Cadence

- Post-mortem facilitated within **5 business days** of all-clear
- Action-item completion reviewed **monthly** in the Phoenix QA all-hands
- Open action items >30 days past ETA escalated to QA Director

---

> Adapted by Phoenix QA (Khanh Do) from [`templates/manager/post-mortem-template.md`](../../../../templates/manager/post-mortem-template.md) · Source: [Track P · Module 5](../../../track-p-people-and-management/p05-people-first-incident-and-change-leadership.md)
