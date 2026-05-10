# Track P — People, Career & Management

> A **crosscutting, opt-in track** that runs in parallel to Phases 7 (AI Quality Leadership) and 8 (AI Quality Architecture). Phases 7 & 8 take you up the **IC ladder** (Strategic IC → Architect / Head of AI Quality). Track P takes you down the **manager fork** — the people-leader path most QA orgs need but rarely teach.
>
> This track is **practice-driven through artifacts, not code**. Every module's lab produces a real, committable document (1:1 doc, interview rubric, quarterly plan, post-mortem template, org charter) that you'd actually use the Monday after.

---

## Who this track is for

You should consider Track P if **any** of these apply:

- You're a senior QA / SDET who's been asked (or is being asked) "would you manage the team?"
- You're 0–6 months into a QA Manager role and want to systematise instead of firefight.
- You're an experienced QA Manager / Director who wants to upgrade your operating rigour with explicit frameworks and templates.
- You're a Quality Architect (Phase 8) who works closely with people-leaders and wants the shared vocabulary.

You should **skip** Track P if:

- You're firmly on the IC track and have no intent to manage people. Phase 8 is the right tier-up for you. (Track P modules will not appear as prerequisites for any other phase.)

### Audience legend (used in every module)

Each Concepts section flags content with one of three audience markers so you can skip what doesn't apply:

> 🎯 **IC-considering** — *"Should I take the manager fork?"*
> Tone: "here's what changes" — preview of the role.
>
> 🆕 **New manager (0–6 months)** — *"It's Monday, what do I do?"*
> Tone: "this week's playbook" — the operational basics.
>
> 🧰 **Experienced manager** — *"How do I make this rigorous?"*
> Tone: "rigour upgrade" — frameworks, anti-patterns, calibration.

If a section has no marker, it applies to all three.

---

## Where Track P sits in the curriculum

```
After Phase 6 (capstone), pick your fork:

                        ┌─ Phase 7 ─→ Phase 8        IC track
                        │   Leader     Architect      "head of"
                        │
   Phase 6  ────────────┤
   capstone             │
                        └─ Phase 7 ─→  Track P        Manager track
                            Leader     People &        "VP / Director / Head"
                                       Management

   Best of both → Phase 7 + Phase 8 + Track P   (the rare T-shape; ~3 years)
```

| You want to be… | Take this path |
|---|---|
| Senior IC / SDET / Quality Engineer | Phase 0 → 6 (capstone is graduation) |
| Strategic IC / AI Quality Leader | + Phase 7 |
| Quality Architect / Head of AI Quality | + Phase 7 → 8 |
| **QA Manager / Director / VP Quality** | **+ Phase 7 → Track P** |
| Founder / fractional Head of Quality | + Phase 7 → 8 → Track P (the T-shape) |

---

## Modules

| # | Module | Effort | Lab artifact (committed under `training/sandbox/<your-name>/manager/`) |
|---|---|---|---|
| P1 | [From engineer to QA manager — the identity shift](./p01-from-engineer-to-manager.md) | 5h | `1on1-doc.md` + `delegation-log.md` |
| P2 | [Hiring, leveling & growing QA testers](./p02-hiring-leveling-growing-testers.md) | 6h | `jd-qa-engineer.md` + `interview-rubric.md` + `growth-plan.md` |
| P3 | [Communication & influence without authority](./p03-communication-and-influence.md) | 5h | `defect-narrative-dev.md` + `release-brief-exec.md` + `incident-customer-note.md` |
| P4 | [Running a QA program at scale](./p04-running-qa-program-at-scale.md) | 6h | `qa-quarterly-plan.md` + `vendor-decision-rfc.md` |
| P5 | [People-first incident & change leadership (capstone)](./p05-people-first-incident-and-change-leadership.md) | 5h | `post-mortem-template.md` + **`quality-org-charter.md`** (graduation artifact) |

**Total effort:** ~25–30 hours, opt-in, not added to any phase prerequisite.

---

## Track outcomes

You can:

- Hold a structured **1:1** that produces written follow-up actions, not vibes.
- Run a **hiring loop** (JD → screen → loop → calibration → offer) with a defensible rubric and bias controls.
- Write a **growth plan** that maps a tester from level N → level N+1 with specific behaviours and checkpoint cadence.
- Translate the **same incident** into 3 audience-appropriate documents (engineer / exec / customer) without losing fidelity.
- Build a **quarterly plan** with 3 OKRs, 1 SLO, and a stop-loss criterion — and defend the budget.
- Make a **build-vs-buy** decision with explicit criteria, scoring, and a recorded rationale.
- Facilitate a **blameless post-mortem** that produces owned action items.
- Author a **Quality Org Charter** that defines who you are as a leader and how your team operates — the artifact you bring to your first day in role.

## Track graduation criterion

You ship a **`quality-org-charter.md`** in P5 that:

- Names 3 leadership principles + 3 anti-principles (what you will *not* do)
- Defines the team operating model (cadence, ceremonies, decision rights)
- States the quality bar (the floor; what triggers a stop-the-line)
- Describes the on-call & incident response model
- Cross-references your P1–P4 artifacts (1:1 doc, hiring rubric, quarterly plan, vendor decision)
- Is reviewed by 1 peer manager (or simulated via [`multi-agent-brainstorming`](../../.agents/skills/multi-agent-brainstorming/SKILL.md))

If you can stand behind that document in a real Director-of-Quality interview, you've graduated.

---

## How Track P relates to the rest of the repo

| Repo asset | How Track P uses it |
|---|---|
| [`training/phase-7-ai-era-leadership/`](../phase-7-ai-era-leadership/README.md) | Strategic prerequisite. Track P assumes you can already articulate AI's impact on QA, ROI, and governance. |
| [`training/phase-6-ai-assisted-qa/33-capstone-and-career-paths.md`](../phase-6-ai-assisted-qa/33-capstone-and-career-paths.md) | Names Manager as one of the 4 career destinations and routes here. |
| [`templates/manager/`](../../templates/manager/README.md) | Starter skeletons for every Track P artifact (1:1 doc, hiring rubric, RFC, charter, …). Copy → fill → commit. |
| [`training/sandbox/example/manager/`](../sandbox/example/manager/README.md) | **Worked example** — the Phoenix QA team's full set of 12 filled artifacts. Use as a calibration target for what "good enough" looks like. |
| [`.agents/skills/quality-org-charter/`](../../.agents/skills/quality-org-charter/SKILL.md) | Auto-drafts the P5 graduation charter from a JSON inputs file. Saves ~4h vs hand-drafting. `npm run charter:draft -- inputs.json`. |
| [`.agents/skills/roi-brief/`](../../.agents/skills/roi-brief/SKILL.md) | P4 budget-defense lab uses the ROI brief as evidence. |
| [`.agents/skills/release-readiness/`](../../.agents/skills/release-readiness/SKILL.md) | P3 release-brief-for-exec lab consumes its output. |
| [`.agents/skills/defect-report/`](../../.agents/skills/defect-report/SKILL.md) | P3 defect-narrative-for-dev lab extends its template upward to the engineer audience. |
| [`.agents/skills/multi-agent-brainstorming/`](../../.agents/skills/multi-agent-brainstorming/SKILL.md) | P5 capstone uses it for charter peer-review when no human peer is available. |
| `training/sandbox/<your-name>/manager/` | All Track P artifacts land here; trainer reviews via PR like any other lab. |

---

## Module template (same as the rest of the curriculum)

```
# Track P · Module N — Title
> Track P · Effort: Yh · Prerequisites: …

## Learning objectives    ← what you can do after
## Why it matters          ← context, real-world relevance
## Concepts                ← the actual content (with 🎯/🆕/🧰 sidebars)
## Hands-on lab            ← produces an artifact under training/sandbox/<name>/manager/
## Self-check              ← knowledge questions
## Further reading         ← curated links
```

---

## A note on tone

Track P is the only place in this curriculum where you'll see explicit **anti-principles** ("things I will not do as a manager"), **bad-day playbooks**, and **honest tradeoffs about the cost of management** (the 30 % loss in personal output, the loneliness, the ratio of ambiguity to certainty). Every senior manager learned these lessons the hard way; this track tries to compress the learning curve.

If you finish and decide *"actually, the IC track was right for me"* — that's a successful Track P outcome too. The cost of the wrong fork is years; the cost of this track is ~30 hours.

---

**Prev:** [Phase 6 capstone](../phase-6-ai-assisted-qa/33-capstone-and-career-paths.md) (entry point) · **Sibling:** [Phase 7 — Leadership](../phase-7-ai-era-leadership/README.md) · [Phase 8 — Architecture](../phase-8-quality-architecture/README.md) · **Up:** [Curriculum overview](../README.md)
