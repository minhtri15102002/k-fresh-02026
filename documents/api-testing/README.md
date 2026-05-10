# API Testing Tooling Guidelines (Postman · Newman · Apidog · REST Assured · SuperTest · Pact)

> Source-of-truth folder for **how this repo uses GUI/CLI/code-based API-testing tools alongside the Playwright API tests in [`tests/api/`](../../tests/api/)**. Six tools, one shared contract: every collection or test produces the same evidence (status, schema, latency, payload) the dashboard and traceability skills already understand.

## The picture

```
                                                                ┌──────────────────────┐
┌──────────┐  Author    ┌──────────────┐  Sync /                │  tests/api/          │
│ Spec /   │ ─────────► │  Postman GUI │  Convert ─────────────►│   *.spec.ts          │
│ Swagger /│            │  collection  │  (postman-to-          │  (Playwright request │
│ OpenAPI  │ ─────────► │     OR       │   playwright /         │   contract; @P1/@P2; │
│          │   Author   │  Apidog      │   apidog-cli generate) │   regression gate)   │
└──────────┘            │  workspace   │                        └──────────┬───────────┘
                        └──────┬───────┘                                   │
                               │                                           │
                               │ Run in CI                                 │ Run in CI
                               ▼                                           ▼
                       ┌────────────────┐                          ┌────────────────┐
                       │  Newman CLI    │                          │  Playwright    │
                       │  OR            │                          │  request fixture│
                       │  apidog-cli    │                          │  + Assertions   │
                       └──────┬─────────┘                          └──────┬─────────┘
                              │                                           │
                              ▼                                           ▼
                       ┌──────────────────────────────────────────────────────────┐
                       │  Shared evidence contract (status / time / size / schema│
                       │  / data) flows into qa-metrics-dashboard panels and the │
                       │  Jira self-healing loop                                  │
                       └──────────────────────────────────────────────────────────┘
```

The three tools sit on the **left side** of the lifecycle (exploration, contract-as-deliverable, GUI-driven authoring, mocking). [`tests/api/`](../../tests/api/) sits on the right (regression gate, in-IDE TDD, AI-assisted). The same evidence shape (5-step assertions per [`automation-framework/assertions.md`](../automation-framework/assertions.md)) connects them.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`postman.md`](./postman.md) | Postman GUI workflow — workspaces, collections, environments, pre-request / test scripts, mock servers, monitors, secret hygiene | First API test on a new endpoint; non-engineering stakeholders need a clickable artifact |
| [`postman-newman.md`](./postman-newman.md) | Newman CLI integration — install, run-flags, reporters (CLI / JUnit / HTML / Allure), GitHub Actions + GitLab CI snippets, exit-code contract | Promoting a Postman collection from "Maya's laptop" to a CI gate |
| [`apidog.md`](./apidog.md) | Apidog all-in-one — design (OpenAPI), debug, test, mock, doc, CLI runner; comparison to Postman; how to import a Postman collection | Greenfield API project; teams who want spec + test + mock + docs in one tool |
| [`rest-assured.md`](./rest-assured.md) | REST Assured (Java DSL) — JUnit 5 / TestNG suites, the same 5-step assertion shape, Allure + JUnit XML wiring, Maven/Gradle deps, JVM-team CI bridge | A JVM service joins the testing scope; back-end team wants tests in their own runner |
| [`supertest.md`](./supertest.md) | SuperTest (Node, in-process) — Express / Fastify / NestJS / Hono, Vitest + Jest, in-memory DB pattern, the 5-step assertion shape at unit-test speed | The service under test is a Node app and you want fast handler-level integration tests below `tests/api/` |
| [`pact.md`](./pact.md) | Pact (consumer-driven contract testing) — `@pact-foundation/pact` v15, Pact Broker / PactFlow, `can-i-deploy` gate, provider verification, broker webhooks | Two or more services with bespoke contracts; splitting a monolith; integration bugs at deploy time |
| [`tool-comparison.md`](./tool-comparison.md) | When-to-use decision matrix across Postman, Newman, Apidog, REST Assured, SuperTest, Pact, **and** the in-repo Playwright API tests. Migration paths in all directions | Choosing the tool for a new endpoint, or justifying the choice in a vendor RFC |

## Reading order

1. **`tool-comparison.md`** — pick the right tool for your scenario before you spend time learning one.
2. **`postman.md`** OR **`apidog.md`** — your GUI authoring tool of choice (exploration / stakeholder lane).
3. **`postman-newman.md`** — only when you're ready to put the Postman collection in CI.
4. **`supertest.md`** — when the service under test is a Node app and you want handler-level integration tests at unit-test speed.
5. **`rest-assured.md`** — when the service under test is JVM-native and the team owns its own JUnit-based suite.
6. **`pact.md`** — when you have two or more services owned by different teams and need a contract-level safety net.
7. Existing repo material (cross-refs below) — don't re-invent what `tests/api/` already gives you.

## Position vs the in-repo Playwright API tests

| Concern | Postman / Apidog GUI | Newman / Apidog CLI | SuperTest / REST Assured | Pact | [`tests/api/`](../../tests/api/) (Playwright) |
|---|---|---|---|---|---|
| **Best for** | Exploration, ad-hoc, "show the PM" | Scheduled / CI runs of the GUI collection | Handler-level integration in the service repo | Cross-service contract drift | Regression gate, TDD, multi-step flows |
| **Source-of-truth** | `.json` collection (versioned in repo) | Same collection (re-run) | TS / Java spec files in service repo | Pact JSON in broker | TypeScript spec files (versioned, type-safe) |
| **Audience** | Non-engineers welcome | DevOps + QA | Service-team engineers | Service-team engineers + platform | Engineers (TS, Playwright, IDE) |
| **AI assistance** | [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md), [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md) | Same | [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) | [`contract-testing`](../../.agents/skills/contract-testing/SKILL.md) | [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`api-security-testing`](../../.agents/skills/api-security-testing/SKILL.md) |
| **Promotion path** | Export → import to Apidog or convert to TS spec | Direct CI use | Stays in service repo; complements `tests/api/` | Stays in broker; never migrates | Stays in `tests/api/` permanently |
| **CI runtime** | n/a (manual) | ~minutes for a 50-request collection | Seconds (in-process) / minutes (out-of-process) | Seconds (per side) | Sharded across [`playwright.config.ts`](../../playwright.config.ts) projects |

**Rule of thumb in this repo:** explore in Postman / Apidog → once the endpoint stabilises, port a `@P1` / `@P2` slice to [`tests/api/`](../../tests/api/) so it becomes a regression gate. The service team's own SuperTest / REST Assured suite covers handler logic at unit-test speed; Pact covers cross-service contracts. Keep the Postman collection in the repo too — it's the human-readable contract for stakeholders.

## Conventions used here (cross-references)

- **Collection storage** — all Postman / Apidog collection JSON files live under `documents/api-testing/collections/<module>.postman_collection.json` (or `.apidog.json`). Versioned in git; **never** synced bidirectionally with the cloud (one-way export from cloud → repo).
- **Environments** — values mirror this repo's `profiles/.env.<ENV>` files. **No secrets** in the JSON; pull from `.env` at run time. See [`postman.md`](./postman.md) §Secrets.
- **Test tags** — when you port a Postman test to a Playwright spec, the tag rules in [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) apply (`@P1` / `@P2` / `@severity` / `@suite` / `@feature`).
- **Assertion shape** — both Postman tests and the Playwright `Assertions` helper produce the **same 5-step evidence**: status / response time / payload size / schema / data correctness. Pattern is set in [`automation-framework/assertions.md`](../automation-framework/assertions.md) and demonstrated in [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts).
- **Defect labels** — failures from Newman or Apidog CI runs flow into the same `bug` + `severity:*` + `module:*` taxonomy in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). The [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill converts a Newman JUnit failure to a Jira-ready issue.
- **Dashboard contract** — Newman / apidog-cli runs emit JUnit XML to `reports/api/junit.xml` which the dashboard's API panel consumes. See [`postman-newman.md`](./postman-newman.md) §Reporters.
- **Self-healing loop** — broken collection requests (404, schema drift, env mis-match) fall into the same loop documented in [`jira/self-healing-loop.md`](../jira/self-healing-loop.md). Apidog's "auto-detect changes" feature is one healing source; the AI agent is another.

## Out of scope

This folder is **not**:

- A general "what is REST" tutorial — see the [`api-patterns`](../../.agents/skills/api-patterns/SKILL.md) skill instead.
- A licence to skip [`tests/api/`](../../tests/api/) — Postman / Apidog collections are not a substitute for regression-gate Playwright tests; they're the **fast-iteration on-ramp**.
- Vendor advocacy — [`tool-comparison.md`](./tool-comparison.md) is honest about each tool's weaknesses, including Apidog's vendor-cloud dependency and Postman's increasingly aggressive paid tiers.
- A guide to the cloud-only features (Postman team workspaces, Apidog cloud collaboration) that require licences this repo does not provision.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`postman.md`](./postman.md) | ✅ v1 | QA Lead |
| [`postman-newman.md`](./postman-newman.md) | ✅ v1 (GitHub Actions + GitLab CI snippets) | QA Platform |
| [`apidog.md`](./apidog.md) | ✅ v1 (CLI + Postman migration) | QA Lead |
| [`rest-assured.md`](./rest-assured.md) | ✅ v1 (Maven deps + JUnit 5 + Allure + JVM-team CI bridge) | QA Lead × Backend Lead |
| [`supertest.md`](./supertest.md) | ✅ v1 (Express / Fastify / NestJS, in-memory DB, JUnit feed) | QA Lead × Backend Lead |
| [`pact.md`](./pact.md) | ✅ v1 (`@pact-foundation/pact` v15 + Broker + `can-i-deploy`) | QA Platform |
| [`tool-comparison.md`](./tool-comparison.md) | ✅ v2 (matrix + RFC scaffold; now covers all 6 tools) | QA Lead |

## Phase / curriculum connection

For the curriculum framing of where API testing fits in the QA learning arc:

- [`training/phase-4-api-and-quality/`](../../training/phase-4-api-and-quality/) — where API testing fundamentals live in the curriculum
- [`training/phase-6-ai-assisted-qa/`](../../training/phase-6-ai-assisted-qa/) — AI-assisted authoring of API tests (`api-fuzzer-generator`, `api-testing-mock`)
- [`.agents/skills/api-patterns/SKILL.md`](../../.agents/skills/api-patterns/SKILL.md) — the **why** behind REST / GraphQL / tRPC choices that drive collection shape

For the manager-tier framing (vendor decision RFC for paid tiers):

- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — use this when proposing Postman Team / Apidog Cloud paid licences
- [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) — worked example of the RFC pattern (visual regression, but the structure transfers)
