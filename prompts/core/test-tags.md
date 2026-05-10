# Test Tagging Convention

Single source of truth for the tags carried by every Playwright test in this repo.
The same tags drive **`--grep` filtering**, **the QA Metrics Dashboard** (`templates/qa-metrics-dashboard.html`), and **Allure labels** — so they only need to be declared once, on the test itself.

---

## TL;DR

```ts
test('TC_CHK_001: Successful checkout via different shipping address',
  { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@checkout'] },
  async ({ checkoutPage }) => { /* ... */ }
);
```

Every test **MUST** carry exactly **one priority** (`@P1` / `@P2` / `@P3`) and **one severity** (`@critical` / `@major` / `@minor` / `@trivial`). The pre-test guardrail in `pages/base-page.ts` fails the test with a clear error if either is missing. Set `STRICT_TAGS=false` to downgrade the failure to a warning while iterating locally.

---

## The five dimensions

| # | Dimension | Allowed tags | Cardinality | Default if missing |
|---|-----------|--------------|-------------|--------------------|
| 1 | **Priority** | `@P1`, `@P2`, `@P3` | exactly one | guardrail fails the test |
| 2 | **Severity** | `@critical`, `@major`, `@minor`, `@trivial` | exactly one | guardrail fails the test |
| 3 | **Suite**    | `@smoke`, `@regression` | zero or more | — |
| 4 | **Type**     | `@ui`, `@api`, `@hybrid` | zero or one (inferred from path if missing) | inferred from `tests/api/**` vs `tests/ui/**` |
| 5 | **Feature**  | `@auth`, `@cart`, `@checkout`, `@profile`, `@product`, `@compare`, `@wishlist`, `@home`, `@security` | zero or one (extend as new features land) | — |

### 1. Priority — *should we ship without this passing?*

| Tag | When to use | Examples |
|-----|-------------|----------|
| `@P1` | **Release blocker.** Failure breaks a critical user journey or revenue path. | Login, register, add-to-cart for the canonical product, place order, password change, logout |
| `@P2` | **Should-pass.** Failure degrades UX but core flows still work. | Cart CRUD edges, profile edits, address book CRUD, validation messages |
| `@P3` | **Nice-to-have.** Failure is a minor polish issue or non-critical edge case. | Compare-products UI, size charts, popups, "delete the only address" guard |

### 2. Severity — *how bad is the bug if this test fails?*

Maps 1:1 onto Allure's standard `SeverityLevel` enum (so the same tag lights up the Allure report).

| Tag | Meaning |
|-----|---------|
| `@critical` | Data loss, money loss, security hole, or total flow breakage |
| `@major`    | Important functionality broken; clear workaround exists |
| `@minor`    | Cosmetic / convenience issue, no functional blocker |
| `@trivial`  | Typo, copy nit, demo-only path |

> **Rule of thumb:** Priority is *business* ("should we ship?"); severity is *technical* ("how loud is the bug?"). They usually correlate but can diverge — e.g. a `@P3` test for an obscure compare-products edge case can still be `@major` if it would lose data.

### 3. Suite — *which run am I in?*

- `@smoke` — minimal set, < 5 minutes, run on every PR. Pick the single happy-path test per feature.
- `@regression` — full coverage, run on merge to `debug` / nightly. Most tests should carry this.

A test can carry both, neither, or only one.

### 4. Type — *what layer am I exercising?*

Optional because it's also inferred from the file path:

| Tag | Inferred when | Override needed |
|-----|---------------|-----------------|
| `@ui` | spec lives under `tests/ui/**` | no |
| `@api` | spec lives under `tests/api/**` | no |
| `@hybrid` | spec drives the UI **and** asserts on a parallel API call (e.g. `tests/api/test-cart-ui-api.spec.ts`) | **yes** — add the tag explicitly |

### 5. Feature — *which product area?*

The feature tag groups tests in the dashboard's "By feature" breakdown and powers `--grep "@checkout"`. Use the table below; add a new tag (and update this doc) when a new product area lands.

| Feature tag | Covers |
|-------------|--------|
| `@auth`     | register, login, logout, password change |
| `@cart`     | cart CRUD (UI and API) |
| `@checkout` | checkout flow, billing/shipping, confirmation |
| `@profile`  | account dashboard, edit account, address book |
| `@product`  | PDP, quantity counters, size charts, popups |
| `@compare`  | compare products page |
| `@wishlist` | wishlist add/remove, wishlist → cart |
| `@home`     | homepage navigation, hero entry points |
| `@security` | session hardening, transport security, authorization, brute-force resistance (`tests/api/test-security.spec.ts`) |

---

## Useful filters

```bash
npx playwright test --grep "@P1"                # release-gate
npx playwright test --grep "@smoke"             # PR gate (~5 min)
npx playwright test --grep "@checkout"          # ship a checkout fix
npx playwright test --grep "@P1.*@critical"     # belt-and-suspenders
npx playwright test --grep-invert "@P3"         # CI default — skip nice-to-haves
npx playwright test --grep "@api @cart"         # cart API contract changes
```

Tags also surface in:
- **Playwright HTML report** — top of each test row.
- **Allure report** — Severity column + a "Priority" custom label, applied automatically by the bridge in `pages/base-page.ts`.
- **QA Metrics Dashboard** — the "By priority", "By severity" and "By tag" cards read these directly from `reports/run-summary.json` (no manual updates).

---

## Worked examples

```ts
// Release-blocker happy path
test('TC_CHK_001: Successful checkout via different shipping address',
  { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@checkout'] },
  async ({ checkoutPage }) => { /* ... */ });

// Important validation, but not a release blocker
test('TC-004: Register with password mismatch',
  { tag: ['@P2', '@major', '@regression', '@ui', '@auth'] },
  async ({ registerPage }) => { /* ... */ });

// Pure UI polish — won't gate a release
test('TC03 - Verify size chart functionality',
  { tag: ['@P3', '@minor', '@regression', '@ui', '@product'] },
  async ({ productPage }) => { /* ... */ });

// API contract (type inferred from path, but @api is explicit for clarity)
test('TC01 - Add product to cart',
  { tag: ['@P1', '@critical', '@smoke', '@regression', '@api', '@cart'] },
  async ({ apiPage }) => { /* ... */ });

// UI + API hybrid — type tag is REQUIRED here (path inference would say @api)
test('TC01 - Add product to cart (hybrid)',
  { tag: ['@P2', '@major', '@regression', '@hybrid', '@cart'] },
  async ({ productPage, commonPage }) => { /* ... */ });
```

---

## Related references

- `prompts/core/playwright-test-generator-prompt.md` — the test-generation prompt that's expected to emit these tags by default for new tests.
- `prompts/core/locators-naming.md` — locator naming convention (different concern, same single-source-of-truth ethos).
- `reports/custom-reporter.ts` — aggregator that reads `testCase.tags` after each run and writes the dashboard JSON.
- `pages/base-page.ts` — auto-fixture that enforces the convention and bridges the tags into Allure.
