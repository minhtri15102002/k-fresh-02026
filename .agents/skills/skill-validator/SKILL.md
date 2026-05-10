---
name: skill-validator
description: "Validates one or all Agent Skills under .agents/skills/ by checking (1) YAML frontmatter compliance with the write-agent-skill spec, (2) every backtick-quoted file/folder path and every markdown link resolves to a real file in the repo, (3) sibling skill cross-references point to existing SKILL.md files, and (4) optional: TypeScript test() code blocks self-comply with the test-tags-validator. Use when explicitly asked to 'validate skills', 'audit SKILL.md', 'check skill references', after authoring or refactoring any skill, before opening a PR that touches .agents/skills/, or as a CI gate. Wraps a runnable validator (scripts/validate-skill.ts) that exits non-zero on broken references — distinct from write-agent-skill which authors skills."
---

# Skill Validator

Skills accumulate stale references the same way docs do: a renamed file, a moved prompt, a sibling skill that was never created, a code example that doesn't compile against the current repo conventions. This skill is the auditor that catches all of that automatically.

It mirrors the manual audit pattern that uncovered the `BaseLocators` / `BasePage` mistakes in the original `pom-architect` example — by formalising the checks into a runnable script, every future skill edit can be validated in <2 seconds before review.

---

## When to use this skill

Trigger on:
- "Validate skills"
- "Audit SKILL.md"
- "Check the references in `<skill>`"
- After authoring or refactoring any skill (especially the long-prose ones)
- Before opening a PR that touches `.agents/skills/`
- As a CI gate alongside `validate:tags`

**Do NOT use when:**
- The user wants to **author** a new skill → use [`write-agent-skill`](../write-agent-skill/SKILL.md) (this skill validates *after* authoring).
- The user wants to **fix** the runtime behaviour of an Agent → that's a Claude/agent runtime issue, not a SKILL.md content issue.
- The user is running CI for **tests** → that's `validate:tags` + `check:all`.

---

## How to use it

### Phase 1 — Run the validator

```bash
# fast path: validate every skill
npm run validate:skills

# scope to one skill
.agents/skills/skill-validator/scripts/validate-skill.ts --skill pom-architect

# verbose (list every check, not just failures)
.agents/skills/skill-validator/scripts/validate-skill.ts --verbose

# CI mode: warnings count as errors
.agents/skills/skill-validator/scripts/validate-skill.ts --strict

# also check that ts test() code blocks pass test-tags-validator
.agents/skills/skill-validator/scripts/validate-skill.ts --check-examples

# all flags combined
.agents/skills/skill-validator/scripts/validate-skill.ts --verbose --strict --check-examples
```

Exit codes:
- `0` — all skills compliant
- `1` — at least one error (or any warning under `--strict`)
- `2` — invocation error (bad path, parse error, missing dep)

### Phase 2 — Read the report

```
✗ .agents/skills/pom-architect/SKILL.md
    error: missing referenced file `prompts/core/legacy-pom.md` (cited line 42)
    error: sibling skill `.agents/skills/test-fixiing` does not exist (typo? cited line 88)
    warning: description does not start with a verb (third-person heuristic)
    warning: code block at line 60 references `BaseLocators` which doesn't exist in repo

▸ .agents/skills/flaky-test-triage/SKILL.md
    warning: cross-ecosystem ref to `.claude/agents/playwright-test-healer` should make path explicit

✓ .agents/skills/test-tags-validator/SKILL.md — 14 references, all resolve
✓ .agents/skills/defect-report/SKILL.md — 9 references, all resolve

Summary: 42 skills scanned, 1 error, 3 warnings, 41 OK
```

### Phase 3 — Fix and re-run

Each error or warning lists the exact line and the broken token. Fix in place (rename, restore, or remove the citation), then re-run the validator. Repeat until exit `0`.

### Phase 4 — Wire as a CI / pre-push gate

In `.husky/pre-push`:
```bash
npm run validate:skills --silent || exit 1
```

In `.github/workflows/playwright.yml` (lint job):
```yaml
    - name: Validate skills
      run: npm run validate:skills -- --strict
```

---

## What the validator checks

### Layer 1 — Frontmatter compliance (per `write-agent-skill`)

| Rule | Severity |
|---|---|
| YAML frontmatter present at top of file | error |
| `name:` field present and non-empty | error |
| `name:` value matches the folder name | error |
| `description:` field present | error |
| `description:` is third-person (starts with a verb like "Drafts", "Adds", "Validates", "Builds") | warning |
| `description:` mentions "Use when …" or trigger phrasing | warning |
| `description:` length between 80 and 2000 chars (helps progressive disclosure routing) | warning |

### Frontmatter escape hatch — `optionalRefs:`

Some skills legitimately reference paths that don't (yet) exist — outputs the skill **produces** at runtime, or inputs it reads **only if present**. Declare them in frontmatter and the validator will skip the existence check:

```yaml
---
name: requirements-traceability
description: "..."
optionalRefs:
  - documents/requirements.md          # optional input — used if present
  - documents/traceability-matrix.md   # output — produced by this skill
  - reports/traceability.json          # output — consumed by the QA dashboard
---
```

The legacy alias `produces:` is also accepted.

### Layer 2 — Path / file references

The validator extracts:
- Every backtick-quoted token containing `/` and a recognised repo prefix (`prompts/`, `tests/`, `pages/`, `locators/`, `utilities/`, `models/`, `data/`, `reports/`, `scripts/`, `templates/`, `documents/`, `knowledge-base/`, `training/`, `wiki/`, `.github/`, `.agents/`, `.husky/`).
- Every Markdown link `[text](relative-or-absolute-path)` where the path is NOT `http(s)://` or an in-page anchor (`#…`).

For each, it tries (in order):
1. Resolve relative to the SKILL.md's directory (e.g. `../../../prompts/core/test-tags.md`).
2. Resolve from the workspace root (e.g. bare `prompts/core/test-tags.md`).

If neither resolves: **error** ("missing referenced file").

### Layer 3 — Sibling skill cross-references

Detects patterns like `.agents/skills/<name>` or `../<name>/SKILL.md` and confirms:
- The folder exists, AND
- It contains a `SKILL.md`.

Cross-ecosystem references to `.claude/agents/<name>` are allowed. The link target should resolve from the SKILL.md's directory (`.agents/skills/<this-skill>/`), so a correct path is `../../../.claude/agents/<name>.md` (three `../` to escape `.agents/skills/<this-skill>/` to the repo root, then descend into `.claude/agents/`).

### Layer 4 — Code block self-compliance (opt-in via `--check-examples`)

Extracts every `\`\`\`ts` fenced block from the SKILL.md. For any block containing a `test(...)` call:
1. Writes it to a temporary `.spec.ts`.
2. Runs `validate-tags.ts` on the temp folder.
3. Reports failures inline (pinned to the original SKILL line range so the user can find them).

Catches the kind of bug we fixed in `accessibility-testing` (tags on `describe`, not `test`) and `performance-testing` (no tag block at all).

---

## Decision tree

```
What's broken ?
├── error: missing referenced file
│       → check spelling; if file moved, update path; if file deleted, remove citation
├── error: sibling skill does not exist
│       → typo? skill not yet created? remove or create the skill first
├── error: name does not match folder
│       → rename one of them; the YAML name and folder name MUST agree
├── warning: description not third-person
│       → rewrite "Use this when…" → "Validates… Use when…"
├── warning: code block fails tag validator
│       → fix the example so it self-complies (you're modelling the convention)
└── 0 errors, 0 warnings
        → ship it.
```

---

## Best practices

- **Run before every PR that touches `.agents/skills/`.** It costs <2s; it catches what reviewers catch in 20 minutes.
- **Don't suppress warnings without a comment.** If the third-person heuristic flags a description for a stylistic reason, document why above the YAML.
- **Examples in skills are documentation contracts.** A code block that doesn't pass the project's own validators is a liability — fix the example, never widen the validator.
- **Cross-ecosystem links require explicit paths.** When a skill references something under `.claude/agents/` or `.github/agents/`, write the full path so the validator (and humans) don't have to guess.
- **Keep the recognised-prefix list aligned.** When a new top-level dir is added to the repo (e.g. `services/`, `apps/`), update [`scripts/validate-skill.ts`](scripts/validate-skill.ts) `RECOGNISED_PREFIXES` AND this SKILL.md's Layer 2 list.
- **Prefer `npm run validate:skills` over the raw script.** The npm script wraps `tsx` with the right flags so behaviour is consistent across machines.

---

## Related

- [`.agents/skills/write-agent-skill/SKILL.md`](../write-agent-skill/SKILL.md) — sibling that **authors** skills; this one validates them.
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — used by Layer 4 (`--check-examples`).
- [`scripts/validate-skill.ts`](scripts/validate-skill.ts) — the validator (run with `--help`).
