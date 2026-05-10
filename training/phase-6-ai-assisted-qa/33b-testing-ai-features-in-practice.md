# Module 33b — Testing AI Features in Practice (Hallucination, Grounding, RAG)

> Phase 6 · Effort: 6h · Prerequisites: Module 33a · Sits **before** the capstone (Module 33)

> **Module pair.** Module 33a owns the *operational mindset and the loop*. This module owns the *techniques* you apply at Stages ⑥ Evaluation and ⑦ Decision: hallucination detection, grounding/RAG quality, and the **9-metric scoring rubric**.

## Reference card (1-page cheat sheet)

### The 6 advanced QA capabilities → spec types

| Capability | Spec type | Tag (existing) | Pattern source |
|---|---|---|---|
| Risk-Based Testing | Eval-set design + slicing | (eval discipline, no tag) | Module 36 |
| **Context & Retrieval Checks** | RAG grounding spec | **`@grounding`** (NEW — convention-only) | This module |
| **Hallucination Detection** | LLM-as-judge + factual contradiction | `@grounding` (overloaded) | This module |
| Guardrails & Safety Checks | Policy / refusal spec | reuse `@bias` | Module 42 |
| Observability & Monitoring | Telemetry-driven SLO spec | reuse `@observability` | Module 42 |
| Learning & Evolution | Eval-set growth discipline | (process, no tag) | Module 33a |

> `@grounding` is **convention-only** in this module — same precedent as Module 42's tags. Stretch lab below drafts a PR proposing it for `prompts/core/test-tags.md`.

### The 9 metrics — what they mean and how to score

| # | Metric | Definition | How to score | When to fail |
|---|---|---|---|---|
| 1 | **Accuracy** | Output matches ground truth | Deterministic check (exact, contains, JSON match) | < target threshold |
| 2 | **Relevance** | Output addresses the input | LLM-as-judge with rubric | judge < 3/5 |
| 3 | **Completeness** | All required parts present | Schema check + coverage rubric | required field missing |
| 4 | **Coherence** | Output is internally consistent / readable | LLM-as-judge | judge < 3/5 |
| 5 | **Groundedness** | Claims trace to retrieved context | Citation check + LLM-as-judge | unsupported claim present |
| 6 | **Safety** | No PII leak, no policy violation | Regex + classifier | any violation |
| 7 | **Tone & Style** | Matches brand voice / register | LLM-as-judge | judge < 3/5 |
| 8 | **Latency** | p95 within budget | Aggregate from telemetry | > budget |
| 9 | **Cost** | $/request within budget | Token counter / vendor billing | > budget |
| (User Satisfaction) | Acceptance / thumbs-up rate | Production telemetry only | < target band |

> Score every output on **at least metrics 1–7**; aggregate 8–9 from telemetry; observe User Satisfaction in production.

## Learning objectives

After this module you can:

- Author a **`@grounding` retrieval-recall spec** that fails when the retrieved context can't support the answer.
- Author a **hallucination-detection spec** using LLM-as-judge with a factual-contradiction rubric.
- Author a **9-metric scoring spec** that produces a structured score per output.
- Decide **which metric maps to which decision lane** (Pass / Fail / Review) and document the routing.
- Know what each metric *can't* tell you (so you don't false-confidence yourself).

## Why it matters

> *AI without evaluation creates false confidence. Quality is a system, not a checklist.*

Module 33a gave you the loop. Without operational techniques to fill **Stage ⑥ Evaluation**, the loop runs on vibes. The three skills in this module — RAG/grounding, hallucination detection, 9-metric scoring — are the **minimum craft** of an AI Test Engineer in 2026. Get these right and your loop has signal; get them wrong and your loop has noise.

## Concepts

### ① RAG & retrieval quality (the `@grounding` spec)

#### What can break in a RAG pipeline

```
QUERY → RETRIEVER → CONTEXT → PROMPT(CONTEXT) → MODEL → ANSWER
   │                   │           │                       │
   │                   │           │                       └─ may not be supported by context
   │                   │           └─ may be too long, truncated, or irrelevant
   │                   └─ may miss the relevant passage (recall failure)
   └─ may be misinterpreted (intent classification)
```

Each arrow is a place to fail. Each is testable.

#### Grounding sub-tests

| Sub-test | What it asserts | Fail when |
|---|---|---|
| **Retrieval recall** | The relevant passage was retrieved | golden passage absent from top-K |
| **Context relevance** | Retrieved passages are on-topic | LLM-judge marks > N/K passages off-topic |
| **Answer support** | Every claim in answer is supported by retrieved context | LLM-judge marks any claim unsupported |
| **Citation correctness** | Cited source actually contains the cited claim | citation regex doesn't match retrieved passage |
| **Refusal on no-context** | Model refuses gracefully when retrieval returns nothing | model fabricates an answer |

#### Spec pattern (TypeScript / Playwright)

```typescript
import { test, expect } from '@playwright/test';
import { runRagQuery, judgeAnswerSupport } from '../../utils/rag';

test.describe('@P1 @critical @grounding feature:product-search-rag', () => {

  test('retrieval recall@5 ≥ 0.90 on golden set', async () => {
    const golden = await loadGoldenSet('product-search-rag-v2');
    let hits = 0;
    for (const item of golden.items) {
      const { retrieved } = await runRagQuery(item.query, { topK: 5 });
      if (retrieved.some(p => p.id === item.goldenPassageId)) hits++;
    }
    expect(hits / golden.items.length).toBeGreaterThanOrEqual(0.90);
  });

  test('every answer claim supported by retrieved context', async () => {
    const sample = await loadGoldenSet('product-search-rag-v2', { sample: 30 });
    for (const item of sample.items) {
      const { answer, retrieved } = await runRagQuery(item.query);
      const verdict = await judgeAnswerSupport({ answer, context: retrieved });
      expect(verdict.unsupportedClaims, `Q: ${item.query}`).toHaveLength(0);
    }
  });

  test('refuses gracefully when retrieval returns nothing', async () => {
    const { answer, retrieved } = await runRagQuery('xyzzy-no-such-product');
    expect(retrieved).toHaveLength(0);
    expect(answer.toLowerCase()).toMatch(/i don'?t (know|have|find)|no (relevant|matching)/);
    expect(answer).not.toMatch(/\$\d+|in stock|sku/i); // no fabricated specifics
  });
});
```

### ② Hallucination detection

#### What "hallucination" actually means (three flavors)

| Type | Definition | Detection technique |
|---|---|---|
| **Factual contradiction** | Output contradicts a ground-truth fact | Compare against fact corpus; assertion-style judge |
| **Fabrication** | Output invents a specific (number, name, citation) not present in input/context | Citation/source check; numeric span check vs context |
| **Source divergence** | Output paraphrases beyond what source supports | Faithfulness LLM-judge with source-anchored rubric |

#### Spec pattern (LLM-as-judge with structured verdict)

```typescript
import { test, expect } from '@playwright/test';
import { invokeFeature, judgeFactual } from '../../utils/llm';

const RUBRIC = `
You are a strict factual-consistency judge. Given a STATEMENT and a CONTEXT,
return JSON: {
  "verdict": "supported" | "unsupported" | "contradicted",
  "evidence_span": "<exact substring of CONTEXT>" | null,
  "reason": "<one sentence>"
}
- "supported": every claim has matching evidence_span in CONTEXT.
- "unsupported": at least one claim has no evidence_span (fabrication).
- "contradicted": at least one claim contradicts CONTEXT.
Be conservative — when in doubt, choose unsupported.
`;

test.describe('@P1 @major @grounding feature:faq-bot hallucination', () => {

  test('no fabricated specifics on golden Q&A', async () => {
    const golden = await loadGoldenSet('faq-v3');
    const failures: { q: string; verdict: string; reason: string }[] = [];

    for (const item of golden.items) {
      const answer = await invokeFeature('faq-bot', { question: item.q });
      const verdict = await judgeFactual({
        rubric: RUBRIC,
        statement: answer,
        context: item.canonicalSource,
      });
      if (verdict.verdict !== 'supported') {
        failures.push({ q: item.q, verdict: verdict.verdict, reason: verdict.reason });
      }
    }

    expect(failures, JSON.stringify(failures, null, 2)).toHaveLength(0);
  });
});
```

#### Calibration discipline (don't trust the judge blindly)

| Risk | Counter |
|---|---|
| Judge model drifts | Pin judge model + judge prompt; re-calibrate quarterly against human ratings |
| Self-validation circularity (judge = answerer) | Always use a *different* model family as judge |
| Judge agrees with itself too much | Sample 20 verdicts/quarter for human review; track judge–human agreement |
| Rubric ambiguity | Force structured JSON output with enums |

### ③ The 9-metric scoring spec

The spec produces one row per output: a structured verdict the dashboard can chart and the loop can act on.

```typescript
import { test, expect } from '@playwright/test';
import { invokeFeature, scoreNineMetrics } from '../../utils/scoring';
import fs from 'node:fs';

const BUDGETS = {
  accuracy: 0.90, relevance: 4.0, completeness: 0.95,
  coherence: 4.0, groundedness: 0.95, safety: 1.00,
  toneStyle: 4.0, latencyP95Ms: 1500, costPerReqUsd: 0.012,
};

test.describe('@P1 @critical feature:assistant nine-metric score', () => {

  test('aggregate scores within budget', async () => {
    const eval_ = await loadEvalSet('assistant-v5');
    const rows: any[] = [];

    for (const item of eval_.items) {
      const t0 = Date.now();
      const out = await invokeFeature('assistant', item.input);
      const elapsed = Date.now() - t0;
      const scores = await scoreNineMetrics({ input: item.input, output: out, gold: item.expected });
      rows.push({ id: item.id, ...scores, latencyMs: elapsed, costUsd: out.costUsd });
    }

    fs.writeFileSync('reports/nine-metric-trend.json',
      JSON.stringify({ ts: Date.now(), rows }, null, 2));

    const agg = (k: keyof typeof BUDGETS) =>
      k === 'latencyP95Ms'
        ? p95(rows.map(r => r.latencyMs))
        : k === 'costPerReqUsd'
          ? mean(rows.map(r => r.costUsd))
          : mean(rows.map(r => (r as any)[k.replace(/(P95Ms|PerReqUsd)$/, '')]));

    expect(agg('accuracy')).toBeGreaterThanOrEqual(BUDGETS.accuracy);
    expect(agg('relevance')).toBeGreaterThanOrEqual(BUDGETS.relevance);
    expect(agg('completeness')).toBeGreaterThanOrEqual(BUDGETS.completeness);
    expect(agg('coherence')).toBeGreaterThanOrEqual(BUDGETS.coherence);
    expect(agg('groundedness')).toBeGreaterThanOrEqual(BUDGETS.groundedness);
    expect(agg('safety')).toBeGreaterThanOrEqual(BUDGETS.safety);
    expect(agg('toneStyle')).toBeGreaterThanOrEqual(BUDGETS.toneStyle);
    expect(agg('latencyP95Ms')).toBeLessThanOrEqual(BUDGETS.latencyP95Ms);
    expect(agg('costPerReqUsd')).toBeLessThanOrEqual(BUDGETS.costPerReqUsd);
  });
});
```

### Decision-lane routing (Stage ⑦ from Module 33a)

| Score profile | Lane | Action |
|---|---|---|
| All metrics within budget AND safety = 1.0 | **Pass** | Accept; sample 5% for spot-review |
| Safety < 1.0 OR accuracy < budget | **Fail** | Block; root-cause; eval-set growth |
| Borderline scores OR new pattern detected | **Review** | Human triage; refine prompt or context |

Document the routing rule in `documents/governance/<feature>-routing.md` — it's policy, not engineering.

### What each metric *can't* tell you

| Metric | Blind spot |
|---|---|
| Accuracy | Doesn't catch verbose-but-right or terse-but-right trade-offs |
| Relevance | Can pass while answer is harmful |
| Completeness | Can pass while every part is wrong |
| Coherence | Can pass while every claim is fabricated |
| Groundedness | Can pass while context itself is wrong |
| Safety | Doesn't catch subtle bias (use Module 42 `@bias`) |
| Tone & Style | Subjective; calibrate with human ratings |
| Latency | Doesn't catch tail-cost spikes |
| Cost | Doesn't catch per-user cost outliers |

> "All 9 green" ≠ "shippable." Always pair with sampled human review (Module 33a Stage ⑦ Review lane).

### Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Eval set never grows | Same 50 items for a year | Stage ⑨ adds every Failed pattern; review monthly |
| One-shot judging | LLM-judge called once per item | Run 3× with temperature > 0; use majority verdict |
| Hidden retrieval failure | Answer looks great; retrieval missed real source | Always test retrieval recall *separately* from answer quality |
| Refusal regression | New prompt makes model fabricate when it should refuse | Always include "no-context" items in eval set |
| Metrics on the dashboard, not in CI | Pretty charts; nothing blocks merges | Wire 9-metric spec into PR pipeline |
| Mixing measurement units | Some scores 0–1, others 1–5 | Normalize to one scale per metric in `scoring.ts` |

## Hands-on lab

> Solo-mode (no live LLM required; fixtures + mocks are fine). Outputs land in `training/sandbox/<your-name>/phase-6/`.

1. **Pick the feature from Module 33a (5 min).** Same feature; carry forward `feature-brief.md` and `flow-diagram.md`.
2. **Define the 9-metric budgets (45 min).** With justification for every number. Save as `nine-metric-budgets.md`. Numbers without justification = vibes.
3. **Author the `@grounding` spec scaffold (1.5h).** Save as `specs/grounding-spec.ts`. Use the RAG pattern above. Mock `runRagQuery` + `judgeAnswerSupport` against fixtures in `fixtures/golden-rag.json`.
4. **Author the hallucination-detection spec scaffold (1.5h).** Save as `specs/hallucination-spec.ts`. Pin a hypothetical judge model in a comment. Mock `judgeFactual` against `fixtures/golden-faq.json`.
5. **Author the 9-metric scoring spec scaffold (1.5h).** Save as `specs/nine-metric-spec.ts`. Mock `scoreNineMetrics` so the spec runs deterministically.
6. **Decision-routing policy doc (30 min).** For your feature, write `routing-policy.md`: which score profile → which lane, who owns each lane, escalation path.
7. **(Stretch — only if you want to propose `@grounding` officially)** Draft a PR diff against `prompts/core/test-tags.md` adding `@grounding` to the optional-tags table. Save as `proposed-tag-extension.diff`. **Do not merge** — this is a stretch artifact for review.

## Self-check

- [ ] Can you list the 9 metrics and one blind spot of each?
- [ ] Did your `@grounding` spec test retrieval recall *separately* from answer support?
- [ ] Is your hallucination judge a *different* model from the answerer?
- [ ] Do your budgets have justifications, not just numbers?
- [ ] Does your routing policy survive the question "what if every metric is borderline?"

## Further reading

- RAGAS — `docs.ragas.io` (industry-standard RAG metric library)
- *Patterns for Building LLM-based Systems & Products* — Eugene Yan
- OpenAI Evals (github.com/openai/evals) — production-grade eval patterns
- Anthropic — *How to evaluate LLMs* (latest blog)
- This repo: `prompts/core/test-tags.md`, `.agents/skills/llm-evaluation/SKILL.md`, `.agents/skills/advanced-evaluation/SKILL.md`, Module 42 spec patterns

---

**Prev:** [33a — The AI QA Continuous Flow](./33a-the-ai-qa-continuous-flow.md) · **Next:** [33 — Capstone & career paths](./33-capstone-and-career-paths.md) · **Up:** [Phase 6 README](./README.md)
