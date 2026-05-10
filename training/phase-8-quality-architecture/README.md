# Phase 8 — AI Quality Architecture & Platform Engineering

> Phase 7 made you an **AI Quality Leader** — judgment, governance literacy, ROI fluency.
> Phase 8 makes you an **AI Quality Architect** — you design the platform, write the RFCs, set the standards, and run the multi-team transformations leaders operate.
>
> Engineering lens, not management deck. Every output is code, an RFC, a workflow, or a measurable platform contract.

## Reference card (5-bullet brief)

- **Audience:** Quality Architect / Principal SDET / Head of AI Quality at orgs with multi-team scope (or within ~12 months of one). Use as a forward-looking reference if you're earlier in your arc.
- **Outcome:** You can design and ship an AI Quality Platform that lets a feature team add an AI feature with eval + governance + monitoring **in under one day** without re-deciding any standard.
- **Method:** RFC-driven architecture practice + 4 deep-dive AI testing types + Compliance-as-Code + multi-team transformation execution.
- **Graduation:** A single **Quality Platform RFC** integrating contributions from Modules 40–44, plus an adoption commitment from one real team (or peer-reviewed simulated adoption in solo mode).
- **Distinct from Phase 7:** Phase 7 = thinking like a leader. Phase 8 = building the system the leader operates.

## Precondition

Before starting Phase 8, you should have either:

1. A **multi-team scope** (you influence ≥ 2 teams, or own a horizontal capability), **or**
2. A **near-term path** to that scope (~12 months), **or**
3. An explicit intent to use Phase 8 as a **forward-looking reference** (in which case skip the Org-mandate labs and use Solo prototype mode only).

If none of these is true, finish Phase 7 first and revisit.

## Modules

40. [From Engineer to AI Quality Architect](./40-from-engineer-to-ai-quality-architect.md) — owns the **RFC template**
41. [Designing & Building an AI Quality Platform](./41-designing-and-building-an-ai-quality-platform.md) — owns the **reference architecture**
42. [Deep-Dive AI Testing — Data, Bias, Explainability, Observability](./42-deep-dive-ai-testing.md) — owns the **4 spec patterns**
43. [Compliance-as-Code (EU AI Act / NIST AI RMF / ISO 42001)](./43-compliance-as-code.md) — owns the **CI gate workflow**
44. [Running an Enterprise AI Transformation](./44-running-an-enterprise-ai-transformation.md) — owns the **transformation playbook + graduation**

Each module contributes one numbered section to the graduation RFC (see Module 40).

## Two-mode lab convention

Every Phase 8 lab declares both modes:

| Mode | Use when | Output lives in |
|---|---|---|
| **Org-mandate mode** | You have authority to ship the artifact for real | Your org's repo / docs / RFC system |
| **Solo prototype mode** | You're learning ahead of the role | `training/sandbox/<your-name>/phase-8/` against this repo as the org stand-in |

Both modes produce the same artifact shape — only the audience differs.

## Phase outcomes

You can:

- Author an architecture RFC that survives a senior reviewer's scrutiny on systems, AI, architecture, and business dimensions.
- Define and ship a **7-component AI Quality Platform** with a one-page self-service contract.
- Author and run **bias, explainability, data-quality, and observability** test specs for AI features — going below Module 36's eval surface.
- Translate one **EU AI Act / NIST RMF / ISO 42001** clause into an executable CI gate plus an audit-ready evidence trail.
- Plan and execute a **multi-team transformation** along the Module 38 adoption ladder, including change-network design, executive cockpit, and stop-loss criteria.

## Phase self-check

- [ ] You can name your platform's 7 components from memory and draw the data flow on a whiteboard.
- [ ] You have written one ADR-AI **and** one full RFC in the last quarter.
- [ ] You can show a CI workflow that fails when a compliance clause is violated, and explain which clause and why.
- [ ] You have at least one team that has adopted (or formally committed to adopting) a Phase 8 artifact.
- [ ] You can explain — to a CFO — why this platform reduces enterprise risk, in dollars.

---

**Prev:** [Phase 7 — AI-Era QA Leadership](../phase-7-ai-era-leadership/README.md) · **Up:** [Curriculum overview](../README.md)
