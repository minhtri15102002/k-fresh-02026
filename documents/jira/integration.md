# AI QA Agent ↔ Jira Integration Contract

> The technical contract between the **AI QA Agent** (component 2 of the framework) and **Jira** (component 1 + the back-edge of component 4). Covers JQL queries, REST shapes, polling cadence, idempotency, retry, and error handling.

If you are wiring a fresh Jira project into this repo, this is the only document you have to implement against. Everything else (templates, traceability) is content; this is plumbing.

## Two directions of flow

```
                       ┌─────────────────────────────┐
                       │         JIRA                │
                       │  Stories / Reqs / Bugs /    │
                       │  Tasks                      │
                       └────┬───────────────▲────────┘
                            │               │
            ① Fetch Issues  │               │ ② Update Status & Results
              (read)        │               │   (write — comments, transitions, custom fields)
                            ▼               │
                   ┌──────────────────────────┐
                   │   AI QA AGENT (this repo) │
                   └──────────────────────────┘
```

Two endpoints, two responsibilities. Read is high-frequency and stateless; write is low-frequency and idempotent.

## Authentication

| Mode | When to use | Secret name |
|---|---|---|
| **Atlassian API token (Basic auth)** | Local dev, single-user CI bot | `JIRA_USER_EMAIL`, `JIRA_API_TOKEN` |
| **OAuth 2.0 (3LO)** | Production multi-user agent | `JIRA_OAUTH_CLIENT_ID`, `JIRA_OAUTH_SECRET`, `JIRA_OAUTH_REFRESH_TOKEN` |
| **Forge / Connect (app)** | Hosted production | Per Atlassian Forge docs |

Secrets live in **GitHub Actions secrets** for CI runs and in **`.env.local`** (git-ignored) for local development. Never commit a token.

## ① Fetch Issues — read contract

### When the Agent fetches

| Trigger | Cadence | JQL |
|---|---|---|
| Scheduled poll | every 5 min during business hours; every 30 min off-hours | "needs-attention" filters below |
| Webhook (preferred) | on-demand | issue key extracted from event payload |
| Manual (CLI) | on-demand | passed by operator |

### JQL filter library

All queries scope to the QA project (`project = QA`) and exclude already-processed issues.

#### A. Stories ready for QA scaffolding

```jql
project = QA
AND issuetype = Story
AND status in ("In Review", "Ready for QA")
AND "Acceptance Criteria" is not EMPTY
AND (labels not in (qa-agent-processed) OR updated > "-1d")
ORDER BY priority DESC, updated ASC
```

#### B. Bugs needing a regression spec

```jql
project = QA
AND issuetype = Bug
AND status in ("Triaged", "In Progress")
AND "Steps to Reproduce" is not EMPTY
AND "Severity" is not EMPTY
AND (labels not in (qa-agent-processed) OR updated > "-1d")
ORDER BY "Severity" ASC, updated ASC
```

#### C. Requirements needing coverage check

```jql
project = QA
AND issuetype = Requirement
AND status = Active
AND updated > "-7d"
ORDER BY priority DESC
```

#### D. Tasks ready to run

```jql
project = QA
AND issuetype = Task
AND status = "To Do"
AND "Workflow" is not EMPTY
ORDER BY priority DESC, created ASC
```

> **Always** combine with the `qa-agent-processed` label exclusion to make the read idempotent. The Agent **adds** that label after a successful first-pass and **removes** it on every Jira-side update (handled via webhook).

### REST call (read)

```http
GET /rest/api/3/search?jql=<URL-ENCODED-JQL>&fields=summary,description,priority,labels,components,issuetype,status,customfield_10010&expand=renderedFields
Accept: application/json
Authorization: Basic <base64(email:token)>
```

Pin `fields` explicitly — never `fields=*all` (latency + payload bloat).

### Response handling

| Field | Where it goes |
|---|---|
| `key` | Used as `Requirement Reference` in [`documents/manual-testcases/_template.md`](../manual-testcases/_template.md); embedded in spec test name as `JIRA-XXX-…` |
| `priority.name` | Mapped to `@P1` / `@P2` / `@P3` / `@P4` (see table below) |
| `customfield_<AC>` | Parsed into manual TC **Test Steps** + **Expected Result** sections |
| `labels` (`module:*`) | Becomes `@feature:<module>` test tag |
| `components` | Becomes `@feature:<component>` if no `module:*` label present |

### Priority → tag mapping

| Jira priority | Test tag | Severity (default) |
|---|---|---|
| Highest | `@P1` | `@critical` |
| High | `@P2` | `@major` |
| Medium | `@P3` | `@minor` |
| Low / Lowest | `@P4` | `@trivial` |

Severity may be overridden per ticket via the **Severity** custom field (Bugs only).

### Rate limiting & backoff

- Hard cap: **20 requests / minute / project** (Atlassian Cloud baseline). Stay under.
- On HTTP 429: exponential backoff with jitter, max 5 retries, then dead-letter queue.
- Long-running paginated reads should checkpoint by `updated` timestamp, not by offset (Jira pagination is shaky on writes-during-read).

---

## ② Update Status & Results — write contract

### When the Agent writes

| Event | Write action | Idempotency key |
|---|---|---|
| TC + spec scaffold generated | Add comment + `qa-agent-processed` label | `<issueKey>:scaffold:v<N>` |
| Spec passing in CI | Add comment with run URL + transition `Ready for QA → Done` | `<issueKey>:run:<runId>` |
| Spec failing in CI | Add comment with trace link; transition `In Progress → Reopened` if previously fixed | `<issueKey>:run:<runId>` |
| Self-healing applied | Add comment summarising heal (see [`self-healing-loop.md`](./self-healing-loop.md)) | `<issueKey>:heal:<healId>` |
| Defect mirrored to GitHub | Add remote link to GH Issue | `<issueKey>:gh:<gh-issue-number>` |

> **Every write carries an idempotency key** in the comment header (`<!-- qa-agent: <key> -->`). Before writing, the Agent searches existing comments for the key — if present, it updates instead of duplicating.

### REST calls (write)

#### Add a comment

```http
POST /rest/api/3/issue/{issueKey}/comment
Content-Type: application/json
Authorization: ...

{
  "body": {
    "version": 1,
    "type": "doc",
    "content": [
      { "type": "paragraph", "content": [
          { "type": "text", "text": "<!-- qa-agent: ABC-123:run:9876 -->" }
      ]},
      { "type": "paragraph", "content": [
          { "type": "text", "text": "✅ Regression spec passing — " },
          { "type": "text", "text": "view CI run", "marks": [
              { "type": "link", "attrs": { "href": "https://github.com/..." } }
          ]}
      ]}
    ]
  }
}
```

#### Transition an issue

```http
POST /rest/api/3/issue/{issueKey}/transitions
Content-Type: application/json

{ "transition": { "id": "31" } }     // 31 = "Ready for QA → Done" in this project
```

Transition IDs are **per-project**; cache the mapping at startup via `GET /rest/api/3/issue/{issueKey}/transitions`.

#### Set a custom field (e.g. linked spec path)

```http
PUT /rest/api/3/issue/{issueKey}
Content-Type: application/json

{
  "fields": {
    "customfield_10042": "tests/ui/test-cart.spec.ts:45"     // Linked Spec
  }
}
```

#### Add a remote link (to GitHub Issue or run)

```http
POST /rest/api/3/issue/{issueKey}/remotelink
Content-Type: application/json

{
  "object": {
    "url": "https://github.com/<org>/<repo>/issues/<n>",
    "title": "GH Issue: <severity>:<module> — <one-line>",
    "icon": { "url16x16": "https://github.com/favicon.ico", "title": "GitHub" }
  },
  "globalId": "system=github,issue=<n>"   // dedupe key
}
```

### Comment template (machine-parseable header + human-readable body)

```markdown
<!-- qa-agent: {issueKey}:{action}:{id} -->
**{emoji} {action-title}** — {short summary}

| Field | Value |
|---|---|
| Run | [CI #{runId}]({runUrl}) |
| Spec | `{specPath}:{line}` |
| Tags | `{tagSet}` |
| Outcome | {pass/fail/heal/scaffold} |

> Generated by AI QA Agent · {timestamp ISO-8601}
```

The header line is **mandatory** — without it, idempotency check fails.

### Webhook (preferred over polling, when available)

Configure Jira → Settings → System → Webhooks:

| Event | Endpoint | Purpose |
|---|---|---|
| `jira:issue_created` | `POST /webhooks/jira/issue-created` | Trigger first-pass scan |
| `jira:issue_updated` | `POST /webhooks/jira/issue-updated` | Re-scan; remove `qa-agent-processed` label if material fields changed |
| `comment_created` | `POST /webhooks/jira/comment-created` | Detect human override comments (e.g. `/qa-agent rerun`) |

Webhook payloads are signed with `X-Atlassian-Webhook-Signature`; verify using `JIRA_WEBHOOK_SECRET`.

## Errors & failure modes

| Failure | Detection | Behaviour |
|---|---|---|
| 401 / 403 (auth) | HTTP code | Hard-stop; alert on-call; do **not** retry |
| 404 (issue gone) | HTTP code | Log + skip; remove from queue |
| 409 (concurrent edit) | HTTP code | Refetch and retry once |
| 429 (rate limit) | HTTP code | Backoff + retry (max 5) |
| 5xx | HTTP code | Backoff + retry (max 3); dead-letter on persistent |
| Schema mismatch (custom field renamed) | JSON parse error | Hard-stop; alert; needs human config update |
| Idempotency-key collision | Existing comment found | Update existing comment instead of POST |

All errors are logged to `reports/jira-agent.log` with `{ level, ts, issueKey, action, httpStatus, retryCount, errorBody }`.

## Configuration

A single config file `configs/jira-agent.yml` (git-tracked, no secrets):

```yaml
project_key: QA
base_url: https://<your-org>.atlassian.net
webhook_endpoint: https://<your-ci>/webhooks/jira
poll:
  business_hours_minutes: 5
  off_hours_minutes: 30
custom_fields:
  acceptance_criteria: customfield_10010
  severity: customfield_10031
  workflow: customfield_10055
  linked_spec: customfield_10042
priority_to_tag:
  Highest: "@P1"
  High: "@P2"
  Medium: "@P3"
  Low: "@P4"
  Lowest: "@P4"
labels:
  processed: qa-agent-processed
  bug: bug
  regression: regression
status_transitions:
  ready_for_qa_to_done: 31
  in_progress_to_reopened: 81
```

**Custom field IDs are unique per project**. Discover them with:

```http
GET /rest/api/3/field
```

## Local dry-run (no writes)

```bash
JIRA_DRY_RUN=true npx ts-node scripts/jira-agent-cli.ts --jql 'project = QA AND issuetype = Bug AND status = Triaged'
```

In dry-run mode the Agent fetches and prints what it *would* write (with idempotency keys) but never POSTs. Use this in PRs that change JQL or templates.

## Smoke test in CI

`.github/workflows/jira-agent-smoke.yml` (proposed) runs nightly:

1. Fetch with each JQL filter (A–D); assert HTTP 200.
2. POST a dry-run comment to a fixed sandbox issue (`QA-SANDBOX-1`); assert 201.
3. Read it back; assert idempotency-key header present.
4. Delete the test comment.

Failure = page on-call. The integration is core infrastructure.

---

**Prev:** [`issue-types.md`](./issue-types.md) · **Up:** [Jira docs README](./README.md) · **Next:** [`self-healing-loop.md`](./self-healing-loop.md)
