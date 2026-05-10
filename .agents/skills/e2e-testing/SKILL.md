---
name: e2e-testing
description: "Runs an end-to-end testing workflow with Playwright covering browser automation, visual regression, cross-browser parity, and CI/CD integration. Use when the user asks to ‘set up E2E tests’, ‘add a Playwright suite’, ‘run tests across Chrome/Firefox/WebKit’, or needs an opinionated baseline before writing the first spec."
category: granular-workflow-bundle
risk: safe
source: personal
date_added: "2026-02-27"
---

# E2E Testing Workflow

## Overview

Specialized workflow for end-to-end testing using Playwright including browser automation, visual regression testing, cross-browser testing, and CI/CD integration.

## When to Use This Workflow

Use this workflow when:
- Setting up E2E testing
- Automating browser tests
- Implementing visual regression
- Testing across browsers
- Integrating tests with CI/CD

## Workflow Phases

### Phase 1: Test Setup

#### Skills to Invoke
- `playwright-skill` - Playwright setup
- `e2e-testing-patterns` - E2E patterns

#### Actions
1. Install Playwright
2. Configure test framework
3. Set up test directory
4. Configure browsers
5. Create base test setup

#### Copy-Paste Prompts
```
Use @playwright-skill to set up Playwright testing
```

### Phase 2: Test Design

#### Skills to Invoke
- `e2e-testing-patterns` - Test patterns
- `test-automator` - Test automation

#### Actions
1. Identify critical flows
2. Design test scenarios
3. Plan test data
4. Create page objects
5. Set up fixtures

#### Copy-Paste Prompts
```
Use @e2e-testing-patterns to design E2E test strategy
```

### Phase 3: Test Implementation

#### Skills to Invoke
- `playwright-skill` - Playwright tests
- `webapp-testing` - Web app testing

#### Actions
1. Write test scripts
2. Add assertions
3. Implement waits
4. Handle dynamic content
5. Add error handling

#### Copy-Paste Prompts
```
Use @playwright-skill to write E2E test scripts
```

### Phase 4: Browser Automation

#### Skills to Invoke
- `browser-automation` - Browser automation
- `playwright-skill` - Playwright features

#### Actions
1. Configure headless mode
2. Set up screenshots
3. Implement video recording
4. Add trace collection
5. Configure mobile emulation

### Phase 5: Visual Regression

#### Skills to Invoke
- `playwright-skill` - Visual testing

#### Actions
1. Set up visual testing
2. Create baseline images
3. Add visual assertions
4. Configure thresholds
5. Review differences

### Phase 6: Cross-Browser Testing

#### Actions
1. Configure Chromium
2. Add Firefox tests
3. Add WebKit tests
4. Test mobile browsers
5. Compare results

### Phase 7: CI/CD Integration

#### Actions
1. Create CI workflow
2. Configure parallel execution
3. Set up artifacts
4. Add reporting
5. Configure notifications

## Quality Gates

- [ ] Tests passing
- [ ] Coverage adequate
- [ ] Visual tests stable
- [ ] Cross-browser verified
- [ ] CI integration working

## Related Workflow Bundles

- `testing-qa` - Testing workflow
- `development` - Development
- `web-performance-optimization` - Performance
