# Track P · Module 1 — From Engineer to QA Manager: The Identity Shift

> Track P · Effort: 5h · Prerequisites: Phase 6 capstone (you've shipped real work as an IC)

> Track P opens here because *every* mistake new managers make traces back to one root cause: they kept being the IC they were on Friday. The whole point of the role is that Monday is different.

## Learning objectives

After this module you can:

- Name the **four identity shifts** that distinguish a manager from a senior IC, and recognise which one you're failing on a given day.
- Hold a **structured 1:1** that produces written outcomes, not just conversation.
- Run a **delegation log** that transfers your old IC work to the team without dropping balls.
- Articulate the **anti-principles** of the role — the things you commit *not* to do — and use them as a daily decision filter.

## Why it matters

The most common failure pattern in new QA managers isn't lack of skill — it's **role confusion**. They keep writing the tricky test themselves because it's faster than coaching the IC through it. Six months in, the team is dependent on them, the real management work hasn't happened, and they're exhausted. By month twelve they either burn out, get reassigned back to IC, or they finally make the shift — *but they paid the team's growth as the cost of their learning*.

The shift is not glamorous and not symmetric. You'll trade direct impact (you wrote that gnarly fixture) for indirect impact (your six reports each ship 1.2× more this quarter). The math is better; the dopamine is worse. This module is about engineering the dopamine system.

## Concepts

### The four identity shifts

| Shift | From | To |
|---|---|---|
| **1. Doer → Multiplier** | "I shipped this PR" | "My team's throughput is up 30 % because of how I unblock them" |
| **2. Output → Outcome** | "We ran 4 000 tests this sprint" | "Defect-escape rate fell from 4.1 → 2.7 per release" |
| **3. Certainty → Ambiguity** | "I know how to fix this flake" | "I don't know whether to hire a 6th IC or buy more CI minutes — but I have a framework to decide" |
| **4. Expertise → Leverage** | "I'm the best Playwright person here" | "I've made the team good enough that I no longer need to be the best Playwright person here" |

> 🎯 **IC-considering:** read the right column carefully. If it sounds like *loss* (no more solo flow, no more shipping the gnarly thing), the manager fork may not be for you — and that's a healthy signal, not a failure. The repo's [Phase 8 architect track](../phase-8-quality-architecture/README.md) keeps you in the deep work.
>
> 🆕 **New manager:** pick *one* shift to focus on per month. All four at once = paralysis. The most common starting fault is shift #1 (still doing your own ICs).
>
> 🧰 **Experienced manager:** audit yourself quarterly. Most regression happens on shift #2 — outcome metrics drift back toward output metrics ("we ran 5 000 tests!") because output is easier to count.

### The first 90 days — listen, learn, model

Industry-standard "Watkins 90-day plan" adapted for QA leadership:

| Days | Focus | Output (artifact you commit) |
|---|---|---|
| 0–30 | **Listen** — 1:1 with every report, every adjacent eng manager, every PM, the VP. Ask "what's broken? what's working? what would you do?" | A *Listening Tour Notes* doc |
| 31–60 | **Diagnose** — patterns from the 1:1s. What are the 3 biggest pains? What are the 3 strongest assets? Which conflicts are real vs symptomatic? | A *State of QA* memo |
| 61–90 | **Model + first move** — pick *one* high-leverage change you can ship in 30 days that proves you understood the diagnosis. Announce it; ship it. | One shipped initiative + a 90-day retro |

> 🆕 **New manager:** the most common 90-day mistake is **moving in week 2** because "I see what's wrong, let's fix it." You don't yet know which "wrong" is real and which is the loudest report's pet peeve. Listen first.
>
> 🧰 **Experienced manager:** when you change roles or take on a new sub-team, *re-do the 90 days*. Skipping it because you're senior is the fastest way to a culture-clash failure.

### Running a 1:1 that produces outcomes

A 1:1 is a meeting you owe **the IC**, not the other way around. The agenda is theirs; your job is to make it useful.

**Cadence:** weekly, 30 minutes, same day/time, ~95 % attendance, ~50 % of the time you cancel because the IC has nothing → cancel without guilt. The cadence is the contract.

**Structure (30 min):**

```
 0–10 min:  Their topics — they drive (career, projects, blockers, frustrations)
10–20 min:  Your topics — feedback, context they're missing, the org's view
20–30 min:  Action items + growth talk — written, owned, dated
```

**The 1:1 doc** lives in the IC's folder, both can edit, persists over time:

```markdown
# 1:1 — <IC name> ↔ <manager name>

## Standing topics
- Career goals (re-anchor every 6 months)
- Current OKR progress
- Blockers / asks of me

## YYYY-MM-DD
- IC topic 1: …
- IC topic 2: …
- Manager topic 1: …
- Action items: [ ] (IC) … by … · [ ] (Mgr) … by …
```

**Anti-patterns:**

| Anti-pattern | What's wrong | Fix |
|---|---|---|
| Status update | You should already know status from JIRA / standup. 1:1 is for *not-status*. | Ban status; ask "what's on your mind that doesn't fit standup?" |
| Manager monologue | You did 80 % of the talking | Re-read your last 4 1:1 docs; if your agenda > 50 %, fix |
| No written follow-up | "Great chat" → no memory next week | Action items written *during* the meeting, not after |
| Skipping when busy | Tells the IC their growth is the lowest priority | Cancel 1:1 *only* when IC has nothing — never when *you* are busy |
| Performance feedback ambushes here | 1:1 should be safe ground for the IC | Performance conversations are scheduled separately + previewed |

> 🧰 **Experienced manager:** consider a *skip-level 1:1* every 6 weeks with each report's report. Catches things your direct hides. Don't make decisions in the skip-level — only listen.

### Delegation — the 4-quadrant pattern

The first month, write down everything you do for a week. Then sort into 4 quadrants:

```
                  YOURS          THEIRS
            ┌─────────────┬─────────────┐
   IMPORTANT│     DO      │  DELEGATE   │
            │ (manager    │ (transfer   │
            │  craft)     │  to IC)     │
            ├─────────────┼─────────────┤
   URGENT   │ DO TODAY    │   COACH     │
   ONLY     │ (and ask    │ (so they    │
            │  why this   │  do it next │
            │  is yours)  │  time)      │
            └─────────────┴─────────────┘
```

**The hard quadrant is "Important + Theirs"** — the work you're holding onto because you're faster. Each item gets a transfer plan: who, by when, with what coaching, and what acceptable failure looks like the first 1–2 times.

**Transfer template:**

```
Item: <e.g. "Lead the weekly flake-triage review">
Currently does: <me>
Will be done by: <name>, by <date>
Why I'm holding it: <fast / important / scary>
Coaching plan:
  Week 1 — they shadow me
  Week 2 — they lead, I shadow
  Week 3 — they lead alone
Success criteria: review happens, decisions are made, written notes shared
Acceptable first-time failure: 1 missed flake, no rollback impact
```

> 🆕 **New manager:** delegate something *every week* in your first quarter. The IC is rarely as bad at it as you fear, and the alternative is you doing it forever.
>
> 🧰 **Experienced manager:** the failure here is hoarding *strategic* work — RFC writing, leadership briefings — because "ICs aren't ready". Often they are; you just haven't taught them. Coaching strategic work is the highest-leverage manager craft there is.

### The "player-coach" trap

Every QA manager faces a moment when a critical bug needs fixing, the team is stuck, and they could fix it themselves in two hours. Almost every one of them fixes it the first few times. **It's a trap.**

What you signal when you fix it:

- The fastest path to escalation is to wait for the manager to take over (your team learns this in three repetitions)
- The IC who was struggling doesn't get to learn the failure
- You don't have time for the manager work *that no one else can do* (1:1s, hiring, strategy)

**Better moves, in order:**

1. **Pair-debug** with the IC for 30 min — they drive, you ask questions
2. **Convene** the right people (call in the senior IC, the dev who owns the area) — your value is the convening, not the coding
3. **Set a deadline** — "if not solved by 3pm, we cut it from the release" — and enforce it
4. **Last resort, with announcement:** "I'm going to take this; this is a one-time thing; I'm doing it because X; I expect <IC> to be the lead on the next one of these"

> 🎯 **IC-considering:** if "I get to fix the gnarly thing myself" is the part of QA you most love, the manager track will starve that need. Be honest about it.

### Anti-principles

A manager's *anti-principles* are 3–5 things they explicitly will not do, no matter how strong the local-pressure case is. Examples:

- *"I will not write a test that should have been written by an IC, even if the deadline is tomorrow. I will descope or push the deadline."*
- *"I will not skip a 1:1 because I'm busy. The IC's growth is not subordinate to my calendar."*
- *"I will not make a hiring exception below the bar. Every off-bar hire makes the bar lower for the next one."*
- *"I will not let a senior IC operate without performance feedback. Withholding feedback to be liked is not kindness; it's career sabotage."*

Anti-principles are most useful **when you're tired**. They cut decisions you'd otherwise litigate badly at 6pm.

## Hands-on lab

> **Templates & worked example:**
> - Templates: [`templates/manager/1on1-template.md`](../../templates/manager/1on1-template.md) + [`templates/manager/delegation-log-template.md`](../../templates/manager/delegation-log-template.md)
> - Worked example (Phoenix QA team): [`1on1-doc.md`](../sandbox/example/manager/1on1-doc.md) + [`delegation-log.md`](../sandbox/example/manager/delegation-log.md)

You will produce **two artifacts** under `training/sandbox/<your-name>/manager/`:

### Artifact 1 — `1on1-doc.md`

Pick a *real* report (or a hypothetical one with a name + level + 6-month goals). Draft the 1:1 doc:

- Standing topics section (career goals, current OKRs, blockers-of-me, growth area)
- One filled-in past entry (date, IC topics, your topics, action items with owners + dates)
- One blank entry for next week
- A footer noting cadence + escalation path if you have to cancel

### Artifact 2 — `delegation-log.md`

List **5 things you currently do** (or did as an IC) that should belong to your team. For each:

| # | Item | Currently does | Will be done by | Coaching plan (3 weeks) | Acceptable first-time failure | Date target |
|---|---|---|---|---|---|---|

Then add a short reflection:

- Which item scared you most to delegate? Why?
- What's the cost to your team if you *don't* delegate it in the next 90 days?
- Which of your **anti-principles** justifies the transfer?

PR both files into your sandbox branch with title `Track P · M1 — 1:1 + delegation log for <name>`. Trainer reviews like any other lab.

## Self-check

- [ ] You can name the 4 identity shifts and identify which one you regress on most often.
- [ ] You can run a 30-minute 1:1 from a written agenda you didn't drive, and end with written action items.
- [ ] Your delegation log has at least one item that genuinely scares you to transfer.
- [ ] You have written down 3+ anti-principles and you can recite them without looking.
- [ ] You can articulate, in one sentence, what would tell you in 6 months that the manager fork was the wrong call.

## Further reading

- *The Manager's Path* — Camille Fournier (the engineering-manager bible; chapters on tech lead → manager are most relevant)
- *High Output Management* — Andy Grove (the original on managerial output = the output of your team)
- *The First 90 Days* — Michael Watkins
- [`training/track-p-people-and-management/README.md`](./README.md) — track decision tree
- [Module 34 — AI transformation of QA teams](../phase-7-ai-era-leadership/34-ai-transformation-of-qa-teams.md) — the strategic-IC ("AI Quality Leader") alternative; useful contrast

---

**Prev:** [Track P intro](./README.md) · **Next:** [Track P · M2 — Hiring, leveling & growing testers](./p02-hiring-leveling-growing-testers.md) · **Up:** [Curriculum overview](../README.md)
