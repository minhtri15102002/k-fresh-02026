# `.gitignore` & `.gitattributes` Discipline

> What belongs in the repo, what doesn't, and how Git should treat the in-between. The `.gitignore` rule set is **the** boundary between "my repo" and "my machine"; `.gitattributes` makes that boundary deterministic across operating systems, editors, and CI runners. Get either wrong and you get the classics: secrets in `git log`, line-ending diffs that touch every file, "works on my machine" merge conflicts, and 800 MB Git pack files because someone committed a `node_modules/`.
>
> This file documents both surfaces for this repo and the principles that decide what lands where.

---

## 1 · Mental model — what is a Git-ignored file, really?

`.gitignore` is **not** a delete list. It is a list of paths Git refuses to **start tracking**. If a file is already tracked, adding it to `.gitignore` does nothing — you must `git rm --cached <path>` first.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Working tree (your filesystem)                                         │
│   src/foo.ts        node_modules/   reports/run-summary.json    .env   │
│        │                  │                    │                  │    │
│        ▼                  ▼                    ▼                  ▼    │
│   tracked          ignored            tracked-but-               ignored│
│   (in index)      (.gitignore)        gitignore'd later          (.env)│
│        │                  │                    │                       │
│        ▼                  ▼                    ▼                       │
│   committed       NEVER committed      still committed unless          │
│                                        you `git rm --cached`           │
└────────────────────────────────────────────────────────────────────────┘
```

Three failure modes follow:

1. **"I added it to `.gitignore` but it still shows up in commits"** — it was tracked before. Run `git rm --cached <path>`.
2. **"I deleted it but `git status` shows nothing"** — `.gitignore` is hiding the deletion in `git status`; you may need `git rm <path>` if it was tracked, or it was never tracked anyway.
3. **"It's in `.gitignore` but `git add -f` adds it"** — `-f` overrides; never use `-f` without a paper-trail comment in the commit body.

---

## 2 · The repo's `.gitignore` (the actual file)

```gitignore
# Playwright
node_modules/
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/playwright/.auth/
.env
/allure-results/
/allure-report/
/reports/run-summary.json
/reports/run-trend.json
/reports/defects.json
/artifacts/
profiles/.env.*
!profiles/.env.*.example
```

Two design choices to call out:

### a) **Some `reports/*.json` files are ignored, but the folder is committed**

```
reports/
├── run-summary.json    ← .gitignore'd; regenerated per CI run
├── run-trend.json      ← .gitignore'd; multi-run rollup
├── defects.json        ← .gitignore'd; fetched by scripts/fetch-defects.ts
├── traceability.json   ← committed; produced by requirements-traceability skill
├── perf/baselines/     ← committed; performance budgets
└── custom-reporter.ts  ← committed; source code
```

The pattern: **derived JSON is ignored; source-of-truth JSON is committed**. If you add a new derived file, gitignore it and document why next to the rule.

### b) **`profiles/.env.*` is ignored except `*.example`**

```gitignore
profiles/.env.*
!profiles/.env.*.example
```

The negation (`!`) is critical — it lets the repo carry a **template** (`profiles/.env.qa.example`) so a new contributor knows which keys to fill, without ever shipping the actual secrets. This is the standard pattern for `.env` discipline; copy it to any new env folder you add.

> **Anti-pattern:** committing a `.env` "with the secrets blanked out" so people can fill them in. The line `STRIPE_SECRET=` is **legible** to git history and may be auto-completed by a teammate's editor with a real key. Always use `.env.example` as a separate file.

---

## 3 · Where `.gitignore` lives — three layers

| Layer | Path | Scope | Use for |
|---|---|---|---|
| **Repo** | `<repo>/.gitignore` | Everyone who clones | Build outputs, logs, env files, IDE files everyone agrees on (`/node_modules/`) |
| **Repo (per-folder)** | `<repo>/some/folder/.gitignore` | Just that folder + below | A scoped rule that doesn't pollute the top-level file (`tests/mobile/apps/`) |
| **Personal global** | `~/.config/git/ignore` | All your repos | Personal IDE files (`.idea/`, `.vscode/`), OS junk (`.DS_Store`, `Thumbs.db`) |

> **Don't** put personal IDE files in the repo's `.gitignore`. Use `~/.config/git/ignore` for personal junk. The repo's `.gitignore` should be aggressively about **the repo**, not about every developer's tooling preferences.

Set the global once:

```bash
mkdir -p ~/.config/git
cat >> ~/.config/git/ignore <<'EOF'
# OS
.DS_Store
Thumbs.db

# Editors
.idea/
.vscode/
*.swp
*~

# Tooling
.direnv/
.venv/
EOF
git config --global core.excludesFile ~/.config/git/ignore
```

(The `core.excludesFile` line is also in [`setup.md`](./setup.md) §5.)

---

## 4 · `.gitignore` syntax cheat sheet

```gitignore
# A comment.

# Ignore a file or folder anywhere in the tree
foo.log

# Ignore a file at the repo root only
/foo.log

# Ignore a folder anywhere
node_modules/

# Ignore everything in a folder, but commit the folder marker
secrets/*
!secrets/.gitkeep

# Wildcards
*.log
*.tmp.*

# Negate a previous rule (must come AFTER the rule it overrides)
*.env
!*.env.example

# Match anything one level deep, but not deeper
foo/*.json

# Match anything at any depth (** glob)
foo/**/*.json

# Backslash to escape a literal '#' or '!'
\#literal-hash-prefix
```

> **Order matters.** `*.env` followed by `!*.env.example` keeps the example. Reverse them and the example is ignored too.

### Test what's ignored

```bash
git check-ignore -v <path>
# Returns the rule that matched, or exits non-zero if not ignored.
git check-ignore -v profiles/.env.qa
# .gitignore:13:profiles/.env.*    profiles/.env.qa
```

`git check-ignore -v` is the only reliable way to debug "why is this file showing up" / "why isn't this file showing up". Don't `cat .gitignore | grep`; that misses inheritance.

---

## 5 · `.gitattributes` — the deterministic layer

`.gitignore` decides **whether** Git tracks a file. `.gitattributes` decides **how** Git treats it: line endings, diff drivers, merge drivers, export rules, LFS, and binary marking.

> **This repo currently does not have a `.gitattributes` file.** That's a gap. The next section is the recommendation; create the file when you need any of the behaviours below.

### Recommended baseline `.gitattributes` for this repo

```gitattributes
# Default: detect text vs binary, normalise line endings to LF in repo
* text=auto eol=lf

# Source — always LF, never CRLF
*.ts        text eol=lf
*.tsx       text eol=lf
*.js        text eol=lf
*.json      text eol=lf
*.md        text eol=lf
*.html      text eol=lf
*.css       text eol=lf
*.yml       text eol=lf
*.yaml      text eol=lf
*.sh        text eol=lf

# Lockfiles — text but treat as generated for diff/PR readability
package-lock.json   text eol=lf linguist-generated=true -diff
yarn.lock           text eol=lf linguist-generated=true -diff

# Windows-only scripts — keep CRLF
*.bat       text eol=crlf
*.cmd       text eol=crlf
*.ps1       text eol=crlf

# Binaries — never line-ending convert, never diff as text
*.png       binary
*.jpg       binary
*.jpeg      binary
*.gif       binary
*.webp      binary
*.ico       binary
*.pdf       binary
*.zip       binary
*.tar.gz    binary
*.woff      binary
*.woff2     binary
*.ttf       binary
*.eot       binary

# Playwright traces / videos
*.zip       binary
*.webm      binary

# Don't ship to source archives (`git archive`)
.github/        export-ignore
.husky/         export-ignore
documents/      export-ignore
training/       export-ignore
.cursor/        export-ignore
*.test.ts       export-ignore
```

### What each directive does

| Directive | Effect |
|---|---|
| `text=auto eol=lf` | Git normalises line endings to LF in the **repo**, converts to OS-native on **checkout** when `core.autocrlf` is set. (See `setup.md` §5: we set `autocrlf=input` — Git stores LF and never converts on checkout, which keeps Windows + macOS + Linux byte-identical.) |
| `text` / `binary` | Force the classification; overrides Git's auto-detection (which is right ~95% of the time but can mis-classify files). |
| `linguist-generated=true` | Tells GitHub's PR diff UI to **collapse** the file by default. Makes 5000-line `package-lock.json` PRs reviewable. |
| `-diff` | `git diff` shows nothing for this file (or a short summary); useful for big lockfiles + binaries. |
| `export-ignore` | `git archive` (which `gh release create` uses to build source-tarballs) **excludes** these paths. Keeps release artifacts focused on shipped code. |

### Apply the file to the existing repo

After creating `.gitattributes`, **renormalise**:

```bash
git add .gitattributes
git commit -m "chore: add .gitattributes baseline"
git add --renormalize .
git commit -m "chore: renormalise line endings per .gitattributes"
```

The second commit may touch many files (line endings only — diff is empty in a sane editor). Push as a separate PR; reviewers approve based on the directive table above, not file-by-file.

---

## 6 · Line endings — the one Git pitfall every team hits

The interaction between `core.autocrlf`, `text=auto`, and `eol=lf` causes more "weird Git diffs" than any other configuration. Three viable strategies; **pick one team-wide**.

| Strategy | `core.autocrlf` | `.gitattributes` | Trade-off |
|---|---|---|---|
| **A — LF everywhere (this repo's choice)** | `input` | `* text=auto eol=lf` | Repo and working tree are LF on every OS. Notepad on Windows displays as one giant line; everyone uses VS Code / Cursor anyway. |
| **B — Native on checkout** | `true` (Win), `input` (mac/Linux) | `* text=auto` | Working tree gets CRLF on Windows, LF elsewhere. Repo stays LF. Git does the conversion. Brittle when one Windows dev forgets to set `autocrlf=true`. |
| **C — Don't touch** | `false` | (no rules) | Repo stores whatever was committed. CRLF / LF mixed. PRs full of phantom line-ending changes. **Forbidden** for any new repo. |

> Stick with **Strategy A**. The `.gitattributes` baseline above and the `core.autocrlf=input` setting in [`setup.md`](./setup.md) §5 implement it. Strategy B exists for legacy Windows-heavy repos.

### Diagnose a line-ending problem

```bash
file path/to/suspect.ts
# `ASCII text` = LF; `ASCII text, with CRLF line terminators` = CRLF
git ls-files --eol path/to/suspect.ts
# i/lf  w/lf  attr/text=auto eol=lf  path/to/suspect.ts
```

The `i/` field is the **index** (what's in the repo); `w/` is the **working tree**. They should match `attr/`. If `i/crlf` shows up after a `git add`, your `.gitattributes` rule isn't matching — `git check-attr text path/to/file` will say so.

---

## 7 · Git LFS — for big binary files

Git stores every version of every file forever. A 50 MB design mockup updated weekly grows the repo by 50 MB / week regardless of `.gitignore`. **Git LFS** (Large File Storage) replaces large files in the repo with **pointers**; the actual blobs live on a separate LFS server and are fetched on demand.

### When to use LFS

| Situation | LFS? |
|---|---|
| 200 MB AI training dataset | ✅ |
| 5 MB design mockup PNG that changes monthly | ✅ |
| Mobile app `.apk` artifacts | ✅ |
| 1 KB SVG icon | ❌ — just commit it |
| Playwright trace `.zip` from CI | ❌ — these go to `.gitignore` (CI artifact, not repo content) |
| `node_modules/` | ❌ — `.gitignore` (rebuild deterministically) |

### When **not** to use LFS

- For files that should never be in the repo at all (CI outputs — see `.gitignore`).
- For files that change every commit (every commit creates a new LFS object — same growth problem, different bucket).
- For text files (LFS is for binaries; diff becomes opaque).
- "Just in case" — LFS adds operational complexity (server, quota, auth). Earn the cost.

### Setup (only when needed)

```bash
brew install git-lfs                        # macOS
sudo apt install git-lfs                    # Debian/Ubuntu
git lfs install                             # one-time per machine

# Track a pattern in this repo
cd ai-qa-training
git lfs track "*.psd"
git lfs track "tests/visual/baselines/**"
git add .gitattributes                      # `git lfs track` writes to .gitattributes
git commit -m "chore: track *.psd via LFS"
```

Result in `.gitattributes`:

```gitattributes
*.psd                          filter=lfs diff=lfs merge=lfs -text
tests/visual/baselines/**      filter=lfs diff=lfs merge=lfs -text
```

### Verify

```bash
git lfs ls-files                            # what's currently in LFS
git lfs status                              # what's about to be sent
git lfs migrate import --include="*.psd"    # rewrite history to put existing .psd files into LFS
```

> **`git lfs migrate import`** rewrites history; same constraints as any history rewrite (see [`history.md`](./history.md) §9). Coordinate with the team; force-push afterwards.

### LFS gotchas

- **CI must `git lfs pull`**, not just `git fetch`. Most CI providers do this if `git-lfs` is installed in the runner; verify on your first LFS push.
- **Shallow clones** drop LFS objects. `actions/checkout@v4` with `lfs: true` solves this for GitHub Actions.
- **Forks don't inherit LFS bandwidth quota** — contributors via fork need their own LFS quota or the maintainer accepts the fork via patch.
- **LFS storage cost is separate from GitHub repo storage.** Watch the GitHub Settings → Billing → Git LFS line.

---

## 8 · Generated files — repo or not?

Decision matrix for "should this file be committed?":

| File | Committed? | Why |
|---|---|---|
| `package-lock.json` | ✅ | Reproducible installs across machines + CI |
| `node_modules/` | ❌ | Re-derive from `package-lock.json` + `npm ci`; huge |
| `dist/` / `build/` | ❌ | Re-derive from source via `npm run build` |
| `coverage/` | ❌ | Re-derive per CI run |
| `playwright-report/` | ❌ | Re-derive per CI run; archived as a CI artifact |
| `reports/run-summary.json` | ❌ | Per-run derivation; persisted via `reports/run-trend.json` only on `main` |
| `reports/run-trend.json` | ❌ | Same — multi-run rollup persists via the dashboard pipeline, not the repo |
| `reports/traceability.json` | ✅ | Source-of-truth for Panel #4; the dashboard reads from here |
| `reports/perf/baselines/*.json` | ✅ | Source-of-truth for perf-regression detection |
| `tests/visual/__snapshots__/*.png` | ✅ | Visual regression baselines; review-required when changed |
| Generated TS from a code-gen step (e.g., GraphQL types) | ⚠️ depends | If the codegen runs in CI on every push, `.gitignore` it. If contributors edit-and-commit, ✅ commit and gate via husky `pre-commit`. **Pick one; mixing them causes endless conflicts.** |

> **Rule:** if a file can be re-derived deterministically and the derivation is fast, ignore it. If the derivation is slow OR the file is reviewed by humans (visual baselines, perf budgets), commit it.

---

## 9 · `.gitignore` anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Adding files to `.gitignore` after they were committed | Doesn't un-commit them | `git rm --cached <path>` then commit + add to `.gitignore` |
| `.env` in `.gitignore` but `.env.local`, `.env.dev`, `.env.prod` not | Inevitable secret leak through one of the variants | `*.env*` with `!*.env*.example` negation (this repo's pattern) |
| Personal IDE files in repo `.gitignore` | Pollutes the repo `.gitignore` for everyone | Use `~/.config/git/ignore` (personal global) |
| `git add -f` to override a `.gitignore` rule | Almost always wrong; usually means the rule is wrong | Fix the rule (or split with a more specific negation) |
| Committing `.env.example` with **real** values "to make life easier" | The "examples" become production secrets within a sprint | `.env.example` carries `KEY=` (empty) or `KEY=<your-key-here>` |
| Per-OS `.gitignore` rules (`.DS_Store` in repo .gitignore) | Cross-platform repo bloat | Personal global ignore (§3) |
| `*` then trying to negate everything you do want | Maintenance nightmare; one new file rule breaks 10 negations | List the patterns to ignore explicitly |
| Re-using one `.gitignore` for backend + frontend + infra in a polyrepo | Inheritance gets confusing | Per-folder `.gitignore` for scoped rules |

---

## 10 · `.gitattributes` anti-patterns

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Mixing `text=auto eol=lf` with `core.autocrlf=true` | CRLF appears in repo on Windows pushes | Pick one Strategy from §6 and stick to it; recommend Strategy A |
| LFS for files < 1 MB | Adds operational complexity for no storage win | Just commit them |
| LFS for text files | Diffs become opaque | Stay with regular Git |
| Forgetting `linguist-generated=true` on lockfiles | PR diffs include 5000 lines of `package-lock.json` | Add the directive |
| `export-ignore` on the source code itself | `git archive` ships a hollow tarball | `export-ignore` is for **non-shipped** assets (docs, tests, .github); never source |
| Committing `.gitattributes` without renormalising | First commit after the file change is full of phantom diffs | `git add --renormalize .` immediately after |

---

## 11 · Verifying the repo is healthy

A 1-minute check after any non-trivial `.gitignore` / `.gitattributes` change:

```bash
# Are any tracked files secret-shaped?
git ls-files | rg -i '\.env(\.|$)|secret|credential'  # should be 0 hits, or only .env.example variants

# Are any tracked files binary that shouldn't be?
git ls-files | xargs -I{} file {} | rg -v 'ASCII|UTF-8|empty' | head

# Any line-ending drift?
git ls-files --eol | rg -v ' i/lf'                    # everything should be i/lf (Strategy A)

# Any LFS objects we forgot to push?
git lfs status
```

---

## Cross-references

- [`README.md`](./README.md) — branching model + PR contract
- [`setup.md`](./setup.md) — `core.autocrlf=input` and `core.excludesFile` settings that pair with this file
- [`workflow.md`](./workflow.md) — the day-to-day path; PR template references "no secrets" checklist
- [`history.md`](./history.md) — `git lfs migrate` rewrites history; same rules as §9 apply
- [`fundamentals.md`](./fundamentals.md) — index / working tree / object database mental model behind §1
- [`documents/security/toolchain.md`](../security/toolchain.md) — `gitleaks` is the safety net when this discipline slips
- [`SECURITY.md`](../../SECURITY.md) — secret-leak remediation
- [Pro Git §gitignore](https://git-scm.com/docs/gitignore), [Pro Git §gitattributes](https://git-scm.com/docs/gitattributes), [Git LFS docs](https://git-lfs.com/) — canonical references

## Status

| Section | Status | Owner |
|---|---|---|
| `.gitignore` mental model | ✅ v1 | Repo admin |
| Repo `.gitignore` audit | ✅ v1 (current file annotated) | Repo admin |
| `.gitignore` syntax + debugging | ✅ v1 | Repo admin |
| `.gitattributes` baseline (recommended) | ⏳ recommendation; not yet applied to repo | Repo admin |
| Line-ending strategy | ✅ v1 (Strategy A: LF everywhere) | Repo admin |
| Git LFS guidance | ✅ v1 (when / when-not / setup / gotchas) | Repo admin |
| Generated-file decision matrix | ✅ v1 | Repo admin |
| Anti-patterns | ✅ v1 | Repo admin |
