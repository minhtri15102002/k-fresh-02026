# Delegation Log — Khanh Do — 2026-04-15

> Five things I currently do (or did as an IC) that should now belong to the team. Re-reviewed quarterly.

## Items

### 1. Lead the weekly flake-triage review

| Field | Value |
|---|---|
| Currently does | Khanh (45 min/week) |
| Will be done by | **Sam Kim (L5)** — already de-facto running it |
| Why I'm holding it | Habit from when team was 3 ICs; Sam has owned it in practice for 2 sprints |
| Coaching plan | Wk 1: Sam runs it, I attend silently · Wk 2: Sam runs it, I skip · Wk 3: announce in standup that Sam owns it |
| Success criteria | Triage decisions documented in `reports/flake-triage-YYYY-WW.md`, shared in #qa-phoenix; Khanh stops attending |
| Acceptable first-time failure | 1 missed flake (someone surfaces it next week); no rollback impact |
| **Date target** | **2026-05-06** |

### 2. Take the IC role in cart-related production incidents

| Field | Value |
|---|---|
| Currently does | Khanh (last 4 of 5 incidents) |
| Will be done by | **Maya Patel (L4) + Sam Kim (L5)** rotating |
| Why I'm holding it | Scared (cart is the most user-facing surface; my mistakes would be visible) |
| Coaching plan | Next incident: Maya is IC, I'm Comms (split per Track P P5); 2nd: Sam is IC, I'm Scribe; 3rd: Maya solo |
| Success criteria | Maya/Sam can run a sev-2 from page → all-clear without me in the room |
| Acceptable first-time failure | 1 sev-3 with sub-optimal comms cadence (15 min late on first update) |
| **Date target** | **2026-06-30** (assuming ~1 incident/month frequency) |

### 3. Vendor reviews and RFCs (build vs buy)

| Field | Value |
|---|---|
| Currently does | Khanh (2-3/quarter) |
| Will be done by | **Tom Liu (L5)** — already doing the technical eval; I just write the RFC |
| Why I'm holding it | Important — wrong vendor decision is expensive |
| Coaching plan | Wk 1: Tom drafts the RFC, I review in 1:1 · Wk 2: Tom presents to peer Director, I attend · Wk 3: Tom owns presentation alone |
| Success criteria | Tom drafts + presents the next vendor RFC end-to-end; I sign as approver, not author |
| Acceptable first-time failure | RFC misses 1 weighting criterion; we catch in peer review |
| **Date target** | **2026-07-15** (next vendor decision is the AI eval infra in Q3) |

### 4. On-call rotation scheduling

| Field | Value |
|---|---|
| Currently does | Khanh (15 min/week — usually shuffling for vacations) |
| Will be done by | **Priya Shah (L4)** — wants the org-mgmt experience |
| Why I'm holding it | Habit; not actually that strategic |
| Coaching plan | Wk 1: Priya updates the PagerDuty schedule, I review · Wk 2: Priya owns; I'm only consulted for cross-team conflicts · Wk 3: Priya solo |
| Success criteria | Schedule maintained; conflicts surfaced to me only when they cross teams |
| Acceptable first-time failure | 1 missed shift swap (caught by PagerDuty alert); no missed pages |
| **Date target** | **2026-05-13** |

### 5. Quarterly growth-plan reviews for L3 ICs

| Field | Value |
|---|---|
| Currently does | Khanh (writes both Diego's and Ava's growth plans solo) |
| Will be done by | **Maya (for Diego) + Sam (for Ava)** as primary mentors |
| Why I'm holding it | Important — growth plans are the contract; bad plans damage careers |
| Coaching plan | Q3 plan: Maya/Sam draft, I review heavily and revise with them · Q4: they draft, I light-touch review · Q1 2027: they own; I sign as manager |
| Success criteria | Diego/Ava growth plans signed off with Maya/Sam as primary mentor (manager still signs as manager) |
| Acceptable first-time failure | 1 growth plan needs significant manager revision; we catch in 1:1 |
| **Date target** | **2026-09-30** (start of Q4 = next plan cycle) |

---

## Reflection

### Which item scared you most to delegate? Why?

**#2 — Incident IC role.** Cart is the most user-visible surface; my mistakes are visible to the VP within hours. The honest fear is that if Maya or Sam handles an incident sub-optimally on their first try, my judgement (for picking them) is what gets questioned, not theirs. Once I noticed that framing, I realised I was holding the work for *my* protection, not the team's growth — which is one of my anti-principles. So it goes.

### What's the cost to your team if you DON'T delegate it in the next 90 days?

- **#1 (flake triage):** Sam stays in "shadow lead" mode for another quarter → quietly resentful; doesn't get the L5 evidence
- **#2 (incident IC):** Team learns the manager always shows up → 6 months from now no one volunteers, and I'm doing 3am pages indefinitely
- **#3 (vendor RFCs):** I become the bottleneck for AI eval infra rollout in Q3 → Tom's L5 case loses a key piece of evidence
- **#4 (on-call scheduling):** Priya stalls on org-mgmt experience she's asked for; I keep doing 15 min/week of clerical work
- **#5 (L3 growth plans):** Maya and Sam never get the experience of writing one before they're managers themselves; we replicate the gap I had

### Which of your anti-principles justifies the transfer?

> *"We do not exit ICs without 90 days of documented feedback — withholding feedback to be liked is career sabotage, not kindness."*

The same logic applies to *positive* development opportunities, not just feedback: withholding stretch work to keep the team comfortable (or to keep myself feeling needed) is symmetric career sabotage. Delegation is the positive form of feedback.

---

> Source: [Track P · Module 1](../../../track-p-people-and-management/p01-from-engineer-to-manager.md)
