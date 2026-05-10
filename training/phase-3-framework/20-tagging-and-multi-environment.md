# Module 20 — Test Tagging & Multi-Environment

> Phase 3 · Effort: 3h · Prerequisites: Module 19

## Learning objectives

After this module you can:

- Apply this repo's tag taxonomy: priority, severity, suite, type, feature.
- Explain how tags drive the QA Metrics dashboard, defect labels, and CI matrices.
- Run the same suite against `qa`, `uat`, `staging` without code changes.
- Add a new environment in 5 minutes.

## Why it matters

Tags turn a flat test list into a queryable knowledge base. They drive:
- What runs on smoke vs nightly.
- Which tests count toward `@P1` SLA.
- The dashboard's "by severity / by feature" panels.
- Traceability to GitHub Issues.

Multi-env config means the same test code validates QA → UAT → staging → prod-like — without copy-paste.

## Concepts

### The taxonomy (canonical: `prompts/core/test-tags.md`)

Every test has **at least one tag from each axis**:

| Axis | Required? | Tags | Notes |
|---|---|---|---|
| Priority | yes (1) | `@P1`, `@P2`, `@P3` | How urgent to keep green |
| Severity | yes (1) | `@critical`, `@major`, `@minor`, `@trivial` | Impact if it fails |
| Suite | yes (≥1) | `@smoke`, `@regression` | When it runs |
| Type | yes (1) | `@ui`, `@api`, `@hybrid` | Layer it exercises |
| Feature | yes (≥1) | `@auth`, `@cart`, `@checkout`, `@profile`, `@security`, … | Domain area |

This repo's `pages/base-page.ts` includes an **auto-fixture** that throws if a test is missing the priority/severity axes — guardrail.

### Tagging syntax

```ts
test('TC01 - guest can complete checkout',
  { tag: ['@P1', '@critical', '@smoke', '@regression', '@ui', '@checkout'] },
  async ({ checkoutPage }) => { … }
);
```

The auto-fixture also bridges these tags to **Allure labels**, so the Allure report groups by feature, severity, etc.

### Running by tag

```bash
npx playwright test --grep '@smoke'                       # smoke only
npx playwright test --grep '@P1'                          # P1 only
npx playwright test --grep '@security'                    # security suite
npx playwright test --grep-invert '@flaky'                # exclude flaky
npx playwright test --grep '@P1.*@checkout'               # combine (regex)
```

### Tags drive everything

```
test tags
   │
   ├─ Allure report → groups + filters
   │
   ├─ Custom reporter (reports/custom-reporter.ts)
   │     └─ aggregates into reports/run-summary.json
   │           └─ QA Metrics Dashboard charts
   │
   ├─ CI matrix (smoke on every PR, full regression nightly)
   │
   └─ Defect labels (prompts/core/defect-labels.md)
         └─ severity:* on bugs maps back to test tags
```

### Multi-environment configuration

Profiles in `profiles/`:

```
profiles/
├── .env.qa
├── .env.uat
└── .env.staging
```

Each holds env-specific:

```
ENV=qa
BASE_URL=https://qa.ecommerce.test.com
API_BASE_URL=https://qa.api.ecommerce.test.com
ADMIN_EMAIL=qa-admin@example.com
ADMIN_PASSWORD=…
LANGUAGE=en-gb
```

Loaded by `env.loader.ts` (called from `playwright.config.ts`):

```bash
ENV=qa npm test               # runs against QA
ENV=uat npm test              # runs against UAT
ENV=staging npm test          # runs against staging
```

### Adding a new environment

1. `cp profiles/.env.qa profiles/.env.preprod`
2. Edit URLs / credentials / language
3. Add to CI matrix in `.github/workflows/playwright.yml`:
   ```yaml
   strategy:
     matrix:
       env: [qa, uat, staging, preprod]
   ```
4. Add it to artifact / Pages deployment paths if you need its results published.

### Per-environment test data

```ts
function getEnvProduct(): Product {
  switch (Constants.ENV) {
    case 'qa':      return qaProduct;
    case 'uat':     return uatProduct;
    case 'staging': return stagingProduct;
  }
}
```

Don't hardcode product IDs — they differ across envs.

### CI matrix in this repo

```
playwright.yml runs:
   matrix.env = [qa, uat, staging]
       ↓
   each env produces:
     - playwright-report-<env>
     - allure-report-<env>
     - run-summary-<env>.json
     - run-trend-<env>.json
     - defects-<env>.json
       ↓
   deploy-pages job (only on main)
     assembles a single static site at /<env>/...
```

## Hands-on lab

1. Pick one untagged test (or one with bad tags). Apply the full tag set: 1 priority, 1 severity, ≥1 suite, 1 type, ≥1 feature. Push and verify the auto-fixture passes.
2. Run `--grep '@smoke @ui'` and confirm only intersecting tests run.
3. Add `profiles/.env.dev` (mirror of `.env.qa`). Run `ENV=dev npm test`. Verify it picks up the new file.
4. Read `reports/custom-reporter.ts`. Find where it aggregates by severity. Add a new aggregation: average duration per `@feature` tag.

## Self-check

- [ ] What's the difference between Priority tags (`@P1`) and Severity tags (`@critical`)?
- [ ] Why does this repo's `pages/base-page.ts` enforce tags via an auto-fixture?
- [ ] You want to run only API security tests in CI. What's the `--grep`?
- [ ] What changes (besides URL) when you add a new environment?

## Further reading

- This repo's `prompts/core/test-tags.md` (canonical)
- This repo's `prompts/core/defect-labels.md`
- This repo's `pages/base-page.ts`, `env.loader.ts`, `profiles/`

---

**Prev:** [19 — Models & test data](./19-models-and-test-data.md) · **Up:** [Phase 3 README](./README.md)

🎓 **Phase 3 complete.** Next: [Phase 4 — API & Cross-cutting](../phase-4-api-and-quality/README.md)
