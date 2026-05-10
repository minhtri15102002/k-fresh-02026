---
name: visual-regression-reviewer
description: "Triages Playwright visual-regression diffs (the `*-actual.png` / `*-diff.png` produced by `expect.toHaveScreenshot()` failures). Classifies each diff as one of: real regression, intentional change (baseline rot — needs `--update-snapshots`), false positive (anti-aliasing, font, dynamic content like timestamp, animation in flight), or environment artefact (different viewport / DPR / OS render). Emits a per-spec recommendation table and routes real regressions through defect-report. Use when explicitly asked to 'review the visual diffs', 'why are screenshots failing', 'should I update baselines', 'is this a real visual regression', or after `npx playwright test --grep @visual` reports failures. Companion to visual-regression-testing (which authors visual tests); this skill triages their failures."
---

# Visual Regression Reviewer

Visual tests catch what semantic assertions miss — but they also catch a lot of noise. This skill is the noise filter: every diff gets one of four classifications, and only one of them files a defect.

---

## When to use this skill

Trigger on:
- "Review the visual diffs"
- "Why are screenshots failing?"
- "Should I update baselines?"
- "Is this a real visual regression?"
- After `npx playwright test --grep @visual` fails
- After [`failure-analyzer`](../failure-analyzer/SKILL.md) classifies a failure as a `toHaveScreenshot` mismatch

Do **not** use when:
- The user wants to **author** visual tests → use [`visual-regression-testing`](../visual-regression-testing/SKILL.md).
- The diff is a layout shift caused by data → fix the test data first via [`test-data-generator`](../test-data-generator/SKILL.md).

---

## The four classifications

```
Diff type                       → action
────────────────────────────────────────────────────────────────────
1. Real regression               → defect-report (severity:major, type:visual)
2. Intentional change            → npx playwright test --update-snapshots; commit baselines
3. False positive (test bug)     → fix the test (mask, wait, disable animations)
4. Environment artefact          → align CI vs local environments; do NOT update baselines blindly
```

---

## How to use it

### Phase 1 — Locate the diffs

After a failed run, Playwright writes:
```
test-results/<test>/<step>-expected.png   # baseline
test-results/<test>/<step>-actual.png     # what the run produced
test-results/<test>/<step>-diff.png       # red overlay
```

If they're missing → the run aborted before screenshot; not a visual issue.

### Phase 2 — Open all three side-by-side

Per spec, look at expected ↔ actual ↔ diff at the same time. Resist the urge to skim the diff alone — context matters.

### Phase 3 — Classify

Apply this decision tree:

```
Does the diff overlap a known-dynamic region (clock, ads, user avatar) ?
├── yes → Class 3 (false positive); add a `mask: [...]` to the assertion
└── no
    │
    ├── Does the diff show subtle anti-aliasing / 1px borders / font hinting ?
    │      └── yes → Class 4 (environment); raise `maxDiffPixelRatio` slightly OR pin the CI image; do NOT bump baselines
    │
    ├── Was the change intentional (UI refresh, design system update, branding) ?
    │      └── yes → Class 2 (intentional); update baselines
    │
    └── Is the change unintentional and visually breaking (text cut off, button shifted, colour wrong, layout broken) ?
           └── yes → Class 1 (real regression); file via defect-report
```

### Phase 4 — Action per classification

#### Class 1 — Real regression

- File via [`defect-report`](../defect-report/SKILL.md) with:
  - `severity:major` (or `critical` if the page is unusable)
  - `type:visual` (custom label OK)
  - Attach all three PNGs
  - Cite the most recent commit that touched the affected page / component

#### Class 2 — Intentional change

```bash
# regenerate baselines for affected specs only
npx playwright test --grep "@visual @<feature>" --update-snapshots

# review what changed:
git status -- 'tests/**/*-snapshots/**'

# commit the baselines AS PART OF the design-change PR (never on a separate "update screenshots" PR)
```

The commit message must reference the design-change PR / ticket.

#### Class 3 — False positive (test bug)

The test is flagging noise. Fix per [`visual-regression-testing`](../visual-regression-testing/SKILL.md):

```ts
await expect(page).toHaveScreenshot('home.png', {
  mask: [page.locator('[data-test=clock]'), page.getByRole('img', { name: 'avatar' })],
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.005,
});
```

#### Class 4 — Environment artefact

Symptoms: passes locally, fails in CI (or vice-versa); diff is uniform anti-alias halo.

```
Common causes              → fix
───────────────────────────────────────────────────────────────────
Different OS render         → run baselines from the same OS as CI (or use Docker)
Different DPR               → pin viewport in playwright.config.ts
Font subpixel rendering     → use a Docker image for both local and CI baselines
Animation timing            → `animations: 'disabled'`; freeze with `page.clock.install()`
```

Do NOT update baselines from a developer laptop if CI runs in Linux Docker.

### Phase 5 — Emit the review

```markdown
## Visual Diff Review — run #482

| Spec | Step | Class | Action | Owner |
|---|---|---|---|---|
| `home.spec.ts:home-loaded` | hero-banner | 2 — Intentional | update baseline (PR #199 — homepage redesign) | @alice |
| `cart.spec.ts:empty-state` | empty-cart | 1 — Real regression | file defect (severity:major, module:cart) | @bob |
| `profile.spec.ts:avatar` | avatar-block | 3 — False positive | mask the avatar img | @carol |
| `checkout.spec.ts:summary` | totals-block | 4 — Env (font hinting, 0.7%) | move baselines into Docker; no defect | @dave |
```

---

## Best practices

- **Never blanket-update baselines.** "Just run with `--update-snapshots`" is how regressions ship to production.
- **Update baselines in the PR that caused the change.** A separate "update screenshots" PR is a smell.
- **Mask aggressively, threshold sparingly.** Masking is targeted; raising `maxDiffPixelRatio` hides everything.
- **Pin baselines to one environment.** If CI is Linux Docker, baselines must come from Linux Docker — period.
- **Keep `@visual` tests narrow.** Page-level screenshots break for any reason; component-level screenshots break only for real reasons.

---

## Related

- [`prompts/advanced/visual-regression-reviewer.md`](../../../prompts/advanced/visual-regression-reviewer.md) — full prompt
- [`prompts/advanced/visual-ai.md`](../../../prompts/advanced/visual-ai.md) — AI-driven diff classification (advanced)
- [`.agents/skills/visual-regression-testing/SKILL.md`](../visual-regression-testing/SKILL.md) — author the tests
- [`.agents/skills/failure-analyzer/SKILL.md`](../failure-analyzer/SKILL.md) — upstream classifier
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file Class 1 regressions
- [`.agents/skills/test-fixing/SKILL.md`](../test-fixing/SKILL.md) — apply Class 3 fixes to specs
