# Git Fundamentals — Mental Model & FAQ

> If [`workflow.md`](./workflow.md) tells you **what** to do and [`history.md`](./history.md) tells you **what's allowed**, this file tells you **what is happening underneath** — so you can debug Git when it surprises you, predict what a command will do before running it, and recover from "I have no idea what I just did".
>
> You can do 90% of day-to-day Git work without reading this file. But every developer eventually hits the day where `git status` says something inexplicable, or a `git rebase` produces a result that "shouldn't be possible". On that day, this file is the cheap way out.
>
> This is **not** a "Pro Git" replacement — for that, read [git-scm.com/book](https://git-scm.com/book/en/v2). This file documents the slice of Git's mental model that makes [`history.md`](./history.md) operations and [`advanced-layout.md`](./advanced-layout.md) decisions intuitive instead of memorised.

---

## 1 · The four areas

Every file you touch in a Git repo lives in one of four places at any moment:

```
┌────────────┐   git add    ┌─────────┐   git commit   ┌─────────────┐
│  WORKING   │ ───────────► │  INDEX  │ ─────────────► │  OBJECT DB  │
│   TREE     │              │ (stage) │                │ (.git/objects)
│            │ ◄─────────── │         │ ◄───────────── │             │
└────────────┘  git restore └─────────┘ git restore    └──────┬──────┘
                            (--staged)  --staged              │
                                                              │
                                                              ▼
                                                       ┌─────────────┐
                                                       │   REFS      │
                                                       │ branches /  │
                                                       │ tags / HEAD │
                                                       └─────────────┘
```

| Area | What it is | Lives where |
|---|---|---|
| **Working tree** | The files you can see in your editor | Your filesystem (`pages/`, `tests/`, etc.) |
| **Index** (a.k.a. stage / staging area) | A snapshot of "what the next commit will contain" | `.git/index` (binary) |
| **Object database** | All committed history, immutable | `.git/objects/` |
| **Refs** | Named pointers to commits (branches, tags, `HEAD`) | `.git/refs/` and `.git/HEAD` |

Most "weird" Git questions resolve once you know which area is involved.

### Each command in terms of the four areas

| Command | Reads from | Writes to |
|---|---|---|
| `git add foo.ts` | Working tree | Index |
| `git restore --staged foo.ts` | `HEAD` (last commit) | Index |
| `git restore foo.ts` | Index | Working tree |
| `git commit -m "..."` | Index | Object database + the current branch ref |
| `git switch <branch>` | Branch ref | Index + Working tree |
| `git checkout <commit> -- foo.ts` | Object DB at `<commit>` | Index + Working tree (just `foo.ts`) |
| `git reset --soft HEAD~1` | `HEAD~1` | Branch ref only |
| `git reset --mixed HEAD~1` (default) | `HEAD~1` | Branch ref + Index |
| `git reset --hard HEAD~1` | `HEAD~1` | Branch ref + Index + Working tree |
| `git stash` | Working tree + Index | Object DB (special `stash` ref) |
| `git fetch` | Remote | Object DB + remote-tracking refs (no working tree change) |
| `git pull` | Remote | Object DB + remote-tracking refs + branch ref + Index + Working tree |

> **Rule of thumb:** "soft" touches **refs only**, "mixed" also touches the **index**, "hard" also touches the **working tree**. The soft → hard scale is exactly that — increasing scope of change.

---

## 2 · What is a commit, really?

A commit is a small file containing:

```
tree <sha-of-a-tree-object>
parent <sha-of-the-previous-commit>
author <name> <email> <timestamp>
committer <name> <email> <timestamp>

<your commit message>
```

That's it. The commit itself does not contain file diffs. It points to a **tree** (a directory snapshot) and a **parent**. Diffs are computed on the fly by walking from `parent.tree` to `this.tree`.

```bash
git cat-file -p HEAD
# tree 1a2b3c…
# parent 4d5e6f…
# author Khanh Do <khanh@example.com> 1715353200 +0700
# committer Khanh Do <khanh@example.com> 1715353200 +0700
#
# feat(cart): apply discount before tax
```

```bash
git cat-file -p 1a2b3c
# 100644 blob aaaaaaa  README.md
# 040000 tree bbbbbbb  pages
# 040000 tree ccccccc  tests
# (recursively the whole repo at this commit)
```

### Implications

- **Commits are immutable.** Editing a commit (via `--amend`, `rebase`) actually **creates a new commit** with a new SHA; the old one is just abandoned. This is why `git reflog` works (§5 below).
- **Commits know their parent, not their children.** "What branches contain this commit?" requires walking from each branch backwards (`git branch --contains <sha>`).
- **A merge commit has two (or more) parents.** That's literally the only thing that distinguishes a merge from a regular commit.
- **A commit's content is its identity.** The SHA is a hash of (tree + parent + author + committer + message). Change any of those and the SHA changes — that's why force-pushes after rebase rewrite history.

---

## 3 · Refs — branches, tags, and `HEAD`

A **ref** is a name pointing at a commit. Stored as a file under `.git/refs/`:

```
.git/refs/heads/main                ← the branch ref `main`
.git/refs/heads/feat/cart-discount  ← the branch ref `feat/cart-discount`
.git/refs/tags/v1.5.0               ← the tag `v1.5.0`
.git/refs/remotes/origin/main       ← what we last saw on origin's `main`
```

Each file's content is a single 40-character SHA on one line. (Some refs are "packed" into `.git/packed-refs` for performance, but conceptually identical.)

### `HEAD` is the special ref

```bash
cat .git/HEAD
# ref: refs/heads/feat/cart-discount
```

`HEAD` usually points to a branch ref (the branch you're "on"). When you `git commit`, Git:

1. Builds a tree from the index
2. Writes a new commit object with the current `HEAD`'s commit as parent
3. Updates the **branch** that `HEAD` points to → moves it to the new commit

That's the entire commit operation.

### Detached `HEAD`

When you `git checkout <sha>` (or `git switch --detach <sha>`), `HEAD` points **directly at a commit** instead of a branch:

```bash
cat .git/HEAD
# 4d5e6f7g8h9i0j…           (no `ref:` prefix)
```

You can still commit, but the new commit is **on no branch**. If you `git switch` away without giving the new commit a name (`git switch -c new-branch`), the commit is **garbage-collected** within 90 days. Reflog is your only escape.

This is the trap behind submodule "detached HEAD" warnings ([`advanced-layout.md`](./advanced-layout.md) §2).

---

## 4 · The index (a.k.a. staging area)

The index is a binary file at `.git/index` listing every path Git tracks, the SHA of its content, and metadata. It is **the snapshot for the next commit**.

Three views of the same path can disagree:

```bash
git status
# Changes to be committed:
#   modified:   pages/cart-page.ts        ← INDEX vs HEAD
# Changes not staged for commit:
#   modified:   pages/cart-page.ts        ← WORKING TREE vs INDEX
# Untracked files:
#   reports/local-debug.json              ← in WORKING TREE, not in INDEX
```

The same file can appear under "Changes to be committed" **and** "Changes not staged" if you `git add`'d an early version, then edited the file. The index has version A; the working tree has version B; HEAD has version 0. Three versions, two diffs.

### Why three areas (not two)?

The index lets you commit a **subset** of your edits:

```bash
git add -p                             # interactively stage hunks
git commit -m "feat(cart): A"
git add -p                             # stage another set
git commit -m "fix(cart): B"
```

You authored A and B in the same editing session; you split them at commit time. Without the index, that requires two stash dances per commit.

> **Tip:** `git add -p` (patch mode) is the single most underused Git command. Read its `?` help once.

### The index is also the ground truth for `git diff`

```bash
git diff                       # working tree vs INDEX
git diff --staged              # INDEX vs HEAD          (a.k.a. --cached)
git diff HEAD                  # working tree vs HEAD   (skips the index)
git diff origin/main           # working tree vs origin/main
git diff origin/main..feature  # commits on `feature` but not on `origin/main`
```

If you find yourself reading a `git diff` whose output makes no sense, check **which two areas Git is actually comparing**. The flag set tells you.

---

## 5 · Reflog — Git's safety net

Whenever `HEAD` (or any branch) moves, Git appends a line to **the reflog**: a local-only journal of "where this ref was, before we moved it".

```bash
git reflog                     # HEAD reflog
# 8h9i0j1 HEAD@{0}: rebase: feat(cart): apply discount before tax
# 4d5e6f7 HEAD@{1}: rebase (start): checkout origin/main
# 1a2b3c4 HEAD@{2}: commit: feat(cart): apply discount before tax
# 9z8y7x6 HEAD@{3}: checkout: moving from main to feat/cart

git reflog feat/cart           # branch-specific reflog
```

Reflog entries persist for **90 days** by default. As long as you act within ~3 months, virtually any "lost" commit is recoverable:

```bash
# Whoops, rebased and the result is wrong
git reset --hard HEAD@{1}      # back to where I was before the rebase started
```

Reflog is **local only** — it's not pushed, not fetched, not shared. If you force-push and a teammate had un-reflogged work in their checkout of your branch, only their machine has the recovery path. (This is why force-with-lease, not force-no-lease, is the only correct push variant — see [`history.md`](./history.md) §9.)

### Reflog vs `git log`

| | `git log` | `git reflog` |
|---|---|---|
| Shows | Commit history (parent chain) | Ref-movement history |
| Order | By commit timestamp | By when you ran the command |
| Includes commits not on current branch | ❌ | ✅ (any commit `HEAD` has been at) |
| Survives `git push` | ✅ (everyone sees it) | ❌ (local only) |
| Garbage-collected | After being unreachable for 30 days | After 90 days |

When you've "lost" something, you almost always want **reflog**, not log.

---

## 6 · Three types of merge

`git merge feature` (or, on the receiving end, "GitHub merges your PR") can produce three different shapes:

### Fast-forward

```
Before:
  main:    A — B
  feature: A — B — C — D

After `git merge feature` (with --ff):
  main:    A — B — C — D       ← `main` ref just moves forward
```

No new commit is created. `main` was an ancestor of `feature`; nothing to merge. **The repo's `main` is configured `[merge] ff = only`** ([`setup.md`](./setup.md) §5) so `git merge` outside a squash-button-merge fails unless this case applies.

### True merge (forbidden on `main`)

```
Before:
  main:    A — B — C
  feature: A — B — D — E

After `git merge feature`:
  main:    A — B — C — M       ← M has TWO parents: C and E
                  \   /
                   D-E
```

Branch protection blocks this on `main`. The PR template requires squash-merge.

### Squash merge (the repo's default for PRs)

```
Before:
  main:    A — B — C
  feature: A — B — D — E

After GitHub's "Squash and merge":
  main:    A — B — C — F       ← F's tree = the result of merging D+E into C
                                  but F has ONE parent: C
```

`F` is a regular commit; the parent chain stays linear. The full history of the feature branch (D, E) is gone from `main`'s log — only the squashed commit message remains. This is **why** Conventional Commits matter: that one squashed commit is what `gh release create --generate-notes` reads.

> **Implication for `git bisect`** ([`history.md`](./history.md) §6): every commit on `main` is a complete change-set, not a half-finished step. Bisect is reliable because of squash-merge.

---

## 7 · Tags vs branches

Both are refs. The differences:

| | Branch | Tag |
|---|---|---|
| Purpose | Moves with new commits | Pinned to one commit forever |
| Updated by | `git commit` (advances current branch) | Manually with `git tag` |
| Pushed by default | Yes (with `git push` if `[push] default = current`) | No (use `git push --tags` or `[push] followTags = true`) |
| Forced moves allowed | Yes (`--force-with-lease`) | No (without `-f`, immutable) |
| Annotated form available | n/a | Yes — `git tag -a v1.5.0 -m "..."` creates a tag **object** with a message + signer |

This repo uses **annotated, signed tags** for releases (per [`history.md`](./history.md) §7). Lightweight tags (`git tag <name>`, no `-a`) are forbidden for releases — they're just refs and don't survive a `git fetch --tags` cleanup the same way.

---

## 8 · Pull = Fetch + Merge (or Rebase)

`git pull` is two operations:

```
git pull = git fetch + git merge origin/<current-branch>
```

…unless `[pull] rebase = true` (which we set in [`setup.md`](./setup.md) §5):

```
git pull --rebase = git fetch + git rebase origin/<current-branch>
```

The rebase variant keeps your local commits on top of upstream, producing a linear history. This is **why `pull --rebase` matters** — without it, your `git log` is full of "Merge branch 'main' into 'main'" commits whenever you `git pull` while having local work.

If you ever see merge bubbles in your `git log` and you don't remember explicitly merging anything: `[pull] rebase = false` is the smoking gun.

---

## 9 · Origin / upstream / remote-tracking branches

When you `git fetch origin`, Git does two things:

1. Downloads any new commits into the **local object database**.
2. Updates the **remote-tracking refs** under `refs/remotes/origin/`.

```
.git/refs/remotes/origin/main           ← what origin's `main` was at the last fetch
.git/refs/remotes/origin/feat/cart      ← what origin's feature branch was at the last fetch
```

These are not branches you can edit — they're **read-only mirrors** of the remote's state at fetch time. You can only modify them by `git fetch`-ing again.

Your local branch and its remote-tracking branch are two distinct refs:

```
refs/heads/main           ← local main
refs/remotes/origin/main  ← origin's main as of last fetch
```

`git status` says "Your branch is up to date with 'origin/main'" — it's comparing those **two refs**. After someone else pushes to origin, `git status` *still says* up-to-date (it's comparing against the **stale** remote-tracking ref) until you `git fetch` again.

> **The most common surprise:** `git status` doesn't auto-fetch. The "your branch is X commits behind" message is **only** as fresh as your last `git fetch`.

For multi-remote setups (`upstream`, `partner`, etc.), see [`remotes-and-forks.md`](./remotes-and-forks.md).

---

## 10 · FAQ — the troubleshooting playbook

### "I committed to the wrong branch"

```bash
# Move the last commit from this branch to a new one
git branch other-branch                 # save current state with this name
git reset --hard HEAD~1                 # rewind this branch by one
git switch other-branch                 # the commit is now on `other-branch`
```

### "I committed but forgot a file"

```bash
# Last commit, not yet pushed
git add forgotten-file.ts
git commit --amend --no-edit
```

If pushed: do the same, then `git push --force-with-lease`. (Only on a personal feature branch — never on `main`.)

### "I want to undo my last commit but keep the changes"

```bash
git reset --soft HEAD~1                 # uncommit; changes stay staged
# or
git reset HEAD~1                        # uncommit; changes stay in working tree, unstaged
```

### "I want to throw away my last commit and the changes"

```bash
git reset --hard HEAD~1                 # gone; reflog is your friend if you regret
```

### "I want to discard ALL local changes"

```bash
git restore .                           # working tree → index
git restore --staged .                  # index → HEAD
# or both at once:
git checkout HEAD -- .
```

If you also have untracked files you want gone:

```bash
git clean -fd                           # delete untracked files + dirs (DESTRUCTIVE)
git clean -fdn                          # dry-run first, ALWAYS
```

### "`git status` says I'm on a branch I deleted"

You're in detached HEAD on the commit that branch used to point at. `git switch main` to recover.

### "My PR's diff shows files I didn't touch"

Almost always one of:

- **Line endings** — see [`ignore-and-attributes.md`](./ignore-and-attributes.md) §6 (Strategy A solves this)
- **You rebased onto a stale `main`** — `git fetch` then `git rebase origin/main`
- **You merged `main` into your branch instead of rebasing** — `git rebase origin/main` to flatten

### "`git pull` produced a merge commit and I don't want one"

Your global `[pull] rebase` isn't set. Run [`setup.md`](./setup.md) §5 setup or `git config --global pull.rebase true`. Then for **this** branch:

```bash
git reset --hard HEAD~1                 # undo the merge commit (if not pushed)
git pull --rebase                       # try again
```

### "I have a 'fatal: refusing to merge unrelated histories'"

You cloned, then `git pull`'d from a different repo (different initial commit). Almost always wrong — verify the URL.

### "Git says my push was rejected (non-fast-forward)"

Someone else pushed to the same branch. `git pull --rebase` then push again. If the rebase has conflicts, see [`history.md`](./history.md) §1 ("Rebase rescue").

### "`git log` is empty for a file I know existed"

You're on a branch that never had it. Try `git log --all -- path/to/file`.

### "I see commits in `git reflog` I don't remember making"

Probably someone else's commits you merged in. Or you rebased and the original commits are still there. Reflog shows everything `HEAD` ever pointed at, even briefly.

### "`git diff` shows nothing but `git status` says modified"

Almost always a permission-bit change. `git diff --summary` will say `mode change`. To ignore mode changes: `git config core.fileMode false`.

### "I rebased and now there are 30 'fixup!' commits I can't get rid of"

You forgot `--autosquash`. With `[rebase] autoSquash = true` in [`setup.md`](./setup.md) §5, this is automatic. If not:

```bash
git rebase -i --autosquash origin/main
```

The `fixup!` commits will line up under their targets; save and quit.

### "I accidentally committed a secret"

**Stop. Don't push.** See [`workflow.md`](./workflow.md) §8 "I accidentally committed a secret" and [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks". Rotation first; history rewrite is cosmetic ([`history.md`](./history.md) §9).

---

## 11 · Inspection commands — what is Git telling me?

When something's weird, walk down this ladder:

```bash
# 1. Where am I?
git status
git branch -vv                       # local branches + their tracking + last commit

# 2. What does my history look like?
git log --oneline --graph --decorate --all -20

# 3. What did I just do?
git reflog -20

# 4. What's the actual state of an object?
git cat-file -p <sha>                # commit / tree / blob contents

# 5. What's pointing where?
git for-each-ref --format='%(refname) %(objectname:short) %(authordate:iso)' --sort=-authordate refs/

# 6. What am I about to push?
git log @{u}..HEAD --oneline         # commits not yet pushed
git diff @{u}..HEAD                  # changes not yet pushed

# 7. What did the last fetch bring?
git log HEAD..origin/main --oneline  # commits on origin not yet local

# 8. Why is this file ignored / not ignored?
git check-ignore -v path/to/file     # see ignore-and-attributes.md §4
git check-attr -a path/to/file       # see ignore-and-attributes.md §5
```

Most "I have no idea what's going on" sessions resolve in step 1–3.

---

## 12 · Cheat sheet

```bash
# Areas
git add -p                          # interactively stage hunks
git restore --staged file           # un-stage (HEAD → index)
git restore file                    # discard working-tree changes (index → wt)
git diff                            # wt vs index
git diff --staged                   # index vs HEAD
git diff HEAD                       # wt vs HEAD

# Refs
cat .git/HEAD                       # which ref am I on?
git rev-parse HEAD                  # SHA of current commit
git rev-parse main                  # SHA of `main`
git for-each-ref refs/heads         # list all branch refs

# Reflog
git reflog                          # what HEAD has been
git reflog feature/cart             # what `feature/cart` has been
git reset --hard HEAD@{2}           # rewind to where HEAD was 2 moves ago

# Inspect
git cat-file -p <sha>               # commit / tree / blob contents
git log --oneline --graph --decorate --all -30
git branch --contains <sha>         # which branches contain this commit?
git log <sha>..<sha>                # commits in B but not A

# Areas-aware reset
git reset --soft  HEAD~1            # ref only
git reset         HEAD~1            # ref + index   (default `--mixed`)
git reset --hard  HEAD~1            # ref + index + working tree
```

---

## Cross-references

- [`README.md`](./README.md) — branching model + PR contract
- [`setup.md`](./setup.md) — defaults that make this mental model "just work"
- [`workflow.md`](./workflow.md) — daily commands that exercise the model in §1
- [`history.md`](./history.md) — rebase / amend / fixup / cherry-pick / reflog operations explained in §2–§5
- [`ignore-and-attributes.md`](./ignore-and-attributes.md) — `.gitignore` discipline (§1's mental model)
- [`advanced-layout.md`](./advanced-layout.md) — worktrees / submodules / subtrees / monorepo (each builds on §1–§9)
- [`remotes-and-forks.md`](./remotes-and-forks.md) — multi-remote setups (§9 mental model)
- [Pro Git book](https://git-scm.com/book/en/v2) — the canonical long-form reference; this file is a slice
- [Git internals — Plumbing and Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain) — the "what's under the hood" deep dive

## Status

| Section | Status | Owner |
|---|---|---|
| Four areas (working tree / index / object DB / refs) | ✅ v1 | Repo admin |
| Commits as immutable objects | ✅ v1 | Repo admin |
| Refs, HEAD, detached HEAD | ✅ v1 | Repo admin |
| Index / staging area | ✅ v1 (with `git diff` ground-truth section) | Repo admin |
| Reflog as safety net | ✅ v1 (90-day retention; recovery path) | Repo admin |
| Three merge types | ✅ v1 (fast-forward / true / squash) | Repo admin |
| Tags vs branches | ✅ v1 | Repo admin |
| Pull = fetch + merge/rebase | ✅ v1 | Repo admin |
| Remote-tracking refs | ✅ v1 | Repo admin |
| FAQ / troubleshooting | ✅ v1 (15 most-common questions) | Repo admin |
| Inspection ladder | ✅ v1 | Repo admin |
