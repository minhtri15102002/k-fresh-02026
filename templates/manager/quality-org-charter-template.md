# <Org / Team name> — Quality Org Charter — v<n.n>

> **Track P graduation artifact.** Lab artifact for [Track P · M5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) §"The Quality Org Charter".
>
> Living document. Versioned. Owned by the manager. Reviewed annually with the team.
>
> For an automated draft from a JSON inputs file, use [`.agents/skills/quality-org-charter`](../../.agents/skills/quality-org-charter/SKILL.md) or `npm run charter:draft -- inputs.json`.

---

## 1. Mission (one sentence)

<e.g. "We make it impossible to ship a critical regression to <product> without a named human accepting the risk.">

## 2. Operating principles (3-5)

> What we always do, in tension with the anti-principles below.

1. <e.g. "Numbers over vibes — every release decision cites data">
2. <e.g. "Blameless by default — incidents teach the system, not punish the human">
3. <…>
4. <… optional>
5. <… optional>

## 3. Anti-principles (3-5; what we will NOT do)

> What we never do, even under deadline pressure. These are most useful when you're tired.

1. <e.g. "We do not ship without @P1 at 100 %">
2. <e.g. "We do not exit ICs without 90 days of documented feedback">
3. <…>
4. <… optional>
5. <… optional>

## 4. Team operating model

| Practice | Cadence | Notes |
|---|---|---|
| 1:1s | <e.g. "weekly, 30 min, IC drives, doc per template"> | [Template](./1on1-template.md) |
| Standup | <e.g. "async daily; sync 2×/week"> | <…> |
| Retro | <e.g. "bi-weekly, rotating facilitator"> | <…> |
| Quarterly planning | <e.g. "first 2 weeks of quarter, OKR + SLO + stop-loss"> | [Template](./qa-quarterly-plan-template.md) |
| On-call | <e.g. "1-week shifts, 4-deep rotation, comp time"> | <…> |
| Skip-level 1:1s | <e.g. "every 6 weeks, listen-only"> | <…> |

## 5. Decision rights

| Decision | Who decides | Who must be consulted | Who is informed |
|---|---|---|---|
| <Hiring loop go/no-go> | Hiring manager | Loop participants | VP |
| <Release go/no-go> | QA Director | Eng Director, PM | VP |
| <Quality SLO target> | QA Director | Eng leadership | All teams |
| <Vendor purchases >$10k> | QA Director + Finance | Affected ICs | VP |
| <Performance management actions> | Manager (line) | HR, skip-level | — |
| <Framework architectural change> | Tech lead | Senior ICs | Manager |
| <…> | <…> | <…> | <…> |

> ≥ 6 decision categories required. List the ones you actually face quarterly.

## 6. Quality bar (the floor)

> Threshold at which we stop the line. Cite source dashboard panels.

- <e.g. "@P1 pass rate 100 % on every main commit (stop-the-line below)"> · *Source:* Panel #2
- <e.g. "@P2 ≥ 95 %"> · *Source:* Panel #2
- <e.g. "0 open severity:critical defects at release time"> · *Source:* Panel #3
- <e.g. "Mean time to triage ≤ 24h"> · *Source:* Panel #4
- <…>

## 7. Incident & change response

- **War-room roles:** Incident Commander / Comms Lead / Scribe (per [Track P P5 §war-room](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md))
- **Post-mortem SLA:** <e.g. "5 business days, blameless template"> · [Template](./post-mortem-template.md)
- **Change-management framework:** <e.g. "Kotter 8-step for any change spanning >1 team or >1 sprint">
- **Customer comms threshold:** <when do we publish a customer note? See [template](./incident-customer-note-template.md)>

## 8. How we hire and grow

- **JD discipline:** must-have / nice-to-have / red flags + comp band published · [Template](./jd-qa-engineer-template.md)
- **Interview loop:** <e.g. "4 stages + bar raiser; structured rubric; written-feedback-before-debrief"> · [Template](./interview-rubric-template.md)
- **Growth plans:** every 6 months, every IC, [template](./growth-plan-template.md)
- **Performance management:** feedback → PIP → exit, with no surprises (per [Track P · M2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md))

## 9. How we communicate

- **Threaded docs** for any decision needing >6 messages (per [Track P · M3 §async writing](../../training/track-p-people-and-management/p03-communication-and-influence.md))
- **Release briefs** to exec audience, not engineer audience · [Template](./release-brief-exec-template.md)
- **Three forms of "no":** yes-and-cut · no-because · not-now-but
- **Defect narratives** tuned per audience · [Template](./defect-narrative-template.md)

## 10. How I (the manager) operate

- **Office hours:** <day/time> for any IC, no agenda required
- **Skip-level 1:1s:** every 6 weeks with each report's report
- **Quarterly retro on my own performance:** shared with the team
- **Personal anti-principles:** <link to your `delegation-log.md` or written elsewhere>

## Sign-off

| Role | Name | Date |
|---|---|---|
| Author (this manager) | <name> | <YYYY-MM-DD> |
| Peer Manager (reviewer) | <name> | <YYYY-MM-DD> |
| VP / Director (informed) | <name> | <YYYY-MM-DD> |

— Version: <n.n> · Next review: 12 months · <YYYY-MM-DD>

---

> Source: [Track P · Module 5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) §"The Quality Org Charter"
