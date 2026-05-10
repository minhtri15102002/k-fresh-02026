---
name: playwright-test-generator
description: "Generates Playwright test scripts that follow best practices, this repo’s framework conventions (POM, fixtures, tags, assertHelper), and testing guidelines. Use when the user asks to ‘write a Playwright spec for X’, ‘generate a test for this flow’, or needs a runnable starter aligned with the project’s patterns rather than a generic snippet."
---

# Playwright Test Generator Skill

Use this skill when instructed to create, update, or expand an automated Playwright test using TypeScript.

## General Rules
- You are a **Playwright test generator**.
- **DO NOT** generate test code from the scenario alone.
- **DO** execute steps sequentially using the Playwright MCP tools.

## Website Exploration Workflow
1. Navigate to the specified URL.
2. Explore **one key functionality** of the site.
3. Close the browser once exploration is complete.
4. Implement a **Playwright TypeScript test** (`@playwright/test`) that follows best practices:
   - Role-based locators
   - Auto-retrying assertions
   - No unnecessary timeouts (use Playwright’s built-in auto-waiting).

## Framework Conventions
- **Base Fixture & POM:** Use the extended `test` from `pages/base-page.ts` for fixtures and page objects.
- **Models:** Define input/output data structures in the `models` folder.
- **Test Data:** Store in the `data` folder.
- **Locators:** Define in the `locators` folder; must be accessed via page objects, not directly.
- **Page Objects:** Encapsulate UI interactions inside `pages/ui/`.
- **Constants:** Keep in `utilities/constants.ts`.
- **Assertions:**
  - Use `assertHelper` (initialized once per test file).
  - Perform all assertions through `assertHelper`.

## Coding Standards
- Follow provided **templates** (found in exactly `examples/`) for locators and page objects.
- Annotate methods with `@step` decorators.
- Use descriptive test titles and inline comments.
- All test files must be saved under the `tests` directory.

## Test Execution
- After generation, execute the test file.
- Iterate until the test passes successfully.
- When writing a test, assume access to **all page objects and helpers** as parameters in the test function.

## 📑 Folder Responsibilities

| Folder / File              | Responsibility                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **`locators/`**            | Centralized locators for each page. Uses role-based locators for reliability.                                         |
| **`pages/`**               | Page Object Models (POM). `base-page.ts` for fixtures, `common-page.ts` for shared methods, `ui/` for specific pages. |
| **`models/`**              | TypeScript interfaces defining input/output data structures.                                                          |
| **`data/`**                | Static test data (e.g., users, appointments).                                                                         |
| **`utilities/`**           | Helper classes like `assertions.ts`, `constants.ts`, `logging.ts`, `logger.ts`.                                       |
| **`tests/`**               | Test files (`.spec.ts`) organized by feature/module.                                                                  |
| **`translations/`**        | Language-specific text for multi-language/i18n support.                                                               |
| **`playwright.config.ts`** | Global Playwright configuration (browsers, retries, reporters, etc.).                                                 |
| **`package.json`**         | Node.js dependencies, scripts, and project metadata.                                                                  |
| **`tsconfig.json`**        | TypeScript compiler configuration.                                                                                    |
| **`README.md`**            | Project documentation and onboarding guide.                                                                           |

---
**IMPORTANT RESOURCES**
- Review `examples/` directory for structure reference (models, data, locators, page objects, specs).
- Review `resources/guidelines.md` for extended coding and testing standards.
