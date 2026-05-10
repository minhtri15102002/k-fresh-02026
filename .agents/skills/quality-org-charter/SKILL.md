---
name: quality-org-charter
description: "Drafts a Quality Org Charter — the 10-section operating doc that is the Track P graduation artifact — from a JSON inputs file. Validates that all 10 sections are present, that the principle and anti-principle counts are 3-5, that the decision-rights table has at least 6 rows, and that the quality bar has at least 3 measurable thresholds; then emits a deterministic Markdown charter that matches templates/manager/quality-org-charter-template.md byte-for-byte where the template's structure dictates. Use when explicitly asked to 'draft a quality org charter', 'generate a charter for <team>', 'compress my P5 capstone', or before any QA Manager / Director interview that needs a portfolio artifact. Saves ~4 hours per charter vs hand-drafting; rejects with clear errors if any required section is missing — never silently emits a charter with placeholder anti-principles."
optionalRefs:
  - templates/manager/quality-org-charter-template.md   # contract — emitted output matches this shape
  - training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md  # spec — the 10 sections
  - training/sandbox/example/manager/quality-org-charter.md  # reference — Phoenix QA team's filled charter
  - reports/quality-org-charter-<team>-v<n>.md          # output — the emitted charter
---

# Quality Org Charter

A Quality Org Charter is the **written contract** between a QA manager, their team, and their peers about how the org operates. It is the Track P graduation artifact ([P5](../../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md)) and the single most useful portfolio piece for a QA Manager / Director / VP Quality interview.

This skill is the runnable counterpart to [`templates/manager/quality-org-charter-template.md`](../../../templates/manager/quality-org-charter-template.md): same 10-section shape, same cross-references, but generated deterministically from a JSON inputs file so it can be re-derived after every team change, hire, or principle update.

It mirrors the [`roi-brief`](../roi-brief/SKILL.md) skill's pattern: validate strictly, compute nothing, emit a sign-off-ready Markdown document.

---

## When to use this skill

Trigger on:

- "Draft a Quality Org Charter for `<team>`"
- "Generate a charter for `<my org>`"
- "Compress my P5 capstone — I have all the inputs"
- Before any **QA Manager / Director / VP Quality** interview that needs a portfolio artifact
- After any **org change** (re-org, lead change, scope expansion) — re-emit a versioned charter
- Annually as part of **charter review** ([P5 §10](../../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md))

**Do NOT use when:**

- The user has not done the *thinking* — this skill is a typesetter, not a thought partner. If the inputs are weak, the charter is weak. Send them to [Track P · M5](../../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) first.
- The user wants a **release decision** → use [`release-readiness`](../release-readiness/SKILL.md).
- The user wants a **dollar number** → use [`roi-brief`](../roi-brief/SKILL.md).
- The user wants the **fillable template** to write by hand → point them at [`templates/manager/quality-org-charter-template.md`](../../../templates/manager/quality-org-charter-template.md).

---

## Inputs you need

If the user has done [Track P · M1–M4](../../../training/track-p-people-and-management/README.md), most of these already exist as artifacts:

| Input | Where to find it | Required? |
|---|---|---|
| Team name + author + version | User statement | yes |
| Reviewers (≥ 1 outside the team) | Their org chart | yes |
| Mission (1 sentence) | Their elevator pitch for QA on this team | yes |
| 3-5 operating principles | M1 anti-principles' inverse + their team's lived norms | yes |
| 3-5 anti-principles | M1 lab artifact | yes |
| Operating model (1:1, standup, retro, planning, on-call) | M1 + M4 artifacts | yes |
| Decision rights (≥ 6 categories) | Their org's RACI / their judgement | yes |
| Quality bar (≥ 3 thresholds with sources) | M4 SLOs + dashboard panels | yes |
| Incident & change response | M5 lab artifact (post-mortem template) | yes |
| Hiring + growth references | M2 lab artifacts | yes |
| Communication norms | M3 lab artifacts | yes |
| Manager operating model (office hours, skip-levels, self-retro) | Their personal practice | yes |

If anything is missing → **stop and ask**; do not invent. A charter with invented anti-principles is worse than no charter — it commits the manager to behaviours they don't actually hold.

---

## How to use it

### Phase 1 — Verify Track P prerequisites

```bash
# Confirm the M1-M4 artifacts exist for the manager
ls training/sandbox/<your-name>/manager/ 2>&1 | grep -E '1on1|delegation|jd|rubric|growth|quarterly|vendor' || \
  echo "Track P · M1-M4 artifacts missing. Complete those first; the charter cross-references them."
```

If artifacts are missing, the charter will still emit but its cross-references to peer artifacts (1:1 doc, interview rubric, growth plan, …) will be dead links inside the resulting charter.

### Phase 2 — Build the inputs JSON

Copy [`resources/inputs-example.json`](./resources/inputs-example.json) (the Phoenix QA team's full inputs) to a working file:

```bash
cp .agents/skills/quality-org-charter/resources/inputs-example.json /tmp/charter-inputs.json
$EDITOR /tmp/charter-inputs.json
```

Schema (every field is required unless marked optional):

```jsonc
{
  "team_name": "Phoenix QA — e-commerce checkout & cart",
  "author": "Khanh Do",
  "author_role": "QA Director",
  "version": "1.0",
  "next_review_date": "2027-05-10",
  "reviewers": ["Alice (Peer Director)", "Bob (VP Eng)"],   // ≥ 1 required

  "mission": "We make it impossible to ship a critical regression to checkout without a named human accepting the risk.",

  "principles": [                                             // 3-5 required
    "Numbers over vibes — every release decision cites data",
    "Blameless by default — incidents teach the system, not punish the human",
    "..."
  ],
  "anti_principles": [                                        // 3-5 required
    "We do not ship without @P1 at 100 %",
    "We do not exit ICs without 90 days of documented feedback",
    "..."
  ],

  "operating_model": {                                        // every field required
    "ones_on_ones": "weekly, 30 min, IC drives, doc per template",
    "standup": "async daily; sync 2×/week",
    "retro": "bi-weekly, rotating facilitator",
    "planning": "first 2 weeks of quarter",
    "on_call": "1-week shifts, 4-deep rotation, comp time",
    "skip_levels": "every 6 weeks, listen-only"
  },

  "decision_rights": [                                        // ≥ 6 rows required
    { "decision": "Hiring loop go/no-go", "decides": "Hiring manager", "consults": ["Loop participants"], "informs": ["VP"] },
    { "decision": "Release go/no-go", "decides": "QA Director", "consults": ["Eng Director", "PM"], "informs": ["VP"] },
    { "decision": "Quality SLO target", "decides": "QA Director", "consults": ["Eng leadership"], "informs": ["All teams"] },
    { "decision": "Vendor purchases >$10k", "decides": "QA Director + Finance", "consults": ["Affected ICs"], "informs": ["VP"] },
    { "decision": "Performance management actions", "decides": "Manager (line)", "consults": ["HR", "skip-level"], "informs": [] },
    { "decision": "Framework architectural change", "decides": "Tech lead", "consults": ["Senior ICs"], "informs": ["Manager"] }
  ],

  "quality_bar": [                                            // ≥ 3 rows required
    { "threshold": "@P1 pass rate 100 % on every main commit (stop-the-line below)", "source": "Panel #2" },
    { "threshold": "@P2 ≥ 95 %", "source": "Panel #2" },
    { "threshold": "0 open severity:critical defects at release time", "source": "Panel #3" }
  ],

  "incident_response": {                                      // every field required
    "war_room_roles": "Incident Commander / Comms Lead / Scribe (per Track P P5)",
    "post_mortem_sla": "5 business days, blameless template",
    "change_framework": "Kotter 8-step for any change spanning >1 team or >1 sprint",
    "customer_comms_threshold": "any incident with >50 customers affected for >15 minutes"
  },

  "hiring": {                                                 // every field required
    "loop_stages": 4,
    "bar_raiser": true,
    "growth_plan_cadence_months": 6,
    "perf_mgmt_principle": "feedback → PIP → exit, with no surprises"
  },

  "communication": {                                          // every field required
    "threaded_doc_threshold": "any decision needing >6 messages",
    "exec_brief_format": "BLUF + verdict + 3 things that would change it",
    "no_forms": ["yes-and-cut", "no-because", "not-now-but"]
  },

  "manager_operating": {                                      // every field required
    "office_hours": "Tuesdays 14:00–15:00 — any IC, no agenda",
    "skip_level_cadence": "every 6 weeks",
    "self_retro_cadence": "quarterly, shared with team"
  }
}
```

### Phase 3 — Run the script

```bash
# print the charter to stdout
npm run charter:draft -- /tmp/charter-inputs.json

# write to a report file
npm run charter:draft -- /tmp/charter-inputs.json --out reports/quality-org-charter-phoenix-v1.md

# verbose — show every validation step
npm run charter:draft -- /tmp/charter-inputs.json --verbose
```

Exit codes:

- `0` — charter emitted; all validations passed
- `2` — invocation error (missing field, invalid JSON, count out of range, etc.)

### Phase 4 — Hand-off

The emitted charter is a **v1.0 draft**. The author still needs to:

1. **Peer-review it** (per [Track P · M5 graduation criterion](../../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md)) — real human peer or simulated via [`multi-agent-brainstorming`](../multi-agent-brainstorming/SKILL.md)
2. **Get sign-off** in §Sign-off (peer manager + VP)
3. **Commit** under `training/sandbox/<your-name>/manager/quality-org-charter.md` (or your org's RFC system)
4. **Schedule the 12-month review** — the charter is a living doc

---

## Anti-patterns the script catches automatically

| Anti-pattern | Detection | Behaviour |
|---|---|---|
| Fewer than 3 principles | `principles.length < 3` | exit 2: "Module 39 graduation requires 3-5; <n> is not enough discipline" |
| More than 5 principles | `principles.length > 5` | exit 2: "More than 5 = none are real; pick your top 5" |
| Anti-principles count out of range | `anti_principles.length` not in [3,5] | exit 2: "anti-principles is the differentiator — 3-5 required" |
| Decision rights too thin | `decision_rights.length < 6` | exit 2: "M5 §5 requires ≥ 6 categories; you face more than 6 decisions/quarter" |
| Quality bar too thin | `quality_bar.length < 3` | exit 2: "≥ 3 measurable thresholds required; M4 §SLOs lists 5 candidates" |
| No reviewers | `reviewers.length === 0` | exit 2: "≥ 1 reviewer required (per Track P graduation criterion)" |
| Vague principle (regex match on weasel words) | `principles[i]` matches /be more / try to / always / never / strive/ | warn (don't fail) — suggest rephrasing with observable behaviour |
| Mission > 25 words | `mission.split(/\s+/).length > 25` | warn — "mission should be one sentence; <n> words is two" |
| Empty placeholder text | any field contains `<…>` or `<placeholder>` | exit 2: "fill placeholder in field <name>" |

---

## Best practices

- **The skill emits the same charter byte-for-byte for the same inputs.** Diff your v1 vs v2 to see exactly what changed.
- **Re-emit on every meaningful change.** A new principle, a new direct report, a re-org → re-emit a v1.x.
- **Anti-principles are the hardest section.** If yours match a generic LinkedIn post, they're not yours. Re-do M1.
- **Decision rights are the second hardest.** If filling 6 rows is hard, you have a clarity gap your team is silently absorbing.
- **Peer review is non-negotiable.** A charter written in isolation reflects the manager's blind spots; a peer-reviewed charter reflects the team's reality.

---

## Related

- [`templates/manager/quality-org-charter-template.md`](../../../templates/manager/quality-org-charter-template.md) — the human template this skill matches
- [`templates/manager/README.md`](../../../templates/manager/README.md) — full template index
- [`training/sandbox/example/manager/quality-org-charter.md`](../../../training/sandbox/example/manager/quality-org-charter.md) — Phoenix QA team's filled charter (worked example)
- [`training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md`](../../../training/track-p-people-and-management/p05-people-first-incident-and-change-leadership.md) — the 10-section spec
- [`roi-brief`](../roi-brief/SKILL.md) — sibling skill (the budget evidence behind the quarterly plan referenced in §4)
- [`release-readiness`](../release-readiness/SKILL.md) — sibling skill (the release verdict format §6 thresholds compare against)
- [`multi-agent-brainstorming`](../multi-agent-brainstorming/SKILL.md) — for simulated peer-review of an emitted charter
