---
name: test-plan-author
description: "Authors enterprise-grade test plans (the strategy document — not the individual cases) for a feature, release, or module. Use when explicitly asked to 'write a test plan', 'draft a test strategy', 'create QA plan for the upcoming release', 'plan testing for REQ-…', or before kicking off testing for any non-trivial change. Picks the right plan size (mini / full / release-master), captures scope, risks, environments, entry/exit, schedule, and deliverables in an IEEE-829-inspired template, and orchestrates downstream skills (test-design-techniques → generate-manual-testcase → requirements-traceability) so cases trace back to the plan. Distinct from the playwright-test-planner agent which discovers scenarios via MCP browser exploration; this skill writes the plan document those scenarios populate."
optionalRefs:
  - documents/test-plans/                       # output — directory the skill writes plans into
  - documents/requirements.md                   # optional input — used if present
  - documents/traceability-matrix.md            # produced by requirements-traceability — referenced by this plan
  - reports/traceability.json                   # produced by requirements-traceability — referenced by this plan
---

# Test Plan Author

A test plan is the contract between QA and the rest of the team: it says what will be tested, what will not, who's responsible, when, in which environment, and how we'll know we're done. Without it, test cases get written in a vacuum and coverage gets argued post-hoc.

This skill produces that document. It does **not** produce the individual cases — those come from sibling skills the plan calls out.

---

## When to use this skill

Trigger on:
- "Write a test plan for `<feature>`"
- "Draft a test strategy for the next release"
- "Plan testing for REQ-…"
- "I need a QA plan I can show stakeholders"
- Before starting any release-cycle, hardening sprint, or non-trivial feature

**Do NOT use this skill when:**
- The user wants the **list of test cases** → use [`generate-manual-testcase`](../generate-manual-testcase/SKILL.md).
- The user wants to **derive cases** with EP/BVA → use [`test-design-techniques`](../test-design-techniques/SKILL.md).
- The user wants to **map REQs to TCs** → use [`requirements-traceability`](../requirements-traceability/SKILL.md).
- The user wants the **MCP agent to explore a live page** and emit raw scenarios → use the `playwright-test-planner` agent at [`.claude/agents/playwright-test-planner.md`](../../../.claude/agents/playwright-test-planner.md). Then come back here to wrap those scenarios into a plan document.
- **The requirements themselves haven't been vetted** → run [`requirement-analysis`](../requirement-analysis/SKILL.md) first on each in-scope requirement. A test plan that promises to cover an untestable requirement is a written commitment to fail at exit-criteria time.

---

## Plan-size decision tree

Different deliverables need different ceremony. Pick once, up front.

```
What are you planning?
├── A single small change (1 user story, ≤ 3 days work)
│       → Mini-Plan  (1–2 pages, 6 sections)
│
├── A medium-to-major feature (multi-story epic, 1–4 weeks)
│       → Full Plan  (5–15 pages, 12 sections — IEEE 829 inspired)
│
├── A whole release / hardening cycle (multiple modules, regression sweep)
│       → Release Master Plan  (rolls up multiple Full Plans + regression scope + go/no-go)
│
└── A pure hot-fix / one-line bug fix
        → No plan — open a defect report instead, see defect-report skill
```

The fillable template at [`resources/test-plan-template.md`](resources/test-plan-template.md) has section markers for all three sizes — strip the unused ones.

---

## How to use it

### Phase 1 — Intake (always)

Collect from the user (and the repo) before writing anything:

| Input | Source / how to get it |
|---|---|
| Feature / release name | User |
| Scope IN (what's covered) | User + relevant `documents/requirements.md` if present |
| Scope OUT (explicitly excluded) | User — push for this; ambiguity here causes scope creep |
| Affected modules | Match against the catalogue in `prompts/core/defect-labels.md` (auth/cart/checkout/profile/product/compare/wishlist/home) |
| Audience / stakeholders | User (typically: PM, Eng Lead, QA Lead, SRE) |
| Target dates / milestones | Cross-reference `.github/MILESTONES.md` |
| Environments | Read `playwright.config.ts` + `.github/workflows/playwright.yml` matrix (qa / uat / staging) |
| Existing related cases | Scan `documents/manual-testcases/` and `tests/` for `@<feature>` tag |
| Open defects in scope | Run `npm run fetch:defects` then read `reports/defects.json` |

Before writing, summarise the intake back to the user in 5 bullets and ask: *"Anything missing, or shall I proceed?"*

### Phase 2 — Risk-based prioritisation

For every component in scope, score:

| Component | Likelihood (1–3) | Impact (1–3) | Score | Strategy |
|---|---|---|---|---|
| Checkout — payment redirect | 2 | 3 | **6** | Full E2E + monitored prod canary |
| Cart — qty update | 1 | 2 | 2 | Single happy-path E2E + 2 unit tests |
| Wishlist — empty state | 1 | 1 | 1 | One smoke check, low priority |

`Score ≥ 5` ⇒ **High** (must have automated coverage before release)
`Score 3–4` ⇒ **Medium** (manual-tested, automated next sprint)
`Score ≤ 2` ⇒ **Low** (smoke only)

Map each risk row to:
- A `@P1`/`@P2`/`@P3`/`@P4` priority tag (see `prompts/core/test-tags.md`)
- A test type: `@smoke` / `@regression` / `@security` / `@a11y` / `@perf`

### Phase 3 — Coverage plan (orchestrate sibling skills)

The plan declares *what* will be covered. The actual case derivation happens elsewhere:

1. **Derive cases** from each in-scope requirement → call out `test-design-techniques` to apply EP/BVA/decision-tables.
2. **Author the cases** → list each TC under `documents/manual-testcases/<feature>/TC-…md` using [`generate-manual-testcase`](../generate-manual-testcase/SKILL.md). Cite the count by priority/type matrix.
3. **Map cases to requirements** → run [`requirements-traceability`](../requirements-traceability/SKILL.md) once cases exist; attach the matrix link to the plan.
4. **Automate priority cases** → list the spec files that will land under `tests/ui/` or `tests/api/`, with their tag block. Validate via [`test-tags-validator`](../test-tags-validator/SKILL.md).

The plan document **lists** these activities and **links** to the artefacts; it does not contain the cases inline.

### Phase 4 — Environments, data, tooling

Pull from the repo, don't invent:

- Environments: read the matrix in `.github/workflows/playwright.yml` (qa / uat / staging) and the live dashboard URLs in `README.md`.
- Test data sources: cite `data/` files (`data/login-data.ts`, `data/checkout-data.ts`, …) and `models/`. For dynamic data, point at the existing `@faker-js/faker` usage in `data/data-loader.ts`.
- Reporting: link the live QA Metrics Dashboard for each environment; entry/exit criteria SHOULD reference its panels (test-execution rate, defect counts, traceability coverage).

### Phase 5 — Entry / exit / suspension criteria

Make every criterion **measurable**, ideally tied to a dashboard panel.

```
Entry — testing may begin when:
  • All in-scope user stories merged to develop
  • CI run on the feature branch is green (`@smoke` suite)
  • Test data set is provisioned in QA env

Exit — release is allowed when:
  • 100% of @P1 + 95% of @P2 manual cases executed (Dashboard Panel #2)
  • 0 open critical defects (severity:critical), ≤ 3 open major (Panel #3)
  • Traceability: every in-scope REQ is "Fully covered" or "Partial+approved" (Panel #4)
  • @smoke + @regression suites green on QA + UAT (Panel #1)

Suspend — pause testing if:
  • A blocker defect (severity:critical) is open > 24h
  • Environment is unavailable > 4h
  • CI smoke fails 3 runs in a row (root-cause must be identified before resuming)
```

### Phase 6 — Schedule, owners, deliverables

- **Schedule**: align milestones with `.github/MILESTONES.md`. Don't invent dates.
- **Owners**: name people, not roles. (Roles are fine if names aren't decided yet.)
- **Deliverables checklist** at the bottom of every plan:
  - [ ] Test cases under `documents/manual-testcases/<feature>/`
  - [ ] Automated specs under `tests/{ui,api}/test-<feature>.spec.ts`
  - [ ] Traceability matrix (`reports/traceability.json` + `documents/traceability-matrix.md`)
  - [ ] Defect labels applied per `prompts/core/defect-labels.md`
  - [ ] Dashboard updated and shared with stakeholders
  - [ ] Sign-off recorded in plan footer

### Phase 7 — Emit artefact

Save to `documents/test-plans/<feature>-test-plan.md` (kebab-case, no spaces). Open a PR; reviewers should be the named stakeholders.

If the user asks for **just the plan body** (no file), emit the markdown inline.

---

## Best practices

- **One feature, one plan.** Mega-plans become wallpaper. If a feature spans 3 modules, write 3 sub-plans + 1 release master.
- **Cite, don't invent.** Every URL, file path, env, milestone, label, and tag in the plan must already exist in the repo. The validator will catch fabrications.
- **Risk register is mandatory.** No plan without `Phase 2 — Risk-based prioritisation`. It's the single most-skipped section and the most-cited when things go wrong.
- **Make exit criteria measurable.** "Quality is good" is not a criterion. "P1 pass-rate ≥ 100% per Dashboard Panel #2" is.
- **Push back on out-of-scope items.** Most plans fail because Scope OUT is left empty. If you can't list 3 things explicitly excluded, ask again.
- **Keep automation honest.** Don't promise automation that won't land before exit. List the exact spec file paths and tag blocks; if a case will stay manual for v1, say so under "Automation deferred".
- **Tie to the dashboard.** Entry/exit, defect counts, traceability — all already visualised. Reference the panels by number, not screenshots.
- **Sign-off in the footer.** A plan without a sign-off block becomes a draft forever. Put a 4-row table at the bottom (PM / Eng / QA / SRE) with "Approved on YYYY-MM-DD".

---

## Related

- [`.agents/skills/test-design-techniques/SKILL.md`](../test-design-techniques/SKILL.md) — derive cases for the plan
- [`.agents/skills/generate-manual-testcase/SKILL.md`](../generate-manual-testcase/SKILL.md) — author the cases the plan calls out
- [`.agents/skills/requirements-traceability/SKILL.md`](../requirements-traceability/SKILL.md) — REQ ↔ TC matrix
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file defects discovered during execution
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — confirm cases land with valid tags
- [`.agents/skills/skill-validator/SKILL.md`](../skill-validator/SKILL.md) — run before committing the plan if it edits this skill itself
- [`.claude/agents/playwright-test-planner.md`](../../../.claude/agents/playwright-test-planner.md) — MCP browser-driven scenario discovery (feeds Phase 3 of this skill)
- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — tag taxonomy referenced by the risk register
- [`prompts/core/defect-labels.md`](../../../prompts/core/defect-labels.md) — module / severity catalogue referenced in scope
- [`resources/test-plan-template.md`](resources/test-plan-template.md) — the fillable template
