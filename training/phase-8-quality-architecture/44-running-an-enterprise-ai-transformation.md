# Module 44 — Running an Enterprise AI Transformation (Graduation)

> Phase 8 · Effort: 8h+ · Prerequisites: Modules 40–43 · Final module of the curriculum

> Contributes **§5 Adoption & Transformation** to your graduation RFC. **Owns the graduation gate.**

## Reference card

- **Module 38 covered single-team adoption + ROI.** Module 44 covers **multi-team transformation execution** — running the change across an org.
- **You are not "doing AI for the org."** You are *enabling teams to adopt the platform* (Modules 40–43), measured by adoption velocity + business impact.
- **Three artifacts close out Phase 8:** transformation playbook, change-network design, executive cockpit.
- **Graduation gate:** the integrated **Quality Platform RFC** (sections from Modules 40–44) + an **adoption commitment** from one real team (org-mandate mode) or peer-reviewed simulated adoption (solo mode).
- **You graduate** when the RFC is ratified and the first adoption review at 30 days shows green or has an honest red with a fix plan.

## Learning objectives

After this module you can:

- Design a **multi-team transformation backlog** sequenced by adoption-ladder stage (Module 38) and dependency.
- Stand up a **change network** — pilot teams, champions, office hours, brown-bags — that scales adoption without requiring you in every meeting.
- Build an **executive cockpit** that surfaces transformation health to leadership in one screen.
- Define **stop-loss criteria** and the discipline to actually stop when they trigger.
- Deliver and defend the **Phase 8 graduation RFC**.

## Why it matters

> *AI transformation is a journey, not an event. Build trust, capability & governance at every phase.*
> *— Leadership Insight, 2026 Guide*

The most common enterprise AI failure mode in 2026 isn't bad models — it's **stalled adoption**. Platforms get built, RFCs get ratified, leaders get briefed, and then... two teams adopt, the third gets distracted, the dashboard goes stale, the platform becomes "that thing in the wiki." Module 44 is about the operational discipline that turns ratified standards into shipped change.

## Concepts

### Module 38 vs Module 44 (delta)

| Dimension | Module 38 (single-team) | Module 44 (multi-team) |
|---|---|---|
| Scope | one workflow, one team | many workflows, many teams |
| Output | adoption roadmap + ROI brief | transformation backlog + change network + cockpit |
| Owner | the engineer adopting AI | the architect enabling adoption |
| Risk | one team's velocity | org's strategic narrative |
| Failure | one team falls behind | platform de-legitimised |

### The transformation backlog (a sprint board for adoption)

Treat adoption like a backlog. Each item:

```
Item: <Team X adopts Quality Platform component Y>
- Adoption-ladder stage entering: ASSIST | ANALYTICS | AUTOMATION | AUTONOMY
- Pilot or rollout?: pilot | rollout
- Pre-req items: <list>
- Pairing time required: <hours>
- Success metric: <what changes for that team>
- Review date: <30/60/90 day mark>
- Owner (architect side): <name>
- Owner (team side): <name>
- Stop-loss trigger: <when do we pull the cord?>
```

Sequence the backlog by **dependency** (some teams can't adopt component E without component A) and by **leverage** (which adoption unlocks the most subsequent adoptions).

### The change network (so you don't burn out)

```
                ┌──────────────────────────┐
                │  Architect (you)         │
                │  ratifies, mentors,      │
                │  resolves escalations    │
                └────┬─────────────────────┘
                     │
         ┌───────────┼───────────────────────────────┐
         │           │                               │
         ▼           ▼                               ▼
   ┌──────────┐ ┌──────────┐               ┌────────────────────┐
   │ Champion │ │ Champion │       ...     │ Office Hours       │
   │ (Team A) │ │ (Team B) │               │ - weekly, 30 min   │
   └──────────┘ └──────────┘               │ - drop-in Q&A      │
                                            │ - rotating note-   │
                                            │   taker            │
                                            └────────────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │  Monthly brown-bag     │
         │  - 1 case study        │
         │  - 1 platform demo     │
         │  - open mic            │
         └────────────────────────┘
```

**Champions** are *embedded* in their teams; they are the platform's local voice. You meet champions weekly. Office hours are open to anyone. Brown-bags celebrate adopters publicly. **You don't sit in every team's PR.**

### The executive cockpit (the only screen leadership opens)

Extend `templates/qa-metrics-dashboard.html` with one new top-level page: **Transformation Health**.

| Panel | What it shows | Update cadence |
|---|---|---|
| **Adoption ladder per team** | Which stage each team is at, per platform component | Weekly |
| **Adoption velocity** | New adoptions per quarter, trend | Monthly |
| **Platform SLOs** | Time-to-onboard, gate p95, false-positive rate | Continuous |
| **Business impact** | Cycle time, defect-escape, $/release, AI-eval pass-rate | Monthly |
| **Stop-loss tripwires** | Any tripwire close to firing | Real-time |
| **Open RFC items** | Ratified vs in-review vs blocked | Weekly |

If leadership opens this once a week and **doesn't ask follow-up questions**, the cockpit is succeeding.

### Stop-loss criteria (your most important governance contribution)

You commit, in advance, to *pausing* the transformation when ANY of the following is true:

- Adoption velocity is zero for two consecutive quarters.
- A pilot team has rolled back the platform AND the architect cannot produce a fix plan within 30 days.
- A compliance gate has fired and not been resolved within its SLA.
- The platform's false-positive rate exceeds 10% for two consecutive months.
- Champion turnover exceeds 50% in a quarter.
- The architect (you) is in > 6h of platform-meeting time per week (sustainable cap).

> Pausing is mature. Continuing past a tripwire is how multi-million-dollar transformations end up as cautionary case studies.

### Cadences that scale

| Cadence | Format | Purpose |
|---|---|---|
| Weekly 30 min | Champion sync | Unblock pilots; share fast lessons |
| Weekly 30 min | Office hours | Open Q&A; surface unknowns |
| Monthly 1h | Brown-bag | Celebrate adopters; demo new platform features |
| Monthly 1h | Adoption review with leadership | Cockpit walk-through; decide on tripwires |
| Quarterly 2h | RFC review | Ratify changes; supersede / extend |
| Quarterly 1d | Pilot retro | Honest post-mortems on each pilot |

If a cadence doesn't have a named owner, it dies. **Always name owners on the calendar invite.**

### Common transformation failure modes

| Failure | Symptom | Counter |
|---|---|---|
| **Architect bottleneck** | Every adoption needs you | Champion network + scaffolders + Skills |
| **Boil-the-ocean rollout** | Try to onboard 10 teams at once | Pilot 1, rollout in waves of 2–3 |
| **Pilot-to-rollout gap** | Pilot succeeds, rollout never starts | Define rollout criteria *during* the pilot, not after |
| **Vanity metrics on the cockpit** | "% PRs touched by AI" everywhere | Replace with cycle time, defect-escape, $/release |
| **Silent re-deciding** | Teams quietly fork the platform | Adoption metric on cockpit; quarterly "RFC vs reality" audit |
| **No exit story** | Architect leaves, transformation collapses | Bus-factor ≥ 2 from day one; champion can run office hours |

## Hands-on lab — and Phase 8 graduation

### Step 1 — Finalize the RFC (1.5h)

Stitch §1–§5 from Modules 40–44 into one cohesive document. Walk through the four-trait justification (§6) end-to-end. Make sure §0 (status) lists ≥ 2 reviewers.

### Step 2 — Build the transformation backlog (1.5h)

Use the item template above. Org-mandate mode: 8–15 real items. Solo prototype mode: 5–8 items where this repo's directories stand in for "teams" (e.g. `tests/ui/` adopts component X; `tests/api/` adopts component Y).

### Step 3 — Design the change network (1h)

Name champions (real or, in solo mode, simulated). Schedule the cadences. Document who owns each.

### Step 4 — Extend the cockpit (1.5h)

Add the **Transformation Health** page to `templates/qa-metrics-dashboard.html` (or, in solo mode, a sketch in `training/sandbox/<your-name>/phase-8/cockpit/transformation-health.md`). Each of the 6 panels gets a stub.

### Step 5 — Commit stop-loss criteria (30 min)

Pin them in the RFC §5. They must be **measurable** and have **owners** who will act on them.

### Step 6 — Submit for review (1h)

Open a PR titled `chore(training): <your-name> phase 8 graduation` adding your RFC + supporting artifacts under `training/sandbox/<your-name>/phase-8/graduation/`. Include:

- `rfc.md` (the integrated graduation RFC)
- `architecture-diagram.md` (Container-level)
- `traceability-matrix.md` (Module 43)
- `transformation-backlog.md` (this module)
- `cockpit-sketch.md` (this module)
- One **adoption commitment** — a signed statement (org-mandate mode) or a peer-reviewed simulation (solo mode) — naming the team adopting the platform first

### Step 7 — Defend (1h+)

A senior reviewer (your trainer, skip-level, or a Phase 7+ peer) runs a 60-minute review against the rubric below. Address every red. Re-submit if needed.

## Graduation rubric

| Dimension | 1 — Weak | 3 — Solid | 5 — Excellent |
|---|---|---|---|
| **Architect practice** (M40) | One ADR-AI | RFC well-structured | RFC reviewed by ≥ 2 outside reviewers; Decision Log linked |
| **Platform design** (M41) | Tools listed | 7-component architecture + contract | Pilot-ready scaffolders + named SLO owners |
| **Deep-dive testing** (M42) | One spec | 4 spec patterns | Specs runnable + tagged + dashboard-surfaced |
| **Compliance-as-Code** (M43) | One clause cited | Matrix v0.1 + 1 gate | Matrix walked through with counsel/peer; evidence retention defined |
| **Transformation execution** (M44) | Backlog listed | Backlog + cadences + cockpit | Champions named; tripwires committed; first adoption commitment in hand |
| **Repo grounding** | Generic content | Cites repo artifacts | Extends repo with new files (Skill, workflow, dashboard panel) |
| **Communication** | Wall of text | Clear sections | Reviewer walks the RFC end-to-end without questions |

**Pass = ≥ 3 in every dimension AND ≥ 4 in three dimensions.**

## Self-check

- [ ] Is your RFC §5 specific enough that a successor architect could continue without you?
- [ ] Is your stop-loss list actually painful to commit to? (If not, it's not real.)
- [ ] Does your cockpit answer leadership's likely question in 0 clicks?
- [ ] Do you have at least one named adopter and a 30-day review on the calendar?
- [ ] Could you teach Module 44 to another Phase 7 graduate next month?

## Further reading

- *Crossing the Chasm* — Geoffrey Moore (chasm = pilot-to-rollout gap)
- *Inspired* + *Empowered* — Marty Cagan (product-team operating model that fits platform teams)
- *The Lean Startup* — Eric Ries (hypothesis-driven adoption)
- *The Mythical Man-Month* — Brooks (still right about scale)
- DORA — *State of DevOps* annual report (transformation patterns at scale)
- This repo: `templates/qa-metrics-dashboard.html`, `.github/MILESTONES.md`, all Phase 8 modules

---

## Curriculum complete (for real, this time)

When your graduation PR merges:

1. Add a 1-page reflection at `training/sandbox/<your-name>/phase-8-reflection.md` covering:
   - The hardest module (and why)
   - The artifact you're proudest of
   - One thing you'd remove from Phases 7–8
   - One thing you'd add
2. Mentor at least one engineer from Phase 0 to Phase 4. Teaching is the L5 step (Module 35).
3. Open at least one PR back into `training/` improving any module — typo, new lab, better example, sharper diagram. **The curriculum gets better with every graduate.**
4. Pick your next vector: Quality Architect (deepen Phase 8), Platform Engineer (build the platform full-time), Director of Quality (scale Phase 7 across more orgs), or Founder (sell what you learned).

> *"The best leaders don't fear AI. They partner with it to build the future."* — and you just proved you can be that leader.

---

**Prev:** [43 — Compliance-as-Code](./43-compliance-as-code.md) · **Up:** [Phase 8 README](./README.md) · **Curriculum:** [Top](../README.md)

🎓 **Phase 8 graduation = curriculum graduation.** Welcome to the architect tier.
