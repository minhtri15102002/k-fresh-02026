# Module 07 — TypeScript for QA

> Phase 1 · Effort: 5h · Prerequisites: basic JS, Module 06

## Learning objectives

After this module you can:

- Read and write TypeScript at the level used in `pages/`, `tests/`, `utilities/`.
- Define **interfaces** and **type aliases** for test data and API responses.
- Use **generics** to write helpers that work across types.
- Use `async/await` correctly and avoid common Promise pitfalls.
- Apply TypeScript **decorators** (`@step`) the way this repo does.
- Pass `npm run typecheck` on first try.

## Why it matters

Playwright is TypeScript-first. Strong types are your second pair of eyes — they catch typos in locators, wrong arguments to `commonPage.fill`, and bad cart-data shapes *before* the test runs. This repo turns on `noUncheckedIndexedAccess` and forbids `any`; that costs nothing once you're fluent.

## Concepts

### Variables & primitives

```ts
const url: string = 'https://example.com';
let attempts: number = 0;
const isReady: boolean = false;
const tags: string[] = ['@smoke', '@regression'];
const tuple: [number, string] = [1, 'one'];
```

### Interfaces vs type aliases

```ts
// Interface — preferred for object shapes (extendable)
export interface User {
  id: number;
  email: string;
  isAdmin?: boolean;        // optional
}

// Type alias — for unions, intersections, primitives
export type Severity = 'critical' | 'major' | 'minor' | 'trivial';
export type Tagged<T> = T & { tags: string[] };
```

This repo's `models/` directory holds all the interfaces — see `models/user.ts`, `models/product.ts`.

### Generics

```ts
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { last = e; }
  }
  throw last;
}

const result = await withRetry(() => fetch('/api/cart').then(r => r.json() as Promise<Cart>));
```

`T` lets the helper return whatever `fn` returns, with full type-safety.

### Async / await

```ts
// good
async function login(user: User): Promise<void> {
  await this.commonPage.fill(this.inputEmail, user.email);
  await this.commonPage.fill(this.inputPassword, user.password);
  await this.commonPage.click(this.btnLogin);
}

// pitfall — forgetting await
function broken() {
  this.commonPage.click(this.btnLogin);   // returns Promise<void> immediately
  // assertion runs before click resolves → race
}
```

Rule: **every `Promise` must be awaited or returned**. ESLint enforces this.

### Decorators (this repo)

```ts
import { step } from '@utilities/logging';

class HomePage {
  @step('Navigate to Home')
  async navigate(): Promise<void> {
    await this.page.goto('/');
  }
}
```

`@step` wraps the method in a Playwright `test.step(...)` so it shows up as a folded section in the trace and Allure report. Every public action method in `pages/` is decorated.

### Strictness flags this repo enables

- `strict: true`
- `noUncheckedIndexedAccess: true` — `arr[0]` is `T | undefined`, forces nullish handling
- `noImplicitAny: true`
- `exactOptionalPropertyTypes: true`

Practical effect: `process.env.FOO` is `string | undefined`, not `string`.

### Type narrowing patterns

```ts
function getEmail(input: string | { email: string }): string {
  if (typeof input === 'string') return input;
  return input.email;
}
```

```ts
const product = products.find(p => p.id === 42);
if (!product) throw new Error('Product 42 missing');
console.log(product.price);   // narrowed to Product
```

### Path aliases

This repo's `tsconfig.json` defines:

```jsonc
"paths": {
  "@pages/*": ["pages/*"],
  "@locators/*": ["locators/*"],
  "@models/*": ["models/*"],
  "@utilities/*": ["utilities/*"],
  "@data/*": ["data/*"]
}
```

Use them. `import { User } from '@models/user'` beats `'../../models/user'`.

## Hands-on lab

1. Add a new interface `Coupon` to `models/coupon.ts` (fields: `code: string; percentage: number; minSpend?: number; expiresAt: Date;`).
2. Create `data/coupon-data.ts` exporting `couponFixtures: Coupon[]` with 3 valid + 2 expired entries.
3. Write a generic helper `pickRandom<T>(items: T[]): T` in `utilities/random.ts` and unit-test the type signature mentally.
4. Add a `@step('Apply coupon')` method to `pages/ui/cart-page.ts` that takes a `Coupon` (don't worry about real implementation — focus on types).
5. Run `npm run typecheck`. It must pass.

## Self-check

- [ ] Difference between `interface User { … }` and `type User = { … }`.
- [ ] What does `arr[0]` return under `noUncheckedIndexedAccess: true`?
- [ ] Write a generic function `first<T>(arr: T[]): T | undefined`.
- [ ] Why does this repo prefer `process.env['STRICT_TAGS']` over `process.env.STRICT_TAGS`?

## Further reading

- TypeScript Handbook — typescriptlang.org/docs/handbook/intro.html
- *Total TypeScript* (Matt Pocock) — free essentials tier
- Playwright type docs — playwright.dev/docs/api/class-test

---

**Prev:** [06 — Git & GitHub](./06-git-and-github-for-qa.md) · **Next:** [08 — Web fundamentals](./08-web-fundamentals-html-css-dom.md)
