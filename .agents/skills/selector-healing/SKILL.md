---
name: selector-healing
description: "Heals broken Playwright locators when the SUT's DOM has changed: detects which selector failed, opens the live page (via codegen / MCP), proposes a stable replacement using the locator-naming convention (prefer getByRole / data-test, avoid brittle CSS + XPath), updates the centralized locators class, and reruns the failing spec to confirm the fix. Use when explicitly asked to 'fix the broken locator', 'heal selectors', 'update the page object', or after failure-analyzer classifies a failure as `locator`. Wraps prompts/advanced/selector-healing.md and obeys prompts/core/locators-naming.md; never edits raw `locator(...)` calls inside spec files — only the centralized locators classes under locators/."
---

# Selector Healing

Locator drift is the #1 source of "test failed but nothing changed in our code" tickets. This skill diagnoses the drift, proposes a stable replacement, and applies it in the right place — which in this repo is the centralized [`locators/`](../../../locators) classes, never the spec.

---

## When to use this skill

Trigger on:
- "Fix the broken locator"
- "Heal selectors in `<page>`"
- "Update the page object — the DOM changed"
- After [`failure-analyzer`](../failure-analyzer/SKILL.md) returns class `locator`

Do **not** use when:
- The page hasn't actually changed → it's flake; use [`flaky-test-triage`](../flaky-test-triage/SKILL.md).
- The selector worked but found the wrong element (assertion mismatch, not locator timeout) → it's a real bug; use [`defect-report`](../defect-report/SKILL.md).
- The test uses raw `page.locator(...)` inside a spec → fix the architecture first per [`pom-architect`](../pom-architect/SKILL.md), then heal.

---

## How to use it

### Phase 1 — Confirm the drift

1. Read the failing spec; find the locator field (e.g. `cartLocators.btnUpdate`).
2. Open `locators/cart-locators.ts` to see the current selector.
3. Open the live page in the same env (QA / UAT / Staging) — `npx playwright codegen <baseUrl>` or the trace-analyzer DOM snapshot.
4. Confirm the element exists but the current selector misses it (e.g. `.btn-primary.update` → `.update-cart-button`).

If the element no longer exists at all → this is a defect, not drift. Stop and use `defect-report`.

### Phase 2 — Propose a stable replacement

Apply the priority ladder from [`prompts/core/locators-naming.md`](../../../prompts/core/locators-naming.md) and [`prompts/advanced/selector-healing.md`](../../../prompts/advanced/selector-healing.md):

```
1. getByRole + accessible name           ← strongly preferred
2. getByTestId / [data-test=…]
3. getByLabel / getByPlaceholder         ← form fields
4. getByText (exact, case-insensitive)
5. CSS — only when stable structural classes exist
6. XPath — last resort; document why
```

Examples:

| Brittle (before) | Stable (after) | Why |
|---|---|---|
| `.btn-primary:nth-child(3)` | `getByRole('button', { name: /update cart/i })` | survives DOM reshuffles |
| `div.row > span > a` | `getByTestId('cart-item-name')` | survives layout changes |
| `//button[contains(@class,'remove')]` | `getByRole('button', { name: 'Remove' })` | survives class renames |

### Phase 3 — Patch the locators class

Edit ONLY the centralized class (e.g. `locators/cart-locators.ts`). Never edit the spec.

```ts
// locators/cart-locators.ts
override locatorInitialization(): void {
  super.locatorInitialization();
  // before: this.btnUpdateCart = this.page.locator('.btn-primary:nth-child(3)');
  this.btnUpdateCart = this.page.getByRole('button', { name: /update cart/i });
}
```

### Phase 4 — Verify

```bash
npx playwright test tests/ui/test-cart.spec.ts -g "TC-CART-04"
```

If green, also run the broader suite for the affected feature tag:
```bash
npx playwright test --grep "@cart"
```

If still red → the failure isn't drift; route back to [`failure-analyzer`](../failure-analyzer/SKILL.md).

### Phase 5 — Document

In the commit message, note:
- Which locator changed
- Why the old one broke (e.g. "DOM shipped a new wrapper div")
- Which spec was the canary

If multiple locators broke from the same change, file an [internal note](../defect-report/SKILL.md) so the SUT team can stabilise selectors with `data-test` attributes upstream.

---

## Best practices

- **Heal in the locators class, never in the spec.** This repo's POM contract is in [`pom-generator.md`](../../../prompts/core/pom-generator.md) — violators get reverted in code review.
- **Prefer accessible roles over data-test.** Roles double as a11y signal; `data-test` is a fallback.
- **Keep selectors language-agnostic when possible.** Use regex (`/update cart/i`) for text matchers so localisation doesn't break the suite.
- **Never use `:nth-child` on dynamic lists.** Match by content (`.filter({ hasText: ... })`), not position.
- **Don't heal silently.** Always re-run the spec and one neighbour to catch over-fits.

---

## Related

- [`prompts/advanced/selector-healing.md`](../../../prompts/advanced/selector-healing.md) — full prompt
- [`prompts/core/locators-naming.md`](../../../prompts/core/locators-naming.md) — naming convention
- [`prompts/core/pom-generator.md`](../../../prompts/core/pom-generator.md) — POM contract this skill obeys
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md) — upstream classifier
- [`.agents/skills/pom-architect/SKILL.md`](../pom-architect/SKILL.md) — for fixing architectural violations before healing
- [`.agents/skills/test-fixing/SKILL.md`](../test-fixing/SKILL.md) — when the fix is more than a selector swap
