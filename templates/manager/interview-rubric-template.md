# Interview Rubric — <role title> — <team> — <YYYY-MM-DD>

> Lab artifact for [Track P · M2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md) §"Designing the 4-stage interview loop" + §"The interview rubric".
> Rule: every cell contains **observed behaviours**, not adjectives.

## Loop structure

| # | Stage | Who runs | Length | Tests signal(s) | Pass signal |
|---|---|---|---|---|---|
| 1 | Recruiter / hiring-mgr screen | <name / role> | 30 min | Motivation, comp alignment, basic fit | "I want this kind of role; comp aligns" |
| 2 | Technical craft | <senior IC> | 60 min | Test craft + Debugging | <…> |
| 3 | System design / test strategy | <you + senior IC> | 60 min | Test craft + Communication | <…> |
| 4 | Behavioural / values | <you + cross-functional> | 45 min | Communication + Ownership | <…> |
| 5 | (Optional) Bar raiser | <senior IC outside team> | 60 min | All 4 signals (independent) | <…> |

## Signals (4 — keep aligned across all stages)

1. **Test craft** — locator discipline, assertion routing, framework patterns
2. **Debugging** — trace reading, hypothesis generation, isolation
3. **Communication** — explains tradeoffs, structures answers, listens to context
4. **Ownership** — drives to outcomes, names risks, follows through on the team

---

## Rubric

### Signal: Test craft

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | <e.g. "Wrote `page.click('css=…')`; no assertions; couldn't explain why a test was flaky; defaulted to `waitForTimeout`"> |
| **2 — Approaching bar** | <e.g. "Used some role-based locators; wrote happy-path assertion only; recognised flake but couldn't fix it"> |
| **3 — At bar** | <e.g. "Used role/label locators throughout; web-first assertions with retry; identified and fixed a flake's root cause; structured POM-style"> |
| **4 — Above bar** | <e.g. "All of #3 + spotted a testability issue and proposed a code change; reasoned about parallelism / isolation; named tradeoffs in their own approach"> |

### Signal: Debugging

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | <…> |
| **2 — Approaching bar** | <…> |
| **3 — At bar** | <…> |
| **4 — Above bar** | <…> |

### Signal: Communication

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | <…> |
| **2 — Approaching bar** | <…> |
| **3 — At bar** | <…> |
| **4 — Above bar** | <…> |

### Signal: Ownership

| Score | Behaviours we observed |
|---|---|
| **1 — Below bar** | <…> |
| **2 — Approaching bar** | <…> |
| **3 — At bar** | <…> |
| **4 — Above bar** | <…> |

---

## Debrief rules (non-negotiable)

1. Written feedback submitted **before** debrief — no exceptions
2. No interviewer talks to another about the candidate before submitting their writeup
3. Debrief reads writeups; resolves conflicting signals by digging into evidence (not averaging)
4. Final question to the room: *"Would you bet your next hire on this person being above the team's median in 6 months?"*
   - Unanimous YES → offer
   - Any NO with evidence → no offer (do not litigate the no)
   - Any "maybe" → defer; collect more signal
5. **One veto = no offer.** The bar raiser exists for this.

---

> Source: [Track P · Module 2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md) §"The interview rubric" + §"The debrief"
