# Module 03 — Test Types & Levels

> Phase 0 · Effort: 3h · Prerequisites: Module 02

## Learning objectives

After this module you can:

- Place a test on the **Test Pyramid** and justify the level you chose.
- Distinguish **functional** vs **non-functional** tests with examples.
- Pick the right **test type** (smoke, sanity, regression, exploratory, …) for a given moment in the release cycle.
- Recognize anti-patterns: ice-cream cone, hourglass, all-E2E.

## Why it matters

Misclassifying tests is how teams end up with 2-hour CI pipelines. Knowing the *level* a test belongs at — and pushing it down the pyramid — is the single biggest performance lever in QA.

## Concepts

### The Test Pyramid

```
              /\
             /E2E\          slow, brittle, high confidence  (5–15%)
            /------\
           /Integr. \       medium speed                    (20–30%)
          /----------\
         /   Unit     \     fast, focused                   (60–70%)
        /--------------\
```

| Level | Target | Speed | Tools (typical) |
|---|---|---|---|
| **Unit** | One function/class | ms | Jest, Vitest |
| **Integration** | Module + its real dependencies | seconds | Supertest, Pact |
| **Component** | One UI component in isolation | seconds | Storybook, React Testing Library |
| **E2E (system)** | Full stack through real browser | seconds–minutes | Playwright, Cypress |
| **Acceptance** | Business value, user perspective | minutes | Cucumber + Playwright |

This repo is **mostly E2E + API integration** because it exercises a third-party demo SUT. In your own product you should aim for the pyramid shape.

### Functional vs non-functional

| Functional (does it work?) | Non-functional (does it work *well*?) |
|---|---|
| Login succeeds with valid creds | Login responds in <500 ms p95 |
| Cart total = sum of items | Login still works at 1000 RPS |
| Email validation rejects bad input | Login form is keyboard-navigable |

### Test types by purpose

- **Smoke** — minimal "is the build deployable?" check (1–5 min). Tag: `@smoke` in this repo.
- **Sanity** — quick post-fix check on the affected area.
- **Regression** — full pre-release suite. Tag: `@regression`.
- **Exploratory** — unscripted investigation, often paired with charters and timeboxes.
- **Acceptance / UAT** — sign-off by business stakeholders.
- **Confirmation** — re-run failed tests after the fix.
- **Performance** — load, stress, soak, spike.
- **Security** — auth, authorization, injection, secrets, CWE Top 25.
- **Accessibility (a11y)** — WCAG 2.1 AA, axe-core, keyboard, screen-reader.
- **Visual** — pixel/structure regression.
- **Contract** — Pact / OpenAPI; producer & consumer agree on the schema.
- **Compatibility** — browsers, viewports, OS.
- **Localization (l10n) / Internationalization (i18n)** — translations, RTL, currencies, dates.

### Anti-patterns

- **Ice-cream cone** — too many E2E, too few unit. Slow CI, brittle tests.
- **Hourglass** — lots of unit, lots of E2E, no integration. False confidence about contracts.
- **Test ID stuffing** — every element has `data-testid="…"` because role/label locators were never tried.
- **Big-bang regression** — only run tests "before release". Bugs accumulate; debugging costs explode.

## Hands-on lab

1. Categorize **every test file** under `tests/` by level + type. Produce a table:
   ```
   File                                    | Level | Type
   tests/ui/test-login.spec.ts             | E2E   | smoke + regression
   tests/api/test-cart.spec.ts             | API integration | regression
   tests/api/test-security.spec.ts         | API integration | security
   …
   ```
2. Find one E2E test you could **push down** to API or component level. Write the case for it (1 paragraph).
3. Run `npm run test -- --grep '@smoke'`. Time it. Now run the full suite. Compare. Discuss the implications for `pre-push` vs nightly runs.

## Self-check

- [ ] Why does the pyramid have a wide unit base?
- [ ] Give a real example of a non-functional test for `/checkout`.
- [ ] You inherit a 4-hour test suite. What's the first metric you measure?
- [ ] When would you use exploratory testing instead of automated regression?

## Further reading

- Mike Cohn — "The Test Pyramid"
- Martin Fowler — *Practical Test Pyramid*
- Elisabeth Hendrickson — *Explore It!*

---

**Prev:** [02 — SDLC & STLC](./02-sdlc-stlc-and-where-qa-fits.md) · **Next:** [04 — Test design techniques](./04-test-design-techniques.md)
