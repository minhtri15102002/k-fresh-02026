# Docker Guideline

> How this repo runs the Playwright + TypeScript suite **inside a container** — for laptop parity with CI, deterministic builds, and a clean CI lane that doesn't depend on the runner's installed Node / browsers / Java. Read [`shared-conventions.md`](./shared-conventions.md) first; this doc only covers the container layer.
>
> Companion skill: [`../../.agents/skills/docker-runner/SKILL.md`](../../.agents/skills/docker-runner/SKILL.md) — generates the same artifacts this doc describes.

---

## TL;DR

| You want to… | Do this |
|---|---|
| Run the full suite locally in a container | `ENV=qa docker compose run --rm e2e test --project="Desktop Chrome"` |
| Run a single tag | `ENV=qa TEST_TYPE=@smoke docker compose run --rm e2e test --grep "@smoke"` |
| Reproduce a CI failure on your laptop | Pull the image CI built (`<registry>/e2e:${SHA}`) and run the same `docker run …` command from §6 |
| Bump the base image after a Playwright upgrade | Change `@playwright/test` in `package.json`, then update the `FROM` line and the `image:` field in [`gitlab-ci.md`](./gitlab-ci.md) §2 to the **same exact** version |
| Get reports out of the container | Bind-mount `./playwright-report` and `./test-results` (compose does this by default) |
| Scan the image for CVEs | `trivy image <registry>/e2e:${SHA}` |

---

## 1. Why containerise

| Pain point on bare runners / laptops | What containerising solves |
|---|---|
| "Works on my machine" — different Node, different system libs | One pinned image, identical bytes everywhere |
| Playwright browsers re-downloaded every run | Browsers baked into the base image (`mcr.microsoft.com/playwright:vX.Y.Z-jammy`) |
| Java / Allure CLI install drift | Bake them once in a layer, cache forever |
| CI runner upgrades silently break tests | The runner's OS no longer matters; only the container does |
| Hard to reproduce a flaky CI run locally | Pull the SHA-tagged image CI used; identical environment |

Containerising is **not** for free. The trade-offs:

- Cold builds add ~1–2 min to the first CI run after a base bump.
- Image storage costs (registry / cache) — budget ~1.6 GB per image.
- One more thing to keep version-pinned (the base image tag).

If your team can't afford those, stay on `actions/setup-node@v5` + `npx playwright install --with-deps` ([`github-actions.md`](./github-actions.md) §4) and skip this doc. The pipeline contract in `shared-conventions.md` works either way.

---

## 2. The image contract

The canonical image is **single-stage, pinned, secret-free**:

```dockerfile
# syntax=docker/dockerfile:1.7
ARG PW_VERSION=1.59.1
FROM mcr.microsoft.com/playwright:v${PW_VERSION}-jammy

ENV NODE_ENV=test \
    CI=true \
    HUSKY=0 \
    DEBIAN_FRONTEND=noninteractive

# Allure CLI runs on the JVM; the base image already has Node + browsers.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Cache npm install in a BuildKit cache mount (warm builds finish in <30s).
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# `allure` is a regular dev-dep already in package.json; do NOT
# `npm install -g allure` here — that creates a duplicate JS install.
COPY . .

ENTRYPOINT ["npx", "playwright"]
CMD ["test"]
```

**Invariants (do not change without updating this doc):**

- `FROM mcr.microsoft.com/playwright:v<EXACT_VERSION>-jammy` — never `:latest`, never `:next`.
- `WORKDIR /workspace` so the `tsconfig.json` path aliases (`@pages/*`, `@locators/*`, …) resolve.
- `ENV CI=true` so `playwright.config.ts` picks up CI defaults (retries=2, workers=1).
- `ENV HUSKY=0` so `npm ci` doesn't install git hooks during `prepare`.
- Browsers come from the base image. **Do not re-run** `npx playwright install`.
- `ENTRYPOINT ["npx", "playwright"]` so `docker run … test --grep …` reads naturally.

The image **must** track the version of `@playwright/test` declared in `package.json`. A mismatch between the host CLI and the bundled browsers is a flaky-test factory. The `docker-runner` skill bumps both atomically.

---

## 3. `.dockerignore` contract

```
# Build / test outputs
node_modules
playwright-report
test-results
allure-results
allure-report
artifacts
reports

# VCS / IDE
.git
.github
.gitlab
.idea
.vscode
.DS_Store

# Docs / notes (not needed inside the image)
documents
training
wiki
*.md
!README.md

# Local secrets — only committed defaults travel
profiles/.env.*.local
```

Two non-obvious rules:

1. **Keep `profiles/.env.<env>` in the image.** They are committed defaults (no secrets); the runtime overrides via `--env-file` or `env_file:` (see §5).
2. **Exclude `node_modules`.** Re-installing inside the container is faster than COPY-ing a host build of native modules that may not match the container's libc.

---

## 4. `docker-compose.yml` for local dev

```yaml
# docker-compose.yml — laptop convenience wrapper.
services:
  e2e:
    build:
      context: .
      args:
        PW_VERSION: 1.59.1     # keep in sync with package.json
    image: ai-qa-training/e2e:local
    shm_size: '1gb'             # Chromium crashes below this
    ipc: host                   # ditto
    working_dir: /workspace
    env_file:
      - profiles/.env.${ENV:-qa}
      - profiles/.env.${ENV:-qa}.local   # gitignored; missing is fine
    environment:
      ENV: ${ENV:-qa}
      BROWSER: ${BROWSER:-Desktop Chrome}
      TEST_TYPE: ${TEST_TYPE:-all}
      SPEC_FILE: ${SPEC_FILE:-}
    volumes:
      # Read-only source — keeps the host as source of truth during `compose run`.
      - ./tests:/workspace/tests:ro
      - ./pages:/workspace/pages:ro
      - ./locators:/workspace/locators:ro
      - ./models:/workspace/models:ro
      - ./data:/workspace/data:ro
      - ./utilities:/workspace/utilities:ro
      - ./playwright.config.ts:/workspace/playwright.config.ts:ro
      # Read-write artifact mounts — reports survive on the host.
      - ./playwright-report:/workspace/playwright-report
      - ./test-results:/workspace/test-results
      - ./allure-results:/workspace/allure-results
      - ./reports:/workspace/reports
      - ./artifacts:/workspace/artifacts
    # Inherits ENTRYPOINT ["npx","playwright"] from the image; pass args after `run`.
```

**Required knobs (do not drop):**

- `shm_size: '1gb'` and `ipc: host` — Chromium will hang or crash without these on Linux hosts.
- `env_file:` chains the committed default and the gitignored `.local`. Order matters: later files win.
- Read-only source mounts mean editing a spec on the host re-runs cleanly without rebuilding.
- **Never** mount host `node_modules` into the container (Linux ↔ macOS native-module skew).

---

## 5. Env-loading parity

The container picks up the same env layers a developer would on bare metal:

```
profiles/.env.<env>          ← committed defaults (read first)
profiles/.env.<env>.local    ← gitignored personal overrides (read second)
docker run -e VAR=…          ← per-invocation override (read last, wins)
CI secret store              ← injected via -e or --env-file at run time only
```

Rules:

- **Test secrets** (login passwords, API keys) live in `profiles/.env.<env>.local` locally and the CI secret store remotely. They never enter the image.
- **Workflow tokens** (`GH_TOKEN`, `GITLAB_TOKEN`) are passed at run time, not built in.
- The single source of truth for *which* file gets read is `env.loader.ts` — Docker only delivers the file to the right path; it does not re-implement loading.

If a developer adds a new env var that tests need, they must update **both** `profiles/.env.<env>` (with a non-secret default) **and** the secret store, in that order. Skipping the first breaks the container's first-time-run experience.

---

## 6. CI integration

This section shows the canonical invocations only. The full pipeline contract is in [`shared-conventions.md`](./shared-conventions.md) §1; the platform syntax is in [`github-actions.md`](./github-actions.md) and [`gitlab-ci.md`](./gitlab-ci.md). Containerisation does **not** change the contract — same six stages, same artifact names, same trend continuity.

### 6.1 GitHub Actions (containerised lane)

Two ways to use the image. Pick one — don't mix.

**Option A — `container:` job-level (simpler, slower start).** Replaces `actions/setup-node`, `npm ci`, `npx playwright install`, and the Java install. The job runs *inside* the container.

```yaml
test:
  runs-on: ubuntu-latest
  container:
    image: ghcr.io/${{ github.repository }}/e2e:${{ github.sha }}
    options: --shm-size=1g --ipc=host
  strategy:
    matrix:
      env: [qa, staging, uat]
  env:
    ENV: ${{ matrix.env }}
    CI: 'true'
  steps:
    - uses: actions/checkout@v5
    - name: Restore previous run-trend.json    # see github-actions.md §4
      env: { GH_TOKEN: ${{ github.token }} }
      continue-on-error: true
      run: |
        # …same trend-restore script as github-actions.md §4
    - name: Run Playwright
      run: npx playwright test --project="Desktop Chrome"
    - name: Export QA Metrics Dashboard
      if: ${{ !cancelled() }}
      env: { GH_TOKEN: ${{ github.token }} }
      run: npm run export:dashboard
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: qa-metrics-dashboard-${{ matrix.env }}
        path: |
          artifacts/qa-metrics-dashboard.pdf
          artifacts/qa-metrics-dashboard.live.html
          reports/run-summary.json
          reports/run-trend.json
          reports/defects.json
        retention-days: 30
```

**Option B — `docker run` step (more explicit, faster cold start).** The job runs on the host runner; only the test step uses the container.

```yaml
- name: Run Playwright in container
  env:
    ENV: ${{ matrix.env }}
  run: |
    docker run --rm \
      --shm-size=1g --ipc=host \
      --env-file profiles/.env.${ENV} \
      -e ENV -e CI=true \
      -e GH_TOKEN=${{ github.token }} \
      -v "$PWD/playwright-report:/workspace/playwright-report" \
      -v "$PWD/test-results:/workspace/test-results" \
      -v "$PWD/allure-results:/workspace/allure-results" \
      -v "$PWD/reports:/workspace/reports" \
      -v "$PWD/artifacts:/workspace/artifacts" \
      ghcr.io/${{ github.repository }}/e2e:${{ github.sha }} \
      test --project="Desktop Chrome"
```

Use **A** when most steps benefit from the image (typical). Use **B** when you need host-side tooling (e.g. `gh`, `aws`) the image doesn't carry.

### 6.2 GitLab CI

The reference layout in [`gitlab-ci.md`](./gitlab-ci.md) §2 already pins `image: mcr.microsoft.com/playwright:v1.59.1-jammy`. To pick up *this* repo's image instead:

```yaml
default:
  image: $CI_REGISTRY_IMAGE/e2e:$CI_COMMIT_SHA   # built by an earlier `build` stage
  interruptible: true
  tags: [docker]
```

Add a `build` stage *before* `test`:

```yaml
stages: [build, lint, test, report, pages]

build-image:
  stage: build
  image: docker:24
  services: [docker:24-dind]
  variables:
    DOCKER_TLS_CERTDIR: '/certs'
  script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY"
    - docker build --build-arg PW_VERSION=1.59.1 -t "$CI_REGISTRY_IMAGE/e2e:$CI_COMMIT_SHA" .
    - docker push "$CI_REGISTRY_IMAGE/e2e:$CI_COMMIT_SHA"
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      changes: [Dockerfile, package-lock.json, package.json]
    - if: '$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH'
```

The `changes:` rule keeps the build cheap: rebuild only when image inputs changed.

---

## 7. Image lifecycle & tagging

| Tag form | Pushed by | Purpose | Retention |
|---|---|---|---|
| `<registry>/e2e:<sha>` | CI on every `main` push (or every PR if §9 cost is OK) | Reproducible — pin tests to this SHA | 30 days |
| `<registry>/e2e:pw-<X.Y.Z>` | CI when `package-lock.json` changes the Playwright version | Long-lived snapshot per Playwright version | until the next bump |
| `<registry>/e2e:cache` | CI on `main` only | BuildKit cache source (`--cache-from`) | overwritten |
| `<registry>/e2e:latest` | **never** | — | — |

Rules:

- Always tag with the commit SHA. Never re-tag in place.
- Never push `:latest`. It's the single biggest cause of "but it worked yesterday".
- The `pw-<X.Y.Z>` tag exists so a release branch can pin to a known-good base even if `main` has moved.

---

## 8. Security: scan + sign

```bash
# Scan — fail the build on HIGH+ CVEs.
trivy image --severity HIGH,CRITICAL --exit-code 1 <registry>/e2e:${SHA}

# (Optional) Sign — for orgs running Sigstore.
cosign sign --key $COSIGN_KEY <registry>/e2e:${SHA}
```

Wire `trivy` as a **separate** CI job that depends on `build-image`. Don't put it in the test job — a failing scan should block merges, not poison test artifacts.

Anti-patterns:

- ❌ Suppressing all CVEs with `--severity NONE`. If you must accept one, allowlist it explicitly with the CVE ID and a written reason.
- ❌ Scanning only on `main`. The fix loop is twenty times longer when CVEs surface post-merge.

---

## 9. Cost guardrails

| Lever | Default | Notes |
|---|---|---|
| Build only on Dockerfile / lockfile / Playwright-dep changes | ✅ | See `rules:` in §6.2; mirror in `paths-filter` for GitHub |
| BuildKit `--cache-from` from the previous `:cache` tag | ✅ | Warm builds finish in <30 s |
| Image retention 30 days for SHA tags | ✅ | Don't raise — registry storage isn't free |
| Multi-stage runtime image | optional | Only worth it if you ship the image somewhere other than the test job |
| ARM-64 build | optional | If your runner is ARM (e.g. Apple Silicon CI), build `--platform=linux/arm64`; do not push multi-arch unless both lanes need it |

A useful sanity check: `docker history <image>` should show `npm ci` as the largest layer, not `COPY .`. If `COPY .` dominates, your `.dockerignore` is leaking.

---

## 10. Anti-patterns

Each one breaks something downstream:

- ❌ **`FROM mcr.microsoft.com/playwright:latest`.** Silent base bumps = silent breakage. Always pin to the exact `@playwright/test` version.
- ❌ **`RUN npx playwright install --with-deps` in the Dockerfile.** Doubles image size; the base image already has the browsers.
- ❌ **`COPY .env .env` or any `.env*` literal in `COPY`.** Secrets get baked into a layer that lives in the registry forever.
- ❌ **`docker run -v "$PWD:/workspace"` for everything.** Shadows the image's `node_modules` with the host's; native-module skew on macOS hosts is brutal.
- ❌ **Skipping `--shm-size=1g --ipc=host`.** Chromium crashes mid-run with no useful error.
- ❌ **Pushing `:latest`.** See §7.
- ❌ **Building inside the test job.** Build is a separate stage with its own caching; conflating them slows every retry.
- ❌ **Calling `npx playwright install` at runtime "to be safe".** Adds 30–60 s per CI run for zero value when the image is pinned.
- ❌ **Two compose files (`docker-compose.yml` + `docker-compose.ci.yml`) drifting apart.** Keep one file; switch behaviour with env vars.

---

## 11. Trouble-shooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Browser closed unexpectedly` mid-test | `--shm-size` / `ipc` not set | Add `--shm-size=1g --ipc=host` (or `shm_size: '1gb'` + `ipc: host` in compose) |
| `Executable doesn't exist at /ms-playwright/…` | Host CLI version ≠ container browser version | Bump `FROM` tag to match `@playwright/test` exactly |
| `EACCES: permission denied, mkdir '/workspace/playwright-report'` | Host-mounted volume owned by a UID the container can't write | `mkdir -p` on the host before `docker run`, or run with `--user $(id -u)` |
| Reports vanish after the run | Forgot the bind-mount on `playwright-report` / `test-results` | Re-add the `-v` flags in §4 / §6 |
| `npm ci` re-runs every build despite no lockfile change | BuildKit cache mount missing (`# syntax=docker/dockerfile:1.7` and `--mount=type=cache`) | Restore the `# syntax` directive and the cache mount in the `RUN` line |
| Image grows past 2 GB | `node_modules`, `documents/`, or `.git` slipped past `.dockerignore` | Run `docker history` to find the fat layer; tighten the ignore file |
| `gh run download` works on bare runner but not in container | The image doesn't ship the `gh` CLI | Either install it (one `RUN` line, ~30 MB) or run that step on the host (Option B in §6.1) |
| Java not found when running Allure inside the container | The `openjdk-17-jre-headless` install was removed | Restore the `apt-get install` block in the Dockerfile |
| Tests pass locally but fail in CI's container with `connect ECONNREFUSED` | Container can't reach the SUT — host-vs-container networking | Add `--network host` (Linux only) or expose the SUT on `host.docker.internal` (macOS) |

---

## 12. Local reproduction of a CI failure

When CI fails, reproduce the exact bytes:

```bash
# 1. Pull the image CI built (GitHub Container Registry example).
docker pull ghcr.io/<org>/<repo>/e2e:<sha>

# 2. Run with the same env CI used — pull profiles/.env.<env> from the repo at that sha.
git checkout <sha> -- profiles/

# 3. Re-run the exact failing spec.
docker run --rm \
  --shm-size=1g --ipc=host \
  --env-file profiles/.env.staging \
  -e ENV=staging -e CI=true \
  -v "$PWD/playwright-report:/workspace/playwright-report" \
  -v "$PWD/test-results:/workspace/test-results" \
  ghcr.io/<org>/<repo>/e2e:<sha> \
  test tests/ui/test-checkout.spec.ts --project="Desktop Chrome"

# 4. Inspect the trace.
npx playwright show-trace test-results/.../trace.zip
```

This is the single largest reason to containerise. If you can't reproduce CI's failure on your laptop in <5 minutes, the abstraction has leaked — file a defect against this doc.

---

## 13. Migration checklist (bare runner → containerised lane)

```
□ Dockerfile pins Playwright version to @playwright/test exactly
□ .dockerignore excludes node_modules, reports/, playwright-report/, .git, documents/, *.local env files
□ docker-compose.yml sets shm_size: '1gb' and ipc: host
□ Volumes mount playwright-report, test-results, allure-results, reports, artifacts read-write
□ env_file: chains profiles/.env.${ENV} then profiles/.env.${ENV}.local
□ CI build stage tags <registry>/e2e:${SHA} (never :latest)
□ CI test stage uses the SHA-tagged image
□ trivy scan job runs on every build; HIGH+ CVE = block merge
□ Trend-restore step (shared-conventions.md §5) still runs — container or not
□ Artifact contract (shared-conventions.md §4) unchanged — same names, same retention
□ docs/automation-framework/ updated if the local-run command changed
```

If any box can't be checked, the containerisation is incomplete — pause and resolve before deleting the bare-runner lane.

---

## See also

- [`shared-conventions.md`](./shared-conventions.md) — the platform-neutral pipeline contract this doc plugs into
- [`github-actions.md`](./github-actions.md) — bare-runner equivalent + how to swap in a container job
- [`gitlab-ci.md`](./gitlab-ci.md) — already pins the same Playwright base image at the `default:` level
- [`../../.agents/skills/docker-runner/SKILL.md`](../../.agents/skills/docker-runner/SKILL.md) — agent that generates Dockerfile / compose / .dockerignore from this contract
- [`../../.agents/skills/ci-optimizer/SKILL.md`](../../.agents/skills/ci-optimizer/SKILL.md) — wall-time + CPU-minute tuning, with or without containers
- [`../husky-guidelines.md`](../husky-guidelines.md) — `HUSKY=0` in the image is what keeps `npm ci` quiet
- [Playwright Docker docs](https://playwright.dev/docs/docker) — canonical base-image reference
- [BuildKit docs](https://docs.docker.com/build/buildkit/) — `--mount=type=cache` and other cache modes used here
