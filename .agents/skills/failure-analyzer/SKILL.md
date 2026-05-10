---
name: failure-analyzer
description: "Diagnoses failed Playwright test runs by reading the Allure / blob / HTML reporter output and emitting a structured root-cause analysis: which spec failed, at which step, with which error class (timeout, assertion, network, locator, isolation leak), the suspected commit, and a recommended action (fix, quarantine via flaky-test-triage, or file via defect-report). Use when explicitly asked to 'analyse this CI failure', 'why did the build break', 'what went wrong in run #N', or after `npm test` reports any non-zero exit. Wraps the canonical prompt at prompts/core/failure-analyzer.md and routes follow-ups through defect-report or flaky-test-triage."
---

# Failure Analyzer

Every red CI run is signal. This skill turns that signal into a structured artefact: an analysis card per failed test, with class, root cause, and the next action — so failures stop being "go look at Allure and figure it out" and start being "do this one thing".

---

## When to use this skill

Trigger on:
- "Analyse this failure"
- "Why did CI break?"
- "What's wrong with run #N?"
- After every red `npm test` / `npm run test:regression` run
- After every red GitHub Actions run on `playwright.yml`

Do **not** use when:
- The user wants to **fix** a known broken test → use [`test-fixing`](../test-fixing/SKILL.md).
- The user knows it's flaky → use [`flaky-test-triage`](../flaky-test-triage/SKILL.md).
- The user has a `trace.zip` and wants step-by-step replay → use [`trace-analysis`](../trace-analysis/SKILL.md).

---

## How to use it

### Phase 1 — Gather inputs (in order of preference)

1. `allure-report/` (post-`npm run report`) — best signal: status, steps, attachments
2. `playwright-report/` (HTML reporter) — fallback if Allure isn't built yet
3. `test-results/` (raw JSON + traces) — last resort
4. `reports/run-summary.json` — aggregate; tells you which suites/tags failed
5. CI logs (`gh run view <run-id> --log-failed`) — for environment-level failures

### Phase 2 — Classify each failure

Apply the canonical taxonomy from [`prompts/core/failure-analyzer.md`](../../../prompts/core/failure-analyzer.md):

| Class | Signal | Likely owner |
|---|---|---|
| `assertion` | `expect(...).toBe...` mismatch with stable value | Eng (real bug) |
| `locator` | `Timeout 30000ms exceeded waiting for locator` | QA (selector drift) → `selector-healing` |
| `timeout` | step waited but page never reached state | QA or Eng |
| `network` | 5xx, ECONNREFUSED, blocked request | SRE / Eng |
| `data` | missing fixture, expired account, bad seed | QA → `test-data-generator` |
| `isolation` | passes alone, fails in suite | QA → `flaky-test-triage` |
| `infra` | browser crash, OOM, runner shutdown | SRE |
| `unknown` | none of the above | escalate |

### Phase 3 — Emit the analysis card

For each failure produce:

```markdown
### TC-CART-04 — Update product quantity
- Spec: `tests/ui/test-cart.spec.ts:42`
- Tags: `@P1 @critical @regression @cart`
- Class: `locator`
- Step: "Click Update Cart button"
- Error: `Timeout 30000ms exceeded waiting for locator('button.update-cart')`
- Suspect commit: `abc1234` (changed `cart-page.ts` selectors)
- Trace: [view](allure-report/data/attachments/...)
- Recommendation: run `selector-healing` skill; if confirmed broken, file via `defect-report` with `severity:major, module:cart`.
```

### Phase 4 — Route to the next skill

```
class                      → next action
─────────────────────────────────────────────────────────────
assertion (real bug)       → defect-report  (severity by impact)
locator                    → selector-healing → re-run → if still fails → defect-report
timeout / network          → trace-analysis (root-cause); often → defect-report
data                       → test-data-generator (regenerate fixture)
isolation                  → flaky-test-triage (fix-vs-quarantine decision)
infra                      → escalate to SRE channel; do NOT file as defect
```

---

## Best practices

- **One analysis card per failure**, not a wall of logs. The dashboard's defect panel reads structured cards.
- **Always cite the suspect commit** (`git log --oneline <spec-file>` then pick the most recent one before the failure).
- **Don't classify as "unknown" without trying.** Re-read the trace; check the network panel; rerun locally with `--debug` first.
- **Never auto-file defects without confirmation** — the human reviews the card first. (Same rule as `defect-report`.)
- **Failure cards are reusable**: paste them into the related GitHub issue for permanent context.

---

## Related

- [`prompts/core/failure-analyzer.md`](../../../prompts/core/failure-analyzer.md) — full prompt with edge cases
- [`.agents/skills/test-fixing/SKILL.md`](../test-fixing/SKILL.md) — apply the fix
- [`.agents/skills/flaky-test-triage/SKILL.md`](../flaky-test-triage/SKILL.md) — for the `isolation` class
- [`.agents/skills/selector-healing/SKILL.md`](../selector-healing/SKILL.md) — for the `locator` class
- [`.agents/skills/trace-analysis/SKILL.md`](../trace-analysis/SKILL.md) — for `timeout` / `network` deep-dive
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file the resulting issue
