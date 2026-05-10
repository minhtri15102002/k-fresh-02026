# Module 21 — API Testing with Playwright

> Phase 4 · Effort: 4h · Prerequisites: Module 09, Module 14

## Learning objectives

After this module you can:

- Use Playwright's `request` fixture for direct HTTP testing.
- Authenticate, send JSON/form bodies, and parse responses with type safety.
- Validate response schemas with Zod (or equivalent).
- Wrap API tests in this repo's `tests/api/` conventions.

## Why it matters

Pure API tests are 10–50× faster than UI tests and catch contract bugs UI tests cannot see. Every E2E flow that doesn't *strictly* need a browser should be an API test instead.

## Concepts

### The `request` fixture

```ts
import { test, expect } from '@playwright/test';

test('cart API returns 200', async ({ request }) => {
  const res = await request.get('/api/cart');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/json');
  const body = await res.json();
  expect(body).toMatchObject({ items: expect.any(Array) });
});
```

`request` is **isolated per test** — fresh cookie jar, fresh storage.

### Methods

```ts
await request.get(url, { headers, params });
await request.post(url, { data });             // JSON body
await request.post(url, { form });             // form-urlencoded
await request.post(url, { multipart: { file: { … } } });
await request.put(url, { data });
await request.patch(url, { data });
await request.delete(url);
```

### Authentication options

#### Per-request `Authorization` header

```ts
const res = await request.get('/api/admin/users', {
  headers: { Authorization: `Bearer ${token}` },
});
```

#### Reusing auth via `extraHTTPHeaders`

```ts
// playwright.config.ts
use: {
  extraHTTPHeaders: { Authorization: `Bearer ${process.env.API_TOKEN}` },
}
```

#### Login → save state → reuse

```ts
// global-setup.ts
const ctx = await request.newContext();
await ctx.post('/auth/login', { data: { email, password } });
await ctx.storageState({ path: 'storage/api.json' });
```

### Schema validation

```ts
import { z } from 'zod';

const CartSchema = z.object({
  id: z.number().int(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().int().positive(),
    price: z.number().nonnegative(),
  })),
  total: z.number().nonnegative(),
});

test('cart schema is intact', async ({ request }) => {
  const res = await request.get('/api/cart');
  const cart = CartSchema.parse(await res.json());   // throws on drift
  expect(cart.total).toBeGreaterThanOrEqual(0);
});
```

Schema validation is your **contract test**. The API team's docs may lie; the schema doesn't.

### Negative testing

```ts
test('cart rejects negative quantity', async ({ request }) => {
  const res = await request.post('/api/cart/items', {
    data: { productId: 1, quantity: -5 },
  });
  expect(res.status()).toBe(400);
  const error = await res.json();
  expect(error.code).toBe('VALIDATION_ERROR');
  expect(error.field).toBe('quantity');
});
```

Cover: missing field, wrong type, boundary violation, unauthenticated, unauthorized, conflict.

### This repo's `tests/api/` conventions

```
tests/api/
├── test-cart.spec.ts          ← cart CRUD
├── test-security.spec.ts      ← REQ-SEC-01 coverage
└── test-auth.spec.ts (e.g.)   ← login, logout, refresh
```

API tests use the `apiPage` fixture from `pages/base-page.ts`:

```ts
import { test } from '@pages/base-page';

test('TC01 - admin can create a coupon',
  { tag: ['@P2', '@major', '@regression', '@api', '@admin'] },
  async ({ apiPage }) => {
    await apiPage.loginAsSeller();
    const res = await apiPage.createCoupon({ code: 'WELCOME10', percentage: 10 });
    await apiPage.verifyCouponCreated(res);
  });
```

Notice: the spec calls `apiPage.verifyX()` — same architecture rule as UI (no raw `expect` in spec).

### Performance bonus

```ts
test('cart endpoint p95 < 500ms', async ({ request }) => {
  const latencies: number[] = [];
  for (let i = 0; i < 50; i++) {
    const start = Date.now();
    const res = await request.get('/api/cart');
    expect(res.ok()).toBeTruthy();
    latencies.push(Date.now() - start);
  }
  latencies.sort((a, b) => a - b);
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  expect(p95).toBeLessThan(500);
});
```

Lightweight perf checks belong in API tests; heavy load testing belongs in dedicated tools (k6, Locust).

## Hands-on lab

1. Read `tests/api/test-cart.spec.ts`. List every endpoint covered.
2. Write a new spec `tests/api/test-coupon.spec.ts` covering: create / read / apply / expire / delete coupon. Use the `apiPage` fixture; verifications go in `pages/api/api-page.ts` as `verify<X>` methods.
3. Add a Zod schema for the coupon response. Use it inside the verify methods.
4. Add 3 negative tests (invalid percentage, expired date, unauthorized creation).

## Self-check

- [ ] Why is `request` test-scoped instead of worker-scoped?
- [ ] When do you reach for `extraHTTPHeaders` vs per-request `headers`?
- [ ] What does Zod buy you over `expect(body.x).toBe(...)`?
- [ ] You added a new field to the API response — what test catches the drift?

## Further reading

- playwright.dev — `APIRequestContext`
- This repo's `pages/api/api-page.ts`
- Zod docs

---

**Next:** [22 — Hybrid UI + API tests](./22-hybrid-ui-api-tests.md) · **Up:** [Phase 4 README](./README.md)
