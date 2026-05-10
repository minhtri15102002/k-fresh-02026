# Module 43 — Compliance-as-Code (EU AI Act / NIST AI RMF / ISO 42001)

> Phase 8 · Effort: 6h · Prerequisites: Module 42

> Contributes **§4 Compliance-as-Code** to your graduation RFC.

> ⚠️ **Disclaimer:** This module teaches how to *translate* regulation into testable assertions. It is **not legal advice**. Always consult qualified counsel before claiming compliance with any regulation.

## Reference card

- **Compliance-as-Code is QA's craft, not legal craft.** We translate clauses into CI gates and audit evidence; lawyers interpret the clauses.
- **Three frameworks matter most in 2026:** EU AI Act (regulation), NIST AI RMF (US guidance), ISO/IEC 42001 (auditable AI management standard).
- **Every gate must trace to a clause** — otherwise it's just another check.
- **Audit trail is git + retained reports.** No new tooling required.
- **Module deliverable:** one real CI gate workflow + a clause→gate traceability matrix → §4 of your RFC.

## Learning objectives

After this module you can:

- Translate a high-risk-AI clause from EU AI Act / NIST RMF / ISO 42001 into a concrete, runnable CI gate.
- Author a **clause→gate→evidence traceability matrix** that survives an external audit walk-through.
- Design **evidence retention** that uses git history + Allure/Playwright artifacts as the audit log.
- Recognise the boundary between QA's craft (gates, evidence, monitoring) and counsel's craft (interpretation, certification).

## Why it matters

> *Companies that succeed with AI won't be the ones with the most tools, but the ones with the strongest governance systems.*
> *— Leadership Insight, 2026 Guide*

By 2026 most enterprise AI features must demonstrate **auditable** quality, not just claim it. "We tested it" is no longer enough — regulators and procurement teams want **evidence**: which test, on which version, with which result, retained for how long. Compliance-as-Code is the only sustainable way to produce that evidence at scale; everything else is a deck someone wrote once.

## Concepts

### The three frameworks (orient yourself in 5 minutes each)

| Framework | What it is | Who it binds | What QA owns |
|---|---|---|---|
| **EU AI Act** | Regulation; risk-tiered (unacceptable / high / limited / minimal) | Anyone serving EU users | Risk classification evidence; high-risk obligations (data quality, logs, transparency, human oversight) |
| **NIST AI RMF 1.0** | Voluntary US framework; "Govern / Map / Measure / Manage" | US federal procurement + de-facto industry baseline | Map (context), Measure (eval evidence), Manage (governance gates) |
| **ISO/IEC 42001** | Auditable AI management system standard | Any org seeking certification | Documented controls, audit-ready evidence, continuous improvement loop |

> Read the *Annex / Article numbering* once so you can cite by clause. Don't try to memorise.

### The clause → gate → evidence pattern

Every Compliance-as-Code gate is a 3-tuple:

```
CLAUSE    "What the regulation requires"
   ↓
GATE      "An automated check that fails when the requirement is violated"
   ↓
EVIDENCE  "An artifact (durable, dated, attributable) proving the check ran"
```

If any of the three is missing, you don't have compliance — you have hope.

### Worked example — EU AI Act Article 10 (Data and Data Governance)

**Clause excerpt (paraphrased):** high-risk AI systems must be developed on the basis of training, validation, and testing data sets that are *relevant, representative, free of errors and complete*. Data sets shall have appropriate statistical properties.

**Gate (CI workflow stub):**

```yaml
# .github/workflows/compliance-art10-data-governance.yml
name: Compliance — EU AI Act Art. 10 (Data Governance)

on:
  pull_request:
    paths:
      - 'eval-sets/**'
      - 'datasets/**'

jobs:
  data-governance-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      - name: Schema stability (clause: relevance + completeness)
        run: npx playwright test --grep "@data.*schema is stable"

      - name: Distribution drift PSI ≤ 0.20 (clause: representativeness)
        run: npx playwright test --grep "@data.*distribution"

      - name: PII absence (clause: data minimisation, GDPR + AI Act)
        run: npx playwright test --grep "@data.*PII"

      - name: Evidence pack
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: compliance-art10-${{ github.sha }}
          path: |
            playwright-report/
            reports/eval-trend.json
            datasets/SCHEMA.md
          retention-days: 400  # > 13 months, common audit window
```

**Evidence:**

- The workflow run itself (timestamped, attributable to commit SHA).
- The Playwright report (per-test pass/fail, durations).
- The retained artifact pack (400 days = >13 months).
- The `datasets/SCHEMA.md` file (versioned in git).

### The clause→gate traceability matrix (the §4 deliverable)

```markdown
# Clause → Gate → Evidence Matrix v1.0

| ID | Framework | Clause                            | Gate (workflow / test) | Evidence | Owner | Last reviewed |
|----|-----------|-----------------------------------|------------------------|----------|-------|---------------|
| C-001 | EU AI Act | Art. 10 (Data Governance)         | compliance-art10-data-governance.yml | retained 400d | <name> | 2026-04-15 |
| C-002 | EU AI Act | Art. 13 (Transparency)            | @explainability specs (Module 42) | Playwright report | <name> | 2026-04-15 |
| C-003 | EU AI Act | Art. 14 (Human Oversight)         | Go/No-Go template (Module 37) | governance/go-no-go-*.md | <name> | 2026-04-15 |
| C-004 | EU AI Act | Art. 15 (Accuracy & Robustness)   | @data + @bias specs    | eval-trend.json | <name> | 2026-04-15 |
| C-005 | NIST RMF  | MEASURE 2.7 (bias evaluation)     | @bias specs            | eval-trend.json | <name> | 2026-04-15 |
| C-006 | NIST RMF  | MANAGE 2.4 (incident response)    | kill-switch design     | runbook + post-incident logs | <name> | 2026-04-15 |
| C-007 | ISO 42001 | A.6.2 (data quality)              | compliance-art10 (reused) | retained 400d | <name> | 2026-04-15 |
| C-008 | ISO 42001 | A.8.4 (continuous improvement)    | quarterly RFC review   | RFC version history (git) | <name> | 2026-04-15 |
```

This matrix IS the §4 of your RFC. Make it appear *exactly* like above so auditors can scan it in 60 seconds.

### Evidence-retention design

| Evidence type | Storage | Retention | Why |
|---|---|---|---|
| Workflow runs | GH Actions artifact | 400 days | covers >13-month audit windows |
| Test reports (Playwright/Allure) | Artifact + S3 mirror | 400 days | per-run forensics |
| Eval trend JSON | git (`reports/eval-trend.json`) | forever | trend forensics |
| Dataset schemas | git (`datasets/*/SCHEMA.md`) | forever | data-governance audit |
| Go/No-Go decisions | git (`documents/governance/`) | forever | decision audit |
| Incident post-mortems | git (`documents/incidents/`) | forever | learning + audit |

**Rule:** if it's in git with a meaningful commit and a date, it's audit-grade.

### What QA owns vs what counsel owns

| QA owns | Counsel owns |
|---|---|
| Translating clauses into testable assertions | Interpreting whether the clause applies |
| Running the gates and producing evidence | Certifying compliance to regulators |
| Evidence retention design | Defending the retention period in a regulatory exchange |
| Audit walk-throughs (technical) | Audit walk-throughs (legal) |
| Identifying gates that don't yet exist | Deciding whether the gap is acceptable risk |

> **Never publish a Compliance-as-Code matrix externally without counsel review.** Internally, it is a living engineering artifact.

### Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Gate without clause** | "We added this check because someone asked" | Every gate row in the matrix cites a clause |
| **Clause without gate** | "We comply with X" but no test enforces it | Add a row with status `Gate: TODO` so it's visible, not invisible |
| **Evidence in screenshots** | Audit pack is a folder of PNGs | Machine-readable artifacts only (JSON, JUnit XML, Allure) |
| **Reviewed once, never again** | "Last reviewed" column is from 2024 | Quarterly review on the calendar, owner accountable |
| **Compliance theater** | All green; nothing actually checked | Spot-audit one row per quarter — re-derive evidence from scratch |
| **Counsel surprised at audit time** | Engineering-only artifact | Quarterly walk-through with counsel; share matrix proactively |

## Hands-on lab

### Org-mandate mode

1. **Pick one clause that binds your org (30 min).** Most teams have at least one obvious one (EU AI Act Art. 10 if you process EU user data; NIST RMF if you sell to US federal; ISO 42001 if you're pursuing certification). Write the clause excerpt + your interpretation in `documents/compliance/<clause-id>.md`.
2. **Author one CI gate (2h).** Use the YAML pattern above. Wire to existing or new tests. Push and watch it run.
3. **Build the matrix v0.1 (1.5h).** Start with 5–8 rows. Use the template above. Add to RFC §4.
4. **Design evidence retention (1h).** Write retention policy; configure GH Actions artifact retention; document where each evidence type lives.
5. **Walk it through with counsel or compliance peer (1h).** Capture pushback, fix the matrix.

### Solo prototype mode

1. **Pick one clause from each framework (45 min).** Three rows total. Save as `training/sandbox/<your-name>/phase-8/compliance/clauses.md`.
2. **Author one CI gate stub (2h).** Add a workflow file under `.github/workflows/compliance-<id>.yml` (don't merge it — keep it on your branch). Wire to the @data or @bias spec stubs from Module 42.
3. **Build the matrix v0.1 (1.5h).** Three rows. Add to RFC §4.
4. **Design evidence retention (1h).** Document where evidence would live in this repo (which folders, which retention). Save in your sandbox.
5. **Self-walk-through (45 min).** Pretend you are an auditor. For each row, ask: "show me the last failure and what you did about it." If you can't, the row needs work.

## Self-check

- [ ] Can you point to one clause and the exact CI workflow that enforces it?
- [ ] Does your evidence-retention plan cover ≥ 13 months for high-risk artifacts?
- [ ] Is every row in the matrix attributable (named owner) and dated (last reviewed)?
- [ ] Do you know what QA owns vs counsel owns, and where the line lives in your org?
- [ ] Have you done a walk-through with someone who didn't write the matrix?

## Further reading

- EU AI Act — read just Articles 9–17 (high-risk obligations)
- NIST AI RMF 1.0 + the Generative AI profile
- ISO/IEC 42001:2023 — Annex A controls (skim the 38 controls)
- *Auditing Machine Learning Algorithms* — Andrew Burt et al.
- This repo: `.github/workflows/playwright.yml`, `prompts/core/defect-labels.md`, `documents/`

---

**Prev:** [42 — Deep-Dive AI Testing](./42-deep-dive-ai-testing.md) · **Next:** [44 — Running an Enterprise AI Transformation](./44-running-an-enterprise-ai-transformation.md) · **Up:** [Phase 8 README](./README.md)
