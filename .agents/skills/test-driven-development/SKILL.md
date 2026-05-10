---
name: test-driven-development
description: "Drives the TDD cycle with strict red-green-refactor discipline: writes a failing test first, implements the minimum code to pass, then refactors. Use when the user asks to ‘build this test-first’, ‘do TDD on feature X’, or wants the agent to enforce the cycle rather than write code-then-tests."
risk: safe
source: community
date_added: "2026-02-27"
---

# Test-Driven Development (TDD)

## Overview

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## When to Use

**Always:**
- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions (ask your human partner):**
- Throwaway prototypes
- Generated code
- Configuration files

Thinking "skip TDD just this once"? Stop. That's rationalization.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Delete means delete

Implement fresh from tests. Period.

## Red-Green-Refactor Cycle

### RED - Write Failing Test
```typescript
// Write ONLY what you know is needed
it('should calculate total price with discount', () => {
  const cart = new Cart();
  cart.add({ price: 100, qty: 2 });
  expect(cart.total({ discount: 0.1 })).toBe(180); // 200 - 10%
});
```

### Verify RED - Watch It Fail
Run the test. Confirm it fails for the RIGHT reason:
- ❌ Wrong: `TypeError: Cart is not a constructor` (compilation error)
- ✅ Right: `Expected 180, received undefined` (assertion failure)

### GREEN - Minimal Code
```typescript
// Write ONLY enough to pass the test
class Cart {
  private items: { price: number; qty: number }[] = [];
  
  add(item: { price: number; qty: number }) {
    this.items.push(item);
  }
  
  total({ discount = 0 } = {}) {
    const subtotal = this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return subtotal * (1 - discount);
  }
}
```

### Verify GREEN - Watch It Pass

Run the test. ALL tests must pass, not just the new one.

### REFACTOR - Clean Up

Improve the code WITHOUT changing behavior:
- Extract constants / helper functions
- Rename for clarity
- Remove duplication

Run tests after each refactor step.

## Good Tests

A good test has:
- **One reason to fail** - Tests one thing only
- **Descriptive name** - `it('should reject expired discount codes')`
- **Arrange-Act-Assert** - Clear structure
- **Independent** - Does not depend on other tests or shared state
- **Fast** - Milliseconds, not seconds

## Red Flags — STOP and Start Over

- Writing multiple tests before running any
- Copying production code into tests
- Testing implementation details (private methods)
- Making tests pass by special-casing test inputs
- Test suite takes > 30 seconds

## Verification Checklist

Before declaring a feature done:

- [ ] Every line of new production code has a failing test that required it
- [ ] Tests describe desired behavior (not implementation)
- [ ] All edge cases have tests
- [ ] Refactoring done with tests green
- [ ] No commented-out tests remaining

## Example: Bug Fix with TDD

```typescript
// Step 1: Write a test that reproduces the bug
it('should handle empty cart total', () => {
  const cart = new Cart();
  expect(cart.total()).toBe(0); // Bug: currently throws
});

// Step 2: Run it, confirm it fails
// Step 3: Fix the minimum code needed
// Step 4: Run again, confirm it passes
// Step 5: Refactor if needed
```

## Final Rule

> The only valid reason to not write the test first is that you already have an existing test suite and you are maintaining existing behavior. In that case, write an additional test for the new behavior.
