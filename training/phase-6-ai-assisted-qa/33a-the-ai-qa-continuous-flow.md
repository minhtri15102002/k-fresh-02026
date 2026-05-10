# Module 33a — The AI QA Continuous Flow

> Phase 6 · Effort: 5h · Prerequisites: Modules 30–32 · Sits **before** the capstone (Module 33)

> **Module pair.** This module owns the *operational mindset and the loop*. Module 33b owns the *techniques* (hallucination, grounding, the 9 metrics). Together they fill the gap between Phase 6's tooling content and Phase 7+8's strategic/architectural content.

## Reference card (1-page cheat sheet)

### Senior Mindset (5 principles you carry into every test session)

1. **Quality by Design** — testability is decided at design time, not after model selection.
2. **Risk-Based Testing** — focus on highest-impact failures; coverage ≠ value.
3. **Observability First** — if you can't see the output's behavior in production, you can't test it meaningfully.
4. **Measure What Matters** — pick the metrics the business cares about, not the metrics that are easy.
5. **Continuous Learning** — every escaped defect grows the eval set; every prompt change re-runs evaluation.

### AI-First Quality Principles → assertion vocabulary

| Principle | What you assert in code |
|---|---|
| **Trust** | Audit-trail entry exists for every output (prompt + model + version + timestamp) |
| **Safety** | Guardrail check passes (no PII leak, no policy violation, no unsafe content) |
| **Reliability** | Same input → equivalent output across N runs (variance within budget) |
| **Transparency** | Reasoning trace present; cites sources where required |
| **Accountability** | Named owner + decision recorded for any "Review" / "Fail" routing |

### The 9-stage Continuous Flow (memorise this)

```
Forward path (per-output):
  ① INPUT  →  ② PROMPT  →  ③ MODEL  →  ④ OUTPUT  →  ⑤ DELIVER VALUE
                                                            ↓
Loop back (per-eval cycle):
  ⑨ IMPROVE  ←  ⑧ FEEDBACK  ←  ⑦ DECISION  ←  ⑥ EVALUATION
       │                                              ↑
       └─────────── refines ① and ② next round ───────┘
```

Save this card in `training/sandbox/<your-name>/phase-6/ai-qa-flow-card.md` — you will cite it from every later AI-feature test.

## Learning objectives

After this module you can:

- Draw the **9-stage Continuous Flow** for any AI feature in under 5 minutes and identify which stages your current tests actually cover.
- Translate each **AI-First Quality Principle** into one concrete assertion in a Playwright/eval spec.
- Apply the **Senior Mindset** to a real test plan — show me your eval set and I can tell which of the 5 principles you skipped.
- Decide **per-stage** what to instrument, what to assert, and what to monitor.
- Tell apart "I ran tests" from "I closed the loop."

## Why it matters

> *AI without evaluation creates false confidence. Quality is a system, not a checklist. Continuous flow, continuous improvement.*

Traditional QA is **gated**: write tests → run tests → ship → done. AI-feature QA is **looped**: every output is an eval candidate, every eval is data, every data point updates the eval set, and every eval-set update may change the prompt or the model. If your test process doesn't loop, you are doing **deterministic QA on a non-deterministic system** — and shipping false confidence.

Phase 6 Modules 30–32 taught you to *use* AI in your QA work. This module teaches you to **test AI itself, operationally**. It sits before the capstone so the capstone can exercise these patterns when the picked feature has any AI surface.

## Concepts

### Stage-by-stage walk-through (with what you actually do)

#### ① INPUT — User / Data
**What you do:** define the input distribution. Include happy / edge / adversarial slices. Sample real production traffic if you have it.
**What you assert:**
- Schema stable vs baseline
- PII redacted at boundary
- Distribution within drift budget (PSI ≤ 0.20)

> Borrow Module 42's `@data` spec pattern.

#### ② PROMPT — Instructions
**What you do:** version-control the prompt. Treat it like source code (it is). One prompt change = one PR = one eval re-run.
**What you assert:**
- Prompt has a version + an owner
- Prompt diff triggers eval (CI gate)
- Prompt-injection corpus passes

#### ③ MODEL — AI System
**What you do:** pin model + provider + version. Record which model produced which output (audit trail).
**What you assert:**
- Pinned model version present in every output's audit row
- Cost per request within budget
- p95 latency within SLO

#### ④ OUTPUT — Response
**What you do:** capture every output's `(input, prompt_version, model_version, output, timestamp, request_id)` tuple. This is the audit trail.
**What you assert:**
- Output schema stable (if structured)
- Required fields present
- No PII leak in output

#### ⑤ DELIVER VALUE — Improve
**What you do:** instrument what value was actually delivered (user clicked, accepted, rejected, escalated).
**What you assert:**
- Delivery telemetry pipeline alive
- Acceptance/rejection rate within band

> "Deliver value" is the hand-off between forward path and loop-back path. Without telemetry here, the loop never closes.

#### ⑥ EVALUATION — Score & Analyze
**What you do:** run the eval set; score per metric; record per-output verdicts.
**What you assert (the metrics — covered fully in Module 33b):**
- Correctness, Relevance, Completeness
- Coherence, Groundedness
- Safety, Tone & Style

#### ⑦ DECISION — Pass / Fail / Review
**What you do:** route every output to one of three lanes: **Pass → Accept**, **Fail → Fix**, **Review → Refine**. Document the routing rule (it's policy, not engineering).
**What you assert:**
- Routing rule is deterministic (same scores → same lane)
- Review-lane sample is representative
- Fail-lane has a documented owner

#### ⑧ FEEDBACK — Insights & Errors
**What you do:** for every Fail and every sampled Review, run **error analysis** → categorise root cause (prompt, model, retrieval, data, edge case) → record patterns.
**What you assert:**
- Every Fail has a category
- Pattern frequency tracked over time
- New categories trigger eval-set growth

#### ⑨ IMPROVE — Refine
**What you do:** the only stage that *changes* the system. Refine prompts, update data, enhance model, improve guardrails. Each change = one PR with linked eval evidence.
**What you assert:**
- Every change linked to ≥ 1 Fail or Review pattern
- Eval re-runs and improves the relevant metric
- No regression on other metrics > budget

### What "closing the loop" actually means

A team that *ran tests* has Stages ① → ⑥. A team that **closes the loop** has all 9 stages with **named owners** at ⑦, ⑧, ⑨, and a **cadence** that re-enters the loop weekly or per-deploy.

| Question to ask your team | If "no" → which stage is missing |
|---|---|
| Can you list every output your AI feature produced yesterday? | ④ Output (audit trail) |
| Can you tell me which prompt version produced which output? | ② Prompt versioning |
| What's the acceptance rate, this week vs last week? | ⑤ Deliver value |
| Show me the last 10 Failed outputs and their root-cause category. | ⑧ Feedback |
| When was the eval set last grown? | ⑨ Improve |

If even one answer is "no", the loop isn't closed.

### The 6 advanced QA capabilities — operational mapping

The image's six capabilities aren't separate testing types — they are **lenses you apply across the flow**:

| Capability | Stages it operates on | Module 33b coverage |
|---|---|---|
| **Risk-Based Testing** | ① Input, ⑥ Evaluation | Eval-set design, slicing |
| **Context & Retrieval Checks** | ②③④ (RAG path) | Grounding tests + `@grounding` tag |
| **Hallucination Detection** | ④⑥ | Detection patterns (factual contradiction, fabrication, source-divergence) |
| **Guardrails & Safety Checks** | ②④ (input/output filters) | Policy tests; reuse Module 42 `@bias` |
| **Observability & Monitoring** | ⑤④ continuously | Reuse Module 42 `@observability` |
| **Learning & Evolution** | ⑧⑨ | Eval-set growth discipline |

You'll write specs for each in Module 33b.

### Common failure modes at the flow level

| Failure | Symptom | Counter |
|---|---|---|
| **Loop never closes** | No re-eval after prompt changes | Make Stage ② a CI trigger that runs Stage ⑥ |
| **No audit trail** | "Why did it answer that?" → "we don't know" | Stage ④ logs `(input, prompt_v, model_v, output, ts, rid)` |
| **Decision lane = trash bin** | Everything routes to Pass; Fail lane empty | Sampled human review on Pass lane; check refusal/error rate |
| **Feedback without categorisation** | "Lots of failures, can't see a pattern" | Mandatory category on every Fail (Stage ⑧) |
| **Improve without measurement** | Prompt changed → "feels better" → no number moved | Stage ⑨ requires linked metric delta |
| **Senior Mindset abandoned under pressure** | "Ship now, observability later" | Observability First is the principle that prevents the others from collapsing |

### Cadence — the loop's heartbeat

| Cadence | Stages exercised | Owner |
|---|---|---|
| **Per request** | ① → ⑤ + audit log | service / runtime |
| **Per PR** | ② change → ⑥ eval | CI |
| **Per day** | ⑤ telemetry → ⑦ routing → ⑧ categorisation (sampled) | on-call |
| **Per week** | ⑧ pattern review → ⑨ improvement candidates | feature team |
| **Per quarter** | full loop retrospective; eval-set audit | AI Test Engineer + owner |

If a cadence has no owner, it dies — same rule as Module 44.

## Hands-on lab

> Solo-mode only (no live LLM required). Outputs land in `training/sandbox/<your-name>/phase-6/`.

1. **Pick one AI feature (15 min).** Real (your team's chatbot, classifier, recommender) or mock (e.g. "the SUT's product-search but powered by an LLM"). Document scope in `feature-brief.md`.
2. **Draw the 9-stage flow for it (1h).** Mermaid block in `flow-diagram.md`. Label every arrow. Mark the stages your team actually instruments today (✓) vs not (✗).
3. **Per-stage instrumentation table (1h).** For each stage, write 3 cells: *what you instrument*, *what you assert*, *what you monitor*. Save as `instrumentation-table.md`.
4. **Principle → assertion mapping (45 min).** For each of the 5 AI-First Quality Principles, write one concrete assertion you'd add to a spec for your feature. Save as `principle-assertions.md`.
5. **Cadence ownership matrix (30 min).** Use the cadence table above; fill in named owners (or "GAP — needs owner"). Save as `cadence-owners.md`.
6. **Loop-closure self-audit (45 min).** Answer the five "Question to ask your team" questions honestly for your feature. Identify the single biggest gap. Save as `loop-closure-audit.md`.
7. **Spec scaffold (1h).** Write a `flow-spec.md` outlining the test files you would create (file names, tags, assertions). You'll fill in the actual spec content in Module 33b.

> **Pre-capstone hand-off:** these artifacts feed Module 33b directly, and the capstone (Module 33) cites them if the chosen feature has any AI surface.

## Self-check

- [ ] Can you draw the 9-stage flow without looking?
- [ ] For a real feature, can you point to the audit-trail row of any output produced yesterday?
- [ ] Does every cadence in your matrix have a named owner?
- [ ] Can you name the failure mode your feature is one bad week away from?
- [ ] Have you instrumented Stage ⑤ (Deliver Value)? If not, the loop isn't closed.

## Further reading

- *Designing Machine Learning Systems* — Chip Huyen (Ch. 7 + Ch. 8: ML in production + monitoring)
- RAGAS evaluation framework docs — for the metric vocabulary you'll formalise in Module 33b
- OpenAI / Anthropic eval docs — production-grade examples of the loop in code
- *Building Machine Learning Powered Applications* — Emmanuel Ameisen (the loop made concrete)
- This repo: `prompts/advanced/risk-analysis.md`, `templates/qa-metrics-dashboard.html`, `.agents/skills/llm-evaluation/SKILL.md`

---

**Prev:** [32 — MCP & browser agents](./32-mcp-and-browser-agents.md) · **Next:** [33b — Testing AI Features in Practice](./33b-testing-ai-features-in-practice.md) · **Up:** [Phase 6 README](./README.md)
