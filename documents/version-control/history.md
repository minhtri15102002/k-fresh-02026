# Git History, Rebase, Releases & Recovery

> The rarer operations — what to do when the simple "branch → commit → push → PR → squash-merge" loop in [`workflow.md`](./workflow.md) doesn't fit. Covers `rebase`, `amend`, `fixup`, `cherry-pick`, `bisect`, `reflog` recovery, releases & tags, and the hotfix path. Also documents the **history-rewrite policy** (what's allowed, what isn't, and why).

If you've never used `git rebase -i`, read §1 before doing it on a branch you care about. If you've done 50 rebases, skim and use the cheat sheet at the bottom.

---

## 1 · Rebase

### Why we use it

- Keeps `main` linear (every commit on `main` is a squash from a PR; no merge bubbles).
- Keeps feature branches "on top of" `main` instead of diverging — easier to read, easier to squash, fewer merge-conflict round-trips.
- Makes `git bisect` (§6) trivially correct.

### When you may rebase

| Scenario | Allowed? |
|---|---|
| Your own feature branch, before pushing | ✅ |
| Your own feature branch, after pushing — alone | ✅ (force-push with `--force-with-lease`) |
| Someone else's feature branch you co-author | ⚠️ Coordinate first; never silent force-push |
| `main` | ❌ Branch-protection blocks force-push; even if it didn't, this is forbidden |
| A release branch (none exist in this repo) | ❌ |

### Interactive rebase before PR

The most common rebase: clean up your local history before opening the PR.

```bash
git rebase -i origin/main            # opens your editor with all commits since main
```

Each line starts with one of:

| Verb | Effect |
|---|---|
| `pick` | Keep as-is |
| `reword` (`r`) | Keep but edit the message |
| `edit` (`e`) | Stop and let you change the contents |
| `squash` (`s`) | Combine with previous, **merge messages** |
| `fixup` (`f`) | Combine with previous, **drop this message** |
| `drop` (`d`) | Discard the commit |

The rule of thumb: every commit that survives the rebase should be **independently meaningful**. Throwaway "wip" / "fix typo" / "address review" commits should be `fixup`'d into the commit they belong to.

### Rebase against an updated `main`

```bash
git fetch origin
git rebase origin/main
# resolve conflicts, then:
git add -A
git rebase --continue
git push --force-with-lease
```

If you get lost mid-rebase, `git rebase --abort` returns you to the pre-rebase state. Always safe.

### Rebase rescue

Hairy rebases happen when a feature branch has been open too long. Two practical escape routes:

1. **Reset to upstream and replay**:

   ```bash
   git fetch origin
   git switch -c feat/cart-discount-edge-v2 origin/main
   git cherry-pick origin/feat/cart-discount-edge~5..origin/feat/cart-discount-edge   # cherry-pick the SHAs you want
   ```

   The original branch is preserved as backup. New branch is on top of `main`, with cherry-picks fast-forwarded.

2. **Squash first, then rebase** — if your branch has 30 commits and 3 conflicts, squash the 30 to 1 first:

   ```bash
   git switch feat/cart-discount-edge
   git reset --soft origin/main         # keeps changes staged, drops the commit chain
   git commit -m "feat(cart): apply discount before tax on quantity update"
   git rebase origin/main               # only one commit to rebase now
   ```

   Use sparingly — you lose the history reviewers had already seen. Best when the PR is in draft.

---

## 2 · Amend

`git commit --amend` rewrites the **last** commit. Useful for:

- Fixing a typo in the last message.
- Adding a forgotten file to the last commit.
- Changing the author/committer (rare).

```bash
# fix the message
git commit --amend                   # opens editor

# add a forgotten file
git add forgotten-file.ts
git commit --amend --no-edit
```

**Allowed only on commits not yet pushed** (or on a feature branch where you're the only author). After amending an already-pushed commit, you need `git push --force-with-lease` — see [`README.md`](./README.md) §"History hygiene".

---

## 3 · Fixup

The everyday version of "amend a previous commit". Covers the case where review feedback applies to commit #3 of #5 — you can't `--amend` because it only touches the last commit.

### Workflow

```bash
# make the change addressing review
git add pages/cart-page.ts
git commit --fixup=<sha-of-the-commit-being-fixed>
# `git log --oneline` shows: "fixup! feat(cart): apply discount before tax"

# when ready, fold all fixups into their targets:
git rebase -i --autosquash origin/main
# editor opens with fixup commits already lined up under their target — just save & quit
git push --force-with-lease
```

`git commit --fixup=<sha>` + `rebase -i --autosquash` is **the** correct way to address review feedback on a non-tip commit. Don't manually re-order; let `--autosquash` do it.

> Set this once globally so you never forget the flag:
> ```bash
> git config --global rebase.autoSquash true
> ```

---

## 4 · Cherry-pick

Cherry-pick copies a commit's diff onto another branch. Two legitimate uses:

| Direction | When |
|---|---|
| `main` → hotfix branch | Backporting a fix that's already on `main` to a hotfix branch (rare in this repo because hotfix branches are forked from a tag; usually you cherry-pick *from* hotfix back to main, see §8) |
| Long-lived feature → `main` (via PR) | When part of a large feature is shippable now and the rest isn't. Open a PR with the cherry-picked commits, do not push directly. |

### Mechanics

```bash
git switch main
git pull --rebase --autostash
git switch -c hotfix/2026-05-10-cart-leak
git cherry-pick <sha>
# resolve conflicts if any, then:
git cherry-pick --continue
git push -u origin HEAD
```

Always preserve provenance in the commit body:

```
fix(cart): clamp quantity to non-negative before discount

Cherry-picked-from: a1b2c3d  (PR #142)
```

The footer makes the original SHA traceable forever, even after squash-merge.

### Forbidden cherry-pick patterns

- Cherry-picking **directly to `main`** without a PR. Branch protection blocks it; even if it didn't, the change escapes review.
- Cherry-picking the same commit to **multiple long-lived branches** to "spread" a fix. We don't have multiple long-lived branches; if you find yourself doing this, the branch model has drifted.

---

## 5 · Reflog recovery — when you lose work

`git reflog` is the local-only log of every HEAD movement. It's how you recover from "oh god I just `git reset --hard` and lost an hour".

```bash
git reflog                           # paginated list, freshest first
# example output:
# 12abc34 (HEAD -> feat/cart) HEAD@{0}: reset: moving to HEAD~5
# 56def78  HEAD@{1}: commit: feat(cart): apply discount before tax  ← this is what you want
git reset --hard 56def78             # restore to that commit
```

Reflog entries persist for **90 days by default**, so as long as you act within a few weeks the work is recoverable. The reflog is local — it does not exist on the remote.

### Common recoveries

| You ran… | Recovery |
|---|---|
| `git reset --hard HEAD~3` and lost commits | `git reflog` → find the SHA before the reset → `git reset --hard <sha>` |
| `git rebase` produced unwanted result | `git reflog` → find the SHA labelled `rebase (start)` → `git reset --hard <that-sha>` (or `git rebase --abort` if mid-rebase) |
| Deleted a branch with unmerged commits | `git reflog` → find the last `commit:` on that branch → `git switch -c <recovered-branch> <sha>` |
| Force-pushed and clobbered teammate's work | Apologise, then they `git reflog` on their machine. **You** don't have a recovery path because you only ever had the lease, never their commits. This is why we use `--force-with-lease`. |

> See [`.agents/skills/git-advanced-workflows/SKILL.md`](../../.agents/skills/git-advanced-workflows/SKILL.md) for an extended recovery playbook.

---

## 6 · Bisect

`git bisect` binary-searches the commit that introduced a regression. It works because every commit on `main` is small (squash-merge) and (per §1) compiles + lints — invariants that make automated bisect feasible.

```bash
git bisect start
git bisect bad                       # current HEAD is broken
git bisect good v1.4.0               # this older tag was fine
# git checks out the midpoint; you test, then:
git bisect good                      # if midpoint passes
# or
git bisect bad                       # if midpoint fails
# repeat until git names the culprit, then:
git bisect reset
```

For automation:

```bash
git bisect run npm run test -- --grep "cart-discount"
```

`git bisect run` keeps testing automatically until the breaking commit is named — the build output lands on your terminal at the end.

### When bisect doesn't work

- Build broken at a midpoint commit (commits don't all build) → `git bisect skip`
- Test is flaky → fix the flakiness first; bisect on a green-on-retries test gives random answers
- Regression range is too wide (1000+ commits) → narrow with a `git log --grep "<feature>"` first

---

## 7 · Tags & Releases

### Versioning

We use **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Bump | When |
|---|---|
| MAJOR | Backwards-incompatible change to the public-ish surface (test framework conventions, dashboard JSON contract, agent skills' input shape). Requires the `BREAKING CHANGE:` commit footer. |
| MINOR | New feature backwards-compatibly added (`feat:` commits since last tag). |
| PATCH | Backwards-compatible fix (`fix:` / `perf:` commits since last tag). Pure-`docs:` / `chore:` does **not** trigger a release. |

### Tagging on `main`

Releases are **annotated, signed tags** on `main`. They are not branches.

```bash
git switch main && git pull --rebase --autostash
git tag -a v1.5.0 -m "v1.5.0"        # `-s` to also sign with GPG, recommended
git push origin v1.5.0
```

Naming: `v<MAJOR>.<MINOR>.<PATCH>` with the `v` prefix. No build numbers, no `-rc` suffix unless you genuinely have an RC cycle (we don't).

### Generating release notes

The Conventional-Commits convention (enforced by husky `commit-msg`) is what makes this automatic:

```bash
gh release create v1.5.0 \
  --title "v1.5.0" \
  --generate-notes \
  --target main
```

`--generate-notes` reads the commits since the previous tag and groups them by `<type>`:

```
## What's Changed
### feat
- feat(cart): apply discount before tax on quantity update by @khanhdo
- feat(profile): allow address-book bulk delete by @bob

### fix
- fix(checkout): debounce shipping-section render race by @alice

### docs
- docs(security): add gitleaks pre-commit setup by @khanhdo
```

If your commit messages didn't follow the convention, this output is gibberish — that's why husky enforces it at commit-msg time, not at release time.

### Release artifact

Attach the dashboard PDF to the release:

```bash
npm run export:dashboard             # produces artifacts/qa-metrics-dashboard.pdf
gh release upload v1.5.0 artifacts/qa-metrics-dashboard.pdf
```

The release is then a **single, durable URL** for "what shipped, what passed, what's open" — useful for compliance + auditability.

### Pre-releases (rare in this repo)

If you ever ship an RC:

```bash
git tag -a v1.5.0-rc.1 -m "v1.5.0-rc.1"
git push origin v1.5.0-rc.1
gh release create v1.5.0-rc.1 --prerelease --generate-notes
```

`--prerelease` keeps it out of the "Latest" badge until you tag the real `v1.5.0`.

---

## 8 · Hotfix

A **hotfix** is a fix for a defect that's already in a released tag, when the next planned release is too far away to wait.

### When you actually need one

| Situation | Hotfix? |
|---|---|
| Critical bug in `v1.5.0`, next release is in 2 days | **No** — wait, fix in `main`, ship as `v1.5.1` on the planned date. |
| Critical bug in `v1.5.0`, next release is in 2 weeks | **Yes** — hotfix path. |
| Bug in `main` that hasn't shipped yet | **No** — just fix on `main` like any other bug. |
| Customer found a bug, but it's `severity:major`, not critical | **No** — file the bug, fix on `main`, schedule for the next release. |

If you're wrong about needing a hotfix, you've burned coordination cost for no benefit. The hotfix path exists; it's not the default.

### The hotfix path

1. **Branch from the tag, not `main`**:

   ```bash
   git fetch --tags
   git switch -c hotfix/2026-05-10-cart-leak v1.5.0
   ```

2. **Fix it** with the smallest possible diff. Minimise scope — a hotfix is not a refactor.

3. **Open a PR targeting `main`**:

   ```bash
   git push -u origin HEAD
   gh pr create --base main --title "fix(cart): clamp quantity to non-negative before discount" \
     --label "bug,severity:critical,module:cart,priority:p1,root-cause:logic,phase:e2e,found-in:prod"
   ```

   Note the `found-in:prod` label — this is what makes the **Defect Leakage KPI** in the dashboard (Section 3) reflect the leak.

4. **Squash-merge to `main`** when CI is green and review approved.

5. **Tag the new patch** on `main`:

   ```bash
   git switch main && git pull --rebase --autostash
   git tag -a v1.5.1 -m "v1.5.1"
   git push origin v1.5.1
   gh release create v1.5.1 --generate-notes --target main
   ```

6. **Delete the hotfix branch**:

   ```bash
   git push origin --delete hotfix/2026-05-10-cart-leak
   git branch -d hotfix/2026-05-10-cart-leak
   ```

> The hotfix branch is **not** a long-lived release branch. It is forked from a tag, merges to `main`, and is deleted. There is no `v1.5.x` long-lived branch. If the hotfix doesn't apply cleanly to `main` because `main` has diverged, it's a `cherry-pick` to a fresh branch off `main` — see §4.

### Rollback

If a hotfix makes things worse:

```bash
git revert <merge-commit-sha>        # creates a new commit that undoes the merge
git push origin main                 # via PR — never directly
git tag -a v1.5.2 -m "v1.5.2 (revert v1.5.1)"
gh release create v1.5.2 --target main --generate-notes
```

`git revert` is **not** a force-push or a history rewrite — it adds a new commit. This is the only way to "undo" something on `main`.

---

## 9 · History rewrite policy

| Operation | Allowed where? |
|---|---|
| `git commit --amend` on un-pushed commit | ✅ |
| `git commit --amend` on pushed commit (own feature branch only) | ⚠️ Coordinate; force-push with `--force-with-lease` |
| `git rebase` on feature branch | ✅ |
| `git rebase` on `main` | ❌ Branch protection blocks |
| `git push --force-with-lease` to feature branch | ✅ |
| `git push --force-with-lease` to `main` | ❌ |
| `git push --force` (no `-with-lease`) anywhere | ❌ Forbidden — too easy to clobber |
| `git filter-repo` / BFG / `filter-branch` on feature branch | ⚠️ Discouraged; coordinate |
| `git filter-repo` on `main` | ❌ Except for documented secret-leak remediation per [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks" — and even then, **rotation is the real fix**, history rewrite is cosmetic |

### Why "rotation is the real fix"

If a secret leaked into `main`'s history:

- Anyone who cloned (CI, contributors, mirrors) **already has the secret**.
- Public forks contain the secret in their reflog even after upstream rewrite.
- GitHub Pages / Releases / Wayback may have indexed the secret.

History rewrite reduces blast radius for *future* clones, but does not unleak the secret. **Rotate the credential first**, then (optionally) rewrite. Never rewrite without rotating; never trust a rewrite as a remediation step in isolation.

---

## Cheat sheet

```bash
# Interactive rebase to clean up history before PR
git rebase -i origin/main

# Address review feedback on a non-tip commit
git commit --fixup=<sha>
git rebase -i --autosquash origin/main
git push --force-with-lease

# Recover lost work
git reflog
git reset --hard <recovered-sha>

# Cherry-pick with provenance
git cherry-pick <sha>
git commit --amend            # add `Cherry-picked-from: <sha>` to the body

# Bisect a regression automatically
git bisect start
git bisect bad
git bisect good v1.4.0
git bisect run npm run test -- --grep "<failing-pattern>"
git bisect reset

# Tag a release
git tag -a v1.5.0 -m "v1.5.0"
git push origin v1.5.0
gh release create v1.5.0 --generate-notes --target main

# Hotfix
git switch -c hotfix/2026-05-10-cart-leak v1.5.0
# fix; open PR --base main; squash-merge; then:
git tag -a v1.5.1 -m "v1.5.1" && git push origin v1.5.1

# Revert a bad merge on main
git revert <merge-sha>        # via PR
git tag -a v1.5.2 -m "v1.5.2 (revert v1.5.1)"
```

---

## See also

- [`README.md`](./README.md) — branching model + PR contract.
- [`workflow.md`](./workflow.md) — the day-to-day path that this file extends.
- [`documents/husky-guidelines.md`](../husky-guidelines.md) — the local hook layer.
- [`SECURITY.md`](../../SECURITY.md) — secret-leak remediation, agent permission policy.
- [`.agents/skills/git-advanced-workflows/SKILL.md`](../../.agents/skills/git-advanced-workflows/SKILL.md) — extended recovery playbook (rebase / cherry-pick / reflog / bisect / worktrees).
- [`.agents/skills/git-pushing/SKILL.md`](../../.agents/skills/git-pushing/SKILL.md) — Conventional commit + push.
- [`.agents/skills/git-pr-workflows-git-workflow/SKILL.md`](../../.agents/skills/git-pr-workflows-git-workflow/SKILL.md) — end-to-end PR drive.
