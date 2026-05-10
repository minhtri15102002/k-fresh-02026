#!/usr/bin/env bash
#
# scripts/bootstrap-defect-labels.sh
#
# Idempotently creates the GitHub labels described in
# `prompts/core/defect-labels.md`. Safe to re-run — `gh label create --force`
# overwrites color/description without erroring on existence.
#
# Required:    severity:* + module:*  (already populating the dashboard).
# Optional:    priority:* + root-cause:* + phase:* + found-in:* + status:reopened
#              These unlock the new Tier 1+2 KPI panels (leakage, priority,
#              root-cause, reopen rate).
#
# Auth + repo resolution mirrors scripts/bootstrap-milestones.sh.
#
# Usage:
#   ./scripts/bootstrap-defect-labels.sh
#   DEFECTS_REPO=owner/name ./scripts/bootstrap-defect-labels.sh

set -euo pipefail

bold()   { printf '\033[1m%s\033[0m\n'    "$*"; }
green()  { printf '\033[32m✓\033[0m %s\n' "$*"; }
yellow() { printf '\033[33m▸\033[0m %s\n' "$*"; }
red()    { printf '\033[31m✗\033[0m %s\n' "$*" >&2; }

# ── repo resolution ──────────────────────────────────────────────────────────
REPO="${DEFECTS_REPO:-${GITHUB_REPOSITORY:-}}"
if [[ -z "$REPO" ]]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
fi
if [[ -z "$REPO" ]]; then
  red "Could not resolve repo. Set DEFECTS_REPO=owner/name or run inside the repo."
  exit 1
fi

bold "Bootstrapping defect labels in $REPO"

# ── helper: idempotent gh label create ───────────────────────────────────────
mklabel() {
  local name="$1" color="$2" desc="$3"
  if gh label create "$name" --color "$color" --description "$desc" --repo "$REPO" --force >/dev/null 2>&1; then
    green "$name"
  else
    yellow "$name (skipped — gh label create failed; check permissions)"
  fi
}

# ── kind ─────────────────────────────────────────────────────────────────────
mklabel "bug" "d73a4a" "Something is broken in the product"

# ── severity (required, mirrors test-tag taxonomy) ───────────────────────────
mklabel "severity:critical" "B60205" "Data loss / security / total breakage"
mklabel "severity:major"    "D93F0B" "Important feature broken; workaround exists"
mklabel "severity:minor"    "FBCA04" "Cosmetic / convenience issue"
mklabel "severity:trivial"  "C5DEF5" "Typo / copy nit"

# ── module (required) ────────────────────────────────────────────────────────
for m in auth cart checkout profile product compare wishlist home; do
  mklabel "module:$m" "5319E7" "Affects the $m module"
done

# ── status ───────────────────────────────────────────────────────────────────
mklabel "status:in-progress" "1D76DB" "Actively being worked on"
mklabel "status:reopened"    "E99695" "Closed and re-opened — feeds Reopen Rate KPI"

# ── priority ─────────────────────────────────────────────────────────────────
mklabel "priority:p1" "B60205" "Must fix before next release"
mklabel "priority:p2" "D93F0B" "Should fix this sprint"
mklabel "priority:p3" "FBCA04" "Nice to fix; backlog"
mklabel "priority:p4" "C5DEF5" "Cosmetic / when convenient"

# ── root cause ───────────────────────────────────────────────────────────────
for rc in requirements logic test-gap env data integration other; do
  mklabel "root-cause:$rc" "0E8A16" "Root cause: $rc"
done

# ── detection phase ──────────────────────────────────────────────────────────
for ph in unit integration e2e manual exploratory customer; do
  mklabel "phase:$ph" "BFD4F2" "First caught in: $ph"
done

# ── found-in environment (drives Defect Leakage KPI) ─────────────────────────
for env in dev qa uat staging prod; do
  mklabel "found-in:$env" "1D76DB" "Surfaced in: $env"
done

bold "Done. Verify in GitHub: https://github.com/$REPO/labels"
