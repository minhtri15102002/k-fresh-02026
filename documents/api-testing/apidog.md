# Apidog — All-in-One API Testing Guideline

> How to use [Apidog](https://apidog.com) — a unified Design + Debug + Test + Mock + Doc tool — as an alternative or complement to [Postman](./postman.md). This guideline matches Apidog Cloud / Desktop **v2.x** (cross-checked May 2026); flag any UI drift in a PR.

## Why a separate tool, not "just use Postman"

Postman is the de-facto standard, but it forces you to **stitch together** multiple workflows: spec lives in Swagger, requests in Postman, mocks in Postman or a separate library, docs auto-generated only at the paid tier. Apidog rolls all five into one workspace with a single source-of-truth (the OpenAPI definition itself).

That's an asset when you're starting greenfield, and a constraint when you have years of Postman collections to migrate. The choice is documented in [`tool-comparison.md`](./tool-comparison.md); this file assumes you've already decided to evaluate or adopt Apidog.

## When to reach for Apidog

Use Apidog when:

- 🆕 Greenfield API project — design starts in OpenAPI, not in a request
- 🔄 You want **spec ↔ test ↔ mock auto-sync** (change the spec, all three update)
- 📚 You need **publishable docs** out of the box (paid Postman tier)
- 🌐 Your team includes back-end engineers who prefer spec-first workflows
- 🤝 Front-end + back-end need to **mock against the spec** before the back-end ships

Avoid Apidog when:

- 🚫 You have a Postman investment >100 collections (migration cost > tool benefit)
- 🚫 Your org has a vendor-cloud restriction (Apidog Cloud has the same data-residency questions Postman Cloud does)
- 🚫 You'd be the only Apidog user on the team — tool-fragmentation tax beats the wins

## Workspace structure (this repo's convention if adopted)

Apidog organises around **Projects**. Mirror the same module split as Postman:

```
Project: ai-qa-training
├── 📘 APIs (OpenAPI definitions)
│   ├── account/
│   ├── cart/
│   ├── checkout/
│   ├── product/
│   └── wishlist/
├── 🧪 Test Cases (per endpoint, per scenario)
│   ├── @P1 happy paths
│   ├── @P2 edge cases
│   └── @P3 negative
├── 🧬 Test Scenarios (multi-request flows)
├── 🪞 Mocks (auto-generated from spec; overrideable)
└── 🌐 Environments (qa / uat / prod — mirrors `profiles/.env.<ENV>`)
```

**Mirror to repo** the same way as Postman — export each API definition as `documents/api-testing/collections/<NN>-<module>.apidog.json` and commit. The repo is source-of-truth.

## Bringing OpenAPI in

If your team has an existing OpenAPI / Swagger spec, Apidog imports it directly:

```bash
# Apidog Desktop: File → Import Data → OpenAPI 3.0 → pick the .yaml
# OR via apidog-cli (see CLI section below):
apidog-cli import openapi --file ./openapi.yaml --project-id <id>
```

For repos that **generate** the OpenAPI spec from code, see the [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md) skill — its output drops directly into the Apidog importer.

## Importing from Postman

Apidog ships a one-shot Postman migration:

```bash
# Apidog Desktop: File → Import Data → Postman → Collection v2 / v2.1 JSON
# OR for environment files:
# File → Import Data → Postman → Environment JSON
```

What transfers:

- ✅ Requests (URL, method, headers, body)
- ✅ Folders (preserved as Apidog folders)
- ✅ Pre-request and test scripts (Postman's `pm.*` API maps to Apidog's `pm` shim)
- ✅ Environments (variables; secret type preserved)

What needs hand-fixing:

- ⚠️ Custom Postman packages in scripts (`pm.sendRequest` of complex shape; some libraries unavailable)
- ⚠️ Postman's chai assertions translate, but Apidog has its own richer assertion DSL — re-write to native after import
- ⚠️ Postman Monitors do not transfer — replace with [`apidog-cli`](#cli-runner) on a schedule
- ⚠️ Mock servers — Apidog mocks are auto-generated from the spec, not from saved examples; you'll re-derive

## Test cases vs test scenarios

Apidog distinguishes two concepts that Postman blurs:

| Concept | What it is | Maps to in this repo |
|---|---|---|
| **Test Case** | One request + assertions, parameterised over a data set | One Playwright `test()` per row |
| **Test Scenario** | Multi-step flow chaining requests, capturing values | One Playwright `test()` with multiple `request.post/get` calls |

For a multi-step flow, **prefer Apidog Scenarios over Postman Folder-with-pre-request-script** — Scenarios have a visual flow editor and explicit data-flow lines between steps, which makes 5+ step flows actually maintainable.

### Example — Cart flow as an Apidog Scenario

```
[1] POST account/login        → captures: {auth_token}
       ↓
[2] POST cart/add             → uses {auth_token}, captures: {cart_id}
       ↓
[3] GET cart                  → uses {auth_token}, asserts: contains {cart_id}
       ↓
[4] POST cart/checkout        → uses {auth_token}, asserts: status==200, total>0
       ↓
[5] POST cart/clear           → cleanup
```

Each step has its own assertions in the 5-step shape ([`automation-framework/assertions.md`](../automation-framework/assertions.md)). The whole scenario passes only if all steps pass.

## Assertions — Apidog's DSL

Apidog's assertion editor produces JSON, not script. The same 5-step shape as Postman/Playwright:

| Step | Apidog assertion | Equivalent in [`tests/api/`](../../tests/api/) |
|---|---|---|
| 1. Status | `Response status code Equal to 200` | `Assertions.assertEqual(response.status(), 200, ...)` |
| 2. Time | `Response time Less than 2000` | `Assertions.assertToBeLessThan(responseTime, 2000, ...)` |
| 3. Size | `Response body Length greater than 0` | `Assertions.assertToBeGreaterThan(responseBodyString.length, 0, ...)` |
| 4. Schema | `Response body Match JSON Schema <schema-ref>` | `Assertions.assertSchemaByType(body, {...}, ...)` |
| 5. Data | `Response body JSONPath $.success Contains <product-name>` | `Assertions.assertContains(body.success, ..., ...)` |

The schema reference matters: Apidog can **auto-link** the schema check back to the OpenAPI definition. When the spec changes, the assertion either auto-updates or visibly diverges (Apidog flags both). This is the spec-first benefit Postman doesn't offer natively.

## Auto-test from spec

Apidog can **generate** a baseline test for every endpoint defined in the spec — happy path + a configurable set of negative cases. Use this once at project setup:

```bash
# Apidog Desktop: APIs → Right-click endpoint → Generate Test Cases
# Configurable: happy / boundary / negative / fuzz
# Output lands in Test Cases section, named "<endpoint> - auto-generated <YYYY-MM-DD>"
```

The generated cases are a **starting point**, not the final coverage. Treat them like the [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) skill's output: keep the ones that match a real risk, delete the noise, add manual cases the generator missed (especially business-rule cases like the cart-discount-expiry incident).

## Mocks

Apidog mocks are spec-driven by default — every endpoint in the OpenAPI gets a deterministic mock URL based on the schema's `example` values:

```
GET    https://<project-id>.apidog.io/cart           → returns example from spec
POST   https://<project-id>.apidog.io/cart/add       → returns example from spec
```

To override (e.g. simulate the discount-expiry 4xx response), define a **Mock Rule**:

```json
{
  "endpoint": "POST /cart/add",
  "rule": "{{$body.discount_code}} == 'EXPIRED'",
  "response": {
    "status": 400,
    "body": { "error": "discount_expired", "code": "E_DISC_001" }
  }
}
```

For programmatic / in-test mocking inside [`tests/api/`](../../tests/api/) or [`tests/ui/`](../../tests/ui/), use the [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md) skill (covers MSW, nock, Playwright `route()`).

## CLI runner

Apidog's CLI runner is the equivalent of [Newman](./postman-newman.md) for Apidog projects.

### Install

```bash
# Repo-local
npm install --save-dev apidog-cli

# Or via Apidog's installer:
# https://apidog.com/help/cli/installation/
```

### Run

```bash
# Run a single test scenario
apidog-cli run \
  --access-token $APIDOG_ACCESS_TOKEN \
  --project-id <project-id> \
  --scenario-id <scenario-id> \
  --environment qa \
  --reporters cli,html,junit \
  --html-export reports/api/apidog.html \
  --junit-export reports/api/junit-apidog.xml

# Run all scenarios in a folder
apidog-cli run \
  --access-token $APIDOG_ACCESS_TOKEN \
  --project-id <project-id> \
  --folder-id <folder-id> \
  --environment qa \
  --reporters cli,junit \
  --junit-export reports/api/junit-apidog.xml
```

### Add to `package.json`

```json
{
  "scripts": {
    "api:apidog": "apidog-cli run --access-token $APIDOG_ACCESS_TOKEN --project-id $APIDOG_PROJECT_ID --environment qa --reporters cli,html,junit --html-export reports/api/apidog.html --junit-export reports/api/junit-apidog.xml",
    "api:apidog:uat": "apidog-cli run --access-token $APIDOG_ACCESS_TOKEN --project-id $APIDOG_PROJECT_ID --environment uat --reporters cli,html,junit --html-export reports/api/apidog-uat.html --junit-export reports/api/junit-apidog-uat.xml"
  }
}
```

### Exit-code contract

Identical to Newman:

| Exit | Meaning |
|---|---|
| 0 | All assertions passed |
| 1 | At least one assertion failed (defect candidate) |
| 2 | apidog-cli couldn't run (auth fail, network, project-id wrong — infra failure) |

The dashboard's API panel reads the JUnit, separates infra vs test failures, and feeds the same trend file as Newman / Playwright (see [`postman-newman.md`](./postman-newman.md) §Trend continuity).

## CI integration — GitHub Actions

The same shape as the [Newman job](./postman-newman.md) — substitute the runner:

```yaml
api-apidog:
  name: API (Apidog CLI)
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

    - name: Run apidog-cli
      env:
        ENV: ${{ matrix.env }}
        APIDOG_ACCESS_TOKEN: ${{ secrets.APIDOG_ACCESS_TOKEN }}
        APIDOG_PROJECT_ID: ${{ secrets.APIDOG_PROJECT_ID }}
      run: npm run api:apidog:${{ matrix.env }}

    - name: Upload Apidog artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: apidog-${{ matrix.env }}-${{ github.run_id }}
        path: |
          reports/api/apidog-${{ matrix.env }}.html
          reports/api/junit-apidog-${{ matrix.env }}.xml
        retention-days: 14
        if-no-files-found: error
```

For GitLab, the structure mirrors the Newman GitLab snippet in [`postman-newman.md`](./postman-newman.md) — substitute `apidog-cli` for `newman`.

## Secrets

Same three rules as [Postman](./postman.md) §Secrets:

1. Real secrets never in the project JSON committed to repo.
2. Apidog environment variables for secrets use the **password-type** field (rendered as `***`, not synced to public collaborators).
3. The synced `apidog environment` artifact at run time **must not** be uploaded — see the verification step in the GitHub Actions snippet above.

`APIDOG_ACCESS_TOKEN` and `APIDOG_PROJECT_ID` are themselves secrets — store in GitHub / GitLab CI/CD variables, not in `package.json` or `.env.<ENV>` committed files.

## Documentation publishing

Apidog auto-generates browsable API docs from the spec. To publish a versioned snapshot to your repo / wiki:

```bash
# Apidog Desktop: Project Settings → Documentation → Publish
# Choose: "Self-hosted" → Download HTML bundle
# Commit under wiki/api/<version>/ for stakeholder access
```

Don't publish to Apidog's public cloud unless your security review has explicitly approved it — the docs include schema details that may inform reverse-engineering.

## Promoting Apidog test cases to Playwright

Same five-step process as the Postman version (see [`postman.md`](./postman.md) §Promoting). The 5-step assertion shape is preserved; the [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) skill expands negative cases when you port to TS.

## Anti-patterns this guideline rules out

- ❌ Two source-of-truths — once you adopt Apidog, sunset the Postman collections it replaces (or vice versa); never both
- ❌ Spec-drift — if you let test cases diverge from the OpenAPI spec, you've lost Apidog's main benefit
- ❌ Cloud-only project (must export the project JSON to repo before merging)
- ❌ Auto-generated tests treated as "we have coverage" — they're a baseline, not the destination
- ❌ Skipping the `--junit-export` flag (dashboard can't see the run; same as Newman)
- ❌ Using Apidog mocks for production — they're a development aid, not a deploy target

## Migration paths

### Postman → Apidog (full migration)

1. Export every Postman collection + environment as JSON (see [`postman.md`](./postman.md) §Workspace).
2. Import all into a single Apidog project (File → Import Data → Postman, batch).
3. Re-author tests using Apidog's assertion DSL (script tests transfer but feel foreign).
4. Re-derive mocks from the OpenAPI definition (don't port saved-example mocks).
5. Update CI to call `npm run api:apidog` instead of `npm run api:newman`.
6. Sunset the Postman workspace; archive the collection JSONs in repo for historical reference.

### Apidog → Postman (escape hatch)

1. In Apidog, Export Project → Postman v2.1 Collection.
2. Import to Postman.
3. Re-write any Apidog-DSL assertions back to `pm.test` blocks.
4. Update CI to call `npm run api:newman` instead of `npm run api:apidog`.
5. Re-derive mocks from saved examples (Postman doesn't have spec-driven mocks at the free tier).

Both directions are lossy on the assertion DSL — budget 30 min/collection of manual fix-up.

## Related

- [`README.md`](./README.md) — folder index
- [`postman.md`](./postman.md) — the Postman alternative this guideline contrasts with
- [`postman-newman.md`](./postman-newman.md) — the Newman CLI shape `apidog-cli` mirrors
- [`tool-comparison.md`](./tool-comparison.md) — when Apidog beats Postman or Playwright
- [`openapi-spec-generation`](../../.agents/skills/openapi-spec-generation/SKILL.md) — feeds spec into Apidog importer
- [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md) — programmatic mocking when Apidog mocks don't fit
- [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) — negative-case expansion when porting Apidog tests to Playwright
