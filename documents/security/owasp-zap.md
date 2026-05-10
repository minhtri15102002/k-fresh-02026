# OWASP ZAP — Deep-Dive Guideline

> The operator's manual for OWASP Zed Attack Proxy (ZAP) in this repo. The compact decision-matrix entry lives in [`toolchain.md`](./toolchain.md) §6; this file is the full how-to: every scan mode, authenticated scans, CI integration, false-positive management, and the defect-routing contract that wires findings into the QA dashboard. Calibrated for **ZAP 2.16.x** (cross-checked May 2026).

## When to reach for ZAP

Use ZAP when:

- 🌐 You need an **automatable** DAST scan that runs in CI on every PR
- 🔁 You want a **scheduled deep scan** (nightly / weekly) of the SUT or staging
- 📜 The target has an **OpenAPI / GraphQL / SOAP** spec — ZAP imports them and enumerates parameters automatically
- 🧪 You need **pre-merge regression evidence** that no new XSS / CSRF / header / TLS / mixed-content issue was introduced
- 🆓 You need a **free, OSS, no-vendor-lock** scanner (the same exact run is reproducible on any laptop or runner)

Avoid ZAP when:

- 🚫 You need **business-logic** attacks (multi-step, race conditions, abuse of intent) — that's [Burp Suite](./burp-suite.md)'s lane
- 🚫 You need a **single-finding deep dive** with manual repeater iteration — Burp / Caido are sharper
- 🚫 The target is an **internal-only API** with no spec — Schemathesis with a recorded HAR is a better starting point (see [`toolchain.md`](./toolchain.md) §7)
- 🚫 You're tempted to scan a **third-party SaaS without authorisation** — see §Legal & scope below

## The three scan modes

ZAP ships three scan styles; choose by what's in CI vs. nightly vs. ad-hoc.

| Mode | Time | What it does | What it misses | Used by this repo |
|---|---|---|---|---|
| **Baseline** (`zap-baseline.py`) | 3-5 min | Spider + passive rules only. No active probing. | Anything that requires firing a payload. | **Per-PR gate** — CI fails if anything new appears |
| **API Scan** (`zap-api-scan.py`) | 5-15 min | Imports OpenAPI / GraphQL / SOAP spec; passive + targeted active rules per endpoint | Anything outside the spec; UI surface | **Per-PR gate** when `documents/api-testing/collections/*.openapi.*` changes |
| **Full Scan** (`zap-full-scan.py`) | 30-60 min+ | Spider + AJAX spider + all active rules; fuzzes parameters | False positives are higher; needs tuning | **Nightly schedule** — advisory only until tuned |

> **Rule of thumb:** if a scan takes longer than the rest of the test suite, it doesn't belong on every PR. Baseline + API Scan are per-PR; Full Scan is nightly.

## Install

Three install patterns, ranked by how this repo recommends each:

### Pattern A — Docker (recommended, matches CI exactly)

```bash
# Pull the official stable image
docker pull zaproxy/zap-stable:latest

# Confirm it runs
docker run --rm zaproxy/zap-stable:latest zap.sh -version
```

Use this for **all scripted scans, local or CI**. Same binary, same rule version, same behaviour.

### Pattern B — Standalone GUI (exploratory only)

```bash
# macOS
brew install --cask zap

# Linux
sudo snap install zaproxy --classic

# Windows
# Download installer from https://www.zaproxy.org/download/
```

Use this when you're **manually exploring** a finding the automated scan reported — the GUI lets you replay a request, edit it, and re-fire it. Never use the GUI as the source-of-truth for CI runs.

### Pattern C — `zap.sh` headless (fallback)

If Docker isn't available on your CI runner, install the standalone tarball and call `zap.sh -daemon` directly. Avoid this; it's the maintenance burden of pinning a Java + ZAP combination yourself.

## Configure context — the prerequisite for any non-trivial scan

A "context" is ZAP's name for **the configuration of one scan target** — URL scope, technology hints, authentication, session-handling. For a baseline scan against an unauthenticated public SUT (like the LambdaTest playground in this repo), defaults are fine. For anything else, build a context once and check it in.

### Build a context (GUI, one-time)

1. Open ZAP GUI → **File → New Context**.
2. **Include in context:** add a regex per allowed origin, e.g. `https://ecommerce-playground\.lambdatest\.io.*`
3. **Exclude from context:** add regexes for any path that's destructive (`.*/logout.*`, `.*/account/delete.*`, `.*/admin/.*`).
4. **Technology:** un-tick anything not present (e.g. uncheck `WebSphere`, `Lotus Domino` — every irrelevant tech adds noise).
5. **Authentication** (optional — see §Authenticated scans below).
6. **File → Export Context** → save under `documents/security/zap-contexts/<env>.context` and commit (no secrets in the file; secrets come at run-time).

### What goes in `documents/security/zap-contexts/`

```
documents/security/zap-contexts/
├── qa.context                     ← QA env, anonymous
├── qa-auth.context                ← QA env, authenticated user
├── uat-auth.context
└── README.md                      ← what each context covers + secrets-source notes
```

Keep the context files in version control. **Never commit a context that has session cookies or passwords in it** — those values come from `profiles/.env.<ENV>` at run time via the same loader pattern as [`postman.md`](../api-testing/postman.md) §Environments.

## Run locally (Docker, scripted)

### Baseline scan (per-PR equivalent)

```bash
# Anonymous baseline against the SUT, write HTML + JSON + Markdown reports
docker run --rm \
  -v "$(pwd)/reports/security:/zap/wrk/:rw" \
  -t zaproxy/zap-stable:latest \
  zap-baseline.py \
    -t https://ecommerce-playground.lambdatest.io \
    -r zap-baseline.html \
    -J zap-baseline.json \
    -w zap-baseline.md \
    -m 5 \
    -T 60
```

Flag tour:

| Flag | Why |
|---|---|
| `-t <url>` | Target URL (required) |
| `-r <file>` | HTML report (the human-readable one PR comments link to) |
| `-J <file>` | JSON report (the one CI parses for the defect-issue automation) |
| `-w <file>` | Markdown report (mirrors the PR-comment body) |
| `-m <int>` | Max minutes per spider (5 is sane for baseline) |
| `-T <int>` | Max minutes overall (60 hard cap) |
| `-a` | Include all alerts (don't omit `Informational`) — turn on once you've tuned |
| `-c <file>` | Rules tsv (`-c zap-rules.tsv`) — see §Tuning |

### API scan (per-PR when the spec changes)

```bash
docker run --rm \
  -v "$(pwd)/reports/security:/zap/wrk/:rw" \
  -v "$(pwd)/documents/api-testing/collections:/specs:ro" \
  -t zaproxy/zap-stable:latest \
  zap-api-scan.py \
    -t /specs/cart.openapi.yaml \
    -f openapi \
    -r zap-api.html \
    -J zap-api.json \
    -T 30
```

Supported `-f` formats: `openapi`, `graphql`, `soap`. Provide the spec file via the volume mount; ZAP enumerates every operation and probes parameters per its API ruleset.

### Full scan (nightly only — long)

```bash
docker run --rm \
  -v "$(pwd)/reports/security:/zap/wrk/:rw" \
  -t zaproxy/zap-stable:latest \
  zap-full-scan.py \
    -t https://ecommerce-playground.lambdatest.io \
    -r zap-full.html \
    -J zap-full.json \
    -m 20 \
    -T 90 \
    -j        # also run AJAX spider for SPA / JS-heavy pages
```

⚠️ Full scan **fires payloads** (XSS strings, SQL noise, path-traversal probes). Never run it against a target you don't own. Always run it against `qa` or `staging`, never `prod`.

## Authenticated scans

For anything behind a login (cart, checkout, account), ZAP needs to authenticate and **maintain the session** through the scan. Two patterns ranked by reliability:

### Pattern A — Form-based authentication (most common)

In your context (GUI):

1. **Authentication → Form-Based Authentication**
2. **Login URL:** `https://ecommerce-playground.lambdatest.io/index.php?route=account/login`
3. **Login Request POST data:** `email={%username%}&password={%password%}`
4. **Logged in indicator:** regex matching a logged-in-only string (e.g. `Logout`)
5. **Logged out indicator:** regex matching a logged-out string (e.g. `Login</a>`)
6. **Users → Add user:** `qa-test-user`, then put the credentials in run-time env vars (`ZAP_USERNAME`, `ZAP_PASSWORD`) — **not in the context file**
7. **Session Management:** `Cookie-Based`

Then in the scan:

```bash
docker run --rm \
  -v "$(pwd)/reports/security:/zap/wrk/:rw" \
  -v "$(pwd)/documents/security/zap-contexts:/contexts:ro" \
  -e ZAP_USERNAME="$QA_USERNAME" \
  -e ZAP_PASSWORD="$QA_PASSWORD" \
  -t zaproxy/zap-stable:latest \
  zap-baseline.py \
    -t https://ecommerce-playground.lambdatest.io \
    -n /contexts/qa-auth.context \
    -U qa-test-user \
    -r zap-baseline-auth.html \
    -J zap-baseline-auth.json
```

### Pattern B — Replay a Playwright-captured session (the integration this repo uses)

The cleaner pattern when you already have Playwright tests that log in:

1. In a Playwright `globalSetup`, log in once and `context.storageState({ path: 'reports/security/zap-storage.json' })`.
2. Convert that storage state into a ZAP "Replacer" rule that injects the session cookie:

   ```bash
   # scripts/zap-session-from-playwright.ts (committed, ~30 lines)
   # Reads reports/security/zap-storage.json,
   # writes a ZAP replacer rule .conf that adds the cookie to every request.
   ```

3. Pass the replacer to ZAP:

   ```bash
   docker run --rm \
     -v "$(pwd)/reports/security:/zap/wrk/:rw" \
     -t zaproxy/zap-stable:latest \
     zap-baseline.py \
       -t https://ecommerce-playground.lambdatest.io \
       -z "-config replacer.full_list(0).description=session \
           -config replacer.full_list(0).enabled=true \
           -config replacer.full_list(0).matchtype=REQ_HEADER \
           -config replacer.full_list(0).matchstr=Cookie \
           -config replacer.full_list(0).regex=false \
           -config replacer.full_list(0).replacement=PHPSESSID=$(jq -r '.cookies[0].value' reports/security/zap-storage.json)" \
       -r zap-baseline-auth.html
   ```

This sidesteps the brittle "ZAP login form filler" entirely and keeps the auth path identical to your real test traffic.

## Tuning — the difference between signal and theatre

ZAP's defaults produce **a lot** of noise on a typical web app. Tune in three passes:

### Pass 1 — Technology subset

Open the context, **un-tick every technology not present** (Java if you're a Node shop, ColdFusion if you're not in 2003, etc.). Cuts ~30 % of irrelevant rules.

### Pass 2 — Rules tsv

Generate the default rules file once, then commit and edit:

```bash
docker run --rm zaproxy/zap-stable:latest zap-baseline.py -t https://example.com --hook=/zap/auto-update.py -d > zap-rules.tsv
```

The file looks like:

```
10010	IGNORE	(Cookie No HttpOnly Flag)
10011	WARN	(Cookie Without Secure Flag)
10015	WARN	(Incomplete or No Cache-control and Pragma HTTP Header Set)
10020	FAIL	(X-Frame-Options Header Not Set)
...
```

States:

- `FAIL` — finding causes `zap-baseline.py` to exit non-zero (build red)
- `WARN` — appears in report; advisory; doesn't fail the build
- `IGNORE` — suppressed entirely

Commit as `documents/security/zap-rules.tsv` and pass with `-c /wrk/zap-rules.tsv`. Every change to the file goes through code review — a one-line `IGNORE` is a security-impacting change and should be justified in the PR description.

### Pass 3 — Per-finding suppression with justification

For a true false-positive (e.g. a header your CDN strips and re-adds upstream), add a comment in the rules tsv:

```
10038	IGNORE	(CSP Header Not Set) # Set by Cloudflare layer; verified 2026-04-15 PR#1234
```

Never silently suppress — every `IGNORE` carries a comment with date + PR + justification.

## Wire into CI — per-PR baseline

Add a job to `.github/workflows/playwright.yml` (or `security.yml`). Mirrors the contract in [`documents/ci/shared-conventions.md`](../ci/shared-conventions.md):

```yaml
zap-baseline:
  name: DAST baseline (ZAP)
  runs-on: ubuntu-latest
  needs: install
  steps:
    - uses: actions/checkout@v4

    - name: Run ZAP Baseline
      uses: zaproxy/action-baseline@v0.13.0
      with:
        target: ${{ vars.QA_BASE_URL }}
        rules_file_name: documents/security/zap-rules.tsv
        cmd_options: '-a -j'                   # include AJAX spider + all alerts
        fail_action: true                       # exit non-zero on any FAIL rule
        artifact_name: zap-baseline-${{ github.run_id }}
        allow_issue_writing: false              # we file issues via our own pipeline; see below
        token: ${{ secrets.GITHUB_TOKEN }}

    - name: Convert ZAP JSON → defect issues
      if: always()
      run: |
        npm run security:from-zap -- reports/security/zap-baseline.json \
          --severity-mapping documents/security/zap-severity-map.json \
          --found-in qa --phase e2e
```

Why `allow_issue_writing: false`: the action's built-in issue creation doesn't apply our canonical labels (`bug` + `severity:*` + `module:*` + `root-cause:*` + `phase:*` + `found-in:*`). Our own pipeline (the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill, fed via `npm run security:from-zap`) does.

## Wire into CI — nightly full scan

Separate workflow at `.github/workflows/security-nightly.yml`:

```yaml
name: Security · Nightly Full Scan
on:
  schedule:
    - cron: '0 2 * * *'        # 02:00 UTC daily
  workflow_dispatch:

jobs:
  zap-full:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: ${{ vars.STAGING_BASE_URL }}
          rules_file_name: documents/security/zap-rules.tsv
          cmd_options: '-a -j'
          fail_action: false                  # advisory until tuned
          artifact_name: zap-full-${{ github.run_id }}
          allow_issue_writing: false
      - if: always()
        run: |
          npm run security:from-zap -- reports/security/zap-full.json \
            --severity-mapping documents/security/zap-severity-map.json \
            --found-in staging --phase e2e
```

`fail_action: false` until the rules tsv is tuned; flip to `true` once the team trusts the signal (typically after 2-3 weeks of triage).

## Wire into CI — API scan when the OpenAPI changes

```yaml
zap-api:
  if: contains(github.event.pull_request.changed_files, 'documents/api-testing/collections/') && contains(github.event.pull_request.changed_files, '.openapi.')
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: zaproxy/action-api-scan@v0.7.0
      with:
        target: documents/api-testing/collections/cart.openapi.yaml
        format: openapi
        cmd_options: '-T 30'
        fail_action: true
        artifact_name: zap-api-${{ github.run_id }}
```

Only runs when the API spec changes — keeps the per-PR cost predictable.

## Interpret findings → file as a defect

The mapping from ZAP's risk → our `severity:*` labels lives in `documents/security/zap-severity-map.json`:

```json
{
  "High": "severity:critical",
  "Medium": "severity:major",
  "Low": "severity:minor",
  "Informational": null
}
```

Other label rules:

| Label family | Value source |
|---|---|
| `module:*` | URL path of the alert (e.g. `/cart` → `module:cart`); `module:auth` for `/login`, `/register`, `/account`, `/logout`; `module:infra` for non-app-specific (TLS, headers) |
| `root-cause:*` | `root-cause:logic` if it's an app bug; `root-cause:env` if it's a header / TLS / config issue; `root-cause:integration` if it's an upstream service |
| `phase:*` | `phase:e2e` (ZAP runs against a deployed app) |
| `found-in:*` | `found-in:qa` (per-PR baseline / API scan); `found-in:staging` (nightly full); `found-in:prod` only if the scheduled scan happens to point at prod (rare; gated on legal sign-off) |
| `priority:*` | Inherits from severity by default; bump to higher priority if the affected `module:*` is currently in active development |

The [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill handles the issue creation if you wire `npm run security:from-zap` to call it. Issues land in GitHub with the canonical labels and surface in [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) Section 3 alongside functional defects.

## Common false positives (and what to do about them)

| Alert | Common cause on demo / e-commerce SUTs | Action |
|---|---|---|
| `Modern Web Application` | Spider followed a `<a target="_blank">` to a third-party | `IGNORE` with comment naming the target |
| `X-Content-Type-Options Header Missing` | Static asset CDN strips it | `WARN` if confirmed at the CDN layer; `FAIL` if missing on app responses |
| `Cookie No HttpOnly Flag` | A non-session marketing cookie | `IGNORE` per cookie name; never globally |
| `Application Error Disclosure` | Stack trace in a 5xx body during the scan | Investigate first — often a real finding masquerading as noise |
| `Cross Domain JavaScript Source File Inclusion` | jQuery / fonts loaded from CDN | `IGNORE` with comment listing the legitimate origin |
| `Information Disclosure - Suspicious Comments` | Generated `<!-- TODO -->` from a build tool | Tune at the build, then `IGNORE` |

If a finding is suppressed, the suppression comment is a contract — re-review on every quarterly threat-model pass.

## Authenticated full scan — the gotchas

- **Logout protection.** Add `.*logout.*` to context excludes, or the spider will log itself out within minutes.
- **Password reset / account deletion.** Always exclude. ZAP will gleefully POST to them.
- **CSRF tokens.** ZAP can replay a CSRF-protected POST only if the token is in the response of a preceding request — for SPAs that mint tokens via XHR, you'll need a Replacer rule or an Authentication script.
- **Rate limiting.** Active rules fire many requests per second; if your SUT has rate-limit middleware, ZAP will trip it. Either whitelist ZAP's source IP or accept that some rules will be inconclusive.
- **Test data hygiene.** Never run against a DB you can't restore — full scans WILL submit junk to every form.

## ZAP API for custom scripts (rare)

ZAP exposes a REST API on `http://localhost:8080` (when started in daemon mode). You usually don't need it — `zap-baseline.py` and friends wrap the common flows. The two cases where you might:

- **Custom alert filtering** that the rules tsv can't express (e.g. "ignore alert X only for URLs matching pattern Y") — use the REST API to mark alerts as false-positive in the session post-scan.
- **Multi-step authentication** that doesn't fit form / JSON / OAuth — write a ZAP Authentication Script in Zest or JavaScript and load via the API.

If you find yourself reaching for either, consider whether [Burp Suite](./burp-suite.md) Pro's scripting model fits your case better — the engineering investment is similar but Burp's scripting is more mature.

## Anti-patterns this guideline rules out

- ❌ Running ZAP without a tuned rules tsv (build oscillates red/green based on noise)
- ❌ Suppressing a finding without a comment (creates a "we already looked at this" cargo cult)
- ❌ Using the GUI as the source of truth for CI (irreproducible across machines)
- ❌ Pointing ZAP Full Scan at production without explicit, dated sign-off (legal + reliability risk)
- ❌ Letting the action's built-in issue writer fire (bypasses canonical labels; clutters the issue tracker)
- ❌ Treating ZAP as a substitute for [Burp Suite](./burp-suite.md) manual testing (different tools for different jobs)
- ❌ "We ran ZAP" as a security claim — only "we ran ZAP, triaged every alert, and the build is gated on the result" counts

## Legal & scope

You may run ZAP **only** against:

1. Targets your organisation owns or operates.
2. Public targets that have a written authorisation policy permitting scanning (most bug-bounty programs; some testbeds).
3. The repo's defaulted SUT (LambdaTest e-commerce playground) for **passive baseline only** — full / API scan against third-party properties needs the property owner's authorisation.

If in doubt, **don't scan**. The cost of an unauthorised scan is real (legal risk, reputation, getting banned from the testbed). Document authorisations under `documents/security/scan-authorizations/<target>.md` with the dated sign-off.

## Related

- [`README.md`](./README.md) — folder index, threat model, decision matrix
- [`toolchain.md`](./toolchain.md) §6 — the compact entry this file expands
- [`burp-suite.md`](./burp-suite.md) — manual pen-test sibling guideline (the right tool for the cases ZAP doesn't reach)
- [`SECURITY.md`](../../SECURITY.md) — disclosure policy, scope, hardening guarantees
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — host workflow for the per-PR + nightly jobs
- [`documents/ci/shared-conventions.md`](../ci/shared-conventions.md) — artifact + reporter contracts the ZAP jobs preserve
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — canonical label set every ZAP-derived issue uses
- [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) — agent workflow for security-testing one endpoint
- [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — converts ZAP JSON to a Jira/GitHub-ready issue
- [`tests/api/test-security.spec.ts`](../../tests/api/test-security.spec.ts) — in-repo Playwright security suite (intent tests ZAP can't generate)
