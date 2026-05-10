# Module 08 — Web Fundamentals (HTML / CSS / DOM)

> Phase 1 · Effort: 4h · Prerequisites: Module 07

## Learning objectives

After this module you can:

- Read raw HTML and identify semantic elements, ARIA roles, and accessible names.
- Write CSS selectors fluently (id, class, attribute, descendant, pseudo-class).
- Navigate the **DOM tree** and the **Accessibility tree** in DevTools.
- Explain why **role-based locators beat CSS** for stability and a11y.
- Read an XPath expression and convert it to a Playwright role-based locator when possible.

## Why it matters

Locators are the heart of UI automation. The single biggest reason E2E tests are flaky is bad locators chasing CSS classes that change on every deploy. Understand the DOM and you stop writing brittle tests.

## Concepts

### HTML basics — semantic elements you'll meet daily

```html
<header>, <nav>, <main>, <article>, <section>, <aside>, <footer>
<form>, <fieldset>, <legend>, <label>, <input>, <button>, <select>, <textarea>
<table>, <thead>, <tbody>, <tr>, <th>, <td>
<dialog>, <details>, <summary>
```

Semantic tags carry **implicit ARIA roles**: `<button>` → `role="button"`, `<input type="checkbox">` → `role="checkbox"`. Locator hierarchy uses these roles.

### Accessible name (the text Playwright `getByRole(..., { name })` matches)

Computed from (in order):

1. `aria-labelledby` referenced text
2. `aria-label`
3. Associated `<label for>` for form controls
4. Visible text content
5. `title` attribute

If a developer puts `aria-label="Close"` on an `×` button, `getByRole('button', { name: 'Close' })` will find it cleanly.

### CSS selectors

| Selector | Matches |
|---|---|
| `*` | every element |
| `div` | every `<div>` |
| `.btn` | class `btn` |
| `#main` | id `main` |
| `[name="email"]` | attribute `name` exactly `"email"` |
| `[data-testid^="cart-"]` | attribute starts with |
| `[data-testid$="-row"]` | attribute ends with |
| `[data-testid*="product"]` | attribute contains |
| `nav > a` | direct child |
| `nav a` | descendant |
| `tr:nth-child(2)` | second child row |
| `input:checked` | UI state |
| `button:not([disabled])` | negation |

### XPath — last resort

```
//button[@aria-label="Close"]
(//div[contains(@class,"product-card")])[3]
//tr[td[text()="OPC2002"]]/td[2]
```

Powerful but **brittle and slow** in Playwright. Use only when a parent-relative or text-based selector is impossible (e.g. table cell relative to text in a sibling).

### DOM tree vs Accessibility tree

DevTools → **Elements** = DOM tree (what's rendered).
DevTools → **Accessibility** pane = the tree screen-readers and Playwright `getByRole` see.

The accessibility tree often has *fewer* nodes than the DOM (decorative `<div>`s collapsed). Always check the accessibility tree before writing a locator.

### CSS layout primer (so you can spot bugs)

- **Box model** — content, padding, border, margin.
- **Flexbox** vs **Grid** — knowing which the page uses helps you debug "button doesn't render" issues.
- **Responsive** — viewport queries; verify locators in mobile + desktop sizes.

### Forms behave specially

- Required field validation — HTML5 `required`, `pattern`.
- File inputs — Playwright uses `setInputFiles`, not `fill`.
- Selects — Playwright `selectOption({ value | label | index })`.
- Custom dropdowns (e.g. React Select) — usually NOT a `<select>`; use role-based locators.

## Hands-on lab

1. Open this repo's SUT (`https://ecommerce.test.com` per `Constants.BASE_URL`). Open DevTools.
2. Find the **Login button** using:
   - DOM tree → CSS selector
   - Accessibility tree → role + name
   Compare. Which is more stable?
3. Find the **password** field. Check its accessible name. If it's missing a label, file a defect (a11y).
4. Pick 5 locators in `locators/` that use `getByRole`. For each, find the DOM element and confirm the accessible name matches.
5. Identify 3 locators that use CSS or XPath. Could they be rewritten to `getByRole` / `getByLabel`? If yes, propose the change.

## Self-check

- [ ] What's an "accessible name" and where does it come from?
- [ ] Locator priority hierarchy from best → worst?
- [ ] Convert: `//button[contains(@class,"submit")]` → role-based locator.
- [ ] Why does this repo's locator naming convention (`prompts/core/locators-naming.md`) include role prefixes (`btn`, `lnk`, `chk`, `inp`, `lbl`, `ddl`)?

## Further reading

- MDN — HTML elements reference
- WAI-ARIA Authoring Practices — w3.org/WAI/ARIA/apg/
- Playwright docs — Best Practices for locators

---

**Prev:** [07 — TypeScript for QA](./07-typescript-for-qa.md) · **Next:** [09 — HTTP, REST & APIs](./09-http-rest-and-apis.md)
