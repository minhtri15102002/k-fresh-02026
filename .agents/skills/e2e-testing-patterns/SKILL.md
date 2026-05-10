---
name: e2e-testing-patterns
description: "Builds reliable, fast, and maintainable end-to-end test suites that ship confidence and catch regressions before users do. Use when the user asks ‘why are my E2E tests flaky?’, ‘how do I structure a Playwright/Cypress suite at scale?’, ‘what patterns reduce E2E maintenance?’, or wants principled guidance on POMs, fixtures, and test isolation."
risk: safe
source: community
date_added: "2026-02-27"
---

# E2E Testing Patterns

Build reliable, fast, and maintainable end-to-end test suites that provide confidence to ship code quickly and catch regressions before users do.

## Use this skill when

- Implementing end-to-end test automation
- Debugging flaky or unreliable tests
- Testing critical user workflows
- Setting up CI/CD test pipelines
- Testing across multiple browsers
- Validating accessibility requirements
- Testing responsive designs
- Establishing E2E testing standards

## Do not use this skill when

- You only need unit or integration tests
- The environment cannot support stable UI automation
- You cannot provision safe test accounts or data

## Instructions

1. Identify critical user journeys and success criteria.
2. Build stable selectors and test data strategies.
3. Implement tests with retries, tracing, and isolation.
4. Run in CI with parallelization and artifact capture.

## Safety

- Avoid running destructive tests against production.
- Use dedicated test data and scrub sensitive output.

## Key Patterns

### Page Object Model (POM)
- Encapsulate page interactions in reusable classes
- Keep selectors in one place for easy maintenance
- Return page objects from action methods for chaining

### Test Data Management
- Use factories to create consistent test data
- Clean up test data after each test
- Never depend on test execution order

### Stable Selectors
- Prefer `data-testid`, `role`, and `aria-label` over CSS classes
- Use `getByRole()`, `getByText()`, `getByLabel()` for accessibility
- Avoid brittle XPath selectors

### Retry & Resilience
- Enable automatic retries for flaky network-dependent tests
- Use `waitForSelector` / `waitForResponse` over hard sleeps
- Capture traces on failure for debugging

### Test Isolation
- Each test should set up its own state
- Use `beforeEach` to authenticate and navigate
- Avoid shared mutable state between tests

### CI/CD Best Practices
- Run tests in parallel across workers
- Capture screenshots and video on failure
- Publish HTML reports as CI artifacts
