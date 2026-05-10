# Postman — GUI Workflow Guideline

> How to use Postman as the **exploration + stakeholder-facing** layer of API testing in this repo. Focuses on collection hygiene, environment discipline, and what to do *before* you promote a request into [`tests/api/`](../../tests/api/) or schedule it via [Newman](./postman-newman.md).

## When to reach for Postman

Use Postman when:

- 🔍 You're **exploring a new endpoint** (GET / POST / shapes unknown)
- 👥 A **non-engineer needs to run the request** (PM, sales engineer, support)
- 📦 You want a **clickable artifact** for a stakeholder review
- 🧪 You're prototyping a multi-request flow that you might later port to TS

Avoid Postman when:

- 🚫 The endpoint is already in [`tests/api/`](../../tests/api/) — don't fork the contract
- 🚫 You need cross-browser, cross-OS, or AI-assisted runs — that's Playwright's lane
- 🚫 The request needs to run on every PR — promote to TS or to [Newman](./postman-newman.md)
- 🚫 You're tempted to put a secret in the collection — see §Secrets below

## Workspace structure (this repo's convention)

```
<your local Postman>
└── Workspace: "ai-qa-training" (private; never sync to public team workspace)
    ├── Collection: 01-cart            ← module:cart
    ├── Collection: 02-checkout        ← module:checkout
    ├── Collection: 03-account         ← module:account
    ├── Collection: 04-product         ← module:product
    ├── Collection: 05-wishlist        ← module:wishlist
    └── Collection: 99-smoke           ← cross-module @smoke set
```

**Mirror to the repo:** export each collection as `documents/api-testing/collections/<NN>-<module>.postman_collection.json` and commit. The repo is source-of-truth — Postman's cloud is a workspace, not a database.

```bash
# Export from Postman GUI: Right-click collection → Export → Collection v2.1 (JSON)
# Then move the file:
mv ~/Downloads/01-cart.postman_collection.json \
   documents/api-testing/collections/01-cart.postman_collection.json
git add documents/api-testing/collections/01-cart.postman_collection.json
```

## Environments

Mirror the repo's [`profiles/.env.<ENV>`](../../profiles/) one-for-one. Three environments only — `qa`, `uat`, `prod` — matching the repo's existing matrix.

| Environment variable | Source in repo |
|---|---|
| `BASE_URL` | `BASE_URL` from `profiles/.env.<ENV>` |
| `API_BASE_URL` | `BASE_URL` + `/index.php?route=` |
| `USERNAME` | from `.env` (never typed into Postman UI) |
| `PASSWORD` | from `.env` (never typed into Postman UI) |
| `AUTH_TOKEN` | populated by the login pre-request script (see below) |

### Bringing values in from `.env` at runtime

The Postman GUI does not natively read `.env`. Two patterns:

**Pattern A — Manual sync via a helper script (recommended for the GUI lane).**

```bash
# scripts/sync-postman-env.sh (committed)
ENV=${1:-qa}
node -e "
  const fs = require('fs');
  const dotenv = require('dotenv');
  const envFile = dotenv.parse(fs.readFileSync('profiles/.env.${ENV}'));
  const postmanEnv = {
    id: '${ENV}',
    name: 'ai-qa-training-${ENV}',
    values: Object.entries(envFile).map(([key, value]) => ({
      key, value, type: key.includes('PASSWORD') || key.includes('TOKEN') ? 'secret' : 'default', enabled: true,
    })),
    _postman_variable_scope: 'environment',
  };
  fs.writeFileSync('documents/api-testing/environments/${ENV}.postman_environment.json', JSON.stringify(postmanEnv, null, 2));
"
```

Then in Postman: **File → Import → Folder → `documents/api-testing/environments/`**.

**Pattern B — Use [Newman](./postman-newman.md) for runs that need real secrets.** The GUI is for exploration; secrets only enter the picture in CI.

## Collection hygiene

### Folder structure inside a collection

```
01-cart/
├── 00-setup/                 ← pre-flight, e.g. login + capture token
│   └── POST login
├── 10-happy-paths/           ← @P1 candidates
│   ├── POST add-to-cart
│   ├── GET cart
│   └── POST update-quantity
├── 20-edge-cases/            ← @P2 / @P3 candidates
│   ├── POST add-to-cart-quantity-zero
│   ├── POST add-to-cart-expired-discount   ← the cart-discount-expiry incident
│   └── POST add-to-cart-out-of-stock
├── 30-negative/              ← @P2 / @major
│   ├── POST add-to-cart-invalid-product
│   └── POST add-to-cart-malformed-payload
└── 99-cleanup/
    └── POST clear-cart
```

### Request naming

`<METHOD> <action> [— <variant>]` — e.g.:

- ✅ `POST add-to-cart`
- ✅ `POST add-to-cart — expired discount` (the cart-discount-expiry incident)
- ❌ `cart_add_test_v2_FINAL_FINAL` (PM-style file naming; will be unreadable in 3 months)

### Description field — required

Every request fills three lines in its **Description** tab:

```markdown
**Purpose:** <one sentence — what is this request testing?>
**Maps to:** Jira <ID> · Manual TC <TC-MODULE-NN> · Spec (if any) `tests/api/<spec>.spec.ts`
**Promotion target:** @P1 / @P2 / @P3 (what tag will it carry when ported to TS?)
```

## Pre-request scripts

Use sparingly. The two patterns that earn their keep:

### 1. Login + capture token

```javascript
// In the "POST login" request's "Pre-request Script" tab:
// (uses the env vars synced from .env)
const loginRequest = {
  url: pm.environment.get('API_BASE_URL') + 'account/login',
  method: 'POST',
  header: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: {
    mode: 'urlencoded',
    urlencoded: [
      { key: 'email', value: pm.environment.get('USERNAME') },
      { key: 'password', value: pm.environment.get('PASSWORD') },
    ],
  },
};
pm.sendRequest(loginRequest, (err, res) => {
  if (err) { console.error(err); return; }
  // Adjust to your auth scheme
  const token = res.json().token;
  pm.environment.set('AUTH_TOKEN', token);
});
```

### 2. Per-request request-id for tracing

```javascript
pm.request.headers.add({
  key: 'X-Request-Id',
  value: 'postman-' + pm.info.requestName.replace(/\s+/g, '-') + '-' + Date.now(),
});
```

## Test scripts — the 5-step assertion shape

Match the in-repo Playwright shape from [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) and the rules in [`automation-framework/assertions.md`](../automation-framework/assertions.md). When you port the request to TS, the assertions translate one-to-one.

```javascript
// In the request's "Tests" tab:
const body = pm.response.json();
const responseTime = pm.response.responseTime;
const responseSize = pm.response.responseSize;

// 1. Status code
pm.test('Status is 200', () => {
  pm.expect(pm.response.code).to.eql(200);
});

// 2. Response time budget (matches assertToBeLessThan in repo)
pm.test('Response time < 2000ms', () => {
  pm.expect(responseTime).to.be.below(2000);
});

// 3. Payload size sanity
pm.test('Body is non-empty', () => {
  pm.expect(responseSize).to.be.above(0);
});

// 4. Schema (use ajv via Postman's chai-like API)
pm.test('Body has expected schema', () => {
  pm.expect(body).to.have.all.keys('success', 'total');
  pm.expect(body.success).to.be.a('string');
  pm.expect(body.total).to.be.a('string');
});

// 5. Data correctness
pm.test('Success message names the product', () => {
  pm.expect(body.success).to.include(pm.environment.get('PRODUCT_NAME'));
});

// (optional) Persist values for later requests in the chain
pm.environment.set('LAST_CART_TOTAL', body.total);
```

Anti-patterns:

- ❌ `pm.test('it works', () => pm.expect(pm.response.code).to.be.below(500))` — accepts everything except 5xx; useless
- ❌ Schema check via string match (`body.includes('"total"')`) — false negatives on key reordering
- ❌ Mixing assertions with side effects in the same `pm.test` block — when it fails, you can't tell what

## Mock servers

Use Postman's mock-server feature for **non-engineering stakeholder demos** and **front-end parallel work** when the back-end isn't ready. For programmatic mocking inside `tests/api/`, use the [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md) skill instead — it covers MSW, nock, and Playwright's request interception.

Mock-server discipline in Postman:

1. **Mock from saved examples**, not from prose. Save 3-5 example responses (200, 4xx, 5xx) on the request, then enable mocking.
2. **Document the mock URL** in the collection description: `Mock URL: https://<id>.mock.pstmn.io`.
3. **Tear it down** when the real endpoint ships — orphan mocks erode trust.

## Monitors

Postman Monitors are CI-on-someone-else's-cloud. **Don't use them in this repo** — Newman in our existing CI ([`postman-newman.md`](./postman-newman.md)) covers the same ground without the vendor dependency, with logs landing in our own artifact store.

The single exception: **production health checks** from a third-party origin (when you specifically need a different network egress than your own CI). For that, document the monitor in the collection description and treat its failures as you would a status-page provider's failures.

## Secrets

Three rules, no exceptions:

1. **Secrets never live in collection JSON.** No `Authorization: Bearer abc123…` in the headers tab. Always reference an environment variable: `Authorization: Bearer {{AUTH_TOKEN}}`.
2. **Environment values for secrets use Postman's "secret" type** — not "default". They render as `***` in the UI and don't sync to the cloud.
3. **The `documents/api-testing/environments/` folder MUST NOT contain real secret values.** Commit a template:

   ```json
   {
     "id": "qa-template",
     "name": "ai-qa-training-qa-TEMPLATE",
     "values": [
       { "key": "USERNAME", "value": "<set-from-.env>", "type": "secret", "enabled": true },
       { "key": "PASSWORD", "value": "<set-from-.env>", "type": "secret", "enabled": true }
     ]
   }
   ```

   Real values come from `profiles/.env.<ENV>` via the sync script (Pattern A above) and the resulting file is **gitignored**.

If a secret leaks into a committed JSON, treat it as an incident: rotate the credential, force-push the cleaned commit, and write the post-mortem per [`templates/manager/post-mortem-template.md`](../../templates/manager/post-mortem-template.md).

## Promoting a Postman request to a Playwright spec

The contract is intentionally one-to-one. Five steps (the 5-step assertion shape preserves):

1. Identify the request to promote (everything in `10-happy-paths/` is a `@P1` candidate).
2. Re-implement in TypeScript under [`tests/api/`](../../tests/api/). Use the [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md) skill to expand the negative cases.
3. Apply tags per [`prompts/core/test-tags.md`](../../prompts/core/test-tags.md) — the priority must match what the request's description called out.
4. Update the Postman request's description: `Promotion target: @P1 (PROMOTED — see tests/api/<spec>.spec.ts)`.
5. **Keep the Postman request.** It's still the exploration / stakeholder version. Both can coexist; the TS version is canonical.

## Anti-patterns this guideline rules out

- ❌ Using Postman as the regression gate (it isn't; that's `tests/api/`)
- ❌ "It works in my Postman" debugging conversations — every request must be runnable from a fresh checkout via the synced env
- ❌ Cloud-only collections (must export to repo before merging)
- ❌ Hand-typed secrets in any field
- ❌ Multi-request flows >5 requests deep without a corresponding TS port (becomes unreadable; promote)
- ❌ Tests that print and don't assert (`console.log(body)` is debug-only, never the only "test")

## Related

- [`README.md`](./README.md) — folder index + tool comparison entry point
- [`postman-newman.md`](./postman-newman.md) — putting your collection in CI
- [`apidog.md`](./apidog.md) — alternative tool covering Postman + Swagger + mocking + docs
- [`tool-comparison.md`](./tool-comparison.md) — when-to-use matrix
- [`tests/api/test-cart.spec.ts`](../../tests/api/test-cart.spec.ts) — the 5-step assertion shape in TypeScript
- [`automation-framework/assertions.md`](../automation-framework/assertions.md) — the underlying `Assertions` helper
- [`api-testing-mock`](../../.agents/skills/api-testing-mock/SKILL.md), [`api-fuzzer-generator`](../../.agents/skills/api-fuzzer-generator/SKILL.md), [`api-security-testing`](../../.agents/skills/api-security-testing/SKILL.md) — agent skills that complement this workflow
