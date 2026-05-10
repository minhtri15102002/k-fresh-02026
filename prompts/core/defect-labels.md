# Defect Label Convention

Single source of truth for the GitHub Issue labels that classify defects. The same labels feed:

- `gh issue list --label bug --label severity:critical` filters
- The **Defects** panel of the QA Metrics Dashboard (`templates/qa-metrics-dashboard.html`), via `scripts/fetch-defects.ts` → `reports/defects.json`
- Any future automation (e.g. Slack digests, release-readiness gates)

> Sister doc: `prompts/core/test-tags.md`. The severity scale (`critical / major / minor / trivial`) and the module/feature names (`auth / cart / checkout / profile / product / compare / wishlist / home`) are deliberately identical between tests and defects — that's what makes the traceability matrix possible.

---

## TL;DR

A bug issue **MUST** carry:

1. `bug` (the kind label)
2. exactly one **severity** label: `severity:critical | severity:major | severity:minor | severity:trivial`
3. exactly one **module** label: `module:auth | module:cart | module:checkout | module:profile | module:product | module:compare | module:wishlist | module:home`

A bug issue **MAY** carry (each unlocks a richer panel on the dashboard):

- `status:in-progress` — actively being worked on. Bumps the issue from "Open" into the "In Progress" stat on the dashboard.
- `status:reopened`   — the bug was closed and re-opened. Feeds the **Reopen Rate** KPI.
- exactly one **priority** label: `priority:p1 | priority:p2 | priority:p3 | priority:p4` — feeds the **By priority** chart.
- exactly one **root cause** label: `root-cause:requirements | root-cause:logic | root-cause:test-gap | root-cause:env | root-cause:data | root-cause:integration | root-cause:other` — feeds the **Top root causes** chart.
- exactly one **detection phase** label: `phase:unit | phase:integration | phase:e2e | phase:manual | phase:exploratory | phase:customer` — feeds the per-phase distribution.
- exactly one **found-in** label: `found-in:dev | found-in:qa | found-in:uat | found-in:staging | found-in:prod` — `found-in:prod` drives the **Defect Leakage** KPI and the leakage trend.
- Any of the standard GitHub labels (`good first issue`, `help wanted`, etc.) — ignored by the dashboard.

Everything else (feature requests, chores, docs) should NOT carry the `bug` label and won't appear in the defect counts.

---

## Label catalogue

### Kind (required, one)

| Label | Color hint | Meaning |
|-------|-----------|---------|
| `bug` | `#d73a4a` (GitHub default) | Something is broken in the product. Ships into the dashboard. |

> Anything that isn't a `bug` issue is invisible to the defect panel — by design. Use `enhancement`, `task`, `question` etc. for non-defect work.

### Severity (required, exactly one)

Mirrors Allure's `SeverityLevel` enum (and the test-tag `@critical|@major|@minor|@trivial` taxonomy).

| Label                | When to use |
|----------------------|-------------|
| `severity:critical`  | Data loss, money loss, security hole, total flow breakage. Production hotfix material. |
| `severity:major`     | Important functionality broken; clear workaround exists. |
| `severity:minor`     | Cosmetic/convenience issue, no functional blocker. |
| `severity:trivial`   | Typo, copy nit, demo-only path. |

### Module (required, exactly one)

Aligns with the test feature tags. Adding a new product area? Add the matching `module:*` label here AND the matching `@feature` tag in `prompts/core/test-tags.md`.

| Label              | Covers |
|--------------------|--------|
| `module:auth`      | Register, login, logout, password change |
| `module:cart`      | Cart CRUD (UI + API) |
| `module:checkout`  | Checkout flow, billing, shipping, confirmation |
| `module:profile`   | Account dashboard, profile edits, address book |
| `module:product`   | PDP, quantity counters, size charts, popups |
| `module:compare`   | Compare-products page |
| `module:wishlist`  | Wishlist add/remove, wishlist → cart |
| `module:home`      | Homepage navigation, hero entry points |

### Status (optional)

| Label                  | Effect on dashboard |
|------------------------|---------------------|
| `status:in-progress`   | Open issues with this label show under **In Progress** instead of **Open**. |
| `status:reopened`      | Counts toward the **Reopen Rate** KPI (proxy for fix quality). |

### Priority (optional, exactly one)

Mirrors the test-tag `@P1..@P4` taxonomy in `prompts/core/test-tags.md`.

| Label          | When to use |
|----------------|-------------|
| `priority:p1`  | Must fix before next release. |
| `priority:p2`  | Should fix this sprint. |
| `priority:p3`  | Nice to fix; backlog. |
| `priority:p4`  | Cosmetic; fix when convenient. |

> Severity = how bad the bug is on its own. Priority = how urgently we will fix it. They are deliberately decoupled (a `severity:critical` cosmetic in a hidden admin screen can be `priority:p3`).

### Root cause (optional, exactly one)

| Label                      | Means |
|----------------------------|-------|
| `root-cause:requirements`  | Spec / story missing or wrong. |
| `root-cause:logic`         | Code logic / algorithm bug. |
| `root-cause:test-gap`      | Code is right; the test missed it. |
| `root-cause:env`           | Environment / config / infra. |
| `root-cause:data`          | Bad seed / fixture / migration. |
| `root-cause:integration`   | Boundary between systems. |
| `root-cause:other`         | Anything else (use sparingly). |

### Detection phase (optional, exactly one)

Where the bug was first caught. Drives the leakage funnel.

| Label                  | Means |
|------------------------|-------|
| `phase:unit`           | Unit test |
| `phase:integration`    | Integration / contract test |
| `phase:e2e`            | Playwright E2E |
| `phase:manual`         | Manual scripted test |
| `phase:exploratory`    | Exploratory / charter session |
| `phase:customer`       | Reported by a customer / in prod |

### Found-in (optional, exactly one)

Which environment surfaced the bug. `found-in:prod` is the leakage marker.

| Label              | Means |
|--------------------|-------|
| `found-in:dev`     | Developer's machine before commit |
| `found-in:qa`      | QA env |
| `found-in:uat`     | UAT env |
| `found-in:staging` | Staging env |
| `found-in:prod`    | **Escaped — counts toward Defect Leakage KPI.** |

---

## Status mapping (how the dashboard buckets bugs)

The dashboard's four status stats are computed as **disjoint** sets, so the totals add up cleanly:

| Stat | Issue state | Extra rule |
|------|-------------|-----------|
| **Open**         | `state:open`   | does NOT have `status:in-progress` |
| **In Progress**  | `state:open`   | has `status:in-progress` |
| **Resolved**     | `state:closed` | `state_reason: completed` (the issue was actually fixed) |
| **Closed**       | `state:closed` | `state_reason: not_planned` or `duplicate` (won't fix / dupe) |

Sum of the four = total `bug`-labeled issues ever created.

---

## How to use

### One-off: add a new bug

```bash
gh issue create \
  --title "Cart total ignores discount code on quantity update" \
  --label "bug,severity:major,module:cart" \
  --body "..."
```

### Mark something as in-progress

```bash
gh issue edit 42 --add-label "status:in-progress"
```

### Bootstrap the labels in a fresh repo

```bash
# Required labels (run once)
gh label create "severity:critical" --color "B60205" --description "Data loss / security / total breakage"
gh label create "severity:major"    --color "D93F0B" --description "Important feature broken; workaround exists"
gh label create "severity:minor"    --color "FBCA04" --description "Cosmetic / minor"
gh label create "severity:trivial"  --color "C5DEF5" --description "Typo / copy nit"

for m in auth cart checkout profile product compare wishlist home; do
  gh label create "module:$m" --color "5319E7" --description "Affects the $m module"
done

gh label create "status:in-progress" --color "1D76DB" --description "Actively being worked on"
gh label create "status:reopened"    --color "E99695" --description "Closed and re-opened — counts toward Reopen Rate"

# Priority (optional)
gh label create "priority:p1" --color "B60205" --description "Must fix before next release"
gh label create "priority:p2" --color "D93F0B" --description "Should fix this sprint"
gh label create "priority:p3" --color "FBCA04" --description "Nice to fix"
gh label create "priority:p4" --color "C5DEF5" --description "Cosmetic / when convenient"

# Root cause (optional)
for rc in requirements logic test-gap env data integration other; do
  gh label create "root-cause:$rc" --color "0E8A16" --description "Root cause: $rc"
done

# Detection phase (optional)
for ph in unit integration e2e manual exploratory customer; do
  gh label create "phase:$ph" --color "5319E7" --description "First caught in: $ph"
done

# Found-in environment (optional) — `found-in:prod` drives Defect Leakage KPI
for env in dev qa uat staging prod; do
  gh label create "found-in:$env" --color "1D76DB" --description "Surfaced in: $env"
done
```

### Refresh the dashboard locally

```bash
# Token resolution order: GITHUB_TOKEN > GH_TOKEN > `gh auth token`
GITHUB_TOKEN=ghp_xxx npm run fetch:defects   # one-shot
npm run export:dashboard                      # also runs fetch:defects automatically
```

### CI

The Playwright workflow already passes `GH_TOKEN: ${{ github.token }}` and `GITHUB_REPOSITORY`, so `fetch:defects` works out of the box on PR builds and nightly runs.

---

## Edge cases & guardrails

- **Bug with no severity label** → counted in totals, but tagged `unknown` in the severity chart and listed in the "Unlabelled defects" callout. Fix the labels, don't hide the data.
- **Bug with no module label** → same treatment under `module:unknown`.
- **Multiple severity labels** → the lowest-numbered severity wins (`critical > major > minor > trivial`); the others are ignored.
- **Multiple module labels** → all of them are counted — a single bug that affects two modules genuinely shows up in both. (Most issues should have one.)
- **`bug` removed from a closed issue** → the issue exits the dashboard. That's fine; treat it as "we no longer think this was a bug".
- **Public vs private repo** → both work; `fetch:defects` uses the same `GITHUB_TOKEN` that lets you push.

---

## Related references

- `prompts/core/test-tags.md` — test tagging convention (severity + feature names match here)
- `scripts/fetch-defects.ts` — the fetcher that turns these labels into `reports/defects.json`
- `templates/qa-metrics-dashboard.html` — consumer; reads `defects.json` at hydration time
