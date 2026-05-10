# Phase 5 — Quality at Scale

> Going from "tests pass on my machine" to "we ship 1000 tests in 10 minutes across 3 environments with live dashboards."

## Modules

25. [CI/CD with GitHub Actions](./25-ci-cd-github-actions.md)
26. [Parallel sharding & matrix runs](./26-parallel-sharding-and-matrix.md)
27. [Reporting (Allure 3, custom)](./27-reporting-and-allure.md)
28. [QA Metrics dashboard](./28-qa-metrics-dashboard.md)
29. [Flaky test triage](./29-flaky-test-triage.md)

## Phase outcomes

You can:

- Read and modify `.github/workflows/playwright.yml` confidently.
- Cut wall-clock time with shards + workers + projects without losing isolation.
- Generate, host, and interpret Allure 3 + Playwright HTML + custom reports.
- Extend the QA Metrics dashboard (`templates/qa-metrics-dashboard.html`) with a new chart wired to live data.
- Diagnose a flake using trace + retries + reporter attachments and either fix it or quarantine it correctly.

## Phase self-check

- [ ] Add a new matrix axis to `playwright.yml` (e.g. browser × environment) and confirm artifacts collide-free.
- [ ] Add a chart card to the dashboard showing **average test duration trend** sourced from `reports/run-trend.json`.
- [ ] Pick 3 currently-skipped or `.fixme` tests and produce a triage report (root cause + recommended fix).

---

**Prev:** [Phase 4 — API & Cross-cutting](../phase-4-api-and-quality/README.md) · **Next:** [Phase 6 — AI-Assisted QA](../phase-6-ai-assisted-qa/README.md)
