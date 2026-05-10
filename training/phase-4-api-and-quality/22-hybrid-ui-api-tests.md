# Module 22 — Hybrid UI + API Tests

> Phase 4 · Effort: 3h · Prerequisites: Module 21

## Learning objectives

After this module you can:

- Decide which steps belong in API and which in UI for a hybrid test.
- Seed test state via API in `beforeEach` and assert via UI.
- Reduce a 60-second UI test to a 10-second hybrid.
- Avoid the trap of "API setup, then UI verifies the same thing".

## Why it matters

Hybrid tests give you UI confidence at API speed. The pattern: **API to set up state, UI to verify what the user sees, API to clean up.** Most slow E2E suites are 80% wasted UI clicks just to get to the assertion.

## Concepts

### The hybrid recipe

```
1. API: log in (or seed user)
2. API: create the entity under test (cart with 3 items, draft order, etc.)
3. UI:  navigate directly to the relevant page
4. UI:  perform the *one* user action you want to test
5. UI:  assert what the user sees
6. API: clean up
```

### Example — checkout discount

#### Slow E2E (60s)

```
register → login → search → add 3 products → cart → apply coupon → checkout → assert
```

#### Hybrid (10s)

```
API: register + login + add 3 products + apply coupon
UI:  goto /checkout, place order, assert success
```

The user action being tested is "place order with discounted cart" — only that path needs to be in UI.

### Tag it as `@hybrid`

```ts
test('TC05 - discounted checkout completes',
  { tag: ['@P1', '@critical', '@regression', '@hybrid', '@checkout'] },
  async ({ apiPage, checkoutPage, page }) => {
    await apiPage.seedDiscountedCart();
    await page.goto('/checkout');
    await checkoutPage.fillAddress(validAddress);
    await checkoutPage.placeOrder();
    await checkoutPage.verifyOrderSuccess();
    await apiPage.cleanupOrder();
  });
```

### `request.storageState` tricks

```ts
// global-setup.ts — log in once, every test reuses
const ctx = await browser.newContext();
const apiCtx = await playwright.request.newContext({ baseURL });
await apiCtx.post('/auth/login', { data: validUser });
await apiCtx.storageState({ path: 'storage/user.json' });
```

```ts
// playwright.config.ts
projects: [
  { name: 'authed', use: { storageState: 'storage/user.json' } },
]
```

Test starts already logged in — saves 5–10s per test.

### Patterns to *avoid*

```ts
// anti-pattern 1: API + UI assert the same thing
const cart = await apiPage.getCart();
expect(cart.total).toBe(99.99);          // ← API check
await page.goto('/cart');
await expect(page.getByText('99.99')).toBeVisible();   // ← redundant

// anti-pattern 2: UI to set up a state API can do
await loginPage.login(user);             // 5s
await homePage.search('iPhone');         // 3s
await productPage.addToCart(3);          // 4s  ← 12s wasted; should be apiPage.seedCart(...)
```

### When NOT to use hybrid

- The *user journey itself* is what you're testing (registration flow, checkout funnel).
- The bug class lives in UI orchestration (race conditions, focus management).
- You're hunting visual or a11y regressions.

For these, full UI tests are correct.

### How this repo's `apiPage` supports hybrids

```
pages/api/api-page.ts
├── loginAsSeller()                  ← reusable login
├── addAuthTokenToHeaders()          ← attaches auth to UI context
├── seedCart(products: Product[])    ← (you may add)
├── createCoupon(opts)               ← (you may add)
└── cleanupOrder(id)                 ← (you may add)
```

Pattern: every UI test that doesn't strictly need to *test* the setup steps should reach for `apiPage.seed<X>()`.

## Hands-on lab

1. Pick a slow UI test in `tests/ui/`. Time it (`npx playwright test … --reporter=list`).
2. Identify which steps could be moved to API.
3. Add the necessary `apiPage.seed<X>()` methods to `pages/api/api-page.ts` (use `verifyX` for any post-seed assertions).
4. Convert the test. Re-time. Document the speedup in your PR description.
5. Tag the new test `@hybrid` (and remove `@ui` if appropriate).

## Self-check

- [ ] When is hybrid the wrong choice?
- [ ] What's the rule of thumb for what to keep in UI?
- [ ] Why does seeding via API make tests *more* deterministic, not less?
- [ ] Does this repo's `apiPage` go through the same `assertHelper` rule?

## Further reading

- This repo's `pages/api/api-page.ts`
- Kent C. Dodds — *Write tests, not too many, mostly integration*

---

**Prev:** [21 — API testing with Playwright](./21-api-testing-with-playwright.md) · **Next:** [23 — API security testing](./23-api-security-testing.md)
