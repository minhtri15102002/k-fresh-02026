# Module 30 — Prompt Engineering for QA

> Phase 6 · Effort: 4h · Prerequisites: Phase 5

## Learning objectives

After this module you can:

- Distinguish **system**, **user**, and **few-shot** prompts.
- Write a prompt that consistently produces compliant POMs / specs / TCs.
- Apply this repo's "rule + forbidden table + example" prompt structure.
- Recognize when an AI agent is hallucinating and stop it.

## Why it matters

LLMs are powerful but unbounded. Without guardrails they invent locators, ignore conventions, and produce code that looks right but fails review. Prompt engineering is how you turn an LLM into a reliable QA pair-programmer.

## Concepts

### Prompt anatomy (this repo's pattern)

```markdown
# [SYSTEM ROLE & OBJECTIVE]
You are a Senior Automation QA Architect…

# Hard Rules
1. Never generate code from a written scenario alone — exercise it via MCP first.
2. Never use `page.waitForTimeout`.
3. …

# Conventions (the table)
| Concern | Rule |
|---|---|
| Locator strategy | role → label → testid → text → CSS → XPath |
| Helpers | All locator interactions go through `commonPage.<verb>(...)` |
| Assertions | `assertHelper.*` for DOM, `Assertions.*` for in-memory |

# Forbidden actions (the canonical table)
| Forbidden | Use instead |
|---|---|
| `await loc.click()` | `await commonPage.click(loc)` |
| …

# Reference Snippets (few-shot)
[locator example]
[page example]
[spec example]

# Workflow
1. Explore the SUT with MCP
2. Generate locators → models → data → page → spec
3. Verify (run, fix real failures only)

# Output Rules
- Output 5 code blocks in this order
- No commentary outside code blocks
```

### Why this structure works

- **System role** anchors tone and authority.
- **Hard rules** are non-negotiable (red lines).
- **Conventions table** sets style.
- **Forbidden table** prevents the most common drift (this is unique to QA work).
- **Reference snippets** give the LLM "this is what good output looks like".
- **Workflow** sequences thinking; LLMs follow ordered steps better than free-form goals.
- **Output rules** make the response easy to apply.

### Tour of `prompts/` in this repo

```
prompts/
├── core/
│   ├── pom-orchestrator.md            ← the umbrella; runs the workflow
│   ├── playwright-test-generator-prompt.md
│   ├── pom-generator.md               ← canonical commonPage + assertion rules
│   ├── test-generator.md              ← spec-from-manual-TC
│   ├── manual-test-case-generator.md  ← Excel-ready TCs
│   ├── locators-naming.md             ← naming cheat sheet
│   ├── test-tags.md                   ← tag taxonomy
│   ├── defect-labels.md               ← GH Issue labels
│   ├── failure-analyzer.md
│   └── test-data-generator.md
├── advanced/
│   ├── performance-analyzer.md
│   ├── release-readiness.md
│   ├── risk-analysis.md
│   ├── selector-healing.md
│   ├── visual-ai.md
│   └── visual-regression-reviewer.md
└── devops/
    ├── ci-optimizer.md
    ├── docker-runner.md
    └── parallel-sharding.md
```

Cross-references between prompts use canonical sections (e.g. "DIRECT-LOCATOR ACTIONS — FORBIDDEN" lives only in `pom-generator.md`; everything else links to it).

### Anti-hallucination techniques

| Hallucination | Defense |
|---|---|
| Invented locator | Hard rule: "exercise via MCP first; never derive from text" |
| Forbidden API call | Forbidden table with the exact replacement |
| Made-up helper method | Hard rule: "if helper missing, emit `## Missing Helper`" |
| Wrong import path | Reference snippet shows the correct import |
| Mixing assertion utilities | Canonical assertion-routing table |
| Skipping conventions | Output rules require the snippets to literally match |

### Few-shot vs zero-shot

- **Zero-shot** ("write a Playwright test for login") → unreliable.
- **Few-shot** (include 2-3 reference snippets) → reliably matches your style.

This repo's prompts are heavily few-shot.

### Prompts vs Skills

- **Prompts** (`prompts/`) are markdown documents loaded at runtime.
- **Skills** (`.agents/skills/<name>/SKILL.md`) follow the Agent Skills spec — autonomous, loaded by the agent system, often cross-link prompts.

This repo has both. Use Skills when the agent needs to autonomously decide which capability to invoke; use Prompts when a human is steering the workflow.

### Iterating a prompt

```
1. Run it on a test case
2. Note every place the output drifted from your expectation
3. Add a Hard Rule or Forbidden row that prevents that drift
4. Re-run
5. Repeat until output is reliably correct
```

Keep prompt-change PRs small — easier to revert when you over-constrain.

## Hands-on lab

1. Read `prompts/core/pom-generator.md` and `prompts/core/playwright-test-generator-prompt.md` end-to-end.
2. List every "rule" — Hard Rule, Convention, Forbidden — and trace each to a real bug it would catch.
3. Pick one rule that's missing. Propose an addition (open a PR to a prompt file).
4. Write a tiny new prompt: `prompts/core/wishlist-test-generator.md` that produces a test for a wishlist feature, modeled after the existing prompts.

## Self-check

- [ ] Why does this repo's `pom-generator.md` include a forbidden table instead of just "use commonPage"?
- [ ] When does few-shot beat zero-shot?
- [ ] What's the difference between a Prompt and an Agent Skill?
- [ ] You see an LLM-generated test that uses `await page.waitForTimeout(2000)`. What rule failed and how do you fix the prompt?

## Further reading

- Anthropic — *Prompt Engineering Guide*
- This repo's `prompts/` directory
- Agent Skills spec — `.agents/skills/write-agent-skill/SKILL.md`

---

**Next:** [31 — Using the prompt library](./31-using-the-prompt-library.md) · **Up:** [Phase 6 README](./README.md)
