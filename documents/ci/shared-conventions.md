# CI Shared Conventions

> Platform-neutral contract every CI integration in this repo (GitHub Actions today, GitLab CI for self-hosted teams) **must** preserve. Keep these stable; pick the platform-specific syntax from [`github-actions.md`](./github-actions.md) or [`gitlab-ci.md`](./gitlab-ci.md).

The point of this doc is that you can re-platform the pipeline without re-litigating what the pipeline *does*.

---

## 1. Pipeline shape

Every pipeline in this repo runs the same six stages, in this order:

```
┌──────────┐  ┌──────────┐  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌────────┐
│ install  │→ │ pre-test │→ │ test │→ │ post-test│→ │ assemble │→ │ deploy │
└──────────┘  └──────────┘  └──────┘  └──────────┘  └──────────┘  └────────┘
   deps         restore       matrix     export        gather        Pages /
   browsers     trend         per-env    dashboard     artifacts     PR comment
   java/        artifact      Playwright PDF + live    from matrix
   allure                                HTML
                                         allure-gen
```

Each stage has a contract. If a stage can't fulfil the contract, fail loudly — never silently skip.

| Stage | Inputs | Outputs |
|---|---|---|
| **install** | `package-lock.json` | `node_modules/`, Playwright browsers cached, Java + Allure CLI on `$PATH` |
| **pre-test** | (previous successful run on the same branch) | `reports/run-trend.json` seeded — empty file is acceptable, the reporter will append |
| **test** | `ENV`, `BROWSER`, `TEST_TYPE`, `SPEC_FILE` env vars | `playwright-report/`, `allure-results/`, `reports/run-summary.json`, `reports/run-trend.json` (appended) |
| **post-test** | The above + `GH_TOKEN` (for defects fetch) | `artifacts/qa-metrics-dashboard.pdf`, `artifacts/qa-metrics-dashboard.live.html`, `reports/defects.json` |
| **assemble** | All matrix artifacts | A single `site/` tree ready to publish (per-env subpaths + canonical root) |
| **deploy** | `site/`, `main`-branch + push event guard | Pages URL or PR comment with the same URL |

Anything else (lint, type-check, defect-fetch, scorecard) is allowed but must not change the contract above.

---

## 2. Environment matrix (the canonical three)

| Env | Purpose | Always-on? |
|---|---|---|
| `qa` | Hourly / per-PR fast loop | ✅ canonical default |
| `staging` | Nightly / pre-release | ✅ |
| `uat` | Stakeholder demo / sign-off | ✅ |

Conventions:

- The matrix is **always** `[qa, staging, uat]` for `push` to `main` and for `schedule`. PRs default to `[qa]` only (cost control).
- A workflow-dispatch / pipeline-trigger UI **must** allow picking a single env or `all` — never fewer than `[qa]`.
- The matrix axis name is `env` (lower-case). Every artifact name is suffixed with `-${env}` so cross-env collisions are impossible.
- Adding a 4th env (`production`) requires updating this doc, both platform files, the QA Metrics Dashboard, and the Pages deploy script — in that order.

---

## 3. Required env vars

| Var | Source | Used by | Notes |
|---|---|---|---|
| `ENV` | matrix axis | `playwright.config.ts`, `tests/**` | Must be one of `qa` / `staging` / `uat` / `production` |
| `BROWSER` | trigger input or default `Desktop Chrome` | `npx playwright test --project=$BROWSER` | Always quoted on the CLI — value contains a space |
| `TEST_TYPE` | trigger input or default `all` | `--grep "@$TEST_TYPE"` when not `all` | Tag-based filtering; aligns with `prompts/core/test-tags.md` |
| `SPEC_FILE` | trigger input, optional | Direct path to a single `.spec.ts` | When set, supersedes `TEST_TYPE` |
| `CI` | constant `true` | `playwright.config.ts` (retries=2, workers=1) | Never override locally |
| `HEADED` | constant `false` in CI | Playwright launch | Headed needs an XServer — do not enable in CI |
| `GH_TOKEN` / `GITLAB_TOKEN` | `${{ github.token }}` / `$CI_JOB_TOKEN` | `npm run fetch:defects`, `gh run download` | Read-only scope sufficient |
| `GITHUB_REPOSITORY` / `CI_PROJECT_PATH` | auto-injected | dashboard issue links | Already in repo `owner/name` form |

Locale, timezone and Java version are pinned at install time (see install stage). Do not parameterise.

---

## 4. Artifact contract

The post-test stage **must** emit exactly these paths, named exactly like this:

```
artifacts/qa-metrics-dashboard.pdf
artifacts/qa-metrics-dashboard.live.html      ← self-contained, no external deps
playwright-report/                             ← Playwright HTML reporter
allure-report/                                 ← `allure generate` output
reports/run-summary.json                       ← single-run summary (Reporter)
reports/run-trend.json                         ← append-only trend (Reporter)
reports/defects.json                           ← from `npm run fetch:defects`
reports/requirement-scorecards/index.json      ← optional, when requirement-analysis ran
```

Per-matrix-job artifact bundles are uploaded with these names (suffix is the matrix env):

| Bundle name | Contents |
|---|---|
| `playwright-report-${env}` | `playwright-report/` |
| `allure-report-${env}` | `allure-report/` |
| `qa-metrics-dashboard-${env}` | `artifacts/*.pdf`, `artifacts/*.live.html`, `reports/run-summary.json`, `reports/run-trend.json`, `reports/defects.json` |

**Retention** — Playwright + Allure: 10 days; dashboard bundle: 30 days. Trend continuity (see §5) requires the dashboard bundle to outlive the test cadence.

---

## 5. Trend continuity

`reports/run-trend.json` is **append-only across runs**. A fresh checkout starts empty, which would reset the QA Metrics Dashboard's pass-rate chart to one data point every build. The contract:

```
pre-test    : restore reports/run-trend.json from the most recent successful
              run of the same workflow on the same branch + env
test        : append the current run's row (the Playwright reporter handles this)
post-test   : (no-op; export uses whatever is in reports/)
upload      : ship the updated reports/run-trend.json forward inside
              `qa-metrics-dashboard-${env}`
```

Restoration is **best-effort, never fatal** — first runs and forks have nothing to restore, and that's fine. The pre-test step must `continue-on-error`.

---

## 6. Pre-push parity

The local `pre-push` Husky hook runs `npm run check:all`, which is `npm run linter && npm run typecheck`. CI **must** run those identically as a gate before tests:

```
ci:
  - npm ci
  - npm run linter        # eslint --ext .ts tests pages locators utilities data
  - npm run typecheck     # tsc --noEmit
  - npx playwright test …
```

If CI's lint/type set differs from `pre-push`, the local hook becomes lying-by-omission and we lose the fast loop. See [`documents/husky-guidelines.md`](../husky-guidelines.md).

---

## 7. Triggers

| Trigger | Matrix | Block deploy? |
|---|---|---|
| `push` to `main` | `[qa, staging, uat]` | ❌ — deploy if tests pass |
| `push` to other branch | `[qa]` | ✅ — never deploy |
| `pull_request` to `main` / `master` / `develop` | `[qa]` | ✅ — comment instead |
| `schedule` (nightly) | `[qa, staging, uat]` | ✅ on default — opt-in by config |
| `workflow_dispatch` / manual | user-picked | ✅ unless target is `main` |

Deploy gating lives in the `deploy` stage as `if:` conditions, not in earlier stages. Tests always run; only publication is gated.

---

## 8. Concurrency & cancellation

Two concurrency groups:

| Group | Cancel-in-progress? | Why |
|---|---|---|
| `pages` (deploy) | `false` | Pages serialises deploys anyway; cancelling mid-publish leaves a half-published site |
| `<branch>-<workflow>` (test) | `true` | New push supersedes the previous run; saves CI minutes on rapid PR pushes |

Tag the platform syntax accordingly — both files implement this.

---

## 9. Secrets

| Secret | Where stored | Who needs it | Scope |
|---|---|---|---|
| `GH_TOKEN` / `GITLAB_TOKEN` | repo secrets | `fetch:defects`, `gh run download`, PR-comment poster | read-issues, read-actions |
| Pages deploy token | platform-managed | deploy job only | Pages / Pages-equivalent |
| Allure / S3 / SMTP | repo secrets, optional | nightly notifier | Specific to that integration |

Rules:

- Never echo a secret. Use `mask` / `protected` flags.
- A secret needed by tests (e.g. test user passwords) lives in **`.env.<env>` files referenced by `playwright.config.ts`**, not as a literal in the workflow.
- A secret used only at deploy time (Pages) is scoped to the deploy job.

---

## 10. Failure modes & expected behaviour

| Symptom | Likely cause | Action |
|---|---|---|
| Pass-rate chart shows one point per run | trend restore step skipped or wrong artifact name | Confirm the artifact name suffix matches `qa-metrics-dashboard-${env}` |
| Dashboard PDF empty | `npm run export:dashboard` ran before tests, or `reports/run-summary.json` missing | Move the export step *after* the test step; ensure `if: always()` so it runs on red builds too |
| Allure report empty | `allure-results/` not produced — wrong reporter config | Check `allurerc.mjs` is loaded; see [`documents/automation-framework/`](../automation-framework/) |
| `Looks like you launched a headed browser without an XServer` | `HEADED=true` leaked into CI | Pin `headless: true` in `playwright.config.ts`; remove `HEADED` from CI env |
| Pages 404 on first deploy | Pages source not set to "GitHub Actions" | One-time manual step in repo Settings; documented in `github-actions.md` §Setup |
| `gh run download` fails | First run on a new branch (no prior run) — expected | The step must be `continue-on-error: true` |
| `defects.json` empty | `GH_TOKEN` missing / wrong scope | Verify token has `issues: read` |

---

## 11. Required reading per role

| Role | Read first |
|---|---|
| Platform engineer wiring CI for the first time | This doc → `github-actions.md` (or `gitlab-ci.md`) |
| QA engineer running tests in PRs | `github-actions.md` §Triggers + §Trouble-shooting |
| Release manager publishing a build | `github-actions.md` §Pages-deploy + this doc §Triggers |
| Release engineer migrating GitHub→GitLab | This doc cover-to-cover, then `gitlab-ci.md` end-to-end |

---

## 12. Anti-patterns

Don't do these. Each one breaks something elsewhere:

- ❌ **Hard-coding env in matrix.** Use the parameter so manual dispatch can override.
- ❌ **Running deploy inside the test matrix.** Three concurrent Pages deploys serialise and the 2nd/3rd will fail.
- ❌ **Skipping `if: !cancelled()` on report-upload steps.** A cancelled job leaves no artifact, breaking trend continuity.
- ❌ **Re-using artifact names across envs.** The platform silently overwrites and you lose envs other than the last one.
- ❌ **Setting `HEADED=true` "to debug in CI".** The container has no XServer; use a trace + screenshot artifact instead.
- ❌ **Putting test secrets in workflow YAML.** Workflow YAML is in the repo; secrets aren't.
- ❌ **Adding a 4th env without updating the dashboard.** The matrix grows linearly, the dashboard tabs don't auto-discover.

---

## 13. Migration checklist (GitHub ↔ GitLab)

When you re-platform, the contract above does not change. Only the syntax does. Use this checklist:

```
□ Stage names map to the platform's job names
□ Matrix axis is named `env` and values are [qa, staging, uat]
□ Pre-test trend restore is best-effort (continue-on-error)
□ Artifact names suffixed with -${env}
□ Retention: 10d for tests, 30d for dashboard bundle
□ Concurrency: cancel-in-progress on test runs, NOT on pages deploys
□ Deploy gated to main + push/manual only
□ Lint + typecheck identical to pre-push hook
□ Headless enforced; HEADED never set true in CI
□ Secrets re-scoped (the platform-specific token name changes)
□ Dashboard URLs in README updated to new platform's pages domain
```

If any box can't be checked, the migration is not done — pause and resolve before flipping traffic.

---

## See also

- [`github-actions.md`](./github-actions.md) — concrete implementation, anchored to `.github/workflows/playwright.yml`.
- [`gitlab-ci.md`](./gitlab-ci.md) — equivalent for self-hosted GitLab.
- [`../husky-guidelines.md`](../husky-guidelines.md) — the local gate this CI mirrors.
- [`../automation-framework/`](../automation-framework/) — what the tests look like that this CI runs.
- [`../jira/integration.md`](../jira/integration.md) — defect surface that `fetch:defects` writes to.
- [`../../prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — what `TEST_TYPE` greps against.
- [`../../wiki/QA-Metrics-Dashboard.md`](../../wiki/QA-Metrics-Dashboard.md) — what the dashboard artifact renders.
