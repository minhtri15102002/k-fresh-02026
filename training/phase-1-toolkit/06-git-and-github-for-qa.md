# Module 06 — Git & GitHub for QA

> Phase 1 · Effort: 3h · Prerequisites: Phase 0

## Learning objectives

After this module you can:

- Branch, commit (Conventional Commits), push, and open a PR.
- Resolve a merge conflict without panic.
- Read this repo's `.husky/` hooks and explain why every push is gated.
- Use `git log`, `git blame`, `git bisect` to investigate a regression.
- Cherry-pick a fix from one branch to another.

## Why it matters

A QA engineer who can't navigate Git is permanently dependent on devs to land their tests. You'll also miss half your job: the fastest way to find when a test started failing is `git bisect`.

## Concepts

### Daily workflow

```bash
git checkout main && git pull --rebase
git checkout -b feat/qa-add-checkout-tests
# … edit files …
git add -p                              # stage hunks selectively
git commit -m "test(checkout): cover discount stacking edge cases"
git push -u origin HEAD
gh pr create --fill                     # GitHub CLI; or use the web UI
```

### Conventional Commits (this repo enforces it)

```
<type>(<scope>): <subject>

<body>

<footer>
```

| Type | When |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `test` | Adding or fixing tests |
| `refactor` | Internal change, no behavior diff |
| `chore` | Tooling, deps, build |
| `docs` | Documentation only |
| `ci` | CI / pipeline change |
| `perf` | Performance improvement |

The repo's `.commitlintrc.json` rejects bad commits. Try `git commit -m "fixed stuff"` and watch it fail.

### Branching

- `main` is **protected** — must pass CI + review.
- Feature branches: `feat/<short-desc>`, `fix/<short-desc>`, `test/<short-desc>`.
- Keep branches short-lived; rebase onto `main` daily to avoid drift.

### Pre-push gates

`.husky/pre-push` runs `npm run check:all`:

- `tsc --noEmit` — typecheck
- `eslint` — lint
- (optionally) targeted tests

If any gate fails, the push is rejected. **Don't bypass with `--no-verify`** — the same gates run in CI and fail the PR.

### Investigation tools

| Tool | Use |
|---|---|
| `git log --oneline -20` | Recent commits |
| `git log -p path/to/file` | Full diffs touching one file |
| `git blame path/to/file` | Who last touched each line + commit |
| `git bisect` | Binary-search for the commit that introduced a regression |
| `git diff main…HEAD` | Everything in your branch vs main |

### Merge conflicts — calm version

```bash
git pull --rebase origin main
# conflict appears; edit the files; remove conflict markers
git add <resolved-files>
git rebase --continue
```

Or stop and restart: `git rebase --abort`.

### Cherry-picking

```bash
git checkout main
git cherry-pick <commit-sha-from-feature-branch>
```

Used in this repo when a hotfix lives on `debug` and must reach `main` without merging the rest of `debug`.

## Hands-on lab

1. **Branch & PR** — Create branch `chore/training/<your-name>-phase-1`. Add `training/sandbox/<your-name>/.gitkeep`. Commit with a Conventional Commit message. Push. Open a PR. Get it merged.
2. **Conflict drill** — Edit `README.md` line 1 on two branches. Rebase one onto the other. Resolve.
3. **Bisect drill** — Pick a recent passing commit and a recent failing one (or pretend). Run `git bisect start` / `bad` / `good`. Land on the offending commit.
4. **Read the hooks** — Open `.husky/pre-push`. Explain each step in your PR description.
5. **Cherry-pick** — Cherry-pick one commit from `debug` to a throwaway branch off `main`. Confirm only that commit appears in `git log`.

## Self-check

- [ ] Write a conventional commit for "added 5 tests covering coupon discounts".
- [ ] Your push is rejected by the pre-push hook. What's your first move?
- [ ] CI says test X has been failing for 30 days. How do you find when it started?
- [ ] Difference between `merge` and `rebase`?

## Further reading

- *Pro Git*, Chacon & Straub (free online)
- Conventional Commits spec — conventionalcommits.org
- GitHub CLI — cli.github.com

---

**Next:** [07 — TypeScript for QA](./07-typescript-for-qa.md) · **Up:** [Phase 1 README](./README.md)
