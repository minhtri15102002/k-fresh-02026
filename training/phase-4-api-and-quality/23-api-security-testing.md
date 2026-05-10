# Module 23 — API Security Testing

> Phase 4 · Effort: 5h · Prerequisites: Module 22

## Learning objectives

After this module you can:

- Audit a SUT's auth surface for the OWASP API Top 10 basics.
- Write tests for **cookie flags**, **session fixation**, **HTTPS enforcement**, **authorization boundaries (IDOR)**, and **brute-force resistance**.
- Map each test to a CWE / OWASP ID.
- File a security defect with reproduction steps without leaking secrets.

## Why it matters

Security bugs are *the* most expensive QA misses — data breach, regulatory fines, reputational damage. You don't have to be a pen-tester to add baseline coverage; you do have to know the patterns.

## Concepts

### Threat model — what we're checking

| Risk | Test pattern |
|---|---|
| Session token leakage | Inspect `Set-Cookie` flags |
| Session fixation (CWE-384) | Confirm session ID rotates on auth state change |
| Plain HTTP usage (CWE-319) | Confirm `http://` redirects to `https://` |
| Authorization boundary (BOLA / IDOR — CWE-639) | User A cannot access user B's resources |
| Brute-force / credential stuffing (CWE-307) | Repeated bad logins are throttled |
| CSRF (CWE-352) | State-changing endpoints require token + `SameSite` cookies |
| Open redirect (CWE-601) | `?redirect=evil.com` is rejected |
| Mass assignment (CWE-915) | `PATCH /me { isAdmin: true }` is rejected |

Pick the top 3–5 for your SUT and **automate them**. The rest belong in periodic pen-tests.

### Cookie flags — what to assert

For session/auth cookies:

```ts
const res = await request.post('/auth/login', { data: validCreds });
const cookies = res.headers()['set-cookie'] ?? '';
expect(cookies).toMatch(/HttpOnly/i);
expect(cookies).toMatch(/Secure/i);
expect(cookies).toMatch(/SameSite=(Lax|Strict)/i);
```

| Flag | What it prevents |
|---|---|
| `HttpOnly` | JavaScript access (XSS theft) |
| `Secure` | Transmission over HTTP |
| `SameSite=Lax/Strict` | CSRF |
| `Path=/` | Scope |

### Session fixation

The session ID **must change** when a user logs in. Otherwise an attacker who set the victim's pre-login session ID becomes the victim post-login.

```ts
// 1. Get a pre-login session
let res = await request.get('/');
const preCookie = parseSession(res);

// 2. Log in
res = await request.post('/auth/login', { data: validCreds });
const postCookie = parseSession(res);

// 3. They must differ
expect(postCookie).not.toBe(preCookie);
```

### HTTPS enforcement

```ts
const res = await request.get('http://example.com/account', { maxRedirects: 0 });
expect(res.status()).toBe(301);   // or 302/307/308
expect(res.headers()['location']).toMatch(/^https:\/\//);
```

`maxRedirects: 0` is critical — otherwise Playwright follows the redirect and you only see the final 200.

### Authorization boundary (IDOR)

```ts
// User A's session
const ctxA = await playwright.request.newContext({ storageState: 'storage/userA.json' });
const orderA = await ctxA.post('/api/orders', { data: { … } });
const orderAId = (await orderA.json()).id;

// User B tries to read it
const ctxB = await playwright.request.newContext({ storageState: 'storage/userB.json' });
const res = await ctxB.get(`/api/orders/${orderAId}`);
expect(res.status()).toBe(403);   // not 200, not 404
```

### Brute-force resistance

```ts
// Run only on an env that allows it (rate-limit + cleanup)
test.skip(!process.env['RUN_BRUTE_FORCE'], 'Brute-force test skipped by default');

const latencies: number[] = [];
for (let i = 0; i < 20; i++) {
  const start = Date.now();
  const res = await request.post('/auth/login', {
    data: { email: 'attacker@example.com', password: `wrong-${i}` },
  });
  latencies.push(Date.now() - start);
  if (res.status() === 429) break;   // rate-limited — good
}

// Either the server starts returning 429 OR latency increases (exponential backoff)
const last = latencies.at(-1) ?? 0;
const first = latencies[0] ?? 0;
expect(last).toBeGreaterThan(first * 2);
```

### CSRF

For cookie-authenticated state-changing endpoints, the server must require a CSRF token (or be `SameSite=Strict`).

```ts
// without CSRF token, with valid cookie
const res = await ctxA.post('/api/account/email', { data: { email: 'evil@x.com' } });
expect(res.status()).toBe(403);    // CSRF protected
```

### Reporting security defects

Don't paste tokens, cookies, or request bodies in plain text. Use:

- A private security issue tracker (e.g. GitHub Private Vulnerability Reports).
- Redacted excerpts.
- Severity = `critical` always; Priority depends on exploitability + blast radius.

Tag tests `@security` (canonical: `prompts/core/test-tags.md`). Tag issues with the matching `module:security` label.

## Hands-on lab

1. Read `tests/api/test-security.spec.ts`. For each of the 5 tests, identify:
   - The threat (CWE / OWASP)
   - The exact assertion that catches it
   - What would happen if the protection regressed
2. Add a 6th test for **CSRF on `/api/profile` PATCH**: send the request with a valid session cookie but no CSRF token; expect 403.
3. Add a 7th test for **mass assignment**: as a regular user, PATCH yourself with `{ isAdmin: true }` and expect either 403 or response without the change.
4. Tag every new test `@P1 @critical @regression @api @security`.

## Self-check

- [ ] Without `Secure` flag, what attack opens up?
- [ ] Why does `maxRedirects: 0` matter for the HTTPS test?
- [ ] How does session fixation work, and what's the prevention?
- [ ] When 403 vs 404 — and why does it matter for IDOR?

## Further reading

- OWASP API Security Top 10 — owasp.org/API-Security/
- CWE-352 (CSRF), CWE-307 (Brute-force), CWE-384 (Session fixation), CWE-639 (IDOR)
- This repo's `.agents/skills/api-security-testing/SKILL.md`

---

**Prev:** [22 — Hybrid UI + API tests](./22-hybrid-ui-api-tests.md) · **Next:** [24 — Visual & accessibility testing](./24-visual-and-accessibility-testing.md)
