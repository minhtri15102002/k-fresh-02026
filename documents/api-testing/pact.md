# Pact — Consumer-Driven Contract Testing Guideline

> How to use [Pact](https://docs.pact.io/) to catch **integration bugs at the boundary** — when consumer A and provider B drift apart — without spinning up a shared E2E environment. Pinned to **`@pact-foundation/pact` v15.x** (May 2026); Pact Broker / PactFlow tested as of the same date.
>
> **Companion to** the existing [`contract-testing`](../../.agents/skills/contract-testing/SKILL.md) skill (which authors pacts on demand). This file is the **operational guideline**: when to invest, how to fit Pact into this repo's CI + dashboard, what the team gets vs. what it pays.

## Why this exists separately from `tests/api/`

[`tests/api/`](../../tests/api/) covers a service against a deployed environment. That catches contract bugs **after** they've shipped. Pact catches them **before**:

- **Consumer side** records what it *expects* the provider to return → emits a `*.json` pact file.
- **Provider side** replays every consumer's pact against itself → fails if it can't satisfy them.
- **Pact Broker** is the meeting point — versioned pacts, `can-i-deploy` gating, webhooks to both CIs.

The result: integration bugs are caught **at PR time**, in the consumer's repo *or* the provider's repo, with a unit-test-fast feedback loop. Same family as [SuperTest](./supertest.md) (in-process) and [REST Assured](./rest-assured.md) (out-of-process service tests) — just at a different layer of the pyramid.

## When to reach for Pact

Use Pact when:

- 🔗 You have **two or more services** with **bespoke contracts** (no shared OpenAPI spec, or the spec is aspirational not enforced)
- 🌐 The services are **owned by different teams / repos / release cadences** — one can deploy without the other
- 💔 You've felt the pain of **breaking a downstream consumer at deploy** (the "did anyone test against the new shape?" Slack thread)
- 🍡 You're **splitting a monolith** into microservices — Pact is the cheapest insurance against a regression here
- 🧪 You're a **consumer with multiple providers** and want to know which one broke when CI fails

Avoid Pact when:

- 🚫 The provider has an **OpenAPI spec that is the source of truth** — use [schemathesis](https://schemathesis.readthedocs.io/) instead (the `contract-testing` skill picks this path automatically; see its decision tree)
- 🚫 There's only **one consumer and one provider, both owned by your team, in the same repo** — the overhead exceeds the win; use [`tests/api/`](../../tests/api/) + [SuperTest](./supertest.md)
- 🚫 The interaction is **publish/subscribe with broadcast semantics** ("any subscriber can join") — Pact's consumer-driven model assumes you know your consumers
- 🚫 The team **isn't ready to operate a Broker** (or pay for PactFlow) — pacts on disk become stale immediately

## Position in this repo's testing stack

```
                            What it catches              When it runs
                            ───────────────              ────────────
Unit tests (Vitest/Jest)    Pure logic                   pre-commit
SuperTest                   Handler integration          npm test
Pact (consumer)             Expected provider shape      consumer's PR
Pact (provider verify)      "Can we still satisfy A?"    provider's PR
tests/api/ (Playwright)     Real network, real auth      every PR
Postman/Apidog              Exploration, demos           ad-hoc
```

Pact lives **between** the in-process tests (SuperTest, REST Assured) and the cross-service E2E tests ([`tests/api/`](../../tests/api/)). It's the **only layer** that fails fast on a contract drift without a shared environment.

| Concern | Pact | [`tests/api/`](../../tests/api/) | [SuperTest](./supertest.md) | [Postman](./postman.md) |
|---|---|---|---|---|
| **Scope** | Consumer ↔ provider contract | Cross-service E2E | In-process handler | Exploration |
| **Network** | Mocked (consumer) / real (provider verify) | Real | None | Real |
| **Speed** | ~10 ms / interaction | ~100 ms / case | ~3 ms / case | manual |
| **Catches** | Schema drift between services | Real-env regression | Handler logic | Eyeball |
| **Where pacts live** | Pact Broker / PactFlow | n/a | n/a | n/a |
| **CI gate** | `can-i-deploy` — both sides | Test pass/fail | Test pass/fail | n/a |
| **Cost** | Broker hosting + cognitive load | Already in repo | Cheap | Free GUI |

## Tool decision — when to use which Pact variant

```
What protocol is the boundary?
├── REST / HTTP+JSON  → @pact-foundation/pact (this guideline)
├── GraphQL           → @pact-foundation/pact + GraphQL plugin
├── gRPC              → Pact Plugin Framework + protobuf plugin
└── Async (Kafka, SNS)→ Pact + message plugin (separate doc; out of scope here)
```

For OpenAPI-spec-bound APIs, prefer **schemathesis** (handled by [`contract-testing`](../../.agents/skills/contract-testing/SKILL.md) skill, decision tree). Pact pays off when the spec doesn't exist or isn't trusted.

## Layout — pacts in the consumer repo

```
<consumer-app>/
├── package.json                             ← @pact-foundation/pact ^15
├── pacts/                                   ← generated pact files (committed OR uploaded to broker)
│   ├── web-shop-cart-service.json
│   └── web-shop-checkout-service.json
├── tests/
│   └── contract/
│       ├── cart-consumer.pact.test.ts       ← one file per provider
│       ├── checkout-consumer.pact.test.ts
│       └── helpers/
│           └── pact-config.ts
└── reports/
    └── pact/
        └── junit.xml                        ← dashboard feed
```

## Layout — provider verification in the provider repo

```
<provider-service>/
├── package.json                             ← @pact-foundation/pact ^15
├── tests/
│   └── verification/
│       ├── verify-pacts.test.ts             ← single file: load pacts → replay → assert
│       └── states/
│           └── provider-states.ts           ← "given a cart with 3 items" setup hooks
└── pact-broker.yml                           ← URL + auth for the broker (env-driven)
```

## Install (consumer side)

```bash
npm install --save-dev @pact-foundation/pact
```

Vitest config (in `vitest.config.ts`) — Pact tests are slow to start (~2 s for the mock server), so isolate them:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/contract/**/*.pact.test.ts'],
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },  // pact mock server is per-process
    reporters: ['default', ['junit', { outputFile: 'reports/pact/junit.xml' }]],
    testTimeout: 30_000,
  },
});
```

## Consumer-side pact — the canonical pattern

This mirrors the example in the [`contract-testing`](../../.agents/skills/contract-testing/SKILL.md) skill, with the 5-step assertion shape applied so the contract case can co-exist with [`tests/api/`](../../tests/api/) and Postman pinning the same expectations.

```ts
// tests/contract/cart-consumer.pact.test.ts
import { describe, expect, test } from 'vitest';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import { CartClient } from '../../src/clients/cart-client';

const { like, eachLike, integer, regex, decimal, string } = MatchersV3;

describe('Cart consumer ↔ Cart provider — module:cart', () => {
  const provider = new PactV4({
    consumer: 'web-shop',
    provider: 'cart-service',
    dir: './pacts',
    logLevel: 'warn',
  });

  test('@P1 @critical — GET /cart/{id} returns a populated cart', async () => {
    await provider
      .addInteraction()
      .given('a cart 42 with one HTC Touch HD at qty 1')
      .uponReceiving('a request for cart 42')
      .withRequest('GET', '/cart/42', (b) =>
        b.headers({ Accept: 'application/json' })
      )
      .willRespondWith(200, (b) =>
        b
          .headers({ 'Content-Type': regex(/application\/json/, 'application/json; charset=utf-8') })
          .jsonBody({
            id: integer(42),
            total: decimal(146.00),
            currency: regex(/^[A-Z]{3}$/, 'USD'),
            items: eachLike({
              productId: integer(40),
              name: string('HTC Touch HD'),
              quantity: integer(1),
              price: decimal(146.00),
            }, { min: 1 }),
          })
      )
      .executeTest(async (mockServer) => {
        const client = new CartClient(mockServer.url);
        const start = Date.now();
        const cart = await client.getCart(42);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(2000);
        expect(cart).toMatchObject({
          id: 42,
          items: expect.arrayContaining([
            expect.objectContaining({ name: 'HTC Touch HD', quantity: 1 }),
          ]),
        });
      });
  });
});
```

What this **is**: a verification that the *client code* (`CartClient`) sends a request the provider can satisfy and parses the response correctly.

What this **is not**: a test of the provider. The mock server returns whatever you describe — the value is in the contract file, which the provider must later prove it can produce.

### Matchers — get this right or pay for it later

The number-one mistake new Pact users make: writing exact-value expectations the provider can't reproduce. Use matchers liberally.

| Matcher | When |
|---|---|
| `like(x)` | "Type-shape match" — `like(42)` accepts any integer |
| `eachLike(x, { min: 1 })` | Array of like-shaped items, at least N |
| `integer(42)` | Specifically an integer |
| `decimal(146.00)` | Specifically a number-with-decimals |
| `regex(/.../, 'sample')` | When the format matters but the value doesn't |
| `string('foo')` | "Some string" — DO NOT use literal strings as values |
| `iso8601DateTime()` | Use the type-helper, never a regex you wrote yourself |
| `uuid()` | Same |

Anti-patterns:

- ❌ Pact body of `{ id: 42, name: 'HTC Touch HD' }` — pins the provider to literally `42` and that exact name. Provider verification will fail on any other DB seed.
- ❌ One `addInteraction()` covering the happy path and the 404 — split into two interactions; one set of headers/body per interaction
- ❌ Asserting in the consumer test that the response has 5 items — that's data, not contract. The contract is "an array of cart items"; quantity is provider state, not contract.

## Provider-side verification — the canonical pattern

```ts
// tests/verification/verify-pacts.test.ts (provider repo)
import { describe, test } from 'vitest';
import { Verifier } from '@pact-foundation/pact';
import { createApp } from '../../src/app';

describe('Provider verification — cart-service', () => {
  test('honours all consumer pacts', async () => {
    const app = createApp();
    const server = app.listen(0);
    const port = (server.address() as { port: number }).port;

    try {
      await new Verifier({
        provider: 'cart-service',
        providerBaseUrl: `http://127.0.0.1:${port}`,
        pactBrokerUrl: process.env.PACT_BROKER_BASE_URL,
        pactBrokerToken: process.env.PACT_BROKER_TOKEN,
        publishVerificationResult: process.env.CI === 'true',
        providerVersion: process.env.GIT_COMMIT,
        providerVersionBranch: process.env.GIT_BRANCH,
        consumerVersionSelectors: [
          { mainBranch: true },
          { deployedOrReleased: true },
        ],
        stateHandlers: {
          'a cart 42 with one HTC Touch HD at qty 1': async () => {
            await seedCart({ id: 42, items: [{ productId: 40, quantity: 1 }] });
          },
        },
      }).verifyProvider();
    } finally {
      server.close();
    }
  }, 120_000);
});
```

The `stateHandlers` map is where contract testing earns its money: every consumer's `.given(...)` becomes a setup hook the provider must implement. If a state handler is missing, verification fails — the consumer told you about a use case the provider didn't know existed.

## Pact Broker / PactFlow

You **must** run a broker. Pacts on disk are dead the moment a consumer is deployed; without a broker, you have no `can-i-deploy` gate.

Two paths:

| Path | Cost | When |
|---|---|---|
| **Self-hosted Pact Broker** | Operations time + a Postgres | Existing Kubernetes / Docker infra; data residency rules |
| **PactFlow** (SaaS, by SmartBear) | $0 (5 contracts) → $$ | Want the broker, want webhooks, don't want to operate it |

For paid-tier decisions, run the [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) skill against [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — same shape this repo uses for [Postman](./postman.md) Team and [Apidog](./apidog.md) Cloud decisions.

### Broker URL hygiene

```bash
# Consumer + provider both read these from CI secrets, never from a checked-in file
export PACT_BROKER_BASE_URL=https://acme.pactflow.io
export PACT_BROKER_TOKEN=<from-secret-store>
```

### `can-i-deploy` — the gate

This is the whole point of a broker. **Before** any deploy, both consumer and provider ask the broker: *"With my current version + the versions in `<env>`, do all pacts pass?"*

```bash
npx pact-broker can-i-deploy \
  --pacticipant web-shop \
  --version "$GIT_COMMIT" \
  --to-environment production
# exit 0 → deploy
# exit 1 → block; broker explains which pact is broken
```

Wire this into the deploy workflow as a required step. No `can-i-deploy`, no Pact value.

## CI integration — both sides

### Consumer repo

```yaml
name: contract-tests
on: [push, pull_request]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      - name: Run consumer pact tests
        run: npx vitest run --config vitest.pact.config.ts

      - name: Publish pacts to broker
        if: github.ref == 'refs/heads/main'
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN:    ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version="$GITHUB_SHA" \
            --branch="${GITHUB_REF_NAME}"

      - name: can-i-deploy (gate before merging into deploy branch)
        if: github.ref == 'refs/heads/main'
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN:    ${{ secrets.PACT_BROKER_TOKEN }}
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant web-shop \
            --version="$GITHUB_SHA" \
            --to-environment production

      - name: Upload JUnit XML for dashboard
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-pact-consumer
          path: reports/pact/junit.xml
```

### Provider repo

```yaml
name: provider-verification
on:
  push:
    branches: [main]
  pull_request:
  repository_dispatch:                       # broker triggers when a new pact arrives
    types: [contract_requiring_verification_published]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci

      - name: Verify pacts
        env:
          PACT_BROKER_BASE_URL: ${{ secrets.PACT_BROKER_BASE_URL }}
          PACT_BROKER_TOKEN:    ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT:           ${{ github.sha }}
          GIT_BRANCH:           ${{ github.ref_name }}
        run: npx vitest run tests/verification/

      - name: Upload JUnit XML for dashboard
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: junit-pact-provider
          path: reports/pact/junit.xml
```

The dashboard panel is the same one Newman, [`tests/api/`](../../tests/api/), and [SuperTest](./supertest.md) feed; the `module:*` label on a failing verification follows the rules in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md), and the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill formats the issue.

## Operational patterns

### Pact versioning rule

| Event | What gets a new version |
|---|---|
| Consumer changes `client.ts` | Consumer pact (republish) |
| Provider changes a handler | Provider verification (re-run) |
| Both change in the same PR | Coordinate; merge consumer first **only after** provider verifies on a branch deploy |

### Pending pacts (the "we just added a consumer" case)

When a new consumer publishes a pact, the provider's main verification job will fail. Use the `--enable-pending` flag so new pacts are reported but don't break the build until they've been verified at least once. PactFlow's UI surfaces this clearly.

### Webhooks (the "fast feedback" pattern)

Configure the broker to ping the provider's CI when a new consumer pact lands. Without this, the provider only re-verifies on its own commits — drift can hide for weeks.

## When verification fails

The triage flow is the same as the rest of the repo:

1. **Read the broker output** — it tells you which interaction, which mismatch (status / header / body field).
2. **Decide the side**: did the consumer's expectation become unrealistic, or did the provider regress? The broker shows both versions; the diff usually makes it obvious.
3. **If consumer drift**: update the consumer pact, ship the consumer change behind a feature flag, ask the provider to re-verify on a branch first.
4. **If provider drift**: file a defect via [`defect-report`](../../.agents/skills/defect-report/SKILL.md) with `module:<provider>` and severity matching the consumer impact. The provider's CI will already have failed — link the failed run in the issue.
5. **If a flake** (state handler timing, mock server port collision): use [`flaky-test-triage`](../../.agents/skills/flaky-test-triage/SKILL.md) — the same triage as a flaky Playwright spec.

## Anti-patterns this guideline rules out

- ❌ Treating the pact file as a test of the provider — it's a *contract*, not a test
- ❌ Hand-editing pact JSON files (regenerate from the consumer test instead)
- ❌ Pacts on disk only, no broker — pacts go stale silently; verification can't be triggered by consumer changes
- ❌ Skipping `can-i-deploy` — the whole insurance value is in this gate
- ❌ One Pact for "the API" — Pact is per consumer-provider pair; if you have 3 consumers of `cart-service`, you have 3 pacts
- ❌ Using literal values where matchers belong — pins the provider to the test seed
- ❌ Verifying against a static fixture instead of a real provider instance — defeats the point; provider verification must hit real provider code
- ❌ Treating Pact as a substitute for [`tests/api/`](../../tests/api/) — Pact is contract-only, no auth, no real network, no real DB. Both layers stay.

## Promotion path

Pact tests **never migrate** to [`tests/api/`](../../tests/api/) — they cover a different concern. The healthy pattern over time:

```
   Quarter 0           Quarter 1            Quarter 2+
   ─────────           ─────────            ──────────
  Single team,    →   Split into        →  N consumers,
  monolith            consumer +            M providers,
  (no Pact)           provider              Pact + Broker
                      (Pact starts here)    (can-i-deploy
                                             is a release gate)
```

If your `tests/api/` suite is mostly catching contract drift between two of your own services, you're paying the wrong tier for the wrong bug — move that coverage to Pact.

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md), [`apidog.md`](./apidog.md) — exploration / stakeholder lanes
- [`postman-newman.md`](./postman-newman.md) — CLI runner for collections (different layer; runs alongside)
- [`rest-assured.md`](./rest-assured.md), [`supertest.md`](./supertest.md) — process-level API tests; Pact sits between them and `tests/api/`
- [`tool-comparison.md`](./tool-comparison.md) — when-to-use matrix (now includes Pact)
- [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — the 5-step assertion shape in TypeScript
- [`automation-framework/assertions.md`](../automation-framework/assertions.md) — the underlying `Assertions` helper
- [`.agents/skills/contract-testing/SKILL.md`](../../.agents/skills/contract-testing/SKILL.md) — companion skill that authors pacts on demand (Pact + schemathesis decision tree)
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) — adjacent (negative-input fuzzing, auth/authz) — Pact does **not** cover either
- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — for Pact Broker self-host vs PactFlow paid decisions
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md), [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — labels & tags apply identically to Pact failures
