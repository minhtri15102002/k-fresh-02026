# Phase 4 — API & Cross-cutting

> Beyond UI: testing the contract, the security boundary, the visual surface, and accessibility.

## Modules

21. [API testing with Playwright](./21-api-testing-with-playwright.md)
22. [Hybrid UI + API tests](./22-hybrid-ui-api-tests.md)
23. [API security testing](./23-api-security-testing.md)
24. [Visual & accessibility testing](./24-visual-and-accessibility-testing.md)

## Phase outcomes

You can:

- Write API tests using Playwright's `request` fixture, validate JSON schemas, and assert response codes/headers/bodies.
- Combine API setup (seed data, login) with UI assertions to keep tests fast and stable.
- Perform a basic security audit: cookie flags, session fixation, CSRF, IDOR, brute-force resistance.
- Detect visual regressions with screenshot baselines and accessibility violations with axe-core.

## Phase self-check

- [ ] Add an API test for the cart API that creates 3 items, asserts subtotal arithmetic, and cleans up.
- [ ] Convert an existing slow UI test (e.g. `test-checkout.spec.ts`) into a hybrid that seeds the user via API and only exercises checkout in UI.
- [ ] Reproduce one of the 5 tests in `tests/api/test-security.spec.ts` and explain which CWE it maps to.
- [ ] Add a visual snapshot test for the product detail page and review its first failure.

---

**Prev:** [Phase 3 — Framework Architecture](../phase-3-framework/README.md) · **Next:** [Phase 5 — Quality at Scale](../phase-5-scale/README.md)
