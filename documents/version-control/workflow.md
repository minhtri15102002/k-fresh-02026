# Day-to-Day Git Workflow

> The path every change takes from your machine to `main`: **branch → commit → push → PR → review → merge → CI → dashboard**. Builds on the model in [`README.md`](./README.md). The husky / commitlint / lint-staged mechanics they rely on already live in [`documents/husky-guidelines.md`](../husky-guidelines.md) and are not duplicated here.

If you've done 5 PRs in this repo and remember the order — `git switch -c feat/...` → commit → `git push` → open PR → squash-merge — you can skim. If you've done none, follow the section numbers in order.

---

## 1 · Pick the right branch type and name

| Change type | Branch prefix | Example | Lifetime |
|---|---|---|---|
| New behaviour | `feat/` | `feat/cart-discount-edge` | ≤ 5 days |
| Fixing a defect | `fix/` | `fix/checkout-shipping-flicker` | ≤ 2 days |
| Refactor (no behaviour change) | `refactor/` | `refactor/cart-locator-naming` | ≤ 2 days |
| Docs only | `docs/` | `docs/security-toolchain` | ≤ 1 day |
| Build / tooling | `chore/` | `chore/bump-playwright-1.59` | ≤ 1 day |
| CI changes | `ci/` | `ci/add-zap-baseline` | ≤ 2 days |
| Tests only | `test/` | `test/cart-api-rate-limit` | ≤ 2 days |
| Production hotfix | `hotfix/` | `hotfix/2026-05-10-cart-leak` | ≤ 1 day |
| Spike / POC | `spike/` | `spike/playwright-mcp-eval` | ≤ 3 days, **must be deleted** |

The prefix matches the Conventional Commit `<type>` so the squashed commit message and the branch name tell the same story. If the prefix and the eventual commit type would disagree, you're on the wrong branch — switch.

> **Rules.** Lower-case only. `-` between words, never `_` or `/`. Don't include your username (`alice/feat-cart`); GitHub already shows the author. Don't include a date except for `hotfix/` (where the date disambiguates same-day rollbacks).

```bash
git switch main
git pull --rebase --autostash       # always rebase, never merge, when refreshing main
git switch -c feat/cart-discount-edge
```

> Why `--rebase --autostash`? It keeps your local commits on top of upstream and stashes any in-progress work automatically. Set it once globally:
>
> ```bash
> git config --global pull.rebase true
> git config --global rebase.autoStash true
> ```

---

## 2 · Make small, atomic commits

The goal is **commits a future you (or a bisect) can reason about**. Two practical rules:

1. **One concept per commit.** If the message would have an "and" in it, split.
2. **Each commit compiles / passes lint.** This is what makes `git bisect` useful (see [`history.md`](./history.md#bisect)).

Don't worry about polish — you can `rebase -i` before opening the PR (see [`history.md`](./history.md#rebase) §"Interactive rebase before PR"). The husky `pre-commit` hook will auto-fix lint / format issues on staged files.

### Commit-message format (enforced)

```
<type>(<optional scope>): <subject — imperative, ≤ 100 chars>

<optional body — wrap at 120 chars>

<optional footer — `Refs: KAN-123`, `Closes #42`, `BREAKING CHANGE: …`>
```

Allowed types: `build · chore · ci · docs · feat · fix · perf · refactor · revert · style · test`.

> Full reference + examples: [`documents/husky-guidelines.md`](../husky-guidelines.md) §"`commit-msg` — enforce Conventional Commits".

### Examples that pass

```text
feat(cart): apply discount before tax on quantity update
fix(checkout): debounce shipping-section render race
refactor(profile): inline addressBook helper that had one caller
docs(security): add gitleaks pre-commit setup
test(cart-api): cover 422 on missing product_id
```

### Examples that fail

```text
update stuff                                  ← no type, no subject discipline
feat: WIP                                     ← never push WIP to main; squash before opening PR
Feat(cart): Apply Discount Before Tax         ← Title-Case subject forbidden
fix(cart): apply discount before tax. Also …  ← "Also …" → split into a second commit
```

---

## 3 · Push the branch

```bash
git push -u origin HEAD
```

The first push sets the upstream; subsequent ones can be `git push` alone. The husky `pre-push` hook runs:

1. `npm run check:all` (`eslint --fix` + `tsc --noEmit`)
2. A grep for `\.only` in `tests/` — catches `test.only(...)` left behind in debug runs

A red `pre-push` is a **good** failure: fix it before CI does. If the lint auto-fixed your files, those changes need a follow-up commit before pushing — `git status` will show them.

> See [`documents/husky-guidelines.md`](../husky-guidelines.md) §"`pre-push` — gate the push" for the bypass policy. Short version: don't `--no-verify` unless you have a documented reason.

---

## 4 · Open the PR

```bash
gh pr create --fill                  # picks up branch name + first commit
# or
gh pr create --title "feat(cart): apply discount before tax" --body-file <(cat .github/pull_request_template.md)
```

### Required parts of the PR description

The template at [`.github/pull_request_template.md`](../../.github/pull_request_template.md) has every section pre-filled with hints. Reviewers will check:

| Section | Why |
|---|---|
| **Description** | What and why, in plain English. ~3 sentences. |
| **Type of Changes** | One or more checkboxes — drives release-notes categorisation. |
| **Test Coverage** | Which suites changed, which scenarios are now exercised. |
| **Testing Instructions** | The exact `npm run test ...` invocation a reviewer can paste. |
| **Checklist** | Tests pass, no lint, docs updated. Each unchecked box is an ask of the reviewer to verify, not a sign of a half-done PR. |
| **Related Issues** | `Closes #N` or `Refs #N`. **Required** for `feat/` and `fix/` PRs — that's how the dashboard's defect-flow KPIs link a fix to a bug. |

### Draft vs ready

- **Draft** = "CI is welcome, reviewers please don't read yet". Open as draft as soon as the branch compiles. Drafts cost nothing; long-running un-pushed local branches cost a lot (machine dies, work lost).
- **Ready for review** = "I believe this is mergeable; please find what I missed". Don't flip to ready while CI is still running unless you genuinely want a review on a half-passing build (rare).

```bash
gh pr ready                          # promote draft → ready
gh pr edit --add-label "ready-for-review"
```

### Size discipline

| Lines changed (excluding generated) | Expected |
|---|---|
| ≤ 200 | One reviewer, ≤ 1 hour to review. |
| 200–400 | One reviewer; PR description should explain the order to read in. |
| 400–600 | Author MUST add a "Reviewer guide" section pointing reviewers at the order to read in (e.g., "1. Read `tests/api/test-cart.spec.ts` first; 2. then `pages/cart-page.ts`"). |
| > 600 | Strong default to **split** before requesting review — see [`README.md`](./README.md) §"Why short-lived?" and [`.agents/skills/split-to-prs/SKILL.md`](https://cursor.directory). |

> A 1500-line PR is not a sign of productivity; it's a sign that two PRs were merged into one. Reviewers will ask for a split, which costs more time than splitting it would have in the first place.

---

## 5 · The review loop

### Author etiquette

- **Re-read your own diff before requesting review.** Catch the obvious before a human does.
- **Reply to every comment** — even with just "👍 done in <commit-sha>". Silent acknowledgement looks like ignoring.
- **Don't squash-as-you-go.** Reviewers track changes via individual commits. If you must rebase, push the result and **leave a comment** ("rebased on `main` to resolve conflict in `pages/cart-page.ts`").
- **Don't engage in long debate threads.** If a comment goes past 3 round-trips, switch to a 15-minute call and post the conclusion as the resolution.

### Reviewer etiquette

- **First pass within 1 working day.** A 3-day-old PR is a 3-day-stale-`main` problem.
- **Distinguish blocking from advisory.** Prefix non-blocking comments with `nit:` or `suggestion:` so the author knows what they have to fix vs what they can defer.
- **Approve only when you'd merge it yourself.** "LGTM if CI is green" without reading the diff is anti-pattern.
- **Use suggestion blocks** for ≤ 3-line edits — author can apply with one click.

### Mid-review conflicts

If `main` moves while a PR is open and you get a conflict:

```bash
git switch feat/cart-discount-edge
git fetch origin
git rebase origin/main               # NOT `git merge origin/main`
# resolve, then:
git add -A
git rebase --continue
git push --force-with-lease
```

`--force-with-lease` (not `--force`) protects against clobbering changes pushed by a co-author. If the rebase is hairy, see [`history.md`](./history.md#rebase) §"Rebase rescue".

> **Why rebase, not merge?** Merge commits in feature branches make squash-and-merge generate a multi-line commit message that's hard to read in `git log --oneline`. Rebasing keeps the squash output one clean line.

---

## 6 · Merge

### The merge button

| Method | When |
|---|---|
| **Squash and merge** | **Default.** Always. The squashed commit's message is the PR title (Conventional Commits) + PR body. |
| Rebase and merge | Only when the feature was already authored as a clean, atomic chain you want preserved on `main` (rare; usually a one-commit PR). |
| Create a merge commit | **Forbidden.** Branch-protection rule blocks it. |

> The "squash and merge" commit message GitHub generates is the **public** message future reviewers will read. Edit it before clicking — strip the `* fix typo` chatter from intermediate commits, keep just the high-quality squashed body.

### CI gate

Merge is blocked by branch protection until:

- All required checks are green (CI matrix, lint, typecheck, secret scan, …).
- ≥ 1 reviewer has approved.
- No unresolved review comments.
- The PR description has the required sections filled.

If a check is flaky (false-fail), don't disable it. **Re-run** the failing job (`gh run rerun <id>`); if it fails again, file a flaky-test issue per [`.agents/skills/flaky-test-triage/SKILL.md`](../../.agents/skills/flaky-test-triage/SKILL.md) and **don't merge** until the test is genuinely passing.

---

## 7 · After merge — the cleanup

### What GitHub does for you

- Deletes the feature branch from the remote (if branch-deletion is enabled).
- Closes any issues referenced by `Closes #N`.
- Triggers the post-merge CI workflow on `main` — runs the full Playwright suite, refreshes `reports/run-summary.json` and `reports/run-trend.json`, regenerates the dashboard.

### What you do locally

```bash
git switch main
git pull --rebase --autostash        # picks up your squashed commit
git branch -d feat/cart-discount-edge
git remote prune origin              # clean up references to deleted remote branches
```

The husky `post-merge` hook runs `npm install` for you, so if the merge bumped `package-lock.json` you don't end up running with stale `node_modules/`.

### How it appears on the dashboard

After CI runs on `main`:

1. `scripts/fetch-defects.ts` reads any GitHub Issues your PR closed and updates their `closedAt`. The **Arrival vs Closure** trend chart in Section 3 of the QA Metrics Dashboard adds one to the "closed" bucket for the current month.
2. The Conventional Commit type/scope/subject is what the dashboard's future "What shipped this sprint" panel will read; if you typed garbage commit messages, that panel will be unreadable.
3. If your PR introduced a new bug (your CI run flagged one), the issue you filed (or that the new failing test produced) carries the canonical labels and rides the same panel; see [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md).

---

## 8 · Common follow-up situations

### "I need to update the PR after a review comment"

```bash
# make the change
git commit -m "fix(cart): handle discount on zero-qty case"
git push
```

Just a normal commit + push. Reviewers see the new commit; they don't need a force-push.

### "The reviewer asked me to combine two of my commits"

Use a fixup + interactive rebase — see [`history.md`](./history.md#fixup) §"Fixup workflow". Force-push with `--force-with-lease` after.

### "My branch is way behind `main`"

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

If the rebase is painful, that's a signal the branch has been open too long. Consider closing and re-opening as two smaller PRs.

### "I accidentally committed a secret"

**Stop.** Don't push.

- If unpushed: `git reset --soft HEAD~1`, remove the secret, re-commit, then read [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks" anyway because you might still have the secret in your reflog.
- If pushed: rotate the secret **first**. Then file a private report per [`SECURITY.md`](../../SECURITY.md) §"Reporting a vulnerability". History rewrite is a *follow-up*, not a fix.

### "I want to abandon this PR"

```bash
gh pr close <PR-number> --comment "Superseded by #<N>" --delete-branch
```

A closed PR is a perfectly fine outcome; closing one without explanation is not. Always leave a one-line comment so a future reader knows whether to revive or skip.

### "Two PRs touch the same file and I don't want to wait"

You don't get to skip. Whichever PR merges second has to rebase on `main` (per §5 "Mid-review conflicts" above), re-run CI, and re-request approval if the resolution is non-trivial. This is a feature, not a bug — it forces conversations about ownership before they become silent overwrites.

---

## Cheat sheet

```bash
# Start a feature
git switch main && git pull --rebase --autostash
git switch -c feat/cart-discount-edge

# Commit (husky enforces Conventional Commits)
git add -p
git commit -m "feat(cart): apply discount before tax on quantity update"

# Push (husky runs check:all + .only guard)
git push -u origin HEAD

# Open PR
gh pr create --fill

# Refresh against main mid-review
git fetch origin && git rebase origin/main && git push --force-with-lease

# After merge
git switch main && git pull --rebase --autostash
git branch -d feat/cart-discount-edge && git remote prune origin
```

> Anything outside this loop — rebases that go wrong, cherry-picks across branches, releases, hotfixes, history recovery — lives in [`history.md`](./history.md).
