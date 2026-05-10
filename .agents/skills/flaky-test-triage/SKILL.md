---
name: flaky-test-triage
description: "Diagnoses flaky Playwright tests (passing intermittently on the same code) and decides between fix, quarantine, or escalate. Use when explicitly asked to 'triage flakes', 'investigate intermittent failures', 'fix this flaky test', or after CI shows a test that passed on retry. Categorises root cause (timing, animation, isolation leak, env, infra, data, selector ambiguity, parallel collision), proposes the smallest deterministic fix, and emits a flaky_test.md issue + optional test.fixme + linked defect-report when fix isn't immediate."
---

# Flaky Test Triage

A flaky test is one that produces different results on the same code without intervention. They erode trust faster than failures: every "retry passed" green tick teaches the team to ignore the next real regression.

This skill walks the agent through detection → root-cause classification → fix-vs-quarantine decision → artefact emission, mirroring [`training/phase-5-scale/29-flaky-test-triage.md`](../../../training/phase-5-scale/29-flaky-test-triage.md).

---

## When to use this skill

Trigger on:
- "This test is flaky", "fix this intermittent", "triage flakes"
- A test passes only on retry in CI (Playwright `Flaky` status)
- A spec has been quarantined with `test.fixme` and a linked issue is needed
- Investigating a Playwright run report where pass-on-retry > 0

**Do NOT use when:**
- The test is **always** failing → use the [`test-fixing`](../test-fixing/SKILL.md) skill or the [`playwright-test-healer`](../../../.claude/agents/playwright-test-healer.md) agent (under `.claude/agents/`, not `.agents/skills/`).
- A real defect was discovered → use `defect-report`.
- The infra is broken (CI runner, container) → escalate, not triage.

---

## How to use it

### Phase 1 — Confirm flakiness

A test is **flaky** only if it passes ≥ 1 time and fails ≥ 1 time on the same SHA without code changes. If you don't have data, run:

```bash
npx playwright test path/to/spec.ts --repeat-each 30 --workers 1
npx playwright test path/to/spec.ts --repeat-each 30 --workers 4
```

Record:
- pass / fail / flaky counts (`--repeat-each` runs N times in series; with `--workers > 1` parallel collision becomes visible)
- whether the failure pattern correlates with retry attempt, time-of-day, or worker count

### Phase 2 — Classify the root cause

Inspect the Playwright trace (`npx playwright show-trace trace.zip`). Map each failed run to ONE category:

| Category | Trace signal | Typical fix |
|---|---|---|
| **Timing** | `Element is not stable` / action started before previous assertion settled | Replace ad-hoc waits with web-first assertions; remove `waitForTimeout`; chain `await commonPage.click(loc)` after `await assertHelper.assertElementVisible(loc)` |
| **Animation** | `Element is not stable; consider waiting for animations` | `await loc.evaluate(el => el.style.transition = 'none')`, or assert on stable state (e.g. final colour) instead of mid-animation |
| **Isolation leak** | Passes in isolation, fails in suite; depends on prior test data | Use API seeding fixtures; never share `userToken` across tests; reset DB or fall through `storageState` boundaries |
| **Environment** | Passes locally, fails in CI; locale/font/timezone/headless-only | Pin `process.env.TZ`, set `locale: 'en-US'` in Playwright project, fix font installation in CI |
| **Infrastructure** | 502 / `connect ETIMEDOUT` / random `Target page closed` | Out of test scope — open infra ticket, mark `test.fixme` with linked issue |
| **Test-data drift** | Seed account modified externally between runs | Switch to per-test API factories; never reuse a "hero" user |
| **Selector ambiguity** | `strict mode violation: resolved to 2 elements` | Tighten locator with `getByRole`/`hasText` filters; if root cause is duplicate DOM, file a `defect-report` |
| **Network / CDN** | 404 on background asset, slow page load | Mock the asset via `page.route`, or wait for the specific element rather than `networkidle` |
| **Parallel collision** | Two tests modify the same SUT entity at once | Serialise with `test.describe.configure({ mode: 'serial' })`, OR scope test data per worker (`test.info().parallelIndex`) |

> **Reach for `failure-analyzer` (`prompts/core/failure-analyzer.md`)** in Phase 2 if the trace is ambiguous — it produces a structured root-cause output you can map onto the table above.

### Phase 3 — Fix vs quarantine

| Situation | Action |
|---|---|
| Root cause is **in our code** AND fix < 30 min | **Fix now**, ship in same PR as the test, close the loop |
| Root cause is **in our code** but fix is risky / large | **Quarantine** with `test.fixme(<title>, <fn>)` + `// TODO(#NNN)` comment + open `flaky_test.md` issue |
| Root cause is **infra / external** | **Quarantine** with `test.fixme` + open issue with infra owner tagged |
| Failure rate < 1% over 30 days AND severity:trivial | **Accept** — retry on CI is fine; document in the issue and close |
| Failure rate ≥ 5% OR blocks `severity:critical` flow | **Stop the line** — fix takes priority over feature work |

Quarantine recipe:
```ts
test.fixme('TC-CART-04 quantity update flake — see #142', async ({ page }) => {
  /* … existing body … */
});
```

### Phase 4 — Emit artefacts

1. **Always** open a [`flaky_test.md`](../../../.github/ISSUE_TEMPLATE/flaky_test.md)-shaped GitHub issue with:
   - Failure rate (`X of Y runs`)
   - Root-cause category (from Phase 2 table)
   - Trace `.zip` link
   - Decision (fix / quarantine / accept) + ETA
   - Tags: `flaky, test-quality` + the `module:*` of the spec (so the dashboard picks it up)
2. **If quarantining**, link the issue number in the `test.fixme` comment.
3. **If a real product bug surfaced** (e.g. selector ambiguity from duplicate DOM), spin off a separate `defect-report` issue.

---

## Decision tree

```
Test fails sometimes ?
├── Re-run 30× — fails 0/30  → not flaky, false alarm
├── Re-run 30× — fails 30/30 → not flaky, ALWAYS broken → use test-fixing
├── Fails 1–29/30
│   ├── Trace shows timing/animation → fix; web-first assertions
│   ├── Passes alone, fails in suite → isolation leak; per-test fixtures
│   ├── env / locale / TZ specific → pin env in playwright.config.ts
│   ├── Selector resolves to 2     → tighten locator; check for product bug
│   ├── Parallel collision         → serial mode or worker-scoped data
│   ├── Random infra failure       → quarantine + escalate
│   └── Animation-only             → freeze animations or assert on final state
└── Always retry-passes (`Flaky` in HTML report)
    → still requires triage; do NOT ignore
```

---

## Best practices

- **Reproduce locally first.** A flake you can't reproduce is a flake you can't fix. Use `--repeat-each` + `--workers` knob.
- **One PR per fix.** Don't bundle "fix flake" with feature work; reviewers can't tell what's tested.
- **Time-box quarantines.** Add a milestone (`v2.0 · Coverage Hardening` works) so quarantined tests don't rot.
- **Track flake budget.** Repo target: < 1% of runs flaky. If you exceed it, stop adding tests until paid down.
- **Don't `test.skip`.** `test.fixme` is preferred — it surfaces in the report as "expected to fail", which is observable progress; `skip` is invisible.
- **Never widen timeouts as a "fix".** Bumping `timeout: 30000 → 60000` masks the real cause; trace-driven analysis always wins.
- **Distrust `networkidle`.** It depends on third-party trackers; prefer waiting on a specific resource or DOM element.

---

## Related

- [`training/phase-5-scale/29-flaky-test-triage.md`](../../../training/phase-5-scale/29-flaky-test-triage.md) — full theory + lab.
- [`.github/ISSUE_TEMPLATE/flaky_test.md`](../../../.github/ISSUE_TEMPLATE/flaky_test.md) — issue shape this skill targets.
- [`prompts/core/failure-analyzer.md`](../../../prompts/core/failure-analyzer.md) — root-cause analysis prompt.
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — when triage uncovers a real defect.
- [`.agents/skills/test-fixing`](../test-fixing/SKILL.md) — when the test is always broken, not flaky.
