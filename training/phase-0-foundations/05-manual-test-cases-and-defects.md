# Module 05 — Manual Test Cases & Defect Reporting

> Phase 0 · Effort: 3h · Prerequisites: Module 04

## Learning objectives

After this module you can:

- Author a manual test case in the format used in `documents/manual-testcases/` and `prompts/core/manual-test-case-generator.md`.
- Distinguish **Severity** (impact) from **Priority** (urgency) and assign both correctly.
- Write a defect report a developer can reproduce on the first try.
- Maintain **traceability** from requirement → test case → defect → fix.

## Why it matters

Manual test cases are the contract between QA and the rest of the team. They are also the seed for automation: every Playwright spec in `tests/` started life as a manual TC. A sloppy TC produces a sloppy automated test.

## Concepts

### Anatomy of a manual test case

This repo standardizes on the columns from `prompts/core/manual-test-case-generator.md`:

| Field | Purpose |
|---|---|
| `Test_ID` | Stable identifier (`TC-LOGIN-001`) |
| `Module` / `Feature` | Functional area |
| `Title` | One-line outcome (`User can log in with valid credentials`) |
| `Priority` | P1 / P2 / P3 — how soon it must run |
| `Severity` | Critical / Major / Minor / Trivial — impact if it fails |
| `Pre_Conditions` | What must be true before Step 1 |
| `Test_Data` | Inputs (separate from steps for reuse) |
| `Test_Steps` | Numbered, atomic, **observable** steps |
| `Expected_Result` | What the system must do, **not** what the tester does |
| `Post_Conditions` | Cleanup / state after the test |
| `Tags` | `@smoke @regression @auth` etc. (matches `prompts/core/test-tags.md`) |

### Writing rules

- **One outcome per test.** Don't combine "login + add to cart + checkout".
- **Atomic steps.** "Click `Login`" not "Login to the app".
- **Observable expected result.** "User is on `/account`" beats "Login succeeds".
- **No literal UI strings in steps.** Use placeholders like `<valid email>`; bind to `Messages.*` when automated.
- **Independent.** TC-A passing or failing must not change TC-B's outcome.
- **Idempotent.** Re-running the TC should be safe (test data created via factories, not seed accounts).

### Severity vs Priority — the most-confused pair in QA

| | Definition | Set by |
|---|---|---|
| **Severity** | Technical impact if defect fires | QA |
| **Priority** | Business urgency to fix | PM / EM |

| Example | Severity | Priority |
|---|---|---|
| Checkout crashes for all users | Critical | P1 |
| Logo misspelled on home page during product launch keynote | Trivial | P1 |
| Edge-case race in admin tool used by 2 internal users | Critical | P3 |
| Footer copyright shows "2023" | Trivial | P3 |

**They are independent dimensions.** Always assign both.

### Defect report — minimum viable

```
Title: <one-line, action-oriented> e.g. "Add to cart fails with 500 when product price has 4 decimals"
Severity: Critical | Major | Minor | Trivial
Priority: P1 | P2 | P3
Environment: qa | uat | staging · Browser/OS · Build/Commit
Pre-conditions: <state required>
Steps to reproduce:
  1. …
  2. …
Expected result: <what should happen>
Actual result: <what did happen, with evidence>
Evidence: screenshots, video, network HAR, console log, trace zip
Workaround: <if any>
Linked TC: <TC-ID>
Linked Requirement / Story: <JIRA/issue link>
Owner: <suspected component owner>
```

If you can't reproduce → it's not a defect, it's a **report**. Investigate first.

### Traceability matrix

```
Requirement → Test cases → Defects → Fix
REQ-AUTH-01    TC-LOGIN-001..010    BUG-101 (closed)    SHA abc123
REQ-AUTH-02    TC-LOGIN-011..015    —                    —
```

Done well, this answers "which features regress when we cut release X?" in 30 seconds.

In this repo, the **QA Metrics Dashboard** (Phase 5) automates traceability via test tags + GitHub Issue labels.

## Hands-on lab

1. Pick a feature in this repo not yet covered (suggestion: `pages/ui/wishlist-page.ts` if it's a stub). Write **5 manual test cases** in the format above. Place them under `documents/manual-testcases/<feature>.md`.
2. For each TC, assign Priority + Severity + Tags.
3. Pretend you found a defect during exploratory testing of the cart. Write a **complete defect report** with all required fields. File it as a real GitHub Issue with the correct labels (`bug`, `severity:*`, `module:*` — see `prompts/core/defect-labels.md`).
4. Build a 3-row traceability matrix (Requirement → TC → Defect) for your test cases.

## Self-check

- [ ] Severity vs Priority — give two examples where they diverge.
- [ ] Why does this repo's TC format put `Test_Data` in a separate field instead of inline in steps?
- [ ] You file a bug. The dev says "works on my machine." How do you respond?
- [ ] What's wrong with this expected result: "Login button is clicked"?

## Further reading

- *Lessons Learned in Software Testing*, Kaner / Bach / Pettichord
- IEEE 829 — Test Documentation Standard (don't memorize, but skim)
- This repo's `prompts/core/manual-test-case-generator.md` and `prompts/core/defect-labels.md`

---

**Prev:** [04 — Test design techniques](./04-test-design-techniques.md) · **Up:** [Phase 0 README](./README.md)

🎓 **Phase 0 complete.** Next: [Phase 1 — Engineering Toolkit](../phase-1-toolkit/README.md)
