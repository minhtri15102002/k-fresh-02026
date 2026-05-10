# Module 01 — QA Mindset & Quality Attributes

> Phase 0 · Effort: 2h · Prerequisites: none

## Learning objectives

After this module you can:

- Define **QA**, **QC**, and **Testing** and explain how they differ.
- Name the eight ISO/IEC 25010 software quality characteristics and give a test angle for each.
- Articulate the "tester's mindset": skepticism, exploration, advocacy for the user.
- Decide what *not* to test, and explain why testing everything is impossible.

## Why it matters

Tools change. Frameworks change. The thing that survives every job switch is **how you think about quality**. A good QA engineer with a wrong mindset will still ship buggy software; a junior with the right mindset will catch the things automation never finds.

## Concepts

### QA vs QC vs Testing

| | Goal | When | Owner |
|---|---|---|---|
| **QA — Quality Assurance** | Prevent defects via process | Throughout SDLC | Whole team |
| **QC — Quality Control** | Detect defects in deliverables | Before release | QA team |
| **Testing** | Execute checks against expectations | Continuously | Anyone (devs, QA, AI) |

You will hear these conflated. Be precise: writing a Playwright test is **testing**; defining the policy that every PR must include one is **QA**.

### ISO/IEC 25010 quality model (memorize this)

1. **Functional suitability** — does it do what it claims?
2. **Performance efficiency** — fast enough? scalable?
3. **Compatibility** — works with the browsers/devices/APIs we promise?
4. **Usability** — can a real user accomplish the task?
5. **Reliability** — survives faults, recovers gracefully?
6. **Security** — protects data and identity?
7. **Maintainability** — can devs change it without regressions?
8. **Portability** — works on new environments, easy to install/upgrade?

Every test you write should map to at least one of these. If it doesn't, ask why you're writing it.

### The tester's mindset

- **Skepticism, not pessimism.** Assume the spec is incomplete; the dev forgot the empty state; the integration drifted.
- **The user's advocate.** Bugs are not the absence of features — they're failures of expectation. Whose expectation?
- **Curiosity over compliance.** "What happens if I…" beats "the spec says…" every time.
- **Risk-based prioritization.** You can never test everything; pick the slices where defects hurt the most.
- **Documenting intent, not just steps.** A failing test should explain *what mattered* and *why*, not just *what broke*.

### What not to test

- **Library code you don't own.** Don't test that `Date.now()` returns a number.
- **Trivial getters/setters.** Cover them via the higher-level test.
- **Flaky environments.** Quarantine infra issues; don't bake them into your suite.

## Hands-on lab

1. Read `README.md` and `documents/automation-framework/README.md`.
2. Open `tests/api/test-security.spec.ts` and, for **each** of the 5 tests, identify the ISO 25010 quality characteristic it covers.
3. Open `tests/ui/test-checkout.spec.ts` and find one assertion you'd argue is **not** a quality concern. Defend or refute.
4. Write a 1-page memo titled `What I think QA means at this team` and commit it under `training/sandbox/<your-name>/qa-mindset.md`.

## Self-check

- [ ] In one sentence each: QA, QC, Testing.
- [ ] Name 4 of the 8 ISO 25010 characteristics without looking.
- [ ] Give an example of a bug that automation will *never* catch.
- [ ] Pick the right answer: "We have 100% code coverage" → does that mean the product is bug-free? Why / why not?

## Further reading

- ISO/IEC 25010:2011 — software product quality model
- *Lessons Learned in Software Testing*, Kaner / Bach / Pettichord
- James Bach — Heuristic Test Strategy Model

---

**Next:** [02 — SDLC, STLC & where QA fits](./02-sdlc-stlc-and-where-qa-fits.md) · **Up:** [Phase 0 README](./README.md)
