# Module 40 — From Engineer to AI Quality Architect

> Phase 8 · Effort: 6h · Prerequisites: Phase 7 complete (especially Module 39's four-trait practice)

> Owns the **RFC template** that Modules 41–44 each fill in. By the end of the phase, every module has contributed one section to your graduation RFC.

## Reference card

- **Architect ≠ senior engineer with a title.** It's a *practice*: standards craft, RFC discipline, decision artifacts at platform scope, calibrated influence across teams.
- **Phase 7 produced ADR-AIs** (one decision); Phase 8 produces **RFCs** (one platform's worth of decisions, sequenced and ratified).
- **Three architecture artifacts** define your portfolio: Reference Architecture diagram, RFC, Decision Log.
- **You ratify, you don't dictate.** The architect's superpower is producing artifacts so well-reasoned that teams *want* to adopt them.
- **Module deliverable:** RFC template + 1 worked architecture diagram. Both seed Modules 41–44.

## Learning objectives

After this module you can:

- Distinguish **ADR-AI** (single decision) from **RFC** (system of decisions) and choose the right artifact per scope.
- Author an RFC that earns sign-off from senior reviewers on the **four traits** (systems, AI, architecture, business).
- Draw a **C4-lite reference architecture diagram** that survives a 30-minute critique.
- Run a **standards-craft loop** — propose → review → ratify → measure adoption.

## Why it matters

> *The future belongs to engineers who can connect AI + Cloud + Automation + Infrastructure + Product Thinking.*
> *— Architect Perspective, 2026 Enterprise Guide*

A leader sets direction. An architect produces the artifacts that *encode* that direction so that other engineers can execute without re-deciding everything. The leverage of one good RFC is 10× a leader's most persuasive meeting — meetings end, RFCs persist, get cited, and become the thing new hires are onboarded against.

## Concepts

### ADR-AI vs RFC vs Decision Log

| Artifact | Scope | Length | Cadence | Audience |
|---|---|---|---|---|
| **ADR-AI** (Phase 7 Module 39) | one decision | 1 page | per decision | the team |
| **RFC** (this module) | one system / platform | 5–15 pages | per quarter or per platform component | multiple teams + leadership |
| **Decision Log** | rolling list of every ADR-AI + RFC outcome | 1 line each | continuously updated | everyone, forever |

**Rule:** if 2+ teams need to agree, it's an RFC. If your team alone decides, it's an ADR-AI.

### The Phase 8 RFC template (this is the graduation artifact's skeleton)

Modules 41–44 each fill one of the numbered sections below. Module 40 owns the template itself.

```markdown
# RFC <NN> — <Quality Platform Name>

## 0. Status
- Owner: <name> (single, accountable — not RACI)
- Reviewers: <names + roles>
- Status: draft / in review / ratified / superseded
- Date / version:

## 1. Context (1 page)
- Why now; what triggered this
- Scope boundary (what's in / out)
- Non-goals

## 2. Reference Architecture          ← Module 41
- C4-lite diagram (System / Container / Component)
- 7-component platform map
- Data + control flow
- Self-service contract (1 page)

## 3. Test & Evaluation Patterns      ← Module 42
- Data-quality testing
- Bias / fairness testing
- Explainability testing
- Observability testing
- Tag conventions + spec templates

## 4. Compliance-as-Code              ← Module 43
- Regulation → clause → CI-gate mapping
- Audit-trail design
- Evidence retention

## 5. Adoption & Transformation       ← Module 44
- Adoption-ladder stage per team
- Change-network design
- Executive cockpit metrics
- Stop-loss criteria

## 6. Four-Trait Justification
- Systems thinking: 2nd-/3rd-order effects
- AI awareness: stage on ladder + eval evidence
- Architecture: boundaries, contracts, blast radius, rollback
- Business: metric to move + ROI

## 7. Risks & Mitigations (top 7)

## 8. Alternatives Considered (and rejected)

## 9. Open Questions / Decision Log links

## 10. Adoption Commitment
- Pilot team(s):
- Success criteria + review date:
```

Save the template as `training/sandbox/<your-name>/phase-8/rfc-template.md`. You will append to it across Modules 41–44.

### C4-lite reference diagrams

You don't need full C4 fluency. The architect's minimum:

```
System Context  →  who uses it, what depends on it
Container       →  the major runtime boxes (CI, dashboard, eval runner, etc.)
Component       →  inside one container, how it's wired
```

For Phase 8, **Container-level is enough**. Show 5–9 boxes, label every arrow, name every interface.

> A diagram with unlabeled arrows is a diagram an architect didn't finish.

### The standards-craft loop

```
Propose       — RFC draft + architecture diagram + worked example
Review        — at least 2 senior reviewers, one outside your team
Ratify        — explicit sign-off, dated, in the RFC
Measure       — adoption metric + adoption review at 30/60/90 days
Iterate       — supersede or extend; never silently mutate a ratified RFC
```

Standards that aren't measured aren't adopted. Always pick an adoption metric *before* the RFC ratifies.

### Influence without authority

You typically can't *force* adoption. You can:

| Lever | Example |
|---|---|
| **Make it the path of least resistance** | Ship a scaffolder/Skill (`.agents/skills/<name>/`) that emits the right pattern by default |
| **Make non-compliance visible** | Add a check to `.agents/skills/skill-validator/scripts/validate-skill.ts`; surface on the dashboard |
| **Pair on the first adoption** | Sit with the pilot team for 2 days |
| **Write the worked example** | Real code beats abstract guidance every time |
| **Recruit a co-signer** | RFC with a respected engineer's name carries 3× the weight |

### Common architect failure modes

| Failure | Symptom | Counter |
|---|---|---|
| **Ivory tower** | RFCs cited but never adopted | Pair on first adoption; track adoption metric |
| **Bike-shedding** | Reviewers argue about formatting | Time-box reviews; ratify on substance |
| **Boil-the-ocean** | RFC tries to solve everything | Hard scope-boundary in §1 |
| **No teeth** | Standard exists, violations ignored | Compliance-as-Code (Module 43) |
| **Drift after ratification** | Code stops matching the RFC | Quarterly "RFC vs reality" audit |
| **Solo authorship** | One brain, one perspective | Always ≥1 senior reviewer outside your team |

## Hands-on lab

### Org-mandate mode

1. **Initialize the RFC template (1h).** Copy the template above into your org's RFC system. Pick a real platform problem your team owns. Fill §0 (status), §1 (context), §6 (four-trait justification — first pass).
2. **Draw a Container-level diagram (2h).** 5–9 boxes, every arrow labeled, every interface named. Tools: Mermaid, Excalidraw, plain ASCII — any. Save next to the RFC.
3. **First reviewer pass (1h).** Send to one senior reviewer outside your team. Capture critiques in §9.
4. **Pick an adoption metric (30 min).** Add to §10. Define how you'll measure it in 30 days.

### Solo prototype mode

1. **Initialize the RFC template (1h).** Save as `training/sandbox/<your-name>/phase-8/rfc-template.md`. Pick a *repo-scope* platform problem — e.g. "an AI Quality Platform for this Playwright suite that lets a new feature ship with eval+governance+monitoring in one day."
2. **Draw the diagram (2h).** Mermaid block inside the RFC is fine. Label every arrow.
3. **Self-review with the four-trait lens (1h).** Be honest; document weak spots in §9.
4. **Pick an adoption metric (30 min).** Even in solo mode — e.g. "time from `git clone` to a passing eval-gated CI run on a new feature."

### Both modes

5. **Standards-craft 30-day plan (1h).** In §10, name 3 actions: who pairs on first adoption, what dashboard surface shows adoption, what kills the RFC if it doesn't land.

## Self-check

- [ ] Can you explain when to write an ADR-AI vs an RFC in one sentence?
- [ ] Does your diagram have **zero unlabeled arrows**?
- [ ] Did your RFC's §6 (four-trait justification) survive a friendly reviewer's pushback?
- [ ] Do you have an adoption metric and a 30-day review on the calendar?
- [ ] Can you name the failure mode you're most likely to hit, and your specific counter?

## Further reading

- *Software Architecture: The Hard Parts* — Ford, Richards, Sadalage, Dehghani
- *Fundamentals of Software Architecture* — Richards & Ford
- C4 model (c4model.com) — read just the Context + Container pages
- *The Architecture of Open Source Applications* (free online) — read 2 chapters of systems you use
- This repo: `prompts/core/pom-generator.md` (a ratified standards artifact in the wild)

---

**Next:** [41 — Designing & Building an AI Quality Platform](./41-designing-and-building-an-ai-quality-platform.md) · **Up:** [Phase 8 README](./README.md)
