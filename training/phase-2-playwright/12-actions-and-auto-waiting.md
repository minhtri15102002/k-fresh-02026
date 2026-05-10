# Module 12 — Actions & Auto-Waiting

> Phase 2 · Effort: 3h · Prerequisites: Module 11

## Learning objectives

After this module you can:

- Use Playwright's action API: `click`, `fill`, `type`, `press`, `check`, `selectOption`, `hover`, `dragTo`, `setInputFiles`.
- Explain Playwright's **actionability checks** and why `waitForTimeout` is forbidden.
- Choose between **deterministic waits** (web-first assertions) and **promise races**.
- Use `setChecked` correctly for idempotent checkbox interactions.

## Why it matters

99% of Playwright flakes are misuses of `waitForTimeout`. Auto-waiting is what makes Playwright reliable; bypassing it makes it Cypress-like.

## Concepts

### Actionability — what Playwright waits for before each action

Before `click`, Playwright auto-waits until the locator is:

1. Attached to the DOM
2. Visible (non-zero box, no `display:none`, no `visibility:hidden`)
3. Stable (not animating)
4. Enabled (not `disabled`)
5. Receives events (no overlay covering it)

Each check has a default timeout (`actionTimeout`, falls back to `timeout`).

If actionability fails, Playwright throws — no action runs against a non-actionable element.

### Common actions

```ts
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('button', { name: 'Submit' }).click({ force: true });   // skip actionability — DANGER
await page.getByLabel('Email').fill('a@b.com');
await page.getByLabel('Email').clear();
await page.getByLabel('Bio').type('hello', { delay: 50 });   // simulate keystrokes
await page.keyboard.press('Enter');
await page.getByLabel('Subscribe').check();
await page.getByLabel('Subscribe').setChecked(true);          // idempotent — preferred
await page.getByLabel('Country').selectOption('US');
await page.getByLabel('Country').selectOption({ label: 'United States' });
await page.getByText('Drag me').dragTo(page.getByText('Drop here'));
await page.getByLabel('Avatar').setInputFiles('fixtures/avatar.png');
```

### Why `waitForTimeout` is forbidden

```ts
await page.click('button');
await page.waitForTimeout(2000);   // ❌ "wait 2s and hope"
await expect(page.getByText('Saved')).toBeVisible();
```

Two failure modes:

- **Too short** — flake on slow CI runs.
- **Too long** — slow on fast runs.

The right pattern is **wait for the outcome, not the time**:

```ts
await page.click('button');
await expect(page.getByText('Saved')).toBeVisible();   // auto-retries up to expect.timeout
```

This repo's ESLint config and `pre-push` hook reject `waitForTimeout`.

### Deterministic waits

```ts
await page.waitForURL(/\/checkout\/success/);
await page.waitForResponse(r => r.url().includes('/api/cart') && r.ok());
await page.waitForLoadState('domcontentloaded');
await locator.waitFor({ state: 'visible' });
```

In this repo, locator-level waits are routed through `commonPage.waitForVisible(...)` — see Module 17.

### Forms — the right way

```ts
// idempotent checkbox
await page.getByLabel('I agree').setChecked(true);

// dropdown by label, value, or index
await page.getByLabel('Country').selectOption({ label: 'Vietnam' });

// file upload
await page.getByLabel('Resume').setInputFiles('fixtures/cv.pdf');

// keyboard shortcuts
await page.keyboard.press('Control+K');
```

### Race conditions to watch for

```ts
// hidden then visible — actionability handles it
await page.getByRole('button', { name: 'Submit' }).click();

// element re-renders mid-action (React) — locator re-resolves automatically
await page.getByTestId('cart-row').filter({ hasText: 'iPhone' }).getByRole('button', { name: 'Remove' }).click();

// element exists in DOM but is hidden behind modal
await page.getByRole('button', { name: 'Save' }).click();   // throws "element not actionable"
// fix:
await page.getByRole('dialog').waitFor({ state: 'hidden' });
await page.getByRole('button', { name: 'Save' }).click();
```

### `force: true` — when never to use

`force: true` skips actionability. It's a smell:

- Hides legitimate visibility bugs
- Makes tests pass even when users can't click

Acceptable cases (rare): a known-good overlay you can't dismiss, animations Playwright can't detect. **Document why** in a comment.

## Hands-on lab

1. Open `pages/ui/checkout-page.ts`. Find the `clickPlaceOrderButton` action. Read it. What does Playwright wait for before the click?
2. Find a test that previously used `waitForTimeout`. (Check git history.) How was it replaced?
3. Write a small spec that:
   - fills a form
   - presses Tab to move focus
   - asserts the next field is focused (`expect(locator).toBeFocused()`)
4. Trigger an actionability failure deliberately (e.g. click a hidden button). Read the error message — Playwright tells you exactly which check failed.

## Self-check

- [ ] List the 5 actionability checks Playwright runs before `click`.
- [ ] What's wrong with `await page.waitForTimeout(2000); await locator.click()`?
- [ ] Why is `setChecked(true)` better than `check()` for idempotency?
- [ ] When can you justify `force: true`?

## Further reading

- playwright.dev — Actionability
- playwright.dev — Auto-waiting

---

**Prev:** [11 — Locators](./11-locators.md) · **Next:** [13 — Web-first assertions](./13-web-first-assertions.md)
