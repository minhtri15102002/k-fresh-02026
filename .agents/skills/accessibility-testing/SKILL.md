---
name: accessibility-testing
description: "Adds accessibility (a11y) testing to a Playwright suite using @axe-core/playwright + manual audits, covering WCAG 2.1 AA criteria (contrast, keyboard, ARIA, focus order, semantic HTML, screen-reader names). Use when explicitly asked to 'add a11y tests', 'check WCAG compliance', 'run axe', 'audit accessibility', or before shipping a UI feature. Produces (1) an axe-core integration block, (2) a manual checklist tailored to the page under test, and (3) defect reports for violations using the canonical module:* labels."
---

# Accessibility Testing

Web accessibility is a quality attribute, not a checkbox. This skill wires axe-core into the existing Playwright suite, enforces a manual checklist that tools can't catch, and routes violations into the dashboard via `defect-report`.

Aligned with **v2.0 · Coverage Hardening** milestone and [`training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md`](../../../training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md).

---

## When to use this skill

Trigger on:
- "Add a11y tests for…"
- "Run axe on the cart page"
- "Check WCAG compliance"
- "Audit accessibility"
- New UI feature about to merge

**Do NOT use when:**
- The user wants visual regression → use `visual-regression-testing`.
- The user wants performance metrics → use `performance-testing`.
- A real a11y bug was found → file via `defect-report` (this skill **detects**; defect-report **records**).

---

## How to use it

### Phase 1 — Install and configure axe-core/playwright

If the package isn't present:
```bash
npm install --save-dev @axe-core/playwright
```

Add an a11y fixture next to the existing test base (`tests/ui/`):
```ts
// tests/ui/fixtures/a11y.ts
import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ checkA11y: () => Promise<void> }>({
  checkA11y: async ({ page }, use, testInfo) => {
    await use(async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      // attach for triage
      await testInfo.attach('axe-report', {
        body: JSON.stringify(results.violations, null, 2),
        contentType: 'application/json',
      });
      expect.soft(results.violations, formatA11yViolations(results.violations)).toEqual([]);
    });
  },
});

function formatA11yViolations(violations: any[]): string {
  return violations
    .map(v => `${v.id} (${v.impact}): ${v.help}\n  → ${v.nodes.map((n: any) => n.target.join(' ')).join('\n  → ')}`)
    .join('\n\n');
}

export { expect };
```

### Phase 2 — Author the spec

Use `expect.soft` so a single violation doesn't mask others, and tag with `@a11y` per `prompts/core/test-tags.md`:

```ts
import { test, expect } from './fixtures/a11y';

test.describe('Home page accessibility', () => {
  test(
    'TC-A11Y-HOME-01 has no WCAG 2.1 AA violations',
    { tag: ['@P2', '@major', '@a11y', '@home'] },
    async ({ page, checkA11y }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await checkA11y();
    },
  );
});
```

### Phase 3 — Manual checklist (axe catches ~30%, you handle the rest)

After every automated run, walk the page with the checklist below. Tools cannot catch these:

| WCAG criterion | Manual check |
|---|---|
| **2.1.1 Keyboard** | Tab through every interactive element; reach every action; no keyboard traps |
| **2.4.3 Focus Order** | Visual reading order matches DOM order; no jumping |
| **2.4.7 Focus Visible** | Focus ring visible on every focusable element (≥ 3:1 contrast vs background) |
| **1.3.1 Info & Relationships** | Headings descend without skipping (h1 → h2 → h3, never h1 → h3) |
| **3.3.1 Error Identification** | Form errors are programmatically associated with the field (`aria-describedby`) AND visible |
| **4.1.3 Status Messages** | Toasts / live regions use `role="status"` or `aria-live="polite"` |
| **2.5.5 Target Size** | Tap targets ≥ 24×24 CSS px on touch viewports |
| **Screen reader** | Run NVDA / VoiceOver: every interactive element has a meaningful accessible name (no "button button button") |

### Phase 4 — Triage violations

Severity mapping for axe-core `impact` field:

| axe `impact` | Bug severity (defect-labels.md) | Treatment |
|---|---|---|
| `critical`  | `severity:critical` | Block release; fix immediately |
| `serious`   | `severity:major`    | Fix in current sprint |
| `moderate`  | `severity:minor`    | Fix next sprint |
| `minor`     | `severity:trivial`  | Backlog, batch with refactor |

For each violation, file via [`.agents/skills/defect-report`](../defect-report/SKILL.md):
- Title: `a11y: <axe rule id> — <human help text>` (e.g. `a11y: color-contrast — element has insufficient color contrast`)
- Module: derive from page (`module:home`, `module:cart`, …)
- Body: include axe `target` selector array, `failureSummary`, and `helpUrl`
- Label: add `a11y` (in addition to canonical `bug, severity:*, module:*`)

---

## Decision tree

```
Need a11y coverage ?
├── New UI feature       → Phase 1+2+3, soft assertion, tag @a11y
├── Pre-release audit    → Phase 3 (manual) on every page
├── Investigating a complaint
│   ├── Tool-detectable  → axe-core spec to reproduce → defect-report
│   └── User-reported    → manual checklist + screen reader → defect-report
└── Compliance report    → run axe on every route, export per-route violations
```

---

## Best practices

- **Soft, not hard.** Use `expect.soft` so one violation doesn't hide nine others.
- **Test the rendered state, not the placeholder.** Wait for content (`page.waitForLoadState('domcontentloaded')` minimum, `'load'` if images carry labels).
- **Disable and re-enable rules with care.** `disableRules(['color-contrast'])` is sometimes needed for pages with intentional decoration; document why in the spec.
- **Per-region scope.** For SPAs that load incrementally, run `new AxeBuilder({ page }).include('main')` rather than scanning chrome that's not your responsibility.
- **Manual + auto.** Never claim "100% accessible" from axe alone — it covers ~30% of WCAG. The manual checklist closes the gap.
- **Don't auto-fix in tests.** A violation triggers a `defect-report`, not a hidden `aria-label` patch. Tests are evidence, not remediation.

---

## Related

- [`training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md`](../../../training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md) — combined visual + a11y module.
- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — `@a11y` tag definition.
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — for filing violations.
- [`.agents/skills/visual-regression-testing`](../visual-regression-testing/SKILL.md) — sister skill (visual layer).
- [`.github/MILESTONES.md`](../../../.github/MILESTONES.md) — `v2.0 · Coverage Hardening` tracks a11y coverage.
- WCAG 2.1 quick reference: <https://www.w3.org/WAI/WCAG21/quickref/>
