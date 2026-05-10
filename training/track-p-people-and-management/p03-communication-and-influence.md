# Track P · Module 3 — Communication & Influence Without Authority

> Track P · Effort: 5h · Prerequisites: Track P · Module 2

> A QA manager has almost no formal authority over the dev teams whose code they test, the PMs who set scope, or the execs who decide ship dates. **Influence is the entire job.** This module teaches you how to write, talk, and negotiate so that people who don't report to you act on what you say.

## Learning objectives

After this module you can:

- Translate the **same incident** into 3 audience-appropriate documents (engineer / executive / customer) without losing fidelity.
- Write **bottom-line-up-front (BLUF)** documents that respect a busy reader's time.
- Say **"no"** in three forms (yes-and-cut / no-because / not-now-but) without burning the relationship.
- De-escalate a **dev↔QA conflict** ("not a bug, it's a feature") using a 4-step pattern.
- Build **trust capital** before you spend it on hard asks.

## Why it matters

> *"Quality engineers spend 30 % of their week running tests and 70 % convincing other people to act on the results."*

The gap between a great test result and a fixed bug is almost always **persuasion**, not engineering. A QA who finds the bug but can't get the dev to prioritise it, the PM to descope the release, or the exec to back the call — has produced *no* improvement to the product. That's the unfair truth: the quality of your communication is the upper bound on the quality of your impact.

This module is the one most QA managers wish they'd taken five years earlier.

## Concepts

### The audience spectrum

Every quality message lives somewhere on this spectrum:

```
ENGINEER  ←─────  TECH LEAD  ←─────  PM  ←─────  DIRECTOR  ←─────  VP / EXEC  ←─────  CUSTOMER
how                what                why          impact            risk             trust
```

Moving rightward, three things happen:

1. **Detail compresses.** Engineer reads stack traces; exec reads "1 critical risk".
2. **Vocabulary shifts.** "Race condition in the cart fixture" → "intermittent checkout failure under load".
3. **The ask changes.** Engineer asks "fix the bug"; exec asks "ship today or hold?".

A common failure: writing a great engineer-grade defect narrative and pasting it into a Slack DM to the VP. The VP can't act on it, doesn't reply, and you conclude "leadership doesn't care about quality". Leadership cares; you handed them a hammer when they asked for a verdict.

> 🆕 **New manager:** when in doubt about who you're writing for, **ask one human** before you write. "Hey VP, what level of detail do you want on outages — bullet TL;DR or full timeline?"
>
> 🧰 **Experienced manager:** the most common regression is reverting to engineer-mode under stress. Outages are *exactly* when audience-tuning matters most.

### BLUF — Bottom Line Up Front

The single highest-ROI writing discipline:

```
SUMMARY (1-2 sentences, the verdict)
ASK (what you need from the reader, with a deadline)
EVIDENCE (the supporting detail, structured for skim)
```

**Bad opening:**

> *"On Tuesday afternoon, while running the regression suite against the staging environment, I noticed that the cart-add tests were failing intermittently. Upon further investigation it appears that …"*

**Good opening:**

> *"Verdict: **NO-GO** for tomorrow's release. We need a hotfix to `cart.service.ts` (PR #1234) merged by 5pm today, or to descope the cart-promotions feature.*
> *Ask: confirm by 2pm whether eng can merge in time; if not, I'll publish the descope plan to #releases. Evidence below."*

The exec reads two sentences and acts. The engineer who needs the detail scrolls down. Both are served.

### Defect narrative for the audience that will actually fix it

The repo's [`defect-report` skill](../../.agents/skills/defect-report/SKILL.md) gives you the engineer-audience template. Track P extends it upward:

| Audience | What you keep | What you cut | What you add |
|---|---|---|---|
| **Engineer** (default `defect-report`) | Steps, logs, stack, suspect commit | Business impact framing | Pointer to spec / fixture |
| **PM** | Steps, what blocks ship | Stack traces, file paths | User-facing impact + workaround visibility |
| **Director / VP** | Verdict (block/no-block), risk class, owner, ETA | Steps, logs, file paths entirely | Cost of fix vs cost of ship |
| **Customer** | What was broken, what's fixed, what to do | Internal teams, blame, root cause specifics | Apology + concrete remediation |

> 🧰 **Experienced manager:** when you write a customer-facing note, run it past Comms/PR. The legal-vs-trust tradeoffs are real and they have practice.

### Writing the release brief for an executive

The exec audience needs **a verdict + the 3 things that would change it**. Anything else is decoration.

```markdown
# Release Brief — v2.4 — 2026-05-10

## Verdict: CONDITIONAL GO ✅⚠️
Ship with the cart-promotions feature **flag OFF** in prod.
Re-evaluate Tuesday after the hotfix lands.

## What would change this verdict
- 🚨 If the cart-promotions hotfix isn't merged by Mon 5pm → NO-GO
- 🟡 If P2 pass-rate drops below 92 % in the next CI run → CONDITIONAL → NO-GO
- 🟢 If hotfix lands AND smoke passes on prod-mirror → unconditional GO

## Risks I'm asking you to accept
1. Cart-promotions feature is delayed by 1 week (revenue impact: ~$X estimated by PM)
2. Slight risk of regressions in the checkout flow if the hotfix has unintended scope; mitigation = canary + 4-hr soak

## Risks I'm NOT asking you to accept
- Open critical defects in checkout: 0 (down from 2 last week)
- P1 pass-rate: 100 %

## Owners
- Hotfix: @<dev-lead>, ETA Mon 5pm
- Canary monitor: @<sre-on-call>
- Customer comms (if needed): @<pm-name>

— <your name>, Quality
```

> 🆕 **New manager:** never write *"this is fine"* without a counterfactual. Every verdict should answer *"what would make this not-fine?"*. Execs trust people who name the conditions of their own being wrong.

### Saying no — three forms

| Form | When to use | Example |
|---|---|---|
| **"Yes, and what we'd cut"** | When the ask is reasonable but capacity-constrained | *"Yes, we can add a11y testing to the v3.0 release — and to make room, we'd defer the visual-regression suite to v3.1. Are you OK with that tradeoff?"* |
| **"No, because [risk + cost]"** | When the ask is genuinely wrong | *"No, we won't ship without the cart hotfix. The risk is a 15 % checkout failure under load; the cost of a delay is one day. The cost of being wrong is a customer-trust event we'd recover from for months."* |
| **"Not now, but [trigger]"** | When the ask is right but timing is wrong | *"Not this quarter — we're committed to the AI-eval rollout. Add it to next quarter's planning; we should re-evaluate when the eval gate hits its 95 % SLO."* |

**The unforgivable failure:** *"yes"* when you mean *"no"*. Saying yes you can't deliver burns trust faster than saying no you don't have to retract.

> 🆕 **New manager:** practise saying these three forms aloud. Most "no" instincts come out as defensive or apologetic on first attempt; the form makes them clean.
>
> 🧰 **Experienced manager:** track your "yes/no" ratio over a quarter. If you've said "yes" to >80 % of asks, you're either at a healthy team capacity or — more likely — burning out the team to preserve your own conflict avoidance.

### Conflict mediation — dev↔QA tension

The classic: QA files a bug, dev says *"that's not a bug, it's a feature / by design / the user's fault"*. The instinct is to escalate. Don't. Use the 4-step pattern:

```
1. RESTATE  — "Let me make sure I understand: you're saying the cart shows '$0.00'
              when the discount code expires, and that's intentional."
2. SOURCE   — "Where is that documented? Spec? PR description? Designer's note?"
3. IMPACT   — "OK — what does the user experience here? Walk me through their
              next 30 seconds."
4. ASK      — "Given that, can we either (a) change the behaviour, (b) update
              the spec so QA can match the rule, or (c) escalate to the PM?
              I'm fine with any of the three; I just need it written down."
```

Why this works:

- Step 1 prevents the dev from feeling attacked (you're agreeing to their frame first).
- Step 2 reveals whether the "by design" claim is real — most of the time the source doesn't exist.
- Step 3 forces empathy with the user; most "by design" defences die here.
- Step 4 offers a non-binary out, including escalation, *as your idea*. The dev keeps face.

> 🧰 **Experienced manager:** if a dev consistently invokes "by design" without sourcing, escalate to their tech lead — but in the form of *"we have a spec-discipline gap; here are 5 examples"*, not *"this engineer is being difficult"*.

### Influence without authority — building trust capital

Influence is a savings account. Every time someone takes your call without evidence, you're spending. Every time you produce evidence-backed verdicts, ship on your promises, and admit when you were wrong, you're depositing.

**Deposits:**

- Predicting an issue accurately, then naming the prediction publicly when it lands ("I flagged this in the v2.3 review")
- Volunteering to do the unglamorous work nobody else wants (the post-mortem write-up, the on-call rotation slot)
- Publicly correcting yourself when you were wrong, *before* anyone catches it
- Praising specific work in the engineer's own forum (not "QA loves your team!" — *"@alice's PR #2341 caught a race condition my own test missed"*)

**Withdrawals:**

- Asking for an exception to a process you wrote
- Escalating to the VP without first trying the dev/PM directly
- Crying wolf — calling a release "NO-GO" three times for things that turn out fine
- Claiming credit for an IC's catch

**Bankruptcy** is when nobody returns your slack messages within an hour. By the time you notice, you've been broke for weeks.

> 🆕 **New manager:** spend the first 90 days *only* depositing. Don't spend until you've built a balance. Most new managers blow their starting balance on a bad fight in week 3.

### Async writing — the threaded doc

Most QA orgs are distributed; most decisions are made in writing. The threaded-doc discipline:

```
Title: <decision needed>, by <date>

CONTEXT (what's the situation, 3-5 sentences)

OPTIONS (2-4, each with cost/benefit)
  Option A: …
  Option B: …
  Option C: …

RECOMMENDATION (which option, why, what concerns it)

ASK (what input you need from whom, by when)

—
DECISION (filled by the decider, with date + name)
```

This wins over Slack threads because:

- It can be referenced months later
- It forces option-thinking (Slack tends to debate Option A in isolation)
- Decisions are explicit and attributable

> 🧰 **Experienced manager:** when you find yourself in a Slack debate longer than 6 messages, *stop* and write the threaded doc. The thread continues; the doc becomes the artifact.

## Hands-on lab

> **Templates & worked example:**
> - Templates: [`defect-narrative-template.md`](../../templates/manager/defect-narrative-template.md) + [`release-brief-exec-template.md`](../../templates/manager/release-brief-exec-template.md) + [`incident-customer-note-template.md`](../../templates/manager/incident-customer-note-template.md)
> - Worked example (Phoenix QA team's cart-discount-expiry incident): [`defect-narrative-dev.md`](../sandbox/example/manager/defect-narrative-dev.md) + [`release-brief-exec.md`](../sandbox/example/manager/release-brief-exec.md) + [`incident-customer-note.md`](../sandbox/example/manager/incident-customer-note.md) — same incident, three audiences, three documents

Take **one real (or fabricated-but-plausible) production incident** — something concrete enough to write about. Examples: a cart-checkout failure under Black Friday load, a critical a11y violation discovered in the wild, an LLM feature returning hallucinated answers to support tickets.

Produce **three documents** under `training/sandbox/<your-name>/manager/`, each for a different audience covering the SAME incident:

### Artifact 1 — `defect-narrative-dev.md`

Audience: the dev who'll fix it. Use the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill template extended with:

- A "what to verify after the fix" section (the test cases that should now pass)
- A "what we'd improve in the test suite to catch this earlier" section

### Artifact 2 — `release-brief-exec.md`

Audience: the VP Eng. Use the BLUF + verdict template above. **One page max.** Include:

- Verdict + 3 things that would change it
- Risks you're asking the exec to accept (with $ if available)
- Owners with named names + ETAs

### Artifact 3 — `incident-customer-note.md`

Audience: affected customers. ~150 words. Include:

- What broke (no jargon)
- Window of impact
- What's fixed now
- What we're doing to prevent recurrence
- Where to get help if still affected
- Apology — sincere, brief, no defensiveness

### Reflection (in the PR description)

In one paragraph each, explain:

- What you **cut** from the engineer doc when writing for the exec
- What you **added** to the customer note that wasn't in either internal doc
- One **hard tradeoff** you made (e.g. "I called it CONDITIONAL GO instead of NO-GO because…") and how you'd defend it

PR title: `Track P · M3 — Three audiences for the <incident name> incident`.

## Self-check

- [ ] You can write a 1-page release brief in 30 minutes from the same data that took you 2 hours to write the engineer doc.
- [ ] You can recite the 3 forms of "no" and use one in a real conversation this week.
- [ ] You can identify when you're spending vs depositing trust capital, in real time.
- [ ] You have a written threaded-doc template you use for any decision needing >6 Slack messages.
- [ ] You can run the 4-step conflict mediation aloud without notes.

## Further reading

- *Crucial Conversations* — Patterson et al. (the conflict-mediation playbook)
- *Made to Stick* — Heath & Heath (audience-tuned communication)
- *Writing for Busy Readers* — Rogers & Lasky-Fink (BLUF discipline at scale)
- *Trust & Inspire* — Stephen M. R. Covey (the trust-capital model)
- [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — engineer-audience template
- [`.agents/skills/release-readiness/SKILL.md`](../../.agents/skills/release-readiness/SKILL.md) — generates the data your exec brief consumes

---

**Prev:** [Track P · M2 — Hiring & growing](./p02-hiring-leveling-growing-testers.md) · **Next:** [Track P · M4 — Running a QA program at scale](./p04-running-qa-program-at-scale.md) · **Up:** [Curriculum overview](../README.md)
