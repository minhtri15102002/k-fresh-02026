---
name: trace-analysis
description: "Analyses a Playwright trace.zip step-by-step using the trace-analyzer MCP installed by setup-playwright-mcp. Reads action timeline, network log, console log, screenshot stack, and DOM snapshots to root-cause failures that aren't obvious from the error message alone — slow XHRs hidden behind a passing assertion, race conditions, animations swallowing clicks, hidden overlays, and silently-cancelled navigations. Use when explicitly asked to 'analyse this trace', 'open the trace.zip', 'why is this step slow', 'walk me through what happened', or after failure-analyzer classifies a failure as `timeout` or `network` and needs a deeper look. Emits a step-by-step transcript and routes findings to defect-report or test-fixing."
---

# Trace Analysis

Playwright's trace viewer is the single most valuable forensic tool QA has — but only when someone uses it. This skill wires it into the agent loop: given a `trace.zip`, the agent walks the timeline programmatically and produces a transcript a human can read in under a minute.

---

## When to use this skill

Trigger on:
- "Analyse this trace"
- "Open the trace.zip"
- "Why was step X slow?"
- "Walk me through what happened"
- After [`failure-analyzer`](../failure-analyzer/SKILL.md) classifies a failure as `timeout` or `network`
- After a test passes but feels slow (silent latency regressions)

Do **not** use when:
- No trace exists → first run with `trace: 'on-first-retry'` or `trace: 'retain-on-failure'` in `playwright.config.ts`.
- The error is a clear `assertion` mismatch → [`failure-analyzer`](../failure-analyzer/SKILL.md) is enough.

---

## Prerequisites

The trace-analyzer MCP must be installed. If you see "MCP not connected" or `playwright-trace-analyzer` is missing:
1. Run [`setup-playwright-mcp`](../setup-playwright-mcp/SKILL.md) first.
2. Confirm the MCP responds: `mcp ping playwright-trace-analyzer`.

---

## How to use it

### Phase 1 — Locate the trace

Common paths in this repo:
- `test-results/<test-name>/trace.zip` — local run
- `playwright-report/data/<id>.zip` — HTML reporter
- `allure-results/.../*.zip` — Allure attachments
- `gh run download <run-id>` for CI artefacts

If the user pasted only an error log, search recent runs for the trace first; never analyse stdout-only output.

### Phase 2 — Load the trace via MCP

```
mcp__playwright-trace-analyzer__load --path <abs-path-to-trace.zip>
mcp__playwright-trace-analyzer__list_steps         # full action timeline
mcp__playwright-trace-analyzer__network            # network log
mcp__playwright-trace-analyzer__console            # console log
mcp__playwright-trace-analyzer__snapshot --step N  # DOM at step N
```

### Phase 3 — Build the transcript

Walk the timeline and record, per step:

```markdown
## Trace transcript — TC-CHECKOUT-03

| # | Step | Wall-time | Status | Notes |
|---|---|---|---|---|
| 1 | `goto /cart` | 380 ms | ok | TTFB 120 ms |
| 2 | `click "Checkout"` | 4 200 ms | ok | waited for nav; spinner overlay 3.8 s |
| 3 | `fill #email` | 60 ms | ok |  |
| 4 | `click "Pay"` | timeout | ❌ | locator resolved but element covered by `.cookie-banner` (DOM snapshot at step 4 attached) |

### Network anomalies
- `POST /api/checkout/validate` — 503 at 12.4 s (auto-retried at 17.0 s, success). Retry hidden by Playwright's auto-wait.
- `GET /assets/payment.js` — 4.1 s (over P95 budget of 1 s).

### Console anomalies
- `[warn] Stripe.js: deprecated method confirmCardPayment` (×3)
- `[error] React DOM patch failed at #checkout-form` — at the same wall-time as step 4
```

### Phase 4 — Root cause

Pick **one** primary cause from this taxonomy (mirrors `failure-analyzer`):

| Pattern in transcript | Root cause | Next action |
|---|---|---|
| Element covered by overlay | UI regression OR test missed a wait | `selector-healing` or fix the wait |
| Network 5xx (even retried) | Backend instability | `defect-report` with `module:<area>, severity:major` |
| Network > P95 budget | Performance regression | `performance-testing` skill; budget review |
| `console.error` correlated with step | JS exception leaking | `defect-report` with `severity:major` |
| Animation in flight at click | Test missed `animations: 'disabled'` or `expect.poll` | fix the test |
| Step never started | Previous step left page in unexpected state | `flaky-test-triage` (isolation) |

### Phase 5 — Hand off

- If real bug → [`defect-report`](../defect-report/SKILL.md) with the transcript pasted into the issue body.
- If test bug → [`test-fixing`](../test-fixing/SKILL.md) or [`selector-healing`](../selector-healing/SKILL.md).
- If perf regression → [`performance-testing`](../performance-testing/SKILL.md) for budget enforcement.

---

## Best practices

- **Always paste the network anomalies table** into the resulting issue — it's the most-skipped, highest-signal section.
- **Compare wall-times to last green run** when filing a perf concern; one-off slowness ≠ regression.
- **Cite the step number, not "step where it failed"** — humans need exact references.
- **Don't classify based on the error string alone.** The error is downstream; the trace is upstream. The trace wins.

---

## Related

- [`.agents/skills/setup-playwright-mcp/SKILL.md`](../setup-playwright-mcp/SKILL.md) — installs the MCP this skill drives
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md) — upstream classifier; routes here for `timeout` / `network`
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file the resulting issue
- [`.agents/skills/test-fixing/SKILL.md`](../test-fixing/SKILL.md) — apply the fix to the spec
- [`.agents/skills/performance-testing/SKILL.md`](../performance-testing/SKILL.md) — for slow-step regressions
