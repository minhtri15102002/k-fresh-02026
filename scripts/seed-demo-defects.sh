#!/usr/bin/env bash
#
# scripts/seed-demo-defects.sh
#
# Creates 5 representative DEMO bug issues so the QA Metrics Dashboard
# Section 3 panels (severity / module / priority / root-cause / aging /
# leakage / trend) all populate with non-zero values.
#
# Each demo issue:
#   - is prefixed [DEMO] in the title (easy to filter or close en masse)
#   - carries a full label set (severity + module + priority + root-cause +
#     phase + found-in)
#   - has body text explaining it's seed data for the dashboard
#
# Pre-req: run `./scripts/bootstrap-defect-labels.sh` first so the labels exist.
#
# Usage:
#   ./scripts/seed-demo-defects.sh
#   DEFECTS_REPO=owner/name ./scripts/seed-demo-defects.sh
#
# To remove the demo issues afterwards:
#   gh issue list --label bug --search "[DEMO]" --json number -q '.[].number' \
#     | xargs -I{} gh issue close {} --reason not_planned

set -euo pipefail

REPO="${DEFECTS_REPO:-${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)}}"
if [[ -z "$REPO" ]]; then
  echo "Could not resolve repo. Set DEFECTS_REPO=owner/name." >&2
  exit 1
fi

bold()  { printf '\033[1m%s\033[0m\n'    "$*"; }
green() { printf '\033[32m✓\033[0m %s\n' "$*"; }

bold "Seeding demo defects in $REPO"

DEMO_BODY=$'> Demo data for the QA Metrics Dashboard panels.\n> Auto-created by `scripts/seed-demo-defects.sh`. Safe to close.'

create() {
  local title="$1" labels="$2"
  local out
  out=$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$DEMO_BODY")
  green "${out##*/}  $title"
}

# A spread of severity / module / priority / phase / found-in / root-cause
create "[DEMO] Cart total ignores discount on qty update" \
  "bug,severity:critical,module:cart,priority:p1,root-cause:logic,phase:e2e,found-in:prod"

create "[DEMO] Address book country dropdown empty after save" \
  "bug,severity:major,module:profile,priority:p2,root-cause:integration,phase:manual,found-in:staging,status:in-progress"

create "[DEMO] Wishlist item duplicated on retry click" \
  "bug,severity:minor,module:wishlist,priority:p3,root-cause:logic,phase:e2e,found-in:qa"

create "[DEMO] Checkout shipping label flickers on slow networks" \
  "bug,severity:minor,module:checkout,priority:p3,root-cause:env,phase:exploratory,found-in:uat"

create "[DEMO] Compare empty-state copy typo" \
  "bug,severity:trivial,module:compare,priority:p4,root-cause:requirements,phase:manual,found-in:qa"

bold "Done. Refresh the dashboard with: npm run fetch:defects && npm run export:dashboard"
