# Traceability — Jira ↔ Manual TC ↔ Spec ↔ Defect ↔ Dashboard

> The matrix that proves every Jira input has coverage and every coverage artifact has a Jira parent. This is the artifact the [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) skill maintains and Panel #4 of the [QA Metrics dashboard](../../templates/qa-metrics-dashboard.html) consumes.

> **Direction of travel:** _Jira issue (input)_ → _Manual TC (here & in `documents/manual-testcases/`)_ → _Spec file (in `tests/`)_ → _Defect / GH Issue (when broken)_ → _Dashboard panel (where leadership sees it)_.

## Why this matters

Three things go wrong without traceability:

1. **Untested requirements.** A `Requirement` ticket marked Active with no linked spec → silent compliance gap.
2. **Orphan tests.** A spec exists but no Jira ticket motivates it → unclear ownership; first to be deleted in a cleanup.
3. **Silent regressions.** A bug recurs because no one connected the original Jira Bug to a regression spec.

The matrix below catches all three.

## The matrix shape

| Jira ID | Type | Title | Manual TC | Spec | GH Issue (if broken) | Status | Last verified |
|---|---|---|---|---|---|---|---|
| QA-1001 | Story | Cart quantity counter | [`TC-CART-04`](../manual-testcases/ui/cart/TC-CART-04.md) | `tests/ui/test-cart.spec.ts:45` | — | ✅ Automated · green | 2026-05-09 |
| QA-1002 | Story | Address-book add/edit | [`TC-ADDRESS-01`](../manual-testcases/ui/address-book/TC-ADDRESS-01.md) | `tests/ui/test-address.spec.ts:12` | — | ✅ Automated · green | 2026-05-09 |
| QA-2010 | Requirement | EU AI Act Art.10 — data governance for product-search | (n/a — covered via children) | `tests/ai/data-governance.spec.ts` | — | ✅ Active · green | 2026-05-08 |
| QA-3007 | Bug | Wishlist share-link 500 error | [`TC-WISHLIST-02`](../manual-testcases/ui/wishlist/TC-WISHLIST-02.md) | `tests/ui/test-bug-QA-3007.spec.ts` | [#142](https://github.com/<org>/<repo>/issues/142) | 🟡 Fixed · awaiting verification | 2026-05-07 |
| QA-3008 | Bug | Cart total rounding off-by-one | [`TC-CART-API-03`](../manual-testcases/api/cart/TC-CART-API-03.md) | `tests/api/test-bug-QA-3008.spec.ts` | [#149](https://github.com/<org>/<repo>/issues/149) | ✅ Closed · regression green | 2026-05-09 |
| QA-4055 | Task | Refresh product fixtures | (n/a) | (n/a) | — | ✅ Done | 2026-05-06 |
| QA-1011 | Story | Coupon stacking | [`TC-CART-08`](../manual-testcases/ui/cart/TC-CART-08.md) | — *(scaffold)* | — | ⏳ Manual TC drafted · spec pending | 2026-05-09 |
| QA-2011 | Requirement | EU AI Act Art.13 — transparency for assistant | (covered via children) | — | — | ❌ **GAP** — no implementing Story | 2026-05-09 |
| QA-3009 | Bug | Compare-products max-N enforcement | — | — | — | ❌ **GAP** — no Manual TC, no spec | 2026-05-09 |

> The example rows above are illustrative — replace with your real Jira keys when this matrix lands in your project. Keep the table sorted by Jira ID for grep-ability.

## Status taxonomy

| Symbol | Meaning |
|---|---|
| ✅ | Coverage exists and is currently green |
| 🟡 | Coverage exists; in transition (e.g. Bug fixed, awaiting verification) |
| ⏳ | Partial — Manual TC drafted; spec pending (or vice versa) |
| ❌ | Gap — visible to dashboard; needs action |
| ➖ | Not applicable for this issue type |

The four `❌` are the entire reason this matrix exists. Anything else is rounding error.

## Coverage rules (applied by the `requirements-traceability` skill)

| Issue type | Required artifacts |
|---|---|
| **Story** | 1+ Manual TC AND 1+ spec (or scaffold + due-date) |
| **Requirement** | 1+ implementing Story (each with Story coverage) |
| **Bug** | 1+ Manual TC + 1 regression spec + 1 mirrored GH Issue with correct labels |
| **Task** | (no coverage required — outcome comment on the Jira ticket is enough) |

Anything missing → matrix row gets ❌ → row gets surfaced in Panel #4 of the dashboard.

## How rows get added / updated

| Trigger | Updater | Mechanism |
|---|---|---|
| New Jira issue passing coverage rules | AI QA Agent | First-pass scan on creation; row appended sorted |
| Manual TC merged | `requirements-traceability` skill | Resolves `Requirement Reference` field → updates row |
| Spec merged with `JIRA-…` in test name | `spec-to-code-compliance` skill | Maps spec file:line → row's Spec column |
| GH Issue opened via `defect-report` skill | skill itself | Adds GH Issue link + sets status from severity label |
| Spec turns red in CI | nightly job | Status flips ✅ → 🟡 (or ❌ if persistent) |
| Spec quarantined | `flaky-test-triage` skill | Status flips to ⏳ + linked flake-investigation Jira ticket |

## Hand-off to the dashboard

Panel #4 of [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) consumes this file via the trend snapshot in `reports/traceability.json` (regenerated nightly). The chart shows:

- **Coverage %** — rows with `✅` ÷ total rows.
- **Open gaps by type** — counts of `❌` per (Story / Requirement / Bug).
- **Stale rows** — `Last verified` older than 14 days.
- **Top-5 oldest gaps** — earliest `Last verified` date with `❌` status.

A green dashboard with red rows here = process failure (the dashboard is reading stale data). A red dashboard with green rows here = data lag (regenerate the snapshot). They should always agree.

## Cadences

| Cadence | Action | Owner |
|---|---|---|
| Per PR (touching `tests/`, `pages/`, `documents/manual-testcases/`) | Skill re-derives affected rows; PR check posts a diff | CI |
| Nightly | Regenerate `reports/traceability.json`; refresh dashboard | scheduled job |
| Weekly | QA Lead reviews `❌` and `⏳` rows; assigns owners | QA Lead |
| Monthly | Audit `Stale rows`; archive issues that no longer apply | QA Lead + product PM |
| Quarterly | Full reconciliation against Jira (full-project JQL); hunt orphans | QA Lead + AI Test Engineer |

## Anti-patterns

| Anti-pattern | Symptom | Fix |
|---|---|---|
| Status = ✅ but spec is `.skip` | False green | Skill flags `.skip` / `.fixme` as `⏳` regardless of last green |
| Bug closed without regression spec | Row never created → defect recurs | `defect-report` skill rejects close-without-spec |
| Manual TC + spec exist but Jira ID stale | Coverage exists; matrix says `❌` | Update `Requirement Reference` field; re-run skill |
| Hand-edited matrix rows | Drift between matrix and source-of-truth | Matrix is **machine-maintained** — manual edits get overwritten on next nightly run |
| One Jira issue → multiple unrelated specs | Hard to verify coverage matches intent | Split the Jira issue or add explicit `# scope` notes per spec |

## Worked example — bug round-trip

```
Day 0  · Jira Bug QA-3008 created      → matrix row added with status ❌
Day 0  · GH Issue #149 opened via      → matrix row gets GH link;
         defect-report skill              status changes to 🟡 (Triaged)
Day 1  · Manual TC TC-CART-API-03      → matrix row's Manual TC column populated
         drafted by AI Agent
Day 1  · Regression spec               → matrix row's Spec column populated
         tests/api/test-bug-QA-3008.spec.ts
         scaffolded (failing)
Day 2  · Dev fixes; Jira → Fixed       → matrix status 🟡 (Fixed · awaiting)
Day 2  · CI: regression spec passes    → matrix status ✅ (green)
Day 2  · GH Issue closed; Jira → Closed → matrix row's "Last verified" = today
Day 30 · Nightly job re-verifies       → if regression still green, row stays ✅
                                         (otherwise dashboard re-flags)
```

This is the round-trip every Bug must complete. No exceptions.

---

**Prev:** [`self-healing-loop.md`](./self-healing-loop.md) · **Up:** [Jira docs README](./README.md)
