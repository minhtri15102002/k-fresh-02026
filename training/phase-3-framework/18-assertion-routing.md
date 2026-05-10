# Module 18 — Assertion Routing (`assertHelper` vs `Assertions`)

> Phase 3 · Effort: 4h · Prerequisites: Module 17

## Learning objectives

After this module you can:

- Recite the **ASSERTION ROUTING — FORBIDDEN** rule from `prompts/core/pom-generator.md`.
- Decide whether an assertion belongs in `this.assertHelper.*` or `Assertions.*`.
- Recognize the **snapshot-then-match anti-pattern** and fix it.
- Replace any raw `expect(...)` call with the correct helper.

## Why it matters

Half of all flaky tests in legacy suites are racy assertions: `expect(await loc.textContent()).toBe('Saved')` or `Assertions.assertTextMatch(this.page.url(), /...)`. Routing assertions correctly turns those flakes into deterministic tests.

## Concepts

### Two utilities, one rule for each

| Tool | When | Retry? |
|---|---|---|
| `this.assertHelper.*` (instance) | Locator / Page / APIResponse state | **Yes** — uses `expect.soft` internally; auto-retries until `expect.timeout` |
| `Assertions.*` (static class) | Primitives / objects / arrays already in JS memory | **No** — one-shot |

Rule of thumb: **if the value comes from the DOM or the Page, route through `assertHelper`**. Only assertions whose inputs are pure JavaScript values (counts you've done arithmetic on, prices parsed with `Currency.parse`, arrays you built locally) belong in `Assertions`.

### Forbidden table (excerpt — full canonical version in `prompts/core/pom-generator.md`)

| Forbidden | Use instead | Why |
|---|---|---|
| `expect(loc).toBeVisible()` | `await this.assertHelper.assertElementVisible(loc)` | DOM — must auto-retry |
| `expect(loc).toHaveText(t)` | `await this.assertHelper.assertElementHasText(loc, t)` | DOM text |
| `expect(loc).toContainText(t)` | `await this.assertHelper.assertElementContainsText(loc, t)` | DOM text |
| `expect(loc).toHaveCount(n)` | `await this.assertHelper.assertElementCount(loc, n)` | Collection |
| `expect(loc).toBeChecked()` | `await this.assertHelper.assertCheckboxChecked(loc)` | State |
| `expect(loc).toHaveAttribute(a,v)` | `await this.assertHelper.assertElementHasAttribute(loc, a, v)` | DOM attr |
| `expect(page).toHaveURL(url)` | `await this.assertHelper.assertPageHasURL(page, url)` | URL — must auto-retry |
| `expect(page).toHaveTitle(t)` | `await this.assertHelper.assertPageHasTitle(page, t)` | Title |
| `expect(response).toBeOK()` | `await this.assertHelper.assertResponseOK(response)` | API |
| `expect(num).toBe(n)` | `Assertions.assertEqual(num, n)` | In-memory primitive |
| `expect(obj).toEqual(o)` | `Assertions.assertDeepEqual(obj, o)` | Deep equality |
| `expect(arr).toContain(x)` | `Assertions.assertContains(arr, x)` | In-memory containment |
| `expect(num).toBeCloseTo(n, p)` | `Assertions.assertAlmostEqual(num, n, delta)` | Floating-point — explicit `delta` |

### The snapshot-then-match anti-pattern (most common bug)

```ts
// ❌ flaky — captures URL once, no retry
Assertions.assertTextMatch(this.page.url(), /\/account/, 'Account page');

// ❌ flaky — captures text once, no retry
const text = await this.commonPage.textContent(this.lblStatus);
Assertions.assertEqual(text, 'Active', 'Status is active');

// ❌ flaky — innerText snapshot
expect(await loc.innerText()).toBe('Saved');
```

All three race the navigation/render. **Fix:**

```ts
// ✅ auto-retries
await this.assertHelper.assertPageHasURL(this.page, /\/account/, 'Account page');
await this.assertHelper.assertElementHasText(this.lblStatus, 'Active');
await this.assertHelper.assertElementHasText(loc, 'Saved');
```

This repo had 25+ instances of these patterns until they were swept (see commit history around the assertion-routing migration).

### Allowed `Assertions.*` use cases (legitimate)

```ts
// values pulled out of the DOM into JS earlier in the same method
const actual = await this.getEditAccountValues();   // -> already a string
Assertions.assertEqual(actual.firstName, expected.firstName, 'First name');

// in-memory math
const subTotal = unitPrice * quantity;
Assertions.assertAlmostEqual(subTotal, 99.99, 0.05, 'Subtotal arithmetic');

// arrays you built yourself
const productNames = await this.getProductNames();
const unique = [...new Set(productNames)];
Assertions.assertDeepEqual(productNames, unique, 'No duplicates');

// non-DOM invariants (parsed JSON body, decoded JWT, etc.)
const claims = decodeJwt(token);
Assertions.assertEqual(claims.iss, 'auth.example.com');
```

### Where assertions live (architectural rule)

- **Pages** call `this.assertHelper.*` and `Assertions.*` inside `verify<X>()` / `expect<X>()` methods.
- **Tests** call `<page>.verifyX()` — never call `assertHelper` or `Assertions` directly.
- **Locator classes** never assert.

```ts
// page
@step('Verify Order Success')
async verifyOrderSuccess(): Promise<void> {
  await this.assertHelper.assertPageHasURL(this.page, /\/success/);
  await this.assertHelper.assertElementVisible(this.lblConfirmation);
}

// spec
test('TC01 - …', async ({ checkoutPage }) => {
  await checkoutPage.placeOrder();
  await checkoutPage.verifyOrderSuccess();   // ← spec stays clean
});
```

### Helper-widening exceptions

If the helper you need doesn't exist, **emit `## Missing Helper`** instead of falling back to raw `expect()`. Known gaps:

- `assertHelper.assertPageHasURL(page, url, msg, { timeout })` — current signature has no `timeout` parameter; relies on global `expect.timeout`.
- `assertHelper.assertElementHasInputValue(loc, value)` — not yet wrapped; only place raw `expect.poll` is tolerated.

## Hands-on lab

1. Read `prompts/core/pom-generator.md` § ASSERTION ROUTING — FORBIDDEN end-to-end.
2. Audit one page object that has both `assertHelper` and `Assertions` calls (e.g. `pages/ui/profile-page.ts`):
   - Which are DOM-derived → should be `assertHelper`?
   - Which are in-memory primitives → correct `Assertions` use?
   - Are there any snapshot-then-match patterns left?
3. Find any `expect(...)` directly in `pages/` or `tests/`. Refactor or, if it's a known helper-widening case, emit a `## Missing Helper` block.
4. Run `npm run check:all` after your refactor. Must pass.

## Self-check

- [ ] When does an assertion belong in `assertHelper`? When in `Assertions`?
- [ ] Why is `Assertions.assertTextMatch(this.page.url(), /…)` forbidden?
- [ ] You need `expect(value).toBeCloseTo(x, 1)` — what does the equivalent `Assertions.*` call look like?
- [ ] Where in the architecture do `verify<X>()` methods live? Where do they get called from?

## Further reading

- `prompts/core/pom-generator.md` § ASSERTION ROUTING — FORBIDDEN (canonical)
- `utilities/assert-helper.ts` (the implementation)
- `utilities/assertions.ts` (the static utility)

---

**Prev:** [17 — `commonPage` discipline](./17-commonpage-discipline.md) · **Next:** [19 — Models & test data](./19-models-and-test-data.md)
