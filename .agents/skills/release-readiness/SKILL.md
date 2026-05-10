---
name: release-readiness
description: "Evaluates whether a release can ship by reading the QA Metrics Dashboard exit-criteria panels (test-execution rate, defect counts, traceability coverage, CI status) and emitting a go / no-go / conditional-go recommendation with the specific blockers, owners, and remediation steps. Use when explicitly asked 'are we ready to release?', 'go / no-go for v1.x?', 'release readiness check', or before any production deploy. Aggregates inputs from reports/run-summary.json, reports/defects.json, reports/traceability.json, and the QA Dashboard panels; routes blockers through defect-report and references the test plan's exit criteria."
optionalRefs:
  - reports/run-summary.json        # input — produced by custom-reporter on every test run
  - reports/defects.json            # input — produced by fetch-defects
  - reports/traceability.json       # input — produced by requirements-traceability
  - reports/release-readiness.md    # output — the go/no-go report
---

# Release Readiness

The hardest QA conversation isn't "is it broken" — it's "is it good enough to ship". This skill makes that conversation evidence-based: every claim in the report is backed by a Dashboard panel, a JSON file, or a CI run.

---

## When to use this skill

Trigger on:
- "Go / no-go?"
- "Are we ready to release?"
- "Release readiness for v1.x"
- "Can we deploy?"
- Before any production deploy or hardening sign-off

Do **not** use when:
- The user wants the exit-criteria **plan** (forward-looking) → use [`test-plan-author`](../test-plan-author/SKILL.md).
- A single test failed → use [`failure-analyzer`](../failure-analyzer/SKILL.md).

---

## How to use it

### Phase 1 — Gather signals

| Source | What it tells you | Required ? |
|---|---|---|
| `reports/run-summary.json` | pass-rate by tag (`@P1`, `@P2`, `@smoke`, `@regression`) | yes |
| `reports/defects.json` | open defect counts by `severity:*` and `module:*` | yes |
| `reports/traceability.json` | coverage status per requirement | yes |
| Live QA Dashboard | human-readable rollup of all of the above | recommended |
| Latest GitHub Actions run on `main` | CI baseline | yes |
| The release's [`test-plan-author`](../test-plan-author/SKILL.md) artefact | exit criteria source of truth | yes |

If any required source is missing, **stop** and ask the user to generate it (`npm test && npm run fetch:defects && npm run export:dashboard`).

### Phase 2 — Score against exit criteria (canonical thresholds)

Per [`prompts/advanced/release-readiness.md`](../../../prompts/advanced/release-readiness.md) and the dashboard:

| Criterion | Threshold | Source |
|---|---|---|
| `@P1` pass-rate | 100% | run-summary, panel #2 |
| `@P2` pass-rate | ≥ 95% | run-summary, panel #2 |
| Open `severity:critical` | 0 | defects.json, panel #3 |
| Open `severity:major` | ≤ 3 | defects.json, panel #3 |
| Traceability — Fully covered | ≥ 90% of in-scope REQs | traceability.json, panel #4 |
| `@smoke` + `@regression` on QA + UAT | green on latest CI | gh run list |
| Test plan signed off | yes | the plan's Section 12 |

### Phase 3 — Verdict

```
all green                          → GO
1 amber (P2 < 95% but ≥ 90%)        → CONDITIONAL GO  (with named risk owner + day-1 monitor)
any red                             → NO-GO           (list blockers; assign owners; ETA)
```

### Phase 4 — Emit the report

Save to `reports/release-readiness.md` (and optionally print inline). Structure:

```markdown
# Release Readiness — v1.x — YYYY-MM-DD

## Verdict: GO | CONDITIONAL GO | NO-GO

## Evidence
| Criterion | Threshold | Actual | Status |
|---|---|---|---|
| @P1 pass-rate | 100% | 100% | ✅ |
| Open severity:critical | 0 | 1 | ❌ |
| ... | ... | ... | ... |

## Blockers (if not GO)
1. [Issue #123] cart total miscalculation — owner: @alice — ETA: tomorrow
2. ...

## Conditional risks (if CONDITIONAL GO)
1. @P2 pass-rate at 92% (3 cases failed). Owner: @bob will run them manually post-deploy.

## Sign-off
| Role | Name | Approved |
|---|---|---|
| QA Lead | ... | ✅ YYYY-MM-DD |
| ... |
```

---

## Best practices

- **Numbers, not vibes.** Every line in the verdict cites a JSON field or a panel number.
- **Don't skip a missing-data step.** If `defects.json` doesn't exist, the verdict is automatically NO-GO until the data exists.
- **Conditional GO is a contract**, not a soft yes — it must name a risk owner and a monitoring plan.
- **Re-run after every fix**, not after every comment. The report is a snapshot in time.
- **Cross-reference the test plan.** If the plan's exit criteria are stricter than the canonical thresholds, the plan wins.

---

## Related

- [`prompts/advanced/release-readiness.md`](../../../prompts/advanced/release-readiness.md) — full prompt
- [`.agents/skills/test-plan-author/SKILL.md`](../test-plan-author/SKILL.md) — entry/exit criteria source
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file blockers
- [`.agents/skills/requirements-traceability/SKILL.md`](../requirements-traceability/SKILL.md) — coverage data
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md) — diagnose failures that block release
