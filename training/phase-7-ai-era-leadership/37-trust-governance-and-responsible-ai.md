# Module 37 — Trust, Governance & Responsible AI

> Phase 7 · Effort: 4h · Prerequisites: Module 36

> Answers curriculum questions **#3 — What is the biggest challenge in AI adoption?** and **#7 — What are the risks of overusing AI?**

## Learning objectives

After this module you can:

- Explain why **trust and governance** — not capability — are the binding constraint in enterprise AI adoption.
- Stand up a lightweight **AI governance framework**: ownership, validation gates, monitoring, rollback, audit trail.
- Identify the **failure modes of overusing AI** (skill atrophy, blind trust, security drift) and counter them with deliberate practice.
- Run an **AI feature go/no-go review** that produces a defensible decision and a paper trail.

## Why it matters

> *The biggest challenge is trust and governance. AI can generate unpredictable or incorrect outputs. Organizations need strong validation and monitoring. Responsible AI adoption is more important than speed.*
>
> *Overdependence can reduce critical engineering thinking. Blind trust may introduce hidden failures. Security and governance risks can increase rapidly. AI should support humans, not replace judgment.*

A model demo is easy. **Production-grade trust is hard** — it requires evaluation, monitoring, accountable owners, and the discipline to slow down when stakes rise. Most failed AI initiatives don't fail technically; they fail because no one owns the consequences. QA is uniquely positioned to lead here: we already do governance for releases.

## Concepts

### The trust gap (why "it works on my laptop" isn't enough)

| Stakeholder | What they need to trust before turning the feature on |
|---|---|
| **Users** | The output is accurate enough; mistakes have an undo; my data is safe |
| **Engineers** | We can debug failures and roll back fast |
| **Security** | No prompt-injection, PII leak, or unauthorised tool use |
| **Legal/Compliance** | Decisions are explainable; we have an audit log; we comply with applicable AI regulation |
| **Leadership** | The cost is bounded; the brand risk is bounded; we can defend the system in a post-incident review |

If even **one** column is "no", the launch should not happen. QA owns the table.

### A minimal AI governance framework (start here)

```
┌─────────────────────────────────────────────────────────────┐
│  1. NAMED OWNER per AI feature  ── accountable, not RACI'd  │
├─────────────────────────────────────────────────────────────┤
│  2. PRE-LAUNCH VALIDATION GATES                             │
│     - eval-set pass rate ≥ X%      (Module 36)              │
│     - bias delta across slices ≤ Y │
│     - prompt-injection corpus passes                        │
│     - cost & latency within budget                          │
│     - human review on N sampled outputs                     │
├─────────────────────────────────────────────────────────────┤
│  3. RUNTIME GUARDRAILS                                      │
│     - input/output filters                                  │
│     - PII redaction                                         │
│     - tool-call allow-list (for agents)                     │
│     - kill-switch / feature flag                            │
├─────────────────────────────────────────────────────────────┤
│  4. CONTINUOUS MONITORING                                   │
│     - sampled live review                                   │
│     - drift dashboards                                      │
│     - cost & latency SLOs                                   │
│     - user thumbs / escalation channel                      │
├─────────────────────────────────────────────────────────────┤
│  5. AUDIT TRAIL                                             │
│     - prompt + model + output logged (with PII redaction)   │
│     - eval runs versioned in git                            │
│     - decisions traceable to a person + a date              │
├─────────────────────────────────────────────────────────────┤
│  6. INCIDENT PROCESS                                        │
│     - on bad output: kill-switch → root cause → eval-set    │
│       grows → re-launch only after gate re-passes           │
└─────────────────────────────────────────────────────────────┘
```

You can implement every layer with tools you already have:

- Layers 2–5 reuse the same dashboards (`templates/qa-metrics-dashboard.html`), the same CI (`.github/workflows/`), the same defect-label discipline (`prompts/core/defect-labels.md`).
- The kill-switch is a feature flag — same pattern as a typical canary release.

### The AI feature go/no-go review (template)

Run this **before** an AI feature ships. Output is one Markdown page that becomes the audit record.

```markdown
# AI Go/No-Go Review — <feature> — <date>

## 1. Feature scope
- Purpose:
- User-facing surface:
- AI components: (model, prompt version, tool list)

## 2. Validation evidence
- Eval-set version: vX.Y (link)
- Pass rate: A% (gate ≥ Z%)
- Bias delta across slices: ±B pp (gate ≤ ±C pp)
- Hallucination rate (sampled): D% (gate ≤ E%)
- Prompt-injection corpus: PASS / FAIL
- p95 latency: F ms (gate ≤ G ms)
- $/request: H¢ (gate ≤ I¢)

## 3. Guardrails in place
- [ ] Output filter
- [ ] PII redaction
- [ ] Tool allow-list (agents only)
- [ ] Kill-switch / feature flag
- [ ] On-call rota knows how to disable

## 4. Monitoring committed
- [ ] Live sampling rate: K%
- [ ] Drift dashboard owner: <name>
- [ ] Escalation channel: <slack channel>

## 5. Risks & mitigations (top 5)

## 6. Decision
- GO / NO-GO / GO-WITH-CONDITIONS
- Owner: <name>
- Reviewers: <names>
- Date:
```

### Risks of overusing AI (and how to counter them)

| Risk | What it looks like | Counter-practice |
|---|---|---|
| **Skill atrophy** | New engineers can't write a Playwright test without an AI assist | "AI-off" days; pair on hard problems unaided; mentorship that explains *why*, not just *what* |
| **Blind trust** | PRs merged because the AI said it was fine; reviewers stop reading | Mandatory human reviewer + LLM reviewer; reviewer must add at least one comment proving they read it |
| **Hidden failures** | AI confidently fills in a wrong selector/value that passes one run and breaks 100 later | Phase 6's MCP-first discipline; flake-triage rigor (Phase 5); eval-suite expansion on every escape |
| **Security drift** | Prompts evolve, secrets leak, tool-call surface grows quietly | Prompt diff review; secret scanning; tool allow-list reviewed monthly |
| **Cost runaway** | Token spend doubles in a month; nobody notices | Cost on the dashboard; alerting on threshold |
| **Governance gap** | "AI committee" exists but never blocks anything | Empowered owner with an actual budget and the right to say no |
| **Cargo-culting** | Adopting tools because peers did, not because they fit | Adoption ROI doc per tool (Module 38) |
| **Loss of explainability** | Users / regulators ask *why* and the team shrugs | Capture prompt+inputs+outputs; ship "show reasoning" affordance where appropriate |

### "Speed vs. responsibility" — the trade-off you must own

> *Responsible AI adoption is more important than speed.*

Speed is easy to measure (cycle time, deploys/day). Responsibility is harder — it shows up in the **absence** of incidents, lawsuits, and PR scandals. The trick is to bake governance into the same pipeline that gives you speed:

| Practice | Adds responsibility | Costs how much speed? |
|---|---|---|
| Evals on every PR | ⬆⬆ | ~5–10 min CI |
| Kill-switch on every AI feature | ⬆⬆⬆ | <1 day to add |
| Sampled human review weekly | ⬆⬆ | ~2h/wk |
| Prompt diff review | ⬆ | seconds per PR |
| Audit log | ⬆⬆ | ~1 sprint to set up |

In every row the answer is: governance is **cheap** when designed in early; **catastrophic** when retrofitted after an incident.

### Where this lives in the repo

| Governance need | Existing repo artifact |
|---|---|
| Standards / red lines | `prompts/core/pom-generator.md` (forbidden tables); `.agents/skills/skill-validator/SKILL.md` |
| CI gate for evals | extend `.github/workflows/playwright.yml` pattern |
| Audit dashboard | `templates/qa-metrics-dashboard.html` |
| Defect labels & severity | `prompts/core/defect-labels.md` |
| Risk lens | `prompts/advanced/risk-analysis.md` |
| Release gating | `prompts/advanced/release-readiness.md` |

## Hands-on lab

1. **Governance gap audit (1h).** Pick one AI tool/feature your team uses today. Score each of the 6 governance layers above as 0 (missing) / 1 (partial) / 2 (solid). Save as `training/sandbox/<your-name>/phase-7/governance-audit.md`. Identify the lowest-scoring layer and propose the cheapest improvement.
2. **Author a Go/No-Go review (1h).** Use the template above for the AI feature you scoped in Module 36. Save as `go-no-go-<feature>.md`. Force yourself to fill **every** field — even if a metric doesn't exist yet, write "not yet measured — owner: <you> by <date>".
3. **Overuse-risk counter-plan (1h).** Pick the two most relevant risks from the table for your team and write a 1-page counter-plan: who does what, on what cadence, with what proof.
4. **Kill-switch design (1h).** Sketch (Markdown is fine) how you'd add a kill-switch + feature flag for the AI feature, including who can flip it, alert wiring, and rollback test. Save as `kill-switch-design.md`.

## Self-check

- [ ] Can you name the 6 governance layers without looking?
- [ ] Can you give a real example, from your team, of each overuse risk?
- [ ] Who owns the kill-switch on every AI feature in your org? (If "no one" — that's the answer.)
- [ ] What metric would tell you, this week, that an AI feature is silently degrading?
- [ ] Is "responsibility costs speed" true on a *well-designed* pipeline? Why / why not?

## Further reading

- NIST **AI Risk Management Framework** (AI RMF 1.0)
- ISO/IEC **42001** (AI management systems)
- OWASP **LLM Top 10**
- EU **AI Act** — risk categories overview
- *Trustworthy Online Controlled Experiments* — Kohavi, Tang, Xu (govern-by-experiment lens)
- This repo: `prompts/advanced/release-readiness.md`, `.agents/skills/skill-validator/SKILL.md`

---

**Prev:** [36 — Testing modern AI systems](./36-testing-modern-ai-systems.md) · **Next:** [38 — AI adoption strategy & ROI](./38-ai-adoption-strategy-and-roi.md) · **Up:** [Phase 7 README](./README.md)
