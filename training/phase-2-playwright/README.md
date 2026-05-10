# Phase 2 — Playwright Core

> Pure Playwright, no framework opinions yet. By the end you can write a passing spec from scratch using only the official API.

## Modules

10. [Playwright setup & config](./10-playwright-setup-and-config.md)
11. [Locators](./11-locators.md)
12. [Actions & auto-waiting](./12-actions-and-auto-waiting.md)
13. [Web-first assertions](./13-web-first-assertions.md)
14. [Fixtures & test isolation](./14-fixtures-and-test-isolation.md)
15. [Debugging & Trace Viewer](./15-debugging-and-trace-viewer.md)

## Phase outcomes

You can:

- Install Playwright and configure projects, browsers, retries, parallelism, reporters.
- Pick the right locator using the priority hierarchy: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByTestId` → text → CSS → XPath.
- Use auto-waiting and web-first assertions (no `waitForTimeout`).
- Write a custom fixture and explain why it's better than `beforeEach` + module-level state.
- Reproduce any failure offline using a `.zip` trace file in the Trace Viewer.

## Phase self-check

- [ ] In a fresh repo, build a 3-test login spec using only `@playwright/test` (no framework). Tests must be parallel-safe.
- [ ] Refactor one of those tests to use a custom fixture for "logged-in user".
- [ ] Force a flake (race condition) and use the Trace Viewer to identify the failing action — paste the trace screenshot in your PR description.

---

**Prev:** [Phase 1 — Engineering Toolkit](../phase-1-toolkit/README.md) · **Next:** [Phase 3 — Framework Architecture](../phase-3-framework/README.md)
