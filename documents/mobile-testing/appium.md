# Appium — Mobile Testing Guideline

> The **default tool for true-native + hybrid iOS / Android apps**. WebdriverIO + TypeScript on top of Appium 2.x with the official XCUITest (iOS) and UiAutomator2 (Android) drivers.
>
> Read [`README.md`](./README.md) first for the shared discipline (POM, accessibility IDs, device matrix, dashboard contract). This doc is the **Appium-specific implementation** of that contract.

## TL;DR

- Author specs as `.spec.ts` under `tests/mobile/appium/specs/<platform>/`.
- One Appium server per worker; one device per worker; never share devices.
- Locators class uses **accessibility IDs** (`~id`) first; XPath only as a last resort.
- `wdio.conf.ts` reads device caps from env vars; same spec runs against simulator (local) and real device (farm CI).
- CI gates on Jasmine/Mocha exit code; emits `reports/mobile-summary.json` for the dashboard.

## When to actually pick Appium

The decision matrix in [`tool-comparison.md`](./tool-comparison.md) gives the rule. Practical triggers:

- True native iOS / Android app (Swift / Objective-C / Kotlin / Java).
- **Hybrid app** (Cordova / Ionic / Capacitor) that needs WebView ↔ Native context switching.
- Native flow uses **camera / biometrics / push / deep links** that simulators can't fake.
- You need cross-platform spec reuse (one `cart.spec.ts` running on both iOS and Android with different caps).

If you're testing **React Native**, use [`detox.md`](./detox.md) — Detox is 5x faster on RN. If you're testing only **mobile-responsive web**, use [`playwright-mobile-web.md`](./playwright-mobile-web.md).

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local | `brew install --cask android-studio` (Android SDK + emulator) + `xcode-select --install` (iOS) + `npm i -g appium@2.11.0` | `appium@2.11.x` |
| Drivers | `appium driver install xcuitest && appium driver install uiautomator2` | `xcuitest@7.x`, `uiautomator2@3.x` |
| WebdriverIO + TS | `npm i -D @wdio/cli @wdio/local-runner @wdio/mocha-framework @wdio/spec-reporter @wdio/junit-reporter typescript ts-node webdriverio` | `@wdio/*@8.x` |
| iOS device tools | `brew install ios-deploy libimobiledevice` (real-device deploy) | latest stable |
| Android device tools | Android SDK Platform-Tools (`adb`, `emulator`) — bundled with Android Studio | latest stable |
| Doctor | `npx appium-doctor --ios && npx appium-doctor --android` (run after every install; fail-fast) | n/a |

Pin everything in CI — Appium driver minor versions occasionally introduce breaking capability changes.

## Project layout in this repo

```
tests/mobile/appium/
├── README.md                         ← link back to documents/mobile-testing/appium.md
├── wdio.conf.ts                      ← WebdriverIO config; reads env vars
├── tsconfig.json                     ← extends ../../../tsconfig.json
├── lib/
│   ├── caps.ts                       ← capabilities builder per device + platform
│   ├── device.ts                     ← detect local vs farm; wire farm credentials
│   ├── reset.ts                      ← terminateApp / activateApp helper for state reset
│   └── summary.ts                    ← writes reports/mobile-summary.json
├── locators/
│   ├── cart-locators.ts              ← one locators class per page
│   └── checkout-locators.ts
├── pages/
│   ├── cart-page.ts                  ← extends locators class
│   └── checkout-page.ts
├── specs/
│   ├── ios/
│   │   └── cart.spec.ts
│   └── android/
│       └── cart.spec.ts
└── apps/                             ← .gitignore'd; CI fetches the build artifact
    ├── ios/
    │   ├── Phoenix.app               ← simulator build
    │   └── Phoenix.ipa               ← real-device build (signed)
    └── android/
        └── app-release.apk
```

`reports/mobile-summary.json` is the **dashboard contract** ([`README.md`](./README.md) §"Where the suites live"). Always emit via `lib/summary.ts`.

## Hello world — `pages/cart-page.ts` + `specs/ios/cart.spec.ts`

```typescript
// tests/mobile/appium/locators/cart-locators.ts
// OWNER: @khanhdo
// PAGE: cart
import { Browser } from 'webdriverio';

export class CartLocators {
  constructor(protected readonly browser: Browser) {}

  // ~ prefix is WebdriverIO shorthand for accessibility-id (iOS + Android)
  get btnUpdate()           { return this.browser.$('~update-cart'); }
  get cartTotal()           { return this.browser.$('~cart-total'); }
  get btnCheckout()         { return this.browser.$('~checkout'); }
  qtyInputForItem(itemId: string) { return this.browser.$(`~qty-${itemId}`); }
  removeBtnForItem(itemId: string) { return this.browser.$(`~remove-${itemId}`); }
}
```

```typescript
// tests/mobile/appium/pages/cart-page.ts
// OWNER: @khanhdo
import { CartLocators } from '../locators/cart-locators';
import { expect } from '@wdio/globals';

export class CartPage extends CartLocators {
  async setQuantity(itemId: string, qty: number): Promise<void> {
    const input = this.qtyInputForItem(itemId);
    await input.clearValue();
    await input.setValue(String(qty));
    await this.btnUpdate.click();
  }

  async removeItem(itemId: string): Promise<void> {
    await this.removeBtnForItem(itemId).click();
  }

  async assertTotal(expected: string): Promise<void> {
    await expect(this.cartTotal).toHaveText(expected);
  }

  async proceedToCheckout(): Promise<void> {
    await this.btnCheckout.click();
  }
}
```

```typescript
// tests/mobile/appium/specs/ios/cart.spec.ts
// OWNER: @khanhdo
// SCENARIO: cart-update-quantity
// SLO: tap → first paint < 100ms; cold launch < 3s
// PLATFORM: ios
import { CartPage } from '../../pages/cart-page';
import { resetAppState } from '../../lib/reset';

describe('Cart — iOS', () => {
  let cart: CartPage;

  beforeEach(async () => {
    await resetAppState();   // terminateApp + activateApp; faster than reinstall
    cart = new CartPage(browser);
  });

  it('updates total when quantity changes [@P1 @critical @ios @cart]', async () => {
    await cart.setQuantity('SKU-42', 3);
    await cart.assertTotal('$89.97');
  });

  it('removes item from cart [@P2 @major @ios @cart]', async () => {
    await cart.removeItem('SKU-42');
    await cart.assertTotal('$0.00');
  });
});
```

Three things this template enforces:

1. **Header is mandatory** — owner, scenario name, SLO, platform.
2. **Tags follow [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md)** — same priority + severity + platform tags as the desktop suite. The dashboard pivots on these.
3. **`resetAppState`** between tests — never reinstall (~60s); always terminateApp + activateApp (~3s).

## `lib/caps.ts` — capabilities builder (env-driven)

```typescript
import { RemoteCapability } from '@wdio/types/build/Capabilities';

interface CapsOptions {
  platform: 'ios' | 'android';
  deviceName?: string;
  platformVersion?: string;
}

export function buildCaps(opts: CapsOptions): RemoteCapability {
  const farm = process.env.MOBILE_FARM;   // 'browserstack' | 'saucelabs' | 'firebase' | undefined (local)

  if (opts.platform === 'ios') {
    return {
      platformName: 'iOS',
      'appium:platformVersion': opts.platformVersion ?? process.env.IOS_VERSION ?? '17.5',
      'appium:deviceName':     opts.deviceName     ?? process.env.IOS_DEVICE   ?? 'iPhone 14',
      'appium:automationName': 'XCUITest',
      'appium:app':            process.env.IOS_APP_PATH ?? './apps/ios/Phoenix.app',
      'appium:noReset':        false,
      'appium:newCommandTimeout': 240,
      ...(farm === 'browserstack' ? bstackCaps('ios') : {}),
    };
  }
  return {
    platformName: 'Android',
    'appium:platformVersion': opts.platformVersion ?? process.env.ANDROID_VERSION ?? '14',
    'appium:deviceName':     opts.deviceName     ?? process.env.ANDROID_DEVICE   ?? 'Pixel_7_API_34',
    'appium:automationName': 'UiAutomator2',
    'appium:app':            process.env.ANDROID_APP_PATH ?? './apps/android/app-release.apk',
    'appium:noReset':        false,
    'appium:newCommandTimeout': 240,
    ...(farm === 'browserstack' ? bstackCaps('android') : {}),
  };
}

function bstackCaps(platform: 'ios' | 'android'): Record<string, unknown> {
  return {
    'bstack:options': {
      userName: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      projectName: 'Phoenix QA',
      buildName: process.env.GITHUB_RUN_ID ?? 'local',
      sessionName: `${platform}-${process.env.SCENARIO ?? 'unnamed'}`,
      debug: true,
      networkLogs: true,
    },
  };
}
```

**Never hardcode the device.** Same caps file runs against simulator (local) and real device (farm) via `MOBILE_FARM` + per-farm secrets.

## `wdio.conf.ts` — WebdriverIO config

```typescript
import { buildCaps } from './lib/caps';
import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: [
    process.env.PLATFORM === 'android'
      ? './specs/android/**/*.spec.ts'
      : './specs/ios/**/*.spec.ts',
  ],
  exclude: [],
  maxInstances: process.env.MOBILE_FARM ? 4 : 1,   // farms support parallel; locally one device
  capabilities: [buildCaps({ platform: (process.env.PLATFORM as 'ios' | 'android') ?? 'ios' })],

  // When MOBILE_FARM is set, we connect to the vendor's Appium endpoint;
  // otherwise to localhost (dev workstation must have `appium` running).
  hostname: process.env.MOBILE_FARM === 'browserstack'
    ? 'hub-cloud.browserstack.com'
    : '127.0.0.1',
  port: process.env.MOBILE_FARM ? 443 : 4723,
  protocol: process.env.MOBILE_FARM ? 'https' : 'http',

  framework: 'mocha',
  mochaOpts: { ui: 'bdd', timeout: 180_000 },
  reporters: [
    'spec',
    ['junit', { outputDir: '../../../reports/junit', outputFileFormat: () => `appium-${Date.now()}.xml` }],
  ],
  logLevel: 'warn',

  after: async function () {
    const { writeMobileSummary } = await import('./lib/summary');
    await writeMobileSummary({ tool: 'appium', platform: process.env.PLATFORM ?? 'ios' });
  },
};
```

## Local run

```bash
# Start the Appium server in one terminal
appium --base-path /wd/hub

# In another terminal — iOS simulator
PLATFORM=ios IOS_DEVICE='iPhone 14' IOS_VERSION='17.5' \
  npx wdio run wdio.conf.ts

# Android emulator
PLATFORM=android ANDROID_DEVICE='Pixel_7_API_34' ANDROID_VERSION='14' \
  npx wdio run wdio.conf.ts

# Real device via BrowserStack
MOBILE_FARM=browserstack \
  BROWSERSTACK_USERNAME=$BSTACK_USER \
  BROWSERSTACK_ACCESS_KEY=$BSTACK_KEY \
  PLATFORM=ios IOS_DEVICE='iPhone 14 Pro' IOS_VERSION='17.5' \
  IOS_APP_PATH='bs://abc123…' \   # uploaded once via BrowserStack REST
  npx wdio run wdio.conf.ts
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | All tests passed |
| `1` | One or more test assertions failed |
| `non-zero (other)` | Driver / framework error (Appium server down, app missing, capability mismatch) |

## CI — GitHub Actions

Two shapes — simulator/emulator on PR, real device on cron / pre-release.

```yaml
mobile-appium-pr:
  if: github.event_name == 'pull_request' && contains(github.event.pull_request.changed_files, 'tests/mobile/appium/')
  runs-on: macos-14   # iOS simulator only on macOS runners
  strategy:
    fail-fast: false
    matrix:
      platform: [ios, android]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 'lts/*', cache: 'npm' }
    - run: npm ci
      working-directory: tests/mobile/appium

    - name: Install Appium
      run: npm i -g appium@2.11.0
    - name: Install drivers
      run: |
        appium driver install xcuitest
        appium driver install uiautomator2

    - name: Download app artifact (built by app repo's release pipeline)
      uses: actions/download-artifact@v4
      with:
        name: phoenix-${{ matrix.platform }}-debug
        path: tests/mobile/appium/apps/${{ matrix.platform }}/

    - name: Boot simulator (iOS)
      if: matrix.platform == 'ios'
      run: xcrun simctl boot 'iPhone 14' && open -a Simulator

    - name: Start Android emulator (API 34)
      if: matrix.platform == 'android'
      uses: reactivecircus/android-emulator-runner@v2
      with:
        api-level: 34
        target: google_apis
        arch: x86_64
        script: echo "emulator booted"

    - name: Start Appium
      run: appium --base-path /wd/hub &

    - name: Run suite — ${{ matrix.platform }}
      env:
        PLATFORM: ${{ matrix.platform }}
        IOS_DEVICE: 'iPhone 14'
        IOS_VERSION: '17.5'
        ANDROID_DEVICE: 'Pixel_7_API_34'
        ANDROID_VERSION: '14'
      working-directory: tests/mobile/appium
      run: npx wdio run wdio.conf.ts

    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: appium-${{ matrix.platform }}-pr
        path: |
          reports/junit/
          reports/mobile-summary.json
        retention-days: 14

mobile-appium-real-device:
  if: github.event.schedule == '0 6 * * *' || github.event_name == 'workflow_dispatch'
  runs-on: ubuntu-latest    # any OS — runs against BrowserStack
  strategy:
    fail-fast: false
    matrix:
      include:
        - { platform: ios,     device: 'iPhone 14 Pro',  version: '17.5' }
        - { platform: ios,     device: 'iPhone 12',      version: '16.0' }   # older device class
        - { platform: android, device: 'Google Pixel 8', version: '14.0' }
        - { platform: android, device: 'Samsung Galaxy S23', version: '13.0' }
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 'lts/*', cache: 'npm' }
    - run: npm ci
      working-directory: tests/mobile/appium

    - name: Run on BrowserStack — ${{ matrix.platform }} ${{ matrix.device }}
      env:
        MOBILE_FARM: browserstack
        BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
        BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
        PLATFORM: ${{ matrix.platform }}
        IOS_DEVICE: ${{ matrix.device }}
        IOS_VERSION: ${{ matrix.version }}
        ANDROID_DEVICE: ${{ matrix.device }}
        ANDROID_VERSION: ${{ matrix.version }}
        IOS_APP_PATH: ${{ vars.BSTACK_IOS_APP_URL }}     # bs://… uploaded once
        ANDROID_APP_PATH: ${{ vars.BSTACK_ANDROID_APP_URL }}
      working-directory: tests/mobile/appium
      run: npx wdio run wdio.conf.ts

    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: appium-${{ matrix.platform }}-${{ matrix.device }}-real
        path: |
          reports/junit/
          reports/mobile-summary.json
        retention-days: 30
```

The simulator job runs on **every PR** that touches `tests/mobile/appium/`; the real-device job runs **nightly + on demand**. This balances cost (real-device farm minutes are expensive) and coverage (real-device is required to catch the 30% sims miss).

## Hybrid app — context switching

The trick most teams get wrong. Inside a hybrid app's WebView screen:

```typescript
// On a hybrid screen with a WebView
const contexts = await browser.getContexts();      // ['NATIVE_APP', 'WEBVIEW_com.phoenix.app']
await browser.switchContext('WEBVIEW_com.phoenix.app');

// Now standard CSS selectors work
await browser.$('button[data-test="submit-payment"]').click();

// Back to native chrome
await browser.switchContext('NATIVE_APP');
await browser.$('~back-button').click();
```

WebView debugging requires `webContentsDebuggingEnabled: true` in the Android build, and Safari Web Inspector for iOS WebView. The app dev team owns this — coordinate before authoring hybrid tests.

## Anti-patterns specific to Appium

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| `noReset: true` permanently | Hides cross-test data leakage; flake explodes weeks later | `noReset: false` per session; use `terminateApp` + `activateApp` for fast in-test reset |
| Reinstalling the app between every test | 60+ seconds per install; CI bill explodes | Install once per worker; `resetAppState()` helper between tests |
| XPath like `//XCUIElementTypeButton[@name='Submit'][3]` | Index-based; breaks on every UI tweak | Ask the dev team to add `accessibility-id` (iOS) / `content-description` (Android); reference via `~id` |
| One Appium server shared across all parallel sessions | Server becomes the bottleneck; tests serialise | One Appium port per worker (`--port 4724`, `--port 4725`, …) |
| Hardcoded `bstack:options.accessKey` in caps | Secret leaks to Git | Read from env; use repo secrets |
| Skipping `appium-doctor` after install | Silent driver mismatches; tests fail with cryptic errors mid-suite | Run `appium-doctor --ios && --android` after every install in CI |
| Using `driver.pause(5000)` between actions | Hides timing assumptions; Sonar / lint flag it | `await element.waitForDisplayed({ timeout: 5000 })` — explicit waits only |
| Mixing iOS + Android caps in one session | Capability conflicts; Appium 2 rejects this | One session per platform; share `pages/`, never `wdio.conf.ts` |
| Real-device tests for every PR | $$ — farm minutes cost real money | Real device on cron / pre-release; PR uses simulators |
| Visual baseline shared across iOS + Android | Pixel diffs are wildly different per platform | One baseline per (device, OS) — see [`visual-regression-testing` skill](../../.agents/skills/visual-regression-testing/SKILL.md) |

## Cross-references

- [`README.md`](./README.md) — shared discipline (POM, accessibility IDs, device matrix, dashboard contract).
- [`tool-comparison.md`](./tool-comparison.md) — when Appium isn't the right pick (Detox / Playwright / Flutter).
- [`detox.md`](./detox.md) — for React Native projects.
- [`playwright-mobile-web.md`](./playwright-mobile-web.md) — for mobile-responsive web only.
- [`.agents/skills/mobile-testing/SKILL.md`](../../.agents/skills/mobile-testing/SKILL.md) — author skill.
- [`.agents/skills/accessibility-testing/SKILL.md`](../../.agents/skills/accessibility-testing/SKILL.md) — TalkBack / VoiceOver assertions on mobile.
- [`.agents/skills/visual-regression-testing/SKILL.md`](../../.agents/skills/visual-regression-testing/SKILL.md) — per-device baselines.
- [`.agents/skills/selector-healing/SKILL.md`](../../.agents/skills/selector-healing/SKILL.md) — applies to mobile too; never edit raw locators in spec files.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — canonical workflow shape this mobile job slots into.
- Official: [Appium 2.x docs](https://appium.io/docs/en/2.x/) · [WebdriverIO Appium guide](https://webdriver.io/docs/appium-mobile-test/) · [XCUITest driver](https://github.com/appium/appium-xcuitest-driver) · [UiAutomator2 driver](https://github.com/appium/appium-uiautomator2-driver).
