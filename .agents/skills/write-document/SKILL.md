---
name: write-document
description: "Authors technical documentation (tool guidelines, topic primers, folder READMEs, and side-by-side tool/library comparisons) for the documents/ tree, always pulling the latest stable version of any tool, framework, or spec it cites from the web and package registries before writing. Use when explicitly asked to 'write docs for X', 'document this tool', 'add a guideline for Y', 'write a comparison of A vs B', 'refresh the X doc to the latest version', 'add a folder README', or before merging a feature that introduces a new tool the team needs guidance on. Distinct from write-agent-skill (which authors SKILL.md inside .agents/skills/) and from write-agent-rule (which authors persistent agent rules) — this skill writes human-facing markdown under documents/."
---

# Write Document

Documents go stale faster than code. A guideline that cites Playwright `1.40` after the team upgraded to `1.49` looks careless to every reader who knows. A "tool comparison" written from one author's bias becomes a reference nobody trusts. This skill prevents both: it forces a **version-fresh** authoring loop and gives every doc a consistent shape so downstream readers (and the `skill-validator`) know where to look.

It writes the markdown the team uses every day — guidelines under [`documents/`](../../../documents/), folder READMEs, and the high-leverage `tool-comparison.md` files like [`documents/api-testing/tool-comparison.md`](../../../documents/api-testing/tool-comparison.md).

---

## When to use this skill

Trigger on:

- "Write a doc for `<tool>`" / "Document `<library>`"
- "Add a guideline for `<topic>`"
- "Write a comparison of `<A>` vs `<B>` (vs `<C>`)"
- "Refresh `<doc>` to the latest version"
- "Add a folder README for `documents/<area>/`"
- After introducing a new dependency in `package.json` that the team needs guidance on
- Before merging a feature that touches a new tool / spec / vendor

**Do NOT use when:**

- You want to author an agent skill → use [`write-agent-skill`](../write-agent-skill/SKILL.md).
- You want to author a persistent agent rule or workflow → use [`write-agent-rule`](../write-agent-rule/SKILL.md).
- You want to file a defect → use [`defect-report`](../defect-report/SKILL.md).
- You want a test plan → use [`test-plan-author`](../test-plan-author/SKILL.md).
- You want to validate references in an existing doc → use [`skill-validator`](../skill-validator/SKILL.md) (it covers `.agents/skills/` references; for `documents/` references, run `npm run check:references` if available, otherwise lint by hand).

---

## Document-type decision tree

Pick once, up front. The shape, length, and required sections differ.

```
What are you writing?
├── A guideline for ONE tool / library / topic
│       (how to install, configure, run, integrate, anti-patterns)
│       → Type A: Tool Guideline       (e.g. postman.md, k6.md)
│
├── A side-by-side comparison of 2+ tools that solve the same problem
│       (matrix + decision tree + migration paths + anti-stacking)
│       → Type B: Tool Comparison      (e.g. api-testing/tool-comparison.md)
│
├── An index / table-of-contents for a folder of docs
│       (what each file covers, reading order, conventions, status table)
│       → Type C: Folder README        (e.g. documents/api-testing/README.md)
│
└── A short conceptual primer (no tool, no comparison — just "what is X")
        → Type D: Topic Primer         (e.g. documents/version-control/fundamentals.md)
```

Don't conflate types. A guideline that morphs into a comparison loses focus; a comparison that becomes a tutorial loses its value as a decision aid.

---

## How to use it

### Phase 1 — Intake (always)

Collect from the user (and the repo) before writing:

| Input | Source |
|---|---|
| Document type (A / B / C / D) | Decision tree above |
| Subject(s) — tool / library / topic / list of compared tools | User |
| Target audience | User (engineer / non-engineer / mixed) |
| Output path | Default: `documents/<area>/<kebab-name>.md`. Match existing area if one fits. |
| Existing related docs to cross-link | Run `Glob` on `documents/<area>/**/*.md` |
| Existing related skills to cross-link | Run `Glob` on `.agents/skills/*/SKILL.md` |
| Repo conventions to honour | `documents/automation-framework/`, `prompts/core/`, `package.json` (versions) |

Summarise the intake back to the user in 5 bullets and ask: *"Anything missing, or shall I proceed?"* Skip the confirmation only if the user said "just write it".

### Phase 2 — Latest-version sweep (mandatory; this is the differentiator)

Before writing a single line that mentions a version, **fetch the current truth**. Do this in parallel.

For every tool, library, or spec the doc will mention:

1. **If it's an npm package the repo already uses** — read the version from [`package.json`](../../../package.json) so the doc matches the codebase exactly.
2. **If it's an npm package the repo does NOT use** — `npm view <pkg> version` (via `Shell`) for the latest stable, or hit `https://registry.npmjs.org/<pkg>/latest` via `WebFetch`.
3. **If it's a non-npm tool (Postman, k6, Burp, JMeter, Apidog, REST Assured, Playwright browsers, …)** — use `WebSearch` for `"<tool> latest version 2026"` and `WebFetch` the official release notes / changelog. Cite the version with the date you checked, e.g. *"Postman v11.x (verified May 2026)"*.
4. **If it's a spec (OpenAPI, JSON Schema, OWASP, WCAG, IEEE 829, …)** — fetch the current version from the spec's authoritative URL.
5. **If a feature you cite is new in the latest version** — note when it was introduced so readers on older versions know what to expect.

Anti-pattern this rules out: writing *"as of 2024…"* or *"in the latest version of Playwright"* without a number. Every version claim in the doc must be a fetched number with a `(verified <YYYY-MM>)` stamp.

Save findings as a small notes block in your scratchpad — you'll cite them in Phase 5.

### Phase 3 — Pick a template by type

Use the matching scaffold below (kept inline so this skill stays self-contained; copy the relevant block, fill, then prune).

#### Type A — Tool Guideline scaffold

```markdown
# <Tool / Topic> — <Workflow Subtitle>

> One-paragraph blurb. What this doc covers, what it does NOT cover, and the
> single sentence that tells a reader to keep reading or go elsewhere.
>
> **Versions verified (YYYY-MM):** <tool> vX.Y.Z, <peer-dep> vA.B.C

## When to reach for <tool>

Use when:
- ...
Avoid when:
- ...

## Install / setup

\`\`\`bash
# pin to current latest from Phase 2
npm i -D <pkg>@<exact-version>
\`\`\`

## The 3-to-7 step happy path

1. ...
2. ...

## Configuration / conventions in this repo

- File location: `<path>`
- Naming: `<convention>`
- Cross-refs: `<related-doc>`

## Worked example

(Concrete, runnable, pulled from a real spec or a real defect — never invented.)

## Anti-patterns this guideline rules out

- ❌ ...
- ❌ ...

## Related

- [`<related-doc>`](<relative-path>)
- [`<related-skill>`](<relative-path>)
```

#### Type B — Tool Comparison scaffold

This is the highest-leverage type and the one users specifically asked to support. Mirror the shape of [`documents/api-testing/tool-comparison.md`](../../../documents/api-testing/tool-comparison.md):

```markdown
# <Area> Tool Comparison — When to Use What

> Decision aid for choosing between **<Tool A>**, **<Tool B>**, **<Tool C>**, ...
>
> **TL;DR:**
> - <scenario 1> → <tool>
> - <scenario 2> → <tool>
>
> **Versions verified (YYYY-MM):** A vX.Y, B vA.B, C vM.N

## The N-criterion matrix

Score each tool 1-5 (5 = best fit) for the criteria the team weights highest.

| Criterion              | Tool A | Tool B | Tool C |
|---|---|---|---|
| Speed of first request |   ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| CI integration         |   ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maintainability        |   ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Lock-in risk (lower=⭐⭐⭐⭐⭐) | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| TCO at 5 engineers/yr  |   $$ | $ | $ |

(7-12 criteria typical. Make at least 3 measurable, not opinion.)

## Decision tree

\`\`\`
Q1. Is the use case already covered by <repo's default tool>?
       ├─ Yes → Use it. Don't fork.
       └─ No  → Q2

Q2. Is this exploratory?
       ├─ Yes → Tool A
       └─ No  → Q3

Q3. ...
\`\`\`

## Side-by-side feature comparison

(Group features into 3-4 sub-tables: Authoring / Running / Reporting / Cost — easier to read than one giant matrix.)

### Authoring

| Feature | Tool A | Tool B | Tool C |
|---|---|---|---|
| ... | ... | ... | ... |

### Running

...

## Migration paths

### Tool A → Tool B
- Effort: <X person-weeks>
- Risk: <low / medium / high>
- Steps: 1. ... 2. ...

### Tool B → Tool C
...

## Anti-stacking patterns (when NOT to combine them)

- ❌ <Tool A> + <Tool B> both asserting the same thing → ...
- ❌ Replacing <repo's default> with <vendor tool> on every PR → ...

## Worked example — choosing for the <real scenario>

(Use a concrete, in-repo scenario. Don't invent.)

## Anti-patterns this comparison rules out

- ❌ "We standardise on one tool for everything" — kills audience-fit
- ❌ Re-evaluating the tool every quarter — pick once per project, re-evaluate annually
- ❌ Letting any paid tool in without a [`roi-brief`](../../.agents/skills/roi-brief/SKILL.md)

## Related

- [`<sibling guideline 1>`](./...)
- [`<sibling guideline 2>`](./...)
```

#### Type C — Folder README scaffold

```markdown
# <Area> Guidelines (<Tool 1> · <Tool 2> · <Tool 3>)

> One-paragraph framing of what this folder is the source of truth for.

## The picture

\`\`\`
(ASCII diagram showing how the tools relate / data flows)
\`\`\`

## Index

| File | What it covers | When to read |
|---|---|---|
| [`<file-1>.md`](./<file-1>.md) | ... | ... |
| [`<file-2>.md`](./<file-2>.md) | ... | ... |
| [`tool-comparison.md`](./tool-comparison.md) | When-to-use matrix | Choosing the tool, justifying in an RFC |

## Reading order

1. **`tool-comparison.md`** — pick the right tool first.
2. **`<your tool of choice>.md`** — deep dive.
3. ...

## Conventions used here (cross-references)

- Storage: `<path convention>`
- Tags / labels: `<link to authority>`
- Reporting: `<link>`

## Out of scope

This folder is **not**:
- ...
- ...

## Status

| Doc | Status | Owner |
|---|---|---|
| [`<file-1>.md`](./<file-1>.md) | ✅ v1 | <owner> |
| [`<file-2>.md`](./<file-2>.md) | ⚠️ draft | <owner> |
```

#### Type D — Topic Primer scaffold

```markdown
# <Topic> — Primer

> What this is, who it's for, what to read next.

## Concept

(2-4 paragraphs. No tool-specific content; that goes in Type A guidelines.)

## Key terms

| Term | Meaning | Example |
|---|---|---|
| ... | ... | ... |

## Why it matters here

(One paragraph tying the concept back to this repo.)

## Related

- [`<Type A guideline>`](./<file>.md) — for the tool angle
- [`<Type B comparison>`](./tool-comparison.md) — for the choice
```

### Phase 4 — Write the body

Apply across all types:

- **Pull every code block from the latest version** identified in Phase 2. CLI flags, config keys, and import paths drift across major releases — verify against the official docs you fetched, not from memory.
- **Cite versions with a verification stamp** the first time each tool is mentioned: *"k6 v0.x (verified 2026-05)"*.
- **Link, don't repeat.** If a sibling doc already explains a concept, link to it. Duplication rots fastest.
- **Use real, in-repo paths** for every example. The validator will catch fabrications.
- **Keep one doc, one purpose.** If you find yourself writing two H1-level concepts, split into two files and link them via a Folder README (Type C).
- **Audience-tune the depth.** Engineer-facing docs can show 30-line code blocks; non-engineer-facing docs (PM, sales, support readers) cap code blocks at 10 lines and lead with a screenshot description or a CLI one-liner.

### Phase 5 — Self-check before emit

Before saving, verify each item:

- [ ] Document type (A / B / C / D) is unambiguous from the H1 + opening blurb.
- [ ] Every tool / library / spec mentioned has a version with `(verified YYYY-MM)`.
- [ ] Every code block uses syntax / flags / paths from the **latest** version identified in Phase 2.
- [ ] Every backtick-quoted file path resolves to a real file in the repo (or is a path the doc itself proposes to create — flag those clearly with *"(to be added by …)"*).
- [ ] Every markdown link `[…](…)` resolves (relative paths included). Run `Glob` on doubt.
- [ ] No prose contradicts the matrix / decision tree (Type B specifically).
- [ ] An "Anti-patterns" or "Out of scope" section exists — explicit non-goals are how a doc stays focused.
- [ ] A "Related" footer with at least 2 cross-links exists.
- [ ] Word count is reasonable for the type:
  - Type A: 800-2500 words
  - Type B: 1500-3500 words (matrices count)
  - Type C: 400-1200 words
  - Type D: 300-800 words

### Phase 6 — Emit + register

1. Save to the path agreed in Phase 1 (default `documents/<area>/<kebab-name>.md`).
2. If the area has a Folder README, **add the new doc to its Index table** in the same change.
3. If the new doc is a Tool Comparison (Type B), **link it from each compared tool's guideline** under their "Related" section.
4. If the new doc introduces a new dependency, ensure [`package.json`](../../../package.json) reflects the same version you cited.
5. If touching `.agents/skills/` is part of the same change, run [`.agents/skills/skill-validator/SKILL.md`](../skill-validator/SKILL.md) before opening the PR.

If the user asks for **just the doc body** (no file), emit the markdown inline and skip steps 1-4.

---

## Decision aid — Type A vs Type B (the most common confusion)

| Symptom | You're writing Type A | You're writing Type B |
|---|---|---|
| User said "document `<tool>`" (single tool) | ✅ | |
| User said "compare `<A>` vs `<B>`" | | ✅ |
| Reader will use this to **learn** the tool | ✅ | |
| Reader will use this to **choose** between tools | | ✅ |
| Output has a feature matrix | ⚠️ small one OK at the end | ✅ central artifact |
| Output has a decision tree | rarely | ✅ mandatory |
| Output has migration paths | rarely | ✅ at least 2 |
| Output has anti-stacking (when NOT to combine) | n/a | ✅ |

If both apply, write Type A first (per tool), then Type B that references them.

---

## Best practices

- **Latest version, not "the latest version".** Numbers + verification dates beat hand-wave words. A reader on a 6-month-old branch needs to know whether they're on the version you wrote about.
- **One doc owns one decision.** Tool guideline = "how do I use it?"; Tool comparison = "should I use it?"; Folder README = "where do I find each?". Don't blur.
- **Cite, don't invent.** Every URL, file path, label, tag, env name, and milestone in the doc must already exist (or be explicitly proposed in the same change). Fabrications kill trust faster than typos.
- **Anti-patterns earn the doc its keep.** A doc without an "Anti-patterns" or "Out of scope" section is a wishlist, not a guideline. Three bullets minimum.
- **Comparison docs must show weakness.** If every cell of your matrix shows ⭐⭐⭐⭐⭐ for the tool you secretly prefer, the doc is propaganda. Force a column to score ⭐ where it deserves it — including for the repo's default.
- **Refresh on a calendar.** Add a footer line: *"Refresh due: <YYYY-MM> — re-run write-document with `--refresh`"* (or note the cadence in the Folder README's Status table).
- **Cross-reference the right authority.** For testing-shape rules, link [`documents/automation-framework/assertions.md`](../../../documents/automation-framework/assertions.md). For tags, link [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md). For defect labels, link [`prompts/core/defect-labels.md`](../../../prompts/core/defect-labels.md). Don't restate them.
- **Match the area's convention.** If `documents/api-testing/` uses 5-criterion matrices, your new `documents/security/` comparison should use the same shape unless there's a reason to diverge.
- **Sign off in Folder READMEs.** Type C docs have a Status table with an Owner column. Anonymous docs become orphaned docs.

---

## Related

- [`.agents/skills/write-agent-skill/SKILL.md`](../write-agent-skill/SKILL.md) — author SKILL.md inside `.agents/skills/`
- [`.agents/skills/write-agent-rule/SKILL.md`](../write-agent-rule/SKILL.md) — author persistent agent rules / workflows
- [`.agents/skills/skill-validator/SKILL.md`](../skill-validator/SKILL.md) — validate references after editing skills
- [`.agents/skills/test-plan-author/SKILL.md`](../test-plan-author/SKILL.md) — for test-strategy documents (different shape, different audience)
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — for bug reports (issue body, not docs)
- [`.agents/skills/roi-brief/SKILL.md`](../roi-brief/SKILL.md) — required companion for any Type B comparison that recommends a paid tool
- [`documents/api-testing/tool-comparison.md`](../../../documents/api-testing/tool-comparison.md) — canonical Type B example to model from
- [`documents/api-testing/README.md`](../../../documents/api-testing/README.md) — canonical Type C example to model from
- [`documents/api-testing/postman.md`](../../../documents/api-testing/postman.md) — canonical Type A example to model from
