# Module 35 — Future-Ready Skills & Continuous Upskilling

> Phase 7 · Effort: 4h (+ ongoing) · Prerequisites: Module 34

> Answers curriculum questions **#2 — What skills should future testers learn?** and **#8 — How should teams upskill for the future?**

## Learning objectives

After this module you can:

- List the **five core skill pillars** every 2026+ tester needs and self-assess each one honestly.
- Build a **12-month personal upskilling roadmap** with quarterly milestones and shipped artifacts.
- Run a **team-level skill matrix** that exposes gaps before they hit production.
- Choose hands-on projects over passive courses, and explain why.

## Why it matters

> *Future testers must learn AI, cloud, APIs, and DevOps. Observability and security testing are becoming critical. Automation alone is no longer enough. Companies want engineers who understand complete systems.*
>
> *Hands-on learning is becoming essential. Teams need real cloud and AI project exposure. Practical automation experience matters more than theory. Continuous learning will define future engineers.*

The half-life of QA tooling skills is shrinking. A tester who only knows Selenium-style record-and-playback is already three skills behind. The good news: companies don't expect mastery in everything — they expect **systems literacy** across pillars and **deep practice** in two or three.

## Concepts

### The five skill pillars

| Pillar | Why it matters in 2026 | Repo touchpoints |
|---|---|---|
| **AI & LLM literacy** | Every product has an AI feature; every team has an AI tool. You must read prompts, evaluate outputs, design eval sets. | `prompts/`, `.agents/skills/`, Modules 30–33, 36 |
| **Cloud** (AWS / GCP / Azure) | Test environments live in the cloud; cost, scale, and security all start there. | `.github/workflows/` (cloud CI), Docker (`docker-compose.yml`) |
| **APIs & Contracts** | Most defects now live at integration boundaries — services, webhooks, third-party APIs. | `pages/api/`, `tests/api/`, Phase 4 |
| **DevOps & CI/CD** | The pipeline is your delivery vehicle. Owning it means owning the release. | `.github/workflows/playwright.yml`, Phase 5 |
| **Observability & Security** | You can't test what you can't see; you can't ship what you can't defend. | `prompts/core/failure-analyzer.md`, `prompts/advanced/release-readiness.md`, Module 23 |

> Automation framework skills are now the **floor**, not the ceiling. Treat Phases 2–5 as table stakes — Phase 7 is about what comes after.

### Self-assessment rubric (1–5 per pillar)

| Level | What it looks like |
|---|---|
| 1 — Aware | "I've heard of it." |
| 2 — Conversant | I can explain the concept; I've followed a tutorial. |
| 3 — Working | I've shipped a real artifact in production using it. |
| 4 — Proficient | I make architectural decisions with this skill; I review others' work. |
| 5 — Expert | I set standards; teams come to me; I publish/teach. |

**Rule of thumb:** target **L3 in every pillar**, **L4 in two**, **L5 in one**. That mix beats L5-in-one + L1-in-rest every time.

### The 12-month upskilling roadmap (template)

```
Q1  — Foundation gap-fill        | one shipped artifact
Q2  — Depth in chosen pillar     | one shipped artifact
Q3  — Breadth across pillars     | one shipped artifact
Q4  — Visibility / sharing       | one talk, blog, or OSS PR
```

#### Example (a tester at L3-L2-L3-L2-L1 today)

| Quarter | Focus | Concrete artifact (must ship, not "study") |
|---|---|---|
| Q1 | Cloud → L3 | Move local Docker run (`docker-compose.yml`) into a GitHub-hosted runner; document cost per CI minute |
| Q2 | AI → L4 | Author 2 new prompts in `prompts/core/` and 1 Agent Skill in `.agents/skills/`; add an LLM-eval rubric in `documents/` |
| Q3 | Observability → L3 | Add OpenTelemetry traces to one Playwright spec; surface a latency chart on the metrics dashboard |
| Q4 | Visibility | Internal lunch-and-learn: *"How AI changed our release confidence in 6 months"* + open-source PR to one tool we use |

### Team-level skill matrix

A simple Markdown table beats any HR tool. Example:

| Engineer  | AI/LLM | Cloud | APIs | DevOps | Obs+Sec |
|-----------|:------:|:-----:|:----:|:------:|:-------:|
| Alice     |   4    |   3   |  4   |   3    |    2    |
| Bob       |   2    |   4   |  3   |   4    |    3    |
| Carol     |   3    |   2   |  3   |   2    |    4    |
| **Team avg** | 3.0 | 3.0 | 3.3 | 3.0 | 3.0 |

Use it to:

- Identify **single points of failure** (only Carol can do Obs+Sec).
- Pair **shadow assignments** (Bob shadows Alice on prompts; Alice shadows Bob on cloud).
- Justify **hiring decisions** ("we need an L4 in DevOps").

### Why hands-on beats theory

Courses give you Level 2 (conversant). **Only shipping artifacts gives you Level 3+.** This is why every module in this curriculum ends in a hands-on lab and why the capstone (Module 33) is the graduation gate, not a written exam.

| Learning mode | Top level reachable | Calendar cost | Retention after 6 months |
|---|---|---|---|
| Reading / videos | L2 | 5–10h | ~20% |
| Tutorial-along | L2 | 10–20h | ~40% |
| Course w/ project | L3 (shallow) | 30–60h | ~60% |
| **Shipped artifact in real codebase** | **L3+ (deep)** | **20–80h** | **~85%** |
| Teaching others | L4–L5 | ongoing | ~95% |

This curriculum is calibrated to the bottom two rows. Your `training/sandbox/<your-name>/` work IS your portfolio.

### Continuous learning rhythms that actually stick

| Cadence | Practice | Repo example |
|---|---|---|
| Daily (15 min) | Read 1 PR diff outside your area | Browse `git log --all --oneline` for recent changes |
| Weekly (1h) | Pair on someone else's task | Review a PR end-to-end |
| Monthly (3h) | Ship a small tool / refactor / Skill | Add an Agent Skill under `.agents/skills/` |
| Quarterly (1d) | Public artifact (talk / blog / OSS) | Update `training/` with a new lab |
| Yearly (3d) | Conference + write-up | EuroSTAR / SeleniumConf debrief |

## Hands-on lab

1. **Self-assessment (30 min).** Score yourself 1–5 across the five pillars. Save as `training/sandbox/<your-name>/phase-7/skill-self-assessment.md`. Be brutal — overscoring is the #1 reason roadmaps fail.
2. **Personal roadmap (1h).** Using the quarterly template, write a 12-month plan with **one shippable artifact per quarter**. File: `training/sandbox/<your-name>/phase-7/upskilling-roadmap.md`. Each quarter row must answer: *what will I ship, where will it live in the repo (or beyond), who reviews it?*
3. **Team skill matrix (30 min).** Build a Markdown matrix for your real (or hypothetical) team and identify the top 3 SPOFs.
4. **Ship one tiny artifact NOW (1.5h).** Pick the smallest item from your roadmap and finish it this week. Examples that fit this repo:
   - Add a new check to `.agents/skills/skill-validator/scripts/validate-skill.ts`.
   - Add one new prompt under `prompts/core/`.
   - Add one new Agent Skill scaffold under `.agents/skills/`.
   - Add one new chart to `templates/qa-metrics-dashboard.html`.
5. **Calendar block (15 min).** Add the four cadences from the table above to your calendar with names. If it's not on the calendar, it won't happen.

## Self-check

- [ ] Can you name the five pillars without looking?
- [ ] Did you self-score honestly (no inflation)?
- [ ] Does your roadmap have one **shippable** artifact per quarter, not a list of courses?
- [ ] Have you identified at least one team SPOF and a pairing plan to fix it?
- [ ] Is "shadow / pair / teach" already on your calendar this month?

## Further reading

- *Staff Engineer* — Will Larson (especially the "skills, glue, and influence" framing)
- *The Manager's Path* — Camille Fournier (how IC depth turns into leadership reach)
- AWS Skill Builder / Google Cloud Skills Boost / Microsoft Learn — pick one, finish one path, ship one project
- This repo's `.agents/skills/` directory — start by reading 3 SKILL.md files end-to-end

---

**Prev:** [34 — AI transformation of QA teams](./34-ai-transformation-of-qa-teams.md) · **Next:** [36 — Testing modern AI systems](./36-testing-modern-ai-systems.md) · **Up:** [Phase 7 README](./README.md)
