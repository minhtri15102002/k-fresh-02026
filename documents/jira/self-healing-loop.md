# Self-Healing + Learning Loop — and How It Reports to Jira

> The 5-step loop in component **4** of the AI-Powered Self-Healing QA Automation Framework. Documents what each step does, what it writes back to Jira, and the policy boundaries that keep "auto-heal" from becoming "auto-hide-real-bugs".

The healing loop is the framework's most powerful feature **and** its biggest blast-radius risk. Read all of it before turning it on.

## The 5-step loop

```
   ┌──────────────────┐    ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
   │ ① Failure        │ ─► │ ② Analyze│ ─► │ ③ AI Healing     │ ─► │ ④ Validate       │ ─► │ ⑤ Learn & Store  │
   │   Detected       │    │  capture │    │   Engine         │    │   & Retry        │    │  store success-  │
   │  (locator/step   │    │  DOM,    │    │  AI suggests     │    │  validate new    │    │  ful selectors   │
   │   fails in run)  │    │  screen, │    │  alt selectors / │    │  selector,       │    │  for future runs │
   │                  │    │  errors  │    │  strategies      │    │  retry the step  │    │                  │
   └──────────────────┘    └──────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
                                                                                                      │
                                                                                                      ▼
                                                                                  Continuous Learning · Smarter Over Time · Fewer Failures
```

Each step writes to Jira (and to the [Update Status & Results](./integration.md#-update-status--results--write-contract) contract) so humans can audit every heal.

---

## ① Failure Detected

### What happens

A spec fails. Common cases:

- Locator returns 0 or > N matches (`page.getByRole('button', { name: 'Buy' })` — UI changed).
- Action timeout (element not actionable — overlay, animation, slow render).
- Web-first assertion fails (`toHaveText`, `toBeVisible`).
- API response shape diverges from schema.

### What gets captured (auto)

| Artifact | Where |
|---|---|
| Trace `.zip` | `playwright-report/data/<runId>/...` |
| Screenshot at failure | same |
| Video (if enabled) | same |
| Console + network logs | embedded in trace |
| DOM snapshot at the failing step | embedded in trace |

### Jira write

| Field | Value |
|---|---|
| Action | Comment on the linked Story / Bug / Test ticket |
| Idempotency key | `{issueKey}:fail:{runId}:{specFqn}` |
| Body | failure summary + trace link + spec path + tag set |
| Transition | none yet (wait for healing outcome) |

```markdown
<!-- qa-agent: ABC-123:fail:9876:tests/ui/test-cart.spec.ts:TC-CART-04 -->
**❌ Failure detected** — `TC-CART-04 — quantity counter increments`

| Field | Value |
|---|---|
| Run | [CI #9876](…) |
| Spec | `tests/ui/test-cart.spec.ts:45` |
| Failing step | `commonPage.click(loc.btnIncreaseQty)` |
| Reason | Locator resolved 0 matches |
| Trace | [view](…) |

> Healing pipeline triggered. Awaiting Step ③ outcome.
```

### Boundary

- The Agent **never** silently retries at this step. The failure is real until proven otherwise.

---

## ② Analyze

### What happens

The healing pipeline opens the captured trace + DOM and produces a **diagnosis hypothesis**:

| Hypothesis | Signal |
|---|---|
| Selector drift (cosmetic) | role/label still resolves a similar element nearby |
| Selector drift (structural) | parent / sibling reshuffle; element exists but different ancestor |
| Timing | element appears N ms after expected; auto-wait window too tight |
| State leak | previous spec left state that breaks selector context |
| Real bug | expected element entirely absent; no candidate substitute |
| Environment | network 5xx; auth expired; flake budget exceeded |

The diagnosis is **explicit** — never "it's probably fine, retried."

### Jira write

| Field | Value |
|---|---|
| Action | Append to the Step ① comment (same idempotency key, suffix `:analyze`) |
| Body | diagnosis hypothesis + confidence (low/medium/high) + recommendation (heal / quarantine / file bug) |

```markdown
<!-- qa-agent: ABC-123:fail:9876:...:analyze -->
**🔍 Analysis** — diagnosis: **selector drift (cosmetic)** · confidence: **high**

- Original locator: `getByRole('button', { name: 'Buy' })`
- Closest candidate: `getByRole('button', { name: 'Buy now' })`
  - Same parent, same DOM position, label changed
- Recommendation: **proceed to Step ③ heal**
```

### Boundary

- If diagnosis = **real bug** OR confidence = **low** → **stop the loop**, route to [`defect-report`](../../.agents/skills/defect-report/SKILL.md), file Bug per [`issue-types.md`](./issue-types.md#-bug-report). No healing attempted.

---

## ③ AI Healing Engine

### What happens

The Agent proposes one or more **alternative locator candidates** ranked by:

1. **Stability score** — derived from learn-store history (Step ⑤): how often this strategy held up in past runs.
2. **Locator priority** per [`prompts/core/pom-generator.md`](../../prompts/core/pom-generator.md): role → label → testid → text → CSS → XPath.
3. **DOM-distance** to the original locator — closest-position candidates win ties.
4. **Semantic similarity** of the accessible name (LLM-as-judge for borderline cases).

Output is a **patch proposal** — never a silent edit:

```diff
- btnBuy: this.page.getByRole('button', { name: 'Buy' }),
+ btnBuy: this.page.getByRole('button', { name: 'Buy now' }),
```

### Jira write

| Field | Value |
|---|---|
| Action | Append `:heal-proposed` |
| Body | the diff + reasoning + the runId where this will be tested |

### Boundary

- The Agent never modifies `locators/*-locators.ts` automatically. It opens a **PR** (`chore(heal): <issueKey> — <spec>`) so the change goes through normal review.
- Healing is **bounded to Locator changes**. No prompt edits, no test logic edits, no assertion edits. Those require human intent.

---

## ④ Validate & Retry

### What happens

The Agent applies the proposed patch in a **scratch branch / shadow run** (does not merge yet):

1. Re-run the failing spec **3 times** with the patched locator.
2. Re-run **2 unrelated specs that touch the same page** (regression smoke).
3. Compare timing + console logs + network calls vs the original passing run.

### Pass criteria (all must hold)

- Failing spec passes 3/3.
- Regression smoke passes.
- p95 step latency within ±20% of baseline.
- No new console errors.

### Jira write

| Field | Value |
|---|---|
| Action | Append `:validated` (or `:rejected`) |
| Body | result table + diff + PR link |

If pass → the heal PR auto-requests review from the spec's CODEOWNER.
If reject → escalate to Step ⑤'s **Learn (negative)** path.

### Boundary

- The PR is **never auto-merged**. CODEOWNER reviews; their merge is the final ratification.
- If the spec is `@P1 @critical`, **two human reviewers** are required regardless of confidence.

---

## ⑤ Learn & Store

### What happens

Whether the heal succeeded or failed, the outcome is stored in `reports/heal-history.jsonl`:

```jsonl
{"ts":"2026-05-10T12:34:56Z","issueKey":"ABC-123","spec":"tests/ui/test-cart.spec.ts:45","origLocator":"getByRole('button',{name:'Buy'})","candidate":"getByRole('button',{name:'Buy now'})","outcome":"merged","reviewers":["alice","bob"],"runId":"9876"}
{"ts":"2026-05-10T13:01:22Z","issueKey":"DEF-456","spec":"tests/ui/test-checkout.spec.ts:88","origLocator":"getByTestId('pay')","candidate":"getByRole('button',{name:'Pay'})","outcome":"rejected","reviewers":["alice"],"reason":"regression smoke failed","runId":"9988"}
```

This file feeds the **stability score** input for Step ③ on future runs — the loop literally gets smarter over time.

### Jira write

| Field | Value |
|---|---|
| Action | Final comment on the failing-test ticket: `:closed` |
| Body | summary of outcome + link to merged PR (if any) + new stability score |
| Transition | depends on outcome — see table |

### Outcome → Jira transition

| Outcome | Jira transition | GH labels |
|---|---|---|
| Heal merged + spec green | resolve as **Done** | remove `bug:flake` if present |
| Heal rejected (real bug) | route to **Bug**; create new Jira Bug; transition fail-cause to **Triaged** | add `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) |
| Heal proposed; reviewer rejected | leave issue **In Review**; assign back to spec author | add `status:needs-investigation` |
| Loop aborted (ENV / auth) | leave issue **In Progress**; comment infra status | add `status:infra-blocked` |

---

## Policy guardrails (turn these on before enabling heal-on-prod)

| Guardrail | Rule | Where enforced |
|---|---|---|
| **No silent edits** | Every heal is a PR; no automated commit to `main` | CI workflow + branch protection |
| **No P1 auto-merge** | `@P1` / `@critical` heals require 2 humans | CODEOWNERS + branch rules |
| **Locator-only scope** | Heal touches only `locators/**`; `pages/**` and `tests/**` rejected | CI lint rule on heal PRs |
| **Heal-rate budget** | If > 15% of runs in a week trigger heal → freeze healing; force investigation | weekly cron + dashboard panel |
| **Confidence threshold** | Step ② confidence = low → file Bug, do not heal | hardcoded in pipeline |
| **Audit retention** | `reports/heal-history.jsonl` retained ≥ 13 months | GH artifact retention |
| **Kill-switch** | Single env var `QA_AGENT_HEAL_ENABLED=false` disables Steps ③–④ globally | runtime check |

> A self-healing pipeline without heal-rate budget + kill-switch is how teams ship "all green" CI for two months and then discover the entire test suite has been auto-blinded. **Do not skip these.**

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Heal-as-flake-eraser | All flakes auto-fixed; defect-escape rate quietly rising | Cap heal-rate; quarterly heal-PR audit |
| Drift normalisation | Same locator healed 4 quarters in a row | Refactor to a stable testid + delete heal history for that locator |
| Reviewer rubber-stamp | All heal PRs merged in < 2 min by same reviewer | Rotate CODEOWNERS; require diff-coverage report on heal PR |
| Heal across page-object boundaries | Heal touches multiple files | Reject — split into separate heal PRs |
| No Bug filed when confidence is low | Real bug masked as heal-rejected | Step ② confidence-low must auto-file Bug, not just stop |

## Dashboard panels (extends `templates/qa-metrics-dashboard.html`)

- **Heal rate (7-day rolling)** — heals proposed per 100 runs.
- **Heal accept rate** — % heals merged after Step ④ + reviewer.
- **Stability score top-10** — locators with the most heal events (refactor candidates).
- **Heal lead-time** — fail → merged-heal duration.
- **Real-bug catch rate from healing pipeline** — Step ② → "real bug" → filed Jira Bugs.

These panels are how the AI Quality Leader (Phase 7) keeps the loop honest.

---

**Prev:** [`integration.md`](./integration.md) · **Up:** [Jira docs README](./README.md) · **Next:** [`traceability.md`](./traceability.md)
