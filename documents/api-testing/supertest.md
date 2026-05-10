# SuperTest — Node In-Process API Testing Guideline

> How to use [SuperTest](https://github.com/ladjs/supertest) — the Node.js library for asserting HTTP servers — for **in-process** API tests of Node services (Express, Fastify, NestJS, Koa, Hono). SuperTest sits **before** [`tests/api/`](../../tests/api/) (Playwright `request`) on the testing pyramid: it runs against the app **without a network**, so it's the cheap-find tier for handler logic. Pinned to **SuperTest 7.x** (May 2026); flag any API drift in a PR.

## When to reach for SuperTest

Use SuperTest when:

- 🟢 The **service under test is a Node.js HTTP app** (Express, Fastify, NestJS, Koa, Hono, Next.js route handlers)
- ⚡ You want **millisecond-fast** tests that run alongside unit tests in the same `npm test` invocation
- 🧬 The handler has **business logic worth testing in isolation** (validation, branching, error paths) — not just a CRUD pass-through
- 🪞 You can **boot the app from code** (no `docker compose up`, no real DB, no real network) — that's the speed advantage
- 🧪 You're following the test pyramid per [`test-pyramid-audit`](../../.agents/skills/test-pyramid-audit/SKILL.md): SuperTest is integration-tier, [`tests/api/`](../../tests/api/) is E2E-tier

Avoid SuperTest when:

- 🚫 The service isn't Node — use [REST Assured](./rest-assured.md) (JVM) or stay with [`tests/api/`](../../tests/api/)
- 🚫 You need to test **across services** (network, DNS, real auth provider) — that's [`tests/api/`](../../tests/api/) territory
- 🚫 The endpoint logic is mostly DB / external-API I/O with no in-process behaviour to assert (use [Postman](./postman.md) for exploration → [`tests/api/`](../../tests/api/) for regression)
- 🚫 You can't import the app as a module (it's a binary, a separate container, or a Java/Go service)

## Position vs the other API tools

| Concern | SuperTest | [`tests/api/`](../../tests/api/) (Playwright) | [REST Assured](./rest-assured.md) | [Postman](./postman.md) |
|---|---|---|---|---|
| **Process model** | In-process (same Node VM) | Separate process, real HTTP | Separate process, real HTTP | Separate process, real HTTP |
| **Network involved** | ❌ no — in-memory loopback | ✅ yes | ✅ yes | ✅ yes |
| **Speed** | ⚡ ~1-5 ms / request | ~50-200 ms / request | ~50-200 ms / request | n/a (manual) |
| **Best for** | Handler unit/integration | Cross-service regression | JVM service tests | Exploration |
| **DB strategy** | In-memory (Prisma SQLite, Mongo Memory Server) | Real test-tier DB | Test Containers | n/a |
| **CI runtime** | Seconds | Minutes | Minutes | Manual |
| **Deps** | App importable as a module | App reachable over HTTP | Service running on a port | Service running on a port |

The rule of thumb: **SuperTest covers handler logic at unit-test speed**, [`tests/api/`](../../tests/api/) covers cross-service regression. Both pass = ship; only [`tests/api/`](../../tests/api/) passes = handler logic is under-tested; only SuperTest passes = the deployed system is untested. You need both.

## Project layout (when SuperTest tests live in a Node service)

```
<your-node-service>/
├── package.json                  ← express / fastify / nestjs / etc.
├── tsconfig.json
├── src/
│   ├── app.ts                    ← creates and EXPORTS the app, no .listen()
│   ├── server.ts                 ← imports app, calls app.listen() — only run in prod
│   ├── routes/
│   │   ├── cart.ts
│   │   └── checkout.ts
│   └── services/
│       └── cart-service.ts
└── tests/
    ├── helpers/
    │   ├── make-app.ts           ← per-test factory (fresh DB, mocked deps)
    │   └── auth.ts               ← login + token helper
    ├── unit/                     ← Vitest, no SuperTest
    └── integration/              ← SuperTest lives here
        ├── cart.test.ts
        ├── checkout.test.ts
        └── product.test.ts
```

The critical decision: **`app.ts` exports the app; `server.ts` calls `.listen()`**. SuperTest needs the un-listened app — it constructs an ephemeral HTTP server itself for each request and tears it down automatically.

## Install (Node 20+)

```bash
npm install --save-dev supertest @types/supertest
# Choose a runner — Vitest is fastest; the patterns below also work in Jest / Mocha
npm install --save-dev vitest
```

`package.json` script:

```json
{
  "scripts": {
    "test:integration": "vitest run --reporter=junit --outputFile=reports/api/junit.xml tests/integration"
  }
}
```

The output path matches the dashboard contract — see [`README.md`](./README.md) §Conventions and [`postman-newman.md`](./postman-newman.md) §Reporters.

## The exported app pattern

```ts
import express, { type Express } from 'express';
import { cartRouter } from './routes/cart';
import { checkoutRouter } from './routes/checkout';

export function createApp(): Express {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use('/cart', cartRouter);
  app.use('/checkout', checkoutRouter);
  return app;
}
```

```ts
import { createApp } from './app';

const port = Number(process.env.PORT ?? 3000);
createApp().listen(port, () => console.log(`up on :${port}`));
```

## A `@P1` happy path — the 5-step assertion shape in SuperTest

Same shape as [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts), [`postman.md`](./postman.md), and [`rest-assured.md`](./rest-assured.md). When you compare a SuperTest case and the Playwright case side-by-side, the assertions should map one-to-one — divergence is a defect.

```ts
import { describe, expect, test, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import cartAddSchema from '../../schemas/cart-add.schema.json' assert { type: 'json' };
import Ajv from 'ajv';

describe('POST /cart/add — module:cart @P1 @critical', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  test('TC-CART-01: valid product, qty=1 → success + total', async () => {
    const start = Date.now();

    const res = await request(app)
      .post('/cart/add')
      .type('form')
      .send({ product_id: 40, quantity: 1 });

    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);

    expect(elapsed).toBeLessThan(500);

    expect(res.body).toBeTruthy();
    expect(JSON.stringify(res.body).length).toBeGreaterThan(0);

    const ajv = new Ajv();
    const validate = ajv.compile(cartAddSchema);
    expect(validate(res.body), JSON.stringify(validate.errors)).toBe(true);

    expect(res.body.success).toContain('HTC Touch HD');
    expect(res.body.total).toBeTypeOf('string');
  });
});
```

Why the budget is **500 ms** and not 2000 ms: SuperTest is in-process, so the budget is ~10× tighter. Crossing 500 ms in-process means the handler is doing real work (sync I/O, blocking JSON parse) that should be moved off the request thread.

## Negative + boundary cases (table-driven)

```ts
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

describe.each([
  { quantity: 0,    expected: 400, name: 'zero' },
  { quantity: -1,   expected: 400, name: 'negative' },
  { quantity: 9999, expected: 422, name: 'over-stock' },
  { quantity: 'abc' as unknown as number, expected: 400, name: 'type-mismatch' },
])('POST /cart/add — invalid quantity ($name) @P2 @major', ({ quantity, expected }) => {
  test(`returns ${expected}`, async () => {
    const res = await request(createApp())
      .post('/cart/add')
      .type('form')
      .send({ product_id: 40, quantity });
    expect(res.status).toBe(expected);
  });
});
```

Anti-patterns:

- ❌ One `test()` covering 6 quantities with `for` loop — split via `describe.each` so failures pinpoint the row
- ❌ `expect(res.status).toBeLessThan(500)` — accepts everything except 5xx
- ❌ `await new Promise(r => setTimeout(r, 1000))` — there is no async timing in-process; if it "needs a wait", you have a bug

## Auth — login once, reuse the agent

SuperTest's `agent()` keeps cookies across requests, so the standard pattern is one login per test (or per `describe` block via a fixture):

```ts
import request from 'supertest';
import { createApp } from '../../src/app';

export async function loggedInAgent() {
  const agent = request.agent(createApp());
  await agent
    .post('/account/login')
    .type('form')
    .send({ email: process.env.USERNAME, password: process.env.PASSWORD })
    .expect(200);
  return agent;
}
```

**Secrets**: read from `process.env`, never hard-code. In CI, populate from the same secret store the [Newman](./postman-newman.md) lane uses. In local dev, the [`env.loader.ts`](../../env.loader.ts) → `profiles/.env.<ENV>` pipeline already handles this for the rest of the repo; SuperTest can reuse it:

```ts
import 'dotenv/config';                 // OR import the env.loader pattern
```

## Mocking external dependencies

SuperTest is **not** a mock library — it just drives the app. To replace external APIs / DBs, use the same skills the rest of the repo uses:

- HTTP boundaries → `nock` or [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md) (MSW works server-side too)
- DB boundaries → `prisma-mock`, in-memory SQLite, or Mongo Memory Server
- Time → `vi.useFakeTimers()` (Vitest) / `jest.useFakeTimers()` (Jest)
- Auth provider → swap with a stub `app.use('/auth', stubAuthRouter)` in `make-app.ts`

```ts
import nock from 'nock';

beforeEach(() => {
  nock('https://payments.example.com')
    .post('/charges')
    .reply(200, { id: 'ch_test_123', status: 'succeeded' });
});

afterEach(() => {
  expect(nock.isDone()).toBe(true);    // every stub must have been called
  nock.cleanAll();
});
```

The "every stub must be called" assertion is what catches dead code paths — a contract test for your contract test.

## Per-test database isolation

The fastest pattern for SQL services is **one SQLite file per test**, created in a `beforeEach`:

```ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let dir: string;
let prisma: PrismaClient;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cart-'));
  process.env.DATABASE_URL = `file:${dir}/test.db`;
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  prisma = new PrismaClient();
});

afterEach(async () => {
  await prisma.$disconnect();
  rmSync(dir, { recursive: true, force: true });
});
```

Cost: ~50 ms per test for `db push`. If that's too slow, switch to `pg-mem` (PostgreSQL in-memory) or a single shared Postgres container with per-test schemas.

## NestJS-specific glue

NestJS apps need `app.init()` (no `.listen()`). The app instance has an `.getHttpServer()` method that SuperTest accepts directly:

```ts
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import type { INestApplication } from '@nestjs/common';

let app: INestApplication;

beforeAll(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  await app.init();
});

afterAll(async () => { await app.close(); });

test('GET /cart returns empty cart', async () => {
  await request(app.getHttpServer())
    .get('/cart')
    .expect(200)
    .expect(({ body }) => expect(body.items).toEqual([]));
});
```

## CI integration — emit JUnit to the same dashboard path

The dashboard at [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) reads `reports/api/junit.xml`. SuperTest tests count as the "API integration" lane — they show up in the same panel as Newman / [`tests/api/`](../../tests/api/) results.

```yaml
- name: Run SuperTest integration suite
  env:
    USERNAME: ${{ secrets.QA_USERNAME }}
    PASSWORD: ${{ secrets.QA_PASSWORD }}
  run: npm run test:integration
- name: Upload JUnit XML
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: junit-supertest
    path: reports/api/junit.xml
```

Failure routing follows the same loop as the rest of the repo: defects via [`defect-report`](../../.agents/skills/defect-report/SKILL.md), flake triage via [`flaky-test-triage`](../../.agents/skills/flaky-test-triage/SKILL.md), and the dashboard's defect panel reads the bug-label rules in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md).

## SuperTest vs `fetch(app)` (the new alternative)

Node 20.6+ supports `node --experimental-test-runner` and there's an emerging pattern of `fetch(app)` against an `app.fetch` handler (Hono, Bun, Cloudflare Workers). Use that pattern only when:

- The framework natively exposes a `Request → Response` handler (Hono, Workers — yes; Express — no)
- You don't need SuperTest's `.expect(...)` chain (some prefer plain `fetch + assert`)

For Express / Fastify / NestJS in May 2026, **SuperTest is still the canonical choice** because the `request → response` model isn't exposed. Re-evaluate annually.

## Anti-patterns this guideline rules out

- ❌ Calling `.listen()` in `app.ts` (couples the app to a port; breaks SuperTest)
- ❌ Using SuperTest against a `localhost:3000` URL (`request('http://localhost:3000')`) — that's not in-process, you've lost the speed and the deterministic teardown; promote to [`tests/api/`](../../tests/api/) instead
- ❌ Mixing unit + integration in `tests/unit/` so you can't selectively run the fast suite
- ❌ Real DB in CI (use in-memory; if you need real Postgres, use Test Containers and accept the 10× slowdown)
- ❌ Sharing one `agent` across all tests (auth state leak; tests pass in isolation but fail in suite, classic flake-in-disguise)
- ❌ Skipping the schema-validation step "because we typed it in TS" — the wire format and the type are not the same thing; validate JSON Schema

## Promotion path

SuperTest tests **complement** [`tests/api/`](../../tests/api/); they don't migrate to it. The relationship:

| Lane | What it asserts | Speed | When it runs |
|---|---|---|---|
| **SuperTest** | Handler logic, validation branches, error paths, schema | ~3 ms / test | Every `npm test`, pre-commit |
| **[`tests/api/`](../../tests/api/)** | Cross-service contract, real network, real auth, real DB | ~100 ms / test | Every PR, CI |
| **[Postman](./postman.md) / [Apidog](./apidog.md)** | Stakeholder demo, exploration | manual | Ad-hoc |
| **[Pact](./pact.md)** | Provider–consumer contract guarantee | ~10 ms / test | Every PR, both sides |

The combination is the test pyramid in action: many SuperTest cases per route → fewer Playwright cases for the happy path → one Pact pact for the cross-service guarantee. See [`test-pyramid-audit`](../../.agents/skills/test-pyramid-audit/SKILL.md) for how to measure the shape.

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md), [`apidog.md`](./apidog.md) — GUI authoring lanes
- [`rest-assured.md`](./rest-assured.md) — JVM equivalent (out-of-process)
- [`pact.md`](./pact.md) — contract testing layer that complements SuperTest
- [`tool-comparison.md`](./tool-comparison.md) — when-to-use matrix (now includes SuperTest)
- [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — the 5-step assertion shape, E2E flavour
- [`automation-framework/assertions.md`](../automation-framework/assertions.md) — the underlying `Assertions` helper
- [`.agents/skills/api-testing-mock/SKILL.md`](../../.agents/skills/api-testing-mock/SKILL.md), [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`.agents/skills/test-pyramid-audit/SKILL.md`](../../.agents/skills/test-pyramid-audit/SKILL.md) — agent skills that complement SuperTest
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — tag taxonomy (P1..P4 + severity)
