# GitHub Actions Guideline

> Concrete implementation of the [shared CI conventions](./shared-conventions.md) on GitHub Actions, anchored to the actual workflow file at [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml). Read `shared-conventions.md` first — this doc only covers what's GitHub-specific.

---

## TL;DR

| You want to… | Do this |
|---|---|
| Run all tests on a push to `main` | Push — pipeline auto-runs `[qa, staging, uat]`, deploys to Pages |
| Run tests on a PR | Open the PR — runs `[qa]` only, no deploy |
| Run a single env / browser / spec on demand | Actions tab → "Playwright Tests" → **Run workflow** → fill the form |
| See the latest QA Metrics Dashboard | <https://khanhdodang.github.io/ai-qa-training/> |
| Re-run a failed job | Actions tab → run → **Re-run failed jobs** (preserves artifacts of the green jobs) |
| Get artifacts locally | `gh run download <run-id>` (or click "Artifacts" in the run view) |

---

## 1. File layout

```
.github/
  workflows/
    playwright.yml      ← the only workflow; keep it the only one
  ISSUE_TEMPLATE/       ← bug, feature, flaky-test, test-coverage-request templates
  pull_request_template.md
  MILESTONES.md         ← seeded by scripts/bootstrap-milestones.sh
```

**Never add a second workflow file** without first asking whether it can fit as a job inside `playwright.yml`. Multiple workflows make trend continuity (§5 of `shared-conventions.md`) much harder because each one needs its own artifact-restore logic.

---

## 2. Triggers

```yaml
on:
  push:
    branches: [main, master]            # full matrix + deploy
  pull_request:
    branches: [main, master, develop]   # qa-only, no deploy
  workflow_dispatch:                    # manual UI trigger
    inputs:
      environment: [qa, staging, uat, production, all]
      browser:     [Desktop Chrome, Desktop Firefox, Desktop Safari, Microsoft Edge, Mobile Chrome]
      test_type:   [smoke, regression, all]
      spec_file:   string (optional path)
```

The matrix is computed dynamically from `inputs.environment`:

```yaml
matrix:
  env: ${{ fromJson(
    (github.event_name == 'workflow_dispatch'
      && github.event.inputs.environment != 'all')
    && format('["{0}"]', github.event.inputs.environment)
    || '["qa","staging","uat"]'
  ) }}
```

**What this gives you:**
- Push or schedule → `[qa, staging, uat]` (full matrix).
- Manual run with one env picked → that env only.
- Manual run with `all` → full matrix.
- PR → currently `[qa, staging, uat]` for parity. If CI cost matters, scope PRs to `[qa]` by adding a separate matrix expression keyed off `github.event_name == 'pull_request'`.

---

## 3. Permissions

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

These are **workflow-level minimums**. The deploy job re-asserts them at job-level so the `test` job runs without `pages: write` (defence in depth — a compromised test job can't push to Pages).

Do not widen to `contents: write` unless you're committing back to the repo (we don't).

---

## 4. The `test` job (matrix per env)

Stage-by-stage, each step maps to a section in `shared-conventions.md`:

| Step | Conv § | Notes |
|---|---|---|
| `actions/checkout@v5` | install | Default depth (1) is fine; we don't need history |
| `actions/setup-node@v5` (`lts/*`, `cache: npm`) | install | npm cache is keyed by `package-lock.json` |
| `npm ci` | install | Always `ci`, never `install` — lockfile is canonical |
| `npx playwright install --with-deps` | install | `--with-deps` brings system libs the headless browser needs |
| `actions/setup-java@v4` (Temurin 17) | install | Allure CLI runs on the JVM |
| `npm install -g allure` | install | Global install survives a single job; matrix re-installs each |
| **Restore previous `run-trend.json`** | pre-test | `gh run list` → `gh run download` → `cp` into `reports/`; `continue-on-error: true` |
| **Run Playwright tests** | test | Branches on `SPEC_FILE` → `TEST_TYPE = all` → tag-grep |
| **Export QA Metrics Dashboard** | post-test | `npm run export:dashboard` (chains `fetch:defects` first) |
| **Upload `playwright-report-${env}`** | post-test | retention 10d |
| **Upload `qa-metrics-dashboard-${env}`** | post-test | retention 30d |
| **`npm run allure-generate`** | post-test | reads `allure-results/` written during the test step |
| **Upload `allure-report-${env}`** | post-test | retention 10d |

The `if: ${{ !cancelled() }}` guard is on every report/upload step so a single test failure doesn't kill the artifacts.

### Restoring trend across runs

The pre-test restore is the single most important non-obvious step. Without it the dashboard's pass-rate chart resets every run:

```yaml
- name: Restore previous run-trend.json
  if: ${{ !cancelled() }}
  env:
    GH_TOKEN: ${{ github.token }}
  continue-on-error: true   # first runs and forks have nothing to restore
  run: |
    mkdir -p reports
    PREV_RUN_ID=$(gh run list \
      --workflow "${{ github.workflow }}" \
      --branch "${{ github.ref_name }}" \
      --status success \
      --limit 1 \
      --json databaseId \
      --jq '.[0].databaseId' || echo "")

    if [ -n "$PREV_RUN_ID" ] && [ "$PREV_RUN_ID" != "${{ github.run_id }}" ]; then
      gh run download "$PREV_RUN_ID" \
        --name "qa-metrics-dashboard-${{ matrix.env }}" \
        --dir _prev 2>/dev/null || true
      [ -f _prev/reports/run-trend.json ] \
        && cp _prev/reports/run-trend.json reports/run-trend.json
    fi
```

Two non-obvious details:

1. The `--name` filter uses the matrix-suffixed bundle so `qa` doesn't restore `staging`'s trend.
2. The `|| echo ""` and `2>/dev/null` are intentional. A first run on a new branch has nothing to restore and that's fine; the reporter starts fresh.

---

## 5. The `deploy-pages` job (one per workflow run)

```yaml
deploy-pages:
  needs: test
  if: github.ref == 'refs/heads/main'
     && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')
  concurrency:
    group: pages
    cancel-in-progress: false
```

| Step | Notes |
|---|---|
| `actions/download-artifact@v5` (`path: _artifacts`) | Downloads all matrix artifacts (`qa-metrics-dashboard-qa`, `…-staging`, `…-uat`, plus the Allure + Playwright bundles) |
| **Assemble Pages site** | Per-env subpaths: `/qa/`, `/staging/`, `/uat/` each with `index.html` (live dashboard), `allure/`, `playwright/`. Root `/` is a copy of `qa`'s dashboard for canonical URL |
| `actions/upload-pages-artifact@v3` (`path: site`) | Bundles the assembled tree |
| `actions/deploy-pages@v4` | One-shot deploy; URL surfaces in the run summary |

### One-time setup

GitHub Pages needs a manual flip the first time:

1. Repo → **Settings** → **Pages** → **Source** → "GitHub Actions".
2. (Optional) Set a custom domain.
3. First push to `main` after this triggers a real deploy. Verify at <https://${owner}.github.io/${repo}/>.

If you skip this, the workflow runs green but every Pages API call 404s.

---

## 6. Concurrency

```yaml
# Test job (per workflow run, per ref):
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Why `cancel-in-progress: true` for tests but `false` for Pages: a cancelled test run wastes CI minutes; a cancelled deploy leaves a half-published site.

---

## 7. Secrets used

| Secret | Auto-injected? | Where read |
|---|---|---|
| `${{ github.token }}` | yes | `GH_TOKEN` env on the trend-restore + `npm run fetch:defects` steps |
| `GITHUB_REPOSITORY` | yes (`owner/repo`) | `npm run export:dashboard` for issue links |

If you add an SMTP / Slack / S3 secret later, scope it to the **deploy** job, not the test job. The test job re-runs more often and any leak surface should be minimal.

---

## 8. Required status checks (branch protection)

Recommended branch-protection setup for `main`:

```
Settings → Branches → main → Branch protection
  ☑ Require status checks to pass before merging
      Required:
        ☑ test (qa)
        ☑ test (staging)
        ☑ test (uat)
  ☑ Require branches to be up to date before merging
  ☑ Require linear history
  ☑ Include administrators
```

Do **not** require `deploy-pages` — it only runs on `push`, never on PRs, so requiring it would block every PR forever.

---

## 9. Manual dispatch UI

The `workflow_dispatch` block defines the form a maintainer fills in via the Actions tab:

| Field | Default | Range |
|---|---|---|
| `environment` | `qa` | qa / staging / uat / production / all |
| `browser` | `Desktop Chrome` | Desktop Chrome / Firefox / Safari / Edge / Mobile Chrome |
| `test_type` | `all` | smoke / regression / all |
| `spec_file` | (empty) | a path like `tests/ui/test-checkout.spec.ts` |

When `spec_file` is set, it supersedes `test_type` (the script branches on `[ -n "$SPEC_FILE" ]`).

---

## 10. Trouble-shooting

| Symptom | Cause | Fix |
|---|---|---|
| `gh run list … databaseId` returns blank | First run on this branch | Expected — `continue-on-error` swallows it |
| `gh run download` says "no artifact" | Previous run was cancelled and produced none | Expected for cancellations; otherwise check the bundle name suffix matches the env |
| Dashboard PDF says "no data" | `posttest` ran before tests in a hand-rolled invocation | The CI step always runs `npm run export:dashboard` *after* `npx playwright test`; check you didn't reorder |
| Pages deploy ≠ what's in `main` | Looking at the wrong env's subpath | Root `/` mirrors `qa`. Check `/staging/` or `/uat/` for the others |
| `Looks like you launched a headed browser…` | `HEADED=true` slipped in | Remove `HEADED` from `env:` blocks; `playwright.config.ts` defaults `headless: true` |
| Concurrent runs both deploy | `concurrency:` block missing on the deploy job | Re-add `group: pages, cancel-in-progress: false` |
| `npm ci` slow | Cache miss | Confirm `actions/setup-node@v5` has `cache: 'npm'`; if it's already there, the lockfile changed |
| Allure step crashes with `JAVA_HOME not set` | Java setup step skipped | Ensure `actions/setup-java@v4` runs *before* `npm install -g allure` |
| Test job fails on `Restore previous run-trend.json` | `gh` not installed (unlikely on `ubuntu-latest`) | Re-pin to `runs-on: ubuntu-latest`; do not switch to `ubuntu-22.04-arm` without retesting |

---

## 11. Local reproduction

A developer can re-run the CI script locally:

```bash
# install (mirrors the install stage)
npm ci
npx playwright install --with-deps

# pre-test (no-op locally; trend file is whatever you have)
mkdir -p reports

# test
ENV=qa BROWSER="Desktop Chrome" TEST_TYPE=all npx playwright test --project="Desktop Chrome"

# post-test
GH_TOKEN=$(gh auth token) npm run export:dashboard

# inspect
open artifacts/qa-metrics-dashboard.live.html
```

This reproduces almost everything the CI does. The only divergence: the trend file is whatever exists in your local `reports/` folder (CI starts from the previous successful run).

---

## 12. Cost guardrails

GitHub-hosted minutes add up. Cheap wins:

- **PRs run `[qa]` only** if cost matters — change the matrix expression to scope by event.
- **`cancel-in-progress: true` on tests** — already on; keep it.
- **`actions/setup-node@v5` cache** — already on; keep it.
- **`retention-days` finite** — 10d for test reports, 30d for dashboard. Do not raise without justification.
- **No nightly schedule by default.** Add a `schedule:` block only when business need is clear; nightly × 3 envs × 30 days = 90 free runs every cycle.

---

## 13. Migrating away

If you ever need to leave GitHub Actions, the contract you must preserve is in [`shared-conventions.md`](./shared-conventions.md) §13. The GitLab equivalent is in [`gitlab-ci.md`](./gitlab-ci.md). Anything in **this** file is GitHub Actions-specific and won't translate.

---

## See also

- [`shared-conventions.md`](./shared-conventions.md) — the platform-neutral contract
- [`gitlab-ci.md`](./gitlab-ci.md) — the same setup on GitLab
- [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml) — the file this doc describes
- [`../husky-guidelines.md`](../husky-guidelines.md) — the local gate this CI mirrors
- [`../../README.md`](../../README.md) — top-level overview, including the live dashboard URL
- [GitHub Actions docs](https://docs.github.com/actions) — canonical syntax reference
