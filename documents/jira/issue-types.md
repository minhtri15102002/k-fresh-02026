# Jira Issue Types — QA Input Contract

> The four issue types the AI QA Agent fetches and consumes (matching the **JIRA** column of the AI-Powered Self-Healing framework). Each type has: **purpose**, **required fields**, **template**, **state model**, and **what the AI Agent does with it**.

If a Jira issue doesn't conform to its type's contract here, the AI Agent will reject it with a comment instead of silently producing a low-confidence test case.

## At a glance

| Issue type | Feeds | AI Agent action | Owner who closes |
|---|---|---|---|
| **User Story** | Manual TC + spec scaffold | Generate `documents/manual-testcases/<area>/TC-…md` + `tests/<ui\|api>/test-…spec.ts` | Feature team + QA |
| **Requirement** | Manual TC + traceability row | Generate manual TC; add to `traceability.md`; tag spec with requirement ID | QA Lead |
| **Bug** | Defect report + regression test | File GH Issue via `defect-report` skill; generate failing-then-passing regression spec | Author + QA |
| **Task** | Tooling / chore | Run named workflow (e.g. "refresh fixtures"); comment outcome on the ticket | Originator |

---

## ① User Story

### Purpose

Describes a slice of user-facing behaviour. The richest of the four types — drives both manual and automated coverage.

### Required Jira fields

| Field | Required | Notes |
|---|---|---|
| Summary | ✅ | Concise, scenario-like |
| Description | ✅ | Use template below |
| Acceptance Criteria (Gherkin) | ✅ | Each criterion = one candidate TC |
| Priority | ✅ | Highest / High / Medium / Low → maps to `@P1`–`@P4` (see [`integration.md`](./integration.md)) |
| Labels | ✅ | At least one `module:*` label per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) |
| Components | ✅ | Maps to `@feature:*` test tag |
| Linked Requirement IDs | ⚠️ | Strongly recommended; required for high-risk flows |

### Description template (paste into Jira)

```markdown
## Context
<Why this story exists; the user need it serves>

## User flow
As a <role>, I want to <capability>, so that <benefit>.

## Acceptance Criteria
- AC-1 (Gherkin):
    Given <state>
    When <action>
    Then <observable outcome>
- AC-2 (Gherkin):
    ...

## Test data
- <key inputs the AC depends on, with sources>

## Non-functional notes
- Performance budget: <p95 / latency / throughput if relevant>
- Accessibility: <WCAG criteria if user-facing>
- Security: <auth / RBAC / data-class if relevant>

## Out of scope
- <explicit non-goals so the AI Agent doesn't over-generate>
```

### State model

```
TO DO  →  IN PROGRESS  →  IN REVIEW  →  READY FOR QA  →  DONE
                              ▲                ▼
                              └── REJECTED ────┘  (back to IN PROGRESS)
```

| Transition | What the AI QA Agent does |
|---|---|
| **TO DO → IN PROGRESS** | No-op (dev work) |
| **IN PROGRESS → IN REVIEW** | Generate manual TC draft + spec scaffold; post link as a comment |
| **IN REVIEW → READY FOR QA** | Run generated specs in CI; post pass/fail summary |
| **READY FOR QA → DONE** | Close manual TC entry as ✅ Automated in [`documents/manual-testcases/README.md`](../manual-testcases/README.md) |

### What the AI Agent produces

1. One `documents/manual-testcases/<area>/TC-<MODULE>-<NN>.md` per AC (using [`_template.md`](../manual-testcases/_template.md), with `Requirement Reference` = the Jira key).
2. One spec scaffold under `tests/<ui|api>/test-<feature>.spec.ts` with the priority + module tags derived from Jira fields.
3. A traceability row in [`traceability.md`](./traceability.md).

---

## ② Requirement

### Purpose

A higher-level, often regulatory or contractual statement that may span multiple stories. The unit of audit, not the unit of dev work.

### Required Jira fields

| Field | Required | Notes |
|---|---|---|
| Summary | ✅ | "REQ-…" prefix encouraged for grep-ability |
| Description | ✅ | Plain English; cite source (regulation, contract, design doc) |
| Owner | ✅ | Single accountable person |
| Linked Stories | ✅ | At least one User Story implements it |
| Labels | ✅ | `module:*` + `compliance:*` if regulatory |
| Reviewer | ✅ | Required for changes |

### Description template

```markdown
## Statement
<Single, testable requirement sentence>

## Source
<Regulation clause / contract section / design doc URL>

## Risk class
☐ Critical (legal / safety / data-class A)
☐ High    (revenue-impacting)
☐ Medium  (UX-impacting)
☐ Low     (cosmetic / informational)

## How we verify
- <One or more test types: manual TC, automated spec, evaluation, monitoring>

## Linked stories implementing this
- [ ] <STORY-XXX>
- [ ] <STORY-YYY>

## Sunset / review date
<YYYY-MM-DD>
```

### State model

```
PROPOSED  →  RATIFIED  →  ACTIVE  →  SUPERSEDED   (or DEPRECATED)
```

Requirements never go to "Done" — they are always **Active** until explicitly **Superseded** or **Deprecated** with a successor link.

### What the AI Agent produces

- Adds a row to [`traceability.md`](./traceability.md) and verifies that **every linked story** has at least one manual TC + spec implementing it.
- Flags Requirements with no linked story or no spec coverage in the weekly traceability report.
- Does **not** generate tests directly — Requirements are implemented through their linked Stories.

---

## ③ Bug Report

### Purpose

A defect found in production, staging, or a CI run. Every bug becomes a regression test before it can be closed.

### Required Jira fields

| Field | Required | Notes |
|---|---|---|
| Summary | ✅ | "Bug: <one-line repro headline>" |
| Description | ✅ | Use template below |
| Severity | ✅ | Critical / Major / Minor / Trivial → maps to GH `severity:*` label |
| Module | ✅ | Maps to GH `module:*` label |
| Environment | ✅ | qa / uat / staging / prod / local |
| Steps to Reproduce | ✅ | Numbered, copy-pasteable |
| Expected vs Actual | ✅ | Both sides populated |
| Attachments | ⚠️ | Trace, screenshot, video if from a Playwright run |
| Linked Failing Test | ⚠️ | If discovered by automation |

### Description template

```markdown
## Summary
<One sentence of what is wrong>

## Environment
- Env: <qa | uat | staging | prod | local>
- Browser / OS: <e.g. Chromium 124 on macOS 14>
- Build / commit: <hash or version>
- Date / time first observed: <YYYY-MM-DD HH:mm TZ>

## Steps to reproduce
1. <step>
2. <step>
3. <step>

## Expected
- <Observable, specific>

## Actual
- <Observable, specific>

## Severity rationale
<Why this severity? Cite blast radius, data-loss risk, user count, workaround presence.>

## Attachments
- Trace: <link>
- Screenshot: <link>
- Video: <link>
- Logs: <link>

## Linked failing test (if any)
- <tests/.../*.spec.ts:line>

## Suggested regression test
- <File path + tag set the future regression spec should have>
```

### State model

```
NEW  →  TRIAGED  →  IN PROGRESS  →  FIXED  →  VERIFIED  →  CLOSED
                         ↓                       ↑
                      WON'T FIX                  └── REOPENED
```

| Transition | What the AI QA Agent does |
|---|---|
| **NEW → TRIAGED** | Validate field completeness; suggest severity / module labels via [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) |
| **TRIAGED → IN PROGRESS** | Generate a **failing** regression spec scaffold under `tests/<area>/test-bug-<JIRA-KEY>.spec.ts` |
| **FIXED → VERIFIED** | Re-run the regression spec; post pass/fail comment |
| **VERIFIED → CLOSED** | Close GH issue (if mirrored); add row to [`traceability.md`](./traceability.md) under "Closed regressions" |

### Mirroring to GitHub

Every Jira Bug must be mirrored to a GitHub Issue using the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill. Field mapping:

| Jira | GH Issue |
|---|---|
| Severity | label: `severity:critical \| major \| minor \| trivial` |
| Module | label: `module:auth \| cart \| checkout \| ...` |
| Status (FIXED) | label: `status:fixed` |
| Status (WON'T FIX) | label: `status:wontfix` |
| Linked failing test | body: "Linked spec: …" |

---

## ④ Task

### Purpose

Tooling, chore, or one-off work that is **not** a story or a bug. The AI Agent's contract is narrower: run the named workflow, report outcome, no test generation.

### Required Jira fields

| Field | Required | Notes |
|---|---|---|
| Summary | ✅ | Imperative ("Refresh fixtures", "Update Allure history") |
| Description | ✅ | Specify the workflow and inputs |
| Workflow | ✅ | One of the named workflows below |
| Owner | ✅ | Person who reviews the outcome |
| Labels | ⚠️ | `chore:*` recommended |

### Description template

```markdown
## Workflow to run
<One of: refresh-fixtures | update-allure-history | regen-locators | resync-traceability | …>

## Inputs
- <key=value pairs the workflow needs>

## Definition of done
- <Observable outcome the owner verifies>

## Rollback
- <How to undo if outcome is wrong>
```

### State model

```
TO DO  →  RUNNING  →  AWAITING REVIEW  →  DONE
                              ↓
                          FAILED  →  (re-queue or escalate)
```

### What the AI Agent does

- Looks up the named workflow in `.github/workflows/` or `scripts/`; refuses if unknown.
- Posts a comment with the run URL when **RUNNING**.
- Posts the run outcome (artifact links, summary table) when transitioning to **AWAITING REVIEW**.
- Never auto-closes a Task — humans verify and close.

---

## Field-mapping cheat sheet (Jira → repo)

| Jira field | Repo / artifact | Conversion rule |
|---|---|---|
| Priority | Test tag `@P1` / `@P2` / `@P3` / `@P4` | Highest=`@P1` … Lowest=`@P4` |
| Severity (Bug) | GH label `severity:*` + spec tag `@critical` / `@major` / `@minor` / `@trivial` | 1:1 |
| Module / Component | GH label `module:*` + spec tag `@feature:<module>` | lowercase, hyphenated |
| Issue Type | Routes to manual-TC folder + spec folder | Story/Requirement → `documents/manual-testcases/<area>/`; Bug → `tests/<area>/test-bug-<KEY>.spec.ts` |
| Linked Requirement | `Requirement Reference` field in `_template.md` | Jira key as URL |
| Acceptance Criteria | One AC = one row in **Test Steps** section | Gherkin → numbered steps |

## Anti-patterns (rejected by the AI Agent)

| Anti-pattern | Why rejected | Fix |
|---|---|---|
| Story with no AC | Cannot generate measurable TCs | Add Gherkin AC |
| Bug with no Steps to Reproduce | Cannot generate a regression spec | Add numbered repro |
| Bug with severity but no rationale | Severity inflation (Critical-everything) | Add severity rationale |
| Requirement with no linked Story | Untestable; orphan | Link or close as duplicate |
| Task with unknown workflow | Agent can't action it | Pick a defined workflow or escalate |

---

**Up:** [Jira docs README](./README.md) · **Next:** [`integration.md`](./integration.md) — the AI Agent ↔ Jira contract
