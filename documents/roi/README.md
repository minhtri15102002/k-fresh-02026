# ROI for AI Testing — Calculation Framework

> Source-of-truth folder for **how to compute, defend, and report AI-testing ROI** in this repo. Consolidates the framework currently scattered across [Module 38](../../training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md), [Module 39](../../training/phase-7-ai-era-leadership/39-the-2026-engineer.md), and [Module 44](../../training/phase-8-quality-architecture/44-running-an-enterprise-ai-transformation.md) into one calculator + template + 5 worked examples.

A defensible AI-testing ROI is **a sentence in business English** backed by:

1. A baseline you measured (not estimated).
2. Gross savings with a formula a CFO can re-derive.
3. All-in costs (tool + governance + training + incident + eval).
4. A quality-control number proving you didn't trade speed for defects.
5. Net savings stated per quarter (or per release).

If any of the five is missing, the number is propaganda. The discipline below makes them all explicit.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | The 6-step framework + 5-workflow comparison + repo cross-references | First time computing ROI; orientation |
| [`calculator.md`](./calculator.md) | Fillable markdown template (all 6 steps) + **5 worked examples**: POM authoring, defect triage, self-healing, flake management, eval infrastructure | Every time you need to compute or defend a number |
| [`baseline-template.md`](./baseline-template.md) | The **Month-0 baseline** doc Module 38 lab #1 references — capture before-AI metrics so later numbers are verifiable | Before turning on any new AI workflow |

## Reading order

1. **`README.md`** — read once for the framework + workflow taxonomy.
2. **`baseline-template.md`** — fill once per workflow you plan to AI-augment, **before** turning AI on.
3. **`calculator.md`** — fill at every quarterly review and every adoption-stage gate.

## The 6-step framework (consolidated)

Reference card. Full discussion + math in [`calculator.md`](./calculator.md).

| # | Step | Output | Anti-pattern it prevents |
|---|---|---|---|
| 1 | Pick the **workflow**, not the tool | One named workflow + adoption-ladder stage (Module 38) | "We're rolling out Cursor" — too broad to measure |
| 2 | Establish **Month-0 baseline** (3–5 metrics) | Numbers in [`baseline-template.md`](./baseline-template.md) | Post-hoc baselines (always favourably remembered) |
| 3 | Compute **gross savings** | $ figure with the formula re-derivable | "Feels faster" |
| 4 | Subtract **all-in costs** (tool + governance + training + incidents + eval infra) | $ figure | "Just the licence cost" |
| 5 | Attach a **quality-control number** | One quality metric, before/after | Speed-for-defects trades hidden as ROI |
| 6 | State **NET ROI in business English** | One sentence, one quarter, one chart-ready number | Vanity metrics ("% PRs with AI assist") |

## The three formula shapes

Every AI-testing ROI calculation reduces to one of these three:

```
TIME-SAVING:           GROSS = (HOURS_BEFORE − HOURS_AFTER) × FREQUENCY × $/HOUR
DEFECT-PREVENTION:     GROSS = (ESCAPE_BEFORE − ESCAPE_AFTER) × RELEASES × COST_PER_PROD_BUG
COST-REDUCTION:        GROSS = (RESOURCE_BEFORE − RESOURCE_AFTER) × FREQUENCY × $/UNIT
```

All three then run through Steps 4–6 unchanged.

## The 5 reference workflows (full math in [`calculator.md`](./calculator.md))

| # | Workflow | Repo capability | Formula shape | Net savings (illustrative) | Quality control |
|---|---|---|---|---|---|
| 1 | **AI-assisted POM authoring** | [`prompts/core/pom-generator.md`](../../prompts/core/pom-generator.md), [`.agents/skills/pom-architect/SKILL.md`](../../.agents/skills/pom-architect/SKILL.md) | Time-saving | ~$11.3 k / quarter | Code-review approval rate; post-merge defect rate per PR |
| 2 | **AI-assisted defect triage** | [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) | Time-saving | ~$13.0 k / quarter | Severity-label accuracy (sampled); duplicate-detection precision |
| 3 | **Self-healing locator pipeline** | [`documents/jira/self-healing-loop.md`](../jira/self-healing-loop.md) | Defect-prevention | ~$22.4 k / quarter | Heal-accept rate; real-bugs-caught rate |
| 4 | **Flake management** | [`.agents/skills/flaky-test-triage/SKILL.md`](../../.agents/skills/flaky-test-triage/SKILL.md) | Cost-reduction (engineer hours) | ~$14.6 k / quarter | Flake rate trend; quarantine-to-fix lead time |
| 5 | **AI eval infrastructure** | Module 36 + [`.agents/skills/llm-evaluation/SKILL.md`](../../.agents/skills/llm-evaluation/SKILL.md) | Defect-prevention (incidents) | ~$45.0 k / quarter (expected value) | Eval pass-rate trend; AI-incident MTTR |

> All five numbers above are **illustrative** with conservative inputs. Replace with your own measurements per [`baseline-template.md`](./baseline-template.md). Real-org variance: ±50% is normal.

## How this folder connects to the rest of the repo

| Connection | What it does |
|---|---|
| **Module 38 hands-on lab #1** asks you to save `roi-baseline.md` | Use [`baseline-template.md`](./baseline-template.md) instead of inventing one |
| **Module 38 hands-on lab #3** asks you to write a ROI brief | Use [`calculator.md`](./calculator.md) and pick the matching reference workflow |
| **Module 39 graduation rubric** scores "Business understanding" | An ROI brief produced from this template scores ≥4 by construction (formula re-derivable, quality control attached) |
| **Module 44 executive cockpit Business Impact panel** | Each workflow's quarterly ROI brief feeds one row; the panel renders the 5 workflows × trend |
| **Phase 8 Module 41 Quality Platform self-service contract** | "ROI per AI feature" becomes one of the platform SLOs; this folder defines how it's computed |
| **Jira self-healing loop** ([`documents/jira/self-healing-loop.md`](../jira/self-healing-loop.md)) | Workflow #3 example reads `reports/heal-history.jsonl` for input numbers |
| **Defect labels** ([`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)) | `severity:*` labels feed the `COST_PER_PROD_BUG` calibration table in `calculator.md` |
| **Dashboard** ([`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html)) | Future: a Business Impact panel that reads `reports/roi-trend.json` (not yet built) |

## Cadences

| Cadence | Action | Owner |
|---|---|---|
| **Per workflow, before AI on** | Fill [`baseline-template.md`](./baseline-template.md) | Workflow owner |
| **Quarterly** | Fill [`calculator.md`](./calculator.md) for each Stage-1+ workflow; commit to `training/sandbox/<your-name>/roi/` (or your org's RFC system) | AI Quality Leader |
| **At every adoption-stage gate** (Module 38) | Re-derive the calculator with latest 90 days of data | AI Quality Leader + finance partner |
| **At every Module 39 graduation review** | Attach a calculator output as evidence of "Business understanding" trait | Reviewer |
| **At every Module 44 transformation review with leadership** | Aggregate the per-workflow numbers into the executive cockpit | AI Quality Architect |

## Anti-patterns this folder is designed to prevent

| Anti-pattern | Counter built into this folder |
|---|---|
| "We saved 75% of our time!" without sample size | Calculator forces `FEATURES_PER_QUARTER` field |
| "We saved $100k/year" without subtracting tool/governance cost | Calculator forces all 5 cost categories |
| "We're 3× more productive!" without quality control | Calculator template won't validate without a quality-control row |
| "Lines of code generated by AI: 12k!" | Section 6 explicitly lists vanity metrics that don't count |
| Different teams reporting incompatible ROI numbers | Single template; same 6 steps; same 3 formula shapes |
| Post-hoc "baseline" reconstructed from memory | Baseline template must be filled **before** AI is turned on; CI lint future-extension flags missing baselines |
| Lone authorship → no scrutiny | Every brief has a `Reviewers` field; ROI without a reviewer is a draft |

## Out of scope

This folder is **not**:

- A general "business case for AI" template. ROI assumes the workflow is already adopted (or piloted) — for adoption decisions, see [Module 37](../../training/phase-7-ai-era-leadership/37-trust-governance-and-responsible-ai.md) Go/No-Go and [Module 38](../../training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md) adoption ladder.
- A replacement for finance/accounting standards. Compute fully-loaded hourly rate with your finance partner, not from a blog post.
- A licence to skip [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) discipline. Defect data feeds the math; bad labels = bad ROI.
