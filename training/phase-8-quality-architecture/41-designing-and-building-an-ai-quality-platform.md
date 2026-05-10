# Module 41 — Designing & Building an AI Quality Platform

> Phase 8 · Effort: 8h · Prerequisites: Module 40

> Contributes **§2 Reference Architecture** to your graduation RFC.

## Reference card

- **A platform is not a folder of tools.** It's a *self-service contract* — "give me a feature, I give you eval + governance + monitoring in one day."
- **Seven components** form the AI Quality Platform reference architecture; this repo seeds five of them today.
- **Treat your platform like a product**: users (feature teams), interfaces (APIs/CLIs/templates), SLOs, on-call.
- **The contract is the RFC's most-cited page** — write it as carefully as a public API.
- **Module deliverable:** Container-level diagram + 1-page self-service contract → §2 of your RFC.

## Learning objectives

After this module you can:

- Name the **7 components** of an AI Quality Platform and which already exist in this repo.
- Author a **1-page self-service contract** that a feature team can act on without meeting you.
- Design **platform SLOs** (availability, time-to-onboard, false-positive rate of gates).
- Decide what to **build vs buy vs glue** for each component.

## Why it matters

> *Companies no longer want testers who only execute scripts. They want engineers who understand business impact, platform reliability, and intelligent systems.*
> *— Enterprise Reality, 2026 Guide*

Without a platform, every feature team re-invents eval, governance, monitoring, dashboards, and CI gates — at 30% quality and 3× cost. With a platform, the marginal cost of adding an AI feature drops by an order of magnitude *and* trust goes up because every feature is held to the same standard. Platform engineering is how QA scales beyond the team it sits in.

## Concepts

### The 7-component reference architecture

```
                       ┌─────────────────────────────────────────┐
                       │   ① Standards & Prompt Library          │
                       │      (the "what good looks like")        │
                       │   prompts/  +  .agents/skills/           │
                       └────────────────┬────────────────────────┘
                                        │ informs
       ┌────────────────────────────────┼──────────────────────────────────────┐
       │                                │                                      │
       ▼                                ▼                                      ▼
┌──────────────┐              ┌──────────────────┐              ┌──────────────────────┐
│ ② Test &     │  produces    │ ③ Eval Runner &   │  produces    │ ④ CI/CD Gates &      │
│   Spec       │ ───────────► │   Scoreboard      │ ───────────► │   Compliance-as-Code │
│   Scaffolds  │              │ reports/eval-*    │              │ .github/workflows/    │
└──────────────┘              └────────┬──────────┘              └──────────┬───────────┘
                                       │                                    │
                                       ▼                                    ▼
                              ┌──────────────────┐              ┌──────────────────────┐
                              │ ⑤ Quality        │  consumes    │ ⑥ Governance &       │
                              │   Cockpit /      │ ◄─────────── │   Audit Trail        │
                              │   Dashboard      │              │ Go/No-Go, kill-switch│
                              │ templates/qa-    │              │ documents/governance/ │
                              │ metrics-dash...  │              │                      │
                              └──────────────────┘              └──────────────────────┘
                                       ▲
                                       │
                              ┌────────┴─────────┐
                              │ ⑦ Observability  │
                              │   & Drift        │
                              │   Telemetry      │
                              │ (OTel + sampled  │
                              │  prod review)    │
                              └──────────────────┘
```

### Component-by-component map (build vs buy vs glue)

| # | Component | Purpose | This repo today | Build / Buy / Glue |
|---|---|---|---|---|
| ① | **Standards & Prompt Library** | Encode "what good looks like" once | `prompts/`, `.agents/skills/` | Build (already done) |
| ② | **Test & Spec Scaffolds** | One command → conformant new spec | `prompts/core/pom-generator.md`, `prompts/core/test-generator.md` + Skills | Build (Skill-driven) |
| ③ | **Eval Runner & Scoreboard** | Run eval suites; produce trend data | partial: `reports/` pattern | Glue (Playwright + custom reporter + JSON trend file) |
| ④ | **CI/CD Gates & Compliance-as-Code** | Block bad merges; produce audit evidence | `.github/workflows/playwright.yml` | Glue (extend GH Actions; Module 43) |
| ⑤ | **Quality Cockpit / Dashboard** | One pane of glass for leadership | `templates/qa-metrics-dashboard.html` | Build (extend with Phase 8 panels) |
| ⑥ | **Governance & Audit Trail** | Go/No-Go, kill-switch, evidence retention | partial: `prompts/advanced/release-readiness.md` | Glue (Module 37 framework + git as the audit log) |
| ⑦ | **Observability & Drift Telemetry** | See production AI behavior | not yet | Buy or Glue (OpenTelemetry, sampled review pipeline) |

### The self-service contract (the most-cited page in your RFC)

A feature team should be able to read **one page** and ship.

```markdown
# Quality Platform — Self-Service Contract v1.0

## What you get
- Conformant POM scaffold       (Skill: pom-architect)
- Tagged spec scaffold          (Skill: generate-testcase)
- Eval-suite scaffold           (Skill: <eval-author>)
- CI gates on PR (perf, eval, compliance)
- Dashboard panel (auto-discovered by tag)
- Governance template (Go/No-Go)

## What you commit to
- ≥ 1 @P1 @critical @smoke spec per feature
- Eval pass-rate ≥ 90% (gate)
- Bias delta ≤ ±2pp across declared slices
- p95 latency budget declared in feature/<name>/budget.yml
- Named owner in feature/<name>/OWNERS

## How to onboard (15 minutes)
1. `npx <repo>/scripts/scaffold-feature <name>`
2. Edit feature/<name>/budget.yml + OWNERS
3. Open PR — gates run automatically

## SLOs we hold ourselves to
- Time-to-onboard         ≤ 1 day
- Gate p95 runtime        ≤ 12 min
- False-positive rate     ≤ 5%
- Platform availability   ≥ 99.5% in CI hours

## Escape hatches
- Need an exception? File <repo>/issues with label `platform:exception`
- Need help? #quality-platform on Slack, on-call: <pager>
```

If a feature team can't act on this page alone, the platform isn't ready.

### Platform SLOs (treat your platform like a product)

| SLO | Target | Why it matters |
|---|---|---|
| **Time-to-onboard** | ≤ 1 day | If onboarding takes a week, teams build their own |
| **Gate p95 runtime** | ≤ 12 min on PR | Beyond that, teams disable gates |
| **False-positive rate** | ≤ 5% | Higher = teams stop trusting gates = de facto disabled |
| **Adoption** | +1 team / quarter | Below this and the platform stalls |
| **Eval-suite freshness** | ≤ 30 days since last addition | Stale evals = silent quality drift |
| **Audit retention** | 13 months minimum | Covers most regulatory windows |

### Platform anti-patterns

| Anti-pattern | Looks like | Fix |
|---|---|---|
| **Tools in a folder** | "Here are 12 scripts; figure it out" | Self-service contract + scaffolder |
| **One-size-fits-all gate** | Same eval threshold for chatbot and recommender | Per-feature `budget.yml` |
| **Hidden owner** | Page on the wiki, no name on it | Named owner in OWNERS file |
| **Dashboard nobody opens** | Beautiful but unread | Make it the pre-standup default; cite it in incident reviews |
| **Platform that requires platform team to use** | Every adoption needs a meeting | Reduce friction until pairing is optional |

### Build vs buy decision rubric

For each component, score 1–5 on **strategic differentiation** and **integration burden**.

```
                           Strategic differentiation
                            low                 high
 Integration   high     │  Buy (or skip)    │  Build              │
 burden        low      │  Buy (commodity)  │  Build (your edge)  │
```

For QA Quality Platforms:
- ① Standards & ② Scaffolds → almost always **Build** (your specific conventions)
- ③ Eval Runner → **Glue** (existing test runner + reporter)
- ⑦ Observability → **Buy** (OpenTelemetry + a vendor) — don't build telemetry pipelines

## Hands-on lab

### Org-mandate mode

1. **Inventory current state (1h).** Map your org's existing tools to the 7 components. Score each 0–2 (missing / partial / solid). Save as part of RFC §2 draft.
2. **Pick the 2 weakest components (15 min).** These are your platform's MVP.
3. **Author the self-service contract v0.1 (2h).** One page. Reviewed by ≥2 feature teams. Add to RFC §2.
4. **Draw the Container-level diagram (1.5h).** All 7 components, real arrows, named interfaces.
5. **Define 4 SLOs (1h).** With targets, alert thresholds, and an owner per SLO.
6. **Pick a pilot team and pair on day 1 (2h).** Real adoption beats abstract design.

### Solo prototype mode

1. **Map this repo's components (1h).** Use the table above as the starting point. Document gaps in `training/sandbox/<your-name>/phase-8/platform-inventory.md`.
2. **Pick the weakest component (15 min)** and prototype an extension. Examples that fit:
   - Add an `eval-author` Agent Skill under `.agents/skills/eval-author/`.
   - Extend `templates/qa-metrics-dashboard.html` with the AI Quality panel sketched in Module 36.
   - Add a `scripts/scaffold-feature.ts` that emits a conformant feature directory.
3. **Author the self-service contract (2h).** Use the template above, scoped to this repo. Add to your RFC §2.
4. **Draw the diagram (1.5h).** Mermaid block in the RFC. Label all arrows.
5. **Define 4 SLOs (1h).** Targets that are measurable in this repo (CI runtime, scaffold time, etc.).
6. **Self-pilot (2h).** Use your platform to add ONE new feature spec end-to-end and time it. If it took > 1 day, the contract is wrong.

## Self-check

- [ ] Can you draw the 7-component architecture from memory?
- [ ] Does your self-service contract fit on one printed page?
- [ ] Have you defined SLOs that a non-platform engineer can verify?
- [ ] Did you actually pilot it — yourself or with a real team — and time the onboarding?
- [ ] Can you name what you would *not* build, and why?

## Further reading

- *Team Topologies* — Skelton & Pais (Platform team chapter is gold)
- *Internal Developer Platforms* (internaldeveloperplatform.org)
- Backstage docs (backstage.io) — read just the "Software Templates" section
- *Building Evolutionary Architectures* — Ford, Parsons, Kua
- This repo: `templates/qa-metrics-dashboard.html`, `.agents/skills/skill-validator/SKILL.md`

---

**Prev:** [40 — From Engineer to AI Quality Architect](./40-from-engineer-to-ai-quality-architect.md) · **Next:** [42 — Deep-Dive AI Testing](./42-deep-dive-ai-testing.md) · **Up:** [Phase 8 README](./README.md)
