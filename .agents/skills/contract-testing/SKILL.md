---
name: contract-testing
description: "Authors consumer-driven contract tests using Pact (or schemathesis for OpenAPI specs) so that integration bugs between services are caught at the boundary instead of in shared E2E. Picks the right approach (Pact for arbitrary REST/GraphQL between bespoke services; schemathesis for OpenAPI-spec-bound APIs), generates the consumer pact, wires the broker, and emits the provider verification job for CI. Use when explicitly asked to 'add contract tests', 'verify the API contract between A and B', 'detect breaking API changes', 'integrate Pact', or before splitting a monolith / adding a microservice. Distinct from api-fuzzer-generator (negative-input fuzzing) and api-security-testing (auth / authz)."
---

# Contract Testing

Integration bugs found in E2E are 10× more expensive than the same bug found in a contract test. This skill is the cheap-find tier: every consumer ↔ provider pair gets a pact, every API change runs the pact verification, breaks fail at PR time.

## When to use this skill

- "Add contract tests for `<service>`"
- "Verify the contract between consumer A and provider B"
- "Detect breaking API changes"
- "Integrate Pact"
- Before splitting a monolith or adding a new microservice

Do **not** use when:
- The user wants to fuzz invalid inputs → use [`api-fuzzer-generator`](../api-fuzzer-generator/SKILL.md).
- The concern is auth / authz → use [`api-security-testing`](../api-security-testing/SKILL.md).
- There's no second service in scope → contract testing has no value with one party.

## Tool decision tree

```
Do you have an OpenAPI spec for the provider ?
├── yes  → schemathesis (one-liner: `schemathesis run <openapi-url>`); plug into CI
└── no   → Pact (consumer-driven; one pact per consumer-provider pair)
   │
   ├── REST                → @pact-foundation/pact (JS/TS)
   ├── GraphQL             → Pact GraphQL plugin
   └── gRPC / messaging    → Pact plugins (Protobuf / Kafka)
```

## How to use it (Pact path)

### Phase 1 — Consumer side: define expectations

```ts
// tests/contract/cart-consumer.pact.test.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
const { like, eachLike, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'web-shop',
  provider: 'cart-service',
  dir: './pacts',
});

test('GET /cart/{id} returns a cart payload', async () => {
  await provider
    .given('cart 42 exists with 1 item')
    .uponReceiving('a request for cart 42')
    .withRequest({ method: 'GET', path: '/cart/42' })
    .willRespondWith({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: like({
        id: 42,
        items: eachLike({ sku: like('SKU-1'), qty: integer(1) }),
        total: like('$10.00'),
      }),
    });

  await provider.executeTest(async (mock) => {
    const res = await fetch(`${mock.url}/cart/42`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].sku).toBe('SKU-1');
  });
});
```

### Phase 2 — Publish the pact

```bash
pact-broker publish ./pacts --consumer-app-version=$GIT_SHA --broker-base-url=$PACT_BROKER_URL
```

### Phase 3 — Provider side: verify

In the provider repo's CI:

```ts
// provider repo
import { Verifier } from '@pact-foundation/pact';

new Verifier({
  providerBaseUrl: 'http://localhost:3000',
  pactBrokerUrl: process.env.PACT_BROKER_URL,
  provider: 'cart-service',
  publishVerificationResult: true,
  providerVersion: process.env.GIT_SHA!,
  stateHandlers: {
    'cart 42 exists with 1 item': () => seedCart(42, [{ sku: 'SKU-1', qty: 1 }]),
  },
}).verifyProvider();
```

### Phase 4 — Wire CI gates

| Job | When | Effect |
|---|---|---|
| Consumer pact tests | every PR in consumer repo | pact regenerated, published |
| Provider verification | every PR in provider repo + every consumer publish (via webhook) | provider PR fails if breaks pact |
| Can-i-deploy | before each deploy | blocks deploy if any consumer hasn't verified |

## How to use it (schemathesis path)

If the provider has an OpenAPI spec (you can author one via [`openapi-spec-generation`](../openapi-spec-generation/SKILL.md)):

```bash
pip install schemathesis
schemathesis run http://localhost:3000/openapi.json --checks all --hypothesis-max-examples=100
```

CI gate: fail PRs that introduce schema-breaking changes.

## Best practices

- **One pact per consumer-provider pair.** Don't bundle.
- **Minimum-viable expectations.** Pact says "what I depend on", not "everything you return". Over-specified pacts are brittle.
- **State handlers seed data; they don't fake the API.** Real database, real responses.
- **`can-i-deploy` is a deploy gate.** Without it, contracts are advisory.
- **Provider versions = git SHA.** No "v1.2.0" — it'll never match reality.

## Related

- [`.agents/skills/openapi-spec-generation/SKILL.md`](../openapi-spec-generation/SKILL.md) — generate / maintain the spec for schemathesis
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../api-fuzzer-generator/SKILL.md) — sibling: validation gaps
- [`.agents/skills/api-security-testing/SKILL.md`](../api-security-testing/SKILL.md) — sibling: auth / authz
- [`.agents/skills/api-testing-mock/SKILL.md`](../api-testing-mock/SKILL.md) — when one party is not yet built
