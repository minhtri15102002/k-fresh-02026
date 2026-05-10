# Module 42 — Deep-Dive AI Testing: Data, Bias, Explainability, Observability

> Phase 8 · Effort: 7h · Prerequisites: Module 41 + Phase 7 Module 36 (eval foundations) + Phase 6 Modules 33a/33b (operational continuous flow + RAG/grounding/9-metric patterns)

> Contributes **§3 Test & Evaluation Patterns** to your graduation RFC.

> **Pre-requisite check.** If you skipped Phase 6 [Module 33a](../phase-6-ai-assisted-qa/33a-the-ai-qa-continuous-flow.md) and [Module 33b](../phase-6-ai-assisted-qa/33b-testing-ai-features-in-practice.md), do them before drafting §3. They cover the **operational craft** (9-stage flow, RAG grounding, hallucination detection, 9-metric scoring) that this module *architects around*. This module gives you the platform-level deep dives (Data, Bias, Explainability, Observability); 33a/b give you the per-output operational patterns. The RFC §3 you ship will reference both.

## Reference card

- **Module 36 covered functional eval surface** (capability, safety, hallucination). Module 42 goes **below** it: data quality, bias/fairness, explainability, observability.
- **Each of the 4 testing types** gets a spec template + a tag convention + an example assertion shape.
- **Tag convention is convention-only here** — we don't yet propose extending `prompts/core/test-tags.md`.
- **Every spec runs in CI** alongside Playwright (no separate runner).
- **Module deliverable:** 4 spec patterns + tag conventions → §3 of your RFC.

## Learning objectives

After this module you can:

- Author a **data-quality test** that catches schema drift, distribution drift, and PII leakage at the eval boundary.
- Author a **bias/fairness test** that fails when the bias delta across declared slices exceeds budget.
- Author an **explainability test** that asserts both the answer *and* the reasoning trace.
- Author an **observability test** that consumes production telemetry and surfaces drift.
- Tag all four types so the dashboard can group them automatically.

## Why it matters

> *AI testing goes beyond functional validation. It includes fairness, reliability, and security testing. Teams must validate real-world AI behavior. Trustworthy AI systems are now a business priority.*
> *— 2026 Enterprise Guide, Question 5*

The poster lists seven "Core Areas of AI Testing": Functional, Data, Bias, Security, Performance, Observability, Explainability. Phases 4 + 6 + 7 covered Functional / Security / Performance / Eval foundations. **The four still owed: Data, Bias, Explainability, Observability.** Each needs its own spec pattern, its own assertion vocabulary, and its own dashboard surface.

## Concepts

### Tag convention (Module-42-only — not promoted to `prompts/core/test-tags.md` yet)

In addition to the existing `@P*` / `@severity` / `@suite` / `@feature` taxonomy, label these specs with one of:

```
@data            — input/output data quality
@bias            — fairness across slices
@explainability  — reasoning-trace assertions
@observability   — prod-telemetry-driven assertion
```

Convention-only — if it proves out, propose an extension to `prompts/core/test-tags.md` in a future quarter.

### ① Data-quality testing

**What can break:** schema drift, missing fields, distribution shift, PII leakage at the boundary, encoding errors, label noise.

**Spec pattern (TypeScript / Playwright `request` fixture):**

```typescript
import { test, expect } from '@playwright/test';
import { loadEvalSet, schemaOf, distributionStats } from '../../utils/eval';

test.describe('@P1 @major @data dataset:product-search', () => {
  const dataset = loadEvalSet('product-search-v3');

  test('schema is stable vs baseline', async () => {
    const baseline = schemaOf(loadEvalSet('product-search-baseline'));
    const current = schemaOf(dataset);
    expect(current).toEqual(baseline);
  });

  test('numeric distribution within drift budget (PSI ≤ 0.20)', async () => {
    const baseline = distributionStats(loadEvalSet('product-search-baseline'));
    const current = distributionStats(dataset);
    expect(current.psi).toBeLessThanOrEqual(0.20);
  });

  test('no PII fields leak into eval inputs', async () => {
    const piiFields = ['email', 'phone', 'ssn', 'dob'];
    for (const item of dataset.items) {
      for (const field of piiFields) {
        expect(JSON.stringify(item.input)).not.toMatch(new RegExp(field, 'i'));
      }
    }
  });
});
```

**Assertion vocabulary:** schema equality, PSI / KS drift threshold, PII regex absence, label-noise sampling.

### ② Bias / fairness testing

**What can break:** uneven accuracy across demographic slices, skewed refusal rates, biased recommendation coverage.

**Spec pattern:**

```typescript
import { test, expect } from '@playwright/test';
import { runEval, sliceBy } from '../../utils/eval';

test.describe('@P1 @critical @bias feature:resume-screen', () => {
  const slices = ['gender', 'ethnicity-proxy', 'age-band', 'region'];

  for (const slice of slices) {
    test(`pass-rate delta across ${slice} ≤ ±2pp`, async () => {
      const results = await runEval('resume-screen-v4');
      const grouped = sliceBy(results, slice);

      const passRates = Object.values(grouped).map(g => g.passRate);
      const max = Math.max(...passRates);
      const min = Math.min(...passRates);

      expect(max - min).toBeLessThanOrEqual(0.02); // 2pp budget
    });
  }
});
```

**Assertion vocabulary:** per-slice pass-rate delta, demographic parity, equalized odds, coverage @ K (recommenders).

> Bias budgets are policy decisions, not engineering decisions. Always cite the policy doc that ratified the threshold.

### ③ Explainability testing

**What can break:** correct answer, wrong reason; correct answer, no audit trail; reasoning that violates policy ("I chose X because protected attribute Y").

**Spec pattern (LLM-as-judge over the trace):**

```typescript
import { test, expect } from '@playwright/test';
import { invokeAgent, judgeRationale } from '../../utils/agent';

test.describe('@P2 @major @explainability feature:loan-decision', () => {
  test('rationale references only allowed factors', async () => {
    const result = await invokeAgent('loan-decision', { applicantId: 'fixture-001' });

    expect(result.decision).toMatch(/approve|deny|defer/);

    const allowed = ['income', 'credit_history', 'debt_ratio', 'employment'];
    const forbidden = ['gender', 'race', 'zip_alone', 'age'];

    const verdict = await judgeRationale(result.rationale, { allowed, forbidden });

    expect(verdict.usesOnly(allowed)).toBe(true);
    expect(verdict.mentions(forbidden)).toBe(false);
    expect(verdict.tracesToInputs).toBe(true);
  });

  test('rationale length within audit budget', async () => {
    const result = await invokeAgent('loan-decision', { applicantId: 'fixture-001' });
    expect(result.rationale.length).toBeGreaterThanOrEqual(80);
    expect(result.rationale.length).toBeLessThanOrEqual(800);
  });
});
```

**Assertion vocabulary:** factor allow-list, factor forbid-list, traces-to-inputs check, rationale length budget, post-hoc consistency (same input → same rationale).

### ④ Observability testing

**What can break:** prod behavior diverges from CI behavior; nobody notices for weeks.

**Spec pattern (consumes telemetry, asserts SLO):**

```typescript
import { test, expect } from '@playwright/test';
import { queryTelemetry, slos } from '../../utils/telemetry';

test.describe('@P1 @major @observability feature:product-search', () => {
  test('p95 latency in last 24h within SLO', async () => {
    const p95 = await queryTelemetry({
      metric: 'feature.product_search.latency_ms',
      window: '24h',
      stat: 'p95',
    });
    expect(p95).toBeLessThanOrEqual(slos['product-search'].latencyP95Ms);
  });

  test('hallucination-flag rate (sampled prod review) within budget', async () => {
    const rate = await queryTelemetry({
      metric: 'feature.product_search.hallucination_flag_rate',
      window: '7d',
      stat: 'mean',
    });
    expect(rate).toBeLessThanOrEqual(slos['product-search'].hallucinationRate);
  });

  test('input distribution PSI vs training baseline', async () => {
    const psi = await queryTelemetry({
      metric: 'feature.product_search.input_psi',
      window: '7d',
      stat: 'last',
    });
    expect(psi).toBeLessThanOrEqual(0.25);
  });
});
```

**Assertion vocabulary:** SLO threshold, sampled-review rate, input-PSI threshold, cost-per-request budget, error-rate budget.

### Where each type lives in the platform

| Type | Component (from Module 41) | Cadence | Failure mode if absent |
|---|---|---|---|
| `@data` | ② Scaffolds + ③ Eval Runner | Per PR + nightly | Silent corpus rot |
| `@bias` | ③ Eval Runner + ⑤ Cockpit | Per PR | Undetected harm + regulatory exposure |
| `@explainability` | ② Scaffolds + ⑥ Governance | Per PR | Unauditable decisions |
| `@observability` | ⑦ Telemetry → ③ Eval → ⑤ Cockpit | Continuous + nightly | Production drift, late detection |

### Gating policy (default)

| Type | PR-blocking? | Dashboard surfaced? | Audit-trail? |
|---|---|---|---|
| `@data` | yes (schema, PII); warn (drift) | yes | yes |
| `@bias` | yes if delta > 2× budget; warn otherwise | yes (per-slice trend) | yes |
| `@explainability` | yes (forbid-list); warn (length) | yes (judge-disagreement rate) | yes |
| `@observability` | nightly only (PR ≠ prod) | yes (real-time) | yes |

### Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Bias test with no policy doc** | Reviewer asks "why 2pp?" → silence | Cite the ratified policy in the test doc-comment |
| **Explainability test that judges with the same model that produced the answer** | Self-validating circularity | Use a different judge model; rotate quarterly |
| **Observability test with no SLO doc** | Threshold drifts via PR | Pin SLOs in `feature/<name>/budget.yml` |
| **Data test that locks the corpus forever** | Eval set never grows | Allow controlled additions via "eval-grow" PR label + reviewer approval |
| **All four types added at once** | Team overwhelm; tests get disabled | Roll out one type per quarter |

## Hands-on lab

### Org-mandate mode

1. **Pick one feature (15 min).** Real, in-production, owned by a team you can talk to.
2. **Author one spec per type (4 × 1h = 4h).** Use the patterns above. Tag correctly. Get the team to ratify the budgets.
3. **Wire to platform (1h).** Add to ③ Eval Runner; surface results on ⑤ Cockpit.
4. **Run for one week (background).** Capture pass-rate, false-positive rate, team complaints.
5. **Add to RFC §3 (1h).** Document patterns adopted, budgets, and rollout cadence.

### Solo prototype mode

1. **Pick a feature in this repo (15 min).** Existing one (e.g. cart, checkout) or a hypothetical AI-feature stub.
2. **Author 4 spec stubs (4 × 1h = 4h).** Place under `training/sandbox/<your-name>/phase-8/specs/`. They don't need to run against real data — fixtures are fine. Tags must be correct.
3. **Sketch how each surfaces on the dashboard (1h).** A panel-spec section in your RFC §3 — what chart, what threshold line, what link-through.
4. **Document budget rationale (1h).** Even hypothetical budgets need a "why this number" line. Save as `phase-8/budgets.md`.
5. **Add to RFC §3 (1h).** Same structure as org-mandate mode.

## Self-check

- [ ] Can you name the 4 testing types and one assertion vocabulary item each?
- [ ] Does every test cite a budget *and* a policy doc?
- [ ] Are gating policies explicit (block / warn / nightly only) for every type?
- [ ] Did you actually run at least one of the four against real or fixture data?
- [ ] Can you defend tag conventions to a skeptical reviewer?

## Further reading

- *Designing Machine Learning Systems* — Chip Huyen (Ch. 6 + Ch. 8)
- *Practical Fairness* — Aileen Nielsen
- *Interpretable Machine Learning* — Christoph Molnar (free online)
- OpenTelemetry docs — read just the "Manual instrumentation" page
- This repo: `prompts/core/test-tags.md`, `prompts/advanced/risk-analysis.md`, `.agents/skills/llm-evaluation/SKILL.md`

---

**Prev:** [41 — Designing & Building an AI Quality Platform](./41-designing-and-building-an-ai-quality-platform.md) · **Next:** [43 — Compliance-as-Code](./43-compliance-as-code.md) · **Up:** [Phase 8 README](./README.md)
