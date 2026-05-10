# Manager Templates

Starter skeletons for every artifact required by [Track P — People, Career & Management](../../training/track-p-people-and-management/README.md).

These are **fillable templates with `<placeholder>` markers** — copy one, edit the placeholders, commit under `training/sandbox/<your-name>/manager/`. They are deliberately *not* pre-filled; the fill is the lab.

For **realistic worked examples** of every template, see [`training/sandbox/example/manager/`](../../training/sandbox/example/manager/README.md) — the Phoenix QA team's full set, useful as a reference when something in a template is unclear.

For an **automated draft of the Quality Org Charter** from a JSON inputs file, use [`.agents/skills/quality-org-charter`](../../.agents/skills/quality-org-charter/SKILL.md) or `npm run charter:draft -- inputs.json`.

---

## Index

| Template | Used by | Track P module |
|---|---|---|
| [`1on1-template.md`](./1on1-template.md) | IC ↔ manager weekly conversation | [P1](../../training/track-p-people-and-management/p01-from-engineer-to-manager.md) |
| [`delegation-log-template.md`](./delegation-log-template.md) | Transferring IC work to the team | [P1](../../training/track-p-people-and-management/p01-from-engineer-to-manager.md) |
| [`jd-qa-engineer-template.md`](./jd-qa-engineer-template.md) | Hiring — job description with red flags | [P2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md) |
| [`interview-rubric-template.md`](./interview-rubric-template.md) | Hiring — 4-signal × 4-score rubric | [P2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md) |
| [`growth-plan-template.md`](./growth-plan-template.md) | IC growth — level N → N+1 contract | [P2](../../training/track-p-people-and-management/p02-hiring-leveling-growing-testers.md) |
| [`defect-narrative-template.md`](./defect-narrative-template.md) | Communication — engineer audience | [P3](../../training/track-p-people-and-management/p03-communication-and-influence.md) |
| [`release-brief-exec-template.md`](./release-brief-exec-template.md) | Communication — executive audience (BLUF) | [P3](../../training/track-p-people-and-management/p03-communication-and-influence.md) |
| [`incident-customer-note-template.md`](./incident-customer-note-template.md) | Communication — customer audience | [P3](../../training/track-p-people-and-management/p03-communication-and-influence.md) |
| [`qa-quarterly-plan-template.md`](./qa-quarterly-plan-template.md) | Program — OKRs + SLO + stop-loss | [P4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) |
| [`vendor-decision-rfc-template.md`](./vendor-decision-rfc-template.md) | Program — build vs buy with weighted scoring | [P4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) |
| [`post-mortem-template.md`](./post-mortem-template.md) | Incidents — blameless 5-Whys + action items | [P5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) |
| [`quality-org-charter-template.md`](./quality-org-charter-template.md) | The graduation artifact (10-section operating doc) | [P5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) |
| [`quality-metrics-pack-template.md`](./quality-metrics-pack-template.md) | Three-scope metrics pack — Team / Project / Charter — that operationalises the charter's quality bar | [P4](../../training/track-p-people-and-management/p04-running-qa-program-at-scale.md) + [P5](../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) |

## Conventions

- **`<placeholder>`** — replace with your value.
- **`<placeholder | example: "…">`** — placeholder with a hint for what the value should look like.
- **Lines beginning with `>`** — coaching notes that should usually stay in the doc as guidance for future readers.
- **`<!-- … -->`** — instructions to the author; delete before committing.
- **Tables** — keep the column structure even if you reduce rows; the structure is part of the contract.

## Where filled artifacts go

Always commit your filled instances under `training/sandbox/<your-name>/manager/<artifact>.md` — never overwrite the templates here. PRs into your sandbox branch get reviewed by your trainer like any other lab.

```
templates/manager/                          ← templates (skeletons, never edit per-learner)
└── …
training/sandbox/example/manager/           ← reference (Phoenix QA team, fully filled)
└── …
training/sandbox/<your-name>/manager/       ← your filled instances (PR'd, reviewed)
└── …
```

## Related

- [Track P intro](../../training/track-p-people-and-management/README.md) — the curriculum these templates serve
- [Sandbox example — Phoenix QA team](../../training/sandbox/example/manager/README.md) — every template, fully filled
- [`quality-org-charter` skill](../../.agents/skills/quality-org-charter/SKILL.md) — auto-draft your charter from a JSON inputs file
- [`roi-brief` skill](../../.agents/skills/roi-brief/SKILL.md) — generates the budget evidence behind the quarterly plan
