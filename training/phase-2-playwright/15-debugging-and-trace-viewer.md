# Module 15 — Debugging & Trace Viewer

> Phase 2 · Effort: 3h · Prerequisites: Module 14

## Learning objectives

After this module you can:

- Use **Playwright UI Mode** to step through tests interactively.
- Use **codegen** to generate locator candidates.
- Read a **Trace Viewer** zip — actions, network, console, snapshots.
- Use the **Inspector** with `PWDEBUG=1`.
- Diagnose a flaky test from a CI artifact alone, no local repro.

## Why it matters

Half of automation is debugging. Mastering Playwright's debug tooling means you fix flakes in minutes, not days.

## Concepts

### UI Mode (the default debug experience)

```bash
npx playwright test --ui
```

Features:
- Run individual tests
- Watch mode with hot-reload on file changes
- Time-travel through actions with DOM snapshots
- Network panel
- Console & errors
- Inspect locators visually

### Codegen — locator candidates from clicks

```bash
npx playwright codegen https://ecommerce.test.com
```

A browser opens. As you click, codegen suggests locators (it follows the priority hierarchy). Copy what you need.

**Don't paste codegen output verbatim.** Treat it as a starting point — clean up to match this repo's locator naming + helper rules.

### Trace Viewer — the most important tool

```bash
# locally, after a failure
npx playwright show-trace test-results/.../trace.zip

# from a CI artifact you downloaded
npx playwright show-trace ~/Downloads/trace.zip
```

What you see:

- **Actions** — every step with input/output
- **Before/After DOM snapshots** — fully interactive
- **Network** — requests, responses, headers, bodies
- **Console** — browser console output
- **Source** — code lines that ran each step
- **Errors** — stack traces with snapshot context

Workflow: open the trace → find the failing assertion → look at the *before* snapshot → look at *network* → identify whether it's UI lag, missing data, or wrong selector.

### Inspector — line-by-line stepping

```bash
PWDEBUG=1 npx playwright test tests/ui/test-checkout.spec.ts
```

Opens a Playwright Inspector window. Step through actions, view selectors live, edit & retry.

```ts
await page.pause();   // breakpoint inside a spec
```

### `console.log`-style debugging

```ts
console.log(await locator.count());
console.log(await locator.allInnerTexts());
```

For complex locators:

```ts
const matches = await page.locator(...).all();
for (const m of matches) console.log(await m.boundingBox());
```

### Headed + slow-mo

```ts
// playwright.config.ts (local only)
use: {
  headless: false,
  launchOptions: { slowMo: 250 },
}
```

Watch the test happen at human speed. Painful for full suites; great for one specific spec.

### Reading a CI failure without a local machine

CI artifact bundle typically contains:

```
playwright-report/
  index.html               ← open in browser, full HTML report
  data/
    <test-id>.md
test-results/
  <test-name>/
    trace.zip              ← THE prize
    video.webm
    test-failed-1.png
    error-context.md
```

Workflow:
1. Download the artifact
2. `npx playwright show-trace <path>/trace.zip`
3. Diagnose without ever running the test locally

This repo uploads traces in `.github/workflows/playwright.yml`. Practice this loop until it's reflex.

### Common flake patterns

| Symptom | Likely cause | Trace clue |
|---|---|---|
| Click works locally, fails on CI | Animation not finished | "Element not stable" in trace |
| Selector finds nothing | Element renders late or differently | Empty result in actions, network shows late response |
| Fill works but value reverts | React re-render after fill | Two snapshots: filled then empty |
| URL assertion fails by ms | History state vs URL bar timing | URL changes 100ms after the snapshot |
| Random 401 | Storage state expired | Auth response in network panel |

## Hands-on lab

1. Run a failing test in UI mode. Time-travel to the failed action.
2. Generate a locator with `codegen` for the password field. Compare with `locators/login-locators.ts`.
3. Force a flake (e.g. add a `setTimeout` server-side or remove an `await`). Capture the trace. Identify the failing snapshot.
4. Download a real CI failure artifact from a recent run on this repo. Open `trace.zip`. Diagnose.
5. Add `await page.pause()` in a spec, run with `PWDEBUG=1`, step through.

## Self-check

- [ ] Trace Viewer vs UI Mode — when to use each?
- [ ] What's the first thing you check in a trace when an assertion fails?
- [ ] You see "element is outside of the viewport" in the trace. What's the fix?
- [ ] Why does this repo set `trace: 'on-first-retry'` instead of `'on'`?

## Further reading

- playwright.dev — Trace Viewer
- playwright.dev — Debugging Tests
- playwright.dev — UI Mode

---

**Prev:** [14 — Fixtures & test isolation](./14-fixtures-and-test-isolation.md) · **Up:** [Phase 2 README](./README.md)

🎓 **Phase 2 complete.** Next: [Phase 3 — Framework Architecture](../phase-3-framework/README.md)
