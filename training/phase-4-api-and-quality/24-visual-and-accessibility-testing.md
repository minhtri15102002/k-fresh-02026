# Module 24 — Visual & Accessibility Testing

> Phase 4 · Effort: 4h · Prerequisites: Module 23

## Learning objectives

After this module you can:

- Capture and compare visual snapshots with Playwright.
- Distinguish **page-level** vs **component-level** snapshots.
- Run **axe-core** accessibility scans inside Playwright tests.
- Read a WCAG violation report and triage it.
- Avoid the two big visual-test pitfalls: false positives and rubber-stamping.

## Why it matters

Functional tests don't catch "the layout broke", "the dark theme is white-on-white", "the modal is unreachable by keyboard". Visual + a11y testing closes the gap with surprisingly little code.

## Concepts

### Visual regression testing

```ts
await expect(page).toHaveScreenshot('home.png');
await expect(page.getByTestId('product-card')).toHaveScreenshot('card.png');
```

First run → creates baseline.
Next runs → compares; fails on pixel diff above threshold.

### Update baselines

```bash
npx playwright test --update-snapshots             # update everything (DANGER)
npx playwright test path/to/spec.ts -u             # update one spec
```

**Always review the diff before updating.** Rubber-stamping baselines defeats the test.

### Tuning sensitivity

```ts
await expect(page).toHaveScreenshot('home.png', {
  maxDiffPixels: 100,
  maxDiffPixelRatio: 0.001,
  threshold: 0.2,                  // per-pixel color diff (0–1)
  animations: 'disabled',          // CSS animations
  caret: 'hide',                   // text caret blink
  mask: [page.getByTestId('clock')],   // dynamic regions
});
```

### Sources of false positives — and fixes

| Source | Fix |
|---|---|
| OS font rendering differs | Run snapshots only in CI Linux container, not local Mac |
| Dynamic data (timestamps, prices) | `mask` the region |
| Animations | `animations: 'disabled'` |
| Loaded fonts | `await page.evaluate(() => document.fonts.ready)` |
| Network jitter affecting layout | Wait for explicit "loaded" state |

### Component snapshots > page snapshots

Page snapshots break on every layout tweak — high noise. Component snapshots break only on the component's own changes. Prefer them.

### Accessibility — axe-core integration

Install:

```bash
npm i -D @axe-core/playwright
```

Use:

```ts
import AxeBuilder from '@axe-core/playwright';

test('home page has no critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const critical = results.violations.filter(v => v.impact === 'critical');
  expect(critical).toEqual([]);
});
```

### Severity thresholds

axe-core impact levels: `minor`, `moderate`, `serious`, `critical`.

Pragmatic policy:

- `critical` → fails CI, blocks PR
- `serious` → fails CI on `main` only
- `moderate` / `minor` → tracked but not blocking

### Common WCAG issues axe catches

- Missing form labels
- Insufficient color contrast (WCAG-AA = 4.5:1 normal text)
- Missing `alt` on images
- Wrong heading order (h1 → h3 skipping h2)
- Buttons that are actually `<div onclick>`
- Missing `lang` attribute on `<html>`

### Manual a11y checks (axe doesn't see these)

- Keyboard navigation: can you reach every action with Tab/Shift+Tab/Enter/Space?
- Focus visible: is the focused element clearly highlighted?
- Screen reader: does VoiceOver / NVDA announce form errors meaningfully?
- Color-only meaning: is "required" indicated by something besides red?

Run a 10-minute manual a11y check on every new feature; bug-track findings with `@accessibility` label.

## Hands-on lab

1. Add a visual test for the product detail page. Run it; commit the baseline.
2. Make a CSS change that subtly shifts layout. Run again. Inspect the diff in `test-results/`. Decide: real regression or expected change?
3. Add an axe-core test for `/checkout`. Filter for `critical` only.
4. Manually keyboard-navigate the registration form. Document any focus traps or unreachable controls.
5. Add a chart card to the QA Metrics dashboard counting `@accessibility`-tagged tests (you'll do dashboards properly in Module 28).

## Self-check

- [ ] When does `toHaveScreenshot` create a baseline vs compare?
- [ ] Why are component snapshots usually better than page snapshots?
- [ ] You see `serious` axe violations after a refactor. Should the build fail?
- [ ] Two things axe-core can never check?

## Further reading

- playwright.dev — Visual Comparisons
- axe-core docs — github.com/dequelabs/axe-core
- WebAIM — WCAG 2.1 quick reference

---

**Prev:** [23 — API security testing](./23-api-security-testing.md) · **Up:** [Phase 4 README](./README.md)

🎓 **Phase 4 complete.** Next: [Phase 5 — Quality at Scale](../phase-5-scale/README.md)
