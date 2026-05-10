# Track P · Module 2 — Hiring, Leveling & Growing QA Testers

> Track P · Effort: 6h · Prerequisites: Track P · Module 1

> Hiring is the **most leveraged** thing a manager does. A great hire makes the team better for years; a bad hire costs roughly 1× their salary in lost output, ~6 months of your time, and (worst) the trust of every IC who watched you tolerate it.

## Learning objectives

After this module you can:

- Write a **QA-role JD** that filters for the right signal (and explicitly states red flags).
- Design a **4-stage interview loop** with a structured rubric and bias controls.
- Run a **hiring debrief** ("calibration") that aggregates evidence rather than averaging vibes.
- Place an IC on a **leveling ladder** and write a **growth plan** that maps level N → N+1 with concrete behaviours.
- Conduct **performance conversations** — including the hard ones (below-bar, PIP, exit) — without abandoning the IC's dignity.

## Why it matters

> *"Show me a great team and I'll show you a manager who refuses to hire below the bar."*

The single highest-leverage decision a QA manager makes is *who joins the team*. Everything downstream — code review quality, on-call calmness, the willingness to escalate honestly — flows from team composition. A team with one chronic underperformer doesn't perform at 5/6 strength; it performs at ~3/6, because the rest of the team adjusts to absorb the gap and resents the manager for not addressing it.

This module gives you the operational craft. The ethics are simple: be hard on the hiring bar, soft on the people you've hired, and ruthlessly honest about the difference.

## Concepts

### The hiring funnel — and where it actually leaks

```
Sourcing  ──→  Screen  ──→  Loop (3-5 rounds)  ──→  Debrief  ──→  Offer  ──→  Onboarding
   1000          200             40                    8             3          retain?
```

**Where it leaks (in order of severity):**

1. **Loop → Debrief** — most loops produce inconsistent signals because interviewers weren't aligned on the rubric. Fix: shared rubric, mandatory written feedback before debrief, debrief structure (below).
2. **Onboarding → Retain** — most early attrition is from poor onboarding, not the hire being wrong. Fix: 30/60/90 plan written *before* day 1.
3. **Sourcing → Screen** — a JD that lists "5+ years Selenium" filters out the future-ready people you actually want. Fix: JD discipline (below).

> 🆕 **New manager:** you'll be tempted to "trust your gut" in the loop because you can't yet calibrate to the team's bar. Don't. Use the rubric even when it feels mechanical. Calibration comes from *running 5+ loops with the rubric*, not from reading about it.

### JD discipline — the must-have / nice-to-have / red-flag structure

A QA JD should fit on one page and have exactly four sections:

```markdown
# Senior QA Automation Engineer — <team>

## What you'll do (3-5 bullets, each shippable)
- Lead the e2e suite for <product area>; own pass-rate, flake rate, and CI duration SLOs
- Design and review test architecture for new features (3-layer POM + assertion routing)
- Mentor 1-2 mid-level ICs through code review and pairing
- Partner with a PM and a tech lead on quarterly quality goals

## Must have (no more than 5 — every bullet is a hard filter)
- 3+ years writing production test code (Playwright, Cypress, or equivalent), TypeScript or strong JS
- Experience owning a CI pipeline (sharding, flake triage, artifact debugging)
- Examples of mentoring or teaching ICs (PRs, talks, internal docs)
- Comfort working in ambiguity (no spec? you write one)

## Nice to have (5-10, each gives bonus signal — not required)
- AI-assisted testing (Cursor, Copilot, MCP, prompt eval)
- a11y or visual-regression experience
- Production incident response (any role)
- Contributed to an OSS testing framework or plugin

## Red flags (be explicit — saves everyone time)
- "I prefer to work alone, no PRs, no reviews"
- "I don't code; I run test cases"  (this is a manual-QA hire, not what we're looking for)
- "Tests are flaky because devs don't follow standards" (lack of ownership)
- Any candidate who can't describe one bug they let escape and what they learned

## Comp band: $XXX,000 – $YYY,000 base · level: Senior (L5)
```

> 🧰 **Experienced manager:** publish the comp band. The arguments against ("we lose negotiating leverage") are dwarfed by the arguments for (filters out misaligned candidates, builds trust, complies with several jurisdictions). If your org forbids it, fight harder to change the policy.

### Designing the 4-stage interview loop

For a Senior QA / SDET role, the canonical loop:

| Stage | Who runs it | Length | What it tests | Pass signal |
|---|---|---|---|---|
| 1. Recruiter / hiring-mgr screen | You or recruiter | 30 min | Motivation, comp alignment, basic fit | "I want this kind of role; comp aligns" |
| 2. Technical craft | A senior IC | 60 min | Live coding a small Playwright test or fixing a flake; TS depth | Working solution + clear reasoning, not just speed |
| 3. System design / test strategy | You + senior IC | 60 min | "Design a test strategy for <feature>"; tradeoff thinking | Names risks, prioritises, asks questions |
| 4. Behavioural / values | You + cross-functional | 45 min | Conflict, mentoring, ownership; STAR responses | Specific stories, not platitudes |
| (Optional) Bar raiser | A senior IC outside the team | 60 min | Independent senior signal | Veto power |

**Rules of the loop:**

- **Every interviewer scores against the same 4 signals** (e.g. *Test craft / Debugging / Communication / Ownership*) on a 1–4 scale with concrete behaviours per level.
- **Written feedback before debrief, no exceptions.** Debrief reads the writeups, not vibes.
- **No interviewer talks to another about the candidate before submitting their writeup.** Anti-groupthink.
- **One veto = no offer.** The bar raiser exists for this.

### The interview rubric — concrete example

For the *"Test craft"* signal, the 1–4 scoring with behaviours:

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | Wrote `page.click('css=…')`; no assertions; couldn't explain why a test was flaky; defaulted to `waitForTimeout` |
| **2 — Approaching bar** | Used some role-based locators; wrote happy-path assertion only; recognised flake but couldn't fix it |
| **3 — At bar** | Used role/label locators throughout; web-first assertions with retry; identified and fixed a flake's root cause; structured POM-style |
| **4 — Above bar** | All of #3 + spotted a testability issue and proposed a code change; reasoned about parallelism / isolation; named tradeoffs in their own approach |

> 🆕 **New manager:** write the rubric *before* you run a loop, not during. The first time you'll feel silly. The third time you'll wonder how you ever hired without it.
>
> 🧰 **Experienced manager:** re-calibrate the rubric every 2 quarters. Your team's bar should rise. If a hire who was "3" 18 months ago is "2" today, the rubric needs to reflect that — otherwise you'll under-hire relative to the team's growth.

### The debrief — evidence over averages

A bad debrief: "I liked them" → "I had concerns" → "Average is 2.6, edge case, manager decides".
A good debrief:

```
1. Each interviewer reads ONLY their writeup aloud (no editorialising)
2. Hiring manager calls out conflicting signals: "Alice scored craft 4, Bob scored craft 2 — let's hear the evidence"
3. Resolve each conflict to ONE evidence-based score (not by averaging — by digging)
4. Final question: "Would you bet your next hire on this person being above the team's median in 6 months?"
   - Unanimous YES → offer
   - Any NO with evidence → no offer (do not litigate the no)
   - Any "maybe" → defer; collect more signal (work-trial, additional round)
```

**The single hardest debrief skill is overruling a senior IC's "yes" when you don't have evidence-based confidence yourself.** You will lose the relationship for a quarter. You will save the team for years. This is what the role pays for.

### Leveling — the QA ladder

Most engineering ladders ignore QA-specific signals. Here's a working QA-IC ladder you can adapt; pair it with the existing engineering ladder for cross-leveling.

| Level | Title | Scope of impact | Code | People |
|---|---|---|---|---|
| **L3** | QA Engineer / Junior SDET | One feature; ships small specs | Writes specs with review; uses framework | None |
| **L4** | QA Automation Engineer | Owns a feature area's e2e suite | Writes specs independently; small framework PRs | Mentors L3 informally |
| **L5** | Senior QA / Senior SDET | Owns multiple feature areas; influences framework | Architects POMs; leads framework changes | Mentors 1-2 ICs |
| **L6** | Staff QA / Quality Engineer | Cross-team; owns a quality property (perf, a11y, AI testing) | Leads platform-level changes | Mentors L5s; writes ladder rubrics |
| **L7** | Principal / Architect | Org-wide; defines testing strategy | Reviews architecture, doesn't write daily | Multiplier; sets bar for L6 promotions |

Manager parallel ladder: **M1** (line manager, 4–8 ICs) → **M2** (senior manager, 1–2 line managers + 8–15 ICs) → **Director** (Quality, 2+ teams) → **VP/Head** (org-wide).

> 🎯 **IC-considering:** there is no "manager > IC" hierarchy. L5 IC ≈ M1; L6 ≈ M2; L7 ≈ Director. The fork is *what kind of work*, not *more or less senior*.
>
> 🧰 **Experienced manager:** if you don't have a written ladder, your team will calibrate to whichever IC complains loudest. Write it; publish it; revise it quarterly.

### The growth plan — IC at L4 targeting L5

A growth plan is a **6-month contract** between manager and IC. Structure:

```markdown
# Growth Plan — <name>, L4 → L5 — <start date>

## Current level evidence (what makes them solidly L4)
- Owns @cart and @wishlist suites end-to-end; pass-rate >98 %
- Flake rate down from 4 % → 1.2 % in their area in the last 2 quarters
- Mentored a L3 onboarding (PR comments + 2 pairing sessions/week)

## Gaps to L5 (3-5 specific behaviours, not vague aspirations)
1. Has not led a framework-level change → expected behaviour: drive 1 framework PR with 2+ reviewers
2. Hasn't influenced outside immediate team → expected: present 1 brown-bag talk to 20+ people
3. Mentoring is reactive, not proactive → expected: own a L3's growth plan as primary mentor

## Success criteria (binary, evidence-based)
- [ ] Framework PR shipped + retro with senior ICs
- [ ] Brown-bag delivered + recording + 5+ written attendees-take-aways
- [ ] L3 mentee has visible growth (their own growth plan ships)

## Checkpoint cadence
- Monthly review in 1:1 (15 min, separate from regular topics)
- Mid-point retro at month 3
- Promotion case at month 6 — go/no-go

## Owner & sign-off
- IC: <signed, date>
- Manager: <signed, date>
```

> 🆕 **New manager:** never promise a promotion in a growth plan ("hit these and you'll be promoted"). Promotions need calibration across the org. Promise to *advocate* if criteria are met.
>
> 🧰 **Experienced manager:** the failure mode is *vague* growth plans ("be more strategic"). If a peer manager couldn't independently judge whether the IC met the criteria, the plan is too vague.

### Performance management — the hard end

Three escalating conversations, each with a written artifact. You should have your **anti-principles** (M1) at hand for each.

| Conversation | Trigger | Written artifact | Goal |
|---|---|---|---|
| **Below-bar feedback** | Pattern of work below level expectations for 4+ weeks | Feedback note in 1:1 doc | Clarity: this is below bar; here's what good looks like; here's the fix-by date |
| **Performance Improvement Plan (PIP)** | Below-bar persists 4+ more weeks despite feedback | Formal PIP doc with HR | 30/60-day plan with 3 specific deliverables + checkpoints; explicit failure consequence |
| **Exit conversation** | PIP failed | Exit doc; HR-led | Dignity-preserving offboarding; severance per policy; no surprises |

**Principles for the hard conversations:**

- **No surprises rule.** Nothing said in a PIP is the first time the IC heard it. If it is, the failure is yours, not theirs.
- **Specificity beats severity.** "Your test design lacks rigour" is useless. "Your last 3 specs missed boundary cases — see PRs #X, #Y, #Z; here's the test-design framework I expect" is actionable.
- **No tone of regret you don't actually feel.** ICs read this as condescension. Be honest about the gap and respectful of the human.
- **Document everything in writing, in the IC's folder, with a copy to HR.** Not for legal cover — for clarity. The IC should be able to re-read the conversation.

> 🧰 **Experienced manager:** if you have *never* exited an IC, you are likely tolerating below-bar work somewhere. The team knows. Fix it.

## Hands-on lab

> **Templates & worked example:**
> - Templates: [`jd-qa-engineer-template.md`](../../templates/manager/jd-qa-engineer-template.md) + [`interview-rubric-template.md`](../../templates/manager/interview-rubric-template.md) + [`growth-plan-template.md`](../../templates/manager/growth-plan-template.md)
> - Worked example (Phoenix QA team): [`jd-qa-engineer.md`](../sandbox/example/manager/jd-qa-engineer.md) + [`interview-rubric.md`](../sandbox/example/manager/interview-rubric.md) + [`growth-plan.md`](../sandbox/example/manager/growth-plan.md) (Maya Patel L4 → L5)

You will produce **three artifacts** under `training/sandbox/<your-name>/manager/`.

### Artifact 1 — `jd-qa-engineer.md`

Write a full JD for a real role you might hire (use the template above). Include all four sections: what you'll do / must-have / nice-to-have / red flags. Include the comp band even if it's a placeholder (`$XXX-YYY`).

### Artifact 2 — `interview-rubric.md`

For the role above, design the 4-stage loop with a 4-signal × 4-score rubric. Each cell must contain **observed behaviours**, not adjectives. Cite this codebase wherever possible (e.g. "uses role/label locators per Module 11" for craft scoring).

### Artifact 3 — `growth-plan.md`

Pick a real IC (or hypothetical with name + level + tenure). Write the 6-month L→L+1 growth plan using the template above. Include all sections: current evidence, gaps, success criteria, cadence, sign-off.

PR all three with title `Track P · M2 — Hiring kit + growth plan for <name>`. Trainer reviews like a real production PR.

## Self-check

- [ ] Your JD has exactly 4 sections and a comp band.
- [ ] Your rubric has 4 signals × 4 scores = 16 cells, each with concrete observable behaviours.
- [ ] Your growth plan has binary success criteria a peer manager could judge independently.
- [ ] You can describe the difference between *below-bar feedback* and a *PIP* without notes.
- [ ] You have decided your personal threshold for when "below-bar feedback" becomes a PIP (in weeks).

## Further reading

- *Who* — Geoff Smart & Randy Street (the canonical hiring book)
- *Radical Candor* — Kim Scott (especially Chapter 6 on feedback)
- *Engineering Management for the Rest of Us* — Sarah Drasner (chapters on hiring + perf mgmt)
- [`prompts/core/`](../../prompts/core/) — useful for craft-screen exercises
- [Module 35 — Future-ready skills](../phase-7-ai-era-leadership/35-future-ready-skills-and-upskilling.md) — informs the "must-have" axis of new JDs

---

**Prev:** [Track P · M1 — Engineer to manager](./p01-from-engineer-to-manager.md) · **Next:** [Track P · M3 — Communication & influence](./p03-communication-and-influence.md) · **Up:** [Curriculum overview](../README.md)
