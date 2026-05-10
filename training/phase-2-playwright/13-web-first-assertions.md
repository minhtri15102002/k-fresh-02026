# Module 13 — Web-First Assertions

> Phase 2 · Effort: 3h · Prerequisites: Module 12

## Learning objectives

After this module you can:

- Distinguish **web-first** (auto-retrying) assertions from **value** (one-shot) assertions.
- Use the most common assertion methods correctly.
- Use `expect.poll` and `expect.toPass` for non-locator polling.
- Set per-assertion timeouts when defaults aren't enough.
- Read assertion failures and explain what didn't match.

## Why it matters

The single biggest source of flakiness after `waitForTimeout` is one-shot assertions on dynamic state. Web-first assertions retry until satisfied or until the assertion timeout — they're the right tool by default.

## Concepts

### Web-first vs value assertions

| | Examples | Auto-retries? |
|---|---|---|
| **Web-first** | `expect(locator).toBeVisible()`, `expect(page).toHaveURL()`, `expect(response).toBeOK()` | Yes — until `expect.timeout` |
| **Value** | `expect(2 + 2).toBe(4)`, `expect(arr).toContain('x')` | No — fires once |

Web-first assertions take a `Locator`, `Page`, or `APIResponse` and retry the underlying check.

### Locator assertions you'll use most

```ts
await expect(loc).toBeVisible();
await expect(loc).toBeHidden();
await expect(loc).toBeEnabled();
await expect(loc).toBeDisabled();
await expect(loc).toBeChecked();
await expect(loc).toBeFocused();
await expect(loc).toBeInViewport();
await expect(loc).toBeEditable();
await expect(loc).toBeEmpty();
await expect(loc).toHaveText('exact text');
await expect(loc).toContainText('substring or regex');
await expect(loc).toHaveValue('input value');
await expect(loc).toHaveAttribute('aria-disabled', 'true');
await expect(loc).toHaveClass(/active/);
await expect(loc).toHaveCount(3);
await expect(loc).toHaveCSS('color', 'rgb(0, 128, 0)');
await expect(loc).toHaveScreenshot('cart.png');
```

### Page assertions

```ts
await expect(page).toHaveURL(/\/account/);
await expect(page).toHaveTitle('Dashboard');
await expect(page).toHaveScreenshot('home.png');
```

### API assertions

```ts
const res = await request.get('/api/cart');
await expect(res).toBeOK();        // status 200–299
expect(res.status()).toBe(201);    // value-style for specific code
expect(await res.json()).toMatchObject({ id: 99 });
```

### Soft assertions

```ts
await expect.soft(loc).toBeVisible();      // failure recorded but test continues
await expect.soft(loc2).toHaveText('OK');
expect(test.info().errors).toHaveLength(0); // optional gate
```

This repo's `assertHelper` uses `expect.soft` internally — see Module 18.

### `expect.poll` — when no locator suffices

```ts
await expect.poll(async () => {
  const res = await request.get('/api/jobs/42');
  return (await res.json()).status;
}, { timeout: 30_000, intervals: [500, 1000, 2000] }).toBe('completed');
```

Use for backend-state polling (job queues, eventual consistency).

### `expect(...).toPass` — assertion blocks that retry

```ts
await expect(async () => {
  const item = await fetch('/api/cart/item/42').then(r => r.json());
  expect(item.quantity).toBe(2);
  expect(item.price).toBeGreaterThan(0);
}).toPass({ timeout: 10_000 });
```

The whole block re-runs until it passes or the timeout expires.

### Negation

```ts
await expect(loc).not.toBeVisible();    // retries until hidden
await expect(loc).toHaveCount(0);       // also valid for "no rows"
```

### Timeouts

```ts
await expect(loc).toHaveText('Saved', { timeout: 30_000 });   // override per-assertion
```

Default comes from `playwright.config.ts` → `expect.timeout`.

### Reading assertion failures

```
Error: expect(received).toHaveText(expected)

Expected string: "Order placed"
Received string: "Order pending"
Call log:
  - expect.toHaveText with timeout 10000ms
  - waiting for getByRole('heading')
  -   locator resolved to <h1>Order pending</h1>
  -   unexpected value "Order pending"
```

The "Call log" shows what Playwright observed at each retry — invaluable for debugging.

## Hands-on lab

1. Find every `expect(...)` call in `tests/` (there shouldn't be many — this repo wraps assertions in page methods).
2. Write a tiny spec that:
   - Navigates to home
   - Asserts URL matches `/`
   - Asserts the page title contains the brand name
   - Asserts a 200 from a known API endpoint
3. Use `expect.poll` to wait for an API endpoint to return a specific field value (mock or real).
4. Trigger an assertion failure deliberately. Capture the "Call log" and paste it in your PR description.

## Self-check

- [ ] Why is `await expect(locator).toHaveText('X')` better than `expect(await locator.textContent()).toBe('X')`?
- [ ] When do you reach for `expect.poll`?
- [ ] What does `await expect(loc).toHaveCount(0)` retry until?
- [ ] What's the difference between `expect()` and `expect.soft()`?

## Further reading

- playwright.dev — Assertions
- playwright.dev — Test Generators (for assertion authoring inside `toPass`)

---

**Prev:** [12 — Actions & auto-waiting](./12-actions-and-auto-waiting.md) · **Next:** [14 — Fixtures & test isolation](./14-fixtures-and-test-isolation.md)
