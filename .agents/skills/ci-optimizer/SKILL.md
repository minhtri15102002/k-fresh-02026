---
name: ci-optimizer
description: Optimizes the ai-qa-training Playwright + TypeScript CI workflow for wall-clock time and CPU-minutes without sacrificing reliability. Tunes test selection, sharding, workers, browser scope, caching, artifacts, and reporters in `playwright.config.ts`, `package.json`, and `.github/workflows/*.yml`. Use when reducing CI runtime, designing a new e2e workflow, or justifying performance changes with measured before/after numbers.
optionalRefs:
  - documents/automation-framework/ci-history.md   # output — created on first baseline capture
---

# CI Optimizer

This skill drives a measurement-first approach to Playwright CI tuning for the ai-qa-training repo (LambdaTest e-commerce playground SUT). Every recommendation is backed by a baseline number, a lever, and a verified after number.

## When to use this skill

Activate this skill when the user:
- Asks to "speed up CI", "reduce CI minutes", "shrink the PR job", or "cut wall-clock time".
- Reports a slow `pull_request` or nightly `e2e` workflow.
- Wants a new `.github/workflows/*.yml` for Playwright tests (PR smoke + nightly regression).
- Needs to justify retries, sharding, browser scope, or cache strategy in a PR description.
- Mentions targets like "PR < 8 min" or "nightly < 45 min".

Companion skills: `parallel-sharding` (shard count + balance), `docker-runner` (container image), `webapp-testing`, `e2e-testing-patterns`.

## How to use it

### Step 1 — Capture a baseline
Pull the median and p95 wall time of each CI job over the **last 5 runs**. Record per-step timings (especially `npm ci`, `playwright install`, test execution). Save the baseline table in `documents/automation-framework/ci-history.md`.

### Step 2 — Identify the top-3 bottlenecks
Common offenders in this repo:
1. `npm ci` without cache (no `actions/setup-node` `cache: 'npm'`).
2. `npx playwright install` without `~/.cache/ms-playwright` cache.
3. Single-job test execution with no shards.
4. All three browsers (`chromium`, `firefox`, `webkit`) running on every PR.

### Step 3 — Apply levers (ordered by impact)
| # | Lever | Where | Notes |
|---|---|---|---|
| 1 | Test selection | `--grep "@smoke"` on PR, `@regression` nightly | Keep `@visual` on its own job |
| 2 | Sharding | `--shard=i/N` matrix | Use `parallel-sharding` skill for sizing |
| 3 | Workers | `Constants.WORKERS` env override (`WORKERS=…`) | Cap at 4 on macOS runners |
| 4 | Browser scope | Chromium on PR; FF + WebKit nightly only | `--project=chromium` |
| 5 | Caching | `actions/setup-node` `cache: 'npm'` + `~/.cache/ms-playwright` keyed by `package-lock.json` | |
| 6 | Artifacts | `trace: 'retain-on-failure'`, video on retry, HTML report on demand | already configured |
| 7 | Fail-fast | `--max-failures=10` on PR; unlimited nightly | |
| 8 | Reporters | `blob` on shards → merge with `playwright merge-reports --reporter=html`; `github` for PR annotations | |
| 9 | Retries | Keep `Constants.MAX_RETRY_ATTEMPTS = 2`; quarantine flakes via `@flaky`, exclude from PR `--grep` | never raise to mask flakes |
| 10 | Linter gate | Run `npm run linter` as a parallel job; do not block tests | |

### Step 4 — Verify
Re-run twice; require a **2-run median**, not a single sample. Compare against the baseline table and record the delta.

### Step 5 — Document
Output the result in the standard format:
```
## Baseline
| Job | Median | p95 |
|---|---|---|

## Bottlenecks
1. <step> — <reason> — <evidence: log line or timing>

## Levers Applied
- <lever> → expected savings: <X min> → cost: <Y CPU-min>

## After
| Job | Median | p95 | Δ |
|---|---|---|---|

## Config Diffs
- `playwright.config.ts`: <diff>
- `.github/workflows/e2e.yml`: <diff>
- `package.json` scripts: <diff>

## Risks & Rollback
- <risk> → rollback: <command or revert SHA>
```

### Step 6 — Reference the canonical workflow
Use the full workflow template in `prompts/devops/ci-optimizer.md` (lint job + PR smoke matrix + nightly regression matrix + merge-reports job). Adapt names and matrices; do not invent new structure.

## Best Practices

**Always**
- Cap retries to ≤ 2 in CI; quarantine chronic flakes via `@flaky` and exclude from PR `--grep`.
- Merge sharded reports with `playwright merge-reports` to produce a single HTML artifact.
- Cache `~/.cache/ms-playwright` keyed by `hashFiles('package-lock.json')`.
- Inject secrets via `env:` from GitHub Secrets so `env.loader.ts` → `profiles/.env.<ENV>` picks them up before `playwright.config.ts` reads `Constants`.
- Provide measurable targets (PR < 8 min, nightly < 45 min) and validate against them.

**Never**
- Trade flake for speed. Retries hide regressions; fix the test instead.
- Run all browsers on every PR.
- Download all Playwright browsers when the job needs only one. Use `npx playwright install --with-deps chromium`.
- Store secrets in `profiles/.env.*` files committed to the repo.
- Recommend changes without baseline + after numbers.

**Decision tree — picking the next lever**
- Job > 8 min on PR? → first apply Lever 1 (test selection: `@smoke`-only) before sharding.
- Cold install dominates? → apply Lever 5 (cache) before sharding.
- Test execution itself dominates? → apply Lever 2 (sharding) and Lever 3 (workers).
- Cross-browser job slow? → apply Lever 4 (split into nightly).
