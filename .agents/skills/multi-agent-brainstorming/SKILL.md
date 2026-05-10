---
name: multi-agent-brainstorming
description: "Transforms a single-agent design into a robust, review-validated design by simulating a formal peer-review process across multiple constrained agents (architect, security, perf, reviewer). Use when the user asks to ‘peer-review this design’, ‘stress-test this proposal’, ‘run a multi-agent design review’, or wants higher confidence than a single brainstorming pass would give."
risk: safe
source: community
date_added: "2026-02-27"
---

# Multi-Agent Brainstorming (Structured Design Review)

## Purpose

Transform a single-agent design into a **robust, review-validated design** by simulating a formal peer-review process using multiple constrained agents.

This skill exists to:
- surface hidden assumptions
- identify failure modes early
- validate non-functional constraints
- stress-test designs before implementation
- prevent idea swarm chaos

This is **not parallel brainstorming**. It is **sequential design review with enforced roles**.

## Operating Model

- One agent designs.
- Other agents review.
- No agent may exceed its mandate.
- Creativity is centralized; critique is distributed.
- Decisions are explicit and logged.

The process is **gated** and **terminates by design**.

## Agent Roles (Non-Negotiable)

Each agent operates under a **hard scope limit**.

### 1️⃣ Primary Designer (Lead Agent)
- **Mandate**: Produce the design
- **Constraint**: Must respond to every critique before proceeding
- **Cannot**: Dismiss critiques without documented rationale

### 2️⃣ Skeptic / Challenger Agent
- **Mandate**: Find weaknesses and hidden assumptions
- **Constraint**: Must propose alternatives, not just criticize
- **Cannot**: Approve designs or suggest features

### 3️⃣ Constraint Guardian Agent
- **Mandate**: Enforce non-functional requirements (performance, security, cost)
- **Constraint**: Must cite explicit requirement for every objection
- **Cannot**: Comment on functional design decisions

### 4️⃣ User Advocate Agent
- **Mandate**: Represent end-user needs and usability
- **Constraint**: Must frame feedback in user impact terms
- **Cannot**: Comment on technical implementation

### 5️⃣ Integrator / Arbiter Agent
- **Mandate**: Resolve conflicts and produce final decision log
- **Constraint**: Must be neutral; cannot prefer one design over another without evidence
- **Cannot**: Introduce new design elements

## The Process

### Phase 1 — Single-Agent Design

Primary Designer produces:
1. Problem statement
2. Proposed solution
3. Key assumptions
4. Known tradeoffs

### Phase 2 — Structured Review Loop

Each reviewer agent responds **in sequence**:

1. Skeptic reviews → Primary Designer responds
2. Constraint Guardian reviews → Primary Designer responds  
3. User Advocate reviews → Primary Designer responds

One full loop = one review round.

Max rounds: **2** (unless human extends)

### Phase 3 — Integration & Arbitration

Integrator Agent:
1. Summarizes all critiques and responses
2. Identifies unresolved conflicts
3. Produces Decision Log
4. Declares design approved OR escalates to human

## Decision Log (Mandatory Artifact)

```
Decision: [What was decided]
Rationale: [Why this approach was chosen]
Alternatives Rejected: [What was rejected and why]
Open Questions: [What remains unresolved]
Reviewer Consensus: [agreed / disputed / escalated]
```

## Exit Criteria (Hard Stop)

Design proceeds when:
- [ ] All reviewer critiques addressed
- [ ] Decision log complete
- [ ] No unresolved category-blocking issues
- [ ] Integrator declares approval

Design escalates to human when:
- Rounds exhausted with blockers remaining
- Agents cannot reach consensus on critical constraint
- New requirements surface mid-review

## Key Principles

1. **Roles are strict** - Agents cannot freelance outside their mandate
2. **Every critique needs a response** - No silent dismissals
3. **Decisions are logged** - Future engineers need audit trail
4. **Process terminates** - Maximum rounds prevent infinite loops

## When to Use

- High-stakes architectural decisions
- Features affecting multiple systems
- Designs with security or compliance implications
- When "good enough" designs keep getting implemented without real review
