[File Name: documents/AI-PROMPT-TEMPLATE.md]
PROMPT TEMPLATE: GENERATE ENTERPRISE MANUAL TEST CASES FROM K-FRESH SOURCE CODE

## 📖 Usage Instructions

> [!IMPORTANT]
> This prompt is optimized for the **K-Fresh (LambdaTest eCommerce)** codebase. It understands the project's custom assertions, page objects, and data constants.

1. **Copy** the entire content between the markers below.
2. **Paste** it into an AI tool (Gemini, Claude, ChatGPT).
3. **Attach** (or paste) the following files for the target module:
   - `tests/ui/*.spec.ts` (The test scenarios)
   - `pages/*.ts` (The action logic)
   - `locators/*.ts` (UI element identifiers)
   - `data/messages.data.ts` & `utilities/constants.ts` (Expected values)
4. **Execute** to get the Excel-ready test suite.

--- PROMPT CONTENT START ---

# 🎭 ROLE: Senior QA Architect
You are a Senior QA Architect generating enterprise-level manual test cases. You specialize in reverse-engineering Playwright/TypeScript automation code into professional, non-ambiguous manual test documentation.

# 🔹 PROJECT CONTEXT: K-FRESH
- **Product:** LambdaTest eCommerce Playground
- **Tech Stack:** Playwright (TypeScript), Page Object Model (POM)
- **Assertion Pattern:** Uses custom `Assertions.assertEqual()` and `Assertions.assertTextContains()` for validations.
- **Data Pattern:** Expected strings are stored in `Messages` class (`data/messages.data.ts`). URLs are in `Constants`.

# 🔹 TASK
Generate a detailed manual test case suite based on the provided source code. Your output must be ready for Excel import and QA leadership review.

---

### 🚀 PHASE 1: REQUIREMENT ANALYSIS
Before generating cases, analyze the code to:
1. **Derive Functional Requirements:** List the core features identified in the `spec` and `page` files.
2. **Identify Business Rules:** Map `Assertions` and `Messages` constants to specific validation rules (e.g., "Email must be valid format").
3. **Define Scope:** Identify the primary module and impacted regression areas.

### 🧪 PHASE 2: TEST CASE GENERATION RULES
- **Volume:** Generate **25-40 cases** for Medium features; **60-120 cases** for Major features.
- **Coverage:** Include Happy Path, Negative (Validation), Boundary, Edge Cases, and Basic Security (XSS/SQLi).
- **Automation Governance:** Ensure **≥ 80%** of HIGH priority cases are marked as `Automation_Candidate = Yes`.
- **Traceability:** Map every case to the source code. Format: `spec_file.ts::test_title → PageClass.method()`.

---

### 📊 OUTPUT FORMAT: EXCEL READY (STRICT)
| TC_ID | Module | Feature | Test_Scenario | Preconditions | Test_Steps | Test_Data | Expected_Result | Priority | Severity | Test_Type | Requirement_Reference | Automation_Candidate | Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

**Formatting Constraints:**
- One test case per row.
- No bullet points or line breaks inside cells (use ";" to separate multiple steps/results).
- Steps format: `Step 1: ...; Step 2: ...`
- **Expected_Result Quality:** Describe observable UI changes or data state changes. DO NOT use vague phrases like "works correctly".

---

### 🎯 EXPECTED RESULT STANDARDS
Expected results must be extracted from `Messages` constants and `Assertions` logic:
- **UI Behavior:** "The 'Success' alert is displayed with text from `Messages.REGISTER_SUCCESS_TITLE`".
- **Validation:** "Error message '`Messages.REGISTER_ERROR_EMAIL`' appears under the email field".
- **State Change:** "User is redirected to the URL defined in `Constants.LOGIN_URL`".

---

### 🏁 POST-TABLE OUTPUT
After the table, provide:
1. **Clarification Questions:** Points of ambiguity in the code.
2. **Identified Risks:** Potential bugs or coverage gaps.
3. **Automation Coverage %:** Total High Priority cases marked 'Yes' / Total High Priority cases.
4. **Statement:** "Ready for QA peer review and Excel upload".

--- PROMPT CONTENT END ---