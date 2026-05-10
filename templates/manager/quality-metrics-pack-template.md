# <Team Name> — Quality Metrics Pack — v<version>

> Companion to your team's `quality-org-charter.md` (the bar) and `qa-quarterly-plan.md` (the OKRs/SLO).
>
> Three scopes — **Team**, **Project / release**, **Charter** — each row: metric · target · source · cadence · owner · escalation trigger.
>
> Living document. Refresh targets at the annual charter review; refresh rows in-line with a decision-log entry.

> Coaching note (delete before commit): *most QA orgs measure only the project scope and burn out the team or let the charter go stale. Filling all three is the lab.*

---

## Why three scopes?

| Scope | Question it answers | Who looks at it |
|---|---|---|
| **Team** | Are the people who produce quality healthy enough to keep producing it? | Manager + skip-level + HR partner |
| **Project** | Is what we're shipping actually high quality? | Whole team + PM + Eng Director |
| **Charter** | Is our operating doc a living contract or a wall ornament? | Manager + Peer Director + VP |

> Coaching note: keep this section verbatim — the *why* is the value of the doc; if you remove it, the next reader thinks the metrics are arbitrary.

---

## Scope 1 — Team metrics (people health)

> Source of truth: 1:1 docs, retro safety scores, HRIS, on-call rota, growth-plan tracker.
> Cadence: monthly self-retro; quarterly skip-level rollup.

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| T1 | Retro safety score (1–5) | <target | example: mean ≥ 4.2 over 6 retros> | <retro doc archive> | <bi-weekly> | <Manager> | <e.g. two retros < 4.0 → 1:1 + skip-level> |
| T2 | 1:1 attendance rate | <e.g. ≥ 95 % per IC / quarter> | <1:1 doc headers> | <weekly> | <Manager> | <IC < 80 % → re-commit or name conflict> |
| T3 | Regrettable attrition (rolling 12 mo) | <e.g. ≤ 1 IC / yr per team-of-N> | <HRIS> | <quarterly> | <Manager + HR> | <Any regrettable exit → blameless skip-level retro> |
| T4 | On-call pages per shift (P50 / P95) | <e.g. P50 ≤ 2, P95 ≤ 6 / week> | <PagerDuty export> | <weekly> | <On-call lead> | <P95 > N for 2 weeks → reduce alerts or grow rotation> |
| T5 | After-hours page rate | <e.g. ≤ 5 % of pages> | <PagerDuty export> | <weekly> | <On-call lead> | <> N % for 2 weeks → root-cause noisy alerts> |
| T6 | Comp-time taken vs accrued | <e.g. ≥ 80 % of accrued taken within 30 days> | <manager spreadsheet> | <monthly> | <Manager> | <Manager schedules the time off, doesn't ask> |
| T7 | Active growth-plan coverage | <e.g. 100 % of L3–L5 ICs refreshed within 6 mo> | <growth-plan folder> | <monthly> | <Manager> | <Stale > 7 mo → blocked from new project> |
| T8 | Promotion-rate balance | <e.g. within ±1 of company avg per level> | <HRIS> | <annually> | <Manager + HR> | <Calibration audit with Peer Director> |
| T9 | Hiring funnel — on-site→offer→accept | <e.g. on-site→offer ≥ 30 %, offer→accept ≥ 70 %> | <ATS> | <per role> | <Manager> | <Below for 2 roles → revisit JD + rubric> |
| T10 | Skip-level themes — surfaced & closed | <e.g. ≥ 80 % closed in 2 cycles> | <skip-level notes> | <every 6 weeks> | <Manager> | <Theme in 3 consecutive skip-levels → escalate> |

> Coaching note: drop rows that don't fit your team (e.g. no on-call); add rows that do (e.g. mentorship-pair coverage); never drop *all* of T1–T3 — those are the floor.

---

## Scope 2 — Project / release metrics (what we ship)

> Source of truth: `templates/qa-metrics-dashboard.html` panels + your CI report archive.
> Cadence: standup headlines daily; full panel walkthrough weekly.

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| P1 | `@P1` pass rate on `main` | <e.g. 100 %> | <Dashboard Panel #2> | <per CI run> | <Tech lead / IC> | <Stop-the-line; gate blocks until green or risk-accepted by named human> |
| P2 | `@P2` pass rate | <e.g. ≥ 95 % rolling 7 days> | <Dashboard Panel #2> | <daily> | <Tech lead> | << 95 % for 2 days → spike day before new feature work> |
| P3 | Open `severity:critical` defects at release | <0> | <Dashboard Panel #3> | <per release> | <QA Director> | <≥ 1 → release NO-GO regardless of business pressure> |
| P4 | Defect-escape rate | <e.g. ≤ 1.4 / release; baseline N> | <Dashboard Panel #3 + prod telemetry> | <per release> | <Suite owner> | <> baseline → root-cause + traceability gap fix> |
| P5 | Mean time to triage CI red | <e.g. ≤ 24 h> | <run-summary.json + GH issue created-at> | <weekly> | <On-call IC> | <> 48 h for 2 runs → on-call gap; revisit alerts> |
| P6 | Flake rate (rolling 14 days) | <e.g. ≤ 1 % of test runs> | <Dashboard Panel #2 sub-stat> | <weekly> | <Suite owner> | <> 2 % for 2 weeks → freeze new tests; route via flaky-test-triage> |
| P7 | Requirements traceability coverage | <e.g. ≥ 90 % REQ-* mapped to ≥1 manual + ≥1 spec> | <Dashboard Panel #4> | <per sprint> | <Tech lead> | << 85 % → traceability spike before next release> |
| P8 | CI duration — median & P95 | <e.g. median ≤ 12 min, P95 ≤ 18 min> | <GH Actions run logs> | <weekly> | <Tech lead> | <P95 > N → run ci-optimizer + parallel-sharding> |
| P9 | Visual / a11y / perf gate pass | <e.g. 100 % gated, ≥ 98 % pass> | <per-suite reports> | <per PR> | <Visual / perf owner> | <Bypass without justification → block merge> |
| P10 | AI-eval scoreboard (per Module 33b) | <e.g. 100 % gated, no metric regresses > 5 %> | <Dashboard Panel #6 (planned)> | <per PR> | <AI-test owner> | <Regress > 10 % → block + defect-report> |
| P11 | Dashboard freshness | <last run ≤ 24 h> | <Dashboard Panel #0> | <continuous> | <Tech lead> | <Stale > 48 h → CI is broken, not just the metric> |

> Coaching note: P10 only applies if you ship AI features; delete the row if not. Never delete P1, P3, P5 — those are the irreducible floor.

---

## Scope 3 — Charter metrics (does the operating doc drive behaviour?)

> Source of truth: charter doc, retro notes, decision log, action-item tracker.
> Cadence: quarterly cross-Director audit; annual deep audit at charter review.
>
> **Without these, the charter is a wall ornament.**

| # | Metric | Target | Source | Cadence | Owner | Escalation trigger |
|---|---|---|---|---|---|---|
| C1 | Quality-bar adherence (releases clearing all charter §6 floors without risk-acceptance) | <e.g. ≥ 90 % of releases> | <release-brief archive + Dashboard panels> | <per release> | <QA Director> | << 80 % over a quarter → renegotiate the bar OR triage; never silently lower> |
| C2 | Risk-acceptance discipline (below-bar releases that have a named human acceptance) | <100 %> | <release-brief archive> | <per release> | <QA Director> | <Any below-bar release without named acceptor → post-mortem, no exceptions> |
| C3 | Decision-rights compliance (decisions made by the §5 named owner) | <e.g. ≥ 95 %> | <decision log + RACI audit> | <quarterly> | <Peer Director audits> | <Wrong owner repeatedly → §5 row needs rewriting> |
| C4 | Anti-principle violations (charter §3) logged in retros | <0 unaddressed; closed within 2 sprints> | <retro notes> | <bi-weekly> | <Manager> | <> 1 unaddressed for 2 retros → escalate + revisit the anti-principle> |
| C5 | Stop-the-line invocations | <every invocation logged: cause + duration + resolution> | <release log> | <per invocation> | <On-call IC> | <> SLO error budget for the quarter → mini-post-mortem + revisit bar> |
| C6 | Post-mortem SLA adherence (charter §7) | <e.g. ≥ 95 % closed within 5 business days> | <post-mortem archive> | <per incident> | <Manager> | <Slip → manager owns the unblock; never the IC's fault> |
| C7 | Threaded-doc conversion (charter §9) | <e.g. ≥ 80 % of high-traffic threads converted within 24 h> | <Slack archive sample (10 threads/quarter)> | <quarterly> | <Manager (sampling)> | << 60 % → norm has decayed; surface in retro> |
| C8 | Executive-brief format compliance (BLUF + verdict + 3 + risks) | <100 %> | <brief archive> | <per brief> | <Manager> | <Any brief without verdict → rewritten before send> |
| C9 | Office-hours utilisation | <e.g. ≥ 60 % of slots used; ≥ 4 distinct ICs / quarter> | <calendar export> | <quarterly> | <Manager> | << 40 % → fix or kill the slot> |
| C10 | Skip-level cadence adherence | <e.g. ≥ 90 % of scheduled held> | <skip-level notes archive> | <quarterly> | <Manager> | << 80 % → re-commit publicly or kill the practice> |
| C11 | Charter currency | <Last review ≤ 12 mo; ≥ 80 % action items closed> | <charter "Next review" + action log> | <annually> | <QA Director + Peer Director> | <Stale > 13 mo → charter invalid; no decisions cite it until refreshed> |

> Coaching note: C-scope is the one most filled-templates skip and most reviewers reward. The metrics here are *boring on purpose* — they make the manager auditable.

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
```

> **Operating principle:** when two scopes disagree, **trust Team**. Green Project + red Team is a leading indicator of future-red Project. The reverse is not true.

---

## What this pack does NOT measure (and why)

> Naming what's missing is a metric, too. Fill at least 3 rows.

- <e.g. Individual IC velocity / story points — gameable, doesn't reflect quality, harms safety>
- <e.g. Lines of test code — easily gamed; P-scope owns this implicitly via P7 / P9 / P10>
- <e.g. Bug count per IC — punishing the messenger turns a green dashboard into a lying dashboard>
- <e.g. Customer NPS — owned by PM; we ingest as *input* to risk-analysis, do not own>

---

## Sign-off

| Role | Name | Date |
|---|---|---|
| Author (QA Director) | <name> | |
| Reviewer (Peer Director) | <name> | |
| Reviewer (VP Eng) | <name> | |
| Reviewer (HR partner — Team scope only) | <name> | |

— Version: <1.0> · Next review: <YYYY-MM-DD> (align with the charter)

---

> See the worked example for calibration: [`training/sandbox/example/manager/quality-metrics-pack.md`](../../training/sandbox/example/manager/quality-metrics-pack.md)
