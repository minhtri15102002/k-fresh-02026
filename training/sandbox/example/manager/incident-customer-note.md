# Incident Note — Customer Audience — Cart total displayed $0 — 2026-04-22

> Same incident as [`defect-narrative-dev.md`](./defect-narrative-dev.md) and [`release-brief-exec.md`](./release-brief-exec.md), re-tuned for affected customers.
> Approved by Comms / PR / Legal before publishing (see Internal notes).

---

## What happened

Between **09:42 and 10:04 UTC on April 22, 2026**, a small number of customers were able to complete cart checkout with a total displayed as **$0.00** when their discount code had expired during their session. We estimate this affected **14 customers**.

If you placed an order during this window and saw a $0.00 total, your order is included.

## What we're doing about it

We will:

1. **Honour your original discount.** You will be charged the price you would have paid with your discount code, even though it had expired by the moment of checkout. The 15 % is on us — it was our system's mistake.
2. **Re-issue your invoice.** You'll receive a corrected invoice from `billing@…` within 24 hours.
3. **Continue to ship your order.** No delay; your items are on the way.
4. **No action required from you.** If you'd rather cancel, reply to the corrected invoice and we'll refund in full.

## What's fixed now

The underlying issue was identified within 22 minutes and fully patched by **22:30 UTC on April 22, 2026**. Cart totals are now correct in all scenarios, including expiring-mid-session.

## What we're doing to prevent this in the future

We've added automated tests that would catch this exact class of issue, and we're improving our monitoring so that any similar discrepancy between the cart total and the underlying calculation triggers an alert within minutes (not hours).

## If you're still affected

Email `support@…` with your order number; we'll respond within 4 hours.

## We're sorry

We know reliability matters when you trust us with your purchase. We let you down today by shipping a change that didn't have the test coverage it needed. We're fixing the immediate issue, the test gap, and the monitoring gap so this specific failure cannot happen again. Thank you for sticking with us.

---

— The Phoenix Cart team

<details>
<summary>Internal notes (do not publish)</summary>

- Original incident: [`defect-narrative-dev.md`](./defect-narrative-dev.md) + [`release-brief-exec.md`](./release-brief-exec.md)
- Customer impact estimate source: prod logs `discount.service.ts:47` — 14 distinct order IDs at $0.00 between 09:42–10:04 UTC
- Approved by:
  - Carol Webster (PM) — 2026-04-22 14:30 UTC
  - Erica Diaz (Comms) — 2026-04-22 15:15 UTC
  - Mark Reyes (Legal) — 2026-04-22 15:45 UTC
- Distribution: in-app banner (24h), email to affected 14, status page note
- We deliberately did NOT name the engineer or the commit; root cause goes in the post-mortem, not the customer note
- We deliberately did NOT promise we'd "never have a bug again" — only that this *specific* failure mode is now prevented

</details>

---

> Filled per [`templates/manager/incident-customer-note-template.md`](../../../../templates/manager/incident-customer-note-template.md) · Source: [Track P · Module 3](../../../track-p-people-and-management/p03-communication-and-influence.md)
