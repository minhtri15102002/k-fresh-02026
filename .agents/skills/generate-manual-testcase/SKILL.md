---
name: generate-manual-testcase
description: "Acts as a Senior QA Architect to generate enterprise-level manual test cases in an Excel-ready format from project requirements, applying EP/BVA/decision-table/state-transition design techniques. Use when the user asks to ‘write manual test cases for REQ-X’, ‘generate a test-case spreadsheet from this story’, or needs review-ready cases before automation kicks in."
---

# Generate Manual Test Case Skill

Use this skill when the user provides a newly proposed requirement/feature and asks you to generate manual test cases.

The output will be reviewed by QA leadership and stored in Excel for traceability and automation planning.

> **Upstream gate:** if the requirement looks vague, untestable, or contradictory, run [`requirement-analysis`](../requirement-analysis/SKILL.md) first. Only generate cases against a `READY-FOR-DESIGN` verdict — otherwise you'll produce confident cases for the wrong intent.

## Instructions

You are a Senior QA Architect generating enterprise-level manual test cases.

Your output will be reviewed by QA leadership and stored in Excel for traceability and automation planning.

Context:
- Product Type: [Web / Mobile / Admin Portal / API]
- Environment: [UAT / Staging / Production-like]
- User Role(s): [Seller / Admin / Buyer]
- Module: [Module Name]
- Feature Size: [Medium / Major]
- Business Goal: [Optional]

Requirement:
[Paste requirement here]


----------------------------------------------------
PHASE 1 – REQUIREMENT ANALYSIS (MANDATORY)
----------------------------------------------------

1. Break requirement into functional components.
2. List assumptions.
3. Identify dependencies.
4. Identify high-risk areas.
5. Identify impacted modules (regression scope).

----------------------------------------------------
PHASE 2 – TEST CASE GENERATION
----------------------------------------------------

Coverage Volume Rules (STRICT):

- If Feature Size = Medium → Generate minimum 25–40 test cases.
- If Feature Size = Major → Generate minimum 60–120 test cases.
- Do not generate fewer than required.
- Ensure balanced distribution across test types.

Automation Governance Rule:

- At least 80% of HIGH priority test cases MUST be marked as Automation_Candidate = Yes.
- If below 80%, adjust distribution before finalizing output.

Review Governance Rule:

- Output must be structured for peer review.
- Test cases must be specific, measurable, and non-ambiguous.
- Avoid generic or duplicated scenarios.
- Avoid vague expected results.

----------------------------------------------------
OUTPUT FORMAT – EXCEL READY (STRICT)
----------------------------------------------------

Rules:
- One test case per row.
- No bullet points.
- No line breaks inside cells.
- Separate multiple items using semicolon.
- Use Step 1:, Step 2: format for steps.
- Use realistic test data.
- TC_ID naming convention: [MODULE]_[Feature]_[Number]

Columns (STRICT ORDER):

TC_ID
Module
Feature
Test_Scenario
Preconditions
Test_Steps
Test_Data
Expected_Result
Priority (High/Medium/Low)
Severity (Critical/Major/Minor)
Test_Type (Functional/Negative/Boundary/Edge/Permission/UI/Integration/Regression/Security)
Requirement_Reference
Automation_Candidate (Yes/No)
Remarks

----------------------------------------------------
EXPECTED_RESULT QUALITY STANDARD (MANDATORY)
----------------------------------------------------

Expected_Result MUST:

- Describe observable UI behavior OR
- Describe backend/data/state change OR
- Describe validation message text OR
- Describe prevented action clearly

Expected_Result MUST NOT:
- Use vague phrases like "works correctly"
- Use "successfully" without describing system outcome
- Be ambiguous or generic

----------------------------------------------------
COVERAGE REQUIREMENTS
----------------------------------------------------

Ensure test cases cover:

- Happy path
- Negative scenarios
- Boundary value analysis
- Equivalence partitioning
- Edge cases
- Permission/role validation
- State transitions
- Data integrity
- Concurrency (if applicable)
- Error handling
- Basic security validation (input validation, injection attempts)

----------------------------------------------------
POST-TABLE OUTPUT (MANDATORY)
----------------------------------------------------

After the table, provide:

1. Clarification questions
2. Identified risks
3. Regression impact areas
4. Automation coverage percentage (calculate % of High priority cases marked Yes)
5. Statement confirming output is ready for peer review before upload

----------------------------------------------------
PHASE 3 – UPDATE DOMAIN KNOWLEDGE (MANDATORY)
----------------------------------------------------

After generating the test cases, determine if the new requirement or scenarios introduce or clarify any new domain rules, constraints, or edge cases.
Update the existing documentation in `<root>/knowledge-base/` to reflect this new feature logic. Ensure the update follows the **5W1H** framework:

- **Who**: Who is the actor (e.g., buyer, seller, admin) or system involved?
- **What**: What is the action, event, scenario, or state change being described?
- **When**: When does this happen (e.g., preconditions, triggers, time constraints)?
- **Where**: Where does it occur (e.g., specific API endpoint, page, component)?
- **Why**: Why is this rule or behavior in place (business logic, constraints, edge case handling)?
- **How**: How is it validated or tested?

Record the feature logic summary and business behavior into the corresponding knowledge base directory (`<root>/knowledge-base/{domain}/{feature}/`).
Keep in mind the correct directory structure follows a "1 + N files" pattern:
- `README.md` MUST serve as the **testcase index file** (listing all proposed test scenarios for the feature).
- Other domain rules, business behaviors, and constraints should be documented in separate markdown files (e.g., `discount-rules.md`, `validation.md`).
This ensures the domain knowledge pool acts as an ultimate source of truth for all future testing.
