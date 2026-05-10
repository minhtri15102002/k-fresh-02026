---
name: performance-testing-review-ai-review
description: "Reviews a test suite with AI assistance to surface performance bottlenecks (slow specs, hidden serialisation), stability issues (flaky patterns, race conditions), and coverage gaps. Use when the user asks ‘why is my suite slow?’, ‘audit these tests for flakiness’, or wants a structured pre-CI review before tests are merged."
risk: safe
source: community
date_added: "2026-02-27"
---

# AI-Powered Code Review Specialist

## Use this skill when

- Reviewing newly written Playwright or API tests
- Refactoring slow test suites
- Hunting for the cause of flaky tests
- Evaluating the quality of Page Objects / Test Helpers

## Automated Code Review Workflow

### 1. Initial Triage
- Does the test run?
- Does it use the standard project patterns?

### 2. Architecture Analysis
- **Test Isolation**: Does this test share state with others? (e.g., reusing the same user account from a `let` variable without cleanup)
- **Helper Usage**: Did the developer reinvent the wheel instead of using existing API helpers? (`DiscountApiHelper` instead of raw fetch)

### 3. Performance Review
- **Hard Sleeps**: Look for `page.waitForTimeout()` or standard `sleep()`. Reject these in favor of `waitForLoadState` or API polling.
- **Sequential Execution**: Are independent API calls grouped together with `Promise.all()` to speed up setup?
- **Data Cleanup**: Are resources cleaned up in an `afterAll` hook to prevent database bloat?

### 4. Review Comment Generation Format

```markdown
### 🟡 Flaky Test Risk
**File**: `test-daily-discount.spec.ts`
**Issue**: Waiting for 5000ms instead of waiting for the element state.
**Fix**:
\`\`\`typescript
- await page.waitForTimeout(5000);
+ await page.locator('.success-toast').waitFor({ state: 'visible' });
\`\`\`
```
