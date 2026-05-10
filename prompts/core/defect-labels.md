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

A bug issue **MAY** carry:

- `status:in-progress` — actively being worked on. Bumps the issue from "Open" into the "In Progress" stat on the dashboard.
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
