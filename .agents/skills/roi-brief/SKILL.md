---
name: roi-brief
description: "Drafts a quarterly ROI brief for an AI-testing workflow that conforms to documents/roi/calculator.md (Section A). Takes a JSON inputs file with the workflow scope, baseline before/after metrics, all-in costs, and a quality-control number; selects the right formula shape (TIME-SAVING / DEFECT-PREVENTION / COST-REDUCTION); computes gross savings, total costs, and net savings; and emits a finished, sign-off-ready Markdown brief that scores ≥4 on Module 39's Business-understanding rubric. Use when explicitly asked to 'draft an ROI brief', 'compute ROI for <workflow>', 'quarterly ROI for <X>', or before any AI-adoption-stage gate review (Module 38). Rejects with clear errors if any of the six required sections is missing — never silently inflates a number to match a target."
optionalRefs:
  - documents/roi/calculator.md            # contract — the brief must match Section A shape
  - documents/roi/baseline-template.md     # input — every brief cites a frozen baseline
  - documents/roi/README.md                # framework — 6 steps, 3 formula shapes
  - reports/roi-brief-<workflow>-<period>.md  # output — the emitted brief
  - reports/roi-trend.json                 # output (append-only) — feeds future dashboard panel
---

# ROI Brief

The hardest leadership conversation isn't "did the AI work" — it's "did it pay back". This skill makes that conversation re-derivable: every number in the emitted brief comes from a labelled formula a CFO or a senior reviewer can re-compute in 5 minutes.

It is the runnable counterpart to [`documents/roi/calculator.md`](../../../documents/roi/calculator.md). The calculator is the *human* template; this skill is the *agent* template — same Section-A shape, same six steps, same five mandatory cost categories.

---

## When to use this skill

Trigger on:

- "Draft an ROI brief for `<workflow>`"
- "Compute ROI for `<workflow>`" / "Quarterly ROI for `<X>`"
- "Brief leadership on the AI POM / triage / heal / flake / eval workflow"
- Before any **adoption-stage gate review** (Module 38 — Stage 1 → 2 → 3 → 4 transitions)
- Before the **Module 39 graduation** Business-understanding score
- At every **Module 44 transformation review** with leadership

**Do NOT use when:**

- The user wants the **adoption decision** (should we adopt?) → use [Module 37](../../../training/phase-7-ai-era-leadership/37-trust-governance-and-responsible-ai.md) Go/No-Go template; ROI assumes the workflow is already piloted.
- The user wants a **business case for new tooling** (procurement) → that's a different artefact; ROI is a retrospective on a workflow with a measured baseline.
- The Month-0 baseline does not exist → **stop**; ask the user to fill [`baseline-template.md`](../../../documents/roi/baseline-template.md) first. A brief without a frozen baseline is propaganda.
- The user wants a **release go/no-go** → use [`release-readiness`](../release-readiness/SKILL.md).

---

## Inputs you need

Pull what you can from the user's evidence; ask only for what's missing:

| Input | Where to find it | Required? |
|---|---|---|
| Workflow name | User statement / baseline file | yes |
| Formula shape | Inferred from the workflow (table below); confirm with user | yes |
| Adoption-ladder stage | Baseline file `Adoption-ladder stage planned` field | yes |
| Owner + reviewers | Baseline file `Sign-off` section | yes |
| Baseline reference path | Must exist; the brief cites it by path | yes |
| Period covered | Default: last 90 days closing today | yes |
| Tool versions | `package.json`, prompt versions, agent versions | yes |
| Before/after metrics (3–5 rows) | `reports/run-trend.json`, `reports/defects.json`, heal-history log (if you maintain one), PR timestamps, time tracking | yes |
| Gross-savings inputs (3 fields per formula shape) | Derived from before/after rows | yes |
| All-in costs (5 categories) | Vendor invoices, governance log, training log, incident log, eval-infra spend | yes |
| Quality-control metric (1 row) | Any quality metric from the baseline; before/after | **yes — non-negotiable** |
| Stop-adopting checks (5 booleans) | Module 38 line 119 list | yes |

If any of `baseline reference`, `quality-control metric`, or any cost category is missing → **stop and ask**; do not invent.

### Inferring the formula shape

| Workflow type | Formula shape | Examples |
|---|---|---|
| Workflow that AI completes faster than humans | **TIME-SAVING** | POM authoring, defect triage, manual TC drafting |
| Workflow that AI prevents production events | **DEFECT-PREVENTION** | Self-healing pipeline (avoided rollbacks), eval infrastructure (avoided incidents) |
| Workflow that AI reduces resource consumption | **COST-REDUCTION** | Flake management (engineer-hours), CI optimisation (CI minutes) |

If unclear, ask the user — never default silently. The shape determines the formula in §3 of the brief.

---

## How to use it

### Phase 1 — Gather signals

```bash
# Verify the baseline exists (skill MUST stop if it doesn't)
test -f training/sandbox/<your-name>/roi/roi-baseline-<workflow>.md \
  || { echo "Missing baseline — fill documents/roi/baseline-template.md first"; exit 1; }
```

Read the baseline file; copy the cost-calibration anchors (hourly rate, cost per bug, cost per release, $/CI minute) into the inputs.

### Phase 2 — Build the inputs JSON

Copy [`resources/inputs-example.json`](./resources/inputs-example.json) to a working file and fill every field:

```bash
cp .agents/skills/roi-brief/resources/inputs-example.json /tmp/roi-inputs.json
$EDITOR /tmp/roi-inputs.json
```

Schema (every field is required unless marked optional):

```jsonc
{
  "workflow_name": "AI-assisted POM authoring",
  "formula_shape": "TIME-SAVING",            // TIME-SAVING | DEFECT-PREVENTION | COST-REDUCTION
  "adoption_stage": 1,                       // 1 | 2 | 3 | 4
  "owner": "Khanh Do",
  "reviewers": ["Alice", "Bob"],             // ≥ 1 outside the workflow team
  "baseline_ref": "training/sandbox/khanh/roi/roi-baseline-pom.md",
  "period_start": "2026-01-01",
  "period_end": "2026-03-31",
  "tool_versions": "Cursor 1.x · pom-generator.md v3",
  "scope_description": "...",                // 2-3 sentences
  "metrics_before_after": [                  // 3-5 rows
    { "name": "POM setup time (h)", "before": 6.0, "after": 1.5, "sample": "24 features", "source": "PR timestamps" }
  ],
  "gross_inputs": {
    "input_label": "POM setup time (h)",
    "input_before": 6.0,
    "input_after": 1.5,
    "multiplier_label": "features per quarter",
    "multiplier_value": 24,
    "unit_cost_label": "$/hour",
    "unit_cost_value": 125
  },
  "costs": {
    "tool_licenses_usd": 1200,
    "governance_hours": 4,
    "training_hours": 4,
    "incident_recovery_usd": 0,
    "eval_infra_usd": 0,
    "hourly_rate": 125
  },
  "quality_control": {
    "metric_name": "Code-review approval rate (%)",
    "before": 97.1,
    "after": 97.4,
    "verdict": "improved"                    // improved | stable | degraded
  },
  "stop_check": {
    "no_recent_incidents": true,
    "eval_pass_rate_above_gate": true,
    "engineers_reading_prs": true,
    "cost_per_release_stable": true,
    "governance_owner_stable": true
  },
  "recommendation": "maintain"               // maintain | advance | pause | rollback
}
```

### Phase 3 — Run the script

```bash
# print the brief to stdout
npm run roi:brief -- /tmp/roi-inputs.json

# write to a report file
npm run roi:brief -- /tmp/roi-inputs.json --out reports/roi-brief-pom-q1-2026.md

# also append a row to reports/roi-trend.json (for future dashboard)
npm run roi:brief -- /tmp/roi-inputs.json --out reports/roi-brief-pom-q1-2026.md --trend

# verbose — show every computation step
npm run roi:brief -- /tmp/roi-inputs.json --verbose
```

Exit codes:

- `0` — brief emitted; quality-control verdict ≠ `degraded`
- `1` — brief emitted **but quality-control verdict = `degraded`** (CI should treat this as a failure; investigate before reporting)
- `2` — invocation error (missing input field, invalid JSON, formula shape mismatch)

### Phase 4 — Hand-off

The emitted brief is sign-off-ready. The author still needs to:

1. Get reviewer + finance partner signatures in §10.
2. Commit the brief under `training/sandbox/<your-name>/roi/` (or your org's RFC system).
3. If `--trend` was used, commit the updated `reports/roi-trend.json`.
4. Cite the brief in the next adoption-stage gate (Module 38) or graduation review (Module 39).

---

## How the script computes (so reviewers can re-derive)

### TIME-SAVING

```
hours_saved_per_unit = input_before − input_after
gross_savings_$      = hours_saved_per_unit × multiplier_value × unit_cost_value
gross_savings_h      = hours_saved_per_unit × multiplier_value
```

### DEFECT-PREVENTION

```
events_avoided       = input_before − input_after
gross_savings_$      = events_avoided × multiplier_value × unit_cost_value
                       (multiplier_value typically = 1; unit_cost_value = $ per event)
```

### COST-REDUCTION

```
units_reduced        = input_before − input_after
gross_savings_$      = units_reduced × multiplier_value × unit_cost_value
                       (e.g. CI minutes saved × runs/quarter × $/CI-min)
```

### All-in costs (always)

```
total_costs_$ = tool_licenses_usd
              + governance_hours × hourly_rate
              + training_hours   × hourly_rate
              + incident_recovery_usd
              + eval_infra_usd
```

### Net

```
net_savings_$ = gross_savings_$ − total_costs_$
net_savings_h = (gross_savings_$ − total_costs_$) ÷ hourly_rate          // for sentence
```

### One-sentence summary (auto-generated)

```
"<workflow> cut <input_label> from <before> → <after> (<%>% reduction).
 Across <multiplier_value> <multiplier_label> last quarter that saved
 ~<gross_h>h = ~$<gross>. Net of $<costs> in tool/governance/training/
 incident/eval overhead, **net savings ~$<net>/quarter** with
 <quality_control.metric_name> <verdict> (<qc_before> → <qc_after>)."
```

---

## Anti-patterns the script catches automatically

| Anti-pattern | Detection | Behaviour |
|---|---|---|
| Missing baseline reference | `baseline_ref` field empty or file doesn't exist | exit 2 with "Fill `documents/roi/baseline-template.md` first" |
| Missing quality-control row | `quality_control` block missing | exit 2 with "Quality-control row is mandatory (Module 38)" |
| Quality-control verdict = degraded | `quality_control.verdict === "degraded"` | emit brief BUT exit 1; print warning |
| Fewer than 5 cost categories | any cost field missing (use 0 explicitly) | exit 2 with "Show all 5 cost categories explicitly; use 0 for N/A" |
| Vanity metric in scope description | regex match on "lines of code", "% AI-suggested", "feels faster", "X× more productive" | emit warning; suggest replacement |
| Zero reviewers | `reviewers` array empty | exit 2 with "≥ 1 reviewer required" |
| Stage advance with red stop-checks | `recommendation === "advance"` && any `stop_check === false` | exit 2 with "Cannot advance with red stop-checks" |
| Wrong formula shape | `formula_shape` not in enum | exit 2 with allowed values |

---

## Best practices

- **Numbers, not vibes.** Every line of the brief cites an input field name from the JSON.
- **Conservative beats inflated.** When two interpretations of a number are plausible, the script always picks the lower gross savings — easier to defend, easier to repeat.
- **Re-run on every cost calibration update.** Hourly rate moved? Cost per bug recalibrated? Re-run; commit a v2 brief that supersedes v1.
- **One brief per workflow per quarter.** Aggregating ROI across workflows is a different artefact (Module 44 cockpit Business Impact panel) — don't conflate.
- **The script is deterministic.** Same inputs → identical brief, byte-for-byte. This makes diffing two quarters trivial.

---

## Related

- [`documents/roi/calculator.md`](../../../documents/roi/calculator.md) — the human template + 5 worked examples this skill matches
- [`documents/roi/baseline-template.md`](../../../documents/roi/baseline-template.md) — the Month-0 baseline the brief cites
- [`documents/roi/README.md`](../../../documents/roi/README.md) — 6-step framework
- [`training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md`](../../../training/phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md) — strategic doc the brief implements
- [`training/phase-7-ai-era-leadership/39-the-2026-engineer.md`](../../../training/phase-7-ai-era-leadership/39-the-2026-engineer.md) — graduation rubric scored by the brief
- [`training/phase-8-quality-architecture/44-running-an-enterprise-ai-transformation.md`](../../../training/phase-8-quality-architecture/44-running-an-enterprise-ai-transformation.md) — multi-team cockpit consumes briefs
- [`release-readiness`](../release-readiness/SKILL.md) — sibling skill for ship/no-ship; ROI is the quarter-after lens
- [`requirements-traceability`](../requirements-traceability/SKILL.md) — defect data feeding the math
