<!--
  Test Plan template — emit at documents/test-plans/<feature>-test-plan.md
  Fill every {{PLACEHOLDER}}; delete any section your plan size doesn't need.
  See .agents/skills/test-plan-author/SKILL.md for guidance.

  Sections marked [MINI]   are required for the 1–2 page mini-plan.
  Sections marked [FULL]   add to the 5–15 page full plan.
  Sections marked [MASTER] add to the release master plan.
-->

# Test Plan — {{FEATURE_OR_RELEASE_NAME}}

| Plan ID | Owner | Plan size | Status | Last updated |
|---|---|---|---|---|
| TP-{{YYYYMMDD}}-{{SLUG}} | {{QA_LEAD}} | mini / full / master | draft / approved / in-progress / closed | {{YYYY-MM-DD}} |

> Linked artefacts:
> - Requirements: {{REQ_DOC_OR_LINK}}
> - Live QA Dashboard: <https://khanhdodang.github.io/ai-qa-training/qa/>
> - Allure report (latest): <https://khanhdodang.github.io/ai-qa-training/qa/allure/>
> - Milestone: [`.github/MILESTONES.md`](../../.github/MILESTONES.md) — `{{MILESTONE_NAME}}`

---

## 1. Summary [MINI]

A 3-sentence pitch: what's being tested, why now, and what "done" looks like.

> {{2_TO_3_SENTENCES}}

---

## 2. Scope [MINI]

### 2.1 In scope

| # | Item | Module | Reference |
|---|---|---|---|
| 1 | {{ITEM_1}} | cart \| checkout \| profile \| product \| compare \| wishlist \| home \| auth | {{REQ_ID_OR_LINK}} |
| 2 | {{ITEM_2}} | … | … |

### 2.2 Out of scope (must list ≥ 3 items)

- {{EXPLICITLY_NOT_TESTED_1}}
- {{EXPLICITLY_NOT_TESTED_2}}
- {{EXPLICITLY_NOT_TESTED_3}}

### 2.3 Assumptions & dependencies

- Assumption: {{ENV_OR_DATA_ASSUMPTION}}
- Dependency: {{UPSTREAM_TEAM_OR_SYSTEM}} delivered by {{DATE}}

---

## 3. Approach [MINI]

| Test type | Will run? | Coverage target | Tool | Notes |
|---|---|---|---|---|
| `@smoke` | yes | 100% of @P1 | Playwright | runs on every CI push |
| `@regression` | yes | 100% of @P1+@P2 | Playwright | runs on PRs to main |
| `@security` | {{Y/N}} | … | Playwright API + manual review | per `api-security-testing` |
| `@a11y` | {{Y/N}} | WCAG 2.1 AA | `@axe-core/playwright` | per `accessibility-testing` |
| `@perf` | {{Y/N}} | LCP < 2.5s, TTFB < 600ms | k6 + Lighthouse | per `performance-testing` |
| Manual exploratory | yes | 1 hour per @P1 | charter-style | findings → `defect-report` |

---

## 4. Risk register [MINI — required]

Score = Likelihood × Impact (each 1–3). See `.agents/skills/test-plan-author/SKILL.md` Phase 2.

| # | Risk / component | Likelihood | Impact | Score | Strategy | Owner |
|---|---|---|---|---|---|---|
| R1 | {{RISK}} | 1–3 | 1–3 | n | {{STRATEGY}} | {{OWNER}} |
| R2 | … | … | … | … | … | … |

---

## 5. Coverage plan [FULL]

### 5.1 Cases to author

> Use [`generate-manual-testcase`](../../.agents/skills/generate-manual-testcase/SKILL.md) and
> [`test-design-techniques`](../../.agents/skills/test-design-techniques/SKILL.md).

| Requirement | Test technique | Expected case count | Output path |
|---|---|---|---|
| {{REQ_ID}} | EP+BVA | ~12 | `documents/manual-testcases/{{feature}}/TC-{{feature}}-*.md` |

### 5.2 Cases to automate

| TC ID | Spec file | Tag block | Owner |
|---|---|---|---|
| TC-{{feature}}-01 | `tests/ui/test-{{feature}}.spec.ts` | `['@P1', '@critical', '@smoke', '@{{feature}}']` | {{ENG}} |

### 5.3 Cases that stay manual (v1)

| TC ID | Reason | Re-evaluate at |
|---|---|---|
| TC-{{feature}}-99 | Requires production payment gateway | next quarter |

### 5.4 Traceability

Once Phase 5.1 lands, run [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md). Attach:
- `documents/traceability-matrix.md`
- `reports/traceability.json` (auto-rendered in Dashboard Panel #4)

---

## 6. Environments & data [FULL]

| Env | Base URL | Used for | Reset cadence |
|---|---|---|---|
| QA | <https://khanhdodang.github.io/ai-qa-training/qa/> | smoke + regression | per CI run |
| UAT | <https://khanhdodang.github.io/ai-qa-training/uat/> | UAT sign-off | per release |
| Staging | <https://khanhdodang.github.io/ai-qa-training/staging/> | go/no-go | per release |

Test data sources (cite, don't invent):
- Static: `data/login-data.ts`, `data/checkout-data.ts`, `data/product-data.ts`
- Dynamic: `data/data-loader.ts` (Faker)
- Fixtures / users: {{ANY_PROVISIONED_ACCOUNTS}}

---

## 7. Schedule [FULL]

Align with [`.github/MILESTONES.md`](../../.github/MILESTONES.md).

| Phase | Start | End | Deliverable |
|---|---|---|---|
| Test design | {{YYYY-MM-DD}} | {{YYYY-MM-DD}} | manual cases authored |
| Test execution (manual) | … | … | execution log + defects |
| Automation | … | … | merged spec files, green CI |
| UAT | … | … | sign-off |
| Release | … | … | dashboard exit-criteria green |

---

## 8. Entry / Exit / Suspension criteria [FULL — required]

### 8.1 Entry — testing may begin when

- [ ] All in-scope stories merged to `develop`
- [ ] `@smoke` suite green on the feature branch
- [ ] Test data provisioned in QA env

### 8.2 Exit — release is allowed when

- [ ] 100% of `@P1` + 95% of `@P2` manual cases executed (Dashboard Panel #2)
- [ ] 0 open `severity:critical`, ≤ 3 `severity:major` (Panel #3)
- [ ] Every in-scope REQ is "Fully covered" or "Partial+approved" (Panel #4)
- [ ] `@smoke` + `@regression` green on QA + UAT (Panel #1)

### 8.3 Suspension — pause testing if

- A `severity:critical` defect is open > 24h
- An environment is unavailable > 4h
- CI smoke fails 3 runs in a row without root cause

---

## 9. Roles & responsibilities [FULL]

| Role | Owner | Responsibility |
|---|---|---|
| QA Lead | {{NAME}} | own this plan; daily status |
| Eng Lead | {{NAME}} | code-review automation, fix priority defects |
| PM | {{NAME}} | scope decisions, sign-off |
| SRE / DevOps | {{NAME}} | env stability, CI runners |

---

## 10. Defects & escalation [FULL]

- All defects filed via [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill
- Labels per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)
- Triage: daily standup — `severity:critical` triaged within 4h
- Escalation: `severity:critical` open > 24h ⇒ notify PM + Eng Lead

---

## 11. Cross-feature impact [MASTER]

Other modules touched by this release (regression scope):

| Module | Owner | Regression suite tag | Notes |
|---|---|---|---|
| auth | {{NAME}} | `@auth @regression` | login still works |
| cart | {{NAME}} | `@cart @regression` | totals unchanged |

---

## 12. Sign-off [MINI — required]

| Role | Name | Approved on | Notes |
|---|---|---|---|
| QA Lead | {{NAME}} | {{YYYY-MM-DD}} |  |
| Eng Lead | {{NAME}} |  |  |
| PM | {{NAME}} |  |  |
| SRE | {{NAME}} |  |  |

---

## Appendix A — Deliverables checklist

- [ ] Test cases — `documents/manual-testcases/{{feature}}/`
- [ ] Automated specs — `tests/{ui,api}/test-{{feature}}.spec.ts`
- [ ] Traceability matrix — `documents/traceability-matrix.md`
- [ ] Tag validator green — `npm run validate:tags -- --strict`
- [ ] Dashboard reflects exit criteria — `npm run export:dashboard`
- [ ] Plan signed off (Section 12)

## Appendix B — Change log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1 | {{YYYY-MM-DD}} | {{AUTHOR}} | Initial draft |
| 1.0 |  |  | Approved |
