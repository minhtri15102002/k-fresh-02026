# Module 11 — Locators

> Phase 2 · Effort: 4h · Prerequisites: Module 10, Module 08

## Learning objectives

After this module you can:

- Apply Playwright's **locator priority hierarchy**.
- Use `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, `getByTestId`, `locator(css)`, `locator(xpath)`.
- Chain and filter locators (`.filter()`, `.nth()`, `.first()`, `.last()`).
- Recognize and avoid **anti-patterns**: nth-child trees, deep CSS, brittle XPath.
- Match this repo's locator naming convention (`prompts/core/locators-naming.md`).

## Why it matters

Locators are the contract between your test and the rendered page. A good locator survives 100 redesigns; a bad one breaks on every commit. Mastering this single skill cuts maintenance cost by half.

## Concepts

### The priority hierarchy

```
1. getByRole(role, { name })    — best, what users + a11y tools see
2. getByLabel(text)             — form fields with associated labels
3. getByPlaceholder(text)       — only when no label exists
4. getByTestId(id)              — escape hatch when a11y is impossible
5. getByText(text)              — anchors text inside non-form elements
6. locator(css)                 — last resort for CSS-only structures
7. locator(xpath)               — true emergency only
```

### `getByRole` — your default

```ts
page.getByRole('button', { name: 'Submit' });
page.getByRole('checkbox', { name: 'I agree' });
page.getByRole('link', { name: 'My Account' });
page.getByRole('textbox', { name: 'Email' });
page.getByRole('combobox', { name: 'Country' });
page.getByRole('row', { name: 'Order #1234' });
```

Names can be regex: `getByRole('button', { name: /Add to (cart|bag)/i })`.

### `getByLabel`

```html
<label for="email">Email address</label>
<input id="email" type="email" />
```

```ts
page.getByLabel('Email address');
```

Works for `<label for>` association OR `<label><input/></label>` wrapping.

### `getByTestId` — the official testid

```html
<div data-testid="cart-row">…</div>
```

```ts
page.getByTestId('cart-row');
```

Configure a different attribute via `use: { testIdAttribute: 'data-test' }` if your app already uses one.

### Filtering & chaining

```ts
const cartRows = page.getByTestId('cart-row');
cartRows.filter({ hasText: 'Apple iPhone' }).getByRole('button', { name: 'Remove' });
cartRows.first();
cartRows.nth(2);
cartRows.last();
```

Filters compose, so prefer `parent.filter({…}).descendant` over giant XPath trees.

### CSS — when you must

```ts
page.locator('.product-card');                 // class
page.locator('[data-product-id="42"]');        // attribute
page.locator('input[name="q"]');               // attribute on element
page.locator('nav >> visible=true');           // engine pipe (Playwright extension)
page.locator('css=.btn:has-text("Save")');     // explicit engine
```

### XPath — when you really must

```ts
page.locator('xpath=//tr[td[normalize-space()="OPC2002"]]/td[2]/a');
```

This repo flags XPath usage in code review. Most cases can be replaced with role + filter.

### Anti-patterns

```ts
// brittle: hand-counted nth-child
page.locator('div > div > div:nth-child(3) > button');

// brittle: hashed class names
page.locator('.css-1k3z7yf .btn-x84j');

// fine for now, but flag if a11y is missing
page.locator('xpath=//button[1]');

// hidden elements treated as visible
page.locator('button:has-text("Save")');   // matches even if button is hidden
```

### This repo's naming convention

From `prompts/core/locators-naming.md`:

| Prefix | Element |
|---|---|
| `btn` | button |
| `lnk` | anchor / link |
| `inp` | input (text, password, email, number) |
| `chk` | checkbox |
| `rdo` | radio |
| `ddl` | dropdown / select |
| `lbl` | label / static text |
| `img` | image |
| `tbl` | table |
| `row` | table row |
| `tab` | tab |
| `dlg` | dialog / modal |
| `alt` | alert / toast |

Locators live in `locators/<feature>-locators.ts`, never inline in pages or specs.

### Locators are lazy

```ts
const btn = page.getByRole('button', { name: 'Submit' });   // no DOM lookup yet
await btn.click();                                          // resolved here
await btn.click();                                          // resolved AGAIN here
```

Each action re-resolves. Stale-element errors are rare in Playwright thanks to this.

## Hands-on lab

1. Read `locators/cart-locators.ts` end-to-end. For each locator, determine which level of the hierarchy it uses. Could any be promoted higher (e.g. CSS → role)?
2. Write 5 locators for the registration form using the highest-priority method possible. Compare with `locators/register-locators.ts`.
3. Find one XPath in the codebase. Open the SUT, identify the underlying DOM, and rewrite it as a role-based locator. PR the change.
4. Add a chained-filter example to `locators/cart-locators.ts`: "Remove button for the row containing product `<name>`".

## Self-check

- [ ] Why is `getByRole` more stable than `.btn-primary`?
- [ ] You have 5 buttons all named "Edit". How do you uniquely target the third one?
- [ ] Writing a locator for a custom React-Select dropdown — do you use `getByRole('combobox')`? Why or why not?
- [ ] What does `await locator.first()` do at the moment of the call?

## Further reading

- playwright.dev — Locators (best practices)
- This repo's `locators/` directory
- `prompts/core/locators-naming.md`

---

**Prev:** [10 — Setup & Config](./10-playwright-setup-and-config.md) · **Next:** [12 — Actions & auto-waiting](./12-actions-and-auto-waiting.md)
