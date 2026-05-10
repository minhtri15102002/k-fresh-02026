---
name: requirement-analysis
description: "Analyses a raw requirement (user story, PRD paragraph, Jira ticket, or feature brief) for testability before any test design starts: scores it against INVEST/SMART, runs an ambiguity/weasel-word scan, surfaces hidden assumptions and missing edge cases, drafts Given-When-Then acceptance criteria, and emits a verdict (READY-FOR-DESIGN / NEEDS-REFINEMENT / REJECT) with a refinement checklist. Use when the user asks to ‘analyse this story’, ‘shift-left this requirement’, ‘review this PRD for testability’, ‘is REQ-X ready for test design?’, ‘what acceptance criteria are missing?’, or before kicking off any of the downstream design skills so they don’t inherit garbage-in. Distinct from ask-questions-if-underspecified (which clarifies a coding request in one round) and from test-plan-author (which plans testing of an already-good requirement)."
optionalRefs:
  - documents/requirements.md                                           # optional input — used if present
  - reports/requirement-scorecards/                                     # output directory
  - reports/requirement-scorecards/REQ-XXX-YYYY-MM-DD.md                # output — per-requirement scorecard (templated path)
  - reports/requirement-scorecards/index.json                           # output — JSONL index consumed by the QA Metrics Dashboard
---

# Requirement Analysis

The requirement is the entry point of the QA lifecycle. Every downstream skill — test design, manual case generation, BDD authoring, traceability, automation — silently inherits whatever quality the requirement happened to have. If the requirement is vague, untestable, or contradictory, no amount of clever test technique downstream will fix it; you'll just produce confident tests for the wrong thing.

This skill is the upstream gate. It refuses to let a bad requirement into the design pipeline.

---

## When to use this skill

Trigger on:
- "Analyse this user story for testability"
- "Shift-left REQ-…"
- "Is this PRD ready for test design?"
- "What's missing from this acceptance criteria?"
- "Review this Jira ticket before I start writing cases"
- Before invoking any of: [`test-design-techniques`](../test-design-techniques/SKILL.md), [`generate-manual-testcase`](../generate-manual-testcase/SKILL.md), [`bdd-gherkin-author`](../bdd-gherkin-author/SKILL.md), [`requirements-traceability`](../requirements-traceability/SKILL.md)
- During three-amigos / refinement / sprint-planning when QA reviews stories

**Do NOT use this skill when:**
- The user's *coding request* (not a requirement) is vague → use [`ask-questions-if-underspecified`](../ask-questions-if-underspecified/SKILL.md).
- The requirement is already vetted and you need a strategy doc → use [`test-plan-author`](../test-plan-author/SKILL.md).
- You need cases derived with EP/BVA from a *good* requirement → use [`test-design-techniques`](../test-design-techniques/SKILL.md).
- You're risk-scoring a code change → use [`risk-analysis`](../risk-analysis/SKILL.md).

---

## How to use this skill

```
1. Locate the requirement source            (paste, file, or Jira ID)
2. Run the four-pass analysis               (INVEST → ambiguity → completeness → assumptions)
3. Draft acceptance criteria                (Given-When-Then, one per behaviour)
4. Emit the scorecard                       (machine-readable JSON + human Markdown)
5. Issue the verdict                        (READY / NEEDS-REFINEMENT / REJECT)
6. Hand off                                 (downstream skill OR refinement checklist back to PO)
```

The four passes are non-negotiable and ordered. Skipping the ambiguity pass and jumping straight to acceptance criteria is exactly how QA ends up writing 30 cases for a requirement that meant something different to the developer.

---

## Pass 1 — INVEST / SMART scoring

Score the requirement against the union of the two industry-standard frameworks. Each criterion is `pass` / `weak` / `fail` with a one-line justification.

| Framework | Criterion | Question to ask |
|---|---|---|
| INVEST | **I**ndependent | Can this be delivered without depending on another in-flight story? |
| INVEST | **N**egotiable | Is the *what* fixed but the *how* still up to the team? |
| INVEST | **V**aluable | Does it state the user value, not just the implementation? |
| INVEST | **E**stimable | Could the team estimate effort with the info given? |
| INVEST | **S**mall | Fits in one sprint? If not, split. |
| INVEST | **T**estable | Can a tester write a passing/failing test from this? **The hard gate.** |
| SMART | **S**pecific | One behaviour, one actor, one trigger? |
| SMART | **M**easurable | Are success conditions quantifiable? |
| SMART | **A**chievable | Within technical reality? |
| SMART | **R**elevant | Tied to a stated goal / OKR? |
| SMART | **T**ime-bound | Performance / deadline / freshness constraints stated? |

Full checklist with examples: [`resources/invest-checklist.md`](resources/invest-checklist.md).

**Hard gate:** if `Testable = fail`, the verdict is `REJECT` regardless of other scores. You cannot test what you cannot define.

---

## Pass 2 — Ambiguity / weasel-word scan

Catalogued anti-patterns that always indicate hidden ambiguity:

| Smell | Example | Why it's lethal |
|---|---|---|
| Vague adjectives | "fast", "user-friendly", "intuitive", "robust", "clean" | Different readers measure differently — guaranteed disagreement at sign-off |
| Modal weakness | "should", "may", "could", "ideally" | Unclear if mandatory; defects get triaged as "won't fix" |
| Unbounded plurals | "users", "items", "products" | Is it 1, 100, or 1M? Performance and edge cases hinge on this |
| Missing actor | "The system shall…" without role | Permissions / RBAC bugs hide here |
| Missing trigger | Behaviour described but no event | Tester invents the trigger; dev invents a different one |
| Missing pre-conditions | "User clicks Buy" — what state? | Cart empty? Logged in? Inventory available? |
| Missing post-conditions | "Submit form" — then what? | Confirmation? Email? DB write? Redirect? |
| Missing error paths | Happy path only | Half the test cases live here |
| Hidden non-functional | "Display the report" — within how long? | Perf, a11y, i18n, security all silently elided |
| Implementation leakage | "Use Redis to cache" | Locks design; should be negotiable |

Full pattern catalogue with regex helpers: [`resources/ambiguity-patterns.md`](resources/ambiguity-patterns.md).

Output: list of `{location, smell, evidence, suggested-rewording}` rows.

---

## Pass 3 — Completeness check

Walk the requirement against this checklist. Mark each row `covered` / `missing` / `n/a`:

```
□ Actor identified (role, permission level)
□ Trigger / entry condition stated
□ Pre-conditions (state, data, auth) listed
□ Happy-path behaviour described
□ Alternate paths enumerated
□ Error paths and their handling
□ Boundary conditions (empty, max, zero, negative, unicode, RTL)
□ Concurrency / race conditions called out
□ Performance constraint (latency, throughput, payload size)
□ Security constraint (auth, authz, input validation, audit log)
□ Accessibility (WCAG level, keyboard, screen-reader)
□ Internationalisation (locales, currencies, time-zones, date formats)
□ Observability hooks (metrics, logs, traces) defined
□ Rollback / feature-flag strategy
□ Data migration / backfill (if state changes)
□ Telemetry / analytics events (what, when, payload)
□ Acceptance criteria explicit (count expected)
```

Anything `missing` becomes a refinement question; multiple `missing` rows in the non-functional block usually push the verdict to `NEEDS-REFINEMENT`.

---

## Pass 4 — Hidden-assumption surfacing

The dangerous part: things the requirement quietly assumes are true. For each behaviour described, ask:

- **State assumptions** — what does the system state at story start? Empty cart? Existing user? Specific role?
- **Data assumptions** — what data must already exist? Seeded? Cached? Migrated?
- **Permission assumptions** — what role / scope / quota is implicitly granted?
- **Device / network assumptions** — desktop only? Online required? Offline-tolerant?
- **Time / calendar assumptions** — business hours? Time-zone? Year boundaries? Leap years?
- **Currency / locale assumptions** — single currency? Decimal handling? Negative amounts?
- **Concurrency assumptions** — single user? Multiple sessions? Optimistic / pessimistic locking?
- **Volume assumptions** — small dataset? Pagination already required at the lower bound?
- **Failure-mode assumptions** — what does this story assume *won't* fail? (Network, auth provider, downstream service…)

Output: list of `{assumption, risk-if-wrong, recommended-clarification}`.

---

## Acceptance-criteria draft

Produce one Given-When-Then per behaviour the requirement implies. Use the template at [`resources/ac-template.md`](resources/ac-template.md).

```
GIVEN  <pre-condition / state / actor>
WHEN   <trigger / action>
THEN   <observable outcome>
AND    <additional outcome / side-effect>
```

Cover at minimum:
- Each happy path (often 1–2)
- Each alternate path
- Each error path (auth failed, validation failed, downstream timeout, partial write)
- Each boundary (empty, single, max, max+1)
- Each non-functional that was stated (perf budget, a11y level, locale matrix)

If the requirement was too vague to draft ACs without inventing intent, **stop and emit `NEEDS-REFINEMENT`** with the specific questions whose answers are blocking AC drafting.

---

## Scorecard

Two outputs side-by-side:

1. **Human-readable Markdown** — `reports/requirement-scorecards/REQ-XXX-YYYY-MM-DD.md` using [`resources/scorecard.md`](resources/scorecard.md).
2. **Machine-readable JSON** — appended to `reports/requirement-scorecards/index.json` so the QA Metrics Dashboard can show requirement-quality trend.

Optional helper: `scripts/score-requirement.ts` ingests a Markdown requirement file and emits both. See `--help` for usage.

```bash
npm run analyse:requirement -- documents/requirements/REQ-PAY-01.md
```

Exit codes:
- `0` — `READY-FOR-DESIGN`
- `1` — `NEEDS-REFINEMENT` (CI should treat as soft-fail; surface to PO)
- `2` — `REJECT` or invocation error (CI must block downstream skills)

---

## Verdict matrix

| Score / signal | Verdict |
|---|---|
| `Testable = fail` (INVEST) | **REJECT** — non-negotiable |
| ≥ 3 ambiguity smells in critical positions (trigger, outcome, actor) | **REJECT** |
| Missing all error paths AND missing all non-functional rows | **NEEDS-REFINEMENT** |
| ≥ 2 INVEST/SMART criteria = `fail` | **NEEDS-REFINEMENT** |
| ≥ 5 hidden assumptions with high "risk-if-wrong" | **NEEDS-REFINEMENT** |
| All criteria `pass` or `weak`, all critical positions defined, ACs draftable | **READY-FOR-DESIGN** |

Bias the threshold toward `NEEDS-REFINEMENT` — refinement is cheap, building the wrong thing is expensive.

---

## Hand-off

| Verdict | Next step |
|---|---|
| `READY-FOR-DESIGN` | Hand the cleaned-up requirement + drafted ACs to [`test-design-techniques`](../test-design-techniques/SKILL.md). It picks EP/BVA/decision-tables. Then [`generate-manual-testcase`](../generate-manual-testcase/SKILL.md) emits the cases, and [`bdd-gherkin-author`](../bdd-gherkin-author/SKILL.md) emits the feature file. Finally [`requirements-traceability`](../requirements-traceability/SKILL.md) stitches REQ-ID ↔ TC-ID. |
| `NEEDS-REFINEMENT` | Send the refinement checklist back to PO / dev / domain expert. Track as a blocker until resolved. Re-run this skill once refined. |
| `REJECT` | Story does not enter the sprint. Document the reason in the scorecard. PO rewrites and resubmits. |

A green verdict from this skill is the only safe entry point to the test-design pipeline.

---

## Best practices

- **Run this BEFORE sprint planning, not after.** A `REJECT` mid-sprint costs days; before sprint, minutes.
- **Three-amigos at the table.** When possible run this skill *with* PO + dev + QA in the room. Disagreements during analysis are cheap; during demo they're features-that-shipped-wrong.
- **Quote the requirement verbatim** in the scorecard so the verdict is auditable months later.
- **Don't fix the requirement yourself.** Surface the gap; let the PO close it. Otherwise QA owns the requirement and the team loses the negotiation muscle.
- **Track scorecards over time.** Trend "% of stories REJECT'd or NEEDS-REFINEMENT" — it's a leading indicator of release-train health.
- **Tie to the dashboard.** Append every run to `reports/requirement-scorecards/index.json`; the QA Metrics Dashboard surfaces requirement quality alongside test execution and defects.

---

## Related skills

- Upstream alternative: [`ask-questions-if-underspecified`](../ask-questions-if-underspecified/SKILL.md) — when the *user request* (not a story) is vague.
- Open-ended ideation: [`brainstorming`](../brainstorming/SKILL.md) — when there isn't even a candidate requirement yet.
- Strategy doc: [`test-plan-author`](../test-plan-author/SKILL.md) — once requirements are vetted.
- Design techniques: [`test-design-techniques`](../test-design-techniques/SKILL.md) — what to do with a green verdict.
- Traceability: [`requirements-traceability`](../requirements-traceability/SKILL.md) — closes the loop later.
- Risk: [`risk-analysis`](../risk-analysis/SKILL.md) — different lens (change-risk, not requirement-quality).
- Validator: [`skill-validator`](../skill-validator/SKILL.md) — runs in CI to keep this skill honest.
