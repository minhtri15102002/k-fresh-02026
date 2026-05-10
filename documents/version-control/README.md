# Version Control Guideline

> Source-of-truth folder for **how this repo uses Git, GitHub, branches, PRs, and releases**. Builds on (and never duplicates) [`documents/husky-guidelines.md`](../husky-guidelines.md) (the local hook layer), [`commitlint.config.js`](../../commitlint.config.js) (the message rules), and [`.github/pull_request_template.md`](../../.github/pull_request_template.md) (the review surface). Where those files describe the **mechanics** of one tool, this folder describes the **convention** that ties them together.

A defensible Git workflow is **not "we squash on merge"**. It is:

1. A **branching model** — what's protected, what's disposable, how branches are named.
2. A **PR contract** — when to open, what reviewers expect, how to merge, how it lands on the dashboard.
3. A **commit-message convention** — Conventional Commits, enforced by husky, machine-parseable.
4. A **history hygiene policy** — when rebase/amend/squash is allowed and when it is forbidden.
5. A **release process** — tags, hotfixes, rollback, with a clear owner.

If any of those five is missing, "Git workflow" is folklore — different in every developer's head, contested at every conflict. The discipline below makes them all explicit.

## The picture

```
       feature/<scope>-<short>           hotfix/<YYYY-MM-DD>-<short>
       ┌──────────────┐                  ┌──────────────────────────┐
       │ short-lived  │                  │ from a tag, never main   │
       │ ≤ 5 days     │                  │ merged BACK to main + tag│
       └──────┬───────┘                  └────────────┬─────────────┘
              │ open PR                               │
              ▼                                       ▼
       ┌──────────────────────────────────────────────────────────┐
       │ MAIN  (protected, linear history, signed commits)        │
       │  - PRs only via squash-merge                             │
       │  - CI green required                                     │
       │  - 1 reviewer (or code-owner)                            │
       └────────────────┬─────────────────────────────────────────┘
                        │ tag on every release
                        ▼
       ┌──────────────────────────────────────────────────────────┐
       │ TAGS  v<MAJOR>.<MINOR>.<PATCH>  +  GitHub Release notes  │
       │  - generated from `feat:` / `fix:` commits since last tag│
       │  - feeds reports/run-trend.json + dashboard              │
       └──────────────────────────────────────────────────────────┘
```

Trunk-based development: **`main` is the only long-lived branch**, every other branch is short-lived and exists to serve one PR. Releases are tags on `main`. Hotfixes are short-lived branches forked from a release tag, merged back to `main`, then re-tagged. There are no `develop`, `release/*`, or `staging` branches in this repo — those add coordination cost without preventing anything `main` + tags don't already prevent.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | Branching model, PR contract, decision matrices, cross-refs | First time wiring a Git workflow; orientation |
| [`setup.md`](./setup.md) | Install + identity, SSH auth, commit signing (SSH / GPG), recommended `.gitconfig`, aliases, editor integration, client-side secret hygiene, 30-second verify checklist | First clone on a new machine; new contributor onboarding |
| [`workflow.md`](./workflow.md) | The day-to-day path: branch → commit → push → PR → review → merge → CI → dashboard. Includes branch-name patterns, PR-size guidance, draft-vs-ready, merge strategy (squash by default), and the post-merge cleanup checklist | Every PR; new contributors |
| [`history.md`](./history.md) | The rarer operations: rebase, amend, fixup, cherry-pick, reflog recovery, history-rewrite policy, releases, tags, semver, hotfixes. Includes the safety rules — what is allowed locally, what is forbidden once pushed | Before any non-trivial Git operation; release cadence |
| [`fundamentals.md`](./fundamentals.md) | The mental model — four areas (working tree / index / object DB / refs), commits as immutable objects, reflog as safety net, three merge types, pull = fetch + rebase, remote-tracking refs. Includes a 15-question FAQ + inspection ladder | Whenever Git surprises you; before reading `history.md` for the first time |
| [`ignore-and-attributes.md`](./ignore-and-attributes.md) | `.gitignore` (mental model + repo's actual file annotated), `.gitignore` syntax, `.gitattributes` baseline (line endings, generated-file marking, LFS), Git LFS guidance, generated-file decision matrix | Adding a new file type; debugging "why is this in / not in the repo"; configuring LFS |
| [`remotes-and-forks.md`](./remotes-and-forks.md) | Multi-remote configurations: contributing-fork workflow, org-internal mirrors, cross-org collaboration. Remote-tracking branch hygiene; the `force-push to fork, never to upstream` rule | Working from a fork; configuring a mirror; partner-org integration |
| [`advanced-layout.md`](./advanced-layout.md) | Worktrees (multiple checkouts), submodules vs subtrees vs vendoring, monorepo patterns + tooling (Nx / Turborepo / Bazel) + selective CI | Need parallel checkouts; embedding another repo; adopting a monorepo |

## Reading order

1. **`README.md`** (this) — read once for the model.
2. **`setup.md`** — first thing on a fresh laptop or a fresh clone. ~10 minutes; cures 90% of "Git is being weird" symptoms forever.
3. **`workflow.md`** — keep open during your first 5 PRs.
4. **`fundamentals.md`** — read **before** `history.md` if you've never used `git rebase -i`. Read **after** `history.md` if everything's working but you want to know why.
5. **`history.md`** — read once before your first rebase or release; reference whenever you need to amend / cherry-pick / tag.
6. **`ignore-and-attributes.md`** — read once before adding files to a new folder; reference when secrets / line endings / LFS come up.
7. **`remotes-and-forks.md`** — read only when you actually need a second remote. Most contributors never do.
8. **`advanced-layout.md`** — read only when you actually need worktrees / submodules / subtrees / monorepo. Most contributors never do.
9. [`documents/husky-guidelines.md`](../husky-guidelines.md) — what runs on your machine before changes leave it.
10. [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — the labels every PR-linked issue carries.

## Branching model — at a glance

| Branch | Lifetime | Source | Naming | Protected? |
|---|---|---|---|---|
| `main` | Permanent | n/a | `main` (not `master`) | ✅ Yes — linear history, CI green, 1 review |
| Feature | ≤ **5 working days** | `main` | `feat/<scope>-<short>` (e.g. `feat/cart-discount-edge`) | ❌ |
| Bugfix | ≤ 2 days | `main` | `fix/<scope>-<short>` (e.g. `fix/checkout-shipping-flicker`) | ❌ |
| Chore / refactor / docs | ≤ 2 days | `main` | `chore/<short>`, `refactor/<scope>-<short>`, `docs/<short>` | ❌ |
| Hotfix | ≤ 1 day | latest tag (`vX.Y.Z`) | `hotfix/<YYYY-MM-DD>-<short>` (e.g. `hotfix/2026-05-10-cart-leak`) | ❌ |
| Spike / proof-of-concept | ≤ 3 days | `main` | `spike/<short>` — must be deleted, never merged | ❌ |

> **Forbidden long-lived branches:** `develop`, `release/*`, `staging`, `next`. We use **tags** for releases, not branches. If you think you need one of these, open an issue first to discuss — it's almost always a workflow smell.

### Why short-lived?

Long-running branches diverge from `main`. Divergence makes merges painful, makes the dashboard's pass-rate trend misleading, and incentivises `--no-verify`. The 5-day cap is the practical limit before the merge cost exceeds the cost of a smaller scope.

If a feature is genuinely too big to ship in 5 days:

1. Land it behind a feature flag (`process.env.FEATURE_X === '1'`) so the flag default keeps `main` shippable.
2. Land scaffolding first (types, empty page object, no-op spec), then real implementation as a follow-up PR.
3. Use the [`.agents/skills/split-to-prs/SKILL.md`](https://cursor.directory) skill (or `npx skills run split-to-prs`) to mechanically split a half-finished branch into shippable pieces.

## PR contract — at a glance

| Question | Rule |
|---|---|
| **When to open?** | As soon as you have a draftable change, even if WIP. Mark `Draft` until ready for review. CI runs anyway and gives you the same signal a human would. |
| **How big?** | Aim for **≤ 400 lines changed** (excluding generated). PRs > 600 lines must include a "Reviewer guide" section pointing reviewers at the order to read in. |
| **Who reviews?** | One human reviewer (code-owner if applicable). The `code-committer` agent ([`.claude/agents/code-committer.md`](../../.claude/agents/code-committer.md)) does **not** count as the reviewer — it can author, but it cannot approve. |
| **What blocks merge?** | Red CI, unresolved review thread, PR description missing required sections (template at [`.github/pull_request_template.md`](../../.github/pull_request_template.md)). |
| **Merge strategy?** | **Squash-and-merge** by default. The squashed commit message is the PR title (Conventional Commits) + the PR body as commit body. |
| **After merge?** | Delete the branch (GitHub does this automatically when configured). Pull `main` locally; husky `post-merge` runs `npm install` for you. |
| **Linked issues?** | Every PR closes ≥ 1 issue (`Closes #N` in the body) — that's how the dashboard's defect-flow KPIs work. Pure-docs PRs MAY skip this if no defect/feature ticket existed. |

> See [`workflow.md`](./workflow.md) for the long-form playbook, including the difference between `Draft` and "ready for review", how to handle conflict resolution mid-review, and the post-merge cleanup checklist.

## Commit-message convention — at a glance

This repo enforces **Conventional Commits** via husky + commitlint:

```
<type>(<optional scope>): <subject ≤ 100 chars>

<optional body, lines ≤ 120 chars>

<optional footer>
```

**Allowed types:** `build` · `chore` · `ci` · `docs` · `feat` · `fix` · `perf` · `refactor` · `revert` · `style` · `test`.

**Why this matters:** machine-parseable commit messages drive the **release-notes generator** (see [`history.md#releases-and-tags`](./history.md#releases-and-tags)), the **dashboard's "what shipped" panel**, and the **traceability matrix** linking a Jira ID to a commit to a tag.

> The full rule list, examples, anatomy diagram, and bypass policy already live in [`documents/husky-guidelines.md`](../husky-guidelines.md) §"`commit-msg` — enforce Conventional Commits". Don't duplicate; reference.

## History hygiene — at a glance

| Operation | Allowed where? |
|---|---|
| `git commit --amend` | Only on commits **not yet pushed** (or on a feature branch only you work on) |
| `git rebase -i` | Only on the feature branch, before opening the PR (or after pushing the branch but before requesting review) |
| `git rebase main` | Allowed at any time on a feature branch to keep it current |
| `git push --force-with-lease` | Only on **your own** feature branch, never on `main` or shared branches |
| `git push --force` (no `-with-lease`) | **Forbidden everywhere** — too easy to clobber a teammate |
| Force push to `main` | **Forbidden absolutely**. Branch protection blocks it; if it ever lands, treat it as an incident (see [`SECURITY.md`](../../SECURITY.md)) |
| `git filter-repo` / history rewrite on `main` | **Forbidden** except for documented secret-leak remediation (see [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks") |
| Cherry-pick from feature → `main` | Only via PR — never directly to `main` |
| Cherry-pick from `main` → release/hotfix branch | Allowed; preserve original SHA reference in the commit body (`Cherry-picked-from: <sha>`) |

> Long-form rationale, recovery via `git reflog`, conflict-resolution playbook, and the release/tag/hotfix process all live in [`history.md`](./history.md).

## How this folder connects to the rest of the repo

| Connection | What it does |
|---|---|
| [`documents/husky-guidelines.md`](../husky-guidelines.md) | Documents the **local hook layer** that enforces this guideline at commit/push time. This file documents the **policy**; that file documents the **enforcement**. |
| [`commitlint.config.js`](../../commitlint.config.js) | Machine-readable form of the Commit-message convention table above. |
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | The PR-author surface for the PR contract above. Reviewers verify the checklist; merge is blocked until it's filled. |
| [`SECURITY.md`](../../SECURITY.md) | Hardening guarantees (no `--no-verify` on protected branches, no force-push to `main`, no secrets in committed files). This folder operationalises the workflow side; `SECURITY.md` operationalises the trust side. |
| [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) | Issues linked from PRs carry these labels. The defect-flow dashboard panels read from there. |
| [`scripts/fetch-defects.ts`](../../scripts/fetch-defects.ts) | Reads merged PRs and their linked issues to compute the **arrival-vs-closure** KPI (see Section 3 of the QA Metrics Dashboard). |
| [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) | Section 3's "Arrival vs Closure" line chart and "Defect Leakage" KPI both depend on the PR convention defined here. |
| [`documents/ci/shared-conventions.md`](../ci/shared-conventions.md) | The CI contract assumes the branch model defined here (e.g., `main`-only deploy gating). |
| [`.claude/agents/code-committer.md`](../../.claude/agents/code-committer.md) | The agent is configured to obey this guideline — Conventional Commits, no `--no-verify`, no force-push to protected branches, no `git config` mutations. |
| Cursor skills | [`.agents/skills/git-advanced-workflows/SKILL.md`](../../.agents/skills/git-advanced-workflows/SKILL.md) (rebase / cherry-pick / reflog / bisect / worktrees), [`.agents/skills/git-pushing/SKILL.md`](../../.agents/skills/git-pushing/SKILL.md) (Conventional commit + push), and [`.agents/skills/git-pr-workflows-git-workflow/SKILL.md`](../../.agents/skills/git-pr-workflows-git-workflow/SKILL.md) (end-to-end PR drive) all assume this guideline. |

## Cadences

| Cadence | Action | Owner |
|---|---|---|
| Per change | Branch + PR per the contract above | Author |
| Per merge to `main` | CI runs, dashboard refreshes (`scripts/fetch-defects.ts` + `scripts/export-dashboard-pdf.ts`) | CI |
| Weekly | Triage open PRs older than 5 days; either merge, close, or convert to draft + flag | Reviewers |
| Monthly | Review branch-protection rules; rotate code-owners as team changes | Repo admin |
| Per release | Tag, generate release notes from Conventional Commits since last tag, attach the dashboard artifact | Release owner (rotating) |
| Quarterly | Audit `--no-verify` usage in `git log` — if any pattern emerges, fix the underlying tool friction | Repo admin |

## Anti-patterns this folder is designed to prevent

| Anti-pattern | Counter built into this folder |
|---|---|
| Long-lived feature branches that diverge for weeks | 5-day branch lifetime cap; feature-flag escape hatch documented |
| "We use `develop` because the textbook said so" | Branching-model table explicitly forbids `develop`, with the rationale |
| Merge commits cluttering `main` | Squash-and-merge default; linear-history protection rule on `main` |
| Force-push to `main` clobbering teammates | "Forbidden everywhere" + branch protection rule |
| Commit messages too vague to generate release notes | Conventional Commits enforced by husky `commit-msg` |
| Mega-PRs nobody can review | ≤ 400-line target; "Reviewer guide" required above 600 |
| Hotfixes that diverge from `main` | Hotfix branches must merge **back** to `main` and re-tag, not leave the fork dangling |
| Secret leak survives history-rewrite | "Rotation, then rewrite" rule (cross-ref [`SECURITY.md`](../../SECURITY.md)) — git history is not a secret |
| Bypassing hooks ("I'll fix the lint later") | `--no-verify` is allowed for documented reasons only; quarterly audit of usage |
| Different teams reporting incompatible "what shipped" lists | Single tag scheme + Conventional Commits → single release-notes generator |

## Out of scope

This folder is **not**:

- A general "Git tutorial". For first-Git users, see [pro git book](https://git-scm.com/book/en/v2). This folder assumes Git literacy and documents the *convention* on top.
- A platform admin guide. Branch-protection rules, CODEOWNERS files, GitHub Org permissions etc. are configured in the GitHub UI by repo admins; this folder describes the **expected outcome**, not the click-path.
- A licence to skip [`SECURITY.md`](../../SECURITY.md). Workflow rules and security rules are independent — neither overrides the other.
- A replacement for [`documents/husky-guidelines.md`](../husky-guidelines.md). That file documents what runs locally; this folder documents the convention those local checks enforce.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (branching model + PR contract + cross-refs) | Repo admin |
| [`setup.md`](./setup.md) | ✅ v1 (install + SSH + signing + `.gitconfig` baseline + aliases + editor + secret hygiene) | Repo admin |
| [`workflow.md`](./workflow.md) | ✅ v1 (day-to-day path + PR template usage + post-merge cleanup) | Repo admin |
| [`fundamentals.md`](./fundamentals.md) | ✅ v1 (mental model: four areas / refs / reflog / merge types + FAQ + inspection ladder) | Repo admin |
| [`history.md`](./history.md) | ✅ v1 (rebase/amend/cherry-pick/recovery + releases + hotfixes) | Repo admin |
| [`ignore-and-attributes.md`](./ignore-and-attributes.md) | ✅ v1 (`.gitignore` audit + `.gitattributes` baseline recommendation + LFS + generated-file matrix) | Repo admin |
| [`remotes-and-forks.md`](./remotes-and-forks.md) | ✅ v1 (single-remote + fork workflow + mirrors + cross-org + cleanup) | Repo admin |
| [`advanced-layout.md`](./advanced-layout.md) | ✅ v1 (worktrees + submodules + subtrees + monorepo patterns) | Repo admin |
