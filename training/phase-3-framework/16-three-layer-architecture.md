# Module 16 — 3-Layer Architecture

> Phase 3 · Effort: 3h · Prerequisites: Phase 2

## Learning objectives

After this module you can:

- Explain the **locators / pages / tests** separation and why it exists.
- Trace one feature (e.g. checkout) through all three layers.
- Add a new feature page following the architecture.
- Spot architecture violations in a code review.

## Why it matters

Every test framework collapses without separation of concerns. The 3-layer model keeps locators stable, pages reusable, and tests readable. This is the most-cited rule in this repo's code reviews.

## Concepts

### The three layers

```
┌─────────────────────────────────┐
│ tests/                          │   "What & Why" — business intent
│   tests/ui/test-checkout.spec.ts│   Test names, data, sequencing
└─────────────────────────────────┘
                ↓ uses
┌─────────────────────────────────┐
│ pages/                          │   "How" — actions + verifications
│   pages/ui/checkout-page.ts     │   Methods like fillAddress(), placeOrder()
└─────────────────────────────────┘
                ↓ extends
┌─────────────────────────────────┐
│ locators/                       │   "Where" — DOM elements only
│   locators/checkout-locators.ts │   btnPlaceOrder, inputZip, ddlCountry
└─────────────────────────────────┘
```

Plus three transverse layers:

```
models/        — TypeScript interfaces (Address, User, Product)
data/          — deterministic + factory test data
utilities/     — shared toolbox (commonPage, assertHelper, Constants, Currency)
```

### Layer rules (this repo)

| Layer | Allowed | Forbidden |
|---|---|---|
| **locators/** | `getByRole`, `getByLabel`, locator chains, `Locator` types | Actions, assertions, page methods |
| **pages/** | `commonPage.<verb>(...)`, `assertHelper.*`, `Assertions.*`, `@step` decorators | Inline locators, raw `expect()`, `this.page.click(...)` |
| **tests/** | Page-method calls, fixtures, tags | `new <Page>()`, `expect()`, `AssertHelper`, locator imports |

### Class hierarchy

```ts
// locators/common-locators.ts
export class CommonLocators {
  readonly page: Page;
  readonly inputSearch: Locator;
  readonly btnMyAccount: Locator;
  // … shared across every page
  constructor(page: Page) { this.page = page; this.locatorInitialization(); }
  protected locatorInitialization(): void {
    this.inputSearch = this.page.getByRole('searchbox', { name: 'Search' });
    // …
  }
}

// locators/checkout-locators.ts
export class CheckoutLocators extends CommonLocators {
  readonly btnPlaceOrder: Locator;
  readonly inputZip: Locator;
  protected override locatorInitialization(): void {
    super.locatorInitialization();
    this.btnPlaceOrder = this.page.getByRole('button', { name: 'Place Order' });
    // …
  }
}

// pages/ui/checkout-page.ts
export class CheckoutPage extends CheckoutLocators {
  commonPage = new CommonPage(this.page);
  assertHelper = new AssertHelper();
  @step('Place order')
  async placeOrder(): Promise<void> {
    await this.commonPage.click(this.btnPlaceOrder);
    await this.assertHelper.assertPageHasURL(this.page, /\/success/, 'Order success');
  }
}

// tests/ui/test-checkout.spec.ts
test('TC01 - guest checkout completes', { tag: ['@P1','@critical','@smoke'] },
  async ({ checkoutPage }) => {
    await checkoutPage.fillAddress(validAddress);
    await checkoutPage.placeOrder();
  });
```

### What each layer absolutely owns

- **Locators** own *element selection*. If selector strategy changes, only locators change.
- **Pages** own *user journeys*. If business flow changes, pages change.
- **Tests** own *what to verify*. If acceptance criteria change, tests change.

When all three change at once, you have a real feature change. When two change, you usually have a leaky abstraction.

### Page categories

```
pages/
├── api/api-page.ts            ← API helper, login flows
├── common-page.ts             ← shared primitives (click, fill, hover, wait…)
├── base-page.ts               ← Playwright fixture wiring
└── ui/
    ├── home-page.ts
    ├── login-page.ts
    ├── cart-page.ts
    └── …
```

`common-page.ts` is special: it's the **only** place that calls Playwright's `Locator.*` action API directly. Every feature page goes through it (Module 17).

## Hands-on lab

1. Pick the `cart` feature. Trace it through all three layers:
   - Open `locators/cart-locators.ts` — list every locator.
   - Open `pages/ui/cart-page.ts` — list every action method.
   - Open `tests/api/test-cart.spec.ts` and `tests/ui/test-cart.spec.ts` — list every test.
2. Diagram the trace as a single page in `training/sandbox/<your-name>/cart-architecture.md`.
3. Find one violation in `pages/` or `tests/` (e.g. an inline locator in a page). Open a PR fixing it.

## Self-check

- [ ] Why are locators in their own classes (vs. inline in pages)?
- [ ] Why is `common-page.ts` the only place to call `locator.click()`?
- [ ] Where does `Currency.parse` live and why?
- [ ] If the SUT renames "Place Order" to "Confirm Order", which file changes?

## Further reading

- This repo's `documents/automation-framework/README.md`
- This repo's `prompts/core/pom-generator.md`
- Martin Fowler — *Page Object Pattern*

---

**Next:** [17 — `commonPage` discipline](./17-commonpage-discipline.md) · **Up:** [Phase 3 README](./README.md)
