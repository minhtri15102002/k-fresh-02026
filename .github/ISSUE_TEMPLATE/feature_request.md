---
name: ✨ Feature request
about: Propose a new framework capability, test, prompt, or workflow improvement.
title: "[FEATURE] "
labels: enhancement
assignees: ''

---

## Summary
<!-- One sentence describing what you want. Example: "Add a `commonPage.inputValue(loc)` helper so we can drop the `expect.poll` in product-page.ts". -->

## Problem / motivation
<!-- What pain point does this address? Quote the failing user, the blocked PR, or the missing capability. -->

## Proposed solution
<!-- Concrete shape of the change. Code sketches encouraged. -->

```ts
// e.g. proposed API surface
async inputValue(locator: Locator, opts?: { timeout?: number }): Promise<string>
```

## Alternatives considered
<!-- What did you weigh against the proposal? Why is the proposal better? -->

## Affected areas
- [ ] Page Objects (`pages/`)
- [ ] Locators (`locators/`)
- [ ] Tests (`tests/`)
- [ ] CommonPage / AssertHelper (`pages/common-page.ts`, `utilities/assert-helper.ts`)
- [ ] CI workflow (`.github/workflows/`)
- [ ] QA Metrics dashboard (`templates/qa-metrics-dashboard.html`)
- [ ] Prompts (`prompts/`)
- [ ] Agent Skills (`.agents/skills/`)
- [ ] Training curriculum (`training/`)
- [ ] Other: <!-- describe -->

## Acceptance criteria
<!-- A QA repo lives or dies on these. Be specific. -->
- [ ] <!-- e.g. `commonPage.inputValue(loc)` exists and is documented in `prompts/core/pom-generator.md` -->
- [ ] <!-- e.g. All current `expect.poll(... .inputValue())` usages are migrated -->
- [ ] <!-- e.g. `npm run check:all` stays green -->

## Risks & test impact
<!-- Will this require updating existing tests, prompts, or CI? Anything that could regress? -->

## Additional context
<!-- Links to related issues, PRs, ADRs, design docs, or skill files. -->

---

<sub>For defect-tracking labels, see <a href="../blob/main/prompts/core/defect-labels.md"><code>prompts/core/defect-labels.md</code></a>. For test conventions, see <a href="../blob/main/prompts/core/test-tags.md"><code>prompts/core/test-tags.md</code></a>.</sub>
