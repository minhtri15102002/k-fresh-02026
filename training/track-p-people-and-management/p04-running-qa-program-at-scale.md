# Track P · Module 4 — Running a QA Program at Scale

> Track P · Effort: 6h · Prerequisites: Track P · Module 3, [`Module 38 — AI adoption strategy & ROI`](../phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md)

> P1–P3 made you good at one team. This module is about running QA as a *program* — multi-quarter planning, OKRs/SLOs, vendor/budget defence, capacity. The artefacts here are what a Director of Quality presents to leadership every quarter.

## Learning objectives

After this module you can:

- Build a **quarterly plan** with 3 OKRs, 1 SLO, and 1 stop-loss criterion — and defend the math.
- Distinguish **OKRs from SLOs** and pick the right tool for each kind of goal.
- Make a **build-vs-buy** vendor decision using an explicit scoring framework + a recorded RFC.
- Defend a **headcount or tool budget** to a CFO using ROI evidence (paired with the [`roi-brief` skill](../../.agents/skills/roi-brief/SKILL.md)).
- Plan **capacity** across dev:QA ratios, on-call, and SDET injection without burning the team.

## Why it matters

> *"A Director who can't say no to a CFO has no team in two quarters; a Director who can't say yes to a CFO has no budget in three."*

The transition from line manager (M1) to senior manager / Director (M2/D) is largely a transition in **time horizon**. Your day-to-day shifts from "this week's blockers" to "this quarter's plan vs next quarter's plan vs the 18-month roadmap". The artifacts in this module are the ones that exist on a quarterly cadence; they're how leadership knows your team's existence is justified.

If P1–P3 make you a great team manager, P4 is what makes you a great *program manager* of quality.

## Concepts

### OKRs vs SLOs — pick the right tool

Both are quarterly commitments, but they serve different goals:

| Tool | Purpose | Cadence | Example (QA) |
|---|---|---|---|
| **OKR** (Objective + Key Results) | Drive **change** — move a metric, ship a capability | Quarterly | *Objective: Make AI-feature testing first-class. KR1: ship eval gate in CI. KR2: 5 AI specs in `tests/ai/`. KR3: defect-escape rate from AI features = 0.* |
| **SLO** (Service Level Objective) | Maintain a **steady-state** quality bar | Continuous; reviewed quarterly | *@P1 pass-rate ≥ 99 % on main, measured weekly, error budget = 4 hrs/quarter of < 99 %* |

**Common confusion:** treating SLOs as OKRs ("our OKR is to maintain 99 % pass-rate"). That's not change-driving — it's just keeping the lights on, and it crowds out actual investment.

**Heuristic:**

- If the metric is *new this quarter* → OKR.
- If the metric is *what we expect from the system at all times* → SLO.

> 🆕 **New manager:** start with **3 OKRs and 1 SLO** per quarter. More than 3 OKRs = nothing ships. Fewer than 1 SLO = no quality bar.
>
> 🧰 **Experienced manager:** add a **stop-loss criterion** to every OKR — the condition under which you abandon the OKR mid-quarter rather than redoubling effort. ("If by week 6 fewer than 2 KRs are on track, we cut KR3 and re-scope to 2.")

### The quarterly plan — structure

A quarterly plan is one page. Anything longer means you don't actually have a plan.

```markdown
# QA Quarterly Plan — Q3 2026 — <team / org>

## Theme (one sentence)
"Make AI-feature testing first-class without sacrificing core regression stability."

## Objectives & Key Results

### O1 — Ship the AI eval gate in CI
- KR1: Eval runner in `prompts/runner/` running on every PR (target: 100 % of PRs touching `prompts/`)
- KR2: 9-metric scoreboard exposed in `templates/qa-metrics-dashboard.html`
- KR3: First AI defect caught by the gate (binary: 1 caught defect = success)

### O2 — Reduce defect escape rate by 30 %
- KR1: Escape rate Q3 ≤ 1.4 (Q2 baseline 2.0)
- KR2: Top-3 escape categories identified + traceability matrix updated
- KR3: 1 framework change shipped that addresses the #1 category

### O3 — Hire 1 senior + 1 staff QA
- KR1: Senior offer accepted by week 8
- KR2: Staff offer extended by week 10
- KR3: Onboarding plan ready before each start date

## SLO (steady state)
- **@P1 pass rate on main: ≥ 99 %** (error budget: 4 hrs of <99 % per quarter)

## Stop-loss criteria (when we abandon and re-plan)
- O1 KR1 not in CI by end of week 4 → reduce O1 to KR1 only
- Hires (O3) slip more than 4 weeks → freeze O1 KR2; capacity reality

## Budget asks
- 2 incremental headcount (covered separately in `qa-headcount-case-q3.md`)
- $24k for AI eval infrastructure (covered in `vendor-decision-rfc.md`)

## Risks I'm naming explicitly
- O2 depends on dev-team commit (#qa-dev-jointbacklog) — owned by their TL
- Senior hire competition with the platform team's headcount

— Owner: <your name> · Reviewed by: <peer dir>, <VP> · Date: <YYYY-MM-DD>
```

### SLOs for QA — what to measure

Most QA orgs over-measure activity ("tests run") and under-measure outcomes. SLO candidates that drive the right behaviours:

| SLO | Definition | Error budget | Why it matters |
|---|---|---|---|
| **@P1 pass rate ≥ 99 %** | % of @P1 tests passing on main | 4 hrs/quarter <99 % | Catches blocker-class regressions immediately |
| **Defect-escape rate ≤ 1.5/release** | Bugs found post-release ÷ total bugs | 1 release/quarter > 1.5 | Direct link to user pain |
| **Mean time to triage ≤ 24h** | Time from CI red → defect-report or fix-merged | 5 % of cases > 24h | Keeps the queue from rotting |
| **Flake rate ≤ 1 %** | % of test runs failing then passing on retry | 2 weeks/quarter > 1 % | Trust in CI signal |
| **Test runtime ≤ 30 min wall-clock** | E2E suite duration on a 4-shard CI run | 1 week/quarter > 30m | Developer feedback loop |

> 🧰 **Experienced manager:** publish the SLOs *and* the error budgets in the dashboard ([`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html)). When error budget burns to zero, *you* are the one who has to call the line. Pre-committing the budget removes the in-the-moment courage tax.

### Build vs buy — vendor decision RFC

Every quarter you'll face a decision: do we build this in-house or buy a vendor (Percy for visual? Datadog for synthetics? Applitools for AI-vision?). The decision is rarely obvious; the *process* is what makes it defensible.

**The RFC structure:**

```markdown
# RFC — Visual Regression: Build (Playwright toHaveScreenshot) vs Buy (Percy / Applitools)

## Decision needed by
2026-06-01 (start of Q3)

## Options

### A — Build: Playwright toHaveScreenshot
- Pros: zero vendor cost, in-process, deterministic
- Cons: baseline management is manual, no AI-tolerant diffing, no cross-browser cloud

### B — Buy: Percy ($X/yr)
- Pros: PR-integrated UI, snapshot library, easy approvals
- Cons: vendor lock-in, $X/yr, data leaves the SDLC

### C — Buy: Applitools ($Y/yr)
- Pros: AI-tolerant diff (catches more, false-positives less), cross-browser cloud
- Cons: 2× B's price, more complex integration

## Scoring framework (criteria × weights, scored 1-5)

| Criterion | Weight | A | B | C |
|---|---|---|---|---|
| 1-yr cost | 20 % | 5 | 3 | 2 |
| Engineer time to ship | 15 % | 2 | 4 | 4 |
| Catches false negatives | 25 % | 3 | 4 | 5 |
| Avoids false positives | 20 % | 2 | 3 | 5 |
| Vendor lock-in risk | 10 % | 5 | 2 | 2 |
| Cross-browser coverage | 10 % | 2 | 4 | 5 |
| **Weighted total** | — | **3.05** | **3.45** | **3.95** |

## Recommendation
Buy Applitools (C). Higher cost is justified by:
1. False-positive rate matters disproportionately — every false positive burns dev trust
2. AI-tolerant diff catches a class of regressions (animation, font shift) that A/B miss
3. Cross-browser cloud removes 1 FTE-quarter of CI work

## What would change this recommendation
- If Applitools' false-positive rate is >2 % in pilot → revisit B
- If our visual surface area shrinks (e.g. design-system migration) → revisit A
- If vendor security review fails → revisit B

## Implementation plan
- Week 1-2: 30-day Applitools trial on @P1 visual specs
- Week 3: pilot review → go/no-go
- Week 4: full rollout, deprecate any existing screenshot tests in `tests/visual/`

— Owner: <name> · Reviewers: <senior IC>, <peer dir>, <VP> · Decision: <pending>
```

> 🆕 **New manager:** never make a build-vs-buy decision in a Slack thread. Even if the answer is obvious to you, write the RFC. The future you re-explaining the decision in 18 months will thank you.
>
> 🧰 **Experienced manager:** revisit every "buy" decision annually. Vendor TCO drifts (price hikes, feature gaps) — the original RFC is your evidence kit for re-evaluation.

### Defending a budget — the headcount case

Budgets get cut from teams that cannot connect spend to outcome. Pair every budget ask with an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) artifact.

**Headcount case structure:**

```
1. Outcome: what changes for the business if this hire lands
   — "@P1 pass-rate moves from 96 % → 99 % within 2 quarters"
   — "Mean time to triage drops from 36h → 12h"

2. Counter-factual: what fails if this hire doesn't land
   — "Q3 OKR O2 (escape rate -30 %) becomes infeasible"
   — "On-call burden on existing seniors crosses 2 incidents/week → attrition risk"

3. ROI: dollar / hour math (use roi-brief skill)
   — "Net savings of ~$110k/yr at $180k loaded cost = 0.6× payback in year 1"

4. Why now (vs next quarter)
   — "Hiring market for senior QA is favourable Q3; new feature shipping in Q4 needs coverage"

5. Anti-cases (what's NOT a reason)
   — "We're tired" (instead: capacity math)
   — "Other teams have more headcount" (instead: outcome math)
```

> 🧰 **Experienced manager:** write the headcount case *before* the budget cycle starts, not when leadership asks. The asks come at random; preparedness compounds.

### Capacity planning — dev:QA ratios

There is no universal correct ratio, but there are diagnostics:

| Symptom | Likely capacity gap |
|---|---|
| Devs writing their own e2e tests because QA is overloaded | Under-staffed; ratio probably > 6:1 |
| QA writing all the tests, devs never review them | Mis-shaped; SDET injection low |
| Flake rate trending up despite triage effort | Maintenance debt; need 1 dedicated FTE on framework |
| On-call rotation is < 4 people deep | Burnout risk in 1-2 quarters |
| Hiring loop is the manager's #1 time consumer | Need a recruiter partnership or the manager will starve other work |

**Working ratios (use as starting points, calibrate to your context):**

- **e-commerce / consumer web:** 1 QA per 5–8 devs; SDET injection 30–50 % of QA time
- **enterprise / regulated (fintech, health):** 1 QA per 3–5 devs; injection 50–70 %
- **infra / platform:** 1 QA per 8–12 devs; injection 70–90 % (ICs do their own coverage; QA is platform/CI)

> 🆕 **New manager:** before asking for headcount, *prove the capacity math*. "We have N tests, M new features/quarter, X hours/test, Y available hours per IC" — show the gap arithmetically.

## Hands-on lab

> **Templates & worked example:**
> - Templates: [`qa-quarterly-plan-template.md`](../../templates/manager/qa-quarterly-plan-template.md) + [`vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md)
> - Worked example (Phoenix QA team Q3 2026): [`qa-quarterly-plan.md`](../sandbox/example/manager/qa-quarterly-plan.md) + [`vendor-decision-rfc.md`](../sandbox/example/manager/vendor-decision-rfc.md) (visual regression: Build vs Percy vs Applitools)

You will produce **two artifacts** under `training/sandbox/<your-name>/manager/`.

### Artifact 1 — `qa-quarterly-plan.md`

Pick a real (or hypothetical) team. Build a one-page quarterly plan with:

- Theme (one sentence)
- 3 Objectives, each with 2–3 Key Results (KRs must be **measurable** and **time-bound**)
- 1 SLO with target + error budget
- 1+ stop-loss criteria per OKR
- Budget asks (with cross-reference to a future ROI brief or vendor RFC)
- Risks named explicitly with named owners

### Artifact 2 — `vendor-decision-rfc.md`

Pick a real build-vs-buy decision facing your (or a hypothetical) team. Examples:

- Playwright `toHaveScreenshot` vs Percy / Applitools
- In-house flake-quarantine vs Datadog Synthetic
- AI eval infra in-house vs Braintrust / LangSmith / Humanloop
- Internal traceability matrix vs TestRail / Xray / Zephyr

Use the RFC structure above with:

- 2–3 named options
- Scoring framework with **at least 5 criteria** with explicit weights (totaling 100 %)
- Weighted totals + named recommendation
- "What would change this" section with 2–3 concrete triggers

PR both with title `Track P · M4 — Quarterly plan + vendor RFC for <team>`.

## Self-check

- [ ] You can articulate the difference between an OKR and an SLO in one sentence each.
- [ ] Every KR in your plan is measurable, time-bound, and would survive an exec asking "how will I know it shipped?"
- [ ] Your vendor RFC's weights sum to 100 % and your weighted totals re-derive on a calculator.
- [ ] You have at least one budget ask that points to an ROI brief (per [`roi-brief` skill](../../.agents/skills/roi-brief/SKILL.md)).
- [ ] You can name your error budget for your top SLO and what you'd do when it burns to zero.

## Further reading

- *Measure What Matters* — John Doerr (the OKR canonical)
- *Site Reliability Engineering* (Google) — chapters 3–4 on SLO/SLI/SLA
- *High Output Management* — Andy Grove (chapters on operational reviews)
- [`Module 38 — AI adoption strategy & ROI`](../phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md) — strategic counterpart
- [`.agents/skills/roi-brief/SKILL.md`](../../.agents/skills/roi-brief/SKILL.md) — generates the dollars in your budget asks
- [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) — surface for SLO + error-budget panels
- [`Module 28 — QA Metrics dashboard`](../phase-5-scale/28-qa-metrics-dashboard.md) — what gets shown to leadership

---

**Prev:** [Track P · M3 — Communication & influence](./p03-communication-and-influence.md) · **Next:** [Track P · M5 — People-first incident & change leadership (capstone)](./p05-people-first-incident-and-change-leadership.md) · **Up:** [Curriculum overview](../README.md)
