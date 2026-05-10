---
name: docker-runner
description: Containerizes the ai-qa-training Playwright + TypeScript suite for reproducible local and CI execution. Produces a small, deterministic, version-pinned Docker image plus matching `docker-compose.yml`, `.dockerignore`, and run invocations that honor the existing `env.loader.ts` → `profiles/.env.<ENV>` mechanism. Use when adding Docker support, refreshing the base image to match `package.json`, or wiring a containerized CI lane.
---

# Docker Runner

This skill builds the canonical container image for running this project's Playwright tests. It pins the base image to the exact Playwright version in `package.json`, caches `npm ci` aggressively, never bakes secrets, and keeps the runtime contract identical between laptop and CI.

## When to use this skill

Activate this skill when the user:
- Asks to "containerize the tests", "add a Dockerfile", or "run e2e in Docker".
- Reports drift between local and CI runs that a pinned image would solve.
- Bumps the Playwright version and needs the base image tag updated.
- Needs a `docker-compose.yml` for local smoke or a `docker run` invocation for CI shards.
- Asks for a Trivy scan / image-size budget.

Companion skills: `ci-optimizer` (workflow integration), `parallel-sharding` (per-shard CI invocation).

## How to use it

### Step 1 — Pin the base image
1. Read `npx playwright --version` (or `package.json` `playwright` dep).
2. Set the image tag to that exact version on `-jammy`:
   ```dockerfile
   FROM mcr.microsoft.com/playwright:v<EXACT_VERSION>-jammy
   ```
3. Never use `:latest`. Single-stage is fine for a test image; use multi-stage only when shipping a runtime image without dev deps.

### Step 2 — Use the canonical Dockerfile
The reference template lives in `prompts/devops/docker-runner.md` (look for "DOCKERFILE TEMPLATE"). Key invariants:
- BuildKit cache mount on `/root/.npm` for `npm ci`.
- `ENV NODE_ENV=test CI=true HUSKY=0`.
- `WORKDIR /workspace` so the `tsconfig.json` path aliases (`@pages/*`, `@locators/*`, …) resolve.
- Do **not** re-run `npx playwright install` — the base image already ships browsers.
- `ENTRYPOINT ["npx", "playwright"]`, `CMD ["test"]`.

### Step 3 — Produce `.dockerignore`
Exclude:
```
node_modules
playwright-report
test-results
.git
.github
documents
*.md
profiles/.env.*.local
.DS_Store
```
Keep `profiles/.env.<env>` (committed defaults are non-secret); secrets come from `--env-file` or compose `env_file:`.

### Step 4 — Compose for local
Use the template in `prompts/devops/docker-runner.md` (look for "DOCKER COMPOSE TEMPLATE"). Required knobs:
- `shm_size: '1gb'` and `ipc: host` (Chromium crashes otherwise).
- `env_file:` chains `profiles/.env.${ENV:-qa}` then `profiles/.env.${ENV:-qa}.local`.
- Mount source folders read-only; mount `playwright-report` and `test-results` read-write so artifacts persist on host.
- Never mount host `node_modules` into the container.

### Step 5 — Invocations
Local smoke (Chromium):
```bash
ENV=qa TAGS='@smoke' PROJECT=chromium docker compose run --rm e2e
```

Single spec:
```bash
docker compose run --rm e2e test tests/ui/test-cart.spec.ts --project=chromium
```

CI shard:
```bash
docker run --rm \
  --shm-size=1g --ipc=host \
  --env-file profiles/.env.staging \
  -e ENV=staging -e LOGIN_USERNAME -e LOGIN_PASSWORD \
  -v "$PWD/playwright-report:/workspace/playwright-report" \
  -v "$PWD/test-results:/workspace/test-results" \
  kfresh/e2e:${SHA} \
  test --grep "@regression" --shard=${SHARD} --reporter=blob
```

### Step 6 — Validate and tag
1. `docker buildx build` with cache; record cold and warm build time.
2. Run `@smoke` locally with `ENV=qa`; verify reports land in `./playwright-report/` on the host.
3. Tag with the commit SHA in CI (`kfresh/e2e:${GITHUB_SHA}`); never push `:latest`.
4. Scan with `trivy image kfresh/e2e:<sha>` and fail the build on HIGH+ CVEs.

### Step 7 — Output
Use this template in the PR description:
```
## Image
- Base: mcr.microsoft.com/playwright:v<X.Y.Z>-jammy
- Size: <MB>
- Vulnerabilities (HIGH+): N

## Files Generated / Updated
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `documents/automation-framework/docker.md` (usage guide)

## Run Commands
<commands>

## Validation
- Build time (cold / warm cache): <s> / <s>
- Smoke run time inside container: <s>
- Artifacts: ./playwright-report size <MB>, ./test-results size <MB>
```

## Best Practices

**Always**
- Pin the Playwright base image to the exact version in `package.json`.
- Set `shm_size: '1gb'` and `ipc: host` for Chromium.
- Add a `.dockerignore` excluding `node_modules`, `playwright-report`, `test-results`, `.git`, `documents`, and `*.local` env files.
- Tag images with the commit SHA in CI and run a `trivy` scan.
- Pass env via `env_file:` or `--env-file`; rely on `env.loader.ts` to read `profiles/.env.${ENV}`.

**Never**
- Use `:latest` for the base or app image.
- Run `npx playwright install` if the base image already includes the channel you need.
- Bake credentials into the image. Secrets live in `profiles/.env.<env>.local` (gitignored) or in CI secret stores.
- Mount host `node_modules` into the container (Linux/macOS native module mismatch).
- Duplicate env-loading logic — `env.loader.ts` is the single source of truth.

**Decision tree — when to break the defaults**
- Need Firefox or WebKit only? → still use the same Playwright base image; pass `--project=firefox|webkit`. Browsers are bundled.
- Need a custom Chromium channel? → re-enable `RUN npx playwright install <channel> --with-deps` and explicitly comment why.
- Need a slim runtime image? → use multi-stage; copy only `package*.json`, `node_modules`, `tests`, `pages`, `locators`, `models`, `data`, `utilities`, `translations`, `profiles`, `playwright.config.ts`, `tsconfig.json`, `env.loader.ts`.
- Image size > 1.5 GB or HIGH+ CVE on scan? → halt; re-pin base, prune dev deps, re-scan.
