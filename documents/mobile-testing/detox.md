# Detox — Mobile Testing Guideline

> The **default tool for React Native apps**. Built and maintained by Wix; uses the React Native bridge directly so it's ~5x faster than Appium for the same RN flow. Jest-based test runner.
>
> Read [`README.md`](./README.md) first for the shared discipline (POM, accessibility IDs, device matrix, dashboard contract). This doc is the **Detox-specific implementation** of that contract.

## TL;DR

- Author specs as `.e2e.ts` under `tests/mobile/detox/e2e/`.
- One **build** per app variant (`detox build --configuration <name>`); one **test** run per device configuration (`detox test --configuration <name>`).
- Locators class wraps `element(by.id(...))` calls; spec files never call `element(...)` directly.
- `.detoxrc.js` defines build + device configurations; per-device matrix is one config entry per row.
- CI gates on Jest exit code; emits `reports/mobile-summary.json` for the dashboard.

## When to actually pick Detox

The decision matrix in [`tool-comparison.md`](./tool-comparison.md) gives the rule. Practical triggers:

- The app is **React Native** (Expo or bare).
- You want sub-30-second per-test runs (Appium is ~2-3 minutes per test).
- You need access to the **RN bridge** for state inspection / mocking native modules.

If the app is **not React Native**, use [`appium.md`](./appium.md). If it's React Native but you also need to test **WebView screens that use native browser APIs not exposed via the RN bridge**, use Appium for those flows specifically (Detox is RN-bridge-bound).

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local (iOS) | `brew tap wix/brew && brew install applesimutils && xcode-select --install` | `applesimutils@latest` |
| Android local | Android Studio + SDK Platform-Tools (bundled) | latest stable |
| Detox + Jest | `npm i -D detox@20.x jest@29.x @types/jest ts-jest typescript` | `detox@20.x` |
| Type definitions | `npx detox init` (run once) — generates `.detoxrc.js` + `e2e/` skeleton | n/a |
| Doctor | `detox doctor` — fail-fast config check | n/a |

Pin Detox + RN versions together — Detox supports RN N-2; using RN 0.74 with Detox 19 is unsupported.

## Project layout in this repo

```
tests/mobile/detox/
├── README.md                         ← link back to documents/mobile-testing/detox.md
├── package.json                      ← pinned detox + jest
├── tsconfig.json                     ← extends ../../../tsconfig.json
├── .detoxrc.js                       ← build + device configurations (env-driven)
├── jest.config.js                    ← jest with detox/runners/jest preset
├── lib/
│   ├── reset.ts                      ← device.reloadReactNative() helper for state reset
│   ├── caps.ts                       ← env → configuration name mapping
│   └── summary.ts                    ← writes reports/mobile-summary.json
├── locators/
│   ├── cart-locators.ts
│   └── checkout-locators.ts
├── pages/
│   ├── cart-page.ts
│   └── checkout-page.ts
└── e2e/
    ├── cart.e2e.ts
    └── checkout.e2e.ts
```

`reports/mobile-summary.json` is the **dashboard contract** ([`README.md`](./README.md)). Always emit via `lib/summary.ts`.

## `.detoxrc.js` — build + device configurations

```javascript
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: { args: { config: 'jest.config.js' } },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      build: 'xcodebuild -workspace ios/Phoenix.xcworkspace -scheme Phoenix -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Phoenix.app',
    },
    'ios.release': {
      type: 'ios.app',
      build: 'xcodebuild -workspace ios/Phoenix.xcworkspace -scheme Phoenix -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Phoenix.app',
    },
    'android.debug': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
    'android.release': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
    },
  },
  devices: {
    'sim.iphone-14':  { type: 'ios.simulator', device: { type: 'iPhone 14' } },
    'sim.iphone-12':  { type: 'ios.simulator', device: { type: 'iPhone 12' } },
    'emu.pixel-7':    { type: 'android.emulator', device: { avdName: 'Pixel_7_API_34' } },
    'attached.real':  { type: 'android.attached', device: { adbName: process.env.ADB_DEVICE } },
  },
  configurations: {
    // Convention: <platform>.<variant>.<device>
    'ios.debug.iphone-14':       { device: 'sim.iphone-14',  app: 'ios.debug' },
    'ios.release.iphone-14':     { device: 'sim.iphone-14',  app: 'ios.release' },
    'ios.debug.iphone-12':       { device: 'sim.iphone-12',  app: 'ios.debug' },
    'android.debug.pixel-7':     { device: 'emu.pixel-7',    app: 'android.debug' },
    'android.release.pixel-7':   { device: 'emu.pixel-7',    app: 'android.release' },
    'android.debug.attached':    { device: 'attached.real',  app: 'android.debug' },
  },
};
```

**One configuration per (platform, variant, device).** CI matrix iterates over configuration names; the spec file never knows which one is running.

## `jest.config.js`

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/e2e/**/*.e2e.ts'],
  testTimeout: 180_000,
  maxWorkers: process.env.MOBILE_FARM ? 4 : 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter', ['jest-junit', { outputDirectory: '../../reports/junit', outputName: 'detox.xml' }]],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  preset: 'ts-jest',
  verbose: true,
};
```

## Hello world — `pages/cart-page.ts` + `e2e/cart.e2e.ts`

```typescript
// tests/mobile/detox/locators/cart-locators.ts
// OWNER: @khanhdo
// PAGE: cart
import { element, by } from 'detox';

export class CartLocators {
  get btnUpdate()    { return element(by.id('update-cart')); }
  get cartTotal()    { return element(by.id('cart-total')); }
  get btnCheckout()  { return element(by.id('checkout')); }
  qtyInputForItem(itemId: string)  { return element(by.id(`qty-${itemId}`)); }
  removeBtnForItem(itemId: string) { return element(by.id(`remove-${itemId}`)); }
}
```

```typescript
// tests/mobile/detox/pages/cart-page.ts
// OWNER: @khanhdo
import { expect } from 'detox';
import { CartLocators } from '../locators/cart-locators';

export class CartPage extends CartLocators {
  async setQuantity(itemId: string, qty: number): Promise<void> {
    const input = this.qtyInputForItem(itemId);
    await input.clearText();
    await input.typeText(String(qty));
    await this.btnUpdate.tap();
  }

  async removeItem(itemId: string): Promise<void> {
    await this.removeBtnForItem(itemId).tap();
  }

  async assertTotal(expected: string): Promise<void> {
    await expect(this.cartTotal).toHaveText(expected);
  }

  async proceedToCheckout(): Promise<void> {
    await this.btnCheckout.tap();
  }
}
```

```typescript
// tests/mobile/detox/e2e/cart.e2e.ts
// OWNER: @khanhdo
// SCENARIO: cart-update-quantity
// SLO: tap → first paint < 100ms
// PLATFORMS: ios, android (cross-platform spec)
import { device } from 'detox';
import { CartPage } from '../pages/cart-page';

describe('Cart [@P1 @critical @cart]', () => {
  let cart: CartPage;

  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();   // ~2s; faster than relaunch (~5s) or reinstall (~60s)
    cart = new CartPage();
  });

  it('updates total when quantity changes', async () => {
    await cart.setQuantity('SKU-42', 3);
    await cart.assertTotal('$89.97');
  });

  it('removes item from cart [@P2 @major]', async () => {
    await cart.removeItem('SKU-42');
    await cart.assertTotal('$0.00');
  });
});
```

Three things this template enforces:

1. **Header is mandatory** — owner, scenario name, SLO, platforms.
2. **`device.reloadReactNative()` between tests** — RN-specific; reloads JS bundle without reinstalling. Native state is preserved (faster); use `device.launchApp({ newInstance: true })` only when you need a fully clean slate.
3. **Cross-platform spec by default** — Detox's `by.id` works identically on iOS and Android as long as the RN component sets `testID="..."`. Coordinate with the RN dev team — every interactive component needs a `testID`.

## Local run

```bash
# Build once per (app variant)
detox build --configuration ios.debug.iphone-14
detox build --configuration android.debug.pixel-7

# Run tests
detox test --configuration ios.debug.iphone-14
detox test --configuration android.debug.pixel-7

# Loop while developing — rebuild + retest
detox test --configuration ios.debug.iphone-14 --record-logs all --take-screenshots failing
```

Exit codes (Jest):

| Code | Meaning |
|---|---|
| `0` | All tests passed |
| `1` | One or more tests failed |
| `non-zero (other)` | Detox / device error (build failed, simulator didn't boot, app missing) |

## CI — GitHub Actions

```yaml
mobile-detox-pr:
  if: github.event_name == 'pull_request' && contains(github.event.pull_request.changed_files, 'tests/mobile/detox/')
  strategy:
    fail-fast: false
    matrix:
      include:
        - { os: macos-14,     config: ios.debug.iphone-14 }
        - { os: ubuntu-latest, config: android.debug.pixel-7 }
  runs-on: ${{ matrix.os }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 'lts/*', cache: 'npm' }
    - run: npm ci
      working-directory: tests/mobile/detox

    # --- iOS-specific: install applesimutils + xcodebuild already on macos runner
    - name: Install applesimutils (iOS)
      if: startsWith(matrix.config, 'ios')
      run: brew tap wix/brew && brew install applesimutils

    # --- Android-specific: emulator + AVD setup
    - name: AVD cache
      if: startsWith(matrix.config, 'android')
      uses: actions/cache@v4
      with:
        path: ~/.android/avd/*
        key: avd-api-34-pixel-7

    - name: Boot emulator (Android)
      if: startsWith(matrix.config, 'android')
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 34
        target: google_apis
        arch: x86_64
        avd-name: Pixel_7_API_34
        script: echo "emulator booted"

    - name: Build app
      working-directory: tests/mobile/detox
      run: npx detox build --configuration ${{ matrix.config }}

    - name: Run Detox tests
      working-directory: tests/mobile/detox
      run: npx detox test --configuration ${{ matrix.config }} --record-logs failing --take-screenshots failing

    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: detox-${{ matrix.config }}
        path: |
          tests/mobile/detox/artifacts/
          reports/junit/
          reports/mobile-summary.json
        retention-days: 14
```

> **Note:** Detox does not have first-class device-farm integration the way Appium does. For real-device coverage of an RN app, the common patterns are:
>
> 1. **AWS Device Farm** with custom test environment + `detox test` invoked via the runner harness (works but heavy setup).
> 2. **In-house mac-mini lab** running `detox test --configuration <attached.real>` against a USB-tethered device (cheap, scales poorly).
> 3. **Run Appium on the same RN app** for the real-device leg only (your fast PR gate is Detox; the slow real-device gate is Appium).
>
> Most RN teams accept simulator-only Detox + manual real-device exploratory testing per release. If you need automated real-device on RN, file an RFC.

## Anti-patterns specific to Detox

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Calling `element(by.id(...))` directly in `*.e2e.ts` | Locator strategy spreads across spec files; PRs become unreviewable | Locators class only; spec calls page method |
| Using `device.launchApp()` (no `newInstance: true`) between tests when state matters | Subtle state leakage between tests; flake | `beforeEach` → `device.reloadReactNative()` for fast clean slate; `newInstance: true` for full reset |
| Skipping `testID` on a new RN component | Test can't target it; falls back to fragile text match | RN dev contract: every interactive component sets `testID="kebab-case-id"` |
| Mixing Detox + Appium specs in the same folder | Different runners; CI matrix gets confusing; team conflates issues | `tests/mobile/detox/` vs `tests/mobile/appium/` — fully separate |
| Running `detox test` without first `detox build` for that configuration | "App not found" error mid-run; CI minutes wasted | Two-step in CI: build, then test; use `--no-build` only when you genuinely just rebuilt |
| Using `await element(...).tap()` without `waitFor` for async-loaded elements | Flake when the element renders late | `await waitFor(element(by.id('foo'))).toBeVisible().withTimeout(5000)` then `.tap()` |
| Asserting on screenshots without locking simulator settings (font scale, language, region) | Pixel diffs differ run-to-run; everything looks like a regression | Lock the simulator settings via `xcrun simctl` in CI; one baseline per (config) |
| Using Detox for non-RN parts of a hybrid app | Doesn't work — Detox is RN-bridge-bound | Use Appium for the non-RN flows; share `pages/` if practical |
| Not pinning Detox + RN together | Surprise breakage on RN minor bumps | Lock both in `package.json`; bump in lockstep |

## Cross-references

- [`README.md`](./README.md) — shared discipline (POM, accessibility IDs, device matrix, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when Detox isn't the right pick (non-RN apps).
- [`appium.md`](./appium.md) — for native iOS / Android / Hybrid (non-RN) apps; also for the real-device leg of an RN app if you need automated real-device coverage.
- [`playwright-mobile-web.md`](./playwright-mobile-web.md) — for mobile-responsive web only.
- [`.agents/skills/mobile-testing/SKILL.md`](../../.agents/skills/mobile-testing/SKILL.md) — author skill.
- [`.agents/skills/accessibility-testing/SKILL.md`](../../.agents/skills/accessibility-testing/SKILL.md) — TalkBack / VoiceOver assertions on mobile.
- [`.agents/skills/visual-regression-testing/SKILL.md`](../../.agents/skills/visual-regression-testing/SKILL.md) — per-device baselines.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — canonical workflow shape.
- Official: [Detox docs](https://wix.github.io/Detox/) · [matchers](https://wix.github.io/Detox/docs/api/matchers) · [device API](https://wix.github.io/Detox/docs/api/device) · [troubleshooting](https://wix.github.io/Detox/docs/troubleshooting/running-tests).
