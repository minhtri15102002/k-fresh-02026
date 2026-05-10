# Module 33 — Capstone & Career Paths

> Phase 6 · Effort: 16h+ · Prerequisites: Modules 1–32

## Learning objectives

After this module you can:

- Ship a complete feature end-to-end using everything from Phases 0–6.
- Self-review like a senior reviewer would.
- Map your strengths to a career path: SDET, Quality Engineer, Performance/Security, QA Lead, QA Architect.

## Why it matters

The capstone is the only module where you bring it all together. Until now you've practiced skills in isolation. Now you ship.

---

## The Capstone Brief

### Pick a feature

Choose a flow on the SUT not yet covered (suggestions):

- Wishlist (add / share / remove / merge with cart)
- Coupon stacking (multiple coupons, stacking rules, expiry edge cases)
- Currency switcher (USD ↔ EUR, with cart conversion)
- Address book (add / edit / set default / delete with cascade)
- Compare products (add / remove / clear / max-N enforcement)

### Deliverables checklist

- [ ] **Manual TCs** under `documents/manual-testcases/<feature>.md` — Phase 0 format
- [ ] **Locators** in `locators/<feature>-locators.ts` — Phase 3 rules, role-first
- [ ] **Models** in `models/<entity>.ts` — Phase 3 typed
- [ ] **Test data** in `data/<entity>-data.ts` + `*.helper.ts` — Phase 3 factories
- [ ] **Page object** in `pages/ui/<feature>-page.ts` — `commonPage` discipline (zero violations)
- [ ] **API page** in `pages/api/api-page.ts` if hybrid — `assertHelper` for verifications
- [ ] **UI tests** in `tests/ui/test-<feature>.spec.ts` — full tag set
- [ ] **API tests** in `tests/api/test-<feature>.spec.ts` if applicable
- [ ] **Hybrid tests** for the slow journeys — Phase 4
- [ ] **Security check** if relevant — at least cookie/auth assertions
- [ ] **A11y check** — axe-core run on the new page, no `critical` violations
- [ ] **CI integration** — feature appears in matrix, artifacts upload correctly
- [ ] **Dashboard panel** — at least one new metric on `templates/qa-metrics-dashboard.html`
- [ ] **Defect labels** — if you found bugs, file them with the right labels
- [ ] **PR description** — written with help from `prompts/advanced/release-readiness.md`

### Quality gates

- `npm run check:all` passes (typecheck + lint)
- Tests run green 50× headless without retries
- Allure report shows the new feature grouped by tag
- Dashboard PDF + live HTML build cleanly
- Code review catches **zero** rule violations from `prompts/core/pom-generator.md`

### Stretch goals

- Add a new prompt under `prompts/core/` for the feature you built.
- Add an Agent Skill under `.agents/skills/<feature>-tester/SKILL.md`.
- Add a perf benchmark for one of the API endpoints.
- Refactor an existing similar feature to match your new pattern.

---

## Self-review checklist (be ruthless)

Run through this BEFORE asking for human review.

### Architecture
- [ ] Locators only contain `Locator` declarations — no actions, no assertions.
- [ ] Pages contain `@step` decorators on every public async method.
- [ ] Pages route every Locator/Page interaction through `this.commonPage`.
- [ ] Pages route every assertion through `this.assertHelper.*` or `Assertions.*`.
- [ ] Tests never call `expect()` directly; never instantiate page objects with `new`.

### Quality
- [ ] No `page.waitForTimeout` anywhere.
- [ ] No `force: true` without a justifying comment.
- [ ] No `.skip` / `.fixme` without a linked issue.
- [ ] No hardcoded UI strings (use `Messages.*` or `TRANSLATIONS.*`).
- [ ] All tests have priority + severity + suite + type + feature tags.

### Testing
- [ ] Each test is independent and idempotent.
- [ ] Test data is generated, not seeded (where appropriate).
- [ ] Negative paths are covered, not just happy paths.
- [ ] Hybrid pattern used where it cuts >2× wall-clock.
- [ ] At least one `@P1 @critical @smoke` test.

### CI/CD
- [ ] CI green on all matrix combinations.
- [ ] Artifacts upload under non-colliding names.
- [ ] Dashboard panel populates from real run data.

### Documentation
- [ ] PR description covers: what, why, how to test, risks.
- [ ] Manual TCs traceable to requirements.
- [ ] New prompt / skill (if any) cross-links to `pom-generator.md` rules.

---

## Career paths

After the capstone, here's where graduates typically go.

### SDET / Test Automation Engineer

**Fit if:** you love writing code; you want depth in frameworks and CI.
**Daily work:** maintain & extend the framework, build tooling, own flake budget.
**Next-level skills:** dev-side languages (Go/Python), Kubernetes for test infra, performance tools (k6).

### Quality Engineer (QE)

**Fit if:** you want breadth — code + product + process; you pair with PMs and engineers.
**Daily work:** test strategy, in-sprint automation, exploratory testing, release readiness.
**Next-level skills:** product analytics (Amplitude, Mixpanel), domain depth, leadership.

### Performance Engineer

**Fit if:** Phase 4–5 modules energized you; you like graphs and percentiles.
**Daily work:** load tests, profiling, SLO tracking, capacity planning.
**Next-level skills:** k6 / JMeter / Locust, distributed tracing, OpenTelemetry, Linux perf tools.

### Security Engineer (offensive QA / AppSec)

**Fit if:** Module 23 was your favorite.
**Daily work:** threat modeling, security tests, pen-testing, SAST/DAST integration.
**Next-level skills:** Burp Suite, OWASP ZAP, OAuth/OIDC depth, threat intel, certs (OSCP, eWPT).

### QA Lead / Manager

**Fit if:** you want to multiply teams' effectiveness through process and people.
**Daily work:** hiring, mentoring, dashboards (Phase 5!), DORA metrics, stakeholder reporting.
**Next-level skills:** budget management, vendor selection, technical writing.

### Quality Architect

**Fit if:** you've done all of the above; you want to set strategy across multiple teams.
**Daily work:** design test platforms, set conventions (like the prompts in this repo), drive shift-left initiatives.
**Next-level skills:** organizational design, technical writing, public speaking.

### What to pursue this year

| If you finished the capstone in… | Try next |
|---|---|
| < 4 weeks, scoring 9/10 on review | Move to harder problems: build a perf suite, contribute to Playwright OSS |
| 4–8 weeks, scoring 7/10 | Solidify Phase 3–4 by automating 2 more features |
| > 8 weeks, scoring < 7/10 | Re-do Phase 3 with a mentor; the architecture rules are the bottleneck |

---

## Continuing education

- Conferences: SeleniumConf, Heisenbug, EuroSTAR, AssuranceFest
- Certifications (if your employer values them): ISTQB, AWS DevOps, OSCP
- Open source: Playwright, Allure, axe-core, k6 — all welcome QA-flavored contributions
- Books that age well:
  - *Continuous Delivery* — Humble & Farley
  - *The Goal* — Goldratt (theory of constraints applied to QA)
  - *Lessons Learned in Software Testing* — Kaner / Bach / Pettichord
  - *Accelerate* — DORA metrics origin story

---

## Final self-check

- [ ] You can explain every rule in `prompts/core/pom-generator.md` and why it exists.
- [ ] You can take a capstone-level feature from spec to merged PR in under a week.
- [ ] You can read a CI failure trace and diagnose it in under 5 minutes.
- [ ] You can extend the QA Metrics dashboard without breaking it.
- [ ] You can explain QA strategy to a non-technical stakeholder in 5 minutes.

If you ticked all five: **graduated.** Open a PR titled `chore(training): <your-name> capstone complete` adding a one-page reflection to `training/sandbox/<your-name>/capstone-reflection.md`.

---

**Prev:** [32 — MCP & browser agents](./32-mcp-and-browser-agents.md) · **Up:** [Phase 6 README](./README.md) · **Curriculum:** [Top](../README.md)

🎓 **Curriculum complete.** Welcome to the team.
