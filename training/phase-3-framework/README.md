# Phase 3 — Framework Architecture (this repo)

> The opinionated layer. After this phase you can ship code that passes every gate this codebase enforces.

## Modules

16. [3-layer architecture](./16-three-layer-architecture.md)
17. [`commonPage` discipline](./17-commonpage-discipline.md)
18. [Assertion routing (`assertHelper` vs `Assertions`)](./18-assertion-routing.md)
19. [Models & test data](./19-models-and-test-data.md)
20. [Test tagging & multi-environment](./20-tagging-and-multi-environment.md)

## Phase outcomes

You can:

- Add a new feature page to `pages/ui/` that respects every rule in `prompts/core/pom-generator.md`.
- Pass the **DIRECT-LOCATOR ACTIONS — FORBIDDEN** review without a single comment.
- Pass the **ASSERTION ROUTING — FORBIDDEN** review and explain *why* `assertTextMatch(this.page.url(), …)` is racy.
- Tag a test correctly: one priority (`@P1/@P2/@P3`), one severity (`@critical/@major/@minor/@trivial`), suite, type, and feature tags.
- Run the same suite against `qa`, `uat`, and `staging` without code changes.

## Phase self-check

- [ ] Pick a feature not yet automated; produce a complete locator class + page object + spec following all rules.
- [ ] Refactor an old spec that violates `commonPage` discipline — list every direct-locator call you replaced.
- [ ] Read 3 random page methods in `pages/ui/` and identify which assertions belong to `assertHelper` vs `Assertions`.

---

**Prev:** [Phase 2 — Playwright Core](../phase-2-playwright/README.md) · **Next:** [Phase 4 — API & Cross-cutting](../phase-4-api-and-quality/README.md)
