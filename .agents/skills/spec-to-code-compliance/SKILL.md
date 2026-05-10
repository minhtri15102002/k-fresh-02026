---
name: spec-to-code-compliance
description: "Validates that test implementations actually match the API or feature specifications, catching drift between documentation and code before it ships. Use when the user asks to ‘check tests against the spec’, ‘verify our suite covers the OpenAPI/PRD’, or worries that code and docs have diverged."
risk: safe
source: community
date_added: "2026-02-27"
---

# Spec-to-Code Compliance Checker

## When to Use

- Verifying API tests cover all documented requirements
- Checking if a feature implementation matches its Jira ticket / PR description
- Finding undocumented edge cases in legacy tests
- Validating that OpenAPI specs match the actual backend tests

## Workflow

### PHASE 0 — Documentation Discovery
Gather the source of truth:
- OpenAPI / Swagger specs
- PR descriptions
- Product requirements documents

### PHASE 1 — Alignment IR (Spec ↔ Code Comparison)
Compare the source of truth against the written tests:
```typescript
// Spec says: "Discount end_date must be after start_date"
// Test code:
it('should fail if end_date < start_date', async () => { ... }) // MATCH

// Spec says: "Maximum discount value is 99%"
// Test code: (MISSING - no test covers this) // DIVERGENCE
```

### PHASE 2 — Divergence Classification

Classify missing or conflicting logic:
- **CRITICAL**: Security constraint ignored (e.g., test creates discount without auth but expects 200)
- **HIGH**: Business rule not tested (e.g., max discount percentage edge case missing)
- **MEDIUM**: Response shape drift (e.g., API returns string for ID, test expects integer)
- **LOW**: Typos in assertion messages

### PHASE 3 — Final Audit-Grade Report
Generate a summary:
- Total requirements defined: X
- Requirements covered by tests: Y
- Requirements missing tests: Z
- Conflicting tests: W

List actionable fixes for the test suite.
