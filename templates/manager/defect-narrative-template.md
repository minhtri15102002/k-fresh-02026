# Defect Narrative — engineer audience — <bug-title> — <YYYY-MM-DD>

> Lab artifact for [Track P · M3](../../training/track-p-people-and-management/p03-communication-and-influence.md) §"Defect narrative for the audience that will actually fix it".
> Audience: the dev who will fix it.
> For the executive-audience version of the same incident, see [`release-brief-exec-template.md`](./release-brief-exec-template.md).
> For the customer-facing note, see [`incident-customer-note-template.md`](./incident-customer-note-template.md).
>
> This extends the engineer-default [`defect-report` skill](../../.agents/skills/defect-report/SKILL.md) with two extra sections (verify-after-fix, suite improvement) that the engineer audience needs but the dashboard pipeline does not.

## Summary (1-2 sentences)

<what's broken, in the engineer's vocabulary>

## Severity / Module / Environment

| Field | Value |
|---|---|
| Severity | <severity:critical \| major \| minor \| trivial> |
| Module | <module:auth \| cart \| checkout \| profile \| product \| compare \| wishlist \| home \| infra \| ai> |
| Environment | <env=qa \| uat \| staging \| prod> · build <commit-sha> · browser <chromium/firefox/webkit> · OS <…> |

## Steps to reproduce

1. <step>
2. <step>
3. <step>

## Expected vs actual

**Expected:** <reference: spec / `Messages.*` / `TRANSLATIONS.*` / requirement doc>

**Actual:** <observed behaviour, with quotes from logs / screenshots>

## Evidence

- Trace: `<artifact-url>`
- Screenshot: `<path>`
- Console / network logs: `<paste relevant snippet>`

## Suspect commit / area

`<commit-sha>` — <author> — `<file-path>` (line <n>)

## Related test (the one that should have caught it)

`<spec-file-path>` · tag: `@TC-<id>` · current verdict: <pass \| fail \| missing>

## Workaround (if any, for support / customer)

<…>

---

## What to verify after the fix (extra for engineer audience)

> List the test cases that should now pass; the dev runs these before claiming "fixed".

- [ ] <e.g. "tests/ui/test-cart.spec.ts → @TC-203 expired-discount path">
- [ ] <…>
- [ ] <…>

## What we'd improve in the test suite to catch this earlier

> The compounding ask: the bug is the symptom; the missing test is the disease.

- <e.g. "Add boundary case for expired discount code in @P2 cart suite (currently 87 % @P2 coverage; SLO is 95 %)">
- <e.g. "Wire SLO error-budget alert so we'd have caught the coverage gap before the incident">

---

> Source: [Track P · Module 3](../../training/track-p-people-and-management/p03-communication-and-influence.md) · [`defect-report` skill](../../.agents/skills/defect-report/SKILL.md) (engineer baseline this extends)
