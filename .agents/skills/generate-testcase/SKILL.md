---
name: generate-testcase
description: "Generates an automated Playwright test script from a manual test-case description, drawing on domain knowledge in the project’s skills folder and updating the domain documentation afterward. Use when the user asks to ‘automate this manual case’, ‘convert TC-XX into a spec’, or hands the agent a written test scenario expecting a runnable .spec.ts in return."
---

# Generate Test Case Skill

Use this skill when a tester provides a manual test case description and asks you to automate it.

# Note

- If you want to use command terminal. add `cmd /c` before the command.
- you must reference `models/` to get the type definition of the payload. Avoid _any_ type in code
- you can use `cmd /c npx run check:all` to check the project error after you write the test case

## Process

1. **Read Domain Knowledge**
   - Identify the relevant domain, feature, or component from the tester's manual test case description.
   - Use your file system tools (`list_dir`, `view_file`, or `grep_search`) to explore and read relevant files from the `<root>/knowledge-base/` directory.
   - Pay close attention to domain rules, validation logic, recommended testing architectures, pricing details, and existing edge cases documented in these files.

2. **Write the Targeted Test Case**
   - Create or update the relevant automated test script (`.spec.ts`) in the appropriate directory under `tests/`. Add **JSDoc** comments to describe the test case purpose, steps, and assertions.
   - Adhere strictly to the project's best practices (e.g., "Extreme Abstraction", using designated test helpers, ensuring idempotent operations, and correct teardown/cleanup logic in `afterEach`).
   - If performing API testing, try to use or create dedicated helper files (e.g., `flash-sale-api-helper.ts`) to manage and encapsulate the API interactions.
   - Ensure your script completely covers the steps and assertions outlined in the manual test case, while incorporating the constraints you just learned from `<root>/knowledge-base/`.

3. **Update the Domain Knowledge**
   - After writing the test case, determine if the new scenario introduces or clarifies any new domain rules, constraints, edge cases, or testing patterns.
   - Update the existing documentation in `<root>/knowledge-base/` to reflect this new test case and any new logic it covers. Ensure the update follows the **5W1H** framework:
     - **Who**: Who is the actor (e.g., buyer, seller, admin) or system involved?
     - **What**: What is the action, event, scenario, or state change being described?
     - **When**: When does this happen (e.g., preconditions, triggers, time constraints)?
     - **Where**: Where does it occur (e.g., specific API endpoint, page, component)?
     - **Why**: Why is this rule or behavior in place (business logic, constraints, edge case handling)?
     - **How**: How is it implemented, verified, or automated (e.g., test steps, API requests, assertions)?
   - Record the testcase scenario summary, rules, and expected behavior into the corresponding knowledge base directory (`<root>/knowledge-base/{domain}/{feature}/`).
   - Keep in mind the correct directory structure follows a "1 + N files" pattern:
     - `README.md` MUST serve as the **testcase index file** (listing all covered or automated scenarios for the feature).
     - Other domain rules, business behaviors, and constraints should be documented in separate markdown files (e.g., `discount-rules.md`, `validation.md`).
   - This ensures the domain knowledge pool constantly grows and acts as an ultimate source of truth for subsequent test generations.
