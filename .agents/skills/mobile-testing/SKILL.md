---
name: mobile-testing
description: "Authors mobile end-to-end tests for iOS and Android: picks the right tool (Appium for native + WebView, Detox for React Native, Playwright for mobile-web-only), writes a deterministic POM-style suite, wires device matrices in CI, and emits accessibility / visual / performance budgets adapted to mobile. Use when explicitly asked to 'add mobile tests', 'test the iOS app', 'test the React Native build', 'mobile coverage for `<feature>`', or before a mobile release. Distinct from playwright-skill (desktop / mobile-web only); this skill covers truly native scenarios."
---

# Mobile Testing

Mobile testing has three completely different stacks depending on what you're testing. Picking the wrong one costs months. This skill makes the choice explicit, then authors the suite.

## When to use this skill

- "Add mobile tests"
- "Test the iOS / Android app"
- "Test the React Native build"
- "Mobile coverage for `<feature>`"
- Before any mobile release

## Tool decision tree

```
What are you testing?
├── A web app on a mobile browser            → Playwright with `devices['iPhone 13']` (already in repo)
├── A React Native app                       → Detox (jest-runner; native bridge)
├── A native iOS / Android / Hybrid app      → Appium 2.x with WebDriver protocol
├── A flutter app                            → flutter integration_test (or appium-flutter-driver)
└── Both native + web                        → Appium for native, Playwright for web; share fixtures
```

## How to use it

### Phase 1 — Pick & install

| Tool | Install | Best for |
|---|---|---|
| Playwright (mobile-web) | already in this repo | mobile-web responsive flows |
| Detox | `npm i -D detox` + `pod install` (iOS) | React Native, fastest feedback |
| Appium | `npm i -D appium webdriverio` + drivers | true native, hybrid, mature |
| Flutter integration_test | `flutter pub add integration_test --dev` | Flutter apps |

### Phase 2 — POM contract (same shape as desktop)

Mirror this repo's two-class POM (locators + page) so engineers don't context-switch:

```ts
// mobile/locators/cart-locators.ts (Appium-WebdriverIO example)
export class CartLocators {
  constructor(private readonly $: WebdriverIO.Browser) {}
  get btnUpdate()    { return this.$.$('~update-cart');    } // ~ = accessibilityId
  get cartTotal()    { return this.$.$('~cart-total');     }
  get qtyByItem()    { return (id: string) => this.$.$(`~qty-${id}`); }
}

// mobile/pages/cart-page.ts
export class CartPage extends CartLocators {
  async setQuantity(itemId: string, qty: number) {
    await this.qtyByItem(itemId).clearValue();
    await this.qtyByItem(itemId).setValue(qty);
    await this.btnUpdate.click();
  }
  async assertTotal(expected: string) {
    await expect(this.cartTotal).toHaveText(expected);
  }
}
```

Use **accessibility IDs** (`~id`) wherever possible — they double as a11y signal AND survive UI rewrites.

### Phase 3 — Device matrix

In CI:

| Stack | Where to define matrix |
|---|---|
| Playwright mobile-web | `playwright.config.ts` projects: `Mobile Safari`, `Pixel 5` |
| Detox | `.detoxrc.js` `configurations` block |
| Appium | GitHub Actions matrix → SauceLabs / BrowserStack / Firebase Test Lab |

Suggested baseline (smoke):
- iPhone 14 — iOS 17
- Pixel 7 — Android 14
- Optionally: 1 older device class for regression

### Phase 4 — Mobile-specific budgets

Adapt budgets to mobile constraints:

| Metric | Desktop | Mobile |
|---|---|---|
| LCP | 2.5s | 4.0s |
| Tap → first paint | n/a | < 100ms |
| Cold launch | n/a | < 3s |
| App size impact | n/a | < +500kB per release |

Wire these into the spec via [`performance-testing`](../performance-testing/SKILL.md) patterns.

### Phase 5 — A11y on mobile

```ts
// Detox / Appium have built-in a11y assertions
await expect(element(by.label('Update cart'))).toBeAccessible();
```

Also run [`accessibility-testing`](../accessibility-testing/SKILL.md) patterns where applicable (mobile-web only — axe-core doesn't run inside native UI).

## Best practices

- **One stack per app.** Don't mix Detox and Appium for the same RN app — pick one, stick with it.
- **AccessibilityID, not XPath.** XPath on mobile is the locator equivalent of pneumonia.
- **Real devices in CI ≥ once a day.** Simulators lie about performance.
- **Mirror desktop POM shape.** Engineers swap projects; the POM contract should not.
- **Tag mobile specs.** Use `@mobile @ios` or `@mobile @android` on top of normal `@P1 @smoke` etc.

## Related

- [`.agents/skills/pom-architect/SKILL.md`](../pom-architect/SKILL.md) — POM contract this skill mirrors
- [`.agents/skills/playwright-skill/SKILL.md`](../playwright-skill/SKILL.md) — for mobile-web only
- [`.agents/skills/accessibility-testing/SKILL.md`](../accessibility-testing/SKILL.md) — a11y patterns
- [`.agents/skills/performance-testing/SKILL.md`](../performance-testing/SKILL.md) — adapt budgets to mobile
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — extend tags for `@mobile`
