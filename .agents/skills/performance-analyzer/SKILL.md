---
name: performance-analyzer
description: "Analyses performance data (Lighthouse JSON, k6 output, Playwright trace timings, perf budgets) to surface regressions vs. baseline: which Web Vital broke, which transactional budget was exceeded, which network request crossed P95, and which commit likely caused it. Distinct from performance-testing (which authors perf tests) and performance-testing-review-ai-review (which audits suite design); this skill diagnoses runtime perf data and routes regressions to defect-report. Use when explicitly asked to 'analyse the perf run', 'why is LCP up', 'lighthouse regressed', 'k6 thresholds failed', or after a performance gate fails in CI. Wraps prompts/advanced/performance-analyzer.md."
---

# Performance Analyzer

Performance is bimodal: it's either "fine, ship it" or "we have a problem and we need to know which commit". This skill answers the second one.

## When to use this skill

- "Analyse the perf run"
- "Why is LCP up?"
- "Lighthouse regressed"
- "k6 thresholds failed"
- After a performance gate fails in CI

Do **not** use when:
- The user wants to **author** new perf tests → use [`performance-testing`](../performance-testing/SKILL.md).
- The user wants to **audit suite design** → use [`performance-testing-review-ai-review`](../performance-testing-review-ai-review/SKILL.md).

## How to use it

1. Identify the data source:

| Source | What it gives you |
|---|---|
| `lighthouse-*.json` | LCP, FCP, TBT, CLS, TTFB, opportunities |
| `k6-summary.json` | p50/p95/p99, error rate, throughput, threshold pass/fail |
| Playwright trace `network` log | per-request timings, hitting page-level budget |
| `reports/run-summary.json` `byTag['@perf']` | rollup of perf-tagged tests |

2. Per [`prompts/advanced/performance-analyzer.md`](../../../prompts/advanced/performance-analyzer.md), compute deltas vs. baseline:

| Metric | Concern threshold |
|---|---|
| LCP | > 2.5s OR +20% vs. baseline |
| TTFB | > 600ms OR +30% |
| TBT | > 200ms |
| CLS | > 0.1 |
| k6 p95 | > defined SLA OR +25% |
| Page-level budget | exceeded by ≥ 1 budget |

3. Identify the suspect commit: `git log --since=<last-baseline-date> -- <affected-area>`.

4. Emit a perf review:

```markdown
## Perf Analysis — run #482

### LCP regression (+34%)
- Baseline: 1.8s   Now: 2.4s
- Affected: `/cart` (was 1.9s, now 2.6s)
- Top opportunities: render-blocking JS (`/assets/payment.js` 4.1s, no defer)
- Suspect commit: PR #199 — re-bundled payment provider script
- Recommendation: file defect (severity:major, type:perf, module:cart); revert PSP bundling change OR add `defer`

### k6 cart-load p95 over SLA
- SLA: 800ms   Actual p95: 1.1s   p99: 2.4s
- Error rate: 0.8% (5xx)
- Likely backend; coordinate with SRE
```

5. Route findings:
   - Real regression → [`defect-report`](../defect-report/SKILL.md) with `severity:major`, custom `type:perf` label
   - Test-side issue (budget too tight; not a real regression) → [`performance-testing-review-ai-review`](../performance-testing-review-ai-review/SKILL.md) to recalibrate
   - Backend / infra → escalate to SRE; do NOT file as a frontend defect

## Best practices

- **Always compare to a baseline.** A single LCP number means nothing.
- **Cite the suspect commit.** "Probably the recent change" wastes everyone's time.
- **Page-level budgets first, Web Vitals second.** Vitals are noisy across runs; transactional budgets are stable.
- **Don't moralise tight budgets.** If a budget fires false positives, recalibrate it (with sign-off).

## Related

- [`prompts/advanced/performance-analyzer.md`](../../../prompts/advanced/performance-analyzer.md)
- [`.agents/skills/performance-testing/SKILL.md`](../performance-testing/SKILL.md)
- [`.agents/skills/performance-testing-review-ai-review/SKILL.md`](../performance-testing-review-ai-review/SKILL.md)
- [`.agents/skills/trace-analysis/SKILL.md`](../trace-analysis/SKILL.md)
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md)
- [`.agents/skills/trend-analysis/SKILL.md`](../trend-analysis/SKILL.md)
