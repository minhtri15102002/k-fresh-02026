# Module 29 — Flaky Test Triage

> Phase 5 · Effort: 4h · Prerequisites: Module 28

## Learning objectives

After this module you can:

- Detect flakes from CI history without running tests locally.
- Categorize flakes by root cause: timing, isolation, environment, infra, test data.
- Apply the right fix — and recognize when the right fix is "delete or merge the test".
- Quarantine flakes safely without hiding real bugs.
- Build a flaky-rate metric and drive it to zero.

## Why it matters

Flaky tests poison everything. Devs ignore failures, real bugs slip through, CI loses credibility, retries hide truth. Triaging flakes is one of the highest-leverage things a senior QA does.

## Concepts

### What is "flaky"?

A test is **flaky** if it produces different results (pass/fail) on the **same code** without intervention. Definitions vary; a workable threshold:

```
flake_rate = failed_runs / total_runs   (excluding code-fix runs)
flaky if flake_rate ∈ (0%, 5%) over last 30 runs
```

Above 5% it's broken; at exactly 0% it's reliable.

### Detection patterns

#### From Playwright retries

`retries: 2` in CI: a test that **fails then passes** is flaky. Check `test-results/` for retry attempts.

```bash
grep -r "retry #1" test-results/
```

#### From the dashboard

Add a panel: **flaky tests last 30 days** (count of test names that have both passed and failed on the same SHA range).

#### From git log

```bash
git log --oneline --grep="flaky\|flake\|retry" -- tests/
```

If the same file shows up repeatedly, the locator strategy is suspect.

### Root-cause taxonomy

| Cause | Symptom | Fix |
|---|---|---|
| **Timing** | Race between action & assertion | Web-first assertions; remove `waitForTimeout` |
| **Animation** | "Element not stable" | `animations: 'disabled'`, wait on a settled state |
| **Isolation leak** | Passes alone, fails in suite | Move shared state to fixture; use factories |
| **Environment** | Passes locally, fails in CI | Headless mismatch, font rendering, timezone, locale |
| **Infrastructure** | Random 502/timeout from SUT | Quarantine + escalate to ops |
| **Test data drift** | "Expected 'Premium', got 'Pro'" after seed update | Use factories, not hardcoded fixtures |
| **Selector ambiguity** | Multiple matches | Tighten with `getByRole(name=…)` or `.filter()` |
| **Network / CDN** | Asset 404, image load delay | Wait for `networkidle` (carefully) or stub asset |
| **Parallel collision** | Two tests modify same SUT entity | Per-test data, or `test.describe.serial` |

### Triage procedure

```
1. Confirm flakiness  → run 10× locally, watch retries in CI history
2. Reproduce          → use the trace from a failing run
3. Categorize         → match against the table above
4. Fix or quarantine  → fix if root cause is in our control
5. Verify             → run 50× headless without retries
6. Track              → add to dashboard's "fixed flakes" panel
```

### Fix vs quarantine

**Fix when:**

- Root cause is in test code or setup
- Less than 1 day of effort
- Test covers high-value path (P1/critical)

**Quarantine when:**

- Root cause is infra / SUT bug not fixable today
- Effort to fix > value of the test
- Investigation is ongoing

### Quarantine — the *right* way

```ts
test.fixme('TC03 - cart-discount race [#1234]', async ({ … }) => { … });
```

Use `test.fixme` (not `test.skip`):

- Reports as "expected to fail" in HTML/Allure
- Forces re-evaluation; doesn't hide forever
- Includes ticket reference in title

**Never** disable a test silently. **Never** wrap in `try/catch`. **Never** add a sleep "to fix it".

### Anti-patterns

```ts
// ❌ blanket retries to mask flake
test.describe.configure({ retries: 5 });

// ❌ sleep "fix"
await page.waitForTimeout(2000);
await locator.click();

// ❌ try/catch masking
try { await assertSomething(); } catch { /* ignore */ }

// ❌ disable in CI only
if (process.env.CI) test.skip(); else test('...');
```

### Tracking flake metrics

In `reports/custom-reporter.ts`, track per-test:

```ts
// pseudo
{
  testId: 'TC01-checkout',
  attempts: 2,        // 2 = flaky
  finalStatus: 'passed',
  durations: [1500, 1800],
}
```

Aggregate into `run-summary.json` → dashboard panel "flake rate this run" + "flakiest tests".

### Flake budget

A target: **< 1% flake rate**. Above that, the team's velocity declines measurably.

If above budget, freeze new test additions until you're back below. Treat flake debt like prod tech debt.

## Hands-on lab

1. Pull the latest `main` CI run. Identify any test that retried before passing. Open its trace.
2. Diagnose the root cause from the trace alone. Categorize against the table.
3. Pick one test in this repo and **deliberately make it flaky** (race condition). Run 10×. Capture the failure. Fix it. Run 50×. Document.
4. Add a "flake rate" panel to the QA Metrics dashboard. Source: count of tests with `attempts > 1` in `run-summary.json`.

## Self-check

- [ ] Definition of flaky in one sentence.
- [ ] Two reasons `retries: 5` is the wrong fix.
- [ ] When is `test.fixme` the right move?
- [ ] How do you tell, from a trace alone, whether a flake is timing vs isolation?

## Further reading

- Google — *Flaky Tests at Google* (Eng Productivity blog)
- Sam Atkinson — *Anatomy of a Flaky Test*
- This repo's `reports/custom-reporter.ts`

---

**Prev:** [28 — QA Metrics dashboard](./28-qa-metrics-dashboard.md) · **Up:** [Phase 5 README](./README.md)

🎓 **Phase 5 complete.** Next: [Phase 6 — AI-Assisted QA & Capstone](../phase-6-ai-assisted-qa/README.md)
