---
name: testing-qa
description: "Provides a comprehensive testing-and-QA workflow bundle covering unit, integration, E2E, browser automation, and quality gates for production-ready software. Use when the user asks ‘what should our overall testing strategy look like?’, ‘how do I wire up unit + integration + E2E + CI gates together?’, or wants an opinionated end-to-end QA blueprint rather than a single-layer recipe."
category: workflow-bundle
risk: safe
source: personal
date_added: "2026-02-27"
---

# Testing/QA Workflow Bundle

## Overview

Comprehensive testing and quality assurance workflow covering unit tests, integration tests, E2E tests, browser automation, and quality gates for production-ready software.

## When to Use This Workflow

Use this workflow when:
- Setting up testing infrastructure
- Writing unit and integration tests
- Implementing E2E tests
- Automating browser testing
- Establishing quality gates
- Performing code review

## Workflow Phases

### Phase 1: Test Strategy

#### Skills to Invoke
- `e2e-testing-patterns` - E2E strategy
- `test-driven-development` - TDD approach

#### Actions
1. Define testing pyramid
2. Identify critical paths
3. Set coverage targets
4. Plan test environments
5. Define quality gates

### Phase 2: Unit Testing

#### Skills to Invoke
- `javascript-testing-patterns` - JS testing
- `test-driven-development` - TDD

#### Actions
1. Write unit tests
2. Mock dependencies
3. Test edge cases
4. Measure coverage
5. Fix failing tests

### Phase 3: Integration Testing

#### Skills to Invoke
- `api-security-testing` - API testing
- `javascript-testing-patterns` - Integration patterns

#### Actions
1. Test API endpoints
2. Test database interactions
3. Test service integrations
4. Validate data flows
5. Test error handling

### Phase 4: E2E Testing

#### Skills to Invoke
- `playwright-skill` - Browser automation
- `e2e-testing-patterns` - E2E patterns
- `webapp-testing` - Web testing

#### Actions
1. Write E2E test scripts
2. Implement page objects
3. Add visual regression
4. Test critical user journeys
5. Validate cross-browser behavior

### Phase 5: Browser Automation

#### Skills to Invoke
- `playwright-skill` - Playwright
- `awt-e2e-testing` - AI-powered testing

#### Actions
1. Automate user flows
2. Test responsive design
3. Validate accessibility
4. Check performance metrics

### Phase 6: Performance Testing

#### Actions
1. Load testing with k6
2. Stress test critical endpoints
3. Profile memory and CPU
4. Benchmark response times

### Phase 7: Code Review

#### Actions
1. Review test coverage
2. Check test quality
3. Validate assertions
4. Ensure test isolation

### Phase 8: Quality Gates

#### Actions
1. Enforce coverage thresholds
2. Block failing builds
3. Report quality metrics
4. Archive test artifacts

## Testing Pyramid

```
         /\
        /E2E\          ← Few, slow, high confidence
       /------\
      /Integr. \       ← Medium, validates contracts
     /----------\
    /   Unit     \     ← Many, fast, isolated
   /--------------\
```

## Quality Gates

- [ ] Unit tests: > 80% coverage
- [ ] Integration tests: all API contracts validated
- [ ] E2E tests: all critical user journeys pass
- [ ] No test flakiness above 2%
- [ ] Performance: p95 < 500ms
- [ ] CI status: green before merge
