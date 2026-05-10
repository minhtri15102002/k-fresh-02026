# Module 25 — CI/CD with GitHub Actions

> Phase 5 · Effort: 4h · Prerequisites: Phase 4

## Learning objectives

After this module you can:

- Read every line of `.github/workflows/playwright.yml`.
- Add a job, a step, a matrix axis, or a secret without breaking CI.
- Use **artifacts**, **caching**, and **environment protection rules**.
- Choose between **CI quality gates** that block PRs vs. **nightly** jobs that report.

## Why it matters

A test that doesn't run in CI is mostly decoration. CI is also where flakiness hurts most — minutes of CI = dollars of cloud + frustration. Knowing how to wire jobs efficiently is a senior QA superpower.

## Concepts

### Workflow file structure

```yaml
name: Playwright

on:
  push: { branches: [main, debug] }
  pull_request: { branches: [main] }
  workflow_dispatch:                  # manual trigger
  schedule: [{ cron: '0 2 * * *' }]   # nightly

permissions:
  contents: read
  pages: write          # only the deploy job needs this
  id-token: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        env: [qa, uat, staging]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
        env: { ENV: ${{ matrix.env }} }
      - uses: actions/upload-artifact@v5
        if: always()
        with:
          name: playwright-report-${{ matrix.env }}
          path: playwright-report/
```

### Triggers — pick the right one

| Trigger | Use |
|---|---|
| `push` to `main` | Full regression |
| `pull_request` | Smoke + typecheck + lint (gates merge) |
| `schedule` | Nightly long-running suites |
| `workflow_dispatch` | Manual reruns / one-offs |
| `workflow_run` | Chained workflows |

### Matrix runs — multiplying the build

```yaml
matrix:
  env: [qa, uat, staging]
  shard: [1, 2, 3, 4]
```

→ 12 parallel jobs (3 envs × 4 shards). Each shard runs a slice of the suite (Module 26).

### Artifacts (the QA window into CI)

```yaml
- uses: actions/upload-artifact@v5
  if: always()                # upload even if previous step failed
  with:
    name: artifact-${{ matrix.env }}-shard-${{ matrix.shard }}
    path: |
      playwright-report/
      allure-results/
      test-results/
      reports/
    retention-days: 7
```

**Naming gotcha**: with matrix, names collide. Always include matrix vars in the name.

### Caching

```yaml
- uses: actions/setup-node@v4
  with: { node-version: '20', cache: 'npm' }    # caches ~/.npm

- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
```

Saves 1–2 min per job by skipping browser re-download.

### Secrets

```yaml
env:
  ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

Defined in repo settings → Secrets and variables → Actions. Never echo them; GitHub redacts known secrets but not your test output.

### Environment protection

```yaml
environment:
  name: production
  url: https://prod.example.com
```

Configures required reviewers, wait timers, and secrets scoped to the environment. Use for prod smoke tests.

### Quality gates vs reports

| Pattern | Job runs on | What it gates |
|---|---|---|
| **Pre-push hook** (`.husky/pre-push`) | Every push | Local typecheck + lint |
| **PR check** | `pull_request` | Smoke + linter + typecheck |
| **Merge gate** | `push` to `main` | Full regression |
| **Nightly** | `schedule` | Long suites, perf, security, full a11y |
| **Release smoke** | `workflow_dispatch` | Production pre-flight |

This repo's `playwright.yml` runs on PR + push to `main` + push to `debug`.

### Artifact → Pages deployment (this repo)

```
matrix jobs (qa/uat/staging) → artifacts
                                  ↓
                             deploy-pages job (only on main)
                                  ↓
                          assembles site/ from artifacts
                                  ↓
                          actions/upload-pages-artifact@v3
                                  ↓
                          actions/deploy-pages@v4
                                  ↓
                          https://<owner>.github.io/<repo>/
```

Result: every push to `main` auto-publishes the latest QA Metrics Dashboard + Allure + Playwright reports.

### Common pitfalls

- **Forgetting `if: always()`** on artifact upload → artifacts only on success → useless for failures.
- **Missing `chromium` install** → tests fail immediately.
- **Default `fail-fast: true`** in matrix → one shard's flake kills the whole matrix.
- **No `concurrency` group** → 5 PRs queue 5 jobs; later commits don't cancel earlier runs.
- **`HEADLESS` env var** that *forces* headed mode (this repo's old bug) → set up `HEADED=true` opt-in instead.

## Hands-on lab

1. Read `.github/workflows/playwright.yml` line-by-line. For each step, write down what would happen if you removed it.
2. Add a `pull_request` job that runs ONLY `@smoke` tests in 5 minutes or less.
3. Add a `schedule` workflow that runs `@security` tests nightly and posts results to a Slack channel via webhook.
4. Identify one place where caching could shave time. Add it.

## Self-check

- [ ] When do you use `if: always()`?
- [ ] Why does this repo's matrix include `fail-fast: false`?
- [ ] What's the right trigger for "block PR if smoke fails"?
- [ ] Where would you add a 30-min timeout to a nightly job?

## Further reading

- docs.github.com/en/actions
- This repo's `.github/workflows/playwright.yml`

---

**Next:** [26 — Parallel sharding & matrix runs](./26-parallel-sharding-and-matrix.md) · **Up:** [Phase 5 README](./README.md)
