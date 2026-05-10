# Mobile Testing Tool Comparison — When to Use What

> Decision aid for choosing between **[Appium](./appium.md)**, **[Detox](./detox.md)**, **[Playwright mobile-web](./playwright-mobile-web.md)**, and **Flutter integration_test**. Plus a **device-farm comparison** because the tool is only half the choice — *where* you run it on real hardware is the other half.
>
> **TL;DR:**
> - **React Native app** → Detox (5x faster than Appium for RN; native bridge access).
> - **Truly native iOS / Android / Hybrid app** → Appium 2.x with WebdriverIO.
> - **Mobile-responsive web only** → Playwright with `devices['iPhone 14']` / `Pixel 7` (already in this repo).
> - **Flutter app** → `flutter integration_test` (or `appium-flutter-driver` if you must use Appium).
> - **Mixed native + web** → Appium for native, Playwright for web; share fixtures.

> **Switching tools mid-project is expensive.** Get this decision right at the start. The cost of a wrong tool choice on mobile is 5-20x the cost of a wrong tool choice on API or web — because the locator strategy, build pipeline, device lab, and CI runner all change with the tool.

## The 6-criterion matrix

Score each tool 1-5 (5 = best fit) for the criteria the team weights highest. Pick from the top of the column that aligns with your codebase.

| Criterion | Appium | Detox | Playwright mobile-web | Flutter integration_test |
|---|---|---|---|---|
| **Test author writes TypeScript / JS** | ⭐⭐⭐⭐⭐ (WebdriverIO) | ⭐⭐⭐⭐⭐ (Jest) | ⭐⭐⭐⭐⭐ | ⭐⭐ (Dart only) |
| **Speed of one test run (build + install + run)** | ⭐⭐ (~2 min) | ⭐⭐⭐⭐ (~30s) | ⭐⭐⭐⭐⭐ (~5s) | ⭐⭐⭐ (~45s) |
| **True native API access (camera, biometrics, deep link)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (RN-bridge limited) | ⭐ (web-only) | ⭐⭐⭐⭐⭐ |
| **React Native specific** | ⭐⭐⭐ (works but slower) | ⭐⭐⭐⭐⭐ (built for it) | ⭐ | n/a |
| **Flutter specific** | ⭐⭐⭐ (via appium-flutter-driver) | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **Hybrid (Cordova / Ionic / Capacitor)** | ⭐⭐⭐⭐⭐ (WebView context switch) | ⭐ | ⭐⭐ (web-only side) | ⭐ |
| **Cross-platform spec reuse** | ⭐⭐⭐⭐ (one spec, two caps) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Device-farm support (BrowserStack / Sauce / Firebase)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (limited; mostly self-host) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ (Firebase) |
| **CI maturity (GitHub Actions / GitLab CI snippets)** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **AI-assist for test generation** | ⭐⭐⭐⭐ (via [`mobile-testing` skill](../../.agents/skills/mobile-testing/SKILL.md)) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ (full Playwright skill ecosystem) | ⭐⭐ |
| **Vendor lock-in risk** | ⭐⭐⭐⭐⭐ (open-source standard) | ⭐⭐⭐⭐ (Wix-maintained; healthy community) | ⭐⭐⭐⭐⭐ (Microsoft-owned but OSS) | ⭐⭐⭐⭐ (Google-owned) |
| **TCO at 5+ engineers/year** | $$ (open-source + farm fees) | $ (open-source + own simulators) | $ (already paid via Playwright) | $ (open-source + Firebase) |

## The decision tree

```
Q1. Is this a Flutter app?
       │
       ├─ Yes → flutter integration_test (or appium-flutter-driver if cross-team Appium standard)
       │
       └─ No → Q2

Q2. Is this a React Native app?
       │
       ├─ Yes → Detox (5x faster than Appium for RN; uses the RN bridge directly).
       │        Don't use Appium for RN unless you need its WebView context-switch.
       │
       └─ No → Q3

Q3. Is the entire user journey accessible via a mobile browser (no native APIs)?
       │
       ├─ Yes → Playwright with mobile-web projects (already in this repo).
       │        Cheapest, fastest, no device farm needed for PR gates.
       │
       └─ No → Q4

Q4. Are you testing a hybrid app (Cordova / Ionic / Capacitor) with WebView screens
    AND native screens in the same flow?
       │
       ├─ Yes → Appium 2.x. It's the only tool that switches between
       │        NATIVE_APP and WEBVIEW_<bundle> contexts mid-test.
       │
       └─ No → Q5

Q5. Does the test need camera / biometrics / push tokens / deep links?
       │
       ├─ Yes → Appium 2.x. Real-device-only via a farm (camera doesn't work
       │        in simulators; biometrics needs a real fingerprint reader).
       │
       └─ No → Appium 2.x for native, simulator-only for PR gates,
                real device weekly. (Detox isn't an option for non-RN native.)
```

## Real-device vs simulator/emulator — the second decision

Independent of tool choice. Driven by what you're testing.

| Scenario | Simulator / Emulator | Real Device | Why |
|---|---|---|---|
| Pure UI flow (no sensors) | ✅ enough | optional | Fast PR gates; cheap |
| Performance / cold-launch SLO | ❌ inaccurate | ✅ required | Sim CPU is host CPU; numbers are fiction |
| Camera / QR scanner | ❌ doesn't work | ✅ required | Sim camera is a still image |
| Biometrics (Face ID / fingerprint) | ⚠️ scriptable but fake | ✅ required for prod-shape testing | Sim "succeeds" the moment you call it |
| Push notifications | ⚠️ APNs / FCM tokens differ | ✅ required for delivery testing | Sim tokens don't reach prod backends |
| Deep links | ✅ enough | optional | Both surface the link |
| OEM-specific behaviour (Samsung skin, Xiaomi MIUI) | ❌ no skins | ✅ required | Stock emulators ≠ real OEM Android |
| Visual regression baselines | ✅ if locked to one OS version | ✅ better | Pixel-perfect diffs need stable hardware |
| Accessibility (TalkBack / VoiceOver) | ⚠️ partial | ✅ required for VoiceOver gestures | Sim a11y is partial |

**Rule of thumb:** PR gate runs on simulator (cheap, fast); pre-release runs on real device (catches the 30% sim misses).

## Device farm comparison

Pick one farm per team; mixing farms doubles your debt-load (different SDKs, different secrets, different artifact formats).

| Farm | Strengths | Weaknesses | Pricing model | Best for |
|---|---|---|---|---|
| **BrowserStack App Live + App Automate** | Largest device fleet (3000+ real devices); slick UI for live debug; Appium / Detox / Espresso / XCUITest support; Visual Testing add-on | Per-parallel-session pricing gets pricey at scale | Per parallel session, monthly | Teams that need broad device matrix and slick debugging |
| **SauceLabs Real Device Cloud** | Mature CI integration; long-running session support; strong analytics; biometrics simulation | Slightly smaller device fleet than BrowserStack | Per parallel session, monthly | Enterprise teams with complex CI / SSO / SOC 2 needs |
| **Firebase Test Lab** | Cheapest for Android (per-test-minute); integrates with Crashlytics; Robo crawler is a nice-to-have | iOS support is limited (XCUITest only; small device fleet); no live debug | Per device-minute, pay-as-you-go | Android-heavy projects, CI-only (no live debug) |
| **AWS Device Farm** | Large device pool; integrates with CodePipeline; no per-seat fee | UX is rough; setup is heavier than BrowserStack/Sauce; iOS device pool is smaller | Per device-minute, pay-as-you-go | AWS-native shops with CodePipeline already |
| **LambdaTest Real Device Cloud** | Competitive pricing; Appium + Espresso + XCUITest support; visual + a11y add-ons; same vendor as the LambdaTest e-commerce playground this repo tests against | Slightly smaller fleet than BrowserStack; newer product | Per parallel session, monthly | Teams already using LambdaTest for desktop; cost-conscious |
| **Self-hosted lab (Open STF / SeeTest / in-house Macs + Android) ** | Full control; no per-test cost; data stays on-prem | Requires a dedicated platform team; physical-device maintenance is real work; doesn't scale to 100+ devices | Capex + opex (people + space) | Large enterprises with regulatory constraints; cost-sensitive at scale |

**Default rule:** if none of the above forces a choice, pick **BrowserStack App Automate** for cross-platform mobile, or **Firebase Test Lab** for Android-only. Both have first-class GitHub Actions integrations.

## Migration paths

### Appium → Detox (when you switch to React Native)

| What carries over | What you rewrite |
|---|---|
| POM structure (locators class + page class) | Locator syntax — `~accessibility-id` (Appium) → `by.id('accessibility-id')` (Detox) |
| Test scenarios (Given/When/Then) | Driver setup — `webdriver.remote()` → `device.launchApp()` |
| Tags + traceability mapping | CI shape — Appium farm calls → Detox `--device-name` configurations |
| Accessibility-ID strategy | `wdio.conf.ts` → `.detoxrc.js` |

Estimated effort: ~30% of the Appium suite re-authored; the rest copy-pastes with locator-syntax substitution.

### Detox → Appium (when you outgrow RN-only)

Rare. Usually when adding a non-RN native module that Detox can't drive. Migrate spec-by-spec; keep both running in parallel during the transition.

### Playwright mobile-web → Appium (when "mobile-web" turns into "we ship a native shell now")

| What carries over | What you rewrite |
|---|---|
| Test scenarios | Locator strategy entirely — CSS selectors don't exist in native trees |
| POM shape | New tool config; new CI device matrix |
| Visual baselines | Re-baseline on real devices; web baselines aren't comparable |

Treat this as a fresh suite that **inherits the test cases** from the Playwright mobile-web suite but is technically separate.

## Cross-references

- [`README.md`](./README.md) — orientation + shared discipline.
- [`appium.md`](./appium.md) — full Appium guideline.
- [`detox.md`](./detox.md) — full Detox guideline.
- [`playwright-mobile-web.md`](./playwright-mobile-web.md) — full mobile-web guideline.
- [`.agents/skills/mobile-testing/SKILL.md`](../../.agents/skills/mobile-testing/SKILL.md) — skill that authors mobile suites following this guideline.
- [`documents/api-testing/tool-comparison.md`](../api-testing/tool-comparison.md) — sibling decision matrix for API tools (same shape).
- [`documents/performance/README.md`](../performance/README.md) — performance budgets adapted for mobile.
- Official: [Appium 2.x docs](https://appium.io/docs/en/2.x/) · [Detox docs](https://wix.github.io/Detox/) · [Playwright Devices](https://playwright.dev/docs/emulation#devices) · [Flutter integration_test](https://docs.flutter.dev/cookbook/testing/integration/introduction).
