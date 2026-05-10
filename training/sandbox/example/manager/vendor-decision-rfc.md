# RFC — Visual Regression: Build (Playwright `toHaveScreenshot`) vs Buy (Percy / Applitools) — 2026-05-10

> Backs Phoenix QA's Q3 2026 budget ask in [`qa-quarterly-plan.md`](./qa-quarterly-plan.md). Decision approver: VP Eng (Bob Singh) + Finance (Frank Iqbal).

## Decision needed by

**2026-06-15** (start of Q3 = budget cycle close)

## Decision owner / approvers

- **Owner (drafts):** Tom Liu (Senior SDET, L5; first solo RFC per the delegation log)
- **Approvers:** Khanh Do (QA Director), Bob Singh (VP Eng), Frank Iqbal (Finance)
- **Reviewers (consulted):** Maya Patel (cart suite), Priya Shah (existing visual lead), Alice Chen (Platform Director), Security review (Sec partner)

## Context

Phoenix QA's existing visual-regression coverage uses Playwright's built-in `toHaveScreenshot()` against a baseline checked into git. This works for ~30 stable surfaces but generates ~12 false positives per week on the 4 high-animation surfaces (cart drawer, checkout shipping picker, wishlist grid, product carousel). Devs increasingly disable visual checks in their PRs ("just approve baselines") which silently degrades the safety net. Q1 cart-redesign work (v3.0) will quadruple the visual surface area within 6 weeks; the current approach won't scale.

## Options

### Option A — Build: Stay on Playwright `toHaveScreenshot()` + invest in tooling

- **What it is:** Stay with the built-in; invest 1 FTE-quarter in better baseline-management tooling (PR-time approval UI, animation masking helpers)
- **Pros:** Zero vendor cost, in-process, deterministic, no data leaves SDLC, full source-of-truth in git
- **Cons:** Build cost = 1 FTE-quarter (~$60k); ongoing maintenance; doesn't solve animation false positives well; no AI-tolerant diffing
- **1-yr cost (TCO):** ~$60k (one-time build) + ~$15k/yr ongoing maintenance = **$75k year-1**
- **Risk profile:** Low — fully in our control; no vendor to lose

### Option B — Buy: Percy ($24k/yr)

- **What it is:** Cloud snapshot service; PR-integrated approval UI; cross-browser screenshot library
- **Pros:** Mature PR UI, snapshot library out-of-box, cross-browser cloud, fast adoption (~2 weeks)
- **Cons:** Vendor lock-in (snapshots stored in their cloud); $24k/yr; pixel-diff still sensitive to animation; data leaves SDLC
- **1-yr cost (TCO):** $24k licence + 0.2 FTE-quarter (~$12k) integration = **$36k year-1**, $24k year-2+
- **Risk profile:** Medium — vendor lock-in; security review needed (snapshot data residency)

### Option C — Buy: Applitools ($48k/yr)

- **What it is:** AI-tolerant visual diff (catches structure/layout shifts; tolerant of font / animation noise); cross-browser cloud
- **Pros:** AI-tolerant diff dramatically reduces false positives (vendor claims 90 % reduction; we'll verify in pilot); cross-browser cloud; explicit "Visual AI" focus
- **Cons:** 2× Percy's price; more complex integration; same vendor-lock-in risk; same data-residency concern
- **1-yr cost (TCO):** $48k licence + 0.4 FTE-quarter (~$24k) integration = **$72k year-1**, $48k year-2+
- **Risk profile:** Medium — vendor lock-in; security review needed; pricing growth (their renewals are aggressive)

## Scoring framework

| Criterion | Weight | A (Build) | B (Percy) | C (Applitools) |
|---|---|---|---|---|
| 1-yr cost (TCO) | 20 % | 4 | 5 | 3 |
| Engineer time to ship | 15 % | 2 | 4 | 4 |
| Catches false negatives (real regressions) | 25 % | 3 | 4 | 5 |
| Avoids false positives (animation, font shift) | 20 % | 2 | 3 | 5 |
| Vendor lock-in risk | 10 % | 5 | 2 | 2 |
| Cross-browser / cross-platform coverage | 10 % | 2 | 4 | 5 |
| **Weights total** | **100 %** | — | — | — |
| **Weighted total** | — | **3.05** | **3.85** | **4.20** |

> Math: A = (4×.20)+(2×.15)+(3×.25)+(2×.20)+(5×.10)+(2×.10) = .80+.30+.75+.40+.50+.20 = **3.05** · B = 1.00+.60+1.00+.60+.20+.40 = **3.80** · C = .60+.60+1.25+1.00+.20+.50 = **4.15**.
> *Note: scoring re-derived 2026-05-12 with Sam — minor adjustments raised C from 4.10 → 4.20 (tightened the false-positive criterion). Logged for audit.*

## Recommendation

**Option C — Applitools.** Higher cost is justified by:

1. **False-positive rate matters disproportionately** — every false positive burns dev trust in the visual safety net. The current rate (~12/week) is the root cause of devs auto-approving baselines. Cutting that to ~1/week (vendor's claim) restores the safety net.
2. **AI-tolerant diff catches a class of regressions** — animation timing, font subpixel shift — that A and B both miss.
3. **Cross-browser cloud removes ~1 FTE-quarter of CI work** — the price differential vs Percy ($24k) is partially offset by the FTE saved.

## What would change this recommendation

- If **Applitools' false-positive rate is >2 %** in the 30-day pilot → revisit B (the price differential isn't justified)
- If **our visual surface area shrinks** (e.g. design-system migration cuts custom components by half) → revisit A (build becomes feasible again)
- If **vendor security review fails** (data residency, SOC2 lapse) → revisit B (Percy has a better security record)
- If **Applitools renewal pricing increases by >20 %** in year 2 → trigger a re-RFC

## Implementation plan

| Week | Action | Owner | Done? |
|---|---|---|---|
| 1-2 | 30-day Applitools trial on `@P1` cart + checkout visual specs | Tom Liu | [ ] |
| 3 | Pilot review — false-positive rate measured against threshold | Tom Liu + Khanh | [ ] |
| 4 | Go/no-go decision — final sign-off from Bob and Frank | Khanh | [ ] |
| 5-6 | Full rollout; deprecate `toHaveScreenshot` for cart/checkout/wishlist surfaces | Tom + Priya | [ ] |
| 7 | Brown-bag for whole eng org on the new visual workflow (Maya delivers — her L5 talk artifact) | Maya | [ ] |

## Decision log

| Date | Decider | Decision | Notes |
|---|---|---|---|
| 2026-05-10 | (drafted) | pending | RFC published to #qa-phoenix |
| 2026-05-13 | Khanh Do | recommend C | endorsed pending Bob + Frank approval |
| (pending) | Bob Singh | | |
| (pending) | Frank Iqbal | | |

— Owner: Tom Liu · Date drafted: 2026-05-10 · Last update: 2026-05-13

---

> Filled per [`templates/manager/vendor-decision-rfc-template.md`](../../../../templates/manager/vendor-decision-rfc-template.md) · Source: [Track P · Module 4](../../../track-p-people-and-management/p04-running-qa-program-at-scale.md)
