---
name: sonarqube-fixer
description: "Triages and fixes SonarQube findings in this repo (TypeScript code under src/locators/pages/utilities/models/tests per sonar-project.properties, plus Markdown across .agents/, training/, documents/, wiki/). Use when explicitly asked to 'fix SonarQube issues', 'clean up sonar smells', 'resolve sonar findings on file X', 'address the new code-quality bugs', 'make sonar happy', or before merging a PR that the SonarQube quality gate has failed. Categorises each finding (Bug / Vulnerability / Security Hotspot / Code Smell / Markdown lint), picks the smallest safe fix, and re-runs the local scanner so the gate goes green — never silences a rule with `// NOSONAR` unless the user explicitly approves it."
---

# SonarQube Fixer

The repo is wired to a self-hosted SonarQube at `localhost:9000` (see [`sonar-project.properties`](../../../sonar-project.properties)). Findings come in five practical buckets:

| Bucket | Where | Fix discipline |
|---|---|---|
| **Bug** | TS — `null` deref, broken promise, unreachable code | Always fix; never ignore. |
| **Vulnerability** | TS — hardcoded secret, weak crypto, SSRF, ReDoS regex | Always fix; rotate secret if leaked. |
| **Security Hotspot** | TS — `Math.random` for auth, broad CORS, eval-like calls | Review → mark Safe with justification, or fix. |
| **Code Smell** | TS — cognitive complexity, duplication, dead code, `any` | Fix top quartile per file; cluster trivial ones into one PR. |
| **Markdown lint** | `.md` files anywhere | Auto-fix (trailing ws, MD022/031/032, heading levels). |

This skill is the operator's playbook: scan → triage → fix in priority order → re-scan → push.

---

## When to use this skill

Trigger on:

- "Fix SonarQube issues"
- "Resolve sonar findings on `pages/ui/cart-page.ts`"
- "Quality gate failed — make it pass"
- "Clean up the new code smells before merge"
- "Address the markdown lint warnings"
- After a PR triggers a SonarQube gate failure in CI
- Before promoting a release branch

**Do NOT use when:**

- The user wants to **disable** a rule globally → edit `sonar-project.properties` / quality profile in SonarQube UI instead, and document why.
- The finding is on **third-party code** under `node_modules/` → already excluded; nothing to fix.
- You haven't read the finding yet → run the scanner first; never invent fixes.

---

## How to use it

### Phase 1 — Get the findings

Pick the cheapest source first.

```bash
# Option A: Local scanner (full repo, slowest, most accurate)
sonar-scanner -Dsonar.token=$SONAR_TOKEN

# Option B: API pull (already-scanned project, fast)
curl -u "$SONAR_TOKEN:" \
  "http://localhost:9000/api/issues/search?componentKeys=e2e-tests&resolved=false&ps=500" \
  | jq '.issues[] | {file: .component, line, severity, type, rule, message}'

# Option C: Single-file triage (no scanner needed for trivial markdown / lint)
npx eslint --ext .ts <path>           # TS code smells eslint also catches
npx markdownlint-cli2 "<path>"        # markdown
```

If the user only pasted a finding (file + rule id + message), skip to Phase 2.

### Phase 2 — Triage every finding into one of four lanes

| Lane | Rule of thumb | Action |
|---|---|---|
| **AUTO-FIX** | Trailing whitespace, missing blank lines, removed import, `prefer-const`, `no-var` | Apply; no review needed. |
| **MECHANICAL** | Extract method to drop cognitive complexity ≤ 15, replace `any` with concrete type, dedupe a copy-paste block | Apply; ask user to review the diff. |
| **JUDGMENT** | Security hotspot, public-API rename, behavior change | Propose a fix and the trade-off; **wait for confirmation**. |
| **WON'T-FIX** | False positive, intentional pattern, third-party shape | Mark in SonarQube UI with a justification comment; do **not** sprinkle `// NOSONAR`. |

### Phase 3 — Fix in priority order

Always: **Bug → Vulnerability → Security Hotspot (if approved) → Code Smell → Markdown lint.** Within a tier, prefer the file the user is currently editing, then files with the most findings (high-leverage cleanup).

#### TypeScript common fixes (cheat sheet)

| Rule | Fix pattern |
|---|---|
| `typescript:S6571` (`any`) | Narrow with `unknown` + type guard, or import the real model from `models/`. |
| `typescript:S3776` (cognitive complexity) | Extract sub-functions; flatten guard clauses (`if (!x) return`). |
| `typescript:S4123` (await on non-promise) | Drop `await`, or wrap value in `Promise.resolve(...)`. |
| `typescript:S6535` (useless escape) | Remove the `\`. |
| `typescript:S2933` (prefer `readonly`) | Mark class fields `readonly` if never reassigned. |
| `typescript:S1854` (dead store) | Delete the unused assignment. |
| `typescript:S125` (commented-out code) | Delete it; git is the archive. |
| `typescript:S3358` (nested ternary) | Extract to `if/else` or a lookup table. |
| `typescript:S4524` (`switch` missing default) | Add `default:` even if it's `throw new Error('unreachable')`. |
| `typescript:S6754` (React `useState` without setter use) | Drop the setter, or use the value. |
| `typescript:S2486` / `S1128` (empty/unused catch) | At minimum log; ideally rethrow with context. |
| `typescript:S4138` (use `for…of`) | Convert classic `for` over arrays. |
| `typescript:S6606` (use nullish coalescing) | `a ?? b` instead of `a \|\| b` when `0`/`''` are valid. |
| `typescript:S6606` (optional chaining) | `a?.b?.c` instead of `a && a.b && a.b.c`. |

In this repo specifically:

- Page objects MUST NOT contain `expect(...)` — if Sonar flags duplication of an assertion across pages, the real fix is to move it to `utilities/assert-helper.ts`. See [`pom-architect`](../pom-architect/SKILL.md).
- Tests MUST NOT contain raw `page.locator(...)` — Sonar's duplication rule loves these; the real fix is to centralise them per [`prompts/core/locators-naming.md`](../../../prompts/core/locators-naming.md).
- Don't replace failing `await page.waitForTimeout(...)` with a `// NOSONAR`; route through [`flaky-test-triage`](../flaky-test-triage/SKILL.md).

#### Markdown common fixes (cheat sheet)

| Rule | Fix |
|---|---|
| MD009 / trailing whitespace | Strip ` +$`. |
| MD022 | Blank line **before AND after** every heading. |
| MD031 | Blank line **before AND after** every fenced code block. |
| MD032 | Blank line **before AND after** every list. |
| MD040 | Add a language tag to fenced blocks (`` ```bash ``, `` ```ts ``, `` ```yaml ``, `` ```text `` for plain). |
| MD001 | Don't skip heading levels (`##` → `####`). |
| MD024 | Don't repeat the same heading text under the same parent. |
| MD025 | Exactly one `#` H1 per file. |
| MD041 | First non-frontmatter line should be an H1. |

For this repo, every `SKILL.md` should also pass [`skill-validator`](../skill-validator/SKILL.md) — running it after a sonar fix-up catches broken cross-skill links the markdown linter can't see.

### Phase 4 — Verify the fix locally

```bash
# TS:
npm run linter && npm run typecheck       # cheap pre-flight
sonar-scanner -Dsonar.token=$SONAR_TOKEN  # full re-scan (slow)

# Markdown:
npx markdownlint-cli2 "<paths>"           # zero exit ⇒ green

# Skill / repo guardrails:
npm run validate:tags --silent
npm run validate:skills --silent
```

Then re-pull the issue list from `/api/issues/search` and confirm the fixed `key`s no longer appear.

### Phase 5 — Push & document

- Commit message: `chore(sonar): fix <bucket> in <area> (<N> findings)` — Conventional Commit, scope = `sonar`.
- If you marked anything **Won't-Fix** in the SonarQube UI, paste the justification in the PR description so reviewers don't re-litigate it.
- If you used `// NOSONAR` (only with explicit user approval), add a comment **on the same line** explaining why; never bare.

---

## Decision tree

```
SonarQube finding ?
├── Bug                              → Fix now. Add a regression test if behavioural.
├── Vulnerability                    → Fix now. If a secret leaked, rotate it before commit.
├── Security Hotspot                 → Ask the user: fix or mark Safe-with-justification?
├── Code Smell (cognitive ≥ 25)      → Refactor; route hard ones via typescript-expert.
├── Code Smell (trivial)             → Batch-fix; one PR for the cluster.
└── Markdown                         → Auto-fix; re-run markdownlint.
```

```
Quality gate failed ?
├── Coverage on new code dropped     → Out of scope here; route to test-fixing or test-design-techniques.
├── New issues > threshold           → This skill, Phase 3.
├── Duplications > 3%                → This skill, Phase 3 (extract helper / shared util).
└── Reliability/Security rating ↓    → Fix Bugs / Vulnerabilities first; rating recovers.
```

```
Tempted to use // NOSONAR ?
├── Real false positive              → Mark Won't-Fix in UI with justification (preferred).
├── Intentional pattern (e.g. test)  → Use file-level exclusion in sonar-project.properties.
└── "Just to make it pass"           → STOP. Not allowed. Fix it or leave it for review.
```

---

## Best practices

- **Read the rule, not just the message.** Open `https://rules.sonarsource.com/typescript/RSPEC-XXXX/` so the fix matches *intent*, not just the symptom.
- **One bucket per commit.** Mixing a security fix with cosmetic markdown muddies review.
- **Never silence to ship.** `// NOSONAR` without justification is a smell of its own; the next person inherits a black box.
- **Don't refactor blast radius.** A cognitive-complexity fix that touches 12 unrelated functions is a separate PR — keep this one focused.
- **Re-scan locally.** SonarQube UI lags behind branch state by a scan; trust the scanner exit code, not the dashboard.
- **Coordinate with linter.** If ESLint's `--fix` would resolve the same finding, prefer that over manual edits — keeps style consistent.

---

## Related

- [`sonar-project.properties`](../../../sonar-project.properties) — scanner config (sources, exclusions, severity thresholds).
- [`.agents/skills/test-code-review`](../test-code-review/SKILL.md) — finds smells SonarQube can't (e.g. assertion-free tests).
- [`.agents/skills/typescript-expert`](../typescript-expert/SKILL.md) — for hairy `any`-elimination and cognitive-complexity refactors.
- [`.agents/skills/pom-architect`](../pom-architect/SKILL.md) — owner of the "no `expect()` in pages, no raw `locator()` in tests" rules that drive Sonar duplication findings.
- [`.agents/skills/skill-validator`](../skill-validator/SKILL.md) — re-run after fixing markdown in any `SKILL.md`.
- [`.agents/skills/flaky-test-triage`](../flaky-test-triage/SKILL.md) — correct route for `waitForTimeout` smells; do not `// NOSONAR` them.
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — file a defect when a Bug/Vulnerability finding represents real user impact.
