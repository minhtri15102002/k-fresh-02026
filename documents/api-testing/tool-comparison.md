# API Testing Tool Comparison — When to Use What

> Decision aid for choosing between **[Postman GUI](./postman.md)**, **[Newman CLI](./postman-newman.md)**, **[Apidog](./apidog.md)**, **[REST Assured](./rest-assured.md)**, **[SuperTest](./supertest.md)**, **[Pact](./pact.md)**, and the **in-repo [`tests/api/`](../../tests/api/)** (Playwright `request` fixture). All seven can co-exist; this doc tells you which one earns its keep for which scenario.
>
> **TL;DR:**
> - **Explore + show stakeholders** → Postman or Apidog GUI
> - **Schedule a smoke set in CI** → Newman or apidog-cli
> - **Regression gate on every PR** → [`tests/api/`](../../tests/api/) (Playwright)
> - **Spec-first greenfield project** → Apidog
> - **Pre-existing Postman investment** → Postman + Newman, defer Apidog
> - **JVM service tests, in the service repo** → REST Assured (JUnit 5)
> - **Node service handler tests, in-process, fast** → SuperTest (Vitest / Jest)
> - **Two services owned by different teams** → Pact + Broker (`can-i-deploy` gate)

## The 5-criterion matrix

Score each tool 1-5 (5 = best fit) for the criteria the team weights highest.

| Criterion | Postman GUI | Newman CLI | Apidog | REST Assured | SuperTest | Pact | [`tests/api/`](../../tests/api/) |
|---|---|---|---|---|---|---|---|
| **Speed of first request** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Non-engineer friendly** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ | ⭐ |
| **PR-gating in CI** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Multi-step flow maintainability** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ (per-pair) | ⭐⭐⭐⭐⭐ |
| **Cross-browser / UI integration** | ⭐ | ⭐ | ⭐ | ⭐ | ⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| **AI-assist for test generation** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ ([`contract-testing`](../../.agents/skills/contract-testing/SKILL.md)) | ⭐⭐⭐⭐⭐ |
| **Spec-first / OpenAPI sync** | ⭐⭐ (paid) | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ (Swagger Codegen) | ⭐⭐ | ⭐⭐ (consumer-driven, not spec-driven) | ⭐⭐⭐ (via [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md)) |
| **Mocking** | ⭐⭐⭐ (cloud-bound) | n/a | ⭐⭐⭐⭐⭐ (spec-driven) | ⭐⭐⭐⭐ (WireMock / MockServer) | ⭐⭐⭐⭐ (nock / MSW) | ⭐⭐⭐⭐⭐ (the entire model) | ⭐⭐⭐⭐ (via [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md)) |
| **Catches contract drift across services** | ⭐ | ⭐ | ⭐⭐ (if both teams use it) | ⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ (only after deploy) |
| **Vendor lock-in risk** | ⭐⭐ (cloud, free-tier squeeze) | ⭐⭐⭐⭐ (open CLI) | ⭐⭐ (cloud) | ⭐⭐⭐⭐⭐ (OSS, JVM-only) | ⭐⭐⭐⭐⭐ (OSS) | ⭐⭐⭐ (Broker hosting; OSS broker option) | ⭐⭐⭐⭐⭐ (in-repo) |
| **TCO at 5+ engineers/year** | $$ (paid teams) | $ | $$ (paid plans) | $ (OSS + JVM build already paid) | $ | $-$$ (PactFlow above 5 contracts) | $ (already paid) |

The repo's default weighting puts **PR-gating + maintainability + lock-in risk** at the top, which is why [`tests/api/`](../../tests/api/) is the canonical regression layer. The other six are complements, not substitutes — each one targets a layer of the test pyramid that the others can't economically reach.

## The decision tree

```
Q1. Is the endpoint already covered in tests/api/?
       │
       ├─ Yes  → Use tests/api/. Don't fork the contract into Postman/Apidog.
       │        (Add a spec there if a case is missing — see api-fuzzer-generator skill.)
       │
       └─ No   → Q2

Q2. Is this exploratory ("I don't know the shape yet")?
       │
       ├─ Yes  → Postman GUI (or Apidog if you're already invested).
       │        Promote stable requests to tests/api/ within 1 sprint.
       │
       └─ No   → Q3

Q3. Is the service under test owned by a different team / repo / language?
       │
       ├─ Yes — JVM   → REST Assured in their repo; bridge by JUnit XML upload.
       │                See rest-assured.md.
       ├─ Yes — Node  → SuperTest in their repo for handler logic; tests/api/
       │                still covers the cross-service slice.
       └─ No          → Q4

Q4. Does the boundary cross two services owned by different teams?
       │
       ├─ Yes  → Pact. Author the consumer pact, run provider verification on
       │        the other side, gate deploys with `can-i-deploy`.
       │        See pact.md.
       │
       └─ No   → Q5

Q5. Does it need to run on every PR, with the rest of the regression suite?
       │
       ├─ Yes  → Author directly in tests/api/ (skip Postman; the GUI step is friction here).
       │
       └─ No   → Q6

Q6. Does it need to run in CI on a schedule (nightly / hourly / canary)?
       │
       ├─ Yes  → Newman CLI on the Postman collection,
       │         OR apidog-cli on the Apidog scenario.
       │         JUnit feeds the same dashboard panel as tests/api/.
       │
       └─ No   → Q7

Q7. Is the audience a non-engineer (PM, sales, support, exec)?
       │
       ├─ Yes  → Postman GUI (most universal; htmlextra report is shareable).
       │
       └─ No   → Re-think — most "API testing needs" that survive Q1-Q6 are
                 actually feature requests in disguise; treat as a manual TC
                 (documents/manual-testcases/) and refer back here when it
                 hardens.
```

## Test-pyramid placement (the seven tools, top-to-bottom)

Different tools live at different layers of the [test pyramid](../../.agents/skills/test-pyramid-audit/SKILL.md). Stacking them right is what produces fast feedback **and** real confidence:

```
                                         Speed     Where it runs        Catches
                                         ─────     ─────────────        ───────
   ▲   tests/api/ (Playwright request)   100ms     This repo's CI       Cross-service E2E
   │   ────────────────────────────
   │   Pact (provider verification)       10ms     Provider repo CI     "Can I still satisfy A?"
   │   Pact (consumer)                    10ms     Consumer repo CI     Expected provider shape
   │   ────────────────────────────
   │   REST Assured (out-of-process)      50ms     JVM service repo     JVM handler integration
   │   SuperTest (in-process)              3ms     Node service repo    Node handler integration
   │   ────────────────────────────
   │   Postman / Apidog GUI                n/a     Manual               Exploration, demos
   │   Newman / apidog-cli                ~min     Cron / canary        Smoke set on a schedule

   No single layer replaces another. Skipping a layer concentrates
   the missing coverage onto the layer above (slower, more expensive)
   or the layer below (faster but in the wrong scope).
```

Anti-stacking patterns:

- ❌ Pact + tests/api/ both asserting the exact same fields → Pact's contract is too tight (use matchers!)
- ❌ SuperTest + tests/api/ both asserting handler validation logic → demote tests/api/ to one happy path; let SuperTest cover the branches
- ❌ Postman + Newman + tests/api/ all maintaining 30 of the same request → keep the Postman collection for stakeholders, port the assertions to tests/api/ once

## Lifecycle pattern (what this looks like over a year)

```
   Week 0     Week 1-2          Sprint 1          Sprint 2-3       Quarter 2+
   ──────     ────────          ────────          ──────────       ──────────
  Endpoint   Postman GUI       Newman CI         Port @P1 to       Postman/Apidog
   ships  →  exploration   →   smoke (nightly)→  tests/api/     →  request stays as
            (Maya, 1 day)     (CI, every push)   (Sam, 2 days)     stakeholder doc
                                                                   tests/api/ is the
                                                                   regression gate
```

The Postman / Apidog request **never gets deleted** — it remains the human-readable contract for stakeholders. The TS spec **never replaces it** in the GUI; both stay in sync via shared examples.

## Side-by-side feature comparison

### Authoring

| Feature | Postman | Apidog | tests/api/ |
|---|---|---|---|
| Create request | GUI form, instant | GUI form, instant | Code + IDE; Cursor/Copilot helpful |
| Multi-environment | Native (env JSONs) | Native (envs) | `profiles/.env.<ENV>` + [`env.loader.ts`](../../env.loader.ts) |
| Pre-request setup | `pm.sendRequest`, JS in script tab | Same `pm.*` API + native pre-request blocks | Playwright fixtures (`@pages/base-page` etc.) |
| Capture-and-reuse value | `pm.environment.set` | `pm.environment.set` + visual data-flow | TS variables in test scope |
| Schema assertion | `pm.expect(body).to.have.all.keys(…)` | Native "Match JSON Schema" | `Assertions.assertSchemaByType(...)` |
| Negative case generation | Manual (or paid Postman AI) | Auto-generate from spec | [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) skill |

### Running

| Feature | Postman GUI | Newman | Apidog GUI | apidog-cli | tests/api/ |
|---|---|---|---|---|---|
| Run one request | ✅ click | ✅ `--folder` flag | ✅ click | ✅ `--scenario-id` | ✅ `npx playwright test <file>` |
| Run a folder/scenario | ✅ Collection Runner | ✅ `--folder` | ✅ click | ✅ `--folder-id` | ✅ tag filter `--grep @cart` |
| Parallel execution | ❌ serial | ❌ serial (use `parallel` matrix in CI) | ❌ serial | ❌ serial | ✅ workers per [`playwright.config.ts`](../../playwright.config.ts) |
| Sharded across N machines | ❌ | ❌ (unless you split collections) | ❌ | ❌ | ✅ via Playwright `--shard` |
| Cross-browser | n/a | n/a | n/a | n/a | ✅ Chromium / Firefox / WebKit projects |

### Reporting

| Feature | Newman | apidog-cli | tests/api/ |
|---|---|---|---|
| CLI live tail | ✅ `cli` reporter | ✅ `cli` reporter | ✅ Playwright list reporter |
| Standalone HTML report | ✅ `htmlextra` | ✅ `html` | ✅ Playwright HTML reporter |
| JUnit (dashboard feed) | ✅ `junitfull` (use this, not plain `junit`) | ✅ `junit` | ✅ via `playwright.config.ts` reporters |
| Allure | ✅ `newman-reporter-allure` | ⚠️ third-party adapters; less mature | ✅ `allure-playwright` |
| Trace / video | ❌ | ❌ | ✅ Playwright traces |

### Mocking

| Feature | Postman | Apidog | [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md) skill (in-test) |
|---|---|---|---|
| From saved examples | ✅ | ✅ | n/a |
| Spec-driven (auto from OpenAPI) | ❌ (paid tiers only) | ✅ default | ⚠️ via codegen |
| Conditional rules (`if body matches X`) | ⚠️ scriptable, awkward | ✅ native UI | ✅ native (MSW handlers) |
| Lives in repo | ❌ cloud | ⚠️ cloud + JSON export | ✅ TS in repo |
| Used in production | ❌ never | ❌ never | n/a |

### Lock-in & cost

| Concern | Postman | Apidog | tests/api/ |
|---|---|---|---|
| Free tier limits (May 2026) | Collection runs / mock calls capped; team workspace = paid | Generous free tier, paid for team-scale | n/a (in-repo) |
| Paid plans pricing growth (last 24 mo) | ⚠️ aggressive (~30 % YoY) | ⚠️ similar curve, lower base | n/a |
| Self-host option | ❌ no | ⚠️ enterprise tier | ✅ |
| Egress on cloud failure | Read-only fallback (export collection) | Same | n/a |
| Where the data lives | Postman cloud | Apidog cloud (US/SG) | Your git host |

For paid licence decisions, use [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md). The worked example at [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) (visual regression vendor) maps closely — same scoring shape applies.

## Migration paths

### Postman → Newman in CI (most common in this repo)

Already covered in [`postman-newman.md`](./postman-newman.md). One-day effort: install Newman, sync env, add a CI job, wire JUnit to dashboard. Zero risk; collection unchanged.

### Postman → Apidog (full tool swap)

Covered in [`apidog.md`](./apidog.md) §Migration paths. Multi-week effort:

- Week 1: import all collections + envs; sanity-check
- Week 2: re-author assertions to Apidog DSL (Postman scripts work but feel foreign)
- Week 3: wire apidog-cli into CI; sunset Newman
- Week 4: archive Postman workspace; team training

Cost: 1 FTE-month. Benefit: spec-first workflow, native mocks, single tool. Not worth it unless you have <50 collections and a greenfield API surface.

### Postman → [`tests/api/`](../../tests/api/) (the strategic move)

The right answer for any test that has stabilised. Per-request effort: ~30 min for a single request, ~2 hours for a multi-step scenario.

```bash
# Workflow:
# 1. Identify a Postman request to promote (everything in 10-happy-paths/ is @P1)
# 2. Use Cursor / Copilot with the api-fuzzer-generator skill to draft the TS
# 3. Apply tag conventions per prompts/core/test-tags.md
# 4. Verify identical assertion shape (5-step) per automation-framework/assertions.md
# 5. Run locally; commit; PR
# 6. Update Postman request description: "PROMOTED — see tests/api/<spec>.spec.ts"
```

Result: the regression gate gets stronger; the Postman collection remains for stakeholder demos.

### [`tests/api/`](../../tests/api/) → Postman (backwards migration)

Only do this if a stakeholder explicitly needs to click a request and you can't show them the TS spec. Hand-derive the request body, headers, and one assertion (the status code); skip the rest. The TS spec stays canonical.

## Worked example — choosing for the cart-discount-expiry scenario

Recall the [Phoenix QA team's cart-discount-expiry incident](../../training/sandbox/example/manager/defect-narrative-dev.md). The team needed:

| Need | Tool used | Why |
|---|---|---|
| Reproduce the bug interactively for the dev | Postman GUI | Fast iteration; no CI cycle; can paste the curl into the defect narrative |
| Show the PM the affected endpoint behaviour | Postman GUI (htmlextra single-run export) | Non-engineer; visual evidence |
| Block re-merge with a regression gate | [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — added `@TC-203b` for expired-mid-session | Every-PR gate; @P2; AI-fuzzed siblings |
| Nightly canary against prod | Newman on the `99-smoke` collection | Schedule-only; off-PR; lighter than full Playwright run |
| Spec-driven mock for front-end retest | n/a in this case (the team uses Playwright `route()` via [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md)) | The spec wasn't in OpenAPI — Apidog wouldn't have helped here |

So: **3 tools, one incident**, each earning its keep for a different audience and lifecycle stage. That's the norm, not the exception.

## Anti-patterns this comparison rules out

- ❌ "We standardise on one tool for everything" — kills the audience-fit win
- ❌ "Postman/Apidog is the test suite" — they're the exploration + stakeholder layer; [`tests/api/`](../../tests/api/) is the gate
- ❌ "We don't need [`tests/api/`](../../tests/api/) because we have Newman" — Newman runs your collections; it doesn't get you cross-browser, traces, or AI-assist
- ❌ Re-evaluating the tool every quarter — pick once per project, re-evaluate annually (per [Track P · M4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"Build vs buy")
- ❌ Letting any one tool get a paid licence without an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) — the TCO numbers compound

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md), [`postman-newman.md`](./postman-newman.md), [`apidog.md`](./apidog.md) — GUI / CLI tool guidelines
- [`rest-assured.md`](./rest-assured.md), [`supertest.md`](./supertest.md) — code-based service-team API tests (JVM and Node)
- [`pact.md`](./pact.md) — consumer-driven contract testing for cross-team boundaries
- [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — canonical example of the in-repo regression layer
- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — for any paid-tier proposal (Postman Team, Apidog Cloud, PactFlow)
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`.agents/skills/api-testing-mock/SKILL.md`](../../.agents/skills/api-testing-mock/SKILL.md), [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md), [`.agents/skills/openapi-spec-generation/SKILL.md`](../../.agents/skills/openapi-spec-generation/SKILL.md), [`.agents/skills/contract-testing/SKILL.md`](../../.agents/skills/contract-testing/SKILL.md), [`.agents/skills/test-pyramid-audit/SKILL.md`](../../.agents/skills/test-pyramid-audit/SKILL.md) — agent skills that complement these tools
