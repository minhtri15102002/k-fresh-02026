# Phase 6 — AI-Assisted QA & Capstone

> Modern QA is AI-augmented. After this phase you author tests *with* an AI agent rather than from scratch — and you know how to evaluate the agent itself.

## Modules

30. [Prompt engineering for QA](./30-prompt-engineering-for-qa.md)
31. [Using the prompt library](./31-using-the-prompt-library.md)
32. [MCP & browser agents](./32-mcp-and-browser-agents.md)
33. [Capstone & career paths](./33-capstone-and-career-paths.md)

## Phase outcomes

You can:

- Write effective prompts (system, user, few-shot) and explain why each part exists.
- Use `prompts/core/pom-generator.md`, `playwright-test-generator-prompt.md`, `manual-test-case-generator.md` to scaffold a feature end-to-end.
- Drive a real browser session via Playwright MCP tools and have the agent generate code from observed reality.
- Evaluate an LLM-generated test suite for correctness, brittleness, and false confidence.
- Ship a capstone that demonstrates every skill from Phases 0–6.

## Capstone (Module 33)

Pick a real flow on the SUT not yet covered (e.g. wishlist sharing, coupon stacking) and deliver:

1. Manual test cases (Excel-ready, Phase 0)
2. Page objects + locators (Phase 3 rules)
3. UI + API tests with full tagging (Phases 2–4)
4. CI workflow change if needed (Phase 5)
5. Dashboard panel surfacing the new feature's metrics (Phase 5)
6. AI-assisted PR description and self-review (Phase 6)

Trainer reviews like a real PR.

## Career paths after graduation

- **SDET / Test Automation Engineer** — deep code skills, framework ownership, CI/CD.
- **Quality Engineer (QE)** — broader: code + product + process; pairs with PM and Eng.
- **Performance / Security Engineer** — specialist branch from Phase 4.
- **QA Lead / Manager** — people + metrics + strategy (Phase 5 dashboards become daily tools).
- **Quality Architect** — owns testing strategy across multiple teams; sets standards like the ones in `prompts/core/`.

---

**Prev:** [Phase 5 — Quality at Scale](../phase-5-scale/README.md) · **Up:** [Curriculum overview](../README.md)
