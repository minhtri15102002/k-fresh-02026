# Defect Narrative — engineer audience — Cart shows $0.00 when discount code expires mid-session — 2026-04-22

> Audience: the dev who'll fix it (specifically, @david.murphy on the cart-service team).
> For the executive-audience version, see [`release-brief-exec.md`](./release-brief-exec.md).
> For the customer-facing note, see [`incident-customer-note.md`](./incident-customer-note.md).

## Summary

When a discount code expires *during* the user's session (between page-load and add-to-cart), the cart total renders as `$0.00` instead of falling back to the un-discounted price. Checkout then accepts the order at $0 and creates an unrecoverable revenue leak (no charge attempted; no error to user; order ships).

## Severity / Module / Environment

| Field | Value |
|---|---|
| Severity | `severity:critical` |
| Module | `module:cart` |
| Environment | `env=prod` · build `commit a3f1c8d` (deployed 2026-04-22 09:38 UTC) · all browsers · all viewports |

## Steps to reproduce

1. Apply discount code `SAVE15` to cart while it's still valid (≥ 15 min before expiry)
2. Leave the cart page open without adding new items
3. Wait until the code's `expires_at` timestamp passes (UTC time)
4. Add a new item to the cart
5. **Observe:** cart total displays `$0.00`
6. Click "Checkout"
7. **Observe:** order is created at $0.00; no payment intent created; confirmation email sent

## Expected vs actual

**Expected:** When the discount code's `expires_at` is in the past, `discount.apply(cart)` returns the original cart price (not zero). The UI shows the un-discounted price with a "discount expired" notice, per the spec at `documents/requirements/cart-discount-rules.md` §4.2.

**Actual:** `discount.apply(cart)` returns `cart.subtotal − cart.subtotal = 0` because the expired-branch returns `cart.subtotal` (mistaking it for "the discount value"). The UI faithfully displays the broken result.

## Evidence

- Trace: `https://traces.example.com/2026-04-22/cart-discount-expiry-trace.zip`
- Screenshot: `reports/screenshots/2026-04-22-cart-zero.png`
- Server logs: `discount.service.ts:47 — applied discount of $79.00 (subtotal: $79.00, code: SAVE15, expired_at: 2026-04-22T09:35:00Z, applied_at: 2026-04-22T09:42:00Z)`
- Production order #883201, #883204, #883219 all created at $0.00 between 09:42 – 10:04 UTC

## Suspect commit / area

`a3f1c8d` (2026-04-19, @priya.sharma) — refactored `discount.service.ts` to consolidate the expiry check; the consolidation merged the "expired" path with the "fully discounted" path by accident. Lines 41-49.

## Related test (the one that should have caught it)

`tests/ui/test-cart.spec.ts` — current `@TC-203` covers happy path + invalid-code path, but **not** the "valid-then-expires-mid-session" path. Maya flagged this gap in v2.3 review (#PR-2118 comment thread).

## Workaround

For affected customers: the orders at $0 will be reversed by Finance (Frank Iqbal owns) and customers re-charged with the correct discount honoured (we'll eat the 15 % since we caused it). Affected window: 09:42 – 10:04 UTC, ~14 orders, ~$1,800 GMV.

---

## What to verify after the fix

- [ ] `tests/ui/test-cart.spec.ts → @TC-203` passes (existing happy path)
- [ ] **New** `tests/ui/test-cart.spec.ts → @TC-203b` covers expired-mid-session (Maya is writing this)
- [ ] `tests/api/test-cart.spec.ts → @TC-API-203` API-level test for `discount.apply()` with expired code
- [ ] Manual smoke: full reproduction steps above produce a non-zero total + visible "discount expired" notice
- [ ] No regression in `@P1` cart suite — full pass before merge

## What we'd improve in the test suite to catch this earlier

- **Add boundary-case coverage for time-sensitive cart features** — current `@P2` cart coverage is 87 %; the SLO is 95 %. The gap is on time-boundary conditions specifically.
- **Wire SLO error-budget alert** — we'd have known the @P2 coverage gap was open and could have prioritised it before Q2.
- **AI-assist for boundary case discovery** — try the [`prompts/core/test-design`](../../../../prompts/core/) prompt against the discount spec to surface missing cases automatically. Maya volunteered to pilot.

---

> Filled per [`templates/manager/defect-narrative-template.md`](../../../../templates/manager/defect-narrative-template.md) · Source: [Track P · Module 3](../../../track-p-people-and-management/p03-communication-and-influence.md)
