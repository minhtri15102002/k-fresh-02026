# Module 31 — Using the Prompt Library

> Phase 6 · Effort: 4h · Prerequisites: Module 30

## Learning objectives

After this module you can:

- Invoke the `pom-orchestrator` workflow to generate a complete feature end-to-end.
- Use `manual-test-case-generator.md` to convert requirements into Excel-ready TCs.
- Use `test-generator.md` to convert manual TCs into Playwright specs.
- Use `failure-analyzer.md` to triage CI failures.
- Combine multiple prompts via the orchestrator pattern.

## Why it matters

Prompts are useless if you don't use them. The library in `prompts/` represents thousands of hours of distilled review feedback — pulling from it is faster and more compliant than starting from scratch.

## Concepts

### The orchestrator pattern (`prompts/core/pom-orchestrator.md`)

```
You: "Act as the Workflow Orchestrator. Read @prompts/core/pom-orchestrator.md,
     @prompts/core/playwright-test-generator-prompt.md, @prompts/core/pom-generator.md,
     @documents/OOP_POM_Documentation.md, and @<your-manual-TC>.md.
     Execute the 3 Phases."

Agent:
  Phase 1: Readiness check → asks for missing pieces (DOM context, data, expected results)
  Phase 2: Code generation → locators / models / data / page / spec, applying:
              - DIRECT-LOCATOR ACTIONS — FORBIDDEN
              - ASSERTION ROUTING — FORBIDDEN
  Phase 3: Verification → runs the test, self-heals real failures, stops if helpers missing
```

### Single-purpose prompts

| Prompt | Input | Output |
|---|---|---|
| `manual-test-case-generator.md` | Feature spec / requirements | Excel-ready TCs (one cell per TC, multi-line steps) |
| `test-generator.md` | Manual TC | Playwright spec (no page changes) |
| `pom-generator.md` | Feature URL + behavior | Locator class + Page class |
| `playwright-test-generator-prompt.md` | Feature URL + flow | Locators + Models + Data + Page + Spec (full stack) |
| `test-data-generator.md` | Domain entity | Faker-driven factory + deterministic fixtures |
| `failure-analyzer.md` | Trace zip / log | Root cause + recommended fix |
| `release-readiness.md` | Run summary + defect list | Go/no-go memo |
| `risk-analysis.md` | Feature description | Risk matrix + test priority recommendation |
| `selector-healing.md` | Failing locator + new DOM | Replacement locator |
| `visual-regression-reviewer.md` | Diff images | Real regression vs noise verdict |

### Recipe: shipping a new feature

```
1. PM gives you a Confluence link.
2. Run manual-test-case-generator.md on the link → produces TCs.
3. Review TCs with PM; commit to documents/manual-testcases/.
4. Run pom-orchestrator.md with the TCs as input → produces full stack of code.
5. Review locator strategy, fix any "Missing Helper" notes from the agent.
6. Run npx playwright test … to verify.
7. Open PR — code reviewer applies the same prompt rules as their checklist.
```

### Recipe: triage a CI failure

```
1. Download trace.zip from the failed CI run.
2. Run failure-analyzer.md with the trace.
3. Agent identifies: timing, isolation, selector, env, etc.
4. If timing → fix waiter; if locator → run selector-healing.md;
   if env → file infra ticket; if real bug → file bug + add @regression test.
```

### Recipe: a sprint's worth of TCs in one afternoon

```
For each of N stories:
  manual-test-case-generator.md on story description
  → 5–10 TCs
  → review/edit
  → commit
```

Manual conversion that used to take 2 days now takes 2 hours.

### When prompts fail

Common reasons:

- **Stale rules** — prompt says "use `assertHelper.assertElementVisible`" but you renamed the method. Fix the prompt.
- **Underspecified input** — prompt requires "DOM context" but you only gave it text. Re-prompt with screenshots/MCP exploration.
- **Hallucinated helpers** — agent invents methods that don't exist. Reinforce the "Missing Helper" rule.
- **Override fatigue** — too many rules; agent loses track. Split prompts.

### Versioning prompts

Prompts evolve like code. Track them in git:

```bash
git log -p prompts/core/pom-generator.md
```

When you add a rule that changes output, mention it in the PR title:

```
docs(prompts): forbid raw expect() in feature pages
```

## Hands-on lab

1. Pick a feature in this repo not yet automated (e.g. wishlist sharing).
2. **Step A** — generate manual TCs:
   ```
   "Read @prompts/core/manual-test-case-generator.md and @<feature-spec.md>.
    Generate 5 manual TCs."
   ```
3. **Step B** — generate the full stack:
   ```
   "Act as the Workflow Orchestrator. Read @prompts/core/pom-orchestrator.md,
    @prompts/core/playwright-test-generator-prompt.md, @prompts/core/pom-generator.md,
    and the TCs from step A. Execute the 3 Phases."
   ```
4. Review the output carefully. Confirm zero `commonPage` violations and zero raw `expect()` calls.
5. Open a PR with the result. Reviewer applies the prompt rules as a checklist.

## Self-check

- [ ] What does Phase 1 of the orchestrator do?
- [ ] You want to convert one manual TC into a spec without touching pages — which prompt?
- [ ] Your agent generated `await this.btn.click()`. What rule failed?
- [ ] When would you split one prompt into two?

## Further reading

- This repo's `prompts/` directory (read every file)
- Anthropic — Prompt engineering best practices

---

**Prev:** [30 — Prompt engineering for QA](./30-prompt-engineering-for-qa.md) · **Next:** [32 — MCP & browser agents](./32-mcp-and-browser-agents.md)
