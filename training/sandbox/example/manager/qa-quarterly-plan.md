# QA Quarterly Plan — Q3 2026 — Phoenix QA (e-commerce checkout & cart)

> One page. Reviewed by Alice Chen (Peer Director, Platform), Bob Singh (VP Eng), Frank Iqbal (Finance).

## Theme

**Make AI-feature testing first-class without sacrificing core regression stability** — and close the time-boundary coverage gap surfaced by the Q2 cart-discount-expiry incident.

## Objectives & Key Results

### O1 — Ship the AI eval gate in CI (owned by Tom Liu + Khanh)

- **KR1:** Eval runner running on every PR that touches `prompts/` (target: 100 % of touched PRs gated; current: 0 %)
- **KR2:** 9-metric scoreboard ([Module 33b](../../../phase-6-ai-assisted-qa/33b-testing-ai-features-in-practice.md) rubric) exposed in [`templates/qa-metrics-dashboard.html`](../../../../templates/qa-metrics-dashboard.html) Panel #6
- **KR3:** First AI defect caught by the gate before merge (binary: 1 caught defect = success)

### O2 — Reduce defect-escape rate by 30 % and close the time-boundary coverage gap (owned by Sam Kim)

- **KR1:** Defect-escape rate Q3 ≤ 1.4 per release (Q2 baseline: 2.0; Q1 cart-expiry incident is the catalyst)
- **KR2:** Top-3 escape categories identified + traceability matrix updated; time-boundary cases explicitly named as a category
- **KR3:** `@P2` cart suite coverage 87 % → 95 % (the SLO floor); new `@TC-203b` and 5 sibling time-boundary tests merged

### O3 — Hire 1 Senior (L5) + grow Maya to L5 (owned by Khanh)

- **KR1:** Senior offer accepted by week 8 (per [`jd-qa-engineer.md`](./jd-qa-engineer.md) and [`interview-rubric.md`](./interview-rubric.md))
- **KR2:** Onboarding plan ready before start date — Maya as primary onboarding partner (her L5 evidence)
- **KR3:** Maya growth plan ([`growth-plan.md`](./growth-plan.md)) on track at month-3 retro (2026-07-01); promotion case at end of Q4

## SLO (steady-state quality bar)

- **`@P1` cart + checkout pass rate ≥ 99 %** — error budget: 4 hrs/quarter <99 %
- *Source panel:* [`templates/qa-metrics-dashboard.html`](../../../../templates/qa-metrics-dashboard.html) Panel #2

## Stop-loss criteria (when we abandon and re-plan)

- **O1 stop-loss:** KR1 (eval runner in CI) not green by end of week 4 → reduce O1 to KR1 only; defer KR2/KR3 to Q4
- **O2 stop-loss:** if `@P2` coverage doesn't move past 90 % by week 6 → escalate to peer Director (we're capacity-bound, not strategy-bound) and either descope KR3 or borrow a Platform IC for 2 sprints
- **O3 stop-loss:** Senior hire slips >4 weeks → freeze O1 KR2 and reassign Tom's eval-infra time to keep the gate alive; revisit headcount case in Q4

## Budget asks

| Ask | $ / FTE | Backed by | Decision needed by |
|---|---|---|---|
| 1 incremental headcount (Senior L5) | 1 FTE @ $230k loaded | `qa-headcount-case-q3-2026.md` (filed; uses [`roi-brief`](../../../../.agents/skills/roi-brief/SKILL.md) for justification: Phoenix gross savings ≥ $400k/yr from O1+O2) | 2026-06-01 |
| Visual-regression vendor (Applitools annual) | $24k/yr | [`vendor-decision-rfc.md`](./vendor-decision-rfc.md) | 2026-06-15 |
| AI eval infra (Braintrust starter) | $8k/yr | Folded into the same vendor RFC's "Option C variant" | 2026-06-15 |

## Risks I'm naming explicitly

- **R1:** O1 depends on Tom's framework PR landing in v3.1 of the prompt library — Tom is owner; trigger to escalate = >2 sprints of slip
- **R2:** Hiring competition — the Platform team is hiring at the same level; Alice and I have agreed not to bid against each other (escalation: VP if violated)
- **R3:** Maya's parental leave overlaps with month-4 of her growth plan; pre-committed: I will not penalise her timeline; Diego pairs with Sam during her absence

## Reviewers

| Role | Name | Reviewed on |
|---|---|---|
| Peer Director (Platform) | Alice Chen | 2026-05-08 |
| VP Eng | Bob Singh | 2026-05-12 |
| Finance partner | Frank Iqbal | 2026-05-13 |

— Owner: Khanh Do (QA Director) · Date: 2026-05-05

---

> Filled per [`templates/manager/qa-quarterly-plan-template.md`](../../../../templates/manager/qa-quarterly-plan-template.md) · Source: [Track P · Module 4](../../../track-p-people-and-management/p04-running-qa-program-at-scale.md)
