---
name: visual-regression-testing
description: "Adds visual-regression coverage to a Playwright suite using built-in toHaveScreenshot() with stable masking, threshold tuning, and disciplined baseline management. Use when explicitly asked to 'add visual tests', 'snapshot this page', 'detect visual regressions', or after a UI refactor that risks pixel drift. Produces (1) a screenshot spec with deterministic waits + masks, (2) baseline-update workflow per environment, (3) intentional-change checklist so reviewers can tell legit changes from regressions."
---

# Visual Regression Testing

Visual regressions are the bugs your assertion suite never catches: a button moves 4px, a colour shifts a hue, a font fallback kicks in. This skill wires Playwright's built-in screenshot assertions correctly — with the discipline to keep them maintainable instead of becoming the most-skipped suite in the repo.

Aligned with **v2.0 · Coverage Hardening** milestone and [`training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md`](../../../training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md).

---

## When to use this skill

Trigger on:
- "Add a visual test for…"
- "Snapshot the cart page"
- "Detect visual regressions on the homepage"
- After a CSS/component-library upgrade
- Before a release that touched layout

**Do NOT use when:**
- The user wants pixel-perfect cross-browser parity → that's a non-goal; use per-project baselines.
- The page has heavy server-rendered randomness (live charts, ads) → either mask aggressively or skip — visual tests there will rot.
- The user wants a11y coverage → use `accessibility-testing`.

---

## How to use it

### Phase 1 — Stabilise the page

A flaky visual test is a deleted visual test. Before snapshotting, eliminate every source of variance:

```ts
// Inside the test, before toHaveScreenshot
await page.addStyleTag({ content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }` });
await page.evaluate(() => document.fonts.ready);                         // wait for webfonts
await page.waitForLoadState('domcontentloaded');
await expect(page.getByTestId('content-loaded-marker')).toBeVisible();    // explicit, not networkidle
```

### Phase 2 — Author the spec with masks

Use `mask:` for elements that change every render (timestamps, user avatars, A/B variants, charts):

```ts
test.describe('Cart page visuals', { tag: ['@visual', '@P3', '@minor', '@cart'] }, () => {
  test('TC-VIS-CART-01 empty cart matches baseline', async ({ page }) => {
    await cartPage.gotoEmpty();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('cart-empty.png', {
      fullPage: true,
      mask: [page.getByTestId('cart-timestamp'), page.locator('[data-test=advert]')],
      maxDiffPixelRatio: 0.005,    // ≤ 0.5% pixel drift
      animations: 'disabled',
      caret: 'hide',
    });
  });
});
```

Threshold guidance:
| Page type | `maxDiffPixelRatio` | Why |
|---|---|---|
| Static content (legal, terms) | 0.001 | Should be byte-stable |
| Standard product / cart pages | 0.005 | Allow tiny font-rendering drift |
| Heavy media (video posters, gradient backgrounds) | 0.01–0.02 | Codecs differ across CI runners |

### Phase 3 — Baseline workflow

Baselines live next to the spec under `<spec>.spec.ts-snapshots/`. Per-project subfolders are auto-managed.

| Operation | Command |
|---|---|
| **First-time generate** (no baseline yet) | `npx playwright test path/to/spec.ts --update-snapshots` |
| **Intentional change** (legitimate UI update) | Same flag, but **commit baselines in a separate commit** with explanation |
| **Failing CI on a real regression** | DO NOT update baselines blindly — open a `defect-report` first |
| **Per-env baseline drift** (qa vs uat differ) | Run with `--project="Desktop Chrome"` per env; baselines are per-project automatically |

Each baseline commit MUST include:
- Why the change is intentional (link the design/PR)
- Which pages/regions changed
- Reviewer must visually inspect the new PNG, not just merge

### Phase 4 — Failure triage

When a visual test fails:
1. Open the diff: `npx playwright show-report` → click the failed test → "Image diff" tab.
2. Three outcomes:
   - **Real regression** → `defect-report` with severity scaled to user impact (`severity:major` if it affects readability/usability, `severity:minor` for cosmetic).
   - **Intentional change** → update the baseline in a separate commit; reviewer signs off on the new PNG.
   - **Flake / environmental** → tighten masks or thresholds (don't widen blindly); link the run for traceability.
3. Add `@visual` to any retry-pass triage so they show in the dashboard's flake panel.

---

## Decision tree

```
Page candidate for visual test ?
├── Mostly static / branded UI    → YES, low threshold, full-page
├── Has live data / charts        → YES with aggressive masks, OR skip
├── Has cross-browser font drift  → per-project baseline
├── Heavy A/B / personalisation   → SKIP visual; rely on functional tests
└── Below-the-fold / never seen   → SKIP; ROI too low
```

---

## Best practices

- **Mask before threshold.** Raising thresholds hides bugs; masking is targeted.
- **One spec, one viewport.** Don't snapshot mobile + desktop in one test — explode into projects.
- **Don't wait on `networkidle`.** Use a content marker (`getByTestId('content-loaded-marker')`).
- **Separate baseline commits.** A PR that updates baselines + adds new tests is unreviewable. Split.
- **Disable animations at the CSS level.** `animations: 'disabled'` covers Playwright's defaults but webfont loading and CSS transitions need explicit suppression.
- **Don't snapshot transient UI.** Toast notifications, hover states — mask or scope to the underlying component.
- **Set viewport in playwright.config.ts.** Per-spec `setViewportSize` causes baseline churn.
- **Limit your suite.** ≤ 30 visual specs total; this isn't a unit-test workload.
- **Hide carets.** A blinking cursor will diff every other run. `caret: 'hide'` is non-negotiable for input fields.

---

## Related

- [`training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md`](../../../training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md) — combined visual + a11y module.
- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — `@visual` tag definition.
- [`prompts/advanced/visual-regression-reviewer.md`](../../../prompts/advanced/visual-regression-reviewer.md) — diff-review prompt (post-failure).
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — for filing real regressions.
- [`.agents/skills/accessibility-testing`](../accessibility-testing/SKILL.md) — sister skill (semantic layer).
- Playwright docs: <https://playwright.dev/docs/test-snapshots>
