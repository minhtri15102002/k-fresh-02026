---
name: test-code-review
description: "Reviews Playwright test code for smells that don't show up in CI: hard waits (`page.waitForTimeout`), assertion-free tests, mega-tests (one spec covering 6 things), raw `locator(...)` / `click()` / `fill()` calls inside specs (instead of via commonPage helpers), missing tag blocks, missing `@step` decorators on page-object methods, fixture leakage between tests, and pyramid violations (E2E test where unit would do). Use when explicitly asked to 'review these tests', 'audit the test code', 'check for test smells', 'is this spec well-written', or before merging any PR that adds or modifies specs. Surfaces a categorised report with file:line citations and routes fixes through pom-architect, selector-healing, or test-fixing."
---

# Test Code Review

Most test bugs hide as smells, not failures: the hard wait that makes CI 30s slower, the spec that "passes" because it has no assertions, the mega-test that everyone is afraid to touch. This skill names them.

---

## When to use this skill

Trigger on:
- "Review these tests"
- "Audit the test code"
- "Check for test smells"
- "Is this spec well-written?"
- Before merging any PR that adds or modifies `tests/**/*.spec.ts`

Do **not** use when:
- The test is broken (failing) → that's [`test-fixing`](../test-fixing/SKILL.md) territory.
- You're checking tag conventions only → use [`test-tags-validator`](../test-tags-validator/SKILL.md) directly.

---

## The smells (in priority order)

### 🔴 Critical — block the PR

| Smell | Pattern | Why it hurts | Fix |
|---|---|---|---|
| Hard wait | `await page.waitForTimeout(2000)` | makes CI slow, hides race conditions | replace with `expect(...).toBeVisible()` / `waitForLoadState('networkidle')` |
| No assertions | `test('foo', async () => { await page.goto(...) })` | always passes, tests nothing | add ≥ 1 web-first assertion |
| Raw locator in spec | `await page.locator('.btn').click()` | violates POM contract | move to `locators/`, call via `commonPage.click(this.btn)` |
| Direct Playwright action | `await this.btn.click()` inside page object | bypasses retry / logging | route via `this.commonPage.click(this.btn)` per [`pom-generator.md`](../../../prompts/core/pom-generator.md) |
| Missing tag block | `test('foo', async () => { ... })` (no `{ tag: [...] }`) | breaks dashboard rollup | add tags per [`test-tags.md`](../../../prompts/core/test-tags.md); validate with [`test-tags-validator`](../test-tags-validator/SKILL.md) |

### 🟡 Major — fix in next sprint, document otherwise

| Smell | Pattern | Why it hurts | Fix |
|---|---|---|---|
| Mega-test | one `test()` with 8+ steps covering multiple TCs | hard to debug, slow, blocks parallel | split per TC ID |
| `expect()` in page object | `expect(this.label).toHaveText('X')` inside page method | mixes action + assertion | move to spec, OR route via `assertHelper`/`Assertions` per [`pom-generator.md`](../../../prompts/core/pom-generator.md) |
| Missing `@step` | page-object method without `@step('description')` | invisible in Allure | add `@step('Click checkout')` |
| Missing JSDoc | public async method without `/** ... */` | bad onboarding signal | add JSDoc per [`pom-architect`](../pom-architect/SKILL.md) |
| Pyramid inversion | E2E that's really validating unit behaviour | slow, brittle | move to unit/integration |
| Fixture leakage | `test()` mutates module-level state | flaky in parallel | use Playwright fixtures (`test.beforeEach` or `test.extend`) |
| Fragile selector | `:nth-child`, deep CSS chains, hard-coded XPath | locator drift waiting to happen | route through [`selector-healing`](../selector-healing/SKILL.md) |

### 🟢 Minor — nice to fix

| Smell | Pattern | Fix |
|---|---|---|
| Magic strings | `'abc-123-test-user'` in spec | move to `data/` |
| Console.log left in | `console.log(...)` | remove or use `test.info().annotations` |
| Skipped test without comment | `test.skip(...)` no reason | document why; tag `@skipped` |
| Timer-coupled | `Date.now()` comparisons | use Playwright's `expect.poll` |

---

## How to use it

### Phase 1 — Scope

Define the review surface:
- Single PR? → `git diff main...HEAD --name-only -- 'tests/**/*.spec.ts' 'pages/**/*.ts' 'locators/**/*.ts'`
- Whole suite? → all of `tests/`
- One feature? → `tests/{ui,api}/test-<feature>.spec.ts`

### Phase 2 — Run the cheap automated checks first

```bash
npm run validate:tags              # tag-block compliance
npm run typecheck                  # TS errors
npm run linter                     # ESLint + Sonar smells
npx playwright test --list <files> # confirms tests parse
```

Red here ⇒ fix before doing the manual review.

### Phase 3 — Manual scan for the smells above

Use ripgrep:

```bash
# Hard waits
rg "waitForTimeout" tests/

# Raw locator in spec
rg "page\.locator\(" tests/

# Direct action in page object
rg "this\.\w+\.(click|fill|press|clear)\b" pages/

# Tests without tag block
rg -B1 "^\s*test\(" tests/ | rg -A1 -B0 "tag:"

# expect() inside page object
rg "^\s*(await\s+)?expect\(" pages/
```

### Phase 4 — Emit the review

Markdown table grouped by severity, with file:line and a one-line fix recommendation per item:

```markdown
## Test Code Review — PR #123

### 🔴 Critical (3)
- `tests/ui/test-cart.spec.ts:42` — hard wait `waitForTimeout(2000)`. Replace with `expect(toast).toBeVisible()`.
- `pages/ui/profile-page.ts:87` — direct `this.btnSave.click()`; route via `commonPage.click()`.
- `tests/ui/test-login.spec.ts:15` — no assertions. Add `expect(page).toHaveURL(/\/dashboard/)`.

### 🟡 Major (2)
- ...

### 🟢 Minor (5)
- ...
```

### Phase 5 — Route fixes

```
Smell                   → next skill
─────────────────────────────────────────────────────
Raw locator / direct action → pom-architect (refactor) + selector-healing (if drifted)
Missing tags                → test-tags-validator (auto-suggests; agent applies)
Hard waits / fragile         → test-fixing
Mega-test                    → split + rerun via test-fixing
Missing @step / JSDoc        → pom-architect
```

---

## Best practices

- **Run automated checks first.** Don't waste a manual review on something `validate:tags` would catch.
- **Cite line numbers.** "Some tests have hard waits" is useless feedback.
- **One smell per finding.** Don't bundle "no tags + hard wait + mega-test" into one bullet.
- **Block on Critical only.** Major and Minor go in the PR description as follow-ups; CI gate is for Critical.
- **Calibrate to the dashboard.** If a smell doesn't move pass-rate, defect-count, or perf, it's likely Minor.

---

## Related

- [`prompts/core/pom-generator.md`](../../../prompts/core/pom-generator.md) — the canonical "must use commonPage" + assertion-routing rules
- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — tag block requirements
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — automated tag check
- [`.agents/skills/pom-architect/SKILL.md`](../pom-architect/SKILL.md) — fix architecture violations
- [`.agents/skills/selector-healing/SKILL.md`](../selector-healing/SKILL.md) — fix fragile selectors
- [`.agents/skills/test-fixing/SKILL.md`](../test-fixing/SKILL.md) — fix mega-tests / hard waits
- [`.agents/skills/flaky-test-triage/SKILL.md`](../flaky-test-triage/SKILL.md) — when smells correlate with flakiness
