---
name: 🧪 Test coverage request
about: Request a new manual or automated test for an uncovered scenario or requirement.
title: "[COVERAGE] "
labels: "test-coverage"
assignees: ''

---

## Requirement / scenario
<!-- What needs coverage? Quote the requirement ID, user story, or acceptance criterion. -->

| Field | Value |
|---|---|
| Requirement ID | <!-- e.g. REQ-CART-04 --> |
| Module | <!-- auth / cart / checkout / profile / product / compare / wishlist / home --> |
| Feature area | <!-- e.g. quantity counter, address book, payment redirect --> |
| Source of truth | <!-- spec doc / Figma / Jira ticket / screenshot --> |

## Why this is missing
- [ ] No spec exists today
- [ ] Spec exists but doesn't assert this path
- [ ] Spec was deleted / quarantined (link the issue)
- [ ] Discovered via a production bug (link bug)
- [ ] Risk-based ask (high blast radius, no coverage)

## Proposed coverage
<!-- Tick all that apply. -->
- [ ] **Manual TC** — generate via prompts/core/manual-test-case-generator.md
- [ ] **UI E2E** — `tests/ui/...`
- [ ] **API** — `tests/api/...`
- [ ] **Hybrid** — UI seeded by API
- [ ] **Security** — see training/phase-4-api-and-quality/23-api-security-testing.md
- [ ] **Visual / a11y** — see training/phase-4-api-and-quality/24-visual-and-accessibility-testing.md

## Suggested tags
<!-- Per prompts/core/test-tags.md — pick what applies. -->
- Priority: `@P1` / `@P2` / `@P3` / `@P4`
- Severity: `@critical` / `@major` / `@minor` / `@trivial`
- Type: `@smoke` / `@regression` / `@ui` / `@api` / `@security` / `@visual` / `@a11y`
- Feature: `@auth` / `@cart` / `@checkout` / `@profile` / `@product` / `@compare` / `@wishlist` / `@home`

## Acceptance criteria
- [ ] Test exists in `tests/...` and runs in CI on every PR
- [ ] Tags are valid against `prompts/core/test-tags.md`
- [ ] Page Object updates (if any) follow `prompts/core/pom-generator.md`
- [ ] `npm run check:all` passes
- [ ] Allure report shows the test under the correct severity / feature

## Test data / preconditions
<!-- Seed accounts, fixtures, env-specific quirks. -->

## Risk if NOT covered
<!-- e.g. "Silent revenue loss if discount stacking breaks again." -->

## Related issues / PRs
- Bug that exposed the gap: #
- Existing nearby spec: `tests/...`

---

<sub>Generation prompts: <a href="../blob/main/prompts/core/manual-test-case-generator.md"><code>manual-test-case-generator.md</code></a> &middot; <a href="../blob/main/prompts/core/test-generator.md"><code>test-generator.md</code></a> &middot; <a href="../blob/main/prompts/core/pom-generator.md"><code>pom-generator.md</code></a>.</sub>
