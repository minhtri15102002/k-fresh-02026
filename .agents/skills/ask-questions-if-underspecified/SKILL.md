---
name: ask-questions-if-underspecified
description: "Surfaces and asks the minimum set of clarifying questions before writing code when requirements are ambiguous, conflicting, or missing critical detail. Use when the user’s request has serious doubts about scope, inputs, edge cases, or acceptance criteria — and guessing would be more expensive than a one-round clarification."
risk: unknown
source: community
---

# Ask Questions If Underspecified

## When to Use
Use this skill when a request has multiple plausible interpretations or key details (objective, scope, constraints, environment, or safety) are unclear.

## When NOT to Use
Do not use this skill when the request is already clear, or when a quick, low-risk discovery read can answer the missing details.

## Goal

Ask the minimum set of clarifying questions needed to avoid wrong work; do not start implementing until the must-have questions are answered.

## Workflow

### 1) Decide whether the request is underspecified

Treat a request as underspecified if after exploring how to perform the work, some or all of the following are not clear:
- Define the objective (what should change vs stay the same)
- Define "done" (acceptance criteria, examples, edge cases)
- Define scope (which files/components/users are in/out)
- Define constraints (compatibility, performance, style, deps, time)
- Identify environment (language/runtime versions, OS, build/test runner)
- Clarify safety/reversibility (data migration, rollout/rollback, risk)

If multiple plausible interpretations exist, assume it is underspecified.

### 2) Ask must-have questions first (keep it small)

Ask 1-5 questions in the first pass. Prefer questions that eliminate whole branches of work.

Make questions easy to answer:
- Optimize for scannability (short, numbered questions)
- Offer multiple-choice options when possible
- Suggest reasonable defaults (bold the recommended choice)
- Include a fast-path: reply `defaults` to accept all recommended choices
- Structure options so the user can respond compactly (e.g., `1b 2a 3c`)

### 3) Pause before acting

Until must-have answers arrive:
- Do NOT run commands, edit files, or produce a detailed plan that depends on unknowns
- DO perform a clearly labeled, low-risk discovery step only if it does not commit you to a direction

If the user asks you to proceed without answers:
- State your assumptions as a short numbered list
- Ask for confirmation; proceed only after they confirm or correct them

### 4) Confirm interpretation, then proceed

Once you have answers, restate the requirements in 1-3 sentences (including key constraints and what success looks like), then start work.

## Question Template

```
Before I start, I need to clarify a few things:

1) Scope?
   a) Minimal change — only touch what's necessary (default)
   b) Refactor while touching the area
   c) Not sure - use default

2) Compatibility target?
   a) Current project defaults (default)
   b) Also support: <specify>
   c) Not sure - use default

Reply with: `defaults` (or `1a 2a`)
```

## Anti-patterns

- Don't ask questions you can answer with a quick, low-risk discovery read (e.g., configs, existing patterns, docs).
- Don't ask open-ended questions if a tight multiple-choice would eliminate ambiguity faster.
