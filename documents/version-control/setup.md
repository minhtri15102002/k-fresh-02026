# Git Setup & Configuration

> One-time setup that makes the [`workflow.md`](./workflow.md) loop fast, the [`history.md`](./history.md) operations safe, and the husky / commitlint mechanics in [`documents/husky-guidelines.md`](../husky-guidelines.md) actually fire on your machine. If your `git push` is asking you for a password, your `git log` shows your colleague's commits as `(unverified)`, or `git rebase` opens a text editor you don't recognise — this is the file to fix it.
>
> The repo's discipline assumes every developer has done §1–§4 below. §5–§7 are quality-of-life improvements; do them once and forget about them.

---

## 1 · Install Git

| Platform | Recommended source |
|---|---|
| macOS | Homebrew: `brew install git`. The Apple-shipped `/usr/bin/git` is fine but lags by 6–12 months. |
| Linux | Distro package manager (`apt install git`, `dnf install git`). For ≤ 2 versions behind, that's fine. For latest, use the [git-scm.com](https://git-scm.com/download/linux) instructions. |
| Windows | [Git for Windows](https://gitforwindows.org/) (which bundles Git Bash). Use Git Bash, not PowerShell, for the snippets in this folder. |

Verify after install:

```bash
git --version
# git version 2.45.x or newer (May 2026)
```

If the version is < 2.40, **upgrade** — several commands referenced in [`history.md`](./history.md) (`git switch`, `--force-with-lease` defaults, `git rebase --autosquash`) behave subtly differently in older Git.

> Don't `brew install gh` separately and forget — most workflow examples in [`workflow.md`](./workflow.md) use the GitHub CLI (`gh`). Install it now: `brew install gh` / `apt install gh` / [`cli.github.com`](https://cli.github.com/). Auth with `gh auth login`.

---

## 2 · Identify yourself

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@yourcompany.com"
```

Use the **same email address** that's on your GitHub account; otherwise `gh pr create` will work but commits in `git log` won't link to your GitHub avatar and the dashboard's per-author trends ([Section 3 of the QA Metrics Dashboard](../../templates/qa-metrics-dashboard.html)) will mis-attribute your work.

> **For multi-account setups** (work + personal on the same machine), use `~/.gitconfig` `includeIf` directives in §6 below; never set `user.email` per-repo by hand.

---

## 3 · SSH (the auth path you actually want)

HTTPS auth works but pushes you into PAT-token territory: prone to expiry, prone to leak via `~/.git-credentials`, prone to "I just rotated and now nothing works". Use SSH.

### Generate a key (Ed25519)

```bash
ssh-keygen -t ed25519 -C "you@yourcompany.com" -f ~/.ssh/id_ed25519_github
# accept default passphrase prompt — DON'T leave it empty
```

### Add to ssh-agent

```bash
eval "$(ssh-agent -s)"
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_github     # macOS
# or:
ssh-add ~/.ssh/id_ed25519_github                          # Linux / Windows Git Bash
```

### Register with GitHub

```bash
gh ssh-key add ~/.ssh/id_ed25519_github.pub --title "$(hostname) $(date +%Y-%m)"
# or paste manually into GitHub → Settings → SSH and GPG keys → New SSH key
```

### Verify

```bash
ssh -T git@github.com
# Hi <your-handle>! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see `Permission denied (publickey)`: the key isn't loaded (`ssh-add -l` to check), or it's not registered (`gh ssh-key list`).

### Use SSH for `clone` and `remote`

```bash
git clone git@github.com:org/ai-qa-training.git
# Already cloned with HTTPS? rewrite the remote:
git remote set-url origin git@github.com:org/ai-qa-training.git
```

> **Anti-pattern:** stashing a PAT in your `~/.netrc` or `~/.git-credentials`. The pre-commit `gitleaks` hook described in [`documents/security/toolchain.md`](../security/toolchain.md) does **not** scan dotfiles outside the repo, but a stolen laptop yields the token immediately. SSH key + agent + passphrase is the better posture.

---

## 4 · GPG / SSH commit signing

Branch protection on `main` is set to require **signed commits**. An unsigned commit will not merge, and `git log` shows `(unverified)` next to it.

You can sign with either GPG or SSH. SSH signing is newer, simpler, and uses the same key you already set up in §3 — recommended.

### Option A — SSH commit signing (recommended)

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_github.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

Tell GitHub the same SSH key is also a **signing key**:

```bash
gh ssh-key add ~/.ssh/id_ed25519_github.pub --type signing --title "$(hostname) signing"
# or in the UI: Settings → SSH and GPG keys → New SSH key → Key type: Signing Key
```

Verify:

```bash
git commit --allow-empty -m "test: signing sanity check"
git log --show-signature -1
# good "ssh-ed25519 SHA256:…" signature from <your name> <your email>
```

### Option B — GPG signing

If your org mandates GPG (some compliance regimes do), follow [GitHub's GPG guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key) and set:

```bash
git config --global gpg.format openpgp
git config --global user.signingkey <YOUR-GPG-KEY-ID>
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

> **Don't** mix SSH and GPG signing across machines. Pick one. Inconsistency confuses GitHub's "Verified" badge logic and forces reviewers to investigate signatures that should "just work".

---

## 5 · Default-everything `.gitconfig`

Drop these into `~/.gitconfig` once. They cover every assumption in [`workflow.md`](./workflow.md) and [`history.md`](./history.md) without you having to remember any flags.

```ini
[user]
  name  = Your Name
  email = you@yourcompany.com

[init]
  defaultBranch = main             # match the repo's default; "master" is forbidden

[pull]
  rebase = true                    # required by workflow.md §1

[rebase]
  autoStash    = true              # required by workflow.md §1
  autoSquash   = true              # required by history.md §3 (fixup workflow)
  updateRefs   = true              # newer Git: rebase preserves stacked branches

[push]
  default      = current           # `git push` == `git push origin HEAD`
  followTags   = true              # tag pushes go with the branch push
  autoSetupRemote = true           # first push doesn't need `-u origin HEAD`

[fetch]
  prune        = true              # `git fetch` deletes refs for branches deleted on the remote
  pruneTags    = true

[merge]
  conflictStyle = zdiff3           # 3-way conflict markers — easier to resolve than the default
  ff           = only              # forbid silent merge commits on `git merge`

[diff]
  algorithm    = histogram         # better diffs for refactors than the default `myers`
  colorMoved   = zebra             # visualise moved blocks distinctly from added/removed
  mnemonicPrefix = true            # `i/` and `w/` instead of `a/` and `b/` in patches

[rerere]
  enabled      = true              # remember conflict resolutions; replay on next conflict

[help]
  autocorrect  = prompt            # asks before running the autocorrected command

[commit]
  verbose      = true              # show diff in the commit-message editor

[log]
  date         = iso

[core]
  autocrlf     = input             # see ignore-and-attributes.md §"Line endings"
  editor       = vim               # or `code --wait` if you live in VS Code (see §7)
  excludesFile = ~/.config/git/ignore
  pager        = less -FRX

[color]
  ui = auto

[gpg]
  format       = ssh               # see §4 if you picked GPG instead

[commit]
  gpgsign      = true

[tag]
  gpgsign      = true

[user]
  signingkey   = ~/.ssh/id_ed25519_github.pub
```

> Don't blindly copy-paste — keep the **`[user]`** block at the top consistent with §2, and set `signingkey` to whichever key you generated in §4.

### Multi-account / `includeIf`

If you contribute to both work and personal repos from the same machine, **don't** set per-repo `user.email` — set it per-directory via `includeIf`:

```ini
# ~/.gitconfig
[user]
  name  = Your Name
  email = personal@example.com    # default

[includeIf "gitdir:~/work/"]
  path = ~/.gitconfig-work        # overrides for ~/work/**
```

```ini
# ~/.gitconfig-work
[user]
  email = you@yourcompany.com
[user]
  signingkey = ~/.ssh/id_ed25519_work_signing.pub
```

Now any clone under `~/work/` automatically uses your work email and work signing key.

---

## 6 · Recommended aliases

Aliases are a personal-taste matter, but the team has a small list that keeps the cheat sheet in [`workflow.md`](./workflow.md) §"Cheat sheet" short. Add to `~/.gitconfig`:

```ini
[alias]
  # Daily loop
  s          = status -sb
  co         = switch
  br         = branch
  ci         = commit
  cm         = commit -m
  amend      = commit --amend --no-edit
  unstage    = restore --staged
  undo       = reset --soft HEAD~1            # uncommit, keep changes staged

  # Logs
  l          = log --oneline --graph --decorate -20
  lg         = log --oneline --graph --decorate --all
  who        = log --pretty=format:'%h %an %ad %s' --date=short -10

  # Diffs
  d          = diff
  ds         = diff --staged
  dw         = diff --word-diff=color

  # Refresh
  up         = !git fetch --all --prune && git pull --rebase --autostash
  sync       = !git fetch origin && git rebase origin/main

  # Push helpers
  pf         = push --force-with-lease         # NEVER use bare `push --force`
  pushup     = push -u origin HEAD

  # Branches
  recent     = "!git for-each-ref --sort=-committerdate refs/heads/ --format='%(committerdate:iso) %(refname:short)' | head -20"
  cleanup    = "!git branch --merged main | grep -v '^\\*\\|main' | xargs -r git branch -d && git remote prune origin"

  # Inspect
  blame-w    = blame -w -C -C -C               # ignore whitespace, follow code moves
  contains   = branch --contains                # which branches contain this commit?
  here       = log -1 --stat HEAD              # what did I just commit?

  # Stash
  save       = stash push -m
  pop        = stash pop
```

> **`git pf` is force-with-lease, not force.** If you ever type `git push --force` (no `-with-lease`), [`history.md`](./history.md) §9 explains why that's forbidden. Aliases shouldn't have escape hatches.

---

## 7 · Editor integration

Pick one and stop fighting it.

### VS Code / Cursor (most of this team)

```bash
git config --global core.editor "code --wait"
# or for Cursor:
git config --global core.editor "cursor --wait"
```

`--wait` makes `git commit` block until you close the file, which is what every other tool in the editor expects. Without it, `git commit` returns instantly with an empty message.

The team's recommended VS Code extensions for Git workflow:

| Extension | Why |
|---|---|
| **GitLens** | Inline blame, file history, branch comparison. Single most-used Git tool in this org. |
| **Git Graph** | Visual log; pairs with `git lg` for `bisect` (see [`history.md`](./history.md) §6). |
| **Conventional Commits** | UI to author commit messages that pass commitlint without thinking about syntax. |
| **GitHub Pull Requests and Issues** | Drives `gh pr create` / review from the editor. |

### JetBrains / IntelliJ

```bash
git config --global core.editor "idea --wait"
```

Built-in Git UI is excellent; you don't need extensions. Just disable IntelliJ's "Smart commit (run inspections / fix-ups before commit)" — husky already does that work; running both produces duplicated lint runs.

### Vim / Neovim / terminal

```bash
git config --global core.editor "vim"
# Recommended: `tpope/vim-fugitive` for `:Git` integration.
```

If you want the message-editing experience the rest of the team has without leaving the terminal, install [`vim-fugitive`](https://github.com/tpope/vim-fugitive) and read its `:help fugitive`.

---

## 8 · Client-side secret hygiene

The pre-commit `gitleaks` hook documented in [`documents/security/toolchain.md`](../security/toolchain.md) §Secret scanning is the **last** line of defence. The first lines are:

| Discipline | What it prevents |
|---|---|
| **Never** put a secret on the command line. `export FOO=…` and reference `$FOO` | Secret lands in shell history (`~/.zsh_history`, `~/.bash_history`) |
| **Never** `git add -A` without a quick `git diff --staged` review | Accidentally staging `profiles/.env.qa` because it's near a file you wanted |
| **Never** copy-paste the same `.env` into a chat | A secret in Slack DM is now in Slack's data warehouse forever |
| **Always** keep `.env*` in `.gitignore` (already enforced; see [`ignore-and-attributes.md`](./ignore-and-attributes.md)) | Tracked secrets survive history rewrite |
| **Always** sign commits per §4 | Identity-impersonation attacks (an attacker pushing a commit "as you") get caught at branch-protection time |
| **Run** `gitleaks protect --staged` before the first push of a new repo | Catches secrets that landed before husky was installed |

> **If a secret leaks anyway:** rotate first, then read [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks". History rewrite is a follow-up, not a fix — see [`history.md`](./history.md) §9.

---

## 9 · Verify your setup

A 30-second sanity check after a fresh laptop / new clone:

```bash
git --version                                   # ≥ 2.40
git config --global user.email                  # not empty, matches GitHub
git config --global commit.gpgsign              # true
git config --global pull.rebase                 # true
git config --global rebase.autoSquash           # true
git config --global push.autoSetupRemote        # true
ssh -T git@github.com                           # "Hi <handle>!"
gh auth status                                  # "Logged in to github.com as <handle>"
```

If any line returns an empty string or an error, jump back to the matching section.

For the repo-specific bit:

```bash
cd ai-qa-training
npm install                                     # installs husky hooks via `prepare`
ls -la .husky/                                  # pre-commit, commit-msg, pre-push, post-merge present
git commit --allow-empty -m "test: signing + hooks sanity"
git log --show-signature -1                     # signed
git push origin <feature-branch>                # husky pre-push fires; you see check:all run
```

If the hooks didn't fire, see [`documents/husky-guidelines.md`](../husky-guidelines.md) §Troubleshooting.

---

## Cross-references

- [`README.md`](./README.md) — branching model + PR contract this setup enables
- [`workflow.md`](./workflow.md) — the day-to-day loop these defaults make smooth
- [`history.md`](./history.md) — rebase / amend / fixup operations that lean on `[rebase]` config
- [`fundamentals.md`](./fundamentals.md) — Git mental model if any of the above feels mysterious
- [`ignore-and-attributes.md`](./ignore-and-attributes.md) — `.gitignore` + `.gitattributes` discipline (line endings tied to the `core.autocrlf` choice in §5)
- [`remotes-and-forks.md`](./remotes-and-forks.md) — multi-remote / contributing-fork setup that reuses the same SSH key
- [`documents/husky-guidelines.md`](../husky-guidelines.md) — local hook layer; relies on this setup
- [`documents/security/toolchain.md`](../security/toolchain.md) — secret scanning client-side
- [`SECURITY.md`](../../SECURITY.md) — disclosure + secret-leak remediation
- [Git documentation](https://git-scm.com/doc) — the canonical reference

## Status

| Section | Status | Owner |
|---|---|---|
| Install + identity | ✅ v1 | Repo admin |
| SSH auth | ✅ v1 (Ed25519 + agent) | Repo admin |
| Commit signing (SSH + GPG fallback) | ✅ v1 | Repo admin |
| Recommended `.gitconfig` | ✅ v1 (matches workflow.md / history.md assumptions) | Repo admin |
| Aliases | ✅ v1 (force-with-lease, no force) | Repo admin |
| Editor integration | ✅ v1 (VS Code / Cursor / JetBrains / Vim) | Repo admin |
| Client-side secret hygiene | ✅ v1 (cross-refs security/toolchain.md) | Repo admin |
| Verify checklist | ✅ v1 (30-second sanity) | Repo admin |
