# Module 32 — MCP & Browser Agents

> Phase 6 · Effort: 4h · Prerequisites: Module 31

## Learning objectives

After this module you can:

- Define **MCP** (Model Context Protocol) and its role in agentic workflows.
- Drive a real browser session through an MCP-enabled agent.
- Apply the **MCP-first discipline** demanded by `prompts/core/pom-orchestrator.md`.
- Distinguish what MCP can do (real DOM exploration) from what it can't (real users, real load).

## Why it matters

Agents that "write tests from a description" are unreliable — they invent locators, assume DOM structure, and hallucinate flows. Agents that **drive a real browser via MCP first** observe the real DOM and write code grounded in reality. The difference is night-and-day.

## Concepts

### What is MCP

**Model Context Protocol** is an open standard for giving LLMs structured access to tools and data sources. Implementations include:

- Playwright MCP — drive a real browser
- Filesystem MCP — read/write files in a sandbox
- GitHub MCP — interact with issues / PRs
- HTTP MCP — call any REST API

MCP servers expose tools; the agent calls them; results return as structured data.

### Playwright MCP — what it gives you

Tools the agent can invoke:

```
browser_navigate(url)         → opens a real Chromium tab
browser_snapshot()            → captures the accessibility tree (NOT a screenshot)
browser_click(ref)            → clicks an element by ref
browser_type(ref, text)       → types into a field
browser_select_option(ref, …) → selects from <select>
browser_press_key(key)        → keyboard
browser_take_screenshot()     → image (for the agent to "see" layout)
browser_close()
```

The accessibility-tree snapshot is the killer feature: the agent sees roles + names + hierarchy, not raw HTML.

### MCP-first discipline (this repo's rule)

From `prompts/core/pom-orchestrator.md`:

> Phase 1 — Readiness: You MUST exercise the live flow with Playwright MCP tools (`browser_navigate`, `browser_snapshot`, etc.) before generating or refactoring code. Never derive locators or selectors from a written scenario alone.

Why:

- Real DOM, real ARIA roles, real names → real locators.
- Hidden states, modal dismissals, animations are observed, not guessed.
- The agent's `## Missing Helper` notes are based on what actually doesn't work, not invented gaps.

### Workflow with an MCP-enabled agent

```
1. You: "Generate a wishlist test. Manual TC at @TC-WISH-001.md."
2. Agent: browser_navigate("https://ecommerce.test.com")
3. Agent: browser_snapshot() → accessibility tree
4. Agent: identifies "Wishlist" link by role=link, name="Wishlist"
5. Agent: browser_click(ref) → confirms it navigates
6. Agent: browser_snapshot() on /wishlist → captures table structure
7. Agent now writes locators with confidence
8. Agent: browser_close()
9. Agent: writes locators / page / spec / data
10. Agent: runs the spec via shell → confirms green
```

If the agent skips step 2–8, the prompt's Phase 1 rule should reject the work.

### Snapshot vs screenshot

| | What it is | Use |
|---|---|---|
| `browser_snapshot()` | Accessibility tree (text) | Locator authoring, structure understanding |
| `browser_take_screenshot()` | Image | Layout / visual debugging only |

The accessibility tree is far more reliable than parsing HTML or interpreting pixels. Always snapshot first.

### Setting up Playwright MCP

This repo has a Skill: `.agents/skills/setup-playwright-mcp/SKILL.md`. Read it for the canonical install steps.

Roughly:

```bash
npm i -D @playwright/mcp
# then configure your IDE / agent runner to launch the MCP server
```

In Cursor / Claude Code / similar, MCP servers are declared in a config file. The agent gains the `browser_*` tool family automatically.

### What MCP cannot do

- Simulate **load** (use k6 / Locust / Playwright load tests)
- Replicate real-user **devices** (use BrowserStack / Playwright cloud)
- Test **production** (it's a real browser, but the agent might do destructive things — sandbox it)
- Replace **exploratory testing** by humans (curiosity is not a tool)

### Agentic workflows beyond MCP

This repo also uses:

- **Agent Skills** (`.agents/skills/`) — reusable autonomous capabilities (api-fuzzer-generator, performance-testing-review, etc.)
- **Subagents** — spawned for parallel exploration
- **CI agents** — could run `failure-analyzer.md` on every PR failure automatically

Combine them: a fail in CI → trigger an agent → agent runs `failure-analyzer.md` with the trace → posts a triage comment on the PR.

### Safety

- Agents in repos with prod credentials → revoke before letting them loose.
- Sandbox the filesystem MCP — limit to the workspace.
- Review every agent-generated PR like a junior dev's first PR.
- Never let the agent push to `main`.

## Hands-on lab

1. Read `.agents/skills/setup-playwright-mcp/SKILL.md`. Set up Playwright MCP in your IDE.
2. Open a chat with an MCP-enabled agent. Ask: "Navigate to the SUT, snapshot the home page, list all the links visible to a logged-out user."
3. Convert the agent's output into a `locators/home-locators.ts` extension. Compare with what's already there.
4. Use the orchestrator pattern (Module 31) but verify the agent **actually** snapshots before writing code (look at the chat log).

## Self-check

- [ ] Why is `browser_snapshot()` more reliable than reading HTML?
- [ ] What's the rule from `pom-orchestrator.md` Phase 1?
- [ ] Two things MCP cannot do?
- [ ] When would you use a subagent instead of one big agent?

## Further reading

- modelcontextprotocol.io
- This repo's `.agents/skills/setup-playwright-mcp/SKILL.md`
- Anthropic — Building agents with MCP

---

**Prev:** [31 — Using the prompt library](./31-using-the-prompt-library.md) · **Next:** [33 — Capstone & career paths](./33-capstone-and-career-paths.md)
