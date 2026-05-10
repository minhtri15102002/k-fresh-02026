# Phoenix QA — Quality Metrics Pack — v1.0

> Companion to [`quality-org-charter.md`](./quality-org-charter.md) §6 (the Quality Bar) and [`qa-quarterly-plan.md`](./qa-quarterly-plan.md) (the SLO + KRs).
>
> Three scopes — **Team**, **Project / release**, **Charter** — each with the metric, target, source, cadence, owner, and the trigger that escalates it.
>
> Living document. Reviewed monthly with the team; the targets themselves are reviewed at the **annual charter review** (next: 2027-05-10).

---

## Why three scopes?

Most QA orgs measure only the **project / release** scope (pass rate, defect counts) and then wonder why the team burns out, the charter goes stale, or both. Phoenix uses three:

| Scope | Question it answers | Who looks at it |
|---|---|---|
| **Team** | Are the people who produce the quality healthy enough to keep producing it? | Manager + skip-level + HR partner (Emma Foster) |
| **Project** | Is what we're shipping actually high quality? | Whole team + PM (Carol Webster) + Eng Director |
| **Charter** | Is our operating doc a living contract or a wall ornament? | Manager + Peer Director (Alice Chen) + VP (Bob Singh) |

A **green project scope with a red team scope is a six-month timer**. A **green charter scope with a red project scope means the charter is pretending**.

---

## Scope 1 — Team metrics (people health)

> Source of truth: 1:1 docs, retro safety scores, HRIS, on-call rota, growth-plan tracker.
> Reviewed: monthly in the manager self-retro; quarterly in the skip-level rollup.

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| T1 | Retro safety score (1–5, asked at end of every retro) | mean ≥ 4.2 over rolling 6 retros | retro doc archive | bi-weekly | Manager | Two consecutive retros < 4.0 → 1:1 with each IC + skip-level |
| T2 | 1:1 attendance rate (held vs scheduled) | ≥ 95 % per IC over rolling quarter | [`1on1-doc.md`](./1on1-doc.md) headers | weekly | Manager | Any IC < 80 % → manager re-commits or names the conflict |
| T3 | Regrettable attrition (rolling 12-month) | ≤ 1 IC / year (team of 6) | HRIS exit reports | quarterly | Manager + HR | Any regrettable exit → blameless skip-level retro |
| T4 | On-call sustainability — pages per shift (P50 / P95) | P50 ≤ 2, P95 ≤ 6 per week | PagerDuty export | weekly | Sam Kim (on-call lead) | P95 > 8 for 2 weeks → reduce alert scope or grow rotation |
| T5 | After-hours page rate (22:00–07:00 local) | ≤ 5 % of pages | PagerDuty export | weekly | Sam Kim | > 10 % for 2 weeks → root-cause noisy alerts before any new feature |
| T6 | Comp-time taken vs accrued (after-hours pages × 1.5x) | ≥ 80 % of accrued comp time taken within 30 days | manager spreadsheet | monthly | Manager | < 60 % → manager schedules the time off, doesn't ask |
| T7 | Active growth plan coverage | 100 % of L3–L5 ICs have a growth plan refreshed within 6 months | [`growth-plan.md`](./growth-plan.md) folder | monthly | Manager | Any IC > 7 months stale → blocked from any new project until refreshed |
| T8 | Promotion-rate balance (last 24 months) | within ±1 promotion of company average per level | HRIS | annually | Manager + HR | > 1 below for 2 cycles → calibration audit with Peer Director |
| T9 | Hiring funnel — applicant → on-site → offer → accept | on-site→offer ≥ 30 %, offer→accept ≥ 70 % | ATS (Greenhouse) | per role | Manager | Below threshold for 2 consecutive roles → revisit JD + rubric per [`jd-qa-engineer.md`](./jd-qa-engineer.md) and [`interview-rubric.md`](./interview-rubric.md) |
| T10 | Skip-level themes — distinct concerns surfaced & closed | ≥ 80 % of themes get a named action within 2 skip-level cycles | skip-level notes | every 6 weeks | Manager | Theme appears in 3 consecutive skip-levels → escalate to peer Director |

**Phoenix Q2 2026 read:** T1=4.4 (green), T4 P95=5 (green), T5=3 % (green), T7=100 % (green), T9 on the open L5 role tracking offer→accept @ 75 %. **One yellow:** T6 at 67 % (Tom carried 4 hrs unused into a busy sprint) — manager scheduled it for week 2 of Q3.

---

## Scope 2 — Project / release metrics (what we ship)

> Source of truth: [`templates/qa-metrics-dashboard.html`](../../../../templates/qa-metrics-dashboard.html) panels 0–4, plus the AI-eval scoreboard (Panel #6, in flight per quarterly plan O1).
> Reviewed: every standup at the headline level; full panel walkthrough every Friday.

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| P1 | `@P1` cart + checkout pass rate | 100 % on every `main` commit | Dashboard Panel **2 · Test Execution** | per CI run | Sam Kim | < 100 % → stop-the-line; release gate blocked until green or risk-accepted by named human (charter §6) |
| P2 | `@P2` pass rate | ≥ 95 % rolling 7 days | Dashboard Panel **2** | daily | Tech lead | < 95 % for 2 days → spike day before any new feature work |
| P3 | Open `severity:critical` defects at release time | 0 | Dashboard Panel **3 · Defects** | per release | QA Director | ≥ 1 → release goes NO-GO regardless of business pressure |
| P4 | Defect-escape rate (defects found in prod within 14 days of release ÷ defects total for that release) | ≤ 1.4 / release (Q3 OKR target; Q2 baseline 2.0) | Dashboard Panel **3** + prod telemetry | per release | Sam Kim | > 2.0 in any release → root-cause + add to traceability gaps in next planning |
| P5 | Mean time to triage CI red (commit-fails → defect-report filed or fix-merged) | ≤ 24 h | reports/run-summary.json + GH issues created-at | weekly | On-call IC | > 48 h for 2 consecutive runs → on-call rotation gap; revisit alert wiring |
| P6 | Flake rate (tests that failed then passed on retry, rolling 14 days) | ≤ 1 % of test runs | Dashboard Panel **2** sub-stat (planned: Panel #5) | weekly | Sam Kim | > 2 % for 2 weeks → freeze new tests; route via [`flaky-test-triage`](../../../../.agents/skills/flaky-test-triage/SKILL.md) |
| P7 | Requirements traceability coverage | ≥ 90 % of REQ-* mapped to ≥ 1 manual test case + ≥ 1 spec file | Dashboard Panel **4 · Requirements Traceability** | per sprint | Tech lead | < 85 % → traceability spike before next release |
| P8 | CI duration — median & P95 wall-clock for full suite | median ≤ 12 min, P95 ≤ 18 min | GH Actions run logs | weekly | Tom Liu | P95 > 25 min → run [`ci-optimizer`](../../../../.agents/skills/ci-optimizer/SKILL.md) + [`parallel-sharding`](../../../../.agents/skills/parallel-sharding/SKILL.md) |
| P9 | Visual / a11y / perf gate pass on every PR that touches UI | 100 % of PRs gated; ≥ 98 % pass | per-suite reports | per PR | Priya Shah (visual) / Tom Liu (perf) | Bypass without justification → block merge |
| P10 | AI-eval scoreboard (9-metric, per Module 33b rubric) on every PR touching `prompts/` | 100 % gated, no metric regresses > 5 % vs main baseline | Dashboard Panel **6** (in flight, Q3 O1) | per PR | Tom Liu | Any metric regresses > 10 % → block merge + filed via [`defect-report`](../../../../.agents/skills/defect-report/SKILL.md) |
| P11 | Dashboard freshness | last run ≤ 24 h ago | Dashboard Panel **0 · Run Context** | continuous | Tech lead | Stale > 48 h → CI is broken, not just the metric — fix CI |

**Phoenix latest run (2026-05-09):** P1=100 % (green), P2=96.2 % (green), P3=0 (green), P5=18 h (green), P6=0.7 % (green), P7=87 % (yellow — under 90 % target; the cart-discount-expiry incident exposed time-boundary REQs not in the matrix; addressed by Q3 O2-KR2), P8 median=10 min / P95=16 min (green), P10 not yet live (Q3 deliverable).

---

## Scope 3 — Charter metrics (does the operating doc drive behaviour?)

> Source of truth: charter doc itself, retro notes, decision log, action-item tracker.
> Reviewed: quarterly at the cross-track Director sync; deeply audited at the annual charter review (charter §"Next review").
>
> **Without these, the charter is a wall ornament.** A QA org that re-litigates "should we ship?" every Friday at 5pm doesn't have a charter — it has a poster.

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| C1 | **Quality-bar adherence** — releases that cleared all 5 floor metrics in [`quality-org-charter.md`](./quality-org-charter.md) §6 without a documented risk-acceptance | ≥ 90 % of releases | release brief archive + Dashboard panels 2/3/4 | per release | QA Director | < 80 % over a quarter → renegotiate the bar (it's wrong) **or** triage the violations (we're sloppy); never silently lower it |
| C2 | **Risk-acceptance discipline** — releases that ship below the bar **with** a named human acceptance recorded in the [`release-brief-exec.md`](./release-brief-exec.md) | 100 % of bar-violation releases have the named acceptance | release brief archive | per release | QA Director | Any release shipped below bar without a named acceptor → post-mortem, no exceptions |
| C3 | **Decision-rights compliance** — decisions made by the named owner per charter §5 | ≥ 95 % of in-scope decisions | decision log + RACI audit | quarterly | Peer Director (Alice Chen) audits | Wrong owner repeatedly → §5 row needs rewriting (the role moved) |
| C4 | **Anti-principle violations** (charter §3) logged in retros | 0 unaddressed; any logged violation gets an action item closed within 2 sprints | retro notes | bi-weekly | Manager | > 1 unaddressed for 2 retros → escalate to skip-level + revisit the anti-principle (do we still believe it?) |
| C5 | **Stop-the-line invocations** (P1=100 % bar, charter §6) | every invocation is logged with cause + duration + resolution | release log | per invocation | On-call IC | Stop-line > 4 hrs/quarter (the SLO error budget) → mini-post-mortem and revisit the bar |
| C6 | **Post-mortem SLA adherence** (charter §7: 5 business days, blameless template) | ≥ 95 % of incidents closed-out within 5 days | post-mortem archive | per incident | Manager | Slip → manager owns the unblock; never the IC's fault |
| C7 | **Threaded-doc conversion** (charter §9: any decision needing >6 messages → write the doc) | ≥ 80 % of high-traffic Slack threads converted within 24 h | Slack archive sample (10 threads/quarter) | quarterly | Manager (sampling) | < 60 % → norm has decayed; surface in retro |
| C8 | **Executive-brief format compliance** (charter §9: BLUF + verdict + 3 things + risks) | 100 % of release briefs to Bob Singh follow the format | brief archive vs [`release-brief-exec.md`](./release-brief-exec.md) | per brief | Manager | Any brief without verdict → rewritten before send; not optional |
| C9 | **Office-hours utilisation** (charter §10) | ≥ 60 % of slots used over a quarter; ≥ 4 distinct ICs/quarter attend | calendar export | quarterly | Manager | < 40 % → either too remote, wrong time, or the slot is performative — fix or kill |
| C10 | **Skip-level cadence adherence** (charter §10: every 6 weeks) | ≥ 90 % of scheduled skip-levels held | skip-level notes archive | quarterly | Manager | < 80 % → manager re-commits publicly or kills the practice |
| C11 | **Charter currency** | Last review ≤ 12 months ago; ≥ 80 % of action items from last review closed | charter "Next review" line + action log | annually | QA Director + Peer Director | Stale > 13 months → charter is invalid; no decisions cite it until refreshed |

**Phoenix Q2 2026 read:** C1=92 % (green), C2=100 % (green — every below-bar release had Khanh's name on it), C3 not yet audited (first audit scheduled with Alice for end of Q3 — that's a charter-metric maturity gap, named explicitly), C5=2 invocations / quarter (well under the 4-hr/quarter budget), C6=100 % (4 incidents, all closed within 5 days), C8=100 % (Bob has explicitly thanked the team for the format), C11=11 months since last full review — charter still valid; refresh on schedule (2027-05-10).

---

## How the three scopes interact

```
Team (T1–T10)                   Project (P1–P11)               Charter (C1–C11)
     │                                 │                              │
     │  if Team is red                 │  if Project is red           │  if Charter is red
     │  → Project will be              │  → use Charter §6 to         │  → the bar is wrong
     │    red within 1–2 quarters      │    decide ship/no-ship       │    OR we're sloppy;
     │  (burnout, attrition,           │    (don't re-litigate)       │    never silently
     │   missing on-call cover)        │                              │    lower it
     └─────────────┬───────────────────┴───────────┬──────────────────┘
                   │                               │
        Manager weekly self-retro    QA Director quarterly cross-scope audit
        (drives T1–T10 actions)      (decides which scope is the bottleneck this quarter)
```

**Operating principle:** when two scopes disagree, **trust Team**. A green Project scope with a red Team scope is a leading indicator of a future-red Project. The reverse is not true.

---

## What this pack does NOT measure (and why)

> Naming what's missing is a metric, too.

- **Individual IC velocity / story points.** We do not measure individuals against each other. We measure the team and the system. Individuals are coached via [`growth-plan.md`](./growth-plan.md), not metrics.
- **Lines of test code written.** Easily gamed; not a quality signal. P-scope owns this implicitly via P7 (traceability) and P9/P10 (gates).
- **Bug count per IC.** Filing a bug is *good*. Punishing the messenger is the fastest way to turn a green dashboard into a lying dashboard.
- **Customer NPS.** Owned by PM (Carol Webster); we ingest it as an *input* to risk-analysis but do not own the metric.

---

## Re-emit / refresh

The targets in this pack are deliberately conservative — they encode "the floor", not "the goal". Refresh them at the annual charter review (charter §"Next review"). Between reviews, individual rows can be re-tuned with a 1-line decision-log entry citing the metric # and the change.

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Author (QA Director) | Khanh Do | |
| Reviewer (Peer Director) | Alice Chen | |
| Reviewer (VP Eng) | Bob Singh | |
| Reviewer (HR partner — Team scope only) | Emma Foster | |

— Version: 1.0 · Next review: 2027-05-10 (with the charter)

---

> Filled per [`templates/manager/quality-metrics-pack-template.md`](../../../../templates/manager/quality-metrics-pack-template.md) · Inspired by Track P · Modules [P4](../../../track-p-people-and-management/p04-running-qa-program-at-scale.md) and [P5](../../../track-p-people-and-management/p05-people-first-incident-and-change-leadership.md).
