# Requirement Scorecard Template

Two artefacts per analysis:

1. **Markdown** — `reports/requirement-scorecards/<REQ-ID>-<YYYY-MM-DD>.md` (template below).
2. **JSON row** — appended to `reports/requirement-scorecards/index.json` (schema below).

---

## Markdown template

```markdown
# Requirement Scorecard — <REQ-ID> — <one-line title>

| Field | Value |
|---|---|
| Requirement ID | <REQ-ID> |
| Title | <one-line> |
| Source | <Jira ticket URL / file path / paste-of-PRD §> |
| Author | <PO / dev / QA name> |
| Analysed by | <agent + reviewer name(s)> |
| Analysed on | <YYYY-MM-DD> |
| Verdict | **READY-FOR-DESIGN** / **NEEDS-REFINEMENT** / **REJECT** |

---

## 0. Verbatim requirement

> <quote the requirement exactly — never paraphrase>

---

## 1. INVEST / SMART score

| Criterion | Score | Justification |
|---|---|---|
| INVEST · Independent | pass / weak / fail | <one line> |
| INVEST · Negotiable | pass / weak / fail | … |
| INVEST · Valuable | pass / weak / fail | … |
| INVEST · Estimable | pass / weak / fail | … |
| INVEST · Small | pass / weak / fail | … |
| INVEST · **Testable** (HARD GATE) | pass / weak / fail | … |
| SMART · Specific | pass / weak / fail | … |
| SMART · Measurable | pass / weak / fail | … |
| SMART · Achievable | pass / weak / fail | … |
| SMART · Relevant | pass / weak / fail | … |
| SMART · Time-bound | pass / weak / fail / n/a | … |

**Aggregate** — pass: X / 11 · weak: Y / 11 · fail: Z / 11

---

## 2. Ambiguity findings

| # | Smell-class | Location | Evidence (verbatim) | Suggested re-wording |
|---|---|---|---|---|
| 1 | vague-adjective | §intro | "must be fast" | "p95 latency < 300 ms on 4G" |
| 2 | modal-weakness | §AC-1 | "should validate" | "must validate" |
| … | … | … | … | … |

Critical-position smells (actor / trigger / outcome): **N**
Total smells: **M**

---

## 3. Completeness check

| Element | Covered? |
|---|---|
| Actor identified | ✅ / ❌ |
| Trigger / entry condition | ✅ / ❌ |
| Pre-conditions | ✅ / ❌ |
| Happy path | ✅ / ❌ |
| Alternate paths | ✅ / ❌ |
| Error paths | ✅ / ❌ |
| Boundaries (empty / max / unicode) | ✅ / ❌ |
| Concurrency / race conditions | ✅ / ❌ / n/a |
| Performance constraint | ✅ / ❌ / n/a |
| Security constraint | ✅ / ❌ / n/a |
| Accessibility (WCAG level) | ✅ / ❌ / n/a |
| Internationalisation | ✅ / ❌ / n/a |
| Observability hooks | ✅ / ❌ / n/a |
| Rollback / feature-flag | ✅ / ❌ / n/a |
| Data migration / backfill | ✅ / ❌ / n/a |
| Telemetry events | ✅ / ❌ / n/a |
| Acceptance criteria explicit | ✅ / ❌ |

Missing items: **K**

---

## 4. Hidden assumptions

| # | Assumption | Risk if wrong | Recommended clarification |
|---|---|---|---|
| 1 | Single currency (USD) | High — i18n rework if the markets we expand to use other currencies | "Confirm the supported currency list for v1" |
| 2 | All customers logged in | Medium — guest checkout would need rework | "Is guest checkout in scope?" |
| … | … | … | … |

---

## 5. Drafted acceptance criteria

(See [`ac-template.md`](ac-template.md) for the format.)

```gherkin
AC-1: <title>
  GIVEN …
  WHEN …
  THEN …

AC-2: …
```

---

## 6. Verdict and refinement checklist

**Verdict:** READY-FOR-DESIGN / NEEDS-REFINEMENT / REJECT

If `NEEDS-REFINEMENT` or `REJECT`, send the following back to the PO:

```
□ Replace "fast" in §intro with explicit p95 latency budget.
□ Decide: in-scope or out-of-scope — guest checkout?
□ Define error handling when promo code service is down.
□ Confirm currency / locale matrix for v1.
□ <…>
```

---

## 7. Hand-off

| Verdict | Routed to |
|---|---|
| READY-FOR-DESIGN | `test-design-techniques` → `generate-manual-testcase` → `bdd-gherkin-author` → `requirements-traceability` |
| NEEDS-REFINEMENT | PO; tracked as a blocker; re-run this skill after refinement |
| REJECT | PO; story does not enter the sprint |

---

> Re-run this analysis: `npm run analyse:requirement -- <path-to-requirement.md>`
```

---

## JSON row schema (`reports/requirement-scorecards/index.json`)

Each analysis appends one row. JSONL recommended (one JSON object per line) so the file grows without re-parsing.

```jsonc
{
  "ts": "2026-05-10T14:35:00Z",
  "req_id": "REQ-PAY-01",
  "title": "Customers can apply a promo code at checkout",
  "source": "documents/requirements/REQ-PAY-01.md",
  "scorecard_path": "reports/requirement-scorecards/REQ-PAY-01-2026-05-10.md",

  "invest": {
    "independent": "pass",
    "negotiable":  "weak",
    "valuable":    "pass",
    "estimable":   "weak",
    "small":       "pass",
    "testable":    "weak"
  },
  "smart": {
    "specific":    "pass",
    "measurable":  "weak",
    "achievable":  "pass",
    "relevant":    "pass",
    "time_bound":  "fail"
  },

  "ambiguity": {
    "total_smells": 6,
    "critical_position_smells": 1,
    "by_class": {
      "vague_adjective": 3,
      "modal_weakness":  2,
      "missing_units":   1
    }
  },

  "completeness": {
    "covered": 9,
    "missing": 4,
    "missing_items": ["error_paths", "performance", "accessibility", "telemetry"]
  },

  "assumptions": {
    "count":     5,
    "high_risk": 2
  },

  "ac_count": 0,
  "ready_to_draft_acs": false,

  "verdict": "NEEDS-REFINEMENT",
  "blockers": [
    "Performance budget not stated",
    "Error path when promo service is down not defined",
    "Currency / locale matrix unclear"
  ]
}
```

---

## Dashboard contract

The QA Metrics Dashboard reads `reports/requirement-scorecards/index.json` to surface:

- Count by verdict per sprint (READY / NEEDS-REFINEMENT / REJECT).
- Trend of `total_smells` and `missing_items` per requirement over time.
- Top "missing items" — what's chronically forgotten by the team (often `accessibility` and `observability`).
- Mean time from `NEEDS-REFINEMENT` → re-analysis with `READY-FOR-DESIGN` (the refinement-loop latency).

Keep the schema additive — new fields can be added, but never rename existing keys without a migration.
