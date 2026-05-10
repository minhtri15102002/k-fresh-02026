# Interview Rubric — Senior QA Automation Engineer (L5) — Phoenix QA — 2026-04-30

> Filled rubric for the role at [`jd-qa-engineer.md`](./jd-qa-engineer.md). Used by all interviewers; written feedback before debrief, no exceptions.

## Loop structure

| # | Stage | Who runs | Length | Tests signal(s) | Pass signal |
|---|---|---|---|---|---|
| 1 | Recruiter / hiring-mgr screen | Jamie Park / Khanh Do | 30 min | Motivation, comp alignment, basic fit | Wants this role for the right reasons; comp aligned within band |
| 2 | Technical craft (live coding) | Sam Kim (L5) | 60 min | Test craft + Debugging | Working solution + clear reasoning, not just speed |
| 3 | System design / test strategy | Khanh Do + Tom Liu (L5) | 60 min | Test craft + Communication | Names risks, prioritises, asks clarifying questions |
| 4 | Behavioural / values | Khanh Do + Carol (PM) | 45 min | Communication + Ownership | Specific stories with measurable outcomes, not platitudes |
| 5 | Bar raiser | Alice Chen (Director, Platform) | 60 min | All 4 signals (independent) | Independent senior signal; veto power |

## Signals (4 — aligned across all stages)

1. **Test craft** — locator discipline, assertion routing, framework patterns
2. **Debugging** — trace reading, hypothesis generation, isolation
3. **Communication** — explains tradeoffs, structures answers, listens to context
4. **Ownership** — drives to outcomes, names risks, follows through on the team

---

## Rubric

### Signal: Test craft

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | Wrote `page.click('css=…')`; no assertions; couldn't explain why a test was flaky; defaulted to `waitForTimeout(5000)` and shipped |
| **2 — Approaching bar** | Used some role-based locators; happy-path assertion only; recognised flake but pattern was "add retry" not "find root cause"; framework patterns inconsistent |
| **3 — At bar** | Used role/label locators throughout per [Module 11](../../../phase-2-playwright/11-locators.md); web-first assertions with retry; identified and fixed a flake's root cause; structured POM with locators / page / test split |
| **4 — Above bar** | All of #3 + spotted a testability issue and proposed a code-side change; reasoned about parallelism / isolation; named tradeoffs in their own approach (e.g. "I picked X over Y because of CI cost"); used `expect.poll` correctly |

### Signal: Debugging

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | Stack trace was treated as noise; first move was to add `console.log`; couldn't form a hypothesis without running the test 5 times |
| **2 — Approaching bar** | Read the trace; could narrow to a file but not a function; hypothesis generation worked but slowly |
| **3 — At bar** | Read the trace and the Playwright trace viewer; formed a hypothesis from evidence; isolated to minimal repro; named the class of bug (timing, isolation, fixture leak) |
| **4 — Above bar** | All of #3 + ran the trace viewer's network/console panes; cross-referenced with the framework's test history; proposed a structural fix that would prevent the *class* of bug, not just this one |

### Signal: Communication

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | Long monologues; didn't pause for questions; couldn't simplify when asked; jargon when explaining to PM in stage 4 |
| **2 — Approaching bar** | Structured answers using STAR or similar; one or two missed listen-checks; tradeoffs mentioned but not named explicitly |
| **3 — At bar** | Listened actively (paraphrased before answering); structured answers; named the tradeoff explicitly ("I chose X over Y because Z"); adjusted vocabulary for the PM |
| **4 — Above bar** | All of #3 + asked a question that re-shaped the design ("what if we test this at the API layer instead?"); re-explained an exec-audience version of a technical answer when prompted |

### Signal: Ownership

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | Stories were "we did X" with no clear personal contribution; blamed dev side or PM for failures; never named what they would have done differently |
| **2 — Approaching bar** | Personal contribution clear in stories; some attribution to others' failures but mostly own; growth/lessons named but generic |
| **3 — At bar** | Stories had specific outcomes (numbers, timelines); named what they personally drove; described one bug they let escape with what they learned (specific) |
| **4 — Above bar** | All of #3 + named a *systemic* improvement they made (not just one fix); described an unpopular call they made and how they handled the pushback; named a strength of an IC who replaced them |

---

## Debrief rules (non-negotiable)

1. Written feedback submitted before debrief — no exceptions; debrief is read-aloud only
2. No interviewer talks to another about the candidate before submitting their writeup
3. Debrief reads writeups; resolves conflicting signals by digging into evidence (not averaging)
4. Final question to the room: *"Would you bet your next hire on this person being above the team's median in 6 months?"*
   - Unanimous YES → offer
   - Any NO with evidence → no offer (do not litigate the no)
   - Any "maybe" → defer; collect more signal (work-trial, additional round)
5. **One veto = no offer.** Alice (bar raiser) exists for this.

---

> Filled per [`templates/manager/interview-rubric-template.md`](../../../../templates/manager/interview-rubric-template.md) · Source: [Track P · Module 2](../../../track-p-people-and-management/p02-hiring-leveling-growing-testers.md)
