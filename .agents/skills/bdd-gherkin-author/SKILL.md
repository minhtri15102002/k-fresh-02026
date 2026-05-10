---
name: bdd-gherkin-author
description: "Authors Gherkin feature files (Given / When / Then) for teams that use BDD with Cucumber, playwright-bdd, or @cucumber/cucumber. Translates user stories or manual test cases into business-readable scenarios, generates the matching step-definition stubs in TypeScript, and wires Playwright fixtures so steps share `page` / `context`. Use when explicitly asked to 'write Gherkin', 'author feature files', 'add BDD scenarios for X', 'translate this user story to Cucumber', or when the team has adopted playwright-bdd. Distinct from generate-manual-testcase (Excel-style cases) and generate-testcase (raw Playwright spec); this skill targets the Gherkin layer between them."
---

# BDD Gherkin Author

BDD is most useful as a **conversation tool**: scenarios that PMs, devs, and QA can read together. This skill authors that artefact — Gherkin scenarios that compile to Playwright steps without losing readability.

## When to use this skill

- "Write Gherkin for `<feature>`"
- "Author feature files"
- "Translate this user story to Cucumber"
- "Add BDD scenarios for X"
- When the project uses `playwright-bdd` or `@cucumber/cucumber`

Do **not** use when:
- The team uses raw Playwright specs only → use [`generate-testcase`](../generate-testcase/SKILL.md).
- The artefact is for QA leadership review (Excel) → use [`generate-manual-testcase`](../generate-manual-testcase/SKILL.md).
- The story itself is vague, untestable, or contradictory → run [`requirement-analysis`](../requirement-analysis/SKILL.md) first to vet it; author Gherkin only against a `READY-FOR-DESIGN` verdict.

## How to use it

### Phase 1 — Decompose the story

1. Identify the actor, the action, and the outcome from the user story.
2. List the scenarios: 1 happy path + 1 alternate + 1 edge + 1 negative (minimum).

### Phase 2 — Author Gherkin

Follow the canonical structure:

```gherkin
Feature: Cart quantity update
  As a shopper
  I want to update the quantity of an item in my cart
  So that I can buy the right amount before checkout

  Background:
    Given I am signed in as a customer
    And my cart contains 1 "Premium Widget" priced at "$10.00"

  @P1 @smoke @cart
  Scenario: Increase quantity to a valid amount
    When I update the "Premium Widget" quantity to "3"
    Then the cart total should be "$30.00"
    And the cart count badge should show "3"

  @P2 @regression @cart
  Scenario Outline: Validation on invalid quantities
    When I update the "Premium Widget" quantity to "<qty>"
    Then I should see the error "<message>"

    Examples:
      | qty  | message                      |
      | 0    | Quantity must be at least 1  |
      | -1   | Quantity must be at least 1  |
      | abc  | Quantity must be a number    |
      | 9999 | Maximum quantity is 99       |
```

### Phase 3 — Step definitions (TypeScript + Playwright)

Generate stubs that delegate to existing page objects (do not duplicate POM logic):

```ts
// features/step_definitions/cart.steps.ts
import { createBdd } from 'playwright-bdd';
import { test } from '../../tests/fixtures';

const { Given, When, Then } = createBdd(test);

Given('my cart contains {int} {string} priced at {string}', async (
  { cartPage }, qty: number, name: string, price: string,
) => {
  await cartPage.seedItem({ name, qty, price });
});

When('I update the {string} quantity to {string}', async (
  { cartPage }, name: string, qty: string,
) => {
  await cartPage.updateQuantity(name, qty);
});

Then('the cart total should be {string}', async ({ cartPage }, expected: string) => {
  await cartPage.assertCartTotal(expected);
});
```

### Phase 4 — Wire to fixtures

Reuse the project's existing Playwright fixtures so each step gets `cartPage`, `loginPage`, etc., with the same lifecycle as raw specs.

### Phase 5 — Validate tags

Tags carry over from raw specs; run [`test-tags-validator`](../test-tags-validator/SKILL.md) against the generated step bodies (or the @-tags in the feature file, depending on the Cucumber bridge in use).

## Best practices

- **Declarative, not imperative.** "When I check out" is good; "When I click `#checkout-button`" is bad.
- **Reuse POM methods in steps.** Steps should be one-liners; duplication of UI logic kills BDD's value.
- **Tags on Scenario, not Feature.** Lets you run a subset (`@smoke`).
- **Background ≤ 3 lines.** Long backgrounds defeat readability.
- **No assertions in `When`.** `When` is action; `Then` is assertion. Mixing them muddies failures.

## Related

- [`.agents/skills/generate-manual-testcase/SKILL.md`](../generate-manual-testcase/SKILL.md) — for Excel-formatted cases
- [`.agents/skills/generate-testcase/SKILL.md`](../generate-testcase/SKILL.md) — for raw Playwright specs
- [`.agents/skills/pom-architect/SKILL.md`](../pom-architect/SKILL.md) — page objects the steps delegate to
- [`.agents/skills/test-tags-validator/SKILL.md`](../test-tags-validator/SKILL.md) — tag conventions
