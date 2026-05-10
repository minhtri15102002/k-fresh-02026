---
name: write-agent-skill
description: Drafts Agent Skills adhering to the official Google Antigravity folder architecture and Progressive Disclosure formats. Use when creating or refactoring skills.
---

# Write Agent Skill

This skill enforces the official Google Antigravity standards for creating Agent Skills, ensuring the skills are highly discoverable and strictly formatted.

## When to use this skill

- You are asked to create a new agent skill.
- You are asked to refactor an existing agent skill.

## How to use it

### Step 1: Directory Structure

Create the skill inside `.agents/skills/<skill-folder>/`.
You MUST provide a `SKILL.md` inside this folder.
You may optionally use these subdirectories:

- `scripts/`: Helper scripts (Agent should execute these with `--help` instead of reading their source).
- `examples/`: Reference implementations.
- `resources/`: Templates and other assets.

### Step 2: SKILL.md Frontmatter Header

You MUST include a YAML block at the absolute top of `SKILL.md`:

```yaml
---
name: <unique-identifier>
description: <Write in the third-person. Be highly specific about WHAT it does and WHEN to use it. Examples: "Helps with...", "Reviews code changes...">
---
```

### Step 3: Progressive Disclosure Design

Design the body of `SKILL.md` to follow Progressive Disclosure. The AI reads this file to learn how to do a task.
Use clear headers:

1. `# <Skill Name>`
2. `## When to use this skill` (Keywords that help the agent contextually match).
3. `## How to use it` (Step-by-step guidance, decision trees, methodologies).
4. `## Best Practices` (Things the agent should strictly avoid or do).

## Best Practices

- **Keep skills focused:** Ensure the skill does exactly one thing well.
- **Include Decision Trees:** For complex implementations, add a section to help the agent decide which approach to take based on the incoming situation.
- **Third-Person Description:** The YAML definition must sound like a third-party explanation of a tool.
