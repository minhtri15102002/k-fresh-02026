---
name: custom-gitlab-mcp
description: "Equips the agent with tools to interact with a bespoke GitLab Code Review MCP server: fetches merge request details, summarises changes, posts inline feedback, and manages discussion threads directly within GitLab. Use when the user asks to ‘review this MR’, ‘leave comments on GitLab MR !123’, or wants the agent to drive a GitLab review without leaving the chat."
optionalRefs:
  - scripts/gitlab/mcp.ts                            # third-party — set up per consumer repo
  - .gitlab/merge_request_templates/Default.md       # third-party — provided by GitLab project
---

# Custom GitLab MCP

This skill provides instructions for interacting with the bespoke GitLab Code Review MCP server located at `scripts/gitlab/mcp.ts` in the current workspace.

## When to use this skill

- An instruction to review an external GitLab merge request is provided.
- You need to fetch metadata, descriptions, or file diffs for a given merge request.
- You need to post inline comments or general overview comments on a GitLab merge request.
- You need to resolve threads or reply to discussions on a merge request.

## How to use it

### Connecting to the MCP Server

**Important:** Whenever possible, you should attempt to formally inject `scripts/gitlab/mcp.ts` into your active MCP toolkit configuration (e.g., `mcp_config.json`, `cline_mcp_settings.json`) first. This ensures the GitLab tools become natively available directly in your tools loop.

If you are unable to statically register the server in your tool configuration, you may fall back to manually executing the Stdio server via `ts-node`:

```bash
cmd.exe /c "npx ts-node scripts/gitlab/mcp.ts"
```

### Running in CLI / CI Mode

If you need to execute a tool natively via the terminal without connecting the `StdioServerTransport` (for instance, in automated CI/CD environments or as a direct command), you can invoke `mcp.ts` in CLI mode by wrapping your payload identically to the MCP JSON definition:

```bash
npx ts-node scripts/gitlab/mcp.ts cli gitlab_upsert_mr '{"projectId":"123","title":"Hello API"}'
```

```bash
npx ts-node scripts/gitlab/mcp.ts --help
```

**Bypassing JSON Quote Restrictions (Windows/Powershell):**
If the payload is complex or quoting issues occur in the shell, save the required JSON locally and natively read it via an `@` prefix:

```bash
npx ts-node scripts/gitlab/mcp.ts cli gitlab_upsert_mr @.personal/gitlab/payload.json
```

### Decision Tree: Choosing the Right Tool

When reviewing a merge request, follow this logic to select the correct MCP tool:

- **Need the big picture?** Use `gitlab_fetch_mr_details` to get the title, description, and branch info.
- **Need to see the code changes?** Use `gitlab_fetch_mr_changes` to view the unified diffs and modified files.
- **Need to see if there are open questions?** Use `gitlab_fetch_unresolved_threads` to find active discussions.
- **Ready to leave feedback?**
  - If it's a general comment about the entire MR (e.g., "Great job", "This needs a rebase"): Use `gitlab_post_comment`.
  - If it's specific to a line of code: Use `gitlab_post_inline_comment`. Include `filePath`, and either `newLineNumber` (if it's a new/modified line) or `oldLineNumber` (if it's a deleted line).
- **Need to respond to an existing comment?** Use `gitlab_reply_to_thread` with the `discussionId`.
- **Did you confirm a fix was applied?** Use `gitlab_resolve_thread` to mark an existing discussion as resolved.
- **Need to create or update a Merge Request?** Use `gitlab_upsert_mr` with the `sourceBranch`, `targetBranch`, `title`, and optional `description`, `assigneeIds`, and `reviewerIds`. This is highly intelligent and **idempotent**: it will search for an existing MR matching the branches. If it exists, it will `PUT` (update) the payload. If not, it will `POST` (create) it. The `description` parameter natively supports full multi-line Markdown text directly in the JSON payload. **Important**: Always append the message *"This merge request is created / updated by AI"* at the bottom of the `description`.
- **Need to check existing Merge Requests?** Use `gitlab_search_mrs` to filter MRs by `sourceBranch`, `targetBranch`, `state`, or general `search` strings.
- **Need to assign a reviewer or an assignee but don't know their user ID?** Use `gitlab_search_users` to query by username or name to obtain the necessary integer IDs before creating the MR.

## Best Practices

- **Find the true `mrIid`**: The `mrIid` (Internal ID) is found in the URL of the merge request (e.g., `!123` means `mrIid` is `123`), which is different from the global project ID.
- **Project IDs**: If you don't know the integer Project ID, use the URL-encoded path like `my-group%2Fmy-project`.
- **Use Git Workflows & Templates**: ALWAYS coordinate with the `git-pr-workflows-git-workflow` skill when creating an MR. You **MUST** strictly adhere to the project's MR template. ALWAYS read `.gitlab/merge_request_templates/Default.md` and use that exact markdown checklist structure in your `description` payload when creating or updating MRs.
- **Merge Request Etiquette**: When creating a new merge request via `gitlab_upsert_mr`, **never** dump large, monolithic changes (e.g., 100+ file changes) into a single MR. If a task requires massive sweeping changes, you must proactively partition the work: create multiple separate git branches, logically group the changes by component or feature, and open several smaller merge requests incrementally. Titles must be highly descriptive, and descriptions must comprehensively outline the "Why" and "What" of the changes.

### Developer-Friendly Review Comments

When leaving review comments on MRs (via `gitlab_post_comment`, `gitlab_post_inline_comment`, or replying), **act as a mentor, not just a strict gatekeeper:**
1. **Be Actionable & Exact:** Never say generic things like "Split this MR" or "Fix local lint errors." Instead, provide the **exact Bash/Git commands** to achieve it (e.g., `git reset origin/main`, `git checkout -b new-branch`, `npm run lint -- --fix`).
2. **Use the `diff` Format:** When showing how to fix a codebase issue, always provide the exact file path and use code `diff` blocks so the developer knows *exactly* where to paste the fix.
3. **Be Empathetic:** Acknowledge their effort. Give context on *why* the suggestion matters (e.g. "Because parallel tests might crash with a 404...") instead of just declaring it "Wrong".
4. **Attribution:** Always append a suffix indicating the comment was generated by AI (e.g., *"(Generated by AI)"*).
