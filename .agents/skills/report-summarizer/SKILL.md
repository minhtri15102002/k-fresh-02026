---
name: report-summarizer
description: "Summarizes long QA reports (Allure HTML, Playwright HTML, k6 output, Lighthouse JSON, security scan output) into a 5-bullet executive bullet list plus a one-line headline. Pulls the right slice for the audience (PM gets feature impact, Eng gets failure root cause, SRE gets infra signals). Use when explicitly asked to 'summarize this report', 'tl;dr the Allure run', 'one-line summary of the lighthouse output', 'what's in this 200-page scan', or after any heavyweight report drops in CI. Wraps prompts/reporting/report-summarizer.md."
---

# Report Summarizer

Long reports are read by tools, not humans. Humans need the 5-bullet version. This skill compresses every supported report type into one.

## When to use this skill

- "Summarize this report"
- "tl;dr the Allure run"
- "What's in this 200-page scan?"
- After heavyweight reports drop in CI: Allure, Lighthouse, k6, security scan, Playwright HTML

## How to use it

1. Identify the report type from the path or content:

| Type | Signal | Key sections |
|---|---|---|
| Allure HTML | `allure-report/index.html` | overall pass-rate, top failures, slow tests, trends |
| Playwright HTML | `playwright-report/index.html` | failed tests, timing, traces |
| Lighthouse JSON | `lighthouse-*.json` | category scores, top opportunities, regressed metrics |
| k6 output | `k6-summary.json` | thresholds, p95/p99, error rate, throughput |
| Security scan | OWASP ZAP / SAST report | High/Medium findings with CWE |

2. Extract the canonical bullets per [`prompts/reporting/report-summarizer.md`](../../../prompts/reporting/report-summarizer.md):

```markdown
**Headline**: 2 of 47 tests failed; both in @cart; one is a real regression.

- ✅ 45 / 47 passed (95.7%) — same as last run
- ❌ TC-CART-04 — locator drift after homepage redesign (PR #199)
- ❌ TC-CART-08 — real regression: total miscalculation when qty > 5 (file via defect-report)
- ⏱  Slowest test: TC-CHECKOUT-03 at 28s (over 20s budget)
- 📈 Mean run time: 4m12s (▲ 8% vs. last run)
```

3. Tailor the bullets per audience:

| Audience | Emphasise |
|---|---|
| PM | feature impact, user-visible breakage, schedule risk |
| Eng | failed step, suspect commit, error class |
| SRE | infra signals, runner OOM, network timeouts |
| Leadership | one-line headline + GO/WATCH/RED |

## Best practices

- **One headline, five bullets.** No more. The point is brevity.
- **Pick the right audience.** Same report → different summaries.
- **Always include a delta.** "5 failures" is OK; "5 failures (▲ 3 vs. last run)" is better.
- **Link to the full report.** Summary is the appetizer; the report is dinner.

## Related

- [`prompts/reporting/report-summarizer.md`](../../../prompts/reporting/report-summarizer.md)
- [`.agents/skills/executive-summary/SKILL.md`](../executive-summary/SKILL.md)
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md)
- [`.agents/skills/performance-analyzer/SKILL.md`](../performance-analyzer/SKILL.md)
