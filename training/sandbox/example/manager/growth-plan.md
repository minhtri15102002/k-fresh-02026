# Growth Plan — Maya Patel, L4 → L5 — start 2026-04-01

> 6-month contract between IC and manager. Re-reviewed monthly in 1:1.
> Promotion case at month 6 — go/no-go via calibration with peer Directors.

## Current level evidence (what makes Maya solidly L4)

- **Owns @cart suite end-to-end** — pass-rate >98 % since 2026-01; rewrote the cart fixture in Q1, cutting suite runtime 4.2 → 1.8 min
- **Flake rate down from 4 % → 1.2 %** in @cart over 2 quarters — diagnosed and fixed two distinct race conditions
- **Mentoring Diego (L3)** since his start in Jan — PR comments on every Diego PR; 2 weekly pairing sessions; Diego shipped his first solo PR in week 6 (with manageable 8-comment review cycle)
- **Predicted the Q1 discount-expiry incident 3 sprints early** — flagged in v2.3 release review; we didn't act fast enough, she was right
- **Reliable on-call** — 8 incidents on her shifts in 2025, all resolved within SLO; zero escalations to manager

## Gaps to L5 (3 specific behaviours)

| # | Gap | Expected behaviour | Why this matters at L5 |
|---|---|---|---|
| 1 | Has not led a framework-level change | Drive 1 framework PR with 2+ reviewers (proposed scope: extract `assertHelper` cart-specific extensions into reusable `cart-assertions.ts`) | L5s influence beyond their immediate area; framework changes are the visible signal |
| 2 | Influence is intra-team only | Present 1 brown-bag talk to ≥ 20 attendees (proposed: "How we cut cart suite runtime 56 % without losing coverage") | L5s teach the org, not just their team |
| 3 | Mentoring is reactive (responds to Diego's PRs) | Own Diego's next 6-month growth plan as primary mentor; co-author with Khanh | L5s grow ICs structurally, not ad-hoc |

## Success criteria (binary — a peer manager could judge independently)

- [ ] **Framework PR shipped** — `cart-assertions.ts` extraction merged with ≥ 2 senior IC reviewers; brief retro shared in #qa-phoenix on what worked / didn't
- [ ] **Brown-bag delivered** — talk recorded; ≥ 20 attendees registered; ≥ 5 written take-aways from attendees in the thread
- [ ] **Diego's growth plan signed** — Maya as primary mentor; Khanh as manager; Diego's signature; calibrated against the L3 → L4 ladder

## Checkpoint cadence

- **Monthly review** in 1:1 (15 min, separate from regular topics) on the first Wednesday of each month
- **Mid-point retro** at month 3 (2026-07-01) — re-scope if 1+ criteria are off-track
- **Promotion case** at month 6 (2026-10-01) — go/no-go via calibration with Alice (Platform Director) + Bob (VP Eng)

## What this plan does NOT promise

- ❌ Hitting these criteria does not guarantee promotion (calibration with peer Directors is required)
- ✅ Hitting these criteria **commits Khanh to advocate** in the calibration with specific evidence
- ❌ Missing these criteria does not necessarily delay promotion (other evidence may exist; we'll re-plan in writing)
- ✅ Missing these criteria triggers a written re-plan, not a quiet drop

## Sign-off

| Role | Name | Date |
|---|---|---|
| IC | Maya Patel | 2026-04-01 |
| Manager | Khanh Do | 2026-04-01 |
| Skip-level (informed) | Bob Singh (VP Eng) | 2026-04-03 |

---

> Filled per [`templates/manager/growth-plan-template.md`](../../../../templates/manager/growth-plan-template.md) · Source: [Track P · Module 2](../../../track-p-people-and-management/p02-hiring-leveling-growing-testers.md)
