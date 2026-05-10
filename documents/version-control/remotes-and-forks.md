# Remotes & Forks

> How to configure and operate **multiple Git remotes** safely — for the contributing-from-a-fork workflow, multi-org setups (GitHub + internal GitLab mirror), and the rare but consequential cases where your repo has to talk to more than one upstream. Builds on the SSH / signing setup in [`setup.md`](./setup.md) and the branch / PR discipline in [`workflow.md`](./workflow.md). The day-to-day single-remote loop is unchanged; this file is the reference when one remote isn't enough.

---

## 1 · What a remote actually is

A **remote** is a named URL pointing at another Git repository. Your local repo can have any number of them. Operations like `git fetch`, `git push`, and `git pull` take a remote name (default: `origin`).

```bash
git remote -v
# origin    git@github.com:yourorg/ai-qa-training.git (fetch)
# origin    git@github.com:yourorg/ai-qa-training.git (push)
```

Each remote brings its own namespace of remote-tracking branches under `refs/remotes/<remote>/`:

```
refs/heads/feat/cart                ← your local branch
refs/remotes/origin/main            ← what `origin` had at the last `git fetch`
refs/remotes/upstream/main          ← what `upstream` had at the last `git fetch`
```

Two remotes can have **identical-looking** branches (`origin/main` and `upstream/main`) that have **diverged**. Confusion about *which* `main` you're rebasing on is the #1 multi-remote pitfall. The cure is naming discipline: `upstream` is always the source-of-truth org repo; `origin` is your fork (in fork workflows) or **the** repo (in single-remote workflows).

---

## 2 · The single-remote case (no fork)

Most contributors at this org don't need anything beyond `origin`. The single-remote shape:

```
You ─── push/pull ───► origin (yourorg/ai-qa-training)
```

`git clone` sets up `origin` for you. `git pull --rebase --autostash` and `git push` both default to `origin`. Nothing in [`workflow.md`](./workflow.md) needs to change.

> **Don't add a second remote unless §3, §4, or §5 below applies.** Extra remotes add cognitive load and footguns; only adopt them when the workflow demands it.

---

## 3 · Contributing-fork workflow (GitHub)

### When this applies

You don't have **write access** to the org repo (open-source contributions, cross-org collaborations, or your org's internal "fork → PR" policy for sensitive repos). You contribute by:

1. Forking the upstream repo to your account.
2. Cloning your fork locally.
3. Adding upstream as a second remote so you can pull updates.
4. Pushing branches to your fork.
5. Opening a PR from your fork's branch back to the upstream's `main`.

### Setup

```bash
# 1. On GitHub: click "Fork" on the upstream repo's page.

# 2. Clone YOUR fork (not the upstream):
git clone git@github.com:<your-handle>/ai-qa-training.git
cd ai-qa-training

# 3. Add upstream as a second remote:
git remote add upstream git@github.com:yourorg/ai-qa-training.git

# 4. Verify:
git remote -v
# origin    git@github.com:<your-handle>/ai-qa-training.git (fetch)
# origin    git@github.com:<your-handle>/ai-qa-training.git (push)
# upstream  git@github.com:yourorg/ai-qa-training.git       (fetch)
# upstream  git@github.com:yourorg/ai-qa-training.git       (push)

# 5. Disable accidental push to upstream — you don't have write access anyway,
# but this fails fast with a clear message:
git remote set-url --push upstream DISABLED
git remote -v
# upstream  git@github.com:yourorg/ai-qa-training.git       (fetch)
# upstream  DISABLED                                         (push)
```

### Daily loop

```bash
# 1. Refresh against upstream's main
git fetch upstream
git switch main
git rebase upstream/main
git push origin main                          # keep YOUR fork's main in sync

# 2. Branch from upstream's main, not origin's
git switch -c feat/cart-discount-edge upstream/main

# 3. Make your changes; commit per workflow.md §2

# 4. Push to YOUR fork
git push -u origin HEAD

# 5. Open the PR — gh detects the fork relationship
gh pr create --base main --repo yourorg/ai-qa-training
# (the --base + --repo flags target upstream; HEAD is on origin)
```

### Mid-review refresh

If `upstream/main` moves while your PR is open:

```bash
git fetch upstream
git rebase upstream/main
git push --force-with-lease origin <your-branch>
```

> The `git push --force-with-lease` is going to **your fork**, not upstream. You can never force-push to upstream — they don't grant you that permission, and that's a feature.

### Keeping your fork's `main` clean

Many fork contributors get into a tangle where their fork's `main` has commits the upstream doesn't. Avoid this:

- **Never commit directly to your fork's `main`.** Always work on a feature branch.
- **Always rebase your fork's `main` onto `upstream/main`** (don't merge).
- **If your fork's `main` has diverged**, hard-reset it:
  ```bash
  git fetch upstream
  git switch main
  git reset --hard upstream/main
  git push --force-with-lease origin main
  ```

  This wipes any local-only commits on `main` — only safe because you should never have made them.

### Receiving review feedback that touches files outside your fork

If the maintainer says "actually we'll handle this part on our side", they may push commits to **their** branch derived from your PR. Stay synced:

```bash
gh pr checkout <pr-number>                    # gh CLI handles the cross-fork checkout
```

`gh pr checkout` resolves the fork remote and the PR branch automatically — you don't have to manually add the maintainer's fork as a third remote.

---

## 4 · Multi-remote for org-internal mirrors

### When this applies

Your repo is hosted on GitHub but has to **mirror** to a second host: an internal GitLab instance, an Azure DevOps repo, AWS CodeCommit, or a corporate mirror for compliance. The pattern:

```
Developer ──► origin (GitHub)
                  │
                  │ scheduled mirror
                  ▼
              gitlab (internal)
```

### Setup (read-write developer side)

You do **not** need both remotes locally. Most developers push only to `origin`; the mirror is automated server-side. The exception is a release engineer who occasionally pushes a tag straight to the mirror.

```bash
# Only if you need to push to the mirror manually (rare):
git remote add gitlab git@gitlab.internal:platform/ai-qa-training.git
git fetch gitlab
```

### Setup (mirror side — server / CI)

The mirror is usually configured **once**, in CI or via the host's built-in mirror feature:

| Source → mirror | How |
|---|---|
| GitHub → GitLab | GitLab "Pull mirroring" feature, with a deploy key on GitHub |
| GitHub → GitHub (org → personal) | GitHub Actions: `git push --mirror` step on `push: { branches: [main] }` |
| GitHub → Azure DevOps | Azure DevOps "Import repository" + scheduled `git fetch --mirror` |
| GitLab → GitHub | GitHub "Pull mirroring" via PAT |

Document **which direction is canonical** in this repo's README so contributors know where to PR.

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Active development on **both** mirrors | Inevitable divergence; one becomes stale | Pick one canonical host; mirror is read-only |
| Manual `git push gitlab` after every `git push origin` | Forgotten 1 in 10 times; mirror drifts | Automate the mirror server-side |
| Mirror with different access control than canonical | "Privileges leak" — sensitive code visible on mirror | Mirror's ACL must be ≥ canonical's restriction |
| `git remote add` with a typo'd URL that 404s | First push of the day fails mysteriously | Always `git fetch <remote>` immediately after adding to verify |

---

## 5 · Multi-remote for cross-org collaboration

### When this applies

Two organisations are jointly developing a piece of code temporarily — a shared component, a contractor handoff, a partner integration. Each side has their own canonical repo; you want to **pull** from theirs occasionally without merging your repos permanently.

```
You ──► origin (yourorg/repo)
   ──► partner (partnerorg/repo)
```

### Setup

```bash
git remote add partner git@github.com:partnerorg/repo.git
git fetch partner
```

### Importing a branch from partner

```bash
# Inspect what they have
git log partner/feature-x --oneline -10

# Import the branch as your own (preserves their commits with their authorship)
git switch -c integrate/partner-feature-x partner/feature-x

# OR cherry-pick selected commits
git cherry-pick partner/feature-x~3..partner/feature-x

# Push to your origin (NOT partner) for review
git push -u origin HEAD
```

The partner's commits are now on your repo with **their authorship preserved** — your team's PR review and CI gates apply normally; their work shows up correctly attributed in `git log` and the dashboard.

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Pushing to a partner's remote without prior agreement | Surprises them; might violate their branch protection | Coordinate first; PR-into-fork model is safer |
| Merging an entire partner branch onto your `main` without re-reviewing | Their CI / standards aren't yours | Cherry-pick selectively; re-run your CI gate |
| Leaving the `partner` remote configured after the collaboration ends | Stale remote; future `git fetch --all` does work for nothing | `git remote remove partner` when done |
| Sharing CI secrets across the boundary | Cross-org credentials leak | Each side's CI uses its own secrets |

---

## 6 · Useful multi-remote commands

```bash
# Show all remotes and what they track
git remote -v

# Inspect a remote in detail
git remote show origin
# (lists branches present on remote, branches your local tracks, push/pull URLs)

# Rename a remote
git remote rename origin oldorigin
git remote rename oldorigin origin

# Change the URL (e.g., HTTPS → SSH after setup.md §3)
git remote set-url origin git@github.com:yourorg/ai-qa-training.git

# Remove a remote
git remote remove partner

# Fetch from all remotes at once
git fetch --all --prune

# Compare your branch with another remote's branch
git log origin/main..upstream/main --oneline
# (commits on upstream/main that aren't yet on origin/main)

# Push a tag to a specific remote
git push upstream v1.5.0
# (tags don't auto-follow `git push` unless [push] followTags = true in setup.md §5)

# Show all remote-tracking branches
git branch -r
# origin/main, origin/feat/cart, upstream/main, upstream/feat/somebody-elses-branch
```

---

## 7 · Remote-tracking branch hygiene

Stale remote-tracking branches accumulate over time — branches deleted on the remote but still showing up locally. Symptoms: `git branch -r` is full of `origin/feat/2024-something` that no longer exists on GitHub.

### One-time cleanup

```bash
git fetch --prune                             # remove stale refs/remotes/origin/<branch>
# or globally, once: setup.md §5 sets fetch.prune = true
```

### When to also delete the local branch

After a PR squash-merges, your local `feat/cart-discount-edge` is **not** auto-deleted. Clean up after `git pull` on `main`:

```bash
git branch --merged main | grep -v '^\*\|main' | xargs -r git branch -d
# or use the `git cleanup` alias from setup.md §6
```

> Doing this regularly prevents `git branch` from becoming a 50-line wall of dead branches that you have to grep through.

---

## 8 · Multi-remote with the husky / signing discipline

Multi-remote setups don't change the rules from [`setup.md`](./setup.md):

- Every commit is **signed** (SSH / GPG) — applies regardless of which remote you push to.
- Every push triggers `pre-push` (lint + typecheck + `.only` guard) — applies regardless of remote.
- Branch protection is **per-remote** — `upstream/main` may have stricter rules than `origin/main` (your fork). Rebases / force-pushes that work on `origin` may be rejected on `upstream`.

The asymmetry is by design: your fork is a draft surface, the upstream is the source of truth.

---

## 9 · Decision tree

```
Q1. I'm cloning to start work.
       → `git clone <url>`. You have `origin`. Done.

Q2. I don't have write access to the canonical repo.
       → Fork it. Add upstream. §3 above.

Q3. The repo has to be mirrored to another host for compliance.
       → Configure server-side mirroring. Most devs only need `origin`. §4 above.

Q4. I'm temporarily pulling code from a partner organisation.
       → Add a `partner` remote. Cherry-pick selectively. §5 above.

Q5. I'm tempted to add a 4th remote.
       → STOP. Document the use case, get a second opinion. Multi-remote
         complexity compounds; usually a 4th remote is solving a problem
         that has a simpler answer (a release process, a CI hook, a
         scheduled mirror).
```

---

## 10 · Cheat sheet

```bash
# Inspect
git remote -v
git remote show origin
git branch -r

# Add / rename / remove
git remote add upstream git@github.com:yourorg/repo.git
git remote rename origin oldorigin
git remote remove partner

# Fork workflow daily loop
git fetch upstream
git switch main && git rebase upstream/main
git push origin main
git switch -c feat/x upstream/main
# ... commit ...
git push -u origin HEAD
gh pr create --base main --repo yourorg/repo

# Cross-fork PR checkout (for reviewing someone else's PR locally)
gh pr checkout <pr-number>

# Cleanup
git fetch --all --prune
git branch --merged main | grep -v '^\*\|main' | xargs -r git branch -d
```

---

## Cross-references

- [`README.md`](./README.md) — branching model + PR contract (apply per-remote with the asymmetric strictness of §8 above)
- [`workflow.md`](./workflow.md) — single-remote daily loop; this file extends it for multi-remote cases
- [`history.md`](./history.md) — rebase / force-push rules; force-with-lease applies to your fork, never to upstream
- [`setup.md`](./setup.md) — SSH key setup that makes `git remote add` work without prompting; same key works for both `origin` and `upstream`
- [`advanced-layout.md`](./advanced-layout.md) — submodules involve a second remote (the submodule's URL); the rules from this file apply
- [`fundamentals.md`](./fundamentals.md) — `refs/remotes/` and tracking-branch mental model
- [`.agents/skills/git-pr-workflows-git-workflow/SKILL.md`](../../.agents/skills/git-pr-workflows-git-workflow/SKILL.md) — end-to-end PR drive; obeys the fork model in §3
- [Pro Git §Distributed Workflows](https://git-scm.com/book/en/v2/Distributed-Git-Distributed-Workflows), [GitHub fork docs](https://docs.github.com/en/get-started/quickstart/fork-a-repo) — canonical references

## Status

| Section | Status | Owner |
|---|---|---|
| Single-remote (default) | ✅ v1 | Repo admin |
| Contributing-fork workflow | ✅ v1 (full setup + daily loop + force-push rules) | Repo admin |
| Org-internal mirrors | ✅ v1 (server-side mirror is canonical) | Repo admin |
| Cross-org collaboration | ✅ v1 (cherry-pick selectively pattern) | Repo admin |
| Remote-tracking hygiene | ✅ v1 (prune + cleanup alias) | Repo admin |
| Decision tree | ✅ v1 | Repo admin |
