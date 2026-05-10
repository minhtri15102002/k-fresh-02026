# QA Quarterly Plan — Q<n> <YYYY> — <team / org>

> Lab artifact for [Track P · M4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"The quarterly plan".
> One page. Anything longer means you don't actually have a plan.

## Theme (one sentence)

<e.g. "Make AI-feature testing first-class without sacrificing core regression stability.">

## Objectives & Key Results

> 3 OKRs maximum. Each KR is **measurable** and **time-bound**.

### O1 — <objective in plain language>

- **KR1:** <measurable + time-bound> (current: <baseline>; target: <number>)
- **KR2:** <measurable + time-bound>
- **KR3:** <measurable + time-bound — binary success works ("1 caught defect = success")>

### O2 — <objective>

- **KR1:** <…>
- **KR2:** <…>
- **KR3:** <…>

### O3 — <objective>

- **KR1:** <…>
- **KR2:** <…>
- **KR3:** <…>

## SLO (steady-state quality bar)

> 1 SLO per quarter; the existing dashboard tracks it continuously.

- **<metric>:** ≥ <target> (error budget: <e.g. "4 hrs/quarter <99 %">)
- *Source panel:* [`templates/qa-metrics-dashboard.html`](../qa-metrics-dashboard.html) Panel #<n>

## Stop-loss criteria (when we abandon and re-plan)

> Pre-commit the conditions under which you'll cut scope mid-quarter — courage tax paid up front.

- **O1 stop-loss:** <e.g. "KR1 not in CI by end of week 4 → reduce O1 to KR1 only">
- **O2 stop-loss:** <…>
- **O3 stop-loss:** <…>

## Budget asks

| Ask | $ / FTE | Backed by | Decision needed by |
|---|---|---|---|
| <e.g. "2 incremental headcount"> | <2 FTE> | `qa-headcount-case-q<n>.md` | <YYYY-MM-DD> |
| <e.g. "AI eval infra"> | <$24k> | `vendor-decision-rfc.md` | <YYYY-MM-DD> |

> Pair every ask with an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) artifact — the dollar math is what gets the ask through.

## Risks I'm naming explicitly

- **R1:** <e.g. "O2 depends on dev-team commit (#qa-dev-jointbacklog) — owned by their TL"> · *Owner:* @<name> · *Trigger:* <when escalate>
- **R2:** <…>
- **R3:** <…>

## Reviewers

| Role | Name | Reviewed on |
|---|---|---|
| Peer Director | <name> | <YYYY-MM-DD> |
| VP Eng | <name> | <YYYY-MM-DD> |
| Finance partner | <name> | <YYYY-MM-DD> |

— Owner: <your name> · Date: <YYYY-MM-DD>

---

> Source: [Track P · Module 4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"The quarterly plan"
