# Playwright Mobile-Web — Mobile Testing Guideline

> The **mobile-responsive-web lane**. Reuses this repo's existing Playwright setup (`playwright.config.ts`, `pages/`, `tests/`) with mobile device emulation — *no new framework, no new CI runner, no new locator strategy*. Cheapest mobile coverage you can ship.
>
> Read [`README.md`](./README.md) first for the shared discipline (POM, accessibility IDs, device matrix, dashboard contract). This doc is the **Playwright-mobile-web-specific implementation** of that contract.

## TL;DR

- Two new Playwright projects in [`playwright.config.ts`](../../playwright.config.ts) — `Mobile Chrome` (Pixel 5) and `Mobile Safari` (iPhone 12). They're already in the config file, **commented out**; uncomment to enable.
- Specs live in the existing `tests/` tree — same files, same `pages/`, same locators class. Tag with `@mobile-web` so the dashboard can split them.
- Local: `npx playwright test --project="Mobile Safari"`. CI: add `Mobile Safari` / `Mobile Chrome` to the matrix.
- Dashboard contract: same as desktop — `reports/run-summary.json` already has the project name; downstream skills already know how to pivot on it.

## When to actually pick Playwright mobile-web

The decision matrix in [`tool-comparison.md`](./tool-comparison.md) gives the rule. Practical triggers:

- The product is a **responsive web app** (no native shell). E.g. the LambdaTest e-commerce playground this repo tests against.
- You want **mobile-viewport regression** without paying for a device farm.
- You need **fast PR-gate mobile coverage** (Playwright on a mobile project ≈ same speed as desktop project).
- You're testing the **mobile-web fallback** of a hybrid app (the WebView screens) — Playwright can drive them in isolation, faster than spinning up a hybrid app.

> **Hard limit:** Playwright drives a **WebKit / Chromium engine** with a mobile viewport — *not* a real iOS / Android system. It cannot test:
>
> - Native gestures beyond what a touch-emulating browser supports
> - Native APIs (camera, biometrics, push, deep links)
> - OEM-specific browsers (Samsung Internet, MIUI Browser)
> - Real-device sensors / hardware
>
> If any of those apply, you need [`appium.md`](./appium.md) or [`detox.md`](./detox.md). Playwright mobile-web is a complement, not a substitute.

## Install

Nothing new. The repo already has Playwright (`@playwright/test` in [`package.json`](../../package.json)), and the mobile projects are pre-defined in [`playwright.config.ts`](../../playwright.config.ts). To enable:

1. Uncomment the `Mobile Chrome` and `Mobile Safari` blocks in `playwright.config.ts` `projects:` array.
2. Run `npx playwright install` to fetch the WebKit + Chromium browsers if you haven't already.
3. Test locally: `npx playwright test --project="Mobile Safari"`.

That's it. No second framework, no second runner, no second config tree.

## Project layout in this repo

**No new top-level folder.** Playwright mobile-web reuses everything:

```
tests/                                ← existing folder; mobile-web specs live here too
├── ui/
│   ├── test-cart.spec.ts             ← runs on ALL projects (desktop + mobile if @mobile-web tag matches)
│   ├── test-checkout.spec.ts
│   └── mobile/                       ← optional sub-folder for mobile-only specs
│       ├── test-mobile-nav.spec.ts   ← burger menu, swipe-to-close drawer, etc.
│       └── test-mobile-checkout.spec.ts
└── api/                              ← API tests don't change

pages/
└── ui/                               ← existing pages reused; add a sub-class only when mobile UX truly diverges
    ├── cart-page.ts                  ← shared
    ├── checkout-page.ts              ← shared
    └── mobile/
        └── mobile-nav-page.ts        ← only when the desktop page doesn't apply

playwright.config.ts                  ← uncomment 'Mobile Chrome' + 'Mobile Safari' projects
```

When the mobile UX is **truly different** (burger menu instead of nav bar, drawer cart instead of dropdown), introduce a `pages/ui/mobile/` sub-class. When it's just a smaller viewport, reuse the existing pages — they already use locators that work in both shapes.

## Enable the projects in `playwright.config.ts`

Currently in [`playwright.config.ts`](../../playwright.config.ts), the mobile projects are commented out (search for `// Mobile`). Replace those lines with:

```typescript
projects: [
  { name: 'Desktop Chrome',  use: { ...devices['Desktop Chrome'] } },
  { name: 'Desktop Firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'Desktop Safari',  use: { ...devices['Desktop Safari'] } },
  // Mobile-web — uncomment to enable
  { name: 'Mobile Chrome',   use: { ...devices['Pixel 7'] } },
  { name: 'Mobile Safari',   use: { ...devices['iPhone 14'] } },
  // Optional — older device class for regression
  // { name: 'Mobile Safari old', use: { ...devices['iPhone SE'] } },
],
```

Run `npx playwright test --list --project="Mobile Safari"` to confirm the project is recognised before commit.

## Hello world — `tests/ui/mobile/test-mobile-nav.spec.ts`

```typescript
// OWNER: @khanhdo
// SCENARIO: mobile-nav-burger-open-cart
// SLO: drawer-open animation < 400ms; tap → first paint < 100ms
// PROJECTS: Mobile Safari, Mobile Chrome
import { test, expect } from '@playwright/test';
import { MobileNavPage } from '@pages/ui/mobile/mobile-nav-page';
import { CartPage } from '@pages/ui/cart-page';

test.describe('Mobile nav [@P2 @major @mobile-web @cart]', () => {
  let nav: MobileNavPage;
  let cart: CartPage;

  test.beforeEach(async ({ page }) => {
    nav = new MobileNavPage(page);
    cart = new CartPage(page);
    await page.goto('/');
  });

  test('opens cart from burger menu', async () => {
    await nav.openBurger();
    await nav.tapCartLink();
    await expect(cart.cartTitle).toBeVisible();
  });
});
```

Three things this template enforces:

1. **Header is mandatory** — owner, scenario name, SLO, projects.
2. **Tags include `@mobile-web`** — the dashboard splits desktop / mobile-web rows by this tag.
3. **Reuse existing `CartPage`** — only the *navigation* differs on mobile; the cart itself is the same component. No duplication.

## Local run

```bash
# All projects (desktop + mobile)
npm run test:all

# Mobile only
npx playwright test --project="Mobile Safari" --project="Mobile Chrome"

# Just one mobile project + one spec file
npx playwright test --project="Mobile Safari" tests/ui/mobile/test-mobile-nav.spec.ts

# UI mode (mobile viewport with browser-side debug)
npx playwright test --project="Mobile Safari" --ui
```

Exit codes are Playwright's standard contract. The existing `npm run test:all` already wraps this; mobile projects join the run automatically once uncommented.

## CI — already wired

The existing [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml) shape (per [`documents/ci/github-actions.md`](../ci/github-actions.md)) iterates over Playwright projects via the same `--project` flag. **Once the projects are uncommented in `playwright.config.ts`, CI picks them up automatically** — no workflow file changes required.

If you want **mobile-web on PR but desktop-only on cron** (or vice versa), gate via the existing `TEST_TYPE` env var pattern documented in `documents/ci/shared-conventions.md`:

```yaml
- name: Run mobile-web suite (PR only)
  if: github.event_name == 'pull_request'
  run: npx playwright test --project="Mobile Safari" --project="Mobile Chrome"
```

## Visual baselines on mobile-web

Same flow as desktop, but **per-project baselines**. Playwright already namespaces snapshots by project name:

```
tests/ui/mobile/__screenshots__/test-mobile-nav.spec.ts/
├── mobile-nav-Mobile-Safari-darwin.png
├── mobile-nav-Mobile-Chrome-linux.png
└── mobile-nav-Mobile-Safari-linux.png   ← CI's renderer differs from local macOS
```

Always update baselines in CI on Linux (the canonical renderer); never commit Darwin baselines as the source of truth. See [`.agents/skills/visual-regression-testing/SKILL.md`](../../.agents/skills/visual-regression-testing/SKILL.md) for the full workflow.

## Mobile-web vs native — what mobile-web ACTUALLY catches

A defensive list, because teams routinely over-claim or under-claim mobile-web coverage.

| Catches | Doesn't catch |
|---|---|
| Responsive layout breakage at mobile viewports | Native gesture handling (long-press, force-touch, edge swipes) |
| Touch-friendly tap-target sizing (≥44×44pt is testable via bounding box) | Real-device performance (animations / scroll-jank) |
| Mobile-only DOM elements (burger menu, drawer cart, bottom-sheet modals) | Camera, biometrics, push, deep links |
| Mobile-only CSS (`@media (hover: none)`, `safe-area-inset`) | OEM browser quirks (Samsung Internet's autofill, MIUI's tap delay) |
| Visual diffs at known device dimensions | Real-device fonts + emoji rendering (subtle pixel diffs) |
| User-Agent-conditional behaviour (mobile-only features behind UA sniff) | App store review checks (only relevant for native shells) |

**Rule:** if the bug exists in a mobile browser, mobile-web tests can catch it. If the bug exists *only* in the native shell or on real hardware, you need [`appium.md`](./appium.md) or [`detox.md`](./detox.md).

## Anti-patterns specific to Playwright mobile-web

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Testing native-only flows in Playwright mobile-web | The flow doesn't exist in the WebKit engine; you'll write tests that pass meaninglessly | Use [`appium.md`](./appium.md); don't fake-test what you can't actually exercise |
| Asserting cold-launch / app-startup time | There's no app to launch; you're measuring page load | Use Lighthouse for web vitals; Appium for native cold-launch |
| One spec running on desktop AND mobile without `@mobile-web` tag | Dashboard can't split projects by surface; "is this a mobile bug or a desktop bug?" gets ambiguous | Always tag mobile-only specs with `@mobile-web`; cross-surface specs get both `@desktop` and `@mobile-web` |
| Sharing visual baselines across `Mobile Safari` and `Mobile Chrome` | Renderer engines differ; everything looks like a regression | Per-project baselines (Playwright handles this if you use the default snapshot path) |
| Hardcoding viewport size in `page.setViewportSize` instead of using `devices[...]` | Loses the device's real DPR / user-agent / touch-emulation settings | `use: { ...devices['iPhone 14'] }` always; only override individual fields |
| Skipping touch emulation (`hasTouch: true`) | Click events don't fire the same way as taps; subtle bugs slip through | `devices[...]` already sets `hasTouch: true`; never override to false |
| Treating mobile-web pass as "we have mobile coverage" | False sense of safety; native bugs ship to prod | Always pair with a real-device smoke (Appium / Detox) before release |

## Cross-references

- [`README.md`](./README.md) — shared discipline (POM, accessibility IDs, device matrix, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when Playwright mobile-web isn't enough (native flows).
- [`appium.md`](./appium.md) — for true native iOS / Android / Hybrid.
- [`detox.md`](./detox.md) — for React Native.
- [`playwright.config.ts`](../../playwright.config.ts) — where the mobile projects live (currently commented out).
- [`documents/automation-framework/pages.md`](../automation-framework/pages.md) — POM contract for desktop, reused by mobile-web.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — CI shape; mobile projects join the existing matrix automatically.
- [`.agents/skills/mobile-testing/SKILL.md`](../../.agents/skills/mobile-testing/SKILL.md) — author skill.
- [`.agents/skills/visual-regression-testing/SKILL.md`](../../.agents/skills/visual-regression-testing/SKILL.md) — per-project baselines.
- [`.agents/skills/accessibility-testing/SKILL.md`](../../.agents/skills/accessibility-testing/SKILL.md) — a11y on mobile viewports (axe-core works, but TalkBack / VoiceOver need real-device).
- Official: [Playwright Devices](https://playwright.dev/docs/emulation#devices) · [mobile emulation](https://playwright.dev/docs/emulation) · [touch events](https://playwright.dev/docs/api/class-page#page-tap).
