---
name: playwright-skill
description: "Runs general-purpose browser automation by authoring custom Playwright code for any automation task and executing it via a universal executor. Use when the user asks to ‘automate this in the browser’, ‘scrape / fill / screenshot this page’, ‘drive a one-off browser flow’, or needs Playwright power without the full test-suite ceremony."
risk: safe
source: community
date_added: "2026-02-27"
---

# Playwright Browser Automation

General-purpose browser automation skill. Write custom Playwright code for any automation task.

## CRITICAL WORKFLOW - Follow these steps in order:

1. **Auto-detect dev servers** - For localhost testing, ALWAYS run server detection FIRST:
   - If **1 server found**: Use it automatically, inform user
   - If **multiple servers found**: Ask user which one to test
   - If **no servers found**: Ask for URL or offer to help start dev server

2. **Write scripts to /tmp** - NEVER write test files to skill directory; always use `/tmp/playwright-test-*.ts`

3. **Use visible browser by default** - Always use `headless: false` unless user specifically requests headless mode

4. **Parameterize URLs** - Always make URLs configurable via environment variable or constant at top of script

## Setup (First Time)

```bash
npm init -y
npm install playwright
npx playwright install chromium
```

## Execution Pattern

```typescript
const { chromium } = require("playwright");

const URL = process.env.TARGET_URL || "http://localhost:3000";

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(URL);
    await page.waitForLoadState("networkidle");

    // Your test logic here
  } finally {
    await browser.close();
  }
})();
```

## Common Patterns

### Test a Page (Multiple Viewports)

```typescript
const viewports = [
  { width: 1920, height: 1080, label: "Desktop" },
  { width: 768, height: 1024, label: "Tablet" },
  { width: 375, height: 812, label: "Mobile" },
];

for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  await page.screenshot({ path: `/tmp/${viewport.label}.png` });
}
```

### Test Login Flow

```typescript
await page.goto("/login");
await page.getByLabel("Email").fill("user@example.com");
await page.getByLabel("Password").fill("password");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("/dashboard");
```

### Fill and Submit Form

```typescript
await page.getByLabel("First Name").fill("John");
await page.getByLabel("Last Name").fill("Doe");
await page.getByRole("combobox", { name: "Country" }).selectOption("VN");
await page.getByRole("button", { name: "Submit" }).click();
await expect(page.getByText("Success")).toBeVisible();
```

### API Route Mocking

```typescript
await page.route("**/api/endpoint", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: "mocked" }),
  });
});
```

### Take Screenshot with Error Handling

```typescript
try {
  await page.goto(URL);
  await page.screenshot({ path: "/tmp/screenshot.png", fullPage: true });
} catch (error) {
  await page.screenshot({ path: "/tmp/error.png" });
  throw error;
}
```

## Tips

- Use `getByRole()`, `getByText()`, `getByLabel()` over CSS selectors
- Add `await page.waitForLoadState('networkidle')` for dynamic SPAs
- Use `page.waitForResponse()` to wait for specific API calls
- Capture traces: `await context.tracing.start({ screenshots: true, snapshots: true })`

## When to Use

Use this skill for browser automation, E2E testing, scraping, or any task requiring real browser interaction.
