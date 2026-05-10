# Mobile Testing Guidelines (Appium · Detox · Playwright Mobile-Web · Flutter)

> Source-of-truth folder for **how this repo tests mobile apps** — native iOS/Android, React Native, mobile-web, and Flutter. Four tools, one shared contract: every mobile suite produces the same evidence (status, screenshot, perf trace, a11y) the dashboard and traceability skills already understand.
>
> Anchored on the [`mobile-testing` skill](../../.agents/skills/mobile-testing/SKILL.md) (which authors the suites) and the existing `playwright.config.ts` mobile projects (which already cover the responsive-web lane). This folder is the **operational guideline** the skill leans on.

## The picture

```
                                                            ┌───────────────────────────┐
┌──────────┐  Pick    ┌──────────────┐                      │  Mobile suite             │
│ What are │ ───────► │ Tool         │  Author + run ─────► │   (POM-style; same shape  │
│ you      │          │ decision     │                      │    as desktop suite)      │
│ testing? │          │ tree (below) │                      │                           │
└──────────┘          └──────┬───────┘                      └─────────────┬─────────────┘
                             │                                            │
              ┌──────────────┼──────────────┬──────────────┐              │
              ▼              ▼              ▼              ▼              ▼
       ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
       │ Appium   │  │ Detox    │  │ Playwright   │  │ Flutter  │  │  Run on:     │
       │ (native+ │  │ (React   │  │ (mobile-web  │  │ integ-   │  │  emulators / │
       │  hybrid) │  │  Native) │  │  responsive) │  │ test     │  │  simulators /│
       └──────────┘  └──────────┘  └──────────────┘  └──────────┘  │  device farm │
                                                                   └──────┬───────┘
                                                                          │
                                                                          ▼
                                                          ┌────────────────────────────┐
                                                          │  Shared evidence contract  │
                                                          │  (status / screenshots /   │
                                                          │  trace / a11y) → dashboard │
                                                          │  Panel #5 (Mobile)         │
                                                          └────────────────────────────┘
```

The **shape** of every mobile suite in this repo is identical regardless of tool: a POM-style suite (locators class + page class), driven by accessibility IDs where possible, gated by an SLO, running on an explicit device matrix in CI, emitting evidence into the same dashboard contract used by the desktop suite. Only the tool syntax and the device-launch dance differ.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | Orientation, four-stack picture, shared discipline (POM, accessibility IDs, device matrix, dashboard contract), reading order | Always read first |
| [`tool-comparison.md`](./tool-comparison.md) | Decision matrix across **Appium**, **Detox**, **Playwright mobile-web**, **Flutter integration_test** + **device farm options** (BrowserStack, SauceLabs, Firebase, AWS, LambdaTest). Migration paths in both directions | Choosing the tool for a new mobile project, or justifying the choice in a vendor RFC |
| [`appium.md`](./appium.md) | Appium 2.x with WebdriverIO + TypeScript — install, drivers (XCUITest / UiAutomator2), capabilities, project layout, sample test, CI snippet, device farms. **Default for true-native + hybrid apps.** | Any iOS / Android native or hybrid app; greenfield mobile project |
| [`detox.md`](./detox.md) | Detox with Jest — install, `.detoxrc.js`, build/install/launch lifecycle, sample test, CI snippet. **Default for React Native apps** (faster than Appium, RN-aware) | React Native projects only |
| [`playwright-mobile-web.md`](./playwright-mobile-web.md) | Playwright with `devices['iPhone 14']` / `Pixel 7` projects — already wired in this repo's `playwright.config.ts`. Responsive-web only; **NOT** a substitute for native testing | Mobile responsive-web flows; quick mobile-web smoke before promoting to a real device |

> **Note on Flutter:** `flutter integration_test` is the canonical Flutter tool. It's covered briefly in [`tool-comparison.md`](./tool-comparison.md) §"Flutter" but does not have its own dedicated file yet — Flutter teams are rare in QA orgs that adopt this repo. If you need full Flutter coverage, file a follow-up.

## Reading order

1. **`tool-comparison.md`** — pick the right tool before you spend a week learning the wrong one. Mobile tool-switching costs are *high* — much higher than swapping API tools.
2. **`appium.md`** OR **`detox.md`** OR **`playwright-mobile-web.md`** — your tool of choice from the matrix.
3. The other tool docs — only when you maintain a multi-stack org (e.g. native iOS + React Native Android).

## Position vs the in-repo Playwright tests

| Concern | Appium / Detox (native) | Playwright mobile-web | [`tests/`](../../tests/) (desktop) |
|---|---|---|---|
| **Best for** | True native flows, hardware-bound features (camera, biometrics, push) | Mobile-responsive web pages, quick smoke | Desktop browser flows, regression gate |
| **Source-of-truth** | TypeScript spec + locators class | Same; reuses `playwright.config.ts` | Same; reuses `pages/` / `tests/` |
| **Audience** | Mobile engineers (familiar with iOS/Android idioms) | Frontend / QA engineers | Same as desktop |
| **AI assistance** | [`mobile-testing` skill](../../.agents/skills/mobile-testing/SKILL.md) | [`pom-architect`](../../.agents/skills/pom-architect/SKILL.md), [`selector-healing`](../../.agents/skills/selector-healing/SKILL.md) | Same |
| **Promotion path** | Stays in `tests/mobile/` (own folder) | Stays in `tests/` (project = "Mobile Safari") | n/a |
| **CI runtime** | Slow (device boot ~30s, real-device farm ~2-5min/test) | Fast (~same as desktop browser tests) | Fastest |
| **Cost** | Real devices: $$ (farm) or capex (in-house lab) | Free (uses Playwright's `webkit`/`chromium` engines) | Free |

The three lanes are **complementary, not competing**. Mobile-web in Playwright catches responsive-web regressions cheaply; Appium/Detox catch native-only regressions on a smaller, slower device matrix.

## Shared discipline (every tool must satisfy)

Every mobile suite in this repo, no matter the tool:

1. **POM-shaped** — locators class + page class, same as the desktop convention in [`documents/automation-framework/pages.md`](../automation-framework/pages.md). No raw `driver.findElement(...)` calls in spec files.
2. **Accessibility IDs first** — `~update-cart` (iOS) / `update-cart` (Android `accessibility-id`) over text-matching or fragile XPath. They double as a11y signal AND survive UI rewrites.
3. **Tagged with the device + platform** — `@ios`, `@android`, `@iphone-14`, `@pixel-7` — feeds the dashboard's by-device breakdown.
4. **Reads device + env from config** — never hardcoded; same suite runs against simulator (local) and real device (farm CI) via env vars.
5. **Has a mobile-specific budget** — adapted from [`documents/performance/README.md`](../performance/README.md) §"SLO discipline":
   - Cold launch < 3s
   - Tap → first paint < 100ms
   - Mobile LCP < 4.0s (vs desktop 2.5s)
   - App-size delta < +500kB per release
6. **Emits to the dashboard** — `reports/mobile-summary.json` with the same row shape as desktop (status / screenshot path / trace path / a11y violations / perf budgets / device + OS metadata).
7. **Has an owner** — `# OWNER: <github-handle>` in the spec header.

> **Operating principle:** a mobile suite that doesn't run on at least one real device per release is a suggestion, not a test. Simulators catch ~70% of bugs; real devices catch the other 30% (sensors, performance, signing, push tokens, OEM skins).

## Where the suites live

```
tests/mobile/
├── README.md                         ← link back to documents/mobile-testing/README.md
├── appium/
│   ├── locators/
│   │   ├── cart-locators.ts
│   │   └── checkout-locators.ts
│   ├── pages/
│   │   ├── cart-page.ts
│   │   └── checkout-page.ts
│   ├── specs/
│   │   ├── ios/
│   │   │   └── cart.spec.ts
│   │   └── android/
│   │       └── cart.spec.ts
│   ├── lib/
│   │   ├── caps.ts                   ← capabilities builder (env-driven)
│   │   └── device.ts                 ← device-farm vs local detection
│   ├── apps/                         ← .gitignore'd; CI fetches from a release artifact
│   │   ├── ios/MyApp.app
│   │   └── android/app-release.apk
│   └── wdio.conf.ts                  ← WebdriverIO config
├── detox/
│   ├── e2e/
│   │   └── cart.e2e.ts
│   ├── jest.config.js
│   └── .detoxrc.js
└── playwright-web/                    ← lives in main tests/; mentioned for clarity
    └── (uses playwright.config.ts projects: "Mobile Safari" / "Pixel 7")
```

`tests/mobile/` is added by the per-tool docs as you adopt each lane; nothing else in the repo writes there.

## Anti-patterns (do NOT do these)

> Mobile-specific. The general anti-patterns in [`documents/automation-framework/tests.md`](../automation-framework/tests.md) still apply.

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Testing only on simulators / emulators | Misses signing, OEM skins, perf, sensors, push, deep links | At least one real device per release; per-PR can be sim-only |
| Brittle XPath like `//XCUIElementTypeButton[3]` | Breaks on every UI rewrite; index-based; opaque | `~accessibility-id` first; ask the dev team to add IDs to interactive elements |
| Sharing a single device across parallel tests | Tests collide on app state; flake explodes | One device per worker (Appium parallel sessions or Detox `--workers` to dedicated devices) |
| Re-installing the app between every test | 60+ seconds per install; CI bill explodes | Install once per worker; use `driver.terminateApp` + `activateApp` for state reset |
| Hardcoded device names in the spec | Same spec doesn't run on a different device | Read device caps from env / `wdio.conf.ts` / `.detoxrc.js` configurations |
| Testing payment / signup with real PII on a shared device farm | Privacy + compliance violation | Use stub backends or test-data tenants; never real PII on shared infra |
| Skipping a11y on mobile | Mobile a11y is the most-litigated surface (TalkBack / VoiceOver lawsuits) | Run [`accessibility-testing` skill](../../.agents/skills/accessibility-testing/SKILL.md) on every screen change |
| Visual snapshots without device class isolation | iPhone 14 baseline differs from iPhone 14 Pro Max; everything looks like a regression | One baseline per (device, OS) combo; use [`visual-regression-testing` skill](../../.agents/skills/visual-regression-testing/SKILL.md) properly |
| One mega-suite mixing iOS + Android | Failure isolation broken; can't tell which platform broke | Separate `specs/ios/` + `specs/android/`; share `pages/` only |

## Conventions used here (cross-references)

- **The skill that authors mobile tests** — [`.agents/skills/mobile-testing/SKILL.md`](../../.agents/skills/mobile-testing/SKILL.md). Picks the right tool (Appium / Detox / Playwright-mobile-web / Flutter) for the question.
- **POM contract** — [`documents/automation-framework/pages.md`](../automation-framework/pages.md). Same two-class shape on mobile as on desktop; engineers don't context-switch.
- **Accessibility on mobile** — [`.agents/skills/accessibility-testing/SKILL.md`](../../.agents/skills/accessibility-testing/SKILL.md). Mobile a11y APIs (TalkBack / VoiceOver) are first-class assertions, not afterthoughts.
- **Visual regression on mobile** — [`.agents/skills/visual-regression-testing/SKILL.md`](../../.agents/skills/visual-regression-testing/SKILL.md). Per-device baselines under `tests/mobile/__visual__/<device>/<screen>.png`.
- **Performance budgets on mobile** — [`documents/performance/README.md`](../performance/README.md). Mobile budgets are stricter on launch / LCP / app-size; latency budgets identical to API-side.
- **CI implementation** — [`documents/ci/github-actions.md`](../ci/github-actions.md). Mobile jobs use the same env-matrix shape; device farms attach via secrets.
- **Defect filing on mobile failures** — [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) with `module:mobile` + `platform:ios` / `platform:android` labels.
- **Selector healing on mobile** — [`.agents/skills/selector-healing/SKILL.md`](../../.agents/skills/selector-healing/SKILL.md). The locators-class-only rule applies to mobile too; never `// NOSONAR`-fix a broken selector inline.

## Out of scope

This folder is **not**:

- A general mobile-engineering tutorial (Swift / Kotlin / React Native fundamentals) — read the platform docs.
- A vendor reference for device farms — see [BrowserStack docs](https://www.browserstack.com/docs/), [SauceLabs docs](https://docs.saucelabs.com/), [Firebase Test Lab docs](https://firebase.google.com/docs/test-lab), [AWS Device Farm docs](https://docs.aws.amazon.com/devicefarm/), [LambdaTest mobile docs](https://www.lambdatest.com/support/docs/getting-started-with-app-automation/).
- A licence to add a fifth tool — every additional tool fragments the device-matrix budget; bring an RFC if you need one.
- A replacement for **manual exploratory testing on a real device**. Mobile UX has timing and gesture nuances automation misses; budget 1 hour of manual hands-on per major feature.
- A licence to run mobile tests against production unless you own the user account being tested. Most farm vendors prohibit it; many app stores treat automated traffic as abuse.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (orientation, four-stack picture, shared discipline, anti-patterns) | QA Platform |
| [`tool-comparison.md`](./tool-comparison.md) | ✅ v1 (decision matrix + device-farm comparison + migration paths) | QA Platform |
| [`appium.md`](./appium.md) | ✅ v1 (native default; full WebdriverIO + TS + CI) | QA Platform |
| [`detox.md`](./detox.md) | ✅ v1 (React Native default; build/install/launch lifecycle) | QA Platform |
| [`playwright-mobile-web.md`](./playwright-mobile-web.md) | ✅ v1 (responsive-web lane; reuses existing config) | QA Platform |
| Flutter integration_test (dedicated file) | ⏳ deferred — covered in `tool-comparison.md` only; file a follow-up if you need Flutter | — |

## Phase-7+ connection

For the leadership / architect framing of "what mobile testing *should* be in an AI-augmented QA org", see:

- [`training/phase-7-ai-era-leadership/README.md`](../../training/phase-7-ai-era-leadership/README.md) — mobile as a first-class lane, not a "phase 2" afterthought.
- [`training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md`](../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) — device-farm budget as a platform concern, not a per-team purchase.
