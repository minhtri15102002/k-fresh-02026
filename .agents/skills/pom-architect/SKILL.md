---
name: pom-architect
description: "Designs and generates Page Object Model code (locators class, page class, optional model interface) that strictly follows this repo's three-layer architecture and commonPage / assertHelper / Assertions discipline. Use when explicitly asked to 'create a page object for X', 'add locators for Y', 'extend the cart page', or before generating a spec that needs new POM coverage. Wraps prompts/core/pom-generator.md and prompts/core/pom-orchestrator.md, enforces the forbidden-pattern tables (no expect() in pages, no this.locator.click() in pages, no selectors in tests), and emits ready-to-commit files."
---

# POM Architect

`prompts/core/pom-generator.md` is the canonical source of truth for how POM code MUST look in this repo. It's a 600-line prompt cited from three other prompts and three training modules — but until now there's no skill that picks it up automatically when the agent is asked "build a page object for the search-results page".

This skill is that pickup. It reads the canonical prompt, applies it to the input, and produces three artefacts: a **locators** class, a **page** class, and (where modelled) a typed **interface** — all conforming to the strict discipline.

---

## When to use this skill

Trigger on:
- "Create a page object for …"
- "Add locators for …"
- "Extend the cart / checkout / profile page"
- "Build the POM for …"
- Before generating a spec that references locators/pages that don't exist yet

**Do NOT use when:**
- The user wants a **test spec** → use `playwright-test-generator` (which itself depends on this skill having run first).
- The user wants to **fix** an existing page object → use `test-fixing` or refactor patterns.
- The user wants a manual TC → use `generate-manual-testcase`.

---

## How to use it

### Phase 0 — Read the canonical prompt

You MUST read [`prompts/core/pom-generator.md`](../../../prompts/core/pom-generator.md) once per session before authoring. The two sections that drive every decision:

1. **DIRECT-LOCATOR ACTIONS — FORBIDDEN** — the action routing rules (`this.commonPage.click`, never `this.locator.click()`).
2. **ASSERTION ROUTING — FORBIDDEN** — when to use `assertHelper.*` (web-first, locator-bound) vs `Assertions.*` (resolved primitives).

Then [`prompts/core/pom-orchestrator.md`](../../../prompts/core/pom-orchestrator.md) for the multi-phase workflow (gather → generate → review → patch).

### Phase 1 — Gather inputs

Ask only for what's missing:

| Input | Source / where to look |
|---|---|
| Feature name | User statement; map to a `module:*` (auth/cart/checkout/profile/product/compare/wishlist/home) |
| Knowledge-base file | `knowledge-base/ui/<feature>.md` or `knowledge-base/api/<feature>.md` if present |
| HTML / DOM evidence | DevTools snippet, Playwright codegen output, or live URL the agent can inspect |
| Existing parent class | Always `BasePage` (UI) or `ApiPage` (API); never extend a sibling page |
| Locator naming | Per [`prompts/core/locators-naming.md`](../../../prompts/core/locators-naming.md) — `btn*`, `input*`, `lnk*`, `select*`, `chk*`, `radio*`, `lbl*`, `divError*`, `tbl*`, `lst*`, `img*` etc. |

### Phase 2 — Generate three layers

Emit, in this order. The pattern below is **two-class layering**: locators class extends `CommonLocators` and exposes `locatorInitialization()`; the page class extends the locators class directly (so locators are accessed as `this.btnX`, not via a `locators` property).

#### 1. Locators class — `locators/<feature>-locators.ts`

```ts
import { Locator, Page } from '@playwright/test';
import { CommonLocators } from '@locators/common-locators';

export class SearchResultsLocators extends CommonLocators {
  inputSearchKeyword!: Locator;
  btnSearchSubmit!: Locator;
  lstSearchResultRow!: Locator;
  divEmptyState!: Locator;
  btnAddToCartByProductName!: (name: string) => Locator;

  constructor(page: Page) {
    super(page);
    this.locatorInitialization();
  }

  override locatorInitialization(): void {
    super.locatorInitialization();
    this.inputSearchKeyword         = this.page.getByRole('textbox', { name: /search/i });
    this.btnSearchSubmit            = this.page.getByRole('button', { name: 'Search' });
    this.lstSearchResultRow         = this.page.locator('[data-test=search-result-row]');
    this.divEmptyState              = this.page.locator('[data-test=search-empty]');
    this.btnAddToCartByProductName  = (name: string): Locator =>
      this.page.getByRole('listitem')
               .filter({ hasText: name })
               .getByRole('button', { name: /add to cart/i });
  }
}
```

Rules enforced:
- Extends `CommonLocators` (NOT a non-existent `BaseLocators` / `BasePage` — those don't exist in this repo).
- Fields use **definite-assignment** (`!:`), not `readonly`. Init happens in `locatorInitialization()` so subclasses can `override` and call `super.locatorInitialization()`.
- Constructor MUST call `super(page)` and `this.locatorInitialization()` — that ordering is canon.
- Factories use `(arg: T): Locator =>` with an explicit return type.
- Prefer `getByRole` > `getByTestId` > CSS > XPath.

#### 2. Page class — `pages/ui/<feature>-page.ts`

```ts
import { Page } from '@playwright/test';
import { CommonPage } from '@pages/common-page';
import { step } from '@utilities/logging';
import { SearchResultsLocators } from '@locators/search-results-locators';
import { AssertHelper } from '@utilities/assert-helper';
import { Assertions } from '@utilities/assertions';

export class SearchResultsPage extends SearchResultsLocators {
  commonPage: CommonPage;
  assertHelper: AssertHelper;

  /**
   * Initialize SearchResultsPage with required dependencies
   * @param page Playwright Page instance
   */
  constructor(page: Page) {
    super(page);
    this.commonPage = new CommonPage(page);
    this.assertHelper = new AssertHelper();
  }

  /**
   * Submit a search keyword and wait for the result list to render.
   * @param keyword The search term
   */
  @step('Search for keyword')
  async searchFor(keyword: string): Promise<void> {
    await this.commonPage.fill(this.inputSearchKeyword, keyword);
    await this.commonPage.click(this.btnSearchSubmit);
    await this.assertHelper.assertElementVisible(this.lstSearchResultRow.first());
  }

  /**
   * Assert the empty-state copy is shown when no results match.
   * @param keyword The search term that produced no results
   */
  @step('Verify empty state for keyword')
  async verifyEmptyStateFor(keyword: string): Promise<void> {
    await this.assertHelper.assertElementVisible(this.divEmptyState);
    await this.assertHelper.assertElementHasText(
      this.divEmptyState,
      `No products match "${keyword}"`,
    );
  }
}
```

Rules enforced:
- Page class **extends `<Feature>Locators` directly** (so `this.btnSearchSubmit`, never `this.locators.btnSearchSubmit`).
- `commonPage` and `assertHelper` are **instantiated in the constructor** — they're not inherited (there is no `BasePage` parent in this pattern).
- Import `step` from `@utilities/logging` — NEVER from `allure-js-commons` or `allure-playwright`.
- Every public async method has JSDoc above it, then `@step('<Description>')`, then an explicit `Promise<…>` return type.
- ALL DOM actions go through `this.commonPage.*`; **zero** `this.locator.click()` etc. (See the canonical forbidden table in `prompts/core/pom-generator.md` § *DIRECT-LOCATOR ACTIONS — FORBIDDEN*.)
- ALL assertions go through `this.assertHelper.*` (web-first, locator-bound) or static `Assertions.*` (resolved primitives) — never raw `expect()`. (See `pom-generator.md` § *ASSERTION ROUTING — FORBIDDEN*.)
- No unused imports — Playwright `expect` is forbidden in feature pages, so don't import it.

#### 3. Optional: model interface — `models/<feature>.ts`

Only if the feature owns a typed entity (form payload, API contract):
```ts
export interface SearchQuery {
  keyword: string;
  category?: string;
  sortBy?: 'relevance' | 'price-asc' | 'price-desc';
}
```

### Phase 3 — Self-review against the forbidden tables

Before handing back, scan your own output and confirm:
- [ ] Locators class extends **`CommonLocators`** (not a non-existent `BaseLocators`).
- [ ] Locator fields use `!:` definite assignment; initialization is in `override locatorInitialization()` which calls `super.locatorInitialization()` first.
- [ ] Page class extends **`<Feature>Locators`** directly; `commonPage` and `assertHelper` are instantiated in its constructor.
- [ ] `step` is imported from `@utilities/logging` — NOT from `allure-js-commons` / `allure-playwright`.
- [ ] No `this.locator.click()` / `.fill()` / `.selectOption()` / `.waitFor()` / `.isVisible()` etc. — all routed through `this.commonPage.*`.
- [ ] No `expect(this.page)…` / `expect(loc)…` in the page class — routed through `assertHelper.*` / `Assertions.*`.
- [ ] No selectors in test specs (the spec should call page methods, not page locators).
- [ ] Every public method has `@step` + JSDoc + explicit return type.
- [ ] Locator factories typed `(arg: T): Locator =>`.
- [ ] No duplicate locator assignments (dead writes).
- [ ] No unused imports (especially Playwright `expect`, which is forbidden in feature pages).

If any check fails, regenerate the offending file — do not patch in place. Cite the violation and re-emit.

### Phase 4 — Hand off

Tell the user:
- The three (or four) files just produced.
- That the next step is `playwright-test-generator` to write specs that consume this POM.
- Suggested `commonPage` extensions (if any) — if you reached for an action that doesn't exist on `commonPage`, propose adding it there in a separate PR rather than calling the locator directly.

---

## Decision tree

```
New page object ?
├── Page exists already, just adding locators
│       → patch locators class only; do not duplicate the page class
├── Page is API, not UI
│       → extend ApiPage, return strongly-typed responses, not Locator
├── Page mixes UI + API (hybrid like cart-ui-api)
│       → ONE page object that composes a UiPage + ApiPage helper, not subclassing both
├── Action you need doesn't exist on commonPage
│       → propose adding it to commonPage; do NOT inline the raw locator call
└── Standard new UI page
        → all three artefacts (locators / page / optional interface)
```

---

## Best practices

- **Never put a selector in a test.** If you reach for one, your POM is incomplete — extend it.
- **Prefer accessible locators.** `getByRole` survives DOM refactors better than CSS.
- **Parametrise with factories, not loops.** `btnAddToCartByProductName(name)` >> looping over `getAllByRole`.
- **One concept per method.** `addToCartFromSearch(productName)` not `addToCartFromSearchAndOpenMiniCartAndDismissBanner(...)`.
- **Don't return `Promise<Locator>`.** Methods do work; getters expose data. Mixing returns surprises consumers.
- **Page methods don't assert page-state for free.** If you need post-conditions, add a separate `verifyXxx()` method. Tests call both: `await page.doX(); await page.verifyX();`.
- **Re-use, don't re-derive.** `CommonPage` already exposes `goto`, `reload`, `waitForVisible`, `click`, `fill`, etc. — never re-implement them or call the underlying `Locator` directly. If a helper you need is missing, propose adding it to `CommonPage` in a separate PR rather than bypassing the rule.
- **`override locatorInitialization()` always calls `super.locatorInitialization()` first.** Otherwise the inherited `CommonLocators` fields (e.g. `btnSave`, `inputSearch`) silently stay undefined.

---

## Related

- [`prompts/core/pom-generator.md`](../../../prompts/core/pom-generator.md) — canonical generator prompt (forbidden-pattern tables).
- [`prompts/core/pom-orchestrator.md`](../../../prompts/core/pom-orchestrator.md) — multi-phase orchestration prompt.
- [`prompts/core/locators-naming.md`](../../../prompts/core/locators-naming.md) — locator naming convention.
- [`training/phase-3-framework/16-three-layer-architecture.md`](../../../training/phase-3-framework/16-three-layer-architecture.md) — the architectural rationale.
- [`training/phase-3-framework/17-commonpage-discipline.md`](../../../training/phase-3-framework/17-commonpage-discipline.md) — action-routing rules.
- [`training/phase-3-framework/18-assertion-routing.md`](../../../training/phase-3-framework/18-assertion-routing.md) — assertion-routing rules.
- [`.agents/skills/playwright-test-generator`](../playwright-test-generator/SKILL.md) — runs **after** this skill to author specs.
- [`.agents/skills/test-tags-validator`](../test-tags-validator/SKILL.md) — verifies new specs carry required tags.
