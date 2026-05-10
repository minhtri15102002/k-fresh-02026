# Phase 1 — Engineering Toolkit

> The minimum engineering literacy needed to write, run, and review automation code.

## Modules

6. [Git & GitHub for QA](./06-git-and-github-for-qa.md)
7. [TypeScript for QA](./07-typescript-for-qa.md)
8. [Web fundamentals (HTML/CSS/DOM)](./08-web-fundamentals-html-css-dom.md)
9. [HTTP, REST & APIs](./09-http-rest-and-apis.md)

## Phase outcomes

You can:

- Branch, commit (Conventional Commits), open a PR, and pass `pre-push` hooks (`npm run check:all`).
- Read & write idiomatic TypeScript: interfaces, generics, async/await, decorators, `as const`.
- Inspect the DOM and accessibility tree of a page; explain why role-based locators beat CSS.
- Trace an HTTP request end-to-end: method, headers, cookies, auth scheme, status, body.

## Phase self-check

- [ ] Open a PR titled `chore(training): phase-1 sandbox` that adds a no-op file under `training/sandbox/` and passes CI.
- [ ] Write a TypeScript function `parsePrice(text: string): number` with full types and a JSDoc.
- [ ] Open `https://ecommerce.test.com` in DevTools — find the "Add to Cart" button using only the accessibility tree.
- [ ] Use `curl` to log into the SUT and capture the session cookie; explain each header.

---

**Prev:** [Phase 0 — Foundations](../phase-0-foundations/README.md) · **Next:** [Phase 2 — Playwright Core](../phase-2-playwright/README.md)
