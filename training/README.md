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
Phase 0: Foundations           (5 modules) — QA mindset, test design, manual TCs
   │
Phase 1: Engineering Toolkit   (4 modules) — Git, TypeScript, Web, HTTP
   │
Phase 2: Playwright Core       (6 modules) — Locators, actions, fixtures, trace
   │
Phase 3: Framework Architecture(5 modules) — 3-layer POM + commonPage + assertions
   │
Phase 4: API & Cross-cutting   (4 modules) — API, security, visual, a11y
   │
Phase 5: Quality at Scale      (5 modules) — CI, sharding, reporting, dashboards
   │
Phase 6: AI-Assisted QA        (4 modules) — Prompts, MCP, LLM eval, capstone
```

Approx. effort: **80–120 hours** of focused learning + lab work.

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
| 33 | [Capstone & career paths](./phase-6-ai-assisted-qa/33-capstone-and-career-paths.md) | Ship a feature end-to-end; SDET vs QE vs Architect |

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
| Quality Engineer / Lead / Architect | Phase 6 + capstone |

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
