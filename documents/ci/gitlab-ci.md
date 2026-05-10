# GitLab CI Guideline

> Self-hosted-friendly translation of the [shared CI conventions](./shared-conventions.md) into GitLab CI/CD. Keeps **byte-for-byte parity** with the GitHub Actions implementation in [`github-actions.md`](./github-actions.md): same six stages, same matrix, same artifact contract, same trend-restore strategy, same pre-push parity.
>
> Read `shared-conventions.md` first. This doc only covers what's GitLab-specific.

---

## TL;DR

| You want to… | Do this |
|---|---|
| Run the full pipeline on `main` | Push — `[qa, staging, uat]` matrix runs, then `pages` deploys |
| Run on an MR | Open the MR — `[qa]` only by default, no Pages publish |
| Run on demand | CI/CD → Pipelines → **Run pipeline** → set `ENVIRONMENT`, `BROWSER`, `TEST_TYPE`, `SPEC_FILE` variables |
| See the latest QA Metrics Dashboard | `https://<group>.gitlab.io/<project>/` (GitLab Pages domain for your instance) |
| Re-run a failed job | Pipeline view → job → **Retry** (preserves green-job artifacts) |
| Get artifacts locally | `glab ci artifact <job-id>` or "Browse" / "Download" in the job view |

---

## 1. File layout

```
.gitlab-ci.yml                              ← single canonical file
.gitlab/
  issue_templates/                           ← bug, flaky-test, test-coverage-request
  merge_request_templates/Default.md
  ci/                                        ← (optional) included partials when the file gets too big
    install.gitlab-ci.yml
    test.gitlab-ci.yml
    deploy.gitlab-ci.yml
```

Start with one `.gitlab-ci.yml`. Split into `include:` partials only when the file crosses ~400 lines. Multiple top-level pipelines are an anti-pattern (they fight for the same trend file).

---

## 2. Reference layout

```yaml
# .gitlab-ci.yml
stages:
  - lint            # mirrors pre-push: linter + typecheck
  - test            # matrix per env
  - report          # post-test: dashboard + allure
  - pages           # deploy

# Default image — pinned to mirror ubuntu-latest's Node LTS.
default:
  image: mcr.microsoft.com/playwright:v1.59.1-jammy   # bumps with @playwright/test
  interruptible: true                                  # cancel in-progress on new pipeline
  tags: [docker]                                       # pick the runner pool

# Re-used config: dependency cache.
.npm-cache: &npm-cache
  cache:
    key:
      files: [package-lock.json]
    paths:
      - .npm/
      - node_modules/
    policy: pull-push

# Re-used config: trend artifact convention.
.dashboard-artifact: &dashboard-artifact
  name: "qa-metrics-dashboard-$ENV"
  expire_in: 30 days
  paths:
    - artifacts/qa-metrics-dashboard.pdf
    - artifacts/qa-metrics-dashboard.live.html
    - reports/run-summary.json
    - reports/run-trend.json
    - reports/defects.json
  when: always

# Re-used: workflow rules.
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_REF_NAME == "main"
      variables: { MATRIX_ENVS: '["qa","staging","uat"]' }
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      variables: { MATRIX_ENVS: '["qa"]' }
    - if: $CI_PIPELINE_SOURCE == "schedule"
      variables: { MATRIX_ENVS: '["qa","staging","uat"]' }
    - if: $CI_PIPELINE_SOURCE == "web"     # manual run
      variables: { MATRIX_ENVS: $ENVIRONMENT }
    - when: never

# ── Stage: lint (mirrors `pre-push`) ────────────────────────────────────────
lint:
  stage: lint
  <<: *npm-cache
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run linter
    - npm run typecheck

# ── Stage: test (matrix per env) ────────────────────────────────────────────
test:
  stage: test
  <<: *npm-cache
  needs: [lint]
  parallel:
    matrix:
      - ENV: [qa, staging, uat]
  variables:
    CI: "true"
    BROWSER: "Desktop Chrome"
    TEST_TYPE: "all"
    SPEC_FILE: ""
    HEADED: "false"
  before_script:
    - mkdir -p reports
    # Trend restore — best-effort, pull last successful pipeline's artifact for THIS branch + env.
    # API: /projects/:id/jobs/artifacts/:ref/download?job=test
    - |
      set +e
      curl --silent --fail --location \
        --header "JOB-TOKEN: $CI_JOB_TOKEN" \
        --output prev.zip \
        "$CI_API_V4_URL/projects/$CI_PROJECT_ID/jobs/artifacts/$CI_COMMIT_REF_NAME/download?job=test:%5BENV=$ENV%5D" \
      && unzip -q prev.zip -d _prev \
      && cp -f _prev/reports/run-trend.json reports/run-trend.json \
      && echo "✓ trend restored ($(wc -c < reports/run-trend.json) bytes)" \
      || echo "▸ no prior trend for $ENV — starting fresh"
      set -e
  script:
    - |
      if [ -n "$SPEC_FILE" ]; then
        npx playwright test "$SPEC_FILE" --project="$BROWSER"
      elif [ "$TEST_TYPE" = "all" ]; then
        npx playwright test --project="$BROWSER"
      else
        npx playwright test --grep "@$TEST_TYPE" --project="$BROWSER"
      fi
  after_script:
    # Dashboard export — runs even on red (always:) so trend continues + we can see what failed.
    - GITLAB_TOKEN="$CI_JOB_TOKEN" npm run export:dashboard || true
    - npm run allure-generate || true
  artifacts:
    <<: *dashboard-artifact
    reports:
      junit: reports/junit.xml      # native MR widget integration

# Per-job uploads for Allure + Playwright HTML, kept out of the dashboard bundle so retention
# can differ (10 days for raw reports, 30 for the dashboard bundle).
test-reports:
  stage: report
  needs:
    - job: test
      artifacts: true
  script:
    - echo "uploading per-env reports"
  artifacts:
    name: "playwright-and-allure-$ENV"
    expire_in: 10 days
    when: always
    paths:
      - playwright-report/
      - allure-report/
  parallel:
    matrix:
      - ENV: [qa, staging, uat]

# ── Stage: pages (deploy) ───────────────────────────────────────────────────
pages:
  stage: pages
  needs:
    - job: test
      artifacts: true
  rules:
    - if: $CI_COMMIT_REF_NAME == "main"
      when: on_success
    - when: never
  resource_group: pages           # equivalent of GH "concurrency:pages"
  script:
    - mkdir -p public
    - |
      for env in qa staging uat; do
        if [ -f "artifacts/qa-metrics-dashboard.live.html" ]; then
          # Per-env artifacts are merged from the matrix; in GitLab they
          # land flat, so glob to find each env's bundle by suffix.
          mkdir -p "public/$env"
          # Copy the env-specific bundle (artifact name encodes ENV).
          # In practice the parallel matrix produces named artifacts like
          # "qa-metrics-dashboard-qa.zip" — the include step extracts them.
          cp "artifacts/qa-metrics-dashboard.live.html" "public/$env/index.html" || true
          cp -R "allure-report" "public/$env/allure" 2>/dev/null || true
          cp -R "playwright-report" "public/$env/playwright" 2>/dev/null || true
        fi
      done
    # Root index = qa dashboard (canonical).
    - |
      if [ -f "public/qa/index.html" ]; then
        cp "public/qa/index.html" "public/index.html"
      fi
  artifacts:
    paths: [public]               # GitLab Pages publishes ./public verbatim
    expire_in: 30 days
```

This is enough to pass shared-conventions.md §1–9. The next sections cover deviations from the GitHub doc.

---

## 3. What's different from GitHub Actions

| Concept | GitHub | GitLab |
|---|---|---|
| Workflow file | `.github/workflows/playwright.yml` | `.gitlab-ci.yml` (root) |
| Triggers | `on: push / pull_request / workflow_dispatch / schedule` | `workflow.rules` keyed off `$CI_PIPELINE_SOURCE` |
| Manual UI | "Run workflow" button | "Run pipeline" button (variables form) |
| Matrix | `strategy.matrix.env` | `parallel.matrix` with `ENV: [...]` |
| Artifact name | `name: foo-${{ matrix.env }}` | `name: foo-$ENV` (interpolated at runtime) |
| Retention | `retention-days: 30` | `expire_in: 30 days` |
| Concurrency cancel | `cancel-in-progress: true` | `interruptible: true` (job-level) |
| Pages deploy | `actions/deploy-pages@v4` | special `pages:` job + `public/` artifact |
| Pages serialisation | `concurrency: { group: pages }` | `resource_group: pages` |
| Token for API | `${{ github.token }}` | `$CI_JOB_TOKEN` |
| Auto-injected env | `GITHUB_REPOSITORY` | `CI_PROJECT_PATH` |
| Test reports widget | none native; via UI uploads | `artifacts.reports.junit` for the MR widget |
| Container image | `runs-on: ubuntu-latest` (apt-get the world) | `image: mcr.microsoft.com/playwright:v…-jammy` (browsers + deps pre-baked) |

The GitLab Playwright image is a real win — saves the `npx playwright install --with-deps` round-trip and pins browser versions to the framework version.

---

## 4. Trend restore — the API call

GitLab's equivalent of `gh run download` is the **artifact-download-by-ref** API:

```
GET /projects/:id/jobs/artifacts/:ref/download?job=:job_name
```

Two non-obvious details:

1. The `:job_name` for a parallel-matrix job is URL-encoded as `test:[ENV=qa]`. Use `%5B` and `%5D` for `[` and `]`.
2. `JOB-TOKEN` (the env var is `CI_JOB_TOKEN`) is sufficient — no Personal Access Token needed.

Minimal restore snippet (already in the reference layout above):

```bash
curl --silent --fail --location \
  --header "JOB-TOKEN: $CI_JOB_TOKEN" \
  --output prev.zip \
  "$CI_API_V4_URL/projects/$CI_PROJECT_ID/jobs/artifacts/$CI_COMMIT_REF_NAME/download?job=test:%5BENV=$ENV%5D"
unzip -q prev.zip -d _prev
cp -f _prev/reports/run-trend.json reports/run-trend.json
```

Wrap in `set +e` / `||` so a missing artifact (first run) doesn't fail the job.

---

## 5. Manual dispatch UI

GitLab's "Run pipeline" form takes free-form variables. Document them in `.gitlab-ci.yml` like this so the UI surfaces sensible defaults:

```yaml
variables:
  ENVIRONMENT:
    value: "qa"
    options: ["qa", "staging", "uat", "production", "all"]
    description: "Environment(s) to run against"
  BROWSER:
    value: "Desktop Chrome"
    options:
      - "Desktop Chrome"
      - "Desktop Firefox"
      - "Desktop Safari"
      - "Microsoft Edge"
      - "Mobile Chrome"
    description: "Playwright project name"
  TEST_TYPE:
    value: "all"
    options: ["smoke", "regression", "all"]
  SPEC_FILE:
    value: ""
    description: "Optional spec path, e.g. tests/ui/login.spec.ts"
```

The `workflow.rules` block then maps `$ENVIRONMENT == "all"` to the full matrix, otherwise to a single-env list. Keep the same default-and-override semantics as GitHub.

---

## 6. Permissions / runners

| Concern | GitLab default | Recommended |
|---|---|---|
| Runner pool | shared runners on gitlab.com / your instance | Tag `[docker]` or `[playwright-ready]`; do NOT run on Windows runners |
| Job token scope | scoped to current project | Sufficient for `fetch:defects` and trend-restore via `CI_API_V4_URL` |
| Pages | per-project URL (group.gitlab.io/project/) | One-time enable in **Settings → Pages**; same as GitHub |
| Protected branches | configurable | Mark `main` protected; require `lint` + `test:[ENV=qa]` + `test:[ENV=staging]` + `test:[ENV=uat]` to pass |

The most common real-world snag on self-hosted GitLab is runner OS — Playwright needs Linux/Docker; Windows Shared runners will fail when you `npx playwright install --with-deps`. Use the `mcr.microsoft.com/playwright:v…-jammy` image and run on a Docker executor.

---

## 7. Required status checks (MR approval rules)

In **Settings → Merge requests → Merge checks**:

```
☑ Pipelines must succeed
☑ All discussions on the merge request must be resolved
☑ Pipelines on the latest commit
```

Plus, in **Settings → Repository → Protected branches** for `main`:

```
Allowed to push:  Maintainers
Allowed to merge: Maintainers
Code owner approval required (if a CODEOWNERS file exists)
```

Do **not** require the `pages` job — it only runs on `main` push, never on MRs, so requiring it would block every MR forever. Same logic as GitHub.

---

## 8. Trouble-shooting

| Symptom | Cause | Fix |
|---|---|---|
| Trend restore step always says "no prior trend" | URL-encoding of `[` / `]` is wrong | Use `%5B` and `%5D` in the curl URL — the matrix job name is `test:[ENV=qa]` |
| `pages` job runs but URL 404s | First time using Pages on this project | Settings → Pages → enable; redeploy |
| `pages` job runs on every branch | `rules:` missing | Pin to `$CI_COMMIT_REF_NAME == "main"` (see §2) |
| Two MR pushes both run to completion | `interruptible: true` not set on the test job | Add it; matches GitHub's `cancel-in-progress` |
| Allure step fails: `JAVA_HOME not set` | `mcr.microsoft.com/playwright:v…-jammy` doesn't ship Java | `apt-get install -y --no-install-recommends openjdk-17-jre` in `before_script` |
| `Looks like you launched a headed browser…` | `HEADED=true` in CI variables | Remove from CI/CD variables; pin `HEADED=false` in the job's `variables:` |
| MR widget doesn't show test results | `artifacts.reports.junit` missing | Configure Playwright's JUnit reporter and point to `reports/junit.xml` |
| Pages serialisation errors | `resource_group:` missing | Add `resource_group: pages` to the deploy job |
| Defects fetch returns empty | `CI_JOB_TOKEN` lacks `read_api` | Settings → CI/CD → Token Permissions → grant project read_api |

---

## 9. Local reproduction

GitLab provides a faster loop than GitHub for local CI:

```bash
glab ci lint              # validates .gitlab-ci.yml
glab ci run --branch main # triggers a real pipeline against your branch
glab ci view              # streams logs of the latest pipeline

# Or run the test stage purely locally:
ENV=qa BROWSER="Desktop Chrome" TEST_TYPE=all npx playwright test --project="Desktop Chrome"
GITLAB_TOKEN=$(glab auth token) npm run export:dashboard
open artifacts/qa-metrics-dashboard.live.html
```

The first divergence from CI you'll hit is missing `CI_API_V4_URL` / `CI_PROJECT_ID` for trend restore. That's expected — local runs start with the trend file you already have.

---

## 10. Cost / runner-minute guardrails

Self-hosted GitLab cost is runner-time, not API minutes:

- **`interruptible: true`** on the test job — already on; saves the most.
- **`needs:` between stages** — already used; lets unrelated jobs run in parallel.
- **MR pipelines run `[qa]` only** — `workflow.rules` already enforces this.
- **`expire_in:`** — 10d for raw reports, 30d for the dashboard bundle. Match GitHub.
- **`only.changes:`** for stage skipping is tempting — **don't**. Every push to `main` must produce a fresh trend point or the dashboard goes stale silently.

---

## 11. Migrating from GitHub Actions

If you're moving from `.github/workflows/playwright.yml` to GitLab CI, the migration checklist in [`shared-conventions.md` §13](./shared-conventions.md#13-migration-checklist-github--gitlab) is the source of truth. Spot-check by env:

```
□ Pipeline triggers on push to main, MR open/sync, scheduled, manual web
□ Matrix is parallel.matrix with ENV in [qa, staging, uat]
□ Artifact bundle named qa-metrics-dashboard-$ENV with the same paths
□ Trend restore uses CI_JOB_TOKEN against CI_API_V4_URL
□ Pages deploy is a single `pages:` job, gated to main, resource_group=pages
□ Lint + typecheck precede tests in their own stage
□ HEADED is false; image is mcr.microsoft.com/playwright:v…-jammy
□ Required MR checks: lint + test (qa,staging,uat). NOT pages.
□ The dashboard URL in README now reads gitlab.io (or your self-hosted Pages domain)
```

When all boxes pass, delete the GitHub workflow and update `documents/automation-framework/README.md` to point at the new file.

---

## See also

- [`shared-conventions.md`](./shared-conventions.md) — the platform-neutral contract
- [`github-actions.md`](./github-actions.md) — the same setup on GitHub
- [`../../prompts/devops/`](../../prompts/devops/) — the DevOps prompts (`docker-runner`, `parallel-sharding`, `ci-optimizer`) you'll lean on while wiring this
- [`../../.agents/skills/ci-optimizer/SKILL.md`](../../.agents/skills/ci-optimizer/SKILL.md) — agent-skill for tuning wall-time and cost once the pipeline is green
- [`../../.agents/skills/parallel-sharding/SKILL.md`](../../.agents/skills/parallel-sharding/SKILL.md) — sizing workers and shards
- [GitLab CI/CD docs](https://docs.gitlab.com/ee/ci/) — canonical syntax reference
