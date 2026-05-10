---
name: test-data-generator
description: "Authors test data in this repo's conventions: typed TypeScript fixtures under data/ that import from models/ and follow the Faker-driven pattern in data/data-loader.ts. Picks the right shape (static fixture, factory function, Faker-driven generator, JSON file consumed by data-driven tests), generates valid + boundary + invalid variants for the test-design-techniques skill, and wires them into the spec via the existing import paths (`@data/...`, `@models/...`). Use when explicitly asked to 'generate test data', 'create a fixture for X', 'add boundary values for Y', or when test-design-techniques produces an EP/BVA matrix that needs concrete data. Wraps prompts/core/test-data-generator.md."
---

# Test Data Generator

Hand-rolled fixtures rot fast: hard-coded users expire, magic strings drift from production schemas, boundary cases get forgotten. This skill generates fixtures that match the repo's existing conventions so they stay alive.

---

## When to use this skill

Trigger on:
- "Generate test data for X"
- "Create a fixture for the cart"
- "Add boundary values for the email field"
- "I need 50 product records"
- After [`test-design-techniques`](../test-design-techniques/SKILL.md) emits an EP/BVA matrix

Do **not** use when:
- The data is sensitive or production-derived → use synthetic-only patterns; never copy prod data into `data/`.
- The test needs accounts / auth tokens → those are environment provisioning concerns, out of scope.

---

## How to use it

### Phase 1 — Pick the right shape

```
What kind of data?
├── 1–3 records, never changes      → static fixture (data/login-data.ts pattern)
├── n records, deterministic         → JSON file consumed by data-driven tests
├── varies per run, schema-fixed     → Faker factory (data/data-loader.ts pattern)
├── boundary / EP / invalid variants → test-design-techniques first, then this skill
└── full domain object               → reuse models/ types; never duplicate the type definition
```

### Phase 2 — Author against the existing models

Look in [`models/`](../../../models) first. Every fixture must import its type from there:

```ts
// data/checkout-data.ts
import type { Address } from '@models/address';
import type { CheckoutPayload } from '@models/checkout';

export const validCheckout: CheckoutPayload = {
  email: 'qa+checkout@example.com',
  address: validShippingAddress,
  ...
};
```

If the type doesn't exist, **extend `models/` first** — never inline-type a fixture.

### Phase 3 — Faker-driven factories

Pattern from [`data/data-loader.ts`](../../../data/data-loader.ts):

```ts
import { faker } from '@faker-js/faker';
import type { User } from '@models/user';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    email: faker.internet.email().toLowerCase(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: faker.phone.number(),
    ...overrides,
  };
}
```

Always:
- Lowercase emails (some validators reject mixed-case)
- Provide an `overrides` parameter for boundary cases
- Use `faker.seed(<int>)` in the spec when the test needs determinism

### Phase 4 — Boundary / invalid variants

Per [`prompts/core/test-data-generator.md`](../../../prompts/core/test-data-generator.md), for any field validated server-side, generate at minimum:

| Class | Example for "email" | Tag |
|---|---|---|
| valid | `qa@example.com` | `@P1 @smoke` |
| boundary-low | 1-char local part: `a@example.com` | `@P2 @regression` |
| boundary-high | 64-char local part | `@P2 @regression` |
| invalid — format | `notanemail` | `@P3 @regression` |
| invalid — empty | `''` | `@P3 @regression` |
| invalid — over-max | 65-char local part | `@P3 @regression` |

Emit them as a typed array consumable by `test.describe.parallel` data-driven loops.

### Phase 5 — Place + wire

| Shape | Path | How specs reach it |
|---|---|---|
| Static | `data/<feature>-data.ts` | `import { validCheckout } from '@data/checkout-data';` |
| JSON | `data/<feature>.json` | `import data from '@data/<feature>.json' with { type: 'json' };` |
| Factory | `data/<feature>-factory.ts` | `import { make<Thing> } from '@data/<feature>-factory';` |

Never put fixtures inside `tests/`. Specs consume; data lives in `data/`.

---

## Best practices

- **Models first, fixtures second.** A fixture without a `models/` type is a refactor magnet.
- **Lowercase emails, ISO dates, E.164 phones.** Server-side validators are strict; match them.
- **Seeded Faker for snapshot tests.** Non-determinism in fixtures breaks visual regression.
- **Don't commit secrets.** `data/` is for synthetic-only. Real accounts go in `.env` (read by `env.loader.ts`).
- **One fixture file per feature.** Don't dump everything into a single `test-data.ts` mega-file.

---

## Related

- [`prompts/core/test-data-generator.md`](../../../prompts/core/test-data-generator.md) — full prompt
- [`.agents/skills/test-design-techniques/SKILL.md`](../test-design-techniques/SKILL.md) — derive the EP/BVA matrix this skill turns into data
- [`.agents/skills/generate-manual-testcase/SKILL.md`](../generate-manual-testcase/SKILL.md) — manual-case authoring that consumes the generated data
- [`.agents/skills/generate-testcase/SKILL.md`](../generate-testcase/SKILL.md) — automated-case authoring
- [`.agents/skills/pom-architect/SKILL.md`](../pom-architect/SKILL.md) — uses these fixtures via constructor injection
