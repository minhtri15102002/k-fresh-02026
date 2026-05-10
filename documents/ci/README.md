# CI/CD Guidelines (GitHub & GitLab)

> Source-of-truth folder for **how this repo's QA pipeline runs in CI**. One platform-neutral contract, two platform-specific implementations. Rooted in the actual workflow at [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml) — not generic CI advice.

## The picture

```
┌──────────┐  ┌──────────┐  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌────────┐
│ install  │→ │ pre-test │→ │ test │→ │ post-test│→ │ assemble │→ │ deploy │
└──────────┘  └──────────┘  └──────┘  └──────────┘  └──────────┘  └────────┘
   deps         restore       matrix     export        gather        Pages /
   browsers     trend         per-env    dashboard     artifacts     PR comment
   java/        artifact      Playwright PDF + live    from matrix
   allure                                HTML
                                         allure-gen
```

The **shape** of the pipeline (six stages, three-env matrix, `qa-metrics-dashboard-${env}` artifact contract, `run-trend.json` continuity, deploy gating) is identical across platforms. Only the syntax differs.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`shared-conventions.md`](./shared-conventions.md) | The platform-neutral contract — stages, env matrix, env vars, artifact names, trend continuity, secrets, anti-patterns, migration checklist | Always read first |
| [`github-actions.md`](./github-actions.md) | Concrete GitHub Actions implementation, anchored to [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml). Triggers, permissions, the `test` matrix job, the `deploy-pages` job, branch protection, trouble-shooting | Wiring or maintaining the GitHub workflow |
| [`gitlab-ci.md`](./gitlab-ci.md) | The same setup translated to GitLab CI/CD. Reference layout, trend-restore via the artifact-download API, `pages:` job, MR approval rules, runner concerns | Self-hosted GitLab teams; migrating from GitHub |
| [`docker.md`](./docker.md) | Containerised lane — pinned Playwright base image, `Dockerfile` / `.dockerignore` / `docker-compose.yml` contracts, CI integration patterns, image scanning, local CI reproduction | Adding a Docker lane, bumping the base image, debugging a CI failure locally |

## Reading order

1. **`shared-conventions.md`** — the contract every platform must preserve. If you skip this, you'll diverge silently.
2. **`github-actions.md`** OR **`gitlab-ci.md`** — pick the one you actually run on.
3. **`docker.md`** — only if you're containerising the test lane (optional, but the only reliable way to reproduce a CI failure locally).
4. The other platform doc — only when you migrate.

## Conventions used here (cross-references)

- **Local pre-push gate** — CI's `lint` stage **must** match `npm run check:all` exactly; see [`../husky-guidelines.md`](../husky-guidelines.md).
- **Test tags** — `TEST_TYPE` greps against the tags defined in [`../../prompts/core/test-tags.md`](../../prompts/core/test-tags.md).
- **Defect fetch** — the post-test step calls `npm run fetch:defects`, which reads the issue surface defined in [`../jira/integration.md`](../jira/integration.md).
- **Dashboard contract** — the `artifacts/qa-metrics-dashboard.*` files are produced by `scripts/export-dashboard-pdf.ts` and rendered from the template described in [`../../wiki/QA-Metrics-Dashboard.md`](../../wiki/QA-Metrics-Dashboard.md).
- **DevOps skills** — agent-side helpers when tuning the pipeline:
  - [`../../.agents/skills/ci-optimizer/SKILL.md`](../../.agents/skills/ci-optimizer/SKILL.md) — wall-time + cost tuning.
  - [`../../.agents/skills/parallel-sharding/SKILL.md`](../../.agents/skills/parallel-sharding/SKILL.md) — worker / shard sizing.
  - [`../../.agents/skills/docker-runner/SKILL.md`](../../.agents/skills/docker-runner/SKILL.md) — containerised local + CI runs.

## Out of scope

This folder is **not**:

- A general CI tutorial — Playwright's [official CI guide](https://playwright.dev/docs/ci) covers the basics.
- A reference for `actions/*` or `glab` syntax — the official platform docs are linked at the bottom of each file.
- A licence to fork the workflow into many small ones — the trend-continuity contract assumes one canonical pipeline per platform.
- Permission to vary the artifact names — the dashboard, the Pages deploy, and downstream automation all key off `qa-metrics-dashboard-${env}`. Rename it and three things break silently.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`shared-conventions.md`](./shared-conventions.md) | ✅ v1 (six-stage contract, env-matrix, artifact contract, anti-patterns, migration checklist) | Platform |
| [`github-actions.md`](./github-actions.md) | ✅ v1 (mirrors current `playwright.yml` 1:1) | Platform |
| [`gitlab-ci.md`](./gitlab-ci.md) | ✅ v1 (parity translation; tested layout — adopt as starting point) | Platform |
| [`docker.md`](./docker.md) | ✅ v1 (image / compose / .dockerignore contracts, CI integration, scanning, local CI reproduction) | Platform |

## Phase-7+ connection

For the leadership / platform framing of "what CI *should* be in an AI-augmented QA org", see:

- [`../../training/phase-7-ai-era-leadership/README.md`](../../training/phase-7-ai-era-leadership/README.md) — CI as the always-on quality conveyor.
- [`../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md`](../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) — CI positioned as the runtime that hosts the platform's gates.
