# Module 19 — Models & Test Data

> Phase 3 · Effort: 3h · Prerequisites: Module 18

## Learning objectives

After this module you can:

- Define a TypeScript **interface** for a domain entity (User, Address, Product, Coupon, etc.).
- Distinguish **deterministic fixtures** from **factories** and choose the right one.
- Use this repo's `data/*-data.ts` and `*-data.helper.ts` patterns.
- Avoid the "shared mutable seed account" anti-pattern.
- Understand `Constants` vs `Messages` vs `Translations`.

## Why it matters

Bad test data makes tests flaky, order-dependent, and slow. Good test data makes them deterministic, parallel-safe, and self-documenting. The difference is mostly architectural.

## Concepts

### Models — `models/*.ts`

```ts
// models/user.ts
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword?: string;
}
```

Every page method takes typed models — never `(string, string, string, string)` tuples.

```ts
async fillRegistrationForm(user: UserProfile): Promise<void> { … }
```

### Test data — two flavors

| Flavor | File pattern | Use when |
|---|---|---|
| **Deterministic fixtures** | `data/<entity>-data.ts` | Same value across runs (seed product, known coupon) |
| **Factory functions** | `data/<entity>-data.helper.ts` | Unique value per test (new user, new email) |

```ts
// data/user-data.ts (deterministic)
export const adminUser: UserProfile = {
  firstName: 'Admin', lastName: 'Root',
  email: 'admin@example.com',
  telephone: '+1-555-0001',
  password: 'AdminPass123!',
};

// data/user-data.helper.ts (factory)
import { faker } from '@faker-js/faker';

export function generateUserProfileData(): UserProfile {
  const firstName = faker.person.firstName();
  return {
    firstName,
    lastName: faker.person.lastName(),
    email: `${firstName.toLowerCase()}.${Date.now()}@example.com`,
    telephone: faker.phone.number(),
    password: 'Demo@1234',
    confirmPassword: 'Demo@1234',
  };
}
```

### Why factories beat shared seed accounts

| Shared seed user | Per-test factory |
|---|---|
| Tests fight over its state | Each test owns its own state |
| Cleanup race conditions | No cleanup needed |
| Flaky in parallel | Parallel-safe by construction |
| Backwards-bound to staging data | Portable across envs |

Use seeds **only** for read-only entities (e.g. an admin token used by every test).

### `Constants` vs `Messages` vs `Translations`

| File | Holds | Example |
|---|---|---|
| `utilities/constants.ts` | Non-localized config: URLs, timeouts, language | `Constants.BASE_URL`, `Constants.TIMEOUTS.PAGE_EVENT_LOAD` |
| `data/messages-data.ts` | Static UI strings (errors, labels, toast text) | `Messages.REGISTER_ERROR_EMAIL` |
| `translations/translations.ts` | Locale-aware UI text | `TRANSLATIONS.labels[Constants.LANGUAGE].btnLogin` |

Rule: **never inline a UI string in a page or spec.** Pull from `Messages` or `TRANSLATIONS`.

### Loading data per environment

```ts
// data/product-data.helper.ts
export function getEnvProduct(): Product {
  switch (Constants.ENV) {
    case 'qa':      return qaProduct;
    case 'uat':     return uatProduct;
    case 'staging': return stagingProduct;
  }
}
```

### Currency, dates, and tricky values

This repo has utilities to keep tests deterministic:

```ts
import { Currency } from '@utilities/currency';

const value: number = Currency.parse('$1,299.99');   // 1299.99
const display: string = Currency.format(1299.99);    // "$1,299.99"
```

```ts
import { DateUtil } from '@utilities/date';   // example
const tomorrow = DateUtil.addDays(new Date(), 1);
```

Don't compare formatted strings ever — parse first, then assert on the number.

### Schema validation for API responses

```ts
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  price: z.number().positive(),
});

const product = ProductSchema.parse(await res.json());
// product is now strongly typed AND validated
```

Use Zod (or io-ts) when API contract drift would cause subtle bugs.

## Hands-on lab

1. Add `models/coupon.ts` with `Coupon`, `CouponType`.
2. Add `data/coupon-data.ts` with 3 deterministic coupons.
3. Add `data/coupon-data.helper.ts` with a `generateCoupon(opts?)` factory using faker.
4. Refactor a test to swap a hardcoded user for `generateUserProfileData()`. Run it 3× in parallel. Confirm it still passes.
5. Find one inline UI string in `pages/ui/`. Move it to `Messages` or `TRANSLATIONS`. PR.

## Self-check

- [ ] Why does the repo separate `data/<entity>-data.ts` from `data/<entity>-data.helper.ts`?
- [ ] When is it OK to use a shared seed user across tests?
- [ ] Why does `Currency.parse` exist?
- [ ] If the SUT changes the German translation of "Add to Cart", which file changes?

## Further reading

- This repo's `models/`, `data/`, `utilities/currency.ts`
- Zod — github.com/colinhacks/zod
- faker.js — fakerjs.dev

---

**Prev:** [18 — Assertion routing](./18-assertion-routing.md) · **Next:** [20 — Tagging & multi-environment](./20-tagging-and-multi-environment.md)
