# Module 26 — Parallel Sharding & Matrix Runs

> Phase 5 · Effort: 3h · Prerequisites: Module 25

## Learning objectives

After this module you can:

- Distinguish **workers** (in-process parallel) from **shards** (cross-machine parallel).
- Pick the right combination for your suite size and CI budget.
- Avoid the most common parallel pitfalls: shared state, race conditions, flaky cleanup.
- Calculate optimal shard count from suite duration and target wall-clock.

## Why it matters

A 4-hour test suite is unusable. The same suite, sharded 8-way with 4 workers each, runs in 8 minutes. Sharding is the lever that makes "run everything on every PR" feasible.

## Concepts

### Workers vs shards

| | Workers | Shards |
|---|---|---|
| What | Multiple processes on **one machine** | Multiple **machines / runners**, each running a subset |
| Set via | `playwright.config.ts` `workers` or `--workers=N` | `--shard=current/total` flag + CI matrix |
| Limited by | CPU cores, memory | Cloud budget, queue concurrency |
| Isolation | Per-worker (own browser instance) | Per-runner (own filesystem) |

You combine them: each shard runs N workers.

### Sharding command

```bash
npx playwright test --shard=1/4
npx playwright test --shard=2/4
# … shards 3 and 4 run in parallel on other machines
```

Playwright divides tests deterministically across shards. Each shard sees ~1/4 of the suite.

### CI matrix for sharding

```yaml
strategy:
  fail-fast: false
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
  - uses: actions/upload-artifact@v5
    with:
      name: results-${{ matrix.shard }}
      path: test-results/
```

### Combining shard + env (this repo's pattern)

```yaml
matrix:
  env: [qa, uat, staging]
  shard: [1, 2, 3, 4]
```

→ 12 jobs in parallel. Wall-clock = max(shard) ≈ suite duration / 4 + overhead.

### Calculating optimal shard count

```
shard_count = ceil(suite_duration / target_wall_clock)
```

But shards add overhead (browser install, npm ci, etc.) ~ 60–90s each. So:

| Suite | Target wall-clock | Optimal shards | Why |
|---|---|---|---|
| 5 min | 2 min | 3 | More shards, overhead dominates |
| 30 min | 5 min | 6 | Sweet spot |
| 2 h | 10 min | 12 | Diminishing returns above |
| 4 h | 15 min | 16+ | Consider splitting suites instead |

### Merging reports across shards

Each shard produces partial Playwright/Allure results. You either:

- Upload each shard's artifact separately (this repo's approach).
- Use Playwright's blob reporter + `merge-reports` for a single consolidated HTML.

```bash
# in each shard:
npx playwright test --shard=${{ matrix.shard }}/4 --reporter=blob

# in a merge job after all shards:
npx playwright merge-reports --reporter=html ./all-blob-reports
```

### Worker count tuning

```ts
// playwright.config.ts
workers: process.env.CI ? '50%' : undefined,    // 50% of available CPUs in CI
```

| Workers | Best for |
|---|---|
| `1` | Tests with shared external resources you can't isolate |
| `2–4` | Small CI runners (default GitHub: 2 CPUs) |
| `'50%'` | Adaptive — half the CPUs |
| `'100%'` | Beefy runners only |
| Specific N | Predictable resource budgeting |

### Parallel pitfalls (and fixes)

| Pitfall | Fix |
|---|---|
| Tests share a seed user account | Per-test factory (`generateUserProfileData()`) |
| Tests share a fixture port (e.g. local DB) | Worker-scoped fixture, port = `5432 + workerInfo.workerIndex` |
| Tests modify the same product in SUT | Different product per worker, or skip parallel via `test.describe.serial` |
| Cleanup runs in the middle of another test | Cleanup uses unique ID per test |
| Headed mode + multiple workers | Don't — windows fight for focus |

### Worker info in fixtures

```ts
test.use({ storageState: 'storage/admin.json' });

const dbName = `test_db_${test.info().workerIndex}`;
```

`test.info().workerIndex` is stable per worker (`0..workers-1`).

### When to NOT parallelize

```ts
test.describe.configure({ mode: 'serial' });
test.describe('Account lifecycle', () => {
  test('create user', …);
  test('upgrade to premium', …);   // depends on previous
  test('delete user', …);
});
```

Use sparingly — usually a sign tests aren't really independent and need refactoring.

### Shard imbalance

If shard 1 finishes in 2 min and shard 4 takes 8 min, you're under-utilizing. Causes:

- Long tests clustered alphabetically (Playwright shards by file order)
- One file has 100 tests, others have 5

Fixes:
- Split big files
- Use `test.describe.parallel` to allow within-file parallelism
- Custom test ordering

## Hands-on lab

1. Time the current suite locally: `time npm test`.
2. Run with `--shard=1/2` and `--shard=2/2` in two terminals. Time each. Confirm sum ≈ original / 2 + overhead.
3. Update `.github/workflows/playwright.yml` to add `shard: [1, 2, 3]` axis. Verify all 9 jobs (3 envs × 3 shards) run.
4. Find one test that fails when run in parallel (or simulate one with shared state). Identify the root cause and fix it.

## Self-check

- [ ] Workers vs shards — give an example where you'd add more workers but not more shards.
- [ ] Your CI has 2 CPUs per runner. How many workers max?
- [ ] How does Playwright decide which test goes to which shard?
- [ ] You see one shard taking 5× longer than others. Diagnosis?

## Further reading

- playwright.dev — Sharding
- playwright.dev — Parallelism
- This repo's `playwright.config.ts` `workers` setting

---

**Prev:** [25 — CI/CD with GitHub Actions](./25-ci-cd-github-actions.md) · **Next:** [27 — Reporting & Allure](./27-reporting-and-allure.md)
