# RFC — <decision title> — <YYYY-MM-DD>

> Lab artifact for [Track P · M4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"Build vs buy — vendor decision RFC".
> Use for any build-vs-buy decision >$10k/yr or >0.5 FTE/quarter of build cost.

## Decision needed by

<YYYY-MM-DD> · <reason for the deadline — e.g. "start of Q3 budget cycle">

## Decision owner / approvers

- **Owner (drafts the RFC):** <your name>
- **Approvers (must sign):** <Director / VP / Finance>
- **Reviewers (consulted):** <senior IC>, <peer mgr>, <SRE>, <Security>

## Context (3-5 sentences)

<what's the situation that requires a decision; what's the cost of doing nothing>

## Options (2-4)

### Option A — <name>

- **What it is:** <one sentence>
- **Pros:** <…>
- **Cons:** <…>
- **1-yr cost (TCO):** <$ / FTE>
- **Risk profile:** <vendor lock-in / data residency / sec review needed>

### Option B — <name>

- **What it is:** <one sentence>
- **Pros:** <…>
- **Cons:** <…>
- **1-yr cost (TCO):** <…>
- **Risk profile:** <…>

### Option C — <name>  *(remove if you only have 2 options)*

…

## Scoring framework

> Criteria + weights (must sum to 100 %); score each option 1-5 per criterion. Weighted total = sum(score × weight).

| Criterion | Weight | A | B | C |
|---|---|---|---|---|
| 1-yr cost | <%> | <1-5> | <1-5> | <1-5> |
| Engineer time to ship | <%> | <…> | <…> | <…> |
| Catches false negatives | <%> | <…> | <…> | <…> |
| Avoids false positives | <%> | <…> | <…> | <…> |
| Vendor lock-in risk | <%> | <…> | <…> | <…> |
| Cross-browser / cross-platform coverage | <%> | <…> | <…> | <…> |
| **Weights total** | **100 %** | — | — | — |
| **Weighted total** | — | **<n.nn>** | **<n.nn>** | **<n.nn>** |

> Weights MUST sum to 100 %. The script will check this if you re-emit via the [`quality-org-charter` skill](../../.agents/skills/quality-org-charter/SKILL.md) (RFC variant TBD); for now, do the arithmetic by hand and double-check.

## Recommendation

**<Option X>**, because:

1. <reason tied to the highest-weighted criterion>
2. <reason tied to a near-term risk>
3. <reason tied to the team's capacity>

## What would change this recommendation

> The conditions of being wrong — at least 2, ideally 3.

- If <condition> → revisit <Option Y>
- If <condition> → revisit <Option Z>
- If <condition> → kill the project

## Implementation plan (if recommendation accepted)

| Week | Action | Owner | Done? |
|---|---|---|---|
| 1-2 | <e.g. "30-day vendor trial on @P1 specs"> | <name> | [ ] |
| 3 | <e.g. "Pilot review → go/no-go"> | <name> | [ ] |
| 4 | <e.g. "Full rollout, deprecate old approach"> | <name> | [ ] |

## Decision log

| Date | Decider | Decision | Notes |
|---|---|---|---|
| <YYYY-MM-DD> | <name> | <pending / approved / rejected / deferred> | <…> |

— Owner: <your name> · Date drafted: <YYYY-MM-DD>

---

> Source: [Track P · Module 4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) §"Build vs buy — vendor decision RFC"
