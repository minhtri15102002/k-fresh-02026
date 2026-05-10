#!/usr/bin/env bash
#
# .agents/skills/defect-report/scripts/file-defect.sh
#
# Wrapper around `gh issue create` that:
#   1. Validates the severity / module / status flags against the catalogue
#      defined in prompts/core/defect-labels.md (no rogue labels).
#   2. Composes the canonical label set: bug + severity:* + module:* (+status:*).
#   3. Creates the issue, optionally assigns a milestone and assignees.
#   4. Prints the new issue URL on success.
#
# Auth resolution order:
#   1. $GITHUB_TOKEN  (repo scope)
#   2. $GH_TOKEN
#   3. `gh auth token`
#
# Repo resolution order:
#   1. $GITHUB_REPOSITORY  (owner/repo)
#   2. `gh repo view --json nameWithOwner -q .nameWithOwner`
#   3. parsed from `git remote get-url origin`
#
# Usage:
#   file-defect.sh \
#     --title "Cart total ignores discount on quantity update" \
#     --severity major \
#     --module cart \
#     --body-file /tmp/defect.md \
#     [--status in-progress] \
#     [--milestone "v2.0 · Coverage Hardening"] \
#     [--assignee khanhdodang] \
#     [--dry-run]
#
# See `--help` for the full list.

set -euo pipefail

# ── catalogue (KEEP IN SYNC with prompts/core/defect-labels.md) ───────────────
VALID_SEVERITIES=(critical major minor trivial)
VALID_MODULES=(auth cart checkout profile product compare wishlist home)
VALID_STATUS=(in-progress)

# ── pretty-printers ──────────────────────────────────────────────────────────
bold()   { printf '\033[1m%s\033[0m\n'    "$*"; }
green()  { printf '\033[32m✓\033[0m %s\n' "$*"; }
yellow() { printf '\033[33m▸\033[0m %s\n' "$*"; }
red()    { printf '\033[31m✗\033[0m %s\n' "$*" >&2; }

usage() {
  cat <<'EOF'
file-defect.sh — file a compliant bug report against this repo

REQUIRED:
  --title       <text>     One-sentence bug title (≤ 12 words, action-oriented).
  --severity    <level>    One of: critical | major | minor | trivial
  --module      <area>     One of: auth | cart | checkout | profile | product |
                                   compare | wishlist | home
  --body-file   <path>     Path to a Markdown file containing the issue body
                           (matching .github/ISSUE_TEMPLATE/bug_report.md).

OPTIONAL:
  --status      <state>    Currently only: in-progress
  --milestone   <name>     Milestone title (see .github/MILESTONES.md).
                           Quote the exact title — case + middle dot matter.
  --assignee    <user>     GitHub login. Repeat the flag for multiple assignees.
  --dry-run                Print the resolved gh command without executing it.
  --help                   Show this help.

ENV:
  GITHUB_TOKEN / GH_TOKEN  Token with repo scope (else falls back to gh auth).
  GITHUB_REPOSITORY        owner/repo override (else falls back to gh / git).

EXAMPLES:
  file-defect.sh \
    --title "Cart total ignores discount on quantity update" \
    --severity major --module cart \
    --body-file /tmp/defect.md

  file-defect.sh \
    --title "Login page fails to render on 1024×768 viewports" \
    --severity minor --module auth \
    --body-file /tmp/defect.md \
    --milestone "v2.1 · Mobile & Cross-browser" \
    --assignee khanhdodang
EOF
}

# ── parse args ────────────────────────────────────────────────────────────────
TITLE=""
SEVERITY=""
MODULE=""
STATUS=""
BODY_FILE=""
MILESTONE=""
ASSIGNEES=()
DRY_RUN=0

while (( $# > 0 )); do
  case "$1" in
    --title)      TITLE="$2";      shift 2 ;;
    --severity)   SEVERITY="$2";   shift 2 ;;
    --module)     MODULE="$2";     shift 2 ;;
    --status)     STATUS="$2";     shift 2 ;;
    --body-file)  BODY_FILE="$2";  shift 2 ;;
    --milestone)  MILESTONE="$2";  shift 2 ;;
    --assignee)   ASSIGNEES+=("$2"); shift 2 ;;
    --dry-run)    DRY_RUN=1;       shift 1 ;;
    -h|--help)    usage; exit 0 ;;
    *)            red "unknown flag: $1"; usage; exit 1 ;;
  esac
done

# ── validate ──────────────────────────────────────────────────────────────────
err=0
[[ -z "$TITLE"     ]] && { red "--title is required";                     err=1; }
[[ -z "$SEVERITY"  ]] && { red "--severity is required";                  err=1; }
[[ -z "$MODULE"    ]] && { red "--module is required";                    err=1; }
[[ -z "$BODY_FILE" ]] && { red "--body-file is required";                 err=1; }
[[ -n "$BODY_FILE" && ! -f "$BODY_FILE" ]] && { red "body file not found: $BODY_FILE"; err=1; }

contains() { local n="$1"; shift; for v in "$@"; do [[ "$v" == "$n" ]] && return 0; done; return 1; }

if [[ -n "$SEVERITY" ]] && ! contains "$SEVERITY" "${VALID_SEVERITIES[@]}"; then
  red "invalid --severity '$SEVERITY' (allowed: ${VALID_SEVERITIES[*]})"; err=1
fi
if [[ -n "$MODULE" ]] && ! contains "$MODULE" "${VALID_MODULES[@]}"; then
  red "invalid --module '$MODULE' (allowed: ${VALID_MODULES[*]})"; err=1
fi
if [[ -n "$STATUS" ]] && ! contains "$STATUS" "${VALID_STATUS[@]}"; then
  red "invalid --status '$STATUS' (allowed: ${VALID_STATUS[*]})"; err=1
fi

# Title sanity-check: discourage emoji and long titles.
if [[ "$TITLE" =~ [^[:print:][:space:]] ]]; then
  yellow "title contains non-printable characters — strip them before merging"
fi
title_words=$(printf '%s\n' "$TITLE" | wc -w | tr -d ' ')
if (( title_words > 12 )); then
  yellow "title is $title_words words — guideline is ≤ 12. Consider tightening."
fi

(( err == 1 )) && exit 1

# ── compose labels ────────────────────────────────────────────────────────────
LABELS="bug,severity:${SEVERITY},module:${MODULE}"
if [[ -n "$STATUS" ]]; then
  LABELS="${LABELS},status:${STATUS}"
fi

# ── build gh args ─────────────────────────────────────────────────────────────
gh_args=(
  issue create
  --title "$TITLE"
  --label "$LABELS"
  --body-file "$BODY_FILE"
)
[[ -n "$MILESTONE" ]] && gh_args+=(--milestone "$MILESTONE")
for a in "${ASSIGNEES[@]:-}"; do
  [[ -n "$a" ]] && gh_args+=(--assignee "$a")
done

bold "Defect to be filed"
echo "  title:     $TITLE"
echo "  labels:    $LABELS"
echo "  body:      $BODY_FILE"
[[ -n "$MILESTONE" ]] && echo "  milestone: $MILESTONE"
(( ${#ASSIGNEES[@]} > 0 )) && echo "  assignees: ${ASSIGNEES[*]}"

if (( DRY_RUN == 1 )); then
  echo
  bold "Dry-run — would execute:"
  printf 'gh'
  for arg in "${gh_args[@]}"; do printf ' %q' "$arg"; done
  printf '\n'
  exit 0
fi

# ── token + repo resolution (logging-friendly) ────────────────────────────────
if [[ -z "${GITHUB_TOKEN:-}" && -z "${GH_TOKEN:-}" ]] && command -v gh >/dev/null 2>&1; then
  : # gh will use its own auth
elif [[ -n "${GITHUB_TOKEN:-}" || -n "${GH_TOKEN:-}" ]]; then
  : # already in env, gh will pick it up
else
  red "no token available (set GITHUB_TOKEN or run 'gh auth login')"
  exit 1
fi

# ── execute ───────────────────────────────────────────────────────────────────
bold "Filing issue…"
url="$(gh "${gh_args[@]}")"
green "issue created: $url"
