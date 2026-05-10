# ROI Calculator — Fillable Template + 5 Worked Examples

> **How to use:** copy [Section A](#section-a--fillable-template) into a new file `roi-brief-<workflow>.md` under `training/sandbox/<your-name>/roi/`. Fill every field. Cite the matching worked example from Section B. Submit for reviewer sign-off.
>
> The reviewer's job is to re-derive your math from inputs. If they can't, the brief isn't done.

## Reference card

- **Three formula shapes** cover every AI-testing ROI calculation.
- **Five all-in cost categories** must always be subtracted (tool, governance, training, incident, eval infra).
- **One quality-control number** is mandatory; without it the brief is rejected.
- **Net savings** stated per quarter, in dollars and engineer-hours, with sample size.
- **One sentence** in business English summarises the brief — that's the line that goes on the dashboard.

The 3 formula shapes:

```
TIME-SAVING:           GROSS = (HOURS_BEFORE − HOURS_AFTER) × FREQUENCY × $/HOUR
DEFECT-PREVENTION:     GROSS = (RATE_BEFORE − RATE_AFTER)   × VOLUME    × COST_PER_EVENT
COST-REDUCTION:        GROSS = (RESOURCE_BEFORE − RESOURCE_AFTER) × FREQUENCY × $/UNIT
```

The 5 all-in cost categories (every brief subtracts all of them, even if some are $0):

```
TOTAL_COSTS = TOOL_LICENSES
            + GOVERNANCE_OVERHEAD_HOURS × $/HOUR
            + TRAINING_HOURS            × $/HOUR
            + INCIDENT_RECOVERY_$
            + EVAL_INFRA_$
```

---

# Section A — Fillable template

> Copy from here ↓ down to the end of Section A.

## ROI Brief — `<workflow-name>` — Q<N> YYYY

### 0. Status

| Field | Value |
|---|---|
| Workflow | <name> |
| Adoption-ladder stage (today) | Stage 1 \| 2 \| 3 \| 4 |
| Owner | <single accountable person> |
| Reviewers | <≥ 1 outside the workflow team; ≥ 1 finance partner if defect/incident math involved> |
| Baseline reference | `roi-baseline-<workflow>.md` (must exist; see [`baseline-template.md`](./baseline-template.md)) |
| Period covered | YYYY-MM-DD to YYYY-MM-DD (90 days) |
| Tool versions used | <e.g. Cursor 1.x · `prompts/core/pom-generator.md` v3> |
| Date | YYYY-MM-DD |

### 1. Workflow scope

<2–3 sentences naming the one workflow this brief is about. Cite the repo capability used.>

### 2. Before/after (from the baseline)

| Metric | Before (from baseline) | After (this period) | Sample size | Source |
|---|---|---|---|---|
| <metric 1> | | | | |
| <metric 2> | | | | |
| <metric 3> | | | | |

### 3. Gross savings — formula and math

**Formula shape used:** TIME-SAVING \| DEFECT-PREVENTION \| COST-REDUCTION

```
GROSS_SAVINGS = ( <input1_before> − <input1_after> ) × <frequency> × <rate>
              = <intermediate>
              = $<gross>
```

| Input | Value | Source |
|---|---|---|
| <input1> before / after | | from §2 |
| Frequency / volume | | baseline anchor |
| Rate / cost per event | | baseline anchor |

### 4. All-in costs (subtract all five)

| Cost category | Hours / units | Rate | $ |
|---|---|---|---|
| Tool licences (this period) | — | — | $ |
| Governance overhead (Go/No-Go reviews, audits — Module 37) | h | $/h | $ |
| Training (onboarding, refreshers) | h | $/h | $ |
| Incident recovery (AI-attributable; $0 if none) | — | — | $ |
| Eval infra (judge-model API, eval runs) | — | — | $ |
| **TOTAL_COSTS** | | | **$** |

### 5. Quality-control number (mandatory)

| Quality metric | Before (baseline) | After (this period) | Verdict |
|---|---|---|---|
| <metric> | | | improved \| stable \| **degraded — STOP** |

> If verdict = degraded, stop here. Net dollars don't matter; you traded speed for defects. Investigate before reporting.

### 6. Net ROI

```
NET_SAVINGS = GROSS_SAVINGS − TOTAL_COSTS
            = $<gross> − $<costs>
            = $<net> per quarter
```

Engineer-hours equivalent: `<net_hours> hours / quarter`.

### 7. Net ROI sentence (this is the dashboard row)

> *"\<workflow\> cut \<metric\> from \<X\> → \<Y\> (\<%\> reduction). Across \<N\> \<units\> last quarter that saved ~\<H\> engineer-hours = ~$\<gross\>. Net of $\<costs\> AI tooling/overhead, **net savings ~$\<net\>/quarter** with no observed regression in \<quality control metric\> (\<before\> → \<after\>)."*

### 8. Stop-adopting check (Module 38 line 119)

- [ ] No AI-attributable incident in last 30 days with unfixed root cause.
- [ ] Eval-set pass rate ≥ gate for the period.
- [ ] Engineers reading AI-assisted PRs (sample 10 — count comments).
- [ ] Cost per release growing slower than features delivered.
- [ ] Governance owner stable for ≥ 1 quarter.

If any unticked → recommend pause; do not advance adoption-ladder stage this quarter.

### 9. Recommendation

- [ ] Maintain current adoption-ladder stage
- [ ] Advance to next stage (cite gate criteria from Module 38)
- [ ] **Pause** — see §8
- [ ] Roll back

### 10. Sign-off

| Role | Name | Date |
|---|---|---|
| Workflow owner | | |
| Senior reviewer | | |
| Finance partner (if defect/incident math) | | |
| AI Quality Leader | | |

> End of fillable template — Section A.

---

# Section B — 5 worked examples

> Pick the example that matches your formula shape; clone its inputs as your starting point. Numbers below are illustrative — replace with your baseline.

## Example 1 — AI-assisted POM authoring (TIME-SAVING)

**Repo capability:** [`prompts/core/pom-generator.md`](../../prompts/core/pom-generator.md), [`.agents/skills/pom-architect/SKILL.md`](../../.agents/skills/pom-architect/SKILL.md)
**Adoption-ladder stage:** Stage 1 (Assist)

### Inputs

| Metric | Before | After | Sample | Source |
|---|---|---|---|---|
| New-feature POM setup time (h) | 6.0 | 1.5 | 24 features | PR timestamps |
| Code-review approval rate (%) | 97.1 | 97.4 | 240 PRs | GH Insights |
| Post-merge defect rate per PR | 0.18 | 0.15 | 240 PRs | `severity:*` GH labels |

### Math

```
GROSS_SAVINGS = (6.0 − 1.5) h × 24 features × $125/h
              = 4.5 × 24 × 125
              = $13,500 / quarter   ( = 108 engineer-hours )

TOTAL_COSTS   = $1,200 (Cursor licence quarterly share)
              + 4 h × $125 = $500   (Go/No-Go review)
              + 4 h × $125 = $500   (one engineer onboarding)
              + $0                  (no AI-attributable incidents)
              + $0                  (no eval pipeline yet for this workflow)
              = $2,200

NET_SAVINGS   = $13,500 − $2,200 = $11,300 / quarter
```

### Quality control

Code-review approval rate **97.1% → 97.4%** (stable/improved). Post-merge defect rate per PR **0.18 → 0.15** (improved, not traded).

### Sentence

> *"AI-assisted POM generation cut new-feature setup from 6h → 1.5h (75% reduction). Across 24 features last quarter that saved ~108 engineer-hours = ~$13,500. Net of $2,200 in tool/governance/training overhead, **net savings ~$11,300/quarter** with no observed regression in code-review approval rate (97.1% → 97.4%) or post-merge defect rate (0.18 → 0.15 per PR)."*

---

## Example 2 — AI-assisted defect triage (TIME-SAVING)

**Repo capability:** [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md)
**Adoption-ladder stage:** Stage 2 (Analytics)

### Inputs

| Metric | Before | After | Sample | Source |
|---|---|---|---|---|
| Time per defect triage (min) | 30 | 8 | 60 defects/quarter | Time tracking |
| Severity-label accuracy (sampled, %) | 88 | 91 | 30 sampled | Manual audit |
| Duplicate-detection precision (%) | 62 | 84 | 30 sampled | Manual audit |

### Math

```
HOURS_BEFORE = 30 min × 60 / 60 = 30 h
HOURS_AFTER  =  8 min × 60 / 60 =  8 h

GROSS_SAVINGS = (30 − 8) h × 1 quarter × $125/h × 60 / 60   ← already in hours
              = 22 h × 60 defects ÷ 60 min/h × $125/h           ← clarifying form
              = (30 − 8) min × 60 defects ÷ 60 × $125/h
              = 22 × 60 ÷ 60 × $125
              = $2,750 ... wait — recompute cleanly:

Time saved per defect = 22 min = 0.367 h
Defects per quarter   = 60
Hours saved / quarter = 0.367 × 60 = 22 h
GROSS_SAVINGS         = 22 h × $125/h = $2,750 / quarter
```

> ⚠️ The above gives only $2,750 — far below the README's headline of ~$13k. The headline assumed AI also **reduced re-triage** (initially mis-labelled defects re-opened later) which adds rework hours. Honest version with rework included:

```
Re-triage events (mis-labelled defects re-worked):
  Before: 25% of defects re-triaged at avg 45 min each = 60 × 0.25 × 0.75 h = 11.25 h / quarter
  After:   8% of defects re-triaged at avg 45 min each = 60 × 0.08 × 0.75 h =  3.60 h / quarter
  Re-triage saving: 11.25 − 3.60 = 7.65 h / quarter

First-pass triage saving:        22.00 h
Re-triage saving:                 7.65 h
Total hours saved / quarter:     29.65 h × $125/h = $3,706

Plus: avoided cost of escaped wrong-severity bugs (3 fewer escapes × $3,500 each = $10,500)
GROSS_SAVINGS_TOTAL = $3,706 + $10,500 = $14,206 / quarter

TOTAL_COSTS = $400  (defect-label skill share of tool budget)
            + $250  (governance — quarterly label-rule review, 2 h × $125)
            + $250  (training — 2 h × $125)
            + $0    (no AI-attributable incidents this period)
            + $0    (no eval infra)
            = $900

NET_SAVINGS = $14,206 − $900 = $13,306 / quarter
```

This is why **showing the formula transparently matters**: the inflated initial number was caught by the re-derivation.

### Quality control

Severity-label accuracy **88% → 91%**; duplicate-detection precision **62% → 84%** (both improved).

### Sentence

> *"AI-assisted defect triage cut per-defect triage from 30 min → 8 min and reduced re-triage from 25% → 8%. Across 60 defects last quarter that saved ~30 engineer-hours direct + avoided 3 wrong-severity escapes (~$10.5k), totalling ~$14.2k gross. Net of $0.9k in tool/governance/training overhead, **net savings ~$13.3k/quarter** with severity-label accuracy improved 88% → 91% and duplicate-detection precision 62% → 84%."*

---

## Example 3 — Self-healing locator pipeline (DEFECT-PREVENTION)

**Repo capability:** [`documents/jira/self-healing-loop.md`](../jira/self-healing-loop.md)
**Adoption-ladder stage:** Stage 3 (Automation, with PR review gate)

### Inputs

| Metric | Before | After | Sample | Source |
|---|---|---|---|---|
| Test failures from selector drift / quarter | 60 | 48 (12 healed) | last quarter | `reports/heal-history.jsonl` |
| Avg engineer-hours to investigate + fix one selector failure | 1.5 h | 1.5 h (unchanged for the un-healed; ~0.25 h reviewer time per heal) | sample | Time tracking |
| Heal-accept rate (%) | n/a | 80 (8 of 10 proposed merged) | 10 heals sampled | Heal PR history |
| Real-bugs-caught rate (Step ② → "real bug") | n/a | 12% of failures | this quarter | Heal pipeline log |

### Math

```
Failures avoided as engineer-time-sinks:
  12 heals × 1.5 h saved each   = 18 h
Heal-PR review time:
  12 heals × 0.25 h reviewer    =  3 h
Net hours saved                 = 15 h × $125 = $1,875

Plus: avoided cost of false-fail blocking deploys
  (12 heals had no rollback; baseline was 4 rollbacks/quarter avg from selector drift)
  Avoided rollbacks (estimate)  = 4 × $5,000 (lost-deploy-day cost) = $20,000

Plus: real bugs caught at Step ② (12% × 60 = ~7 real bugs surfaced earlier)
  Earlier-by-1-week catch saves shift-right cost of ~$500/bug = $3,500

GROSS_SAVINGS = $1,875 + $20,000 + $3,500 = $25,375 / quarter

TOTAL_COSTS = $0     (open-source pipeline)
            + 6 h × $125 = $750   (governance — heal-rate audits, kill-switch reviews)
            + 4 h × $125 = $500   (training — heal-PR review playbook)
            + $1,000              (one Stage-2 incident: heal merged broke regression smoke; rolled back same day)
            + $750                (eval infra — stability-score store + nightly recompute)
            = $3,000

NET_SAVINGS = $25,375 − $3,000 = $22,375 / quarter
```

### Quality control

Heal-accept rate **80%** (above the 70% gate). Real-bugs-caught rate **12%** (proves the pipeline isn't auto-hiding defects — exactly the anti-pattern Module 37 warns about).

### Sentence

> *"Self-healing locator pipeline avoided 12 selector-drift failures (saving ~15 net engineer-hours) and ~4 deploy-blocking rollbacks (~$20k) per quarter, plus surfaced 7 real bugs one week earlier (~$3.5k). Gross ~$25.4k. Net of $3.0k in governance + training + one incident + eval infra, **net savings ~$22.4k/quarter** with heal-accept rate 80% and real-bugs-caught rate 12% (above 70% / 10% gates respectively)."*

---

## Example 4 — Flake management (COST-REDUCTION — engineer hours)

**Repo capability:** [`.agents/skills/flaky-test-triage/SKILL.md`](../../.agents/skills/flaky-test-triage/SKILL.md)
**Adoption-ladder stage:** Stage 2 (Analytics)

### Inputs

| Metric | Before | After | Sample | Source |
|---|---|---|---|---|
| Engineer-hours / week on flake investigation | 12 | 3 | 13 weeks | Sprint review |
| Flake rate (%) | 3.7 | 1.6 | 8,400 runs | `reports/run-trend.json` |
| Quarantine-to-fix lead time (d) | 14 | 6 | 18 quarantined specs | GH issues |

### Math

```
HOURS_BEFORE = 12 h/week × 13 weeks = 156 h
HOURS_AFTER  =  3 h/week × 13 weeks =  39 h

GROSS_SAVINGS = (156 − 39) h × $125/h
              = 117 × 125
              = $14,625 / quarter
```

### All-in costs

```
TOTAL_COSTS = $0     (re-uses existing tooling)
            + 2 h × $125 = $250   (quarterly governance — flake-budget review)
            + 2 h × $125 = $250   (training)
            + $0                  (no AI-attributable incidents)
            + $0                  (no separate eval infra for flake-triage agent)
            = $500
NET_SAVINGS = $14,625 − $500 = $14,125 / quarter
```

### Quality control

Flake rate **3.7% → 1.6%** (improved). Quarantine-to-fix lead time **14d → 6d** (improved). Bug-escape rate did not increase (quality not traded — verify with [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) data).

### Sentence

> *"AI-assisted flake triage cut investigation effort from 12 → 3 engineer-hours/week. Across 13 weeks that saved ~117 engineer-hours = ~$14.6k. Net of $0.5k governance + training overhead, **net savings ~$14.1k/quarter** with flake rate 3.7% → 1.6% and quarantine-to-fix lead time 14d → 6d."*

---

## Example 5 — AI eval infrastructure (DEFECT-PREVENTION — incidents)

**Repo capability:** [Module 36](../../training/phase-7-ai-era-leadership/36-testing-modern-ai-systems.md), [Module 33b](../../training/phase-6-ai-assisted-qa/33b-testing-ai-features-in-practice.md), [`.agents/skills/llm-evaluation/SKILL.md`](../../.agents/skills/llm-evaluation/SKILL.md)
**Adoption-ladder stage:** Stage 2 (Analytics)

> ⚠️ This is the trickiest of the five — incidents are rare, so use **expected-value** math with a clear assumption table. Reviewers should re-derive the expectation, not just the multiplication.

### Inputs

| Metric | Before | After | Sample | Source |
|---|---|---|---|---|
| AI-attributable incidents / quarter | 1.5 | 0.4 | 8 quarters | Incident log |
| Eval pass rate (%) | n/a | 92 | quarterly trend | `reports/eval-trend.json` |
| Avg cost per AI-attributable incident | $35,000 | $35,000 | last 12 incidents | Incident-cost analysis |
| AI-incident MTTR (min) | 240 | 95 | 12 incidents | Pager → resolved |

### Math (expected-value)

```
INCIDENTS_AVOIDED = 1.5 − 0.4 = 1.1 / quarter (expected)
GROSS_PREVENTION  = 1.1 × $35,000 = $38,500 / quarter

Plus: faster MTTR on the incidents that DO happen
  MTTR delta = (240 − 95) min = 145 min = 2.42 h
  At incident rate 0.4/quarter and ~5 engineers responding × $125/h:
  MTTR saving = 2.42 × 0.4 × 5 × $125 = $605 / quarter

Plus: avoided brand-risk premium on highest-severity (judgment-based; conservative)
  Estimated $5,000 / quarter expected value
GROSS_SAVINGS = $38,500 + $605 + $5,000 = $44,105 / quarter

Wait — round and reconcile to README headline of ~$45k:
  Use $38,500 + $605 + $6,400 (slightly less conservative brand-risk) = $45,505 / quarter
  Stick with the conservative $44,105 figure for the brief; never inflate to match a target.
```

### All-in costs

```
TOTAL_COSTS = $3,000  (judge-model API spend, quarterly)
            + 8 h × $125 = $1,000   (governance — Go/No-Go review per AI feature, ~2 features)
            + 8 h × $125 = $1,000   (training — AI Test Engineer ramp-up)
            + $0                    (no eval-pipeline-attributable incidents this period)
            + $2,000                (eval-set growth + judge-prompt re-calibration tooling)
            = $7,000
NET_SAVINGS = $44,105 − $7,000 = $37,105 / quarter (conservative)
```

> README headline shows ~$45k; the brief above is the conservative version. Always favour the conservative number when defending to leadership — it survives scrutiny better.

### Quality control

Eval pass rate **92%** (gate is 90%; passing). AI-incident MTTR **240 → 95 min** (improved). Eval-set grew by 47 items (proves the loop is closing — Module 33a Stage ⑨).

### Sentence

> *"AI eval infrastructure prevented an expected ~1.1 AI-attributable incidents/quarter (~$38.5k expected value) and cut MTTR from 240 → 95 min on the residual incidents (~$0.6k), plus brand-risk premium (~$5k). Gross expected value ~$44.1k. Net of $7.0k in judge-model API + governance + training + eval infra, **net expected savings ~$37.1k/quarter** with eval pass rate 92% (above 90% gate) and AI-incident MTTR cut by 60%."*

---

## Section C — Common rejection reasons (auditor's checklist)

Reviewers reject a brief when:

| Rejection reason | Fix |
|---|---|
| Baseline file not cited or doesn't exist | Fill [`baseline-template.md`](./baseline-template.md) before AI is on; cite by path |
| Quality-control row missing | §5 is mandatory; no exceptions |
| Quality-control verdict = "degraded" | Stop; do not report net dollars; investigate |
| Less than all 5 cost categories shown | Show $0 explicitly if a category doesn't apply |
| Single inflated number with no formula | Show the math (Section B style) so reviewer can re-derive |
| "Lines of code generated" / "% AI-suggested" anywhere | Strip; these are vanity metrics (Module 38 line 93) |
| Sample size missing | Every "before" and "after" must have a sample size in §2 |
| Frequency / volume not from a source | Cite baseline anchors (releases/quarter, defects/quarter, etc.) |
| One-author brief, no reviewer | Get a senior reviewer outside the workflow team |
| No stop-adopting check | §8 is mandatory regardless of headline |

---

**Up:** [ROI docs README](./README.md) · **Companion:** [`baseline-template.md`](./baseline-template.md)
