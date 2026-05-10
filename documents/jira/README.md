# Jira Integration for the AI-Powered QA Framework

> Source-of-truth folder for **how Jira plugs into this repo's QA pipeline** — what issue types we accept, the contract the AI QA Agent uses to fetch and update them, the self-healing loop that closes the cycle, and the traceability matrix that ties Jira IDs to manual TCs, specs, defects, and dashboard panels.

## The picture

This folder documents the **first and last legs** of the AI-Powered Self-Healing QA Automation Framework:

```
       ┌────────────┐  Fetch Issues   ┌─────────────────┐  Generate Tests   ┌─────────────────────┐
       │ 1. JIRA    │ ───────────────►│ 2. AI QA AGENT  │ ─────────────────►│ 3. PLAYWRIGHT +     │
       │            │                 │  - TC gen       │                   │    BROWSER           │
       │  - User    │                 │  - Validation & │                   │  - Cross-browser     │
       │    Stories │                 │    dedup        │                   │  - Parallel          │
       │  - Reqs    │                 │  - Prioritise   │                   │  - Detailed reports  │
       │  - Bugs    │                 │  - Automation   │                   │                      │
       │  - Tasks   │                 │    mapping      │                   └──────────┬───────────┘
       └─────▲──────┘                 └─────────────────┘                              │
             │                                                                         │ Test Execution
             │ Update Status & Results                                                 │ (Results & Logs)
             │                                                                         ▼
             │                       ┌────────────────────────────────────────────────────────────┐
             └───────────────────────│ 4. SELF-HEALING + LEARNING LOOP                           │
                                     │  Failure → Analyze → AI Healing → Validate & Retry → Learn │
                                     └────────────────────────────────────────────────────────────┘
```

Components 2 and 3 already live in this repo (`prompts/`, `.agents/skills/`, `pages/`, `tests/`, `playwright.config.ts`). Components **1** (Jira input contract) and the **back-edge** (Update Status & Results from component 4) are what this folder formalises.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`issue-types.md`](./issue-types.md) | The 4 supported Jira issue types (User Story, Requirement, Bug, Task) — fields, templates, state models, and the QA-required AC discipline | Before opening a Jira issue that QA must consume |
| [`integration.md`](./integration.md) | The **Fetch Issues** + **Update Status & Results** contract used by the AI QA Agent — JQL queries, REST shapes, polling cadence, idempotency rules | Wiring or maintaining the AI Agent ↔ Jira bridge |
| [`self-healing-loop.md`](./self-healing-loop.md) | The 5-step self-healing loop (Failure Detected → Analyze → AI Healing Engine → Validate & Retry → Learn & Store) and **how each step reports back to Jira** | Reviewing flake outcomes; adopting selector-healing in production |
| [`traceability.md`](./traceability.md) | The Jira ID ↔ Manual TC ↔ Spec ↔ Defect ↔ Dashboard matrix; the `requirements-traceability` skill consumes it | Building or auditing coverage reports |

## Reading order

1. **`issue-types.md`** — the input shape; without this every other doc is theoretical.
2. **`integration.md`** — how the AI Agent reads from and writes back to Jira.
3. **`self-healing-loop.md`** — what happens when a generated test fails in CI and how Jira learns about it.
4. **`traceability.md`** — how a Jira ID survives all the way to a chart on the QA Metrics dashboard.

## Conventions used here (cross-references)

- **Manual TC IDs** — `TC-<MODULE>-<NN>` per [`documents/manual-testcases/README.md`](../manual-testcases/README.md).
- **Defect labels** — `bug` + exactly one `severity:*` + exactly one `module:*`, per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Mirrored in Jira via the field mapping in [`integration.md`](./integration.md).
- **Test tags** — `@P*` / `@severity` / `@suite` / `@feature` per [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md). Tag values are derived from Jira issue priority + labels.
- **Coverage requirements** — every feature row in [`documents/automation-framework/coverage-requirements.md`](../automation-framework/coverage-requirements.md) maps to one or more Jira Requirement / User Story IDs in [`traceability.md`](./traceability.md).
- **Skills** — [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md), and [`.agents/skills/spec-to-code-compliance/SKILL.md`](../../.agents/skills/spec-to-code-compliance/SKILL.md) all read or write Jira-formatted artifacts described here.

## Out of scope

This folder is **not**:

- A general Jira admin guide (project setup, permissions, custom field schemas) — that lives in your Jira instance's admin docs.
- A replacement for Atlassian's own API documentation — see [Jira Cloud REST v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) for the canonical schema.
- A licence to bypass `prompts/core/defect-labels.md` — Jira fields and GitHub labels both apply; this folder makes them consistent, not optional.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`issue-types.md`](./issue-types.md) | ✅ v1 | QA Lead |
| [`integration.md`](./integration.md) | ✅ v1 (REST examples; Webhook stretch) | QA Platform |
| [`self-healing-loop.md`](./self-healing-loop.md) | ✅ v1 (loop + Jira hooks) | AI Test Engineer |
| [`traceability.md`](./traceability.md) | ✅ v1 (matrix + dashboard hand-off) | QA Lead |

## Phase-7+ connection

For the leadership / architect framing of "what Jira *should* be in an AI-augmented QA org", see:

- [`training/phase-7-ai-era-leadership/34-ai-transformation-of-qa-teams.md`](../../training/phase-7-ai-era-leadership/34-ai-transformation-of-qa-teams.md) — Jira as the canonical issue surface for the AI Quality Leader role.
- [`training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md`](../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) — Jira positioned as Component ⓪ (the input adapter to the platform).
