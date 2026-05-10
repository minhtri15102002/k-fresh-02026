# Module 14 — Fixtures & Test Isolation

> Phase 2 · Effort: 4h · Prerequisites: Module 13

## Learning objectives

After this module you can:

- Use Playwright's built-in fixtures: `page`, `browser`, `context`, `request`.
- Author **custom fixtures** by extending `test`.
- Choose **fixture scope**: test vs worker.
- Explain why each test should start from a known clean state.
- Read this repo's `pages/base-page.ts` and add a new page-object fixture.

## Why it matters

Fixtures are how Playwright avoids the global-state hell of older frameworks. They power test isolation, parallelism, and clean DX. This repo lives or dies on its custom fixtures.

## Concepts

### Built-in fixtures

```ts
test('uses built-ins', async ({ page, browser, context, request }) => {
  await page.goto('/');
  const cookies = await context.cookies();
  const res = await request.get('/api/health');
});
```

| Fixture | Lifetime | Purpose |
|---|---|---|
| `browser` | Worker | Underlying browser, shared across tests in a worker |
| `context` | Test | Fresh `BrowserContext` (cookies, storage, perms) per test |
| `page` | Test | Fresh `Page` per test |
| `request` | Test | API request context |

Each test gets a brand-new `context` + `page` → built-in isolation.

### Custom fixtures — extending `test`

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/ui/login-page';

type MyFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await use(lp);            // hand control to the test
  },
});

export { expect } from '@playwright/test';
```

```ts
// in the spec
import { test } from '@pages/base-page';

test('logs in', async ({ loginPage }) => {
  await loginPage.navigate();
  await loginPage.login(validUser);
});
```

Specs no longer call `new LoginPage(page)`. The fixture wires it.

### Fixture scopes

```ts
export const test = base.extend<{}, { adminToken: string }>({
  adminToken: [
    async ({}, use) => {
      const res = await fetch('/auth/admin', {...});
      const { token } = await res.json();
      await use(token);
    },
    { scope: 'worker' },     // ← compute once per worker, share across tests
  ],
});
```

| Scope | When to use |
|---|---|
| `'test'` (default) | Cheap setup, must be isolated |
| `'worker'` | Expensive setup that's safe to share (admin token, seed product) |

### Auto-fixtures

```ts
export const test = base.extend<{ tagsValidator: void }>({
  tagsValidator: [async ({}, use, testInfo) => {
    // runs before every test
    const tags = testInfo.tags;
    if (!tags.some(t => /@P[1-3]/.test(t))) throw new Error('Missing priority tag');
    await use();
    // runs after every test (cleanup, reporting)
  }, { auto: true }],   // ← auto = applies to all tests, no opt-in
});
```

This repo uses an auto-fixture in `pages/base-page.ts` to enforce tag guardrails (one priority + one severity) and bridge tags to Allure.

### Test isolation rules

- **No shared mutable state.** No module-level `let user = …`. Use a fixture.
- **No "depends on previous test".** Each test creates its own data.
- **Fresh context per test.** Cookies, storage, perms reset.
- **Idempotent cleanup.** Test must be safe to re-run.

### Hooks (use sparingly)

```ts
test.beforeAll(async () => { /* once per worker */ });
test.beforeEach(async ({ page }) => { /* before every test */ });
test.afterEach(...);
test.afterAll(...);
```

If you find yourself adding the same `beforeEach` to 5 specs, **promote it to a fixture**.

### Skipping & focusing

```ts
test.skip('not implemented yet', async () => {});
test.fixme('flaky — see #1234', async () => {});
test.only('focus this one', async () => {});      // forbidden in CI via forbidOnly
test.describe.serial('must run in order', () => {…});
test.describe.parallel('explicit parallel', () => {…});
```

### Storage state — the auth hack

For auth-required suites, log in **once**, save cookies/localStorage, reuse:

```ts
// global-setup.ts
const ctx = await browser.newContext();
await ctx.request.post('/auth/login', {…});
await ctx.storageState({ path: 'storage/admin.json' });
```

```ts
// playwright.config.ts
projects: [
  { name: 'admin', use: { storageState: 'storage/admin.json' } },
]
```

Cuts wall-clock dramatically when auth is slow.

## Hands-on lab

1. Open `pages/base-page.ts`. List every fixture it exposes. For each, identify whether it's test-scoped, worker-scoped, or auto.
2. Add a new fixture `adminApiPage` that returns an `ApiPage` instance pre-authenticated as admin (worker-scoped, log in via API once).
3. Convert one spec that uses `new <Feature>Page()` (if any) to use the corresponding fixture.
4. Verify your fixture is isolated: run the same test in 4 parallel workers; confirm no shared state leaked.

## Self-check

- [ ] Why does `page` reset between tests but `browser` doesn't?
- [ ] When would you make a fixture `worker`-scoped?
- [ ] What does an `auto: true` fixture do?
- [ ] How does this repo enforce that every test has the right tags?

## Further reading

- playwright.dev — Fixtures
- playwright.dev — Authentication
- This repo's `pages/base-page.ts`

---

**Prev:** [13 — Web-first assertions](./13-web-first-assertions.md) · **Next:** [15 — Debugging & Trace Viewer](./15-debugging-and-trace-viewer.md)
