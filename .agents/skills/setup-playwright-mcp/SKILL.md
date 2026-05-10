---
name: setup-playwright-mcp
description: "Installs and patches the @metoto/playwright-trace-analyzer-mcp package so AI agents can analyse Playwright traces. Use when explicitly asked to 'set up Playwright MCP', 'install the trace analyzer', or when an agent needs to read traces locally to debug failing specs."
---

# Setup Playwright Trace Analyzer MCP

**Target Audience:** AI Coding Agents / Assistants
**Purpose:** Guide on installing and configuring `@metoto/playwright-trace-analyzer-mcp` for users, including instructions on mitigating a known startup crash caused by an upstream dependency bug (`fastmcp` completion handlers).

## CONTEXT

The user wants to use `@metoto/playwright-trace-analyzer-mcp` to analyze Playwright `.zip` traces within their IDE or MCP client. The server relies on the `fastmcp` package, which currently has a bug where it throws the following fatal error on startup if your MCP host does not natively support completions:

```
❌ Failed to start MCP server: Error: Server does not support completions (required for completion/complete)
```

To successfully set this up, you must configure the MCP tools to download the package, let it fail so `npx` caches the package locally, and then **patch the cached file** to remove the bug.

## EXECUTION STEPS

### 1. Configure the MCP Settings

Locate the user's MCP configuration file (e.g., `mcp.json`, `cline_mcp_settings.json`, `mcp_config.json` depending on their environment). Add the following configuration directly to the `mcpServers` block:

```json
{
  "mcpServers": {
    "playwright-trace-analyzer": {
      "command": "npx",
      "args": [
        "-y",
        "@metoto/playwright-trace-analyzer-mcp@latest"
      ]
    }
  }
}
```
*Note: If the user is on Windows and strict `npx` resolution fails, using `"npx.cmd"` as the command is an acceptable alternative, but start with `"npx"`.*

### 2. Instruct User to Reload and Capture the Error Path

Instruct the user to save the config and reload their MCP client (or reload the IDE window). Warn them that the server **will crash** on its first startup.

When it crashes, ask the user to provide the MCP server error logs. Look for the stack trace that will look similar to this:

```
❌ Failed to start MCP server: Error: Server does not support completions
...
at FastMCPSession.setupCompleteHandlers (file:///C:/Users/[User]/AppData/Local/npm-cache/_npx/313750675023523d/node_modules/fastmcp/dist/FastMCP.js:425:18)
...
```

Extract the absolute file path to `FastMCP.js` from the stack trace provided by the user (e.g. `C:\Users\...\node_modules\fastmcp\dist\FastMCP.js` or `~/.npm/_npx/...`).

### 3. Patch the Cached Library

Use your file editing tools (`replace_file_content` or similar) to open the cached `FastMCP.js` file extracted in Step 2.

You need to prevent the MCP server from registering completion handlers. Search for the `constructor` initialization around lines 250-270.

**Target Content**
```javascript
    this.setupRootsHandlers();
    this.setupCompleteHandlers();
    if (tools.length) {
```

**Replacement Content**
```javascript
    this.setupRootsHandlers();
    // this.setupCompleteHandlers();
    if (tools.length) {
```

*By commenting out `this.setupCompleteHandlers();`, you bypass the startup constraint.*

### 4. Final Restart

Ask the user to reload the MCP client or IDE window one last time. Since `npx` already downloaded and cached the module in the `npm-cache` directory, the next execution will use the newly patched `FastMCP.js` file.

The server will now start successfully, and you will have full access to its tools (e.g., `analyze-trace`, `get-network-log`, `get-trace`, etc.) in your toolset list.
