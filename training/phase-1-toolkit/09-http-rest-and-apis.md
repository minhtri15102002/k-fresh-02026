# Module 09 — HTTP, REST & APIs

> Phase 1 · Effort: 4h · Prerequisites: Module 08

## Learning objectives

After this module you can:

- Read an HTTP request/response in DevTools and curl, and explain every line.
- Distinguish HTTP **methods** (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD).
- Map status codes to outcomes — 2xx, 3xx, 4xx, 5xx.
- Read and modify common headers: `Content-Type`, `Authorization`, `Cookie`, `Set-Cookie`, `Location`, `Cache-Control`.
- Recognize the four common auth schemes: **session cookie**, **bearer token**, **API key**, **OAuth 2.0**.

## Why it matters

You can't write API tests, hybrid tests, or security tests without HTTP fluency. You also can't debug "why is the UI showing stale data?" without it.

## Concepts

### Anatomy of an HTTP request

```http
POST /api/cart HTTP/1.1
Host: ecommerce.test.com
Authorization: Bearer eyJhbGc…
Content-Type: application/json
Cookie: session=abc123
User-Agent: Mozilla/5.0 …

{ "productId": 42, "quantity": 2 }
```

### Anatomy of an HTTP response

```http
HTTP/1.1 201 Created
Date: Sun, 10 May 2026 09:00:00 GMT
Content-Type: application/json; charset=utf-8
Set-Cookie: cart-id=xyz789; Path=/; HttpOnly; Secure; SameSite=Lax
Location: /api/cart/items/99

{ "id": 99, "productId": 42, "quantity": 2 }
```

### Methods (idempotency matters)

| Method | Idempotent? | Safe? | Typical use |
|---|---|---|---|
| GET | Yes | Yes | Read |
| HEAD | Yes | Yes | Headers only |
| OPTIONS | Yes | Yes | CORS preflight |
| POST | No | No | Create / non-idempotent action |
| PUT | Yes | No | Replace |
| PATCH | No (sometimes) | No | Partial update |
| DELETE | Yes | No | Remove |

A test that runs `POST /cart` 3 times must end with **3 items**. A test that runs `PUT /profile` 3 times must end with **the same profile**.

### Status codes — quick reference

| Code | Meaning | Test action |
|---|---|---|
| 200 OK | Success with body | Assert body shape |
| 201 Created | Resource created | Assert `Location` header |
| 204 No Content | Success, no body | Assert empty body |
| 301 / 302 / 307 | Redirect | Follow vs. assert target |
| 400 Bad Request | Client validation error | Assert error code in body |
| 401 Unauthorized | Missing/invalid auth | Re-auth |
| 403 Forbidden | Authenticated but not permitted | IDOR test target |
| 404 Not Found | Resource absent | Negative path |
| 409 Conflict | State conflict (e.g. duplicate) | Idempotency test |
| 422 Unprocessable Entity | Semantic validation error | Field-level errors |
| 429 Too Many Requests | Rate limit | Brute-force/throttle test |
| 500 Internal Server Error | Server bug | File a defect |
| 502 / 503 / 504 | Upstream / overload | Retry, then escalate |

### Headers you'll touch most

| Header | Use |
|---|---|
| `Content-Type` | Body format. `application/json`, `multipart/form-data`, `application/x-www-form-urlencoded` |
| `Accept` | What format the client wants back |
| `Authorization` | `Bearer <token>` or `Basic <base64>` |
| `Cookie` | Session cookies attached to request |
| `Set-Cookie` | Server-set cookies (check `HttpOnly`, `Secure`, `SameSite`!) |
| `Location` | Redirect target / created-resource URL |
| `Cache-Control` | Caching policy (subtle bugs live here) |
| `X-Request-Id` | Correlate logs across services |

### Auth schemes

- **Session cookie** — server issues `Set-Cookie: session=…; HttpOnly; Secure`. Browser sends it on subsequent requests. Vulnerable to CSRF if no `SameSite`.
- **Bearer token (JWT)** — client sends `Authorization: Bearer <jwt>`. Stateless. Watch for: JWT signed with `none`, leaked secrets, missing expiry.
- **API key** — `X-API-Key` header or query param. Long-lived; rotate often.
- **OAuth 2.0** — three-legged. Authorization code → token. Used for "Sign in with X". You'll mostly mock this in tests.

This repo's security tests in `tests/api/test-security.spec.ts` cover **cookie flags** + **session fixation** + **HTTPS redirect** + **auth boundary (IDOR)** + **brute-force resistance**. Read them.

### REST principles (what good APIs look like)

- Resources are nouns: `/users`, `/orders/123/items`
- HTTP method = verb
- Stateless requests
- Hypermedia / Location / pagination links
- Versioning: `/api/v1/…` or `Accept: application/vnd.acme.v2+json`

### Tools

- **DevTools → Network** — daily driver
- **`curl -i`** — `-i` shows headers, `-v` shows everything
- **HTTPie** — friendlier curl
- **Postman / Bruno** — collection-based exploration
- **Playwright `request` fixture** — what you'll use in tests

## Hands-on lab

1. With DevTools Network tab open, log into the SUT. Find the request that authenticates and document:
   - Method, path, status
   - Request headers (highlight auth)
   - Response headers (highlight `Set-Cookie` flags)
   - Response body (redact secrets)
2. Replay the same request with `curl -i`. Capture the cookie. Use it on a second `curl` to fetch `/api/cart`. Confirm 200.
3. Try `curl -i` on `/api/cart` **without** the cookie. Expect 401/403. Document the difference.
4. Read `tests/api/test-security.spec.ts`. For each test, identify the HTTP-level mechanism it exercises and which CWE it covers (hint: CWE-384, CWE-614, CWE-307…).

## Self-check

- [ ] What's the difference between 401 and 403?
- [ ] You see `Set-Cookie: session=…` without `HttpOnly`. What's the risk?
- [ ] PUT /profile is idempotent — what does that buy you in a test suite?
- [ ] Why does the SUT return `302 → /login` after an expired session instead of `401`?

## Further reading

- MDN HTTP — developer.mozilla.org/en-US/docs/Web/HTTP
- *HTTP: The Definitive Guide* (skim, don't memorize)
- OWASP API Security Top 10

---

**Prev:** [08 — Web fundamentals](./08-web-fundamentals-html-css-dom.md) · **Up:** [Phase 1 README](./README.md)

🎓 **Phase 1 complete.** Next: [Phase 2 — Playwright Core](../phase-2-playwright/README.md)
