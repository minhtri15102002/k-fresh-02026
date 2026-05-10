---
name: llm-evaluation
description: "Implements LLM-as-judge patterns, prompt A/B testing, and regression detection for AI outputs so prompt changes don’t silently degrade quality. Use when the user asks to ‘A/B these prompts’, ‘set up an LLM judge for our generations’, ‘catch regressions when we swap models’, or needs offline eval rigor before shipping prompt changes."
risk: safe
source: community
date_added: "2026-02-27"
---

# LLM Evaluation

Evaluate AI-generated responses (like generated test cases) for quality, correctness, and adherence to requirements.

## Use this skill when

- Evaluating AI-generated test code quality
- Setting up LLM-as-judge pipelines
- Checking prompt strategies for regressions
- A/B testing different generation approaches

## Automated Metrics Implementation

```typescript
// Example: Validating AI-generated tests
import { expect } from 'vitest';

export async function evaluateGeneratedTest(generatedTest: string, requirements: string) {
  const result = await llmJudge({
    prompt: `
      You are an expert QA engineer. Evaluate this generated Playwright test.
      Requirements: ${requirements}
      Code: ${generatedTest}
      
      Score from 1-5 on:
      - Execution stability (no brittle selectors)
      - Assertion quality (verifies behavior, not implementation)
      - Isolation (cleans up state)
      
      Return JSON: { "score": number, "reasoning": string }
    `
  });
  
  return result;
}
```

## LLM-as-Judge Patterns

### Pairwise Comparison
Compare two different generated tests to find the better one:
```text
Given Requirement X.
Test A: [Code A]
Test B: [Code B]
Which test is better and why? Ignore formatting differences. Focus on test stability and coverage of edge cases.
```

### Reference-based Scoring
Compare the generated test against an ideal "reference" test.

## A/B Testing Prompts
1. Generate 50 tests with Prompt A
2. Generate 50 tests with Prompt B
3. Run both sets through the test runner
4. Compare Pass/Fail rates and execution times

## Human Evaluation
Always spot-check LLM evaluations. If the LLM-judge gives a test 5/5 but the test is flaky in CI, adjust the judge's prompt.
