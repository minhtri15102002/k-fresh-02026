---
name: 🌀 Flaky test report
about: Track an automated test that fails intermittently on the same commit.
title: "[FLAKY] "
labels: "flaky, test-quality"
assignees: ''

---

<!--
A test is "flaky" if it produces different results (pass/fail) on the SAME code without intervention.
Reference: training/phase-5-scale/29-flaky-test-triage.md
-->

## Test
| Field | Value |
|---|---|
| Spec file | `tests/.../<file>.spec.ts` |
| Test ID | `TC-...` |
| Test title | <!-- exact `test(...)` title --> |
| Tags | <!-- e.g. @P1 @critical @smoke @ui @cart --> |
| Project / browser | <!-- chromium / firefox / webkit --> |
| Environment | <!-- qa / uat / staging / local --> |

## Symptom
<!-- What does the failure look like? Paste the assertion error and/or "Call log" excerpt. -->

```
Error: expect(received).toBeVisible()
…
```

## Frequency
<!-- Help us decide fix vs quarantine. -->
- Failed `___` of last `___` runs (e.g. 3 of 30 → 10% flake rate)
- First seen: <!-- run URL or build #-->
- Pattern: <!-- always 2nd retry / random / only on Friday CI / time-of-day, etc. -->

## Suspected category
<!-- Pick the closest one — see Module 29 of the training. -->
- [ ] **Timing** — race between action & assertion (auto-wait gap)
- [ ] **Animation** — "Element not stable" in trace
- [ ] **Isolation leak** — passes alone, fails in suite (shared state / data)
- [ ] **Environment** — passes locally, fails in CI (headless / fonts / locale / TZ)
- [ ] **Infrastructure** — random 502 / timeout from SUT or CDN
- [ ] **Test data drift** — seed account or fixture changed
- [ ] **Selector ambiguity** — multiple matches for the locator
- [ ] **Network / CDN** — asset 404 or load delay
- [ ] **Parallel collision** — two tests modify the same SUT entity
- [ ] **Unknown** — needs investigation

## Evidence
<!-- Drop here:
     - trace.zip (open with `npx playwright show-trace trace.zip`)
     - Failure screenshot
     - CI run links (passing & failing on the same SHA)
     - `git log -1` of the SHA
-->

## Decision
- [ ] **Fix now** — root cause is in our code; PR ETA: …
- [ ] **Quarantine with `test.fixme`** — referencing this issue; investigation continues
- [ ] **Escalate** — infra / SUT bug owned outside this repo (assignee + ticket: …)

## Linked artifacts (optional)
- Related bug issue: #
- PR proposing the fix: #
- Owner / assignee:

---

<sub>How we triage flakes: <a href="../blob/main/training/phase-5-scale/29-flaky-test-triage.md"><code>training/phase-5-scale/29-flaky-test-triage.md</code></a>. Flake budget: <strong>&lt; 1%</strong> of runs.</sub>
