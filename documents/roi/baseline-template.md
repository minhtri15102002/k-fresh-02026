# Month-0 Baseline — `<workflow-name>`

> **How to use:** copy this file, rename it `roi-baseline-<workflow>.md`, and fill in every section **before** turning AI on for this workflow. Delete this banner before committing. Save under `training/sandbox/<your-name>/roi/` (or your org's RFC system).
>
> Without a Month-0 baseline, every later ROI number is unverifiable (Module 38 line 62).

## Metadata

| Field | Value |
|---|---|
| **Workflow name** | <e.g. AI-assisted POM authoring> |
| **Owner** | <single accountable person> |
| **Adoption-ladder stage planned** | Stage 1 (Assist) \| Stage 2 (Analytics) \| Stage 3 (Automation) \| Stage 4 (Autonomy) — see [Module 38](../../training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md) |
| **Tools adopted** | <e.g. Cursor + `prompts/core/pom-generator.md`> |
| **Pilot teams** | <names — keep it ≤ 2 to start> |
| **Baseline window** | YYYY-MM-DD to YYYY-MM-DD (recommend 90 days back) |
| **Date filled** | YYYY-MM-DD |
| **Reviewers** | <≥ 1 senior reviewer outside the workflow team> |
| **Next review date** | <date AI is turned on + 90 days> |

## Why this workflow

<2–4 sentences: the user pain, the hypothesis for AI improvement, the metric you most want to move>

## Adoption ladder honesty check (Module 38)

> Most enterprise QA orgs are honestly at Stage 1.5 — claiming Stage 3, operating at Stage 1. Be honest.

| Question | Answer |
|---|---|
| Today, who keeps the pen on this workflow? | Human \| AI suggests, human accepts \| AI runs, human supervises \| AI runs, human audits |
| What governance exists today? | None \| Informal \| Documented \| Documented + audited |
| Does today's process already have a measurable baseline? | Yes \| Partial \| No |

If "today" is Stage 0 (no measurable baseline), Step 1 is to instrument — not to add AI.

## Baseline metrics (pick 3–5)

> Same metric table as [Module 38 line 68](../../training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md). Reuse what you have; never invent.

| Category | Metric | Baseline value | Sample size | Source | Confidence |
|---|---|---|---|---|---|
| **Speed** | Test authoring time per feature (h) | <e.g. 6.0> | <e.g. 24 features last quarter> | <e.g. PR timestamps> | High \| Med \| Low |
| **Speed** | Cycle time idea → prod (d) | <e.g. 9> | <e.g. last 60 features> | <DORA / Git> | |
| **Quality** | Defect-escape rate (bugs/release) | <e.g. 4.2> | <e.g. 12 releases> | [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) export | |
| **Quality** | Flake rate (%) | <e.g. 3.7%> | <e.g. 8,400 runs> | `reports/run-trend.json` | |
| **Quality** | Code-review approval rate (%) | <e.g. 97.1%> | <PR sample> | GH Insights | |
| **Quality** | Post-merge defect rate per PR | <e.g. 0.18> | <PRs / period> | GH issue export | |
| **Cost** | $ per CI minute | <e.g. $0.08> | <invoice period> | Cloud billing | |
| **Cost** | Engineer-hours per regression cycle | <e.g. 14> | <last cycle> | Time-tracking | |
| **Trust** | NPS / support tickets / 1k users / churn | <pick one> | <period> | Product analytics | |
| **Trust** | Incident MTTR (min) | <e.g. 47> | <last 10 incidents> | Incident log | |
| **AI quality** | Eval pass rate trend (%) | n/a (no AI yet) | n/a | <will be> `reports/eval-trend.json` | n/a |

> **Cap at 5 metrics.** More than that and nothing improves (Module 38 line 66).

## Cost calibration table (org-specific anchors — fill once, reuse forever)

| Anchor | Value | Source |
|---|---|---|
| Fully-loaded hourly rate | $<e.g. 125>/h | Finance partner |
| Cost per production bug — `severity:critical` | $<e.g. 12,000> | Incident-cost analysis |
| Cost per production bug — `severity:major` | $<e.g. 3,500> | Incident-cost analysis |
| Cost per production bug — `severity:minor` | $<e.g. 600> | Incident-cost analysis |
| Cost per production bug — `severity:trivial` | $<e.g. 80> | Incident-cost analysis |
| Cost per blocked release | $<e.g. 25,000> | Lost-revenue / engineer-day estimate |
| Cost per AI-attributable incident | $<e.g. 35,000> | Same shape as bug cost; include brand-risk premium |
| $ / CI minute | $<e.g. 0.08> | Cloud billing ÷ minutes |

> Severity labels per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Without these anchors, defect-prevention math (workflows 3 & 5) is impossible — fill them with finance, not from intuition.

## Frequency / volume figures

| Figure | Value | Source |
|---|---|---|
| Features shipped per quarter | <e.g. 24> | [`documents/manual-testcases/README.md`](../manual-testcases/README.md) index |
| Releases per quarter | <e.g. 12> | Git tags / CI |
| Defects filed per quarter | <e.g. 60> | GH issues with `bug` label |
| CI runs per quarter | <e.g. 8,400> | CI logs |
| Production AI incidents per quarter (last 4 quarters avg) | <e.g. 0.5> | Incident log |

## Sanity checks before AI is turned on

- [ ] Every metric has a value, sample size, source, and confidence.
- [ ] Cost calibration table is filled with **finance-blessed** numbers (not blog estimates).
- [ ] Adoption-ladder stage is the **honest** stage, not the aspirational one.
- [ ] Workflow scope is one named workflow (not "AI in QA generally").
- [ ] Reviewer outside the workflow team has signed off (name + date).
- [ ] Next review date is on the calendar with the named owner.

## Stop-criteria pre-commitment

> Module 38 line 119 — pause AI adoption when any of these is true:

- [ ] Will pause if AI-attributable incident in last 30 days and root cause unfixed.
- [ ] Will pause if eval-set pass rate drops below gate for two consecutive runs.
- [ ] Will pause if engineers merging AI-assisted PRs without reading them (sample 10 — count comments).
- [ ] Will pause if cost per release rises faster than features delivered.
- [ ] Will pause if governance owner is unnamed or has changed twice in a quarter.

## Sign-off

| Role | Name | Date |
|---|---|---|
| Workflow owner | | |
| Senior reviewer | | |
| Finance partner (cost calibration) | | |
| AI Quality Leader / approver | | |

> Once signed, this baseline is **frozen**. Subsequent ROI calculations must reference this exact file (or a successor with explicit `supersedes: <path>` and a re-baseline rationale). Hand-edited baselines after AI is on are the #1 cause of fake ROI.
