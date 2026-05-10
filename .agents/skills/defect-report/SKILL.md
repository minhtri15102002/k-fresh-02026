---
name: defect-report
description: "Drafts a GitHub bug report that complies with .github/ISSUE_TEMPLATE/bug_report.md and prompts/core/defect-labels.md so the issue lands in the QA Metrics dashboard automatically. Use when explicitly asked to file a defect or write a bug ('write a bug report', 'file this as a defect', 'open an issue for this failure', 'log this bug'), after a Playwright run produces a failing test, or when a stakeholder describes broken behaviour and wants it triaged. Produces (1) a fully-filled issue body matching the template, (2) the canonical label set ('bug' + exactly one severity:* + exactly one module:* + optional status:*), and (3) a ready-to-run `gh issue create` command — never opens the issue itself without explicit user confirmation."
---

# Defect Report

Turn a raw failure (Playwright trace, error stack, screenshot, manual repro, or stakeholder description) into a GitHub bug report that:

1. **Matches the structure** of `.github/ISSUE_TEMPLATE/bug_report.md` (Summary / Severity / Module / Environment / Steps / Expected / Actual / Evidence / Suspect commit / Related test / Workaround).
2. **Carries the canonical labels** per `prompts/core/defect-labels.md` so the QA Metrics dashboard counts it correctly: `bug` + exactly one `severity:*` + exactly one `module:*`, plus optional `status:in-progress`.
3. **Emits a one-line `gh` command** the user can paste — the skill itself NEVER calls `gh issue create` without explicit confirmation.

This skill is the bridge between `prompts/core/failure-analyzer.md` (root-cause triage) and the dashboard's `defects.json` feed.

---

## When to use this skill

Trigger on any of:

- "Write a bug report for…"
- "File this as a defect" / "Log this bug" / "Open an issue for this failure"
- A Playwright failure has been analysed and the user wants it tracked
- A stakeholder describes broken behaviour and asks for an issue
- Reviewing CI failures and converting the actionable ones into tickets

**Do NOT trigger when:**
- The user wants the bug **fixed** → use [`.agents/skills/test-fixing`](../test-fixing/SKILL.md) or the [`playwright-test-healer`](../../../.claude/agents/playwright-test-healer.md) agent (under `.claude/agents/`, not `.agents/skills/`)
- The user wants a **flaky** test triaged → file via the `flaky_test.md` template instead (and use this skill only if they explicitly want a defect tracked separately)
- The user wants a **feature** → use the feature-request template, not this skill
- A **security** vulnerability was found → route to GitHub Private Vulnerability Reporting (see `.github/ISSUE_TEMPLATE/config.yml`)

---

## Inputs you need

Ask only for what's missing — do not interrogate the user. Pull what you can from the evidence they provided:

| Input | Where to find it | Required? |
|---|---|---|
| One-sentence summary | User's description / failure message | yes |
| Steps to reproduce | Trace events, manual narration, or spec body | yes |
| Expected behaviour | Spec assertion, requirement doc, `Messages.*` constants, `TRANSLATIONS.*` | yes |
| Actual behaviour | Error stack, screenshot text, console output | yes |
| Environment (env / build / browser / OS / viewport) | `playwright.config.ts`, CI logs, `process.env.ENV`, user statement | yes |
| Severity | Inferred per the table below; ask only if ambiguous | yes |
| Module | Mapped from the failing spec path (`tests/ui/test-cart.spec.ts` → `module:cart`) | yes |
| Suspect commit / area | `git log -1`, `git blame`, recent merges | optional |
| Related test ID | The spec that should have caught it (`@TC-…` tag, file path) | optional |
| Workaround | User-supplied | optional |

If you cannot infer severity OR module from the evidence, **ask** — never guess these two; they drive the dashboard.

---

## How to use it

### Phase 1 — Gather evidence

Read whatever the user provided (trace `.zip`, screenshot, error block, narration). If a Playwright failure is in scope, run [`prompts/core/failure-analyzer.md`](../../../prompts/core/failure-analyzer.md) **first** to obtain the root-cause classification — that classification informs **severity** and the **suspect-commit / area** field, but you DO NOT copy its technical jargon into the user-facing report.

### Phase 2 — Classify

#### Severity (pick exactly one — `severity:critical | severity:major | severity:minor | severity:trivial`)

| If the failure is… | Severity |
|---|---|
| Data loss, money loss, security exposure, unrecoverable broken flow, or blocks ALL users | `severity:critical` |
| Important feature broken, workaround exists, blocks SOME users / specific journeys | `severity:major` |
| Cosmetic, UX nit, minor inconsistency, no functional blocker | `severity:minor` |
| Typo, copy nit, demo-only path, doc issue | `severity:trivial` |

> A **failure-analyzer** verdict of `PRODUCT_BUG` on a checkout/auth path = `severity:major` minimum. `PRODUCT_BUG` on payment / order completion / login = `severity:critical`.

#### Module (pick exactly one — derive from spec path)

| Spec path / failing area | Module |
|---|---|
| `tests/.../test-register*.spec.ts`, `test-login*.spec.ts`, `test-profile*.spec.ts` (auth section) | `module:auth` |
| `tests/.../test-cart*.spec.ts` (UI or API) | `module:cart` |
| `tests/.../test-checkout*.spec.ts` | `module:checkout` |
| `tests/.../test-profile*.spec.ts` (account dashboard, address book) | `module:profile` |
| `tests/.../test-product*.spec.ts` | `module:product` |
| `tests/.../test-compare*.spec.ts` | `module:compare` |
| `tests/.../test-wishlist*.spec.ts` | `module:wishlist` |
| `tests/.../test-home*.spec.ts` | `module:home` |

If the bug spans two modules, pick the one users encounter first; the other can go in the report body under "Related areas".

#### Optional status

- `status:in-progress` — only if the user is actively working on it RIGHT NOW.

### Phase 3 — Draft the report

Use [`resources/body-template.md`](resources/body-template.md) as the body skeleton. Fill **every** non-optional section. Keep:

- **Summary** ≤ 12 words, action-oriented (e.g. `Cart total ignores discount on quantity update`). NOT `cart bug`.
- **Steps** atomic and copy-pasteable; quote exact selectors, URLs, data; no hand-waving.
- **Expected vs Actual** quote-for-quote. If a test asserted on `Messages.LOGIN_FAILED`, cite it.
- **Evidence** as Markdown links / image refs / fenced excerpts. NEVER paste a 200-line stack trace — link a gist or the CI run instead, and keep ≤ 30 lines inline.
- **Severity / Module checkboxes** ticked for the chosen labels (the labels also go in the `gh` command, but ticking them in the body is the human-readable confirmation).

### Phase 4 — Emit the `gh` command

Call [`scripts/file-defect.sh --help`](scripts/file-defect.sh) to see the latest CLI surface, then produce ONE block the user can paste:

```bash
.agents/skills/defect-report/scripts/file-defect.sh \
  --title "Cart total ignores discount on quantity update" \
  --severity major \
  --module cart \
  --body-file /tmp/defect-2026-05-10.md \
  --milestone "v2.0 · Coverage Hardening"   # optional
```

Or, if the user prefers a raw `gh` invocation:

```bash
gh issue create \
  --title "Cart total ignores discount on quantity update" \
  --label "bug,severity:major,module:cart" \
  --milestone "v2.0 · Coverage Hardening" \
  --body-file /tmp/defect-2026-05-10.md
```

### Phase 5 — Confirm before opening

Before running `gh`, **always** print the labels + title and ask the user to confirm. Once confirmed, you may invoke `gh issue create` if they asked for it; otherwise leave the command for them to paste.

---

## Decision tree

```
Failure or bug report ?
├── User says "fix this" or "make tests pass"
│       → use test-fixing skill or the playwright-test-healer agent (NOT this skill)
├── It's a flaky test (passes on retry, intermittent)
│       → use the flaky_test.md template via this skill's body, label "flaky"
├── It's a security vulnerability
│       → STOP. Direct user to GitHub Private Vulnerability Reporting.
├── It's a feature gap (no spec, missing capability)
│       → use the test_coverage_request.md template, NOT this skill
└── It's a real defect
        → run failure-analyzer first (if Playwright artefact)
        → classify severity + module per the tables above
        → fill body-template.md
        → emit the gh command
        → confirm and (optionally) execute
```

---

## Output contract

A correct invocation of this skill produces, in order:

1. A short reasoning block (≤ 5 lines) with the chosen `severity:* + module:*` and why.
2. A fenced Markdown block containing the FULL issue body (the filled template).
3. A fenced shell block containing the `gh` (or wrapper) command.
4. A confirmation prompt: "Open this issue now? (yes / no)".

NEVER output a partial body. NEVER omit the labels. NEVER guess severity/module silently — say "I'm assuming `severity:major` because…" so the user can override.

---

## Best practices

- **Anchor severity to user impact, not test impact.** A test failure is severity:major if real users would notice it; a fixture-data bug that fails the suite but no real user is affected is `severity:minor` at most.
- **Cite the requirement.** If a `REQ-*` ID exists in the requirements traceability matrix, link it in the report — that closes the dashboard's traceability loop.
- **One bug per issue.** Two unrelated symptoms in one trace = two issues. The dashboard counts issues, not symptoms.
- **Use the existing label catalogue verbatim.** No new labels. If a new module is needed, propose adding it to `defect-labels.md` first, in a separate PR.
- **Do not duplicate.** Before drafting, run `gh issue list --label "bug,module:<x>" --search "<keyword>"` and link a duplicate if found.
- **Redact secrets.** Strip cookies, auth tokens, internal URLs from evidence. The QA Metrics site is public.
- **Milestone hint.** If the bug is a known `v2.0 Coverage Hardening` (or other) item, set the `--milestone` flag — it shows up on the milestone progress bar instantly. See `.github/MILESTONES.md`.
- **No emojis in titles.** Bug titles render in CI logs, terminals, and search results; emojis hurt grep-ability.

---

## Related

- [`.github/ISSUE_TEMPLATE/bug_report.md`](../../../.github/ISSUE_TEMPLATE/bug_report.md) — the body shape this skill targets.
- [`prompts/core/defect-labels.md`](../../../prompts/core/defect-labels.md) — label taxonomy.
- [`prompts/core/failure-analyzer.md`](../../../prompts/core/failure-analyzer.md) — root-cause triage that feeds Phase 1.
- [`scripts/fetch-defects.ts`](../../../scripts/fetch-defects.ts) — the consumer; reads issues filed by this skill into `reports/defects.json`.
- [`templates/qa-metrics-dashboard.html`](../../../templates/qa-metrics-dashboard.html) — the eventual destination of every issue this skill files.
- [`.github/MILESTONES.md`](../../../.github/MILESTONES.md) — milestone catalogue, optional `--milestone` flag.
