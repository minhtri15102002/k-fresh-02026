---
name: localization-testing
description: "Authors localization (l10n) and internationalization (i18n) tests: parameterises specs across the supported locales declared in the repo's translations/ folder, validates string presence and pluralisation, checks layout doesn't break with longest-locale text, and verifies dates / numbers / currencies / RTL formatting. Use when explicitly asked to 'add i18n tests', 'check localization', 'test all languages', 'verify the German layout', 'RTL audit', or before adding a new supported language. Distinct from accessibility-testing (which checks lang attributes) — this skill checks user-visible content correctness across locales."
---

# Localization Testing

A site that ships English-only confidently breaks with two languages and ships chaos with five. This skill catches the chaos: missing strings, broken pluralisation, layout overflow, RTL bugs, and date/number/currency mismatches.

## When to use this skill

- "Add i18n tests"
- "Check localization for `<feature>`"
- "Test all supported languages"
- "Verify the German / Arabic / Japanese layout"
- "RTL audit"
- Before adding a new supported language

## How to use it

### Phase 1 — Inventory the supported locales

Read [`translations/`](../../../translations) to find the locale codes shipped (e.g. `en-US`, `de-DE`, `fr-FR`, `ja-JP`, `ar-EG`).

If the project uses an i18n library (i18next, react-intl, vue-i18n) inspect its config to confirm. Stop and ask the user if locales aren't discoverable.

### Phase 2 — Parameterise specs across locales

```ts
// tests/ui/test-i18n-cart.spec.ts
import { test, expect } from '@playwright/test';
import { LOCALES } from '@data/locales-data';

for (const locale of LOCALES) {
  test(
    `[${locale.code}] cart page renders without overflow`,
    { tag: ['@P2', '@major', '@regression', '@i18n', '@cart'] },
    async ({ page, cartPage }) => {
      await page.goto(`/?lang=${locale.code}`);
      await cartPage.goto();
      await cartPage.assertNoStringMissingMarkers();   // catches "[missing]: cart.title"
      await cartPage.assertNoLayoutOverflow();          // checks scrollWidth ≤ clientWidth on key blocks
      await cartPage.assertCurrencyFormat(locale.expectedCurrencyExample); // "€10,00" for de-DE
    },
  );
}
```

### Phase 3 — The l10n smell catalogue

| Smell | What to assert |
|---|---|
| Missing string | no element contains `[missing]:` or the raw key (e.g. `cart.title`) |
| Truncation / overflow | `scrollWidth ≤ clientWidth` on titles, buttons, badges |
| Wrong pluralisation | "1 item" vs. "2 items" in EN; CLDR rules in PL/RU/AR |
| Wrong currency | `€` for EUR locales, `¥` for JP — never raw "USD" everywhere |
| Wrong date format | `dd/MM/yyyy` for EU vs. `MM/dd/yyyy` for US |
| Wrong number format | thousands separator ` `,`,`.`, `'` per locale |
| RTL bugs | `dir="rtl"` set; mirrored layout; icon directionality (← / →) |
| Concatenated strings | `"Welcome, " + name + "!"` won't translate — flag it |
| Hard-coded English | any visible text that isn't from the i18n bundle |

### Phase 4 — Visual snapshots per locale

Tightly scoped per-locale screenshots catch overflow / RTL bugs that DOM assertions miss:

```ts
await expect(page).toHaveScreenshot(`cart-${locale.code}.png`, {
  mask: [page.getByTestId('clock')],
  animations: 'disabled',
});
```

Triage failures via [`visual-regression-reviewer`](../visual-regression-reviewer/SKILL.md).

### Phase 5 — Tagging

Use `@i18n` (always), `@rtl` (only for RTL-script tests), and feature tags. Validate via [`test-tags-validator`](../test-tags-validator/SKILL.md). If `@i18n` isn't in the canonical taxonomy yet, add it to [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) first.

## Best practices

- **Test the longest-string locale.** German concatenation is famous for breaking buttons; Russian/Polish for breaking pluralisation.
- **Always test RTL.** One Arabic/Hebrew test catches a class of layout bugs no other locale will.
- **Don't translate test data.** Test data stays in `data/`, English-only; only the SUT's locale changes.
- **Fail fast on missing keys.** A missing translation should be a CI-blocking test, not a runtime user discovery.
- **Keep one canary locale per language family.** Don't multiply maintenance: 1 EN, 1 DE, 1 FR, 1 JA, 1 AR is plenty.

## Related

- [`.agents/skills/accessibility-testing/SKILL.md`](../accessibility-testing/SKILL.md) — sibling: lang attributes, screen-reader names
- [`.agents/skills/visual-regression-testing/SKILL.md`](../visual-regression-testing/SKILL.md) — author per-locale screenshots
- [`.agents/skills/visual-regression-reviewer/SKILL.md`](../visual-regression-reviewer/SKILL.md) — triage their diffs
- [`.agents/skills/test-data-generator/SKILL.md`](../test-data-generator/SKILL.md) — locale-tagged data fixtures
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — add `@i18n` / `@rtl` if not present
