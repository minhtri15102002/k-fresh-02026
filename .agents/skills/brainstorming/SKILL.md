---
name: brainstorming
description: "Transforms raw ideas into structured, implementable designs through rigorous questioning, multi-approach exploration, and documented decision-making. Use when the user says ‘help me think through this’, ‘brainstorm an approach for X’, ‘what are the options for Y?’, or hands over a vague problem that needs framing before code."
risk: safe
source: community
date_added: "2026-02-27"
---

# Brainstorming Ideas Into Designs

## Purpose

Transform raw ideas into structured, implementable designs through rigorous questioning, multi-approach exploration, and documented decision-making.

## Operating Mode

Act as a senior architect/lead engineer. Never jump to implementation. Question first, design second, document always.

## The Process

### 1️⃣ Understand the Current Context (Mandatory First Step)
- Read all relevant project files before asking questions
- Build a mental model of existing architecture, patterns, and constraints
- Identify what must NOT change (hard constraints)

### 2️⃣ Understanding the Idea (One Question at a Time)
Ask only ONE question at a time. Wait for answer before proceeding.

Focus on:
- **What** is the core problem being solved?
- **Who** are the users/consumers?
- **What** are the success criteria?
- **What** are the boundaries? (What's in/out of scope?)

### 3️⃣ Non-Functional Requirements (Mandatory)
Always explore:
- Performance (latency, throughput, scale)
- Reliability (uptime, error tolerance)
- Security (auth, data sensitivity)
- Maintainability (team skills, complexity budget)

### 4️⃣ Understanding Lock (Hard Gate)
Do NOT proceed to design until you can answer:
- [ ] What problem are we solving?
- [ ] Who uses this and how?
- [ ] What does success look like?
- [ ] What are the hard constraints?

### 5️⃣ Explore Design Approaches
Present 2-3 distinct approaches. For each:
- Brief description
- Key tradeoffs
- When it's the right choice

### 6️⃣ Present the Design (Incrementally)
Structure:
1. Problem statement (1 sentence)
2. Chosen approach + rationale
3. High-level design (diagram if helpful)
4. Key interfaces/contracts
5. Data model
6. Error handling strategy
7. Testing approach
8. Risks and mitigations

### 7️⃣ Decision Log (Mandatory)
Document every major decision:
```
Decision: [What was decided]
Rationale: [Why this approach]
Alternatives considered: [What was rejected and why]
Constraints: [What forced this decision]
```

## Exit Criteria (Hard Stop Conditions)

Stop if:
- Requirements are still ambiguous after 3 clarification rounds
- Hard constraints make all approaches unacceptable
- Stakeholder alignment is needed before proceeding

## Key Principles (Non-Negotiable)

1. **No implementation before understanding** - Understanding locks are hard gates
2. **Always show tradeoffs** - No approach is perfect; document the costs
3. **Question assumptions** - Challenge requirements that seem arbitrary
4. **Document decisions** - Future engineers need to understand why, not just what

## When to Use

- Before starting any non-trivial feature
- When requirements are unclear or incomplete
- When multiple valid approaches exist
- When the team needs alignment before implementation
