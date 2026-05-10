# Track P · Module 5 — People-First Incident & Change Leadership (Capstone)

> Track P · Effort: 5h · Prerequisites: Track P · Modules 1–4
>
> **This is the Track P graduation module.** It produces the **Quality Org Charter** — the artifact you bring to your first day as a QA Director, or to your next interview for one.

## Learning objectives

After this module you can:

- Run an **incident war-room** as a quality leader — knowing the IC role, the comms role, and the scribe role and which one is yours.
- Facilitate a **blameless post-mortem** that produces owned action items, not just narrative.
- Design and lead a **change rollout** (e.g. introducing an AI eval gate) using a structured change-management framework.
- Build **psychological safety** in a way you can describe in concrete behaviours (not slogans).
- **Author your Quality Org Charter** — the operating doc that defines who you are as a leader and how your team functions.

## Why it matters

> *"Most of management craft is invisible until it isn't. Then it's the only thing that matters."*

The two moments when management craft becomes visible are:

1. **Incidents** — when something is on fire and the team is scared.
2. **Changes** — when something is being torn down or rebuilt and the team is uncertain.

If you handle these two well, your team will follow you into difficult quarters. If you handle either badly — once — you can lose trust you spent years building. This module gives you the operating frameworks for both, and then asks you to commit to a personal operating model in the form of the Quality Org Charter.

## Concepts

### Incident response — the people side

The technical playbook (runbooks, observability, on-call) is in [Phase 5](../phase-5-scale/29-flaky-test-triage.md) and [Phase 8](../phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md). Here we cover the **people side** — what a leader does when the room is panicking.

**The three war-room roles:**

| Role | Job | Common assignment |
|---|---|---|
| **Incident Commander (IC)** | Owns the response. Makes calls. Doesn't debug. | The most senior eng on call (often a TL) |
| **Comms Lead** | Updates stakeholders every 15-30 min. Owns customer/exec/internal channels. | A manager (often you) |
| **Scribe** | Captures the timeline as it happens — actions, decisions, observations | A junior IC (great learning role) |

**The cardinal rule:** the IC does not debug. If you find yourself in the IC role and the senior IC starts debugging, *you* take the IC role explicitly: *"I'm IC. Alice, you're on the cart bug. Bob, you're scribe. Carol, you handle comms — first update goes out in 10 min."*

> 🆕 **New manager:** the first time you're in the room during a real outage, you will want to debug. Don't. Take the comms role. It's the highest-leverage thing you can do, and it's the role most ICs will do badly under stress.
>
> 🧰 **Experienced manager:** if you find yourself acting as IC across multiple incidents, your team has a senior-IC depth problem. That's a hiring/growth gap to address, not a leadership compliment to accept.

### "What we observe vs what we conclude"

Under stress, humans collapse observations and conclusions:

- ❌ "Cart is broken because the deploy from this morning broke it."
- ✅ "We observe checkout failure rate at 18 % since 09:42. We deployed at 09:38. We have not yet confirmed causation."

Train your team — and yourself — to keep these separate in the war room. Conclusions made early get anchored on; the next 30 minutes are spent defending them instead of investigating. Use the language deliberately: *"What do we observe? What do we conclude? What's our confidence?"*

### Blameless post-mortem facilitation

The single most important property of a post-mortem is **psychological safety to be honest about what happened**. The moment one engineer is blamed by name in a write-up, every future post-mortem becomes a defensive document and the org learns nothing.

**The 4-phase structure:**

1. **Timeline build (30 min)** — strict factual reconstruction. *"At 09:38, deploy started. At 09:42, error rate began rising."* No analysis yet. Use the scribe's notes from the war room.
2. **5 Whys without finger-pointing (30 min)** — for each pivotal moment, ask "why did the system allow this?" not "who made this mistake?". Convert every "Alice didn't catch it" to "our process had no second-pair-of-eyes for cart deploys".
3. **Action items (20 min)** — each must have an owner (named), an ETA, and a failure mode (what if it slips). *No more than 5 action items per post-mortem* — more than that and none get done.
4. **What we'd do differently (10 min)** — meta-reflection on the response itself, not just the incident.

**A working post-mortem template:**

```markdown
# Post-mortem — <incident name> — <date>

## Severity
sev-<1-4> · Customer impact: <X users for Y minutes>

## Summary (3-5 sentences, written for someone who wasn't here)

## Timeline (UTC)
- 09:38 — Deploy A started
- 09:42 — Error rate at /checkout exceeded 5 %
- 09:45 — On-call paged
- ...

## What went well
- Detection from monitoring (3 min from incident → page)
- Comms cadence (5 updates in first hour)

## What went poorly
- Cart deploy lacked canary
- Runbook for "checkout error spike" was 8 months out of date

## Root cause analysis (5 Whys)
1. Why did checkout fail? → Cart service returned $0 totals
2. Why did cart return $0? → Discount-code-expired branch threw uncaught
3. Why did the branch throw? → Tests didn't cover expired-code paths
4. Why didn't tests cover that? → @P2 coverage was at 87 %, not 95 %
5. Why was @P2 below SLO? → No alert wired when error budget burns

## Action items
| # | Action | Owner | ETA | Failure mode |
|---|---|---|---|---|
| 1 | Wire SLO error-budget alert | @sre-on-call | 2026-05-17 | Slip → re-evaluate at next post-mortem |
| 2 | Add expired-code test coverage | @qa-cart-owner | 2026-05-15 | Slip → escalate to QA director |
| 3 | Refresh /checkout runbook | @ic-of-week | 2026-05-13 | Slip → next on-call must update before shift |

## What we'd do differently in the response
- Earlier customer comms (waited 22 min; should have been 10)
- Comms lead and IC were the same person — split next time

— Facilitated by: <name> · Attendees: …
```

> 🧰 **Experienced manager:** publish post-mortems internally. The norm "we fix it, no one talks about it" guarantees the same incident recurs in 6 months on a different team.

### Change management — Kotter for QA-led change

When you roll out a meaningful change (e.g. introducing an AI eval gate, deprecating a test framework, restructuring on-call), use a structured change-management framework. Kotter's 8 steps adapted for a QA-led change:

| Step | What you do | QA example: rolling out an AI eval gate |
|---|---|---|
| 1. Urgency | Make the case for change | "We've shipped 2 hallucination defects to prod this quarter; here's the cost" |
| 2. Coalition | Recruit allies | Get 1 dev TL + 1 PM + 1 SRE on board first |
| 3. Vision | Articulate the future state | "Every PR touching `prompts/` runs the eval gate; gate failures block merge" |
| 4. Communicate | Repeat the vision in every channel | All-hands talk + blog + 1:1s + design review mentions for 4 weeks |
| 5. Empower | Remove blockers | Self-service eval-runner setup; docs in `prompts/runner/README.md` |
| 6. Quick wins | Ship something visible in week 2 | First eval-gate-caught defect → highlight in the all-hands |
| 7. Sustain | Resist declaring victory too early | Don't move on until adoption is at 80 %+ for 2 consecutive months |
| 8. Anchor | Bake into culture / process | Eval gate becomes part of the PR template and the onboarding doc |

> 🆕 **New manager:** most change failures are at step 4. You'll explain it 3 times and feel exhausted; the team will have heard it once and unconsciously. Plan for **5–7× more communication** than feels natural.
>
> 🧰 **Experienced manager:** track adoption curves quarterly. A change at step 6 that hasn't progressed to step 7 in two quarters is *failing*; either re-launch or kill.

### Psychological safety — concrete behaviours, not slogans

"We have psychological safety" is a vibes statement. Behaviours you can observe:

| Stage | Behaviours present | Behaviours absent |
|---|---|---|
| **Stage 1 — Inclusion safety** | New hires speak up in week 2 | New hires silent for first 90 days |
| **Stage 2 — Learner safety** | ICs ask "dumb questions" in public | Questions only happen in DMs |
| **Stage 3 — Contributor safety** | Mid-level ICs propose architecture changes | Only seniors propose changes |
| **Stage 4 — Challenger safety** | An IC openly disagrees with you in a meeting *and is publicly thanked for it* | Disagreement happens in 1:1s only, or not at all |

Stage 4 is the goal. The tell that you've made it: when *you* propose something wrong, your reports correct you in front of others, and nothing bad happens.

**Behaviours that build it:**

- Naming your own mistakes publicly ("I shipped a bad post-mortem yesterday — here's what I'd do differently")
- Thanking people specifically for disagreeing well ("@bob's pushback on the eval-gate rollout was right — we'd have failed step 4 if we'd shipped my plan")
- Asking *"what would change your mind?"* and meaning it
- Never punishing the messenger — even informally — for bringing bad news

**Behaviours that destroy it:**

- Public criticism of an IC by name
- Sarcasm in code review
- Withdrawing trust after a single failure
- Allowing one IC to dominate while juniors stay silent

> 🎯 **IC-considering:** psychological safety is created by *consistent small actions over months*, not by one offsite. If that pace bores you, the manager track will frustrate you.
>
> 🧰 **Experienced manager:** measure stage-4 safety by whether your reports tell you bad news *first*, before you find out from others. If you find out from others, you're at stage 1–2 regardless of what your retros claim.

### The Quality Org Charter — your operating doc

The Quality Org Charter is **your written contract with your team and your peers** about how the org operates. It exists so:

- New hires understand the norms before they join
- Peers know your team's decision rights and escalation paths
- *You* are forced to be explicit about choices most managers leave implicit

It is a living doc. Versioned. Owned by you. Reviewed annually with the team.

**The 8-section charter:**

```markdown
# <Org/Team name> — Quality Org Charter — v1.0

## 1. Mission (one sentence)
"We make it impossible to ship a critical regression to <product> without a named human accepting the risk."

## 2. Operating principles (3-5)
1. Numbers over vibes — every release decision cites data
2. Blameless by default — incidents teach the system, not punish the human
3. ...

## 3. Anti-principles (3-5; what we will NOT do)
1. We do not ship without @P1 at 100 %
2. We do not exit ICs without 90 days of documented feedback
3. ...

## 4. Team operating model
- 1:1s: weekly, 30 min, IC drives, doc per [P1 template]
- Standup: async daily; sync 2×/week
- Retro: bi-weekly, rotating facilitator
- Planning: quarterly using [P4 template]
- On-call: 1-week shifts, 4-deep rotation, comp time

## 5. Decision rights
| Decision | Who decides | Who must be consulted | Who is informed |
|---|---|---|---|
| Hiring loop go/no-go | Hiring manager | Loop participants | VP |
| Release go/no-go | QA Director | Eng dir, PM | VP |
| Quality SLO target | QA Director | Eng leadership | All teams |
| Vendor purchases >$10k | QA Director + finance | Affected ICs | VP |

## 6. Quality bar (the floor)
- @P1 pass rate 100 % on every main commit (stop-the-line below)
- @P2 ≥ 95 %
- 0 open severity:critical defects at release time
- (cite [Module 28 dashboard SLOs])

## 7. Incident & change response
- War-room roles: IC / Comms / Scribe (per [P5 §war-room])
- Post-mortem within 5 business days, blameless template
- Change rollouts use the 8-step framework (per [P5 §change])

## 8. How we hire and grow
- JD + rubric per [P2 templates]
- 4-stage loop with bar raiser
- Growth plans every 6 months for every IC
- Performance management: feedback → PIP → exit, with no surprises (per [P2])

## 9. How we communicate
- Threaded docs for any decision needing >6 messages (per [P3])
- Release briefs to exec audience, not engineer audience (per [P3])
- 3 forms of "no" (yes-and-cut / no-because / not-now-but)

## 10. How I (the manager) operate
- Office hours: <day/time> for any IC, no agenda required
- Skip-level 1:1s every 6 weeks with each report's report
- Quarterly retro on my own performance, shared with the team
- Anti-principles I personally hold (3): see <link>

— Author: <name> · Reviewers: <peer mgr>, <VP> · Version: 1.0 · Next review: 12 months
```

> 🧰 **Experienced manager:** the charter is *not* a defensive doc to wave when challenged. It's a forcing function for being explicit. If you wrote it 18 months ago and never use it, your team probably doesn't know it exists; treat that as a leadership smell.

## Hands-on lab — capstone

> **Templates, worked example, AND auto-draft skill:**
> - Templates: [`post-mortem-template.md`](../../templates/manager/post-mortem-template.md) + [`quality-org-charter-template.md`](../../templates/manager/quality-org-charter-template.md)
> - Worked example (Phoenix QA team): [`post-mortem-template.md`](../sandbox/example/manager/post-mortem-template.md) (Phoenix's adapted post-mortem template) + [`quality-org-charter.md`](../sandbox/example/manager/quality-org-charter.md) (Phoenix's full v1.0 charter)
> - **Auto-draft skill:** [`.agents/skills/quality-org-charter`](../../.agents/skills/quality-org-charter/SKILL.md) — `npm run charter:draft -- inputs.json` emits a sign-off-ready charter from a JSON inputs file. Compresses charter authoring from ~5h to ~1h of editing. Validates that you actually have 3-5 anti-principles and ≥6 decision-rights rows; rejects placeholder text.

This module's lab is the **Track P graduation artifact**. Two pieces:

### Artifact 1 — `post-mortem-template.md`

Take the post-mortem template above, adapt it to your (or a hypothetical) org's specifics:

- Sev definitions
- Customer-impact taxonomy
- Action-item ownership routing
- Where it gets published

Commit under `training/sandbox/<your-name>/manager/post-mortem-template.md`.

### Artifact 2 — `quality-org-charter.md` (THE GRADUATION ARTIFACT)

Author the full 10-section Quality Org Charter for a real (or hypothetical) team you would lead:

- All 10 sections complete
- Cross-references your P1–P4 artifacts (1:1 doc, hiring rubric, growth plan, quarterly plan, vendor RFC)
- 3 leadership principles + 3 anti-principles, *yours* not generic
- Decision-rights table with at least 6 decision categories
- Quality bar with explicit, measurable thresholds
- Communication norms with specific cadences

**Then peer-review it.** Either:

- (Preferred) Have a real peer manager review it for 30 min
- Or simulate via [`multi-agent-brainstorming`](../../.agents/skills/multi-agent-brainstorming/SKILL.md) with these roles:
  - **Skeptic** — "where will this charter break under stress?"
  - **Constraint Guardian** — "where does this conflict with company policy / law?"
  - **User Advocate** — "where would an IC reading this feel patronised or controlled?"
- Address every critique in writing in the same PR

Commit the charter + the review log under `training/sandbox/<your-name>/manager/`.

PR title: `Track P · M5 — Capstone: Quality Org Charter v1.0 + post-mortem template`.

## Track P graduation criterion

You graduate Track P when:

- [ ] All 5 Track P labs are PR'd into your sandbox branch
- [ ] Your Quality Org Charter has been peer-reviewed (real or simulated) and the critique addressed in writing
- [ ] You can defend any section of the charter in 5 minutes without notes
- [ ] You have decided your **ladder fork** consciously: M1 (line manager) / M2 (senior manager) / D (Director) — and your charter reflects the scope of that fork

You're now interviewable for QA Manager / Senior Manager / Director / Head-of-Quality roles. Pair with your **Phase 7 Leadership** portfolio for the strategic narrative; if you also did Phase 8, you've completed the rare T-shape (people leadership × architecture craft) that VPs of Quality are built from.

## Self-check

- [ ] You can name the three war-room roles and explain why the IC doesn't debug.
- [ ] You can facilitate a blameless 5 Whys without sliding into blame in the third Why.
- [ ] You can describe a change rollout in Kotter's 8 steps using a real change you've planned.
- [ ] You can name 3 behaviours that destroy psychological safety in your own team.
- [ ] Your Quality Org Charter contains 3 anti-principles you actually believe and can defend.

## Further reading

- *The 4 Stages of Psychological Safety* — Timothy R. Clark
- *Leading Change* — John Kotter (the original 8-step framework)
- *The Field Guide to Understanding Human Error* — Sidney Dekker (the canonical on blameless analysis)
- *Resilience Engineering in Practice* — Hollnagel et al. (incident response craft)
- [`Module 29 — Flaky test triage`](../phase-5-scale/29-flaky-test-triage.md) — engineering side of incident response
- [`Module 44 — Running an enterprise AI transformation`](../phase-8-quality-architecture/44-running-an-enterprise-ai-transformation.md) — the architect-tier complement to this module
- [`.agents/skills/multi-agent-brainstorming/SKILL.md`](../../.agents/skills/multi-agent-brainstorming/SKILL.md) — for simulated peer review of your charter

---

**Prev:** [Track P · M4 — Running a QA program at scale](./p04-running-qa-program-at-scale.md) · **Up:** [Track P intro](./README.md) · [Curriculum overview](../README.md)

> **Track P complete.** If you also completed Phase 7, you have both the *strategic* and *operational* leadership halves. If you completed Phase 8 as well, you've built the rare T-shape: the technical depth of an architect plus the people leadership of a manager. That combination is what most "VP of Quality" job specs ask for and very few candidates can demonstrate.
