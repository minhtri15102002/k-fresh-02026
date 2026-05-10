# Module 17 — `commonPage` Discipline

> Phase 3 · Effort: 4h · Prerequisites: Module 16

## Learning objectives

After this module you can:

- Recite the **DIRECT-LOCATOR ACTIONS — FORBIDDEN** rule from `prompts/core/pom-generator.md`.
- Replace any direct `Locator` call with the corresponding `commonPage` helper.
- Recognize the three legitimate exceptions (locator chainers, locator construction, assertions).
- Recognize the helper-widening cases and emit a `## Missing Helper` follow-up correctly.

## Why it matters

Without this rule, every feature page reinvents waits, error handling, logging, and retries. With it, behavior is uniform, traces are readable, and the test framework gets better one helper at a time. This is **the** rule code reviewers cite most often in this repo.

## Concepts

### The rule (one sentence)

> Inside every feature page object, every interaction with a `Locator` (or `this.page`) must be routed through `this.commonPage.<verb>(this.<locator>, ...)`.

### Why

- **Uniform tracing** — every step shows up in the Allure report and trace as `commonPage.click(<role-name>)`.
- **Centralized hardening** — when one helper needs `scrollIntoView` before click, every page benefits.
- **Single entry-point for retries / error messages** — the helper layer is the right place.
- **Future-proofing** — if Playwright deprecates an API, you change *one* file, not 50.

### The forbidden table (excerpt — full canonical version in `prompts/core/pom-generator.md`)

| Forbidden | Use instead |
|---|---|
| `await this.btn.click()` | `await this.commonPage.click(this.btn)` |
| `await this.inp.fill(v)` | `await this.commonPage.fill(this.inp, v)` |
| `await this.inp.clear()` | `await this.commonPage.clear(this.inp)` |
| `await this.chk.check()` | `await this.commonPage.check(this.chk)` |
| `await this.btn.hover()` | `await this.commonPage.hover(this.btn)` |
| `await this.ddl.selectOption('a')` | `await this.commonPage.selectOption(this.ddl, 'a')` |
| `await this.btn.scrollIntoViewIfNeeded()` | `await this.commonPage.scrollTo(this.btn)` |
| `await this.lbl.innerText()` | `await this.commonPage.innerText(this.lbl)` |
| `await this.lbl.textContent()` | `await this.commonPage.textContent(this.lbl)` |
| `await this.img.getAttribute('src')` | `await this.commonPage.getAttribute(this.img, 'src')` |
| `await this.btn.isVisible()` | `await this.commonPage.isVisible(this.btn)` |
| `await this.chk.isChecked()` | `await this.commonPage.isChecked(this.chk)` |
| `await this.row.count()` | `await this.commonPage.count(this.row)` |
| `await this.btn.waitFor({ state: 'visible' })` | `await this.commonPage.waitForVisible(this.btn)` |
| `await this.page.click(selector)` | declare a locator first; then `commonPage.click(this.<loc>)` |
| `await this.page.waitForLoadState()` | `await this.commonPage.waitForPageLoad()` |

### Allowed exceptions (not violations)

1. **Locator chainers** — `this.row.first()`, `.last()`, `.nth(i)`, `.filter({...})`. They return a derived `Locator`; pass that to `commonPage`.
2. **Locator construction inside `locatorInitialization()`** — the locator class still calls `this.page.locator(...)` and `getByRole(...)`. That's where they belong.
3. **Assertions** go through `assertHelper`, **not** `commonPage`. Don't "fix" `assertHelper.assertElementVisible` into `commonPage.isVisible` (Module 18).

### Helper-widening exceptions

Some Playwright shapes don't have a 1:1 helper. **Don't bypass — emit a `## Missing Helper` follow-up.** Known gaps today:

- `selectOption({ index })`, `{ label }`, `{ value }` — helper accepts only `string | string[]`.
- `inputValue()` — no `commonPage.inputValue` yet.
- `waitFor({ state, timeout })` with custom `timeout`.
- `isVisible({ timeout })` with custom `timeout` and `.catch(...)` chain.
- `page.waitForLoadState('domcontentloaded' | 'networkidle')` (custom state).

Correct response when you hit one:

```
## Missing Helper

`commonPage.inputValue(locator: Locator): Promise<string>` — needed by
`product-page.ts:verifyQuantityFillSucceeded()`. Wraps `await locator.inputValue()`
with `expect.poll` for retry. Add to `pages/common-page.ts` and use here.
```

### How to refactor old code (recipe)

1. `rg "this\.\w+\.(click|fill|hover|check|uncheck|clear|press|selectOption|innerText|textContent|getAttribute|isVisible|isChecked|count|scrollIntoViewIfNeeded|waitFor|isEnabled|isDisabled|isEditable)\(" pages/`
2. For each match, look up the corresponding `commonPage.<verb>` in the table.
3. Replace.
4. Run `npm run typecheck && npm run linter`.
5. PR with a comment listing every file/line you changed.

### Quick example

```ts
// before (forbidden)
async addAddress(addr: Address): Promise<void> {
  await this.inputZip.fill(addr.zip);
  await this.ddlCountry.selectOption(addr.country);
  await this.btnSave.click();
}

// after (correct)
async addAddress(addr: Address): Promise<void> {
  await this.commonPage.fill(this.inputZip, addr.zip);
  await this.commonPage.selectOption(this.ddlCountry, addr.country);
  await this.commonPage.click(this.btnSave);
}
```

## Hands-on lab

1. Read `prompts/core/pom-generator.md` § DIRECT-LOCATOR ACTIONS — FORBIDDEN end-to-end.
2. Pick a UI page object you haven't read. Audit it:
   - List any direct calls.
   - Refactor to `commonPage`.
   - For anything the helper doesn't support, write a `## Missing Helper` block.
3. Open the PR. The reviewer will use this rule as their checklist.

## Self-check

- [ ] Recite the rule in one sentence.
- [ ] Why is `await this.btn.click()` forbidden inside `pages/ui/`?
- [ ] You need `selectOption({ index: 2 })`. What's your move?
- [ ] List 3 *legitimate* exceptions (when direct locator calls are still allowed).

## Further reading

- `prompts/core/pom-generator.md` (canonical)
- `pages/common-page.ts` (the helper class)

---

**Prev:** [16 — 3-layer architecture](./16-three-layer-architecture.md) · **Next:** [18 — Assertion routing](./18-assertion-routing.md)
