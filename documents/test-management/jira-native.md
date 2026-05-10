# Jira Native (No Add-On) — Test Management Guideline

> How to do **lightweight test management in Jira without buying Zephyr / Xray / qTest Sync** — by reusing standard Jira issue types + labels + components. This is the **cheapest** option (no marketplace add-on), but you give up significant capability. Use it consciously, not by accident.
>
> **Distinct from [`documents/jira/`](../jira/):** that folder describes the **AI Agent ↔ Jira input contract** (how the agent reads Stories / Bugs / Requirements). This file describes **what to do when you also want to track Test Cases inside Jira itself, and you refuse to buy a Test Management add-on**. The two contracts coexist; neither replaces the other.
>
> Pick this approach via [`tool-comparison.md`](./tool-comparison.md) §Q2 (when volume < 200 cases AND audit posture is informal).

## When to pick Jira native (and when not to)

| Use Jira native when… | Don't pick Jira native when… |
|---|---|
| You already pay for Jira AND refuse another licence line | TC volume > 200 (you'll outgrow it within a quarter — see [`zephyr.md`](./zephyr.md)) |
| ≤ 5 QA engineers AND ≤ 100 manual TCs total | You need per-step pass / fail (Jira issues don't model steps natively — use [`xray.md`](./xray.md) or [`zephyr.md`](./zephyr.md)) |
| Tracker-as-checklist is good enough for the audience | You need run-management dashboards stakeholders read (use any add-on) |
| You're piloting a TM workflow before committing to a paid tool | Regulated industry / audit posture (use [`qtest.md`](./qtest.md)) |
| The team is fine living mostly in [`documents/manual-testcases/`](../manual-testcases/) and uses Jira only for state-tracking on a tiny minority of cases | The team needs traceability reports (rebuild them yourself in `reports/traceability.json` via [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md)) |

> **Honest assessment:** this is the lowest-rated option in [`tool-comparison.md`](./tool-comparison.md) for everything except cost. Use it as a **bridge** while you build the case for Zephyr Scale / Xray.

## Issue-type mapping (the workaround)

Jira ships with **Story / Bug / Task / Sub-task / Epic** by default. To track Test Cases without an add-on, you abuse one of those. The two acceptable patterns:

### Pattern A — "Test Case" as a Sub-task of the Story (recommended)

```
Story  PHX-100  "User can apply discount code at checkout"
├── Sub-task PHX-101  Test: TC-CART-04 — Apply valid code
├── Sub-task PHX-102  Test: TC-CART-05 — Apply expired code
└── Sub-task PHX-103  Test: TC-CART-06 — Apply expired code mid-session
```

Each sub-task is a "Test Case". Steps live in the description (Markdown). Result of one execution lives in the issue's status: `To Do → In Progress → Done` (passed) or `To Do → In Progress → Failed → linked Bug → Done` (failed).

**Pros:** issue links are first-class; reporting works via JQL.
**Cons:** sub-tasks pollute the agile board; no per-step state; no test-cycle history (each execution overwrites the last).

### Pattern B — Custom "Test" issue type (if your Jira admin will add one)

Ask your Jira admin to add a project-level issue type called `Test`. Same shape as Pattern A but the issue lives at the project root, not under a Story. Link it to Stories via the standard "tests" link type.

**Pros:** dedicated issue type avoids sub-task pollution; cleaner JQL.
**Cons:** still no per-step state; still loses execution history; admin friction.

> **Don't use:** Pattern C "store TC text in the Story description". Stories are PM artifacts; abusing them as test repositories destroys both surfaces.

## Required custom fields

Add these to the Story / Test issue scheme **once** via Jira admin.

| Field | Type | Purpose |
|---|---|---|
| `External ID` | Single-line text | The `TC-<MODULE>-<NN>` join key. Required. |
| `Test Priority` | Single-select | `P1 / P2 / P3 / P4` — derived from `@P*` tag |
| `Test Severity` | Single-select | `critical / major / minor / trivial` |
| `Module` (use built-in `Components` field) | Multi-select | `cart / checkout / register / wishlist / profile / address / compare / product / home` |
| `Spec Path` | Single-line text | Populated by the push script (or hand-entered in the smallest setups) |
| `Last Run Result` | Single-select | `Pass / Fail / Skip / Not Run` — overwritten on every CI run |
| `Last Run Build` | Single-line text | GitHub run URL of the most recent execution |

> **Convention:** these fields are derived from the `@P*` / `@severity` tag taxonomy in [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), never the other way around.

## What you give up vs Zephyr / Xray

| Capability | Available natively? | Workaround |
|---|---|---|
| Per-step pass / fail | ❌ | Steps live in description; status is whole-issue only |
| Test cycles / sprints | ❌ | Use Jira "Sprint" or "Fix Version" field as a cycle proxy |
| Run history (multiple executions of one TC) | ❌ | Each run overwrites `Last Run Result`; full history lives in Jira issue history (queryable but not pretty) |
| Coverage by requirement | ⚠️ JQL | Hand-craft JQL; or run [`requirements-traceability`](../../.agents/skills/requirements-traceability/SKILL.md) |
| Reusable shared steps | ❌ | Use a Confluence page; reference by URL in description |
| Test data / parameters | ❌ | Use Excel / `.csv` imported by the spec |
| Stakeholder run dashboard | ⚠️ basic | Use a Jira filter saved as a Dashboard gadget |
| BDD round-trip | ❌ | None; use [`xray.md`](./xray.md) when you need this |
| Audit trail with signatures | ❌ | Jira issue history only; not CFR Part 11 compliant |

If 3+ of these "❌" rows are dealbreakers, you've outgrown Jira native — file an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) for Zephyr Scale or Xray.

## Push run results (per-CI-run)

Use the standard Jira REST API; no add-on needed. The script updates the `Last Run Result` and `Last Run Build` fields on each linked Test issue.

```ts
// scripts/test-management/push-results-jira-native.ts (sketch — keep ≤ 200 lines)
import fs from 'node:fs';

const RUN: { tc_id: string; status: 'passed'|'failed'|'skipped'; spec_path: string }[] =
  JSON.parse(fs.readFileSync('reports/run-summary.json', 'utf8'));

// 1. Resolve TC-CART-04 → Jira issue key via External ID  (JQL: project = PHX AND "External ID" = "TC-CART-04")
// 2. Bulk-update via /rest/api/3/issue/{key}
for (const r of RUN) {
  const issueKey = idMap[r.tc_id];
  if (!issueKey) continue;
  await jira('PUT', `/rest/api/3/issue/${issueKey}`, {
    fields: {
      [LAST_RUN_RESULT_FIELD]: { value: { passed: 'Pass', failed: 'Fail', skipped: 'Skip' }[r.status] ?? 'Fail' },
      [LAST_RUN_BUILD_FIELD]: process.env.GITHUB_RUN_URL ?? '',
      [SPEC_PATH_FIELD]: r.spec_path,
    },
  });
  if (r.status === 'failed') {
    // Transition to "Failed" status if your workflow allows; else add a comment
    await jira('POST', `/rest/api/3/issue/${issueKey}/comment`, {
      body: `❌ FAIL on ${process.env.GITHUB_RUN_URL}\nSpec: ${r.spec_path}`,
    });
  }
}
```

## GitHub Actions snippet

```yaml
  - name: Push run results to Jira (native)
    if: always() && env.JIRA_BASE_URL != ''
    env:
      JIRA_BASE_URL: ${{ vars.JIRA_BASE_URL }}
      JIRA_EMAIL: ${{ secrets.JIRA_EMAIL }}
      JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
      JIRA_PROJECT_KEY: ${{ vars.JIRA_PROJECT_KEY }}
    run: npx ts-node scripts/test-management/push-results-jira-native.ts
```

> The same `JIRA_*` secrets used for the AI Agent input contract ([`documents/jira/integration.md`](../jira/integration.md)) work here — one set of credentials, two scripts.

## Defect filing on failure

Same path as everywhere else: [`defect-report`](../../.agents/skills/defect-report/SKILL.md) files a **GitHub Issue** with `bug` + `severity:*` + `module:*` per [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). The push script then **also** files a Jira Bug (since the team lives in Jira) and links it to the failed Test issue:

```ts
// after marking issue as Fail:
const bug = await jira('POST', '/rest/api/3/issue', {
  fields: {
    project: { key: 'PHX' },
    issuetype: { name: 'Bug' },
    summary: `[${tcId}] ${title}`,
    priority: { name: 'High' },              // map from @severity:major / @severity:critical
    components: [{ name: module }],
    labels: ['bug', `severity:${severity}`, `module:${module}`, `phase:e2e`, `found-in:qa`],
    customfield_external_id: tcId,
    description: `❌ Auto-filed by CI: ${process.env.GITHUB_RUN_URL}\nGitHub Issue: ${ghIssueUrl}`,
  },
});

// Link the Bug to the failing Test
await jira('POST', '/rest/api/3/issueLink', {
  type: { name: 'Tests' },                    // or "Blocks" / your team's preferred link type
  inwardIssue: { key: bug.key },
  outwardIssue: { key: testIssueKey },
});
```

The Jira Bug is a **mirror**, not the system of record. The system of record is the GitHub Issue.

## Reporting → QA Metrics Dashboard

Jira native runs feed `reports/run-summary.json` via the push script. The dashboard's Panel #1 / #4 / #5 read it directly.

For Jira-native dashboards that stakeholders see:

1. Save a filter: `project = PHX AND issuetype = Test`.
2. Add gadgets: Pie Chart on `Last Run Result`, Two-Dimensional Filter Statistics on `Module × Last Run Result`.
3. Embed the Jira Dashboard URL in the team's Confluence release page.

This is **good enough** for stakeholder reporting at < 100 TCs. Beyond that, you've outgrown the pattern.

## Cross-references with `documents/jira/`

This file is the **TC-side** view of Jira. The AI Agent input contract is the **Story / Requirement / Bug input** view. They share **secrets**, **project key**, and **JQL conventions**, but they read / write different issue types:

| Concern | This file (Jira native TM) | [`documents/jira/`](../jira/) |
|---|---|---|
| Issue types written | Test (sub-task or custom), Bug (mirror) | n/a — input only |
| Issue types read | Test, Bug (for traceability) | Story, Requirement, Bug |
| Direction | Repo → Jira (push results) | Jira → Repo (read inputs) |
| Required for AI Agent? | ❌ no | ✅ yes |
| Required for stakeholder reports? | ✅ if you don't have a TM add-on | n/a |

## Anti-patterns specific to Jira native

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Storing TC steps in the Story description | Stories are PM artifacts; you destroy both | Steps in the Test sub-task description (Markdown) |
| Using only Jira native for > 200 TCs "to save money" | Slow JQL; no per-step state; team frustration spirals | File an [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md) for Zephyr Scale by case 100 |
| Skipping the `External ID` field because Jira's own key (`PHX-101`) seems unique enough | Tied to one Jira project; project rename breaks everything | `External ID = TC-<MODULE>-<NN>` is the canonical join key |
| Mixing TC sub-tasks with feature sub-tasks under the same Story | Boards become unreadable | Decide one project-wide convention; document it in the Jira project's README |
| Copy-pasting the Last Run Result manually because the push script "isn't ready" | Numbers go stale within hours; nobody trusts them | Wire the push script on day 1 — it's < 100 LOC |
| Treating the Jira Bug as system of record instead of GitHub Issue | Defect Leakage KPI breaks (two truths) | GitHub Issue is system of record; Jira Bug is a mirror |

## Cross-references

- [`README.md`](./README.md) — folder orientation and shared evidence contract
- [`tool-comparison.md`](./tool-comparison.md) — when to pick Jira native vs the alternatives
- [`documents/manual-testcases/README.md`](../manual-testcases/README.md) — the canonical text layer
- [`documents/jira/`](../jira/) — the **AI Agent ↔ Jira input contract** (orthogonal to this file)
- [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md), [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — taxonomy that Jira fields must mirror
- [`.agents/skills/requirements-traceability/SKILL.md`](../../.agents/skills/requirements-traceability/SKILL.md), [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md), [`.agents/skills/roi-brief/SKILL.md`](../../.agents/skills/roi-brief/SKILL.md) — supporting skills
- [Atlassian Jira Cloud REST v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) — canonical vendor docs

## Status

| Section | Status | Owner |
|---|---|---|
| Issue-type mapping (sub-task / custom Test type) | ✅ v1 | QA Lead |
| Required custom fields | ✅ v1 | QA Lead |
| Push results script | ✅ v1 (≤ 100 LOC target) | QA Platform |
| Defect mirror to GitHub | ✅ v1 (mirror, not source-of-truth) | QA Lead |
| Honest "what you give up" matrix | ✅ v1 | QA Lead |
