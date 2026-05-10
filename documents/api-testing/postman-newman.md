# Postman + Newman — CI Integration Guideline

> How to put a [Postman collection](./postman.md) in this repo's CI **without** drifting from the existing [`tests/api/`](../../tests/api/) regression gate. Newman is the official CLI runner for Postman collections; it consumes the same `*.postman_collection.json` you exported from the GUI and produces JUnit / HTML / Allure reports the dashboard already understands.

## When to put a collection in CI

Use Newman in CI when:

- 🔁 The collection covers a **smoke set** (5-10 requests) you want to run on every deploy
- 📜 Stakeholders expect a **clickable HTML report** alongside the engineer-facing Allure
- 📡 You need a **scheduled probe** of a production endpoint (e.g. nightly `@smoke`)
- 🧱 You're in a **transition period** — the team's API tests live in Postman and porting to TS will take 2-3 sprints

Avoid Newman when:

- 🚫 The collection has >50 requests with complex chains — port to TS first; chains are unmaintainable in JSON
- 🚫 The same coverage already exists in [`tests/api/`](../../tests/api/) — pick one source of truth
- 🚫 You need cross-browser or UI assertions — that's not what Newman does

## Install

Newman is a Node CLI. Two install patterns:

```bash
# Pattern A — repo-local devDependency (recommended; pinned version in lockfile)
npm install --save-dev newman newman-reporter-html newman-reporter-htmlextra newman-reporter-junitfull

# Pattern B — global (use only on dev machines for one-off runs)
npm install -g newman newman-reporter-htmlextra
```

Add to `package.json` (matches the repo's existing `test:*` script style):

```json
{
  "scripts": {
    "api:newman": "newman run documents/api-testing/collections/99-smoke.postman_collection.json -e documents/api-testing/environments/qa.postman_environment.json --reporters cli,htmlextra,junitfull --reporter-htmlextra-export reports/api/newman.html --reporter-junitfull-export reports/api/junit.xml",
    "api:newman:uat": "ENV=uat newman run documents/api-testing/collections/99-smoke.postman_collection.json -e documents/api-testing/environments/uat.postman_environment.json --reporters cli,htmlextra,junitfull --reporter-htmlextra-export reports/api/newman-uat.html --reporter-junitfull-export reports/api/junit-uat.xml",
    "api:newman:cart": "newman run documents/api-testing/collections/01-cart.postman_collection.json -e documents/api-testing/environments/qa.postman_environment.json --reporters cli,htmlextra,junitfull --reporter-htmlextra-export reports/api/newman-cart.html --reporter-junitfull-export reports/api/junit-cart.xml"
  }
}
```

## Newman CLI flags this repo standardises on

| Flag | Why |
|---|---|
| `--reporters cli,htmlextra,junitfull` | CLI for live tail; HTMLextra for stakeholders; JUnitFull for the dashboard |
| `--reporter-htmlextra-export reports/api/<name>.html` | One file per collection, under the standard `reports/` artifact path |
| `--reporter-junitfull-export reports/api/junit-<name>.xml` | Mirrors the contract Playwright already emits |
| `--bail folder` | Stop a folder when one request in it fails — preserves test isolation across folders |
| `--timeout-request 10000` | Match the 10s budget set by [`tests/api/`](../../tests/api/) |
| `--delay-request 0` | No artificial delay; collections that need backoff handle it in scripts |
| `--insecure` | **Forbidden in CI**, allowed only on local for self-signed certs |
| `--silent` | **Forbidden** — kills the CLI reporter; debugging blind |

## Environment files at run time

Use the `.env` → `.postman_environment.json` sync pattern from [`postman.md`](./postman.md) §Environments. CI runs the sync as a pre-step:

```bash
# In CI, before npm run api:newman
node scripts/sync-postman-env.ts ${ENV:-qa}
npm run api:newman
```

The synced JSON contains real secrets at run time and **must not** be uploaded as a build artifact. Add to `.gitignore` and the artifact-exclude list.

## Reporters — what each is for

| Reporter | Audience | Path | Used by |
|---|---|---|---|
| `cli` | Engineer reading CI logs | stdout | Live debugging |
| `htmlextra` | Stakeholders, PMs, support | `reports/api/newman.html` | Linked from PR comment |
| `junitfull` | The QA Metrics dashboard | `reports/api/junit.xml` | Dashboard's API panel |
| `allure-newman` | Allure-fluent engineers | `reports/api/allure-results/` | Optional; merges into the existing Allure tree |

The `junitfull` (not plain `junit`) variant matters — it preserves Postman's per-assertion granularity. Plain `junit` collapses all assertions in a request into one test case, which silently undercounts failures.

### Optional — feed Allure

If your team uses Allure (the repo already wires this in [`ci/shared-conventions.md`](../ci/shared-conventions.md)), add the Allure reporter:

```bash
npm install --save-dev newman-reporter-allure
newman run <collection> -e <env> --reporters cli,allure --reporter-allure-export reports/api/allure-results/
allure generate reports/api/allure-results/ -o reports/api/allure-html/ --clean
```

The `reports/api/allure-results/` folder feeds into the existing Allure pipeline alongside Playwright results.

## Exit-code contract

Newman exits with a non-zero code on **any** failure:

| Exit code | Meaning |
|---|---|
| 0 | All requests passed all assertions |
| 1 | At least one assertion failed (test failure — defect candidate) |
| 2 | Newman couldn't run (collection invalid, env missing, network error — infra failure) |

This matches Playwright's exit-code contract — your CI pipeline's "stop the job" rules apply identically. The dashboard's API panel **separates** the two failure modes (test-failure vs infra-failure) by reading the JUnit's `<error>` vs `<failure>` elements.

## GitHub Actions — concrete snippet

Drop into `.github/workflows/playwright.yml` after the existing `test:` matrix job, **as a separate job** (`api-newman`) so a Newman failure doesn't block UI test reporting:

```yaml
api-newman:
  name: API Smoke (Newman)
  runs-on: ubuntu-latest
  needs: install
  strategy:
    fail-fast: false
    matrix:
      env: [qa, uat]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: npm
    - run: npm ci

    # Sync env from secrets → Postman env JSON
    - name: Sync Postman environment from .env
      env:
        ENV: ${{ matrix.env }}
        # secrets must be projected into env vars first; never echoed
        USERNAME: ${{ secrets.QA_USERNAME }}
        PASSWORD: ${{ secrets.QA_PASSWORD }}
      run: node scripts/sync-postman-env.ts $ENV

    - name: Run Newman smoke
      env:
        ENV: ${{ matrix.env }}
      run: npm run api:newman:${{ matrix.env }}

    - name: Upload Newman artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: newman-${{ matrix.env }}-${{ github.run_id }}
        path: |
          reports/api/newman-${{ matrix.env }}.html
          reports/api/junit-${{ matrix.env }}.xml
        retention-days: 14
        if-no-files-found: error

    # The synced env file contains secrets — never upload it
    - name: Verify no secret artifact leaked
      if: always()
      run: |
        if find . -name '*.postman_environment.json' -not -path './documents/api-testing/environments/*-template.json' | grep -q .; then
          echo "::error::Synced env file would leak; check .gitignore + upload-artifact path"
          exit 1
        fi
```

For the matching GitLab CI implementation, follow the structure in [`ci/gitlab-ci.md`](../ci/gitlab-ci.md) — the job shape is identical; only the YAML keys differ.

## GitLab CI — concrete snippet

```yaml
api-newman:
  stage: test
  image: node:20
  parallel:
    matrix:
      - ENV: [qa, uat]
  variables:
    USERNAME: $QA_USERNAME       # masked GitLab CI/CD variable
    PASSWORD: $QA_PASSWORD       # masked GitLab CI/CD variable
  before_script:
    - npm ci
    - node scripts/sync-postman-env.ts $ENV
  script:
    - npm run api:newman:$ENV
  artifacts:
    when: always
    paths:
      - reports/api/newman-${ENV}.html
      - reports/api/junit-${ENV}.xml
    reports:
      junit: reports/api/junit-${ENV}.xml
    expire_in: 14 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

## Promoting failures to defects

A Newman CI failure should produce **the same Jira issue** a Playwright failure would. Wire the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill to the Newman JUnit:

```bash
# In CI, after Newman fails:
npm run defect:from-junit -- reports/api/junit-qa.xml \
  --severity major \
  --module cart \
  --evidence reports/api/newman-qa.html
```

The skill emits a Jira-ready issue using the canonical `bug` + `severity:*` + `module:*` taxonomy from [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). The HTML report URL becomes the evidence link.

## Trend continuity

Newman runs feed the same `reports/run-trend.json` the Playwright pipeline maintains (see [`ci/shared-conventions.md`](../ci/shared-conventions.md) §Trend continuity). Append after each run:

```bash
# Pseudo-code; the actual helper lives in scripts/append-trend.ts
npm run trend:append -- \
  --source api-newman-${ENV} \
  --pass $(jq '.run.stats.assertions.total - .run.stats.assertions.failed' reports/api/junit-qa.xml) \
  --fail $(jq '.run.stats.assertions.failed' reports/api/junit-qa.xml) \
  --duration $(jq '.run.timings.completed - .run.timings.started' reports/api/junit-qa.xml)
```

The dashboard's API panel reads from the same trend file as the UI panel, so the QA-overall pass-rate is honest across both lanes.

## Anti-patterns this guideline rules out

- ❌ Running Newman in CI without `--reporters junitfull` (dashboard will silently miss data)
- ❌ Uploading the synced `.postman_environment.json` as a build artifact (leaks secrets)
- ❌ Using `--silent` (debugging will be impossible when CI goes red)
- ❌ Newman failures that don't produce a defect (eats signal; same issue as Playwright failures without [`defect-report`](../../.agents/skills/defect-report/SKILL.md))
- ❌ Separate "Newman dashboard" — must merge into the existing [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html), not a fork
- ❌ Long-running collections (>5 min wall time) on every PR — schedule them nightly, not per-PR

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Newman exit 1 but PR says "all green" | Job's `continue-on-error: true` set somewhere | Remove; set `fail-fast: false` on the matrix instead |
| `Error: Could not find environment` | Env JSON didn't sync (CI step ran out of order) | Move sync step `before` Newman run; verify `path` in artifact upload |
| Pre-request login script fails locally but works in CI | `pm.environment` has stale value from another collection | Use `pm.environment.unset` at end of cleanup folder |
| HTMLextra report missing screenshots | Newman doesn't capture screenshots (no browser); switch to Playwright if visual evidence required | Promote to `tests/api/` |
| Schema check passes locally, fails in CI | Env mismatch — local on `qa`, CI on `uat`; payload differs | Always specify `--env-var ENV=<env>` AND check `pm.environment.name` in tests |

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md) — author the collection first
- [`apidog.md`](./apidog.md) — alternative CLI runner (`apidog-cli`) for Apidog projects
- [`tool-comparison.md`](./tool-comparison.md) — when Newman is the right answer vs. Playwright vs apidog-cli
- [`ci/shared-conventions.md`](../ci/shared-conventions.md) — the platform-neutral CI contract Newman must preserve
- [`ci/github-actions.md`](../ci/github-actions.md), [`ci/gitlab-ci.md`](../ci/gitlab-ci.md) — host pipelines this job lives inside
- [`defect-report`](../../.agents/skills/defect-report/SKILL.md) — converts Newman JUnit failures to Jira issues
