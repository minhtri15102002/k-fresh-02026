# QA Engineer Training Curriculum

A complete, hands-on training path that turns a new QA engineer into a production-ready Quality Engineer using **this repository** as the live lab.

The curriculum is **practice-driven**: every module ends with an exercise you complete inside this codebase — write a test, refactor a page object, add a CI step, build a dashboard panel.

---

## Who this is for

| Audience | Start at | Skip… |
|---|---|---|
| **New manual QA → automation** | Phase 0 | nothing |
| **Manual QA with some scripting** | Phase 0 review → Phase 1 | only if you've shipped Git+TS code |
| **Dev moving into QA / SDET** | Phase 0 review → Phase 2 | Phase 1 if comfortable with Git + TS |
| **Automation engineer (other tool)** | Phase 0 review → Phase 2 onward | Phase 1 |
| **Senior QA / Lead** | Phase 3 onward | use Phases 0–2 as reference |

---

## Curriculum at a glance

```
Phase 0: Foundations             (5 modules) — QA mindset, test design, manual TCs
   │
Phase 1: Engineering Toolkit     (4 modules) — Git, TypeScript, Web, HTTP
   │
Phase 2: Playwright Core         (6 modules) — Locators, actions, fixtures, trace
   │
Phase 3: Framework Architecture  (5 modules) — 3-layer POM + commonPage + assertions
   │
Phase 4: API & Cross-cutting     (4 modules) — API, security, visual, a11y
   │
Phase 5: Quality at Scale        (5 modules) — CI, sharding, reporting, dashboards
   │
Phase 6: AI-Assisted QA          (6 modules) — Prompts, MCP, AI QA continuous flow,
                                                AI feature testing, capstone
   │
Phase 7: AI-Era QA Leadership    (6 modules) — Strategy, governance, AI testing, ROI
   │
Phase 8: Quality Architecture    (5 modules) — RFC craft, platform, deep AI testing,
                                                Compliance-as-Code, transformation

   ┊  parallel to Phases 7-8, opt-in:
   └─ Track P: People & Management (5 modules) — identity shift, hiring,
                                                 communication, program at scale,
                                                 Quality Org Charter (capstone)
```

Approx. effort:

- **Phases 0–6 (engineering tier):** 90–130 hours of focused learning + lab work (Phase 6 expanded with operational AI-feature testing in Modules 33a/33b).
- **Phases 7–8 (leadership tier — IC fork):** +50–60 hours; assumes a multi-team scope or near-term path to one.
- **Track P (manager fork, opt-in):** +25–30 hours; parallel to Phases 7–8, not a prerequisite for any other phase.

---

## Full topic list

### Phase 0 — Foundations · [`phase-0-foundations/`](./phase-0-foundations/README.md)

| # | Module | What you learn |
|---|---|---|
| 01 | [QA mindset & quality attributes](./phase-0-foundations/01-qa-mindset-and-quality-attributes.md) | Why QA exists; ISO 25010 quality model; how to think like a tester |
| 02 | [SDLC, STLC & where QA fits](./phase-0-foundations/02-sdlc-stlc-and-where-qa-fits.md) | Waterfall vs Agile vs DevOps; shift-left, shift-right |
| 03 | [Test types & levels](./phase-0-foundations/03-test-types-and-levels.md) | Unit / integration / E2E / smoke / regression / exploratory |
| 04 | [Test design techniques](./phase-0-foundations/04-test-design-techniques.md) | Equivalence partitioning, BVA, decision tables, state diagrams, pairwise |
| 05 | [Manual test cases & defect reporting](./phase-0-foundations/05-manual-test-cases-and-defects.md) | Writing TCs, severity vs priority, repro steps, traceability |

### Phase 1 — Engineering Toolkit · [`phase-1-toolkit/`](./phase-1-toolkit/README.md)

| # | Module | What you learn |
|---|---|---|
| 06 | [Git & GitHub for QA](./phase-1-toolkit/06-git-and-github-for-qa.md) | Branching, PRs, conventional commits, hooks |
| 07 | [TypeScript for QA](./phase-1-toolkit/07-typescript-for-qa.md) | Types, interfaces, async/await, decorators |
| 08 | [Web fundamentals (HTML/CSS/DOM)](./phase-1-toolkit/08-web-fundamentals-html-css-dom.md) | DOM tree, accessibility tree, selectors |
| 09 | [HTTP, REST & APIs](./phase-1-toolkit/09-http-rest-and-apis.md) | Methods, status codes, headers, cookies, auth |

### Phase 2 — Playwright Core · [`phase-2-playwright/`](./phase-2-playwright/README.md)

| # | Module | What you learn |
|---|---|---|
| 10 | [Playwright setup & config](./phase-2-playwright/10-playwright-setup-and-config.md) | Install, projects, config, browsers, CI vs local |
| 11 | [Locators](./phase-2-playwright/11-locators.md) | Priority hierarchy: role → label → testid → CSS → XPath |
| 12 | [Actions & auto-waiting](./phase-2-playwright/12-actions-and-auto-waiting.md) | Click, fill, hover, selectOption, why no `waitForTimeout` |
| 13 | [Web-first assertions](./phase-2-playwright/13-web-first-assertions.md) | `toHaveText`, `toBeVisible`, retry windows, `expect.poll` |
| 14 | [Fixtures & test isolation](./phase-2-playwright/14-fixtures-and-test-isolation.md) | Built-in vs custom fixtures, parallelism, hooks |
| 15 | [Debugging & Trace Viewer](./phase-2-playwright/15-debugging-and-trace-viewer.md) | UI mode, codegen, traces, video, screenshots |

### Phase 3 — Framework Architecture (this repo) · [`phase-3-framework/`](./phase-3-framework/README.md)

| # | Module | What you learn |
|---|---|---|
| 16 | [3-layer architecture](./phase-3-framework/16-three-layer-architecture.md) | locators / pages / tests; why we split |
| 17 | [`commonPage` discipline](./phase-3-framework/17-commonpage-discipline.md) | The forbidden direct-locator table; helper-widening |
| 18 | [Assertion routing (`assertHelper` vs `Assertions`)](./phase-3-framework/18-assertion-routing.md) | DOM/Page → assertHelper; in-memory → Assertions |
| 19 | [Models & test data](./phase-3-framework/19-models-and-test-data.md) | Typed `models/`, deterministic `data/`, factories |
| 20 | [Test tagging & multi-environment](./phase-3-framework/20-tagging-and-multi-environment.md) | `@P1/@critical/@smoke`; `.env.qa/uat/staging` |

### Phase 4 — API & Cross-cutting · [`phase-4-api-and-quality/`](./phase-4-api-and-quality/README.md)

| # | Module | What you learn |
|---|---|---|
| 21 | [API testing with Playwright](./phase-4-api-and-quality/21-api-testing-with-playwright.md) | `request` fixture, schema validation, auth |
| 22 | [Hybrid UI + API tests](./phase-4-api-and-quality/22-hybrid-ui-api-tests.md) | API setup → UI assertion patterns |
| 23 | [API security testing](./phase-4-api-and-quality/23-api-security-testing.md) | Auth, CSRF, IDOR, brute-force, cookie flags |
| 24 | [Visual & accessibility testing](./phase-4-api-and-quality/24-visual-and-accessibility-testing.md) | Screenshot diff, axe-core, WCAG basics |

### Phase 5 — Quality at Scale · [`phase-5-scale/`](./phase-5-scale/README.md)

| # | Module | What you learn |
|---|---|---|
| 25 | [CI/CD with GitHub Actions](./phase-5-scale/25-ci-cd-github-actions.md) | Workflows, jobs, matrix, secrets, caching |
| 26 | [Parallel sharding & matrix runs](./phase-5-scale/26-parallel-sharding-and-matrix.md) | Cutting wall-clock with shards + projects |
| 27 | [Reporting (Allure 3, custom)](./phase-5-scale/27-reporting-and-allure.md) | `allurerc.mjs`, custom reporter, history |
| 28 | [QA Metrics dashboard](./phase-5-scale/28-qa-metrics-dashboard.md) | The dashboard we built; live data + dark mode |
| 29 | [Flaky test triage](./phase-5-scale/29-flaky-test-triage.md) | Detecting, quarantining, root-causing flakes |

### Phase 6 — AI-Assisted QA & Capstone · [`phase-6-ai-assisted-qa/`](./phase-6-ai-assisted-qa/README.md)

| # | Module | What you learn |
|---|---|---|
| 30 | [Prompt engineering for QA](./phase-6-ai-assisted-qa/30-prompt-engineering-for-qa.md) | Effective prompts; the prompts/ library tour |
| 31 | [Using the prompt library](./phase-6-ai-assisted-qa/31-using-the-prompt-library.md) | POM, test, manual TC, defect-label generators |
| 32 | [MCP & browser agents](./phase-6-ai-assisted-qa/32-mcp-and-browser-agents.md) | Playwright MCP-first discipline |
| 33a | [The AI QA Continuous Flow](./phase-6-ai-assisted-qa/33a-the-ai-qa-continuous-flow.md) | 9-stage operational loop; Senior Mindset; AI-First Quality Principles → assertion vocabulary |
| 33b | [Testing AI Features in Practice — Hallucination, Grounding, RAG](./phase-6-ai-assisted-qa/33b-testing-ai-features-in-practice.md) | `@grounding` spec patterns; hallucination detection; 9-metric scoring rubric |
| 33 | [Capstone & career paths](./phase-6-ai-assisted-qa/33-capstone-and-career-paths.md) | Ship a feature end-to-end; SDET vs QE vs Architect |

### Phase 7 — AI-Era QA Leadership & Strategy · [`phase-7-ai-era-leadership/`](./phase-7-ai-era-leadership/README.md)

| # | Module | What you learn |
|---|---|---|
| 34 | [The AI transformation of QA teams & roles](./phase-7-ai-era-leadership/34-ai-transformation-of-qa-teams.md) | What shrinks/grows/is born; QA Manager → AI Quality Leader |
| 35 | [Future-ready skills & continuous upskilling](./phase-7-ai-era-leadership/35-future-ready-skills-and-upskilling.md) | Five pillars (AI, cloud, APIs, DevOps, obs+sec); 12-month roadmap |
| 36 | [Testing modern AI systems](./phase-7-ai-era-leadership/36-testing-modern-ai-systems.md) | Eval sets, fairness, hallucination, drift, prompt injection |
| 37 | [Trust, governance & responsible AI](./phase-7-ai-era-leadership/37-trust-governance-and-responsible-ai.md) | Governance layers, Go/No-Go, kill-switches, overuse risks |
| 38 | [AI adoption strategy & ROI](./phase-7-ai-era-leadership/38-ai-adoption-strategy-and-roi.md) | Adoption ladder; business-impact metrics; ROI in dollars |
| 39 | [The 2026+ engineer & graduation](./phase-7-ai-era-leadership/39-the-2026-engineer.md) | Four traits; ADR-AI; portfolio-grade graduation artifact |

### Phase 8 — AI Quality Architecture & Platform Engineering · [`phase-8-quality-architecture/`](./phase-8-quality-architecture/README.md)

> **Precondition:** multi-team scope (or within ~12 months of one). Use as a forward-looking reference otherwise.

| # | Module | What you learn |
|---|---|---|
| 40 | [From Engineer to AI Quality Architect](./phase-8-quality-architecture/40-from-engineer-to-ai-quality-architect.md) | RFC craft, C4-lite diagrams, standards-craft loop; owns the graduation RFC template |
| 41 | [Designing & Building an AI Quality Platform](./phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) | 7-component reference architecture + 1-page self-service contract + platform SLOs |
| 42 | [Deep-Dive AI Testing — Data, Bias, Explainability, Observability](./phase-8-quality-architecture/42-deep-dive-ai-testing.md) | 4 spec patterns + tag conventions + gating policy |
| 43 | [Compliance-as-Code (EU AI Act / NIST AI RMF / ISO 42001)](./phase-8-quality-architecture/43-compliance-as-code.md) | Clause→gate→evidence matrix + a real CI workflow |
| 44 | [Running an Enterprise AI Transformation (Graduation)](./phase-8-quality-architecture/44-running-an-enterprise-ai-transformation.md) | Multi-team backlog, change network, executive cockpit, stop-loss, **graduation RFC** |

### Track P — People, Career & Management (opt-in, parallel to Phases 7-8) · [`track-p-people-and-management/`](./track-p-people-and-management/README.md)

> **Crosscutting track for the manager fork.** Not a prerequisite for any phase. Take it if your destination is QA Manager / Director / VP Quality.

| # | Module | What you learn |
|---|---|---|
| P1 | [From engineer to QA manager — the identity shift](./track-p-people-and-management/p01-from-engineer-to-manager.md) | 4 identity shifts; first-90-days; structured 1:1s; delegation; anti-principles |
| P2 | [Hiring, leveling & growing QA testers](./track-p-people-and-management/p02-hiring-leveling-growing-testers.md) | JD discipline; 4-stage interview loop; debrief calibration; QA ladder; growth plans; performance mgmt |
| P3 | [Communication & influence without authority](./track-p-people-and-management/p03-communication-and-influence.md) | Audience spectrum; BLUF; 3 forms of "no"; conflict mediation; trust capital |
| P4 | [Running a QA program at scale](./track-p-people-and-management/p04-running-qa-program-at-scale.md) | Quarterly plan; OKRs vs SLOs; vendor RFCs; budget defence; capacity planning |
| P5 | [People-first incident & change leadership (capstone)](./track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) | War-room roles; blameless post-mortem; Kotter change mgmt; psychological safety; **Quality Org Charter** (graduation artifact) |

---

## How to use this curriculum

### As a self-learner

1. Work through phases in order — each builds on the previous.
2. **Do every Hands-on lab.** Reading without writing code = nothing retained.
3. Open a PR for each lab into a personal `training/<your-name>/` branch — your trainer reviews using the same gates the real codebase uses (`npm run check:all`).
4. After each phase, complete the phase's **Self-check** to confirm readiness before moving on.

### As a trainer / mentor

- Assign one phase per week; pair-program the first lab in each phase.
- Use the **Self-check** at the end of each module as a verbal checkpoint.
- The capstone (Module 33) is the graduation criterion — review it like a real production PR.

### As a hiring manager

The phase boundaries map to hiring rubrics:

| Career level | Should master through |
|---|---|
| Junior QA / Manual | Phase 0 |
| QA Automation Engineer | Phase 3 |
| Senior QA / SDET | Phase 5 |
| Quality Engineer / Lead | Phase 6 + capstone |
| AI Quality Leader | Phase 7 + portfolio graduation |
| Quality Architect / Head of AI Quality | Phase 8 + graduation RFC |
| **QA Manager / Director / VP Quality** | **Phase 7 + Track P + Quality Org Charter** |
| Head of Quality (T-shape: people × architecture) | Phase 7 + Phase 8 + Track P |

---

## Module template

Every module follows the same structure, so you always know where to look:

```
# Module N — Title
> Phase X · Effort: Yh · Prerequisites: …

## Learning objectives    ← what you can do after
## Why it matters          ← context, real-world relevance
## Concepts                ← the actual content
## Hands-on lab            ← exercise inside this repo
## Self-check              ← knowledge questions
## Further reading         ← curated links
```

---

## Companion materials in this repo

The curriculum leans on resources already in the repo:

- **`prompts/`** — AI prompts referenced from Phase 6
- **`.agents/skills/`** — Agent Skills used in labs
- **`documents/automation-framework/`** — deeper framework docs
- **`knowledge-base/`** — domain knowledge for the SUT
- **`tests/`**, **`pages/`**, **`locators/`** — the live codebase you'll modify
- **`templates/qa-metrics-dashboard.html`** — the dashboard you'll extend in Phase 5

---

## License & contribution

Curriculum content is part of this training repo. PRs to fix typos, add exercises, or update modules are welcome — open an issue first for new modules so we keep the curriculum tight.
