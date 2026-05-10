---
name: 🐛 Bug report
about: Report a defect in the product or test framework so it surfaces in the QA Metrics dashboard.
title: "[BUG] "
labels: bug
assignees: ''

---

<!--
After you submit, also apply EXACTLY ONE severity:* label and EXACTLY ONE module:* label.
The QA Metrics dashboard reads those labels via scripts/fetch-defects.ts.
Reference: prompts/core/defect-labels.md
-->

## Summary
<!-- One sentence — what's broken? Action-oriented (e.g. "Cart total ignores discount on quantity update"). -->

## Severity
<!-- Pick ONE; then add the matching label after submitting. -->
- [ ] `severity:critical` — data loss / money loss / security hole / total breakage
- [ ] `severity:major` — important functionality broken; workaround exists
- [ ] `severity:minor` — cosmetic / convenience issue
- [ ] `severity:trivial` — typo / copy nit

## Module
<!-- Pick ONE; then add the matching label after submitting. -->
- [ ] `module:auth`
- [ ] `module:cart`
- [ ] `module:checkout`
- [ ] `module:profile`
- [ ] `module:product`
- [ ] `module:compare`
- [ ] `module:wishlist`
- [ ] `module:home`

## Environment
| Field | Value |
|---|---|
| Environment | <!-- qa / uat / staging / prod / local --> |
| Build / commit | <!-- e.g. #247 or git SHA --> |
| Browser | <!-- Chromium 130 / Firefox 132 / WebKit 18 --> |
| OS | <!-- macOS 15 / Ubuntu 22.04 / Windows 11 --> |
| Viewport | <!-- 1920×1080 / iPhone 14 / etc. --> |
| First seen | <!-- timestamp or build link --> |

## Steps to reproduce
<!-- Atomic, copy-pasteable. Include exact data so a stranger can reproduce. -->
1. Go to '...'
2. Click '...'
3. Enter '...'
4. Observe '...'

## Expected behavior
<!-- What the user / spec said should happen. Cite the requirement if there is one. -->

## Actual behavior
<!-- What actually happened. Quote error messages verbatim. -->

## Evidence
<!-- Drag & drop or paste:
     - Screenshot of the failure
     - Video (.webm) or trace (.zip) — `npx playwright show-trace trace.zip`
     - Console / network excerpt
     - Allure report link or CI run URL
-->

## Suspect commit / area (optional)
<!-- `git bisect` result, recent merges, or your best guess at the affected file. -->

## Related test case (optional)
<!-- Link the spec that should have caught this, or open a follow-up to add one.
     If no test exists, please open a "Test coverage request" issue too. -->
- Spec: `tests/.../<file>.spec.ts`
- Test ID: `TC-...`
- Manual TC: `documents/manual-testcases/...`

## Workaround (optional)
<!-- Any short-term mitigation users can apply. -->

## Additional context
<!-- Anything else: feature flags, A/B variants, recent infra changes. -->

---

<sub>Conventions: <a href="../blob/main/prompts/core/defect-labels.md"><code>prompts/core/defect-labels.md</code></a> &middot; QA Metrics dashboard auto-aggregates this issue once the <code>severity:*</code> + <code>module:*</code> labels are applied.</sub>
