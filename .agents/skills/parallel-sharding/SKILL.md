---
name: parallel-sharding
description: Sizes Playwright workers, shards, and projects for the ai-qa-training suite so that total wall time is minimized and per-shard runtime stays within ±15% of the mean. Configures `playwright.config.ts`, the GitHub Actions matrix, and `playwright merge-reports` so sharded jobs produce a single reviewable HTML artifact. Use when designing or rebalancing parallel CI jobs, or when shards diverge in runtime.
optionalRefs:
  - documents/automation-framework/perf-history.md   # output — captured per-spec timing baseline
---

# Parallel Sharding

This skill chooses the right combination of workers (parallel processes inside one shard) and shards (parallel CI jobs each running `--shard=i/N`) for the ai-qa-training Playwright + TypeScript suite. It treats wall time as the primary metric and keeps shard balance under ±15%.

## When to use this skill

Activate this skill when the user:
- Asks to "shard the regression suite", "speed up nightly", or "balance the matrix".
- Reports one shard much slower than the others.
- Adds enough specs that the current shard count no longer fits the time budget.
- Wants to add a cross-browser nightly (`chromium`, `firefox`, `webkit`) without blowing the time budget.
- Needs to merge sharded reports into a single HTML artifact.

Companion skills: `ci-optimizer` (full workflow), `docker-runner` (containerized shard invocation).

## How to use it

### Step 1 — Define the dimensions
- **Workers** = parallel processes inside ONE shard. Set in `playwright.config.ts` (`workers: …`) or via `--workers=N`. This repo defaults to `Constants.LOCAL_WORKERS = 4` locally and `Constants.WORKERS` (4 unless `process.env.WORKERS` overrides) on CI.
- **Shards** = parallel CI jobs splitting the test set with `--shard=i/N`.
- **Projects** = config variants (currently `chromium`, `firefox`, `webkit`). Each project re-runs the matched test set.

> Total runs = (matched tests) × (projects).
> Total wall time ≈ (longest shard) of (total runs / shards / workers).

### Step 2 — Pick a starting point from the decision table
| Scenario | Workers | Shards |
|---|---|---|
| PR `@smoke` (Chromium only) | 4 | 2 |
| Nightly `@regression` (Chromium) | cores − 1 | 4 |
| Cross-browser nightly | cores − 1 | 4 per browser |
| Visual baseline regen (`@visual --update-snapshots`) | 1 | 1 (deterministic) |
| `tests/api/*` only (no browser) | cores | 1–2 |
| `test.describe.configure({ mode: 'serial' })` blocks | 1 | n/a |

### Step 3 — Configure `playwright.config.ts`
Preserve the existing `Constants`-driven config; add `fullyParallel: true` and choose the reporter by `process.env.CI`:
```ts
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: Constants.MAX_RETRY_ATTEMPTS, // 2
  workers: isCI ? Constants.WORKERS : Constants.LOCAL_WORKERS,
  reporter: isCI ? [['blob'], ['github']] : [['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    headless: !!process.env.HEADLESS,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: Constants.TIMEOUTS.DEFAULT,
  expect: { timeout: Constants.TIMEOUTS.WAIT_LOCATOR },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
```
- `fullyParallel: true` enables file- AND test-level parallelism inside a worker.
- Mark order-dependent suites with `test.describe.configure({ mode: 'serial' })` per file — never globally in `playwright.config.ts`.
- Use `reporter: 'blob'` for shard merging; locally keep `html`.

### Step 4 — Configure the CI matrix
Use the canonical workflow in `prompts/devops/parallel-sharding.md` (look for "CI SHARDING — GitHub Actions"). Key invariants:
- `strategy.fail-fast: false` so a slow/failing shard does not cancel siblings.
- Cache `~/.cache/ms-playwright` keyed by `package-lock.json`.
- Matrix entries `[1/4, 2/4, 3/4, 4/4]`; upload `blob-report` from each shard.
- A merge job downloads all `blob-*` artifacts and runs `npx playwright merge-reports --reporter=html ./all-blob-reports`, then uploads `playwright-report`.

### Step 5 — Profile and balance
1. Capture per-spec median time over the last 5 runs. Save under `documents/automation-framework/perf-history.md` if not already present.
2. Playwright's hash-based sharding is good enough for ≥ 20 specs. For this repo (~14 UI specs + 2 API specs), 4 shards is the right starting point for `@regression`.
3. Re-run; flag any shard outside ±15% of the mean. If a single spec dominates, split it (`describe.split`) or move it to a serial lane.

### Step 6 — Tune workers
Tune up to `cores − 1`. If memory pressure appears (Chromium OOM in CI), drop **workers** before dropping shards — wall time is more sensitive to shard parallelism than to extra workers within a shard.

### Step 7 — Output
Use this template in the PR description:
```
## Profile
| Spec | Median (s) | Tags |
|---|---|---|

## Plan
- Total tests: N
- Shards: K
- Workers per shard: W
- Projects: chromium [+ firefox + webkit if nightly]

## Expected Wall Time
- PR (`@smoke`, chromium, 2 shards × 4 workers): <min>
- Nightly (`@regression`, chromium, 4 shards × cores−1): <min>
- Nightly cross-browser: <min>

## Config Diffs
- `playwright.config.ts`: <diff>
- `.github/workflows/e2e-regression.yml`: <diff>

## Balance Check
| Shard | Tests | Median | Δ from mean |
|---|---|---|---|
```

## Best Practices

**Always**
- Set `fail-fast: false` on the matrix.
- Preserve the `blob` reporter for sharded jobs; `html` only after merge.
- Merge with `playwright merge-reports` — never concatenate HTML by hand.
- Keep balance within ±15% of the shard mean; rebalance if a spec drifts.
- Mark order-dependent suites `serial` per file; keep them on one shard, one worker.

**Never**
- Set workers > cores. You will lose throughput.
- Shard `serial` suites.
- Raise `Constants.MAX_RETRY_ATTEMPTS` to mask flakes — quarantine via tag (`@flaky`) instead.
- Mix `--shard=i/N` with a non-blob reporter.
- Run all three browsers on every PR job (split into nightly).

**Decision tree — rebalancing**
- One shard > 115% of mean? → split its longest spec or move slow specs to a different shard via `--grep-invert` on this shard and `--grep` on another.
- All shards balanced but total wall time still over budget? → increase shards (only if you have unused runner concurrency) or apply `ci-optimizer` levers (selection, caching).
- Memory pressure / Chromium OOM? → drop `workers` first; only shrink shards if cost of CI minutes is the constraint.
- Visual lane unstable? → keep `workers: 1` and `shards: 1` for that lane; deterministic ordering matters more than speed.
