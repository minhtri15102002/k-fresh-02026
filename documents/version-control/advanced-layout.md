# Advanced Repository Layout — Worktrees, Submodules, Subtrees, Monorepo

> What to do when one repo / one working tree / one project isn't enough. This file covers four mostly-independent topics that come up once you outgrow the simple "clone → branch → PR → merge" loop in [`workflow.md`](./workflow.md):
>
> 1. **Worktrees** — multiple checkouts of the same repo, one per branch
> 2. **Submodules** — embedding another Git repo as a pinned dependency
> 3. **Subtrees** — embedding another Git repo as part of your tree (no external pointer)
> 4. **Monorepo patterns** — when many projects share one repo
>
> Most repos never need any of these. **Don't reach for them by default.** This file is the reference when a real need arises so you adopt the right tool the first time.

---

## 1 · Worktrees — when one checkout isn't enough

### What it is

`git worktree` lets one local repo have **multiple working directories simultaneously**, each on a different branch. Behind the scenes, all worktrees share the same `.git/` object database; only the working tree (and `HEAD`) differs.

```
~/repos/ai-qa-training/                 ← primary worktree, branch: feat/cart
~/repos/ai-qa-training-main/            ← secondary worktree, branch: main
~/repos/ai-qa-training-hotfix/          ← secondary worktree, branch: hotfix/2026-05-10
                                          all share ~/repos/ai-qa-training/.git/
```

### When to reach for it

| Scenario | Use a worktree? |
|---|---|
| Reviewer asks "can you run `npm test` on `main` while I look at your branch?" — without losing your in-progress changes | ✅ Yes — much faster than `git stash` + `git switch` + `npm install` round-trip |
| Maintaining a hotfix on an old release tag while developing a feature on `main` | ✅ Yes — separate worktree per concern |
| Comparing the build output of two branches side-by-side | ✅ Yes |
| You just want to switch branches without a stash | ❌ No — `git stash` + `git switch` is faster |
| You want to copy a file from another branch | ❌ No — `git checkout <branch> -- <path>` is one command |
| Multi-project monorepo with shared CI | ❌ No — that's §4 (monorepo), not worktrees |

### Mechanics

```bash
# From inside the primary worktree (any branch):
git worktree add ../ai-qa-training-main main
# Creates ~/repos/ai-qa-training-main/ checked out to `main`.

git worktree add -b hotfix/2026-05-10 ../ai-qa-training-hotfix v1.5.0
# Creates a new branch from tag v1.5.0 in a sibling directory.

# List active worktrees:
git worktree list
# /Users/khanhdo/repos/ai-qa-training         abc1234 [feat/cart]
# /Users/khanhdo/repos/ai-qa-training-main    def5678 [main]
# /Users/khanhdo/repos/ai-qa-training-hotfix  789abcd [hotfix/2026-05-10]

# Remove a worktree:
git worktree remove ../ai-qa-training-main
# Cleans up the directory and the .git/worktrees/ metadata.

# Forgot to remove it before deleting the directory?
git worktree prune
```

### Constraints

- **Each branch can be checked out in only one worktree at a time.** Trying to add a second worktree on `main` while another already has it errors out — by design, prevents two checkouts from clobbering each other.
- **`node_modules/` is per-worktree**, not shared. Each worktree needs its own `npm install`. (CPU + disk cost; tolerate it.)
- **Husky hooks fire normally** in every worktree — `package.json`'s `prepare` script wires them per-worktree on first `npm install`.
- **`.env` files** must be copied to each worktree manually (they're `.gitignore`'d, so they don't follow the checkout). Most teams symlink: `ln -s ../ai-qa-training/profiles/.env.qa profiles/.env.qa`.

### Worktrees + this repo's discipline

The husky `pre-commit` / `commit-msg` / `pre-push` hooks (per [`documents/husky-guidelines.md`](../husky-guidelines.md)) are wired via `package.json`'s `prepare` script and live in `.husky/`. Every new worktree needs `npm install` to set them up — the **first commit** in a fresh worktree without `npm install` will succeed without hook enforcement and **CI will reject** the PR. Always `npm install` immediately after `git worktree add`.

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Long-lived secondary worktrees on stale branches | They drift; `npm install` rots; you forget about them | Worktrees are short-lived; `git worktree remove` when done |
| Editing the same file in two worktrees | Conflicts on commit; "wait, I fixed that already" confusion | One concern per worktree at a time |
| Sharing `node_modules/` across worktrees via symlink | `npm` lockfile hashes mismatch; debugging nightmares | Per-worktree `node_modules/`; tolerate the disk cost |
| Using a worktree to "save" work-in-progress instead of pushing a draft PR | The worktree is **local only** — laptop dies, work lost | Push a draft PR; worktrees are for parallel checkouts, not for backup |

---

## 2 · Submodules — pinning another repo inside this one

### What it is

A **submodule** is a reference inside this repo pointing at a specific commit of *another* Git repo. The other repo's contents appear as a subdirectory in the working tree, but the parent repo only commits the **pointer** (the SHA + URL), not the contents.

```
ai-qa-training/                    ← parent repo
├── tests/
├── pages/
└── vendor/
    └── design-system/              ← submodule pointer
        ├── (working tree of org/design-system @ a1b2c3d)
        └── .git                    ← actual git dir lives elsewhere
```

The parent repo stores in `.gitmodules`:

```
[submodule "vendor/design-system"]
    path = vendor/design-system
    url = git@github.com:yourorg/design-system.git
```

…and stores in its own commit:

```
160000 commit a1b2c3d  vendor/design-system
```

— the special `160000` mode tells Git "this is a submodule, not a directory".

### When to reach for it

| Scenario | Use a submodule? |
|---|---|
| You depend on a library that has its own release process and you want to pin **exact commits** (not semver ranges) | ✅ Yes |
| Internal shared library with its own CI, used by many repos | ✅ Yes |
| You need to **patch** the embedded code and feed patches back upstream | ✅ Yes — submodule lets you commit upstream-side |
| You want a third-party library with no patches, and `npm` / `pip` already publishes it | ❌ No — use the package manager |
| You want to vendor a small utility into your repo | ❌ No — use a subtree (§3) or just copy-paste |
| Your design team gives you an asset bundle and you don't care about its history | ❌ No — copy it in, commit, move on |

### Mechanics — adding a submodule

```bash
git submodule add git@github.com:yourorg/design-system.git vendor/design-system
git commit -m "build: add design-system as submodule"
```

Two things were committed: `.gitmodules` (the URL + path) and the submodule pointer (the SHA).

### Mechanics — cloning a repo with submodules

```bash
git clone --recurse-submodules git@github.com:yourorg/ai-qa-training.git
# or, if you forgot:
git submodule update --init --recursive
```

> **Always** clone with `--recurse-submodules`. A clone without it leaves submodule directories empty; CI failure is the usual symptom.

### Mechanics — updating a submodule

```bash
cd vendor/design-system
git fetch
git switch main && git pull
cd ../..
git add vendor/design-system            # records the new SHA
git commit -m "build(deps): bump design-system to <new-sha-prefix>"
```

The parent repo always pins to a **specific commit**. If you don't `git add` the submodule path after pulling, the parent repo still points at the old commit.

### Mechanics — removing a submodule

```bash
git submodule deinit vendor/design-system
git rm vendor/design-system
git commit -m "build: remove design-system submodule"
rm -rf .git/modules/vendor/design-system
```

(The last line cleans up the parent repo's cached copy of the submodule's `.git` directory; without it, re-adding the same submodule later confuses Git.)

### Pain points (be honest)

- **Most contributors find submodules confusing.** PR reviewers see "the SHA changed" but not the diff inside the submodule. Fix: link the submodule diff in the PR description (`gh repo view yourorg/design-system -w` → compare view).
- **Detached HEAD inside the submodule** — by default, after `git submodule update`, the submodule is at a specific SHA, not on a branch. Edits there won't go anywhere unless you explicitly `git switch` first. Set `submodule.<name>.update = rebase` or `merge` in `.gitmodules` to ease this.
- **CI must be configured** with `submodules: recursive` (GitHub Actions: `actions/checkout@v4` with `submodules: recursive`).
- **Permissions matter** — if the submodule is in a private repo, every CI runner and every contributor needs read access. SSH key forwarding or a PAT with submodule scope is required.

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Submodule for a third-party package that has an `npm` release | You're rebuilding `npm` poorly | `npm install pkg` |
| Submodule with auto-update CI ("always latest") | Defeats the purpose of pinning | Pin explicitly; bump in a PR like any other dep |
| Multi-level submodules (a submodule has its own submodules) | Onboarding pain compounds | Flatten — one level deep, max |
| Submodule pointing at a specific developer's fork | When that dev leaves, the URL 404s | Always point at the org repo |
| Submodule for the dashboard's HTML / JSON contracts | These are fast-iterating; submodule churn would dominate the parent | Inline them; this is exactly the case where subtrees (§3) win |

---

## 3 · Subtrees — embedding another repo inline

### What it is

`git subtree` copies the **contents** of another repo into a subdirectory of yours, then optionally lets you push changes back upstream. Unlike a submodule, the parent repo's history **contains** the embedded repo's commits — there's no external pointer.

```
ai-qa-training/                    ← parent repo
├── tests/
├── pages/
└── vendor/
    └── design-system/              ← REAL FILES from org/design-system, merged into history
        ├── components/
        ├── tokens/
        └── README.md
```

### When to reach for it (vs submodule)

| Concern | Submodule | Subtree |
|---|---|---|
| Onboarding ease | ⚠️ Confusing for many devs | ✅ "Just files" |
| Repo size | ✅ Tiny (just a pointer) | ⚠️ Carries embedded history |
| Pinning to a specific upstream commit | ✅ Enforced by SHA | ⚠️ Up to you to update |
| Getting upstream's new commits | `git submodule update` | `git subtree pull` |
| Contributing changes back upstream | Edit in submodule, push to upstream | `git subtree push` (extracts your edits) |
| Single-clone simplicity (`git clone` is enough) | ❌ Needs `--recurse-submodules` | ✅ Yes |

> **Rule of thumb:** if upstream is **frequently updated** and the team is fluent in submodules, use a submodule. If upstream is **rarely updated** OR onboarding ease matters more than diff cleanliness, use a subtree. If neither applies, don't embed at all.

### Mechanics — adding a subtree

```bash
git subtree add --prefix=vendor/design-system \
  git@github.com:yourorg/design-system.git main \
  --squash
```

`--squash` collapses the upstream's entire history into one merge commit so your repo doesn't inherit thousands of foreign commits.

### Mechanics — pulling upstream updates

```bash
git subtree pull --prefix=vendor/design-system \
  git@github.com:yourorg/design-system.git main \
  --squash
```

### Mechanics — pushing local changes upstream

```bash
git subtree push --prefix=vendor/design-system \
  git@github.com:yourorg/design-system.git feature/my-fix
# Then open a PR against upstream from `feature/my-fix`.
```

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Subtree without `--squash` | Inherits the entire upstream history; repo grows fast | Always `--squash` for vendoring |
| Forgetting `--prefix` (typing `--prefix=` then a wrong path) | Breaks the subtree relationship; future pulls fail | Save the exact subtree command in a `Makefile` / `package.json` script |
| Subtree for a large dependency | History bloat — every `subtree pull` adds upstream content to your pack | Use submodule or package manager |
| Subtree for a fast-moving upstream | Continuous merge pain | Submodule |

---

## 4 · Monorepo patterns

A **monorepo** is one Git repo containing multiple independent (or semi-independent) projects:

```
megaco-platform/
├── packages/
│   ├── ui/                  ← React component library
│   ├── api/                 ← Backend HTTP API
│   ├── jobs/                ← Background workers
│   └── shared/              ← Types / utils used by all of the above
├── apps/
│   ├── web/                 ← Customer-facing web app
│   └── admin/               ← Internal admin tool
├── tools/
│   └── scripts/             ← Bin scripts shared by all projects
└── package.json             ← npm workspaces / pnpm / yarn berry / nx / turborepo
```

This repo (`ai-qa-training`) is **not** a monorepo — it's a single test-framework-plus-curriculum project. But QA leadership often inherits or adopts monorepos, so the pattern is documented here for the case you encounter it.

### When a monorepo is justified

- **Shared types / utils** between many projects, that change in lock-step
- **Atomic refactors** across projects (one PR can update all callers of a shared API)
- **Single CI pipeline** owns the cross-project quality gate
- **Fewer dependency-drift bugs** (one `package.json` resolves all transitive deps once)

### When a monorepo is not justified

- The projects have **independent release cadences** and rarely affect each other → multi-repo is fine; the pain isn't worth the tooling
- The team is **< 10 engineers** → CI runtime + tooling overhead exceeds the win
- The projects have **fundamentally different stacks** (Java + Python + Go) → tooling per stack is friction; multi-repo lets each project breathe

### Tooling choices

| Tool | When to pick |
|---|---|
| **`npm`/`pnpm`/`yarn` workspaces** | Single-stack JS/TS monorepo, ≤ 50 packages |
| **Nx** | TS/JS monorepo with rich task-graph + caching needs |
| **Turborepo** | Like Nx but lighter; Vercel ecosystem |
| **Bazel / Buck / Pants** | Polyglot monorepo; thousands of packages; you have a build-team |
| **Lerna** | Legacy; replaced by the above. Don't pick for new repos. |

### CI patterns for monorepos

The big monorepo win is **selective CI** — only run tests for the packages that actually changed. Tools like Nx Affected, Turborepo Filter, and Bazel `bazel test //changed/...` make this happen.

Pair with `playwright.config.ts` projects per-package so a CI run only spins up the test slice that matters. The [`ci-optimizer`](../../.agents/skills/ci-optimizer/SKILL.md) and [`parallel-sharding`](../../.agents/skills/parallel-sharding/SKILL.md) skills cover the test-runtime side.

### Branching in a monorepo

`feat/`, `fix/`, etc. branch prefixes per [`workflow.md`](./workflow.md) §1 still apply — but **scope the commit type** to the package:

```
feat(api/cart): apply discount before tax
fix(ui/checkout): debounce shipping render race
chore(shared/types): bump semver of `Money` interface
```

This keeps the auto-generated release notes (per [`history.md`](./history.md) §7) usable even when 8 packages all version on the same release.

### Versioning in a monorepo

Two schools:

| Strategy | When |
|---|---|
| **Independent versioning** | Each package has its own `package.json` `version`; consumers pin per-package | Use when packages have independent release cadences |
| **Lockstep versioning** | All packages share one version, bumped together (e.g., `v2.5.0` everywhere) | Use when packages are tightly coupled internal tooling; cuts release-management overhead |

Tools: `changesets` (independent), `lerna version` (either), `nx release` (either).

### Anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Monorepo without selective CI | Every PR runs all tests; CI runtime explodes | Use Nx Affected / Turborepo Filter / Bazel queries |
| Monorepo with > 1000 PRs/week and no CODEOWNERS | Reviewer roulette | Auto-assign per `packages/**` path via `.github/CODEOWNERS` |
| Forcing a monorepo on a polyglot team to "consolidate" | Each language's tooling fights for the same `Makefile` / CI surface | Monorepo per language; cross-repo discipline elsewhere |
| Monorepo branch model that lets a `feat/` PR touch 12 packages | Reviews become impossible | Cap PR size per [`workflow.md`](./workflow.md) §4; split aggressively |
| Submodules **inside** a monorepo | Compounding complexity | If you need a submodule, the project is already independent — split it out |

---

## 5 · Decision tree

```
Q1. I want multiple working trees of the same repo at once.
       → Worktrees (§1)

Q2. I want to embed another repo and pin it precisely.
       → Submodule (§2)

Q3. I want to embed another repo and have it look like normal files.
       → Subtree (§3)

Q4. I want many projects in one repo.
       → Monorepo (§4) — only if §4's "when justified" applies

Q5. I'm tempted to use any of the above to share code.
       → STOP. Try a package manager first (npm / pip / cargo / maven).
         Submodules / subtrees / monorepo are last-resort answers when
         the package-manager-shaped solution doesn't fit.
```

---

## 6 · Cheat sheet

```bash
# Worktrees
git worktree add ../proj-main main
git worktree list
git worktree remove ../proj-main

# Submodules
git submodule add git@github.com:org/lib.git vendor/lib
git submodule update --init --recursive
cd vendor/lib && git fetch && git switch main && git pull && cd -
git add vendor/lib && git commit -m "build(deps): bump lib"

# Subtrees
git subtree add    --prefix=vendor/lib git@github.com:org/lib.git main --squash
git subtree pull   --prefix=vendor/lib git@github.com:org/lib.git main --squash
git subtree push   --prefix=vendor/lib git@github.com:org/lib.git feature/my-fix
```

---

## Cross-references

- [`README.md`](./README.md) — branching model + PR contract
- [`workflow.md`](./workflow.md) — day-to-day path; worktrees and monorepos still play by these rules
- [`history.md`](./history.md) — `git lfs migrate` and submodule-history operations are history rewrites; same constraints
- [`setup.md`](./setup.md) — SSH keys + `.gitconfig` baseline that make submodule auth work without surprises
- [`remotes-and-forks.md`](./remotes-and-forks.md) — multi-remote setups; submodules are sometimes the right answer to a fork problem
- [`fundamentals.md`](./fundamentals.md) — what a Git ref / commit / index actually is (helps when submodule "detached HEAD" first confuses you)
- [`.agents/skills/git-advanced-workflows/SKILL.md`](../../.agents/skills/git-advanced-workflows/SKILL.md) — extended Git playbook; covers worktrees + bisect
- [`.agents/skills/ci-optimizer/SKILL.md`](../../.agents/skills/ci-optimizer/SKILL.md), [`.agents/skills/parallel-sharding/SKILL.md`](../../.agents/skills/parallel-sharding/SKILL.md) — monorepo CI runtime tuning
- [Pro Git §git-worktree](https://git-scm.com/docs/git-worktree), [Pro Git §submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules), [Pro Git §subtree](https://git-scm.com/book/en/v2/Git-Tools-Advanced-Merging) — canonical references

## Status

| Section | Status | Owner |
|---|---|---|
| Worktrees | ✅ v1 (use cases + constraints + repo-discipline notes) | Repo admin |
| Submodules | ✅ v1 (mechanics + pain points + anti-patterns) | Repo admin |
| Subtrees | ✅ v1 (vs-submodule decision matrix) | Repo admin |
| Monorepo patterns | ✅ v1 (when-justified + tooling choice + CI + versioning) | Repo admin |
| Decision tree | ✅ v1 | Repo admin |
