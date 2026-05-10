# Release Brief — Cart-discount-expiry hotfix — 2026-04-22 14:00 UTC

> Same incident as [`defect-narrative-dev.md`](./defect-narrative-dev.md), re-tuned for VP Eng audience.
> One page. BLUF first. Verdict-driven.

## Verdict: **CONDITIONAL GO** ⚠️

Roll forward the cart-service hotfix tonight (~22:00 UTC) **with the discount-engine feature flag set to `legacy_path`** as a kill-switch fallback. Re-evaluate Wednesday after 24h soak.

## What would change this verdict

- 🚨 If the hotfix doesn't merge by 18:00 UTC → **NO-GO**; Finance does manual reversal of affected orders (~14 orders, ~$1.8k GMV); we re-plan tomorrow morning
- 🟡 If `@P1` cart suite drops below 100 % on the hotfix branch → **CONDITIONAL → NO-GO**; investigate before deploy
- 🟢 If hotfix lands AND smoke + `@P2` pass on prod-mirror AND no anomaly in 4hr canary → **unconditional GO** for the rest of release

## Risks I'm asking you to accept

1. **Hotfix scope risk** — the discount-service refactor that caused this also affected the wishlist-discount path; we've tested it but the surface is broader than the bug
   - **Mitigation:** Sam is leading a 4-hour soak on prod-mirror starting 18:30 UTC; canary at 5 % for 2 hours before full rollout
   - **Early warning:** any wishlist `discount.apply` error rate >0.1 % triggers automatic rollback
2. **Customer trust** — 14 customers received "free" orders that we now have to re-charge; Carol (PM) is drafting the comms
   - **Mitigation:** see [`incident-customer-note.md`](./incident-customer-note.md) — published with their re-charge invoice; we honour the original 15 % discount
   - **Early warning:** support ticket volume on this incident; if >50 by EOD, escalate to a public status page note

## Risks I'm NOT asking you to accept

- ✅ **No open `severity:critical` defects** other than this one (was 1, will be 0 after hotfix)
- ✅ **`@P1` pass-rate 100 %** on main as of 13:00 UTC
- ✅ **Discount-service security review** completed by Sec team — no new attack surface
- ✅ **No data integrity issue** — no customer accounts modified; only order totals affected (recoverable from logs)

## Owners

| Item | Owner | Window |
|---|---|---|
| Hotfix merge | @david.murphy (cart eng) | by 18:00 UTC today |
| Prod-mirror soak | @sam.kim (Phoenix QA L5) | 18:30 – 22:30 UTC |
| Canary monitor | @dan.park (SRE on-call) | 22:00 – 02:00 UTC |
| Customer comms | @carol.webster (PM) | published by 16:00 UTC |
| Order re-charge process | @frank.iqbal (Finance) | by EOD 2026-04-23 |

## Time you need to spend on this

- 🕐 **Read time:** 2 min
- 🕐 **Decision needed by:** 2026-04-22 16:00 UTC (CONDITIONAL GO confirmation)
- 🕐 **Re-evaluation point:** 2026-04-23 14:00 UTC briefing in #release-readiness

---

— Khanh Do, QA Director
— Generated from `reports/release-readiness-2026-04-22.md` at 14:00 UTC

> Filled per [`templates/manager/release-brief-exec-template.md`](../../../../templates/manager/release-brief-exec-template.md) · Source: [Track P · Module 3](../../../track-p-people-and-management/p03-communication-and-influence.md) · Generated via [`release-readiness` skill](../../../../.agents/skills/release-readiness/SKILL.md)
