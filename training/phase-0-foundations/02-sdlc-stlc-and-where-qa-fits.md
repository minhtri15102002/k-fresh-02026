# Module 02 — SDLC, STLC & Where QA Fits

> Phase 0 · Effort: 2h · Prerequisites: Module 01

## Learning objectives

After this module you can:

- Explain the standard **Software Development Lifecycle (SDLC)** phases and the QA touchpoint in each.
- Explain the **Software Testing Lifecycle (STLC)** and how it overlays SDLC.
- Compare **Waterfall**, **Agile**, and **DevOps** delivery models and the QA implications of each.
- Define **shift-left** and **shift-right** testing and decide when each applies.

## Why it matters

QA work that arrives at the end of a sprint has no leverage. The earlier QA enters the cycle, the cheaper bugs are to fix — orders of magnitude cheaper. Knowing the cycle is how you justify being in design reviews, not just regression suites.

## Concepts

### SDLC phases (any flavor)

```
Requirements → Design → Implementation → Testing → Deployment → Maintenance
```

QA touchpoints:

| Phase | What QA does |
|---|---|
| Requirements | Review for testability, ambiguity, missing acceptance criteria |
| Design | Risk analysis, test strategy, define acceptance tests |
| Implementation | Pair on TDD/BDD, write automation alongside features |
| Testing | Execute manual + automated suites, exploratory sessions |
| Deployment | Smoke + canary verification, release readiness gate |
| Maintenance | Production monitoring, regression triage, defect prevention loops |

### STLC (Software Testing Lifecycle)

```
Requirement Analysis → Test Planning → Test Case Design → Test Environment Setup
                                                       ↓
                                     Test Execution → Defect Reporting → Closure
```

STLC nests inside SDLC — every SDLC phase has an STLC slice.

### Delivery models compared

| Model | Cycle | QA pattern | Where this repo lives |
|---|---|---|---|
| **Waterfall** | Months | "Throw it over the wall" — heavy upfront test plans, late execution | Legacy enterprise |
| **Agile (Scrum/Kanban)** | 1–2 weeks | QA embedded in team, in-sprint automation, definition-of-done includes tests | Most product teams |
| **DevOps / Continuous Delivery** | Hours | Pipeline-driven, every commit is a release candidate, QA = enabling automation + observability | This repo |

### Shift-left vs shift-right

- **Shift-left** = testing earlier
  - Static analysis (`tsc`, ESLint, SonarQube) on every PR.
  - Unit/integration tests before UI tests.
  - Security & performance baselines in CI.
- **Shift-right** = testing in production
  - Feature flags, canaries, A/B tests.
  - Real-user monitoring (RUM), error tracking (Sentry).
  - Synthetic checks (a Playwright test running every 5 min in prod).

A mature QA program does **both**.

### Definition of Done — a QA artifact

A team's DoD is QA's lever. Typical entries:

- [ ] Acceptance criteria from ticket are tested
- [ ] Automated test added to suite
- [ ] No `P1`/`Critical` defect open
- [ ] CI green (typecheck, lint, tests, security scan)
- [ ] Documentation updated
- [ ] Telemetry / observability in place

## Hands-on lab

1. Read `.github/workflows/playwright.yml`. Map every step to an SDLC phase.
2. Find one quality gate enforced by CI that prevents a class of bug from ever reaching prod (hint: the `pre-push` hook).
3. Pick one feature in `tests/ui/`. Trace it backward: which acceptance criteria does it cover? File a `documents/manual-testcases/` entry if missing.
4. Write a paragraph proposing **one shift-left improvement** for this repo (e.g. "add Lighthouse to CI"). Open it as a discussion draft.

## Self-check

- [ ] Name the 6 SDLC phases.
- [ ] Give one shift-left and one shift-right example for the SUT in this repo.
- [ ] In Waterfall, when do test cases get written? In Agile?
- [ ] What's the cost of finding a bug in `Requirements` vs `Production`? (Order of magnitude is fine.)

## Further reading

- *Continuous Delivery*, Humble & Farley
- *Accelerate*, Forsgren / Humble / Kim — DORA metrics tie to QA outcomes
- DevOps Research and Assessment (DORA) — State of DevOps reports

---

**Prev:** [01 — QA mindset](./01-qa-mindset-and-quality-attributes.md) · **Next:** [03 — Test types & levels](./03-test-types-and-levels.md)
