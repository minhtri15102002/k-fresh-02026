# Security Testing Toolchain

> Canonical tool **per category** with install, run, interpret, and CI-gate snippets — calibrated for this repo's stack: **Node 20, TypeScript, Playwright, GitHub Actions, optional Docker**. The companion to [`README.md`](./README.md), which states the threat model and the decision matrix; this file is the executable how-to.

Each section follows the same shape so you can lift any one in isolation:

```
1. Why we picked it
2. Install
3. Run locally
4. Wire into CI (gate, not report)
5. Interpret findings → file as a defect
6. Tuning / common false positives
7. Alternatives we rejected
```

If you need to swap a tool, replace one section and the rest of the chain still works.

---

## 1 · Secret scanning — `gitleaks`

**Threat covered:** T1 — credential leakage in committed files or git history.

### Why we picked it

- Fast, single Go binary; no daemon.
- Default ruleset matches every secret family in [`SECURITY.md`](../../SECURITY.md) §Secrets policy (GitHub PATs, Slack/Google Chat webhooks, SMTP creds).
- Has both `protect` (pre-commit, fast, only-staged) and `detect` (CI, full history) modes — exactly the two cadences we need.
- Free, MIT, no vendor lock-in.

### Install

```bash
brew install gitleaks            # macOS
# or
go install github.com/gitleaks/gitleaks/v8@latest
```

### Run locally

```bash
gitleaks protect --staged --redact --verbose          # pre-commit, fast
gitleaks detect  --redact --verbose                   # full history (slow first run)
```

### Wire into CI (per-PR gate)

Add a step to [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml) (or a sibling `security.yml`):

```yaml
- name: Secret scan (gitleaks)
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    GITLEAKS_LICENSE: ${{ secrets.GITLEAKS_LICENSE }}   # optional; required for org plan
```

Wire into husky pre-commit (already established hooks, see [`documents/husky-guidelines.md`](../husky-guidelines.md)):

```bash
# .husky/pre-commit
gitleaks protect --staged --redact || {
  echo "✗ gitleaks blocked the commit. Rotate the secret and retry." >&2
  exit 1
}
```

### Interpret findings → file as a defect

A gitleaks finding is **always** `severity:critical` once the leak is on the remote. File:

```bash
gh issue create \
  --title "[SECRET LEAK] $RULE_ID in $FILE" \
  --label "bug,severity:critical,module:auth,root-cause:logic,phase:unit,found-in:dev"
```

Then **rotate the credential immediately** per [`SECURITY.md`](../../SECURITY.md) §"If a secret leaks". The git-history rewrite is a footnote — rotation is the only real fix.

### Tuning

- Add a `.gitleaks.toml` with `[allowlist]` entries for known false positives (e.g., example tokens in `*.example` files). Never allow-list a real path you simply forgot to clean up.
- Path ignores (`profiles/.env.<env>.local`) are already handled by `.gitignore`; do not double-allowlist them in `.gitleaks.toml` — keep `.gitignore` as the single source.

### Alternatives we rejected

- **`trufflehog`** — broader ruleset but slower and noisier; harder to tune to a green pre-commit.
- **GitHub Secret Scanning** alone — only available on public repos / GHAS, runs after the push (i.e., after the leak). We use it as a **safety net**, not the primary gate.

---

## 2 · SAST (TS/JS) — `eslint-plugin-security` + `semgrep`

**Threat covered:** T6 — unsafe patterns in test code (eval, shell-out, regex DoS, prototype pollution).

### Why we picked it

- ESLint is **already in the build** (`npm run linter`); adding a plugin is a config-only change.
- `semgrep` adds language-aware patterns ESLint can't express, with a curated OSS ruleset (`p/javascript`, `p/owasp-top-ten`).
- Both have stable per-rule disable comments, so noise is fixable without disabling the gate.

### Install

```bash
npm i -D eslint-plugin-security
# semgrep is a Python tool; install via pipx or use the Action below
```

### Configure

Add to `eslint.config.mjs`:

```js
import security from 'eslint-plugin-security';
export default [
  // ... existing config ...
  security.configs.recommended,
];
```

### Run locally

```bash
npm run linter                                       # ESLint security rules included
semgrep --config p/javascript --config p/owasp-top-ten --error tests/ pages/ scripts/ utilities/
```

### Wire into CI (per-PR gate)

```yaml
- name: SAST (eslint-plugin-security)
  run: npm run linter

- name: SAST (semgrep)
  uses: semgrep/semgrep-action@v1
  with:
    config: p/javascript p/owasp-top-ten
```

ESLint failures already block the build via `check:all`. Semgrep starts as **warn-only** (`continue-on-error: true`) for the first sprint — flip to a hard gate once the noise is tuned.

### Interpret findings → file as a defect

| Severity from tool | Defect severity label |
|---|---|
| `error` | `severity:major` (or `severity:critical` if it's `eval`/`exec` with user input) |
| `warning` | `severity:minor` |
| `info` | not filed; fix in next refactor |

Always pair with `root-cause:logic` and `phase:unit`. If the rule was `detect-non-literal-regexp` and the regex is user-controlled, escalate to `severity:major`.

### Tuning / common false positives

- `detect-object-injection` is famously noisy; disable per-file with `// eslint-disable-next-line security/detect-object-injection` and prefer `Map` / `Object.create(null)` in hot loops.
- `semgrep` rule `javascript.lang.security.audit.dangerous-spawn-shell` flags every shell-out — review case by case. Test code that shells out to `gh`/`git` is fine; production code shelling out with concatenated user input is not.

### Alternatives we rejected

- **CodeQL** — excellent depth, but slower and harder to tune than semgrep for a small repo.
- **SonarQube SAST profile** — already in this repo for code-smell, but its security rules overlap heavily with semgrep + ESLint and add little.

---

## 3 · SCA (dependencies) — Dependabot + `npm audit`

**Threats covered:** T2 (malicious dep), T3 (vulnerable dep).

### Why we picked it

- **Dependabot** is GitHub-native, opens auto-PRs with the upgrade, and matches the [`SECURITY.md`](../../SECURITY.md) §Dependency hygiene policy ("PRs that add a dep must explain why").
- **`npm audit`** runs in any environment, no auth, gives a fast local sanity check.
- Together they cover **alerting** (Dependabot) + **on-demand check** (npm audit).

### Configure Dependabot

`.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 5
    labels: [ "bug", "severity:major", "module:auth", "phase:integration", "found-in:qa" ]
    allow:
      - dependency-type: "direct"
      - dependency-type: "indirect"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

> Note the labels: Dependabot PRs and the bug issues they file follow the same convention as functional defects, so they show up in Section 3 of the dashboard.

### Run locally

```bash
npm audit --audit-level=high         # informational; non-zero exit on high+
npm audit fix --dry-run              # see what would change
```

### Wire into CI (per-PR gate)

```yaml
- name: SCA (npm audit)
  run: npm audit --audit-level=high
  continue-on-error: true            # advisory; Dependabot is the gate
```

`npm audit` is **advisory** in this repo per [`SECURITY.md`](../../SECURITY.md) §Dependency hygiene — the high-noise advisories are triaged manually before being filed. The Dependabot PR is the merge gate.

### Interpret findings → file as a defect

| CVSS | Defect severity label | Action |
|---|---|---|
| 9.0–10 (Critical) | `severity:critical` | Block release, hotfix path. Tag `priority:p1`. |
| 7.0–8.9 (High) | `severity:major` | Merge Dependabot PR within 7 days. `priority:p2`. |
| 4.0–6.9 (Medium) | `severity:minor` | Merge in next sprint. `priority:p3`. |
| 0.1–3.9 (Low) | `severity:trivial` | `priority:p4`. |

Always `root-cause:integration` (it's a dependency, not your code), `phase:integration`, `found-in:qa` (CI caught it).

### Tuning

- Add `package.json` `overrides` to pin a transitive dep when the upstream is slow to release ([`SECURITY.md`](../../SECURITY.md) §Dependency hygiene example).
- Don't `npm audit fix --force` — read the diff. Forced major bumps break things.

### Alternatives we rejected

- **Snyk** — excellent, but commercial. Add later if Dependabot's prioritisation becomes insufficient.
- **Socket** — supply-chain anomaly detection (typosquats, malicious updates). Strong complement; defer until the npm-deps tree is stable.

---

## 4 · CI / workflow security — `actionlint` + `zizmor`

**Threat covered:** T4 — insecure CI workflow (over-scoped tokens, untrusted PR code, command injection in `run:` blocks).

### Why we picked it

- `actionlint` catches **structural** issues (typos, bad `if:`, missing inputs) before they fail at runtime.
- `zizmor` catches **security** issues specifically (tokens with `write` scope, expression injection, untrusted-input flow). It is purpose-built for the CI threat that has produced multiple supply-chain incidents in 2024–25.

### Install

```bash
brew install actionlint
pipx install zizmor
```

### Run locally

```bash
actionlint                           # structural
zizmor .github/workflows/*.yml       # security
```

### Wire into CI (per-PR gate, only when workflows change)

```yaml
- name: Workflow lint (actionlint)
  uses: rhysd/actionlint@v1

- name: Workflow security (zizmor)
  run: |
    pipx install zizmor
    zizmor .github/workflows/*.yml --persona auditor --format sarif --output zizmor.sarif
- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with: { sarif_file: zizmor.sarif }
```

### Interpret findings → file as a defect

| zizmor finding | Defect severity label |
|---|---|
| `dangerous-triggers` (`pull_request_target` + checkout) | `severity:critical` — fix before merge |
| `excessive-permissions` (default `write`) | `severity:major` |
| `template-injection` (untrusted `${{ }}` in `run:`) | `severity:critical` |
| `unpinned-uses` (action ref without SHA) | `severity:minor` |

`module:auth` (CI is the trust boundary), `root-cause:integration`, `phase:integration`, `found-in:qa`.

### Tuning

- For pre-existing findings on day 1, file a single tracking issue per category and remediate one per sprint — do not turn off the rule.
- `unpinned-uses` warnings on first-party Actions (`actions/checkout@v4`) are acceptable per the GitHub recommendation; configure `zizmor` `ignore` only for `actions/*` and `github/*` namespaces.

### Alternatives we rejected

- **`step-security/harden-runner`** — runtime egress filter, complementary not redundant. Add when the runner has been pwned once and the team wants belt-and-braces.

---

## 5 · Container / IaC — `trivy`

**Threat covered:** T5 — vulnerable base image, leaked secrets in Dockerfile, mis-configured manifest.

> Applies once the [`docker-runner`](../../.agents/skills/docker-runner/SKILL.md) skill produces a `Dockerfile`. Until then this section is reference material.

### Why we picked it

- One binary, three modes — `image`, `fs`, `config` — covers Docker images, the repo filesystem, and IaC manifests.
- Default ruleset is broad and well-maintained.
- SARIF output flows directly into GitHub Code Scanning if enabled.

### Install

```bash
brew install trivy
# or use the official action — see CI snippet below
```

### Run locally

```bash
trivy fs    --severity HIGH,CRITICAL --exit-code 1 .
trivy image --severity HIGH,CRITICAL --exit-code 1 ai-qa-training:latest
trivy config --severity HIGH,CRITICAL .                # IaC: Dockerfile, k8s, terraform
```

### Wire into CI (gate on Docker build)

```yaml
- name: Container scan (trivy image)
  uses: aquasecurity/trivy-action@0.20.0
  with:
    image-ref: ai-qa-training:${{ github.sha }}
    severity: HIGH,CRITICAL
    exit-code: 1
    format: sarif
    output: trivy.sarif

- name: Filesystem + IaC scan (trivy fs/config)
  run: |
    trivy fs --severity HIGH,CRITICAL --exit-code 1 .
    trivy config --severity HIGH,CRITICAL --exit-code 1 .
```

### Interpret findings → file as a defect

| Trivy severity | Defect severity label |
|---|---|
| `CRITICAL` | `severity:critical` — bump base image / pin override / file CVE |
| `HIGH` | `severity:major` — fix in next image rebuild |
| `MEDIUM` / `LOW` | not filed; reviewed quarterly |

`module:auth` if the affected package is auth-adjacent, otherwise `module:product` (the runner image), `root-cause:integration`, `phase:integration`, `found-in:qa`.

### Tuning

- Use `.trivyignore` for documented, accepted CVEs (e.g., `CVE-2024-XXXXX expires 2026-12-31` with a justification line).
- Pin base images by digest (`node:20-bookworm@sha256:...`), not by tag, to make scans reproducible.

### Alternatives we rejected

- **`grype`** — excellent vuln scanner, similar coverage; we picked Trivy because it covers IaC + filesystem + image in one tool.

---

## 6 · DAST — OWASP ZAP

**Threat covered:** T7 — running-app vulnerabilities in the system-under-test (the OpenCart demo, in this repo's case).

> 📖 **Deep-dive:** [`owasp-zap.md`](./owasp-zap.md) covers the 3 scan modes (Baseline / API Scan / Full Scan), authenticated scans via Playwright session sharing, rules-tsv tuning, the per-PR + nightly + API-on-spec-change CI snippets, the false-positive playbook, and the legal/scope contract. The summary below stays in toolchain.md as the orientation entry; reach for the deep-dive when configuring or debugging.

> Findings are filed **upstream** to the SUT, not against this repo — see [`SECURITY.md`](../../SECURITY.md) §Scope. We run ZAP for two reasons: catch regressions in our own demo wiring, and produce evidence for the QA dashboard's leakage panel.

### Why we picked it

- Free, OWASP-flagship, has a maintained GitHub Action.
- Two cadences are perfect for our needs: **Baseline** (passive, ~5 min — per-PR) and **Full Scan** (active, 30+ min — nightly).
- Outputs SARIF + Markdown, both easy to attach to a PR comment or a defect issue.

### Run locally (Docker)

```bash
docker run -v $(pwd):/zap/wrk/:rw -t zaproxy/zap-stable:latest \
  zap-baseline.py -t https://ecommerce-playground.lambdatest.io -r zap-baseline.html
```

### Wire into CI (per-PR baseline + nightly full)

```yaml
# Per-PR baseline (5 min)
- name: DAST baseline (ZAP)
  uses: zaproxy/action-baseline@v0.13.0
  with:
    target: ${{ env.BASE_URL }}
    fail_action: true
    cmd_options: "-a"

# Nightly full scan (separate workflow, schedule: '0 2 * * *')
- name: DAST full scan (ZAP)
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: ${{ env.BASE_URL }}
    fail_action: false                # advisory until tuned
```

### Interpret findings → file as a defect

| ZAP risk | Defect severity label |
|---|---|
| `High` | `severity:critical` — block release |
| `Medium` | `severity:major` |
| `Low` | `severity:minor` |
| `Informational` | not filed |

`module:*` according to the affected URL path (e.g., `/cart` → `module:cart`). `root-cause:logic` if it's an app bug, `root-cause:env` if it's a header / TLS misconfiguration. `phase:e2e`, `found-in:staging` (nightly) or `found-in:qa` (per-PR).

### Tuning

- ZAP's HTTP-method rules (`Allow` / `OPTIONS`) are noisy on demo apps; allow-list per `-c zap-rules.tsv` once reviewed.
- Authenticated scans require a `zap-context.xml` — keep it under `documents/security/zap-context.xml` (gitignored if it contains real session tokens).

### Alternatives we rejected

- **Burp Suite Pro / Enterprise** — gold-standard for manual / scheduled scanning, but Pro has no headless mode and Enterprise is custom-priced. We use Burp **manually** for the quarterly pass; the deep-dive is at [`burp-suite.md`](./burp-suite.md).
- **Caido** — modern Rust-based proxy with a generous free tier; covered alongside Burp in [`burp-suite.md`](./burp-suite.md).
- **Nuclei** — excellent template engine, fast, but template upkeep is a job in itself; revisit when the team has spare capacity.

---

## 7 · API security — `schemathesis` + this repo's `tests/api/test-security.spec.ts`

**Threat covered:** T7 — auth/authz, IDOR, BOLA, injection, rate-limit bypass at the API surface.

### Why we picked it

- **Schemathesis** generates property-based tests **directly from an OpenAPI spec** — the highest leverage you can get for an API surface. Catches whole categories (status-code consistency, schema-violating inputs) that hand-written tests miss.
- The existing **`tests/api/test-security.spec.ts`** (REQ-SEC-01: cookie hardening, session rotation, HTTPS, anonymous-access boundary, brute-force throttling) covers the *intent* tests Schemathesis can't generate.
- Both file findings as `bug + severity:* + module:auth + root-cause:logic` like any other defect.

### Install Schemathesis

```bash
pipx install schemathesis
```

### Run locally

```bash
# Against the SUT's OpenAPI spec (or a local copy)
schemathesis run https://api.example.com/openapi.json \
  --checks=all --hypothesis-deadline=2000 --workers=4
```

### Wire into CI (per-PR gate)

```yaml
- name: API security (schemathesis)
  run: |
    pipx install schemathesis
    schemathesis run "$OPENAPI_URL" \
      --checks=all \
      --hypothesis-deadline=2000 \
      --report=schemathesis.json
  env:
    OPENAPI_URL: ${{ env.OPENAPI_URL }}

- name: API security (Playwright in-repo suite)
  run: cross-env ENV=qa npx playwright test tests/api/test-security.spec.ts
```

### Interpret findings → file as a defect

| Schemathesis check | Likely OWASP API category | Severity |
|---|---|---|
| `not_a_server_error` (5xx on valid input) | API4 — Resource Consumption | `severity:major` |
| `status_code_conformance` | API3 — Property Auth | `severity:minor` |
| `response_schema_conformance` | API3 / API9 | `severity:minor` |
| `content_type_conformance` | API8 — Misconfiguration | `severity:minor` |
| Hand-coded auth/IDOR test failure | API1 / API2 / API5 | `severity:critical` |

`module:*` mapped from the failing endpoint, `root-cause:logic`, `phase:integration`, `found-in:qa`.

### Tuning

- Schemathesis can be slow against a public demo. Limit `--hypothesis-max-examples=50` per endpoint until you have a budget for nightly.
- Use `--data-generation-method=positive,negative` to force boundary input — pairs well with [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md).

### Alternatives we rejected

- **Postman / Newman** — fine for happy-path API tests; weak for security fuzzing. Already covered by the in-repo Playwright suite for the curated cases.
- **Stackhawk** — commercial DAST that overlaps ZAP; defer.

---

## 8 · LLM safety — `promptfoo` + Garak

**Threat covered:** T8 — prompt injection, unsafe LLM behaviour, prompt-regression as agents and skills evolve.

> Specific to this repo because it ships AI agents and skills under `.agents/` and trains them. If your fork doesn't use AI agents, skip this section.

### Why we picked it

- **`promptfoo`** is the regression harness — pin a behaviour, fail the build if a future prompt change breaks it. Same role as Playwright for UI.
- **Garak** is the red-team fuzzer — runs adversarial probes (jailbreaks, prompt injection, data exfiltration) against an LLM endpoint. Quarterly cadence is enough; per-PR would be wasteful.

### Install

```bash
npm i -D promptfoo
pipx install garak
```

### Run locally

```bash
# Regression
promptfoo eval -c .promptfoo/config.yaml

# Red-team
garak --model_type openai --model_name gpt-4 \
  --probes promptinject,dan,encoding --report_prefix garak-q1-2026
```

### Wire into CI (per-PR regression; quarterly red-team)

```yaml
- name: LLM regression (promptfoo)
  run: npx promptfoo eval -c .promptfoo/config.yaml --output promptfoo.json

# Garak runs on a quarterly schedule — separate workflow, not per-PR.
```

### Interpret findings → file as a defect

| Tool finding | Defect severity label |
|---|---|
| Garak: prompt-injection bypass leaks system prompt | `severity:critical` |
| Garak: jailbreak produces disallowed content | `severity:major` |
| promptfoo: assertion regression on a pinned scenario | `severity:major` |
| Garak: minor formatting / refusal inconsistency | `severity:minor` |

`module:auth` if the agent has tool-use permissions, otherwise `module:product`. `root-cause:logic` (prompt) or `root-cause:requirements` (the agent never had a guardrail for that case). `phase:exploratory` for Garak, `phase:unit` for promptfoo.

### Tuning

- Pin `promptfoo` scenarios that represent **business-critical** assertions (e.g., "the code-committer must refuse `.env` files"). Don't pin every output — that's an LLM-flake factory.
- Re-run Garak after any model upgrade, even within a family (e.g., GPT-4 → GPT-4-Turbo) — behaviour shifts subtly.

### Alternatives we rejected

- **PyRIT** (Microsoft) — comparable to Garak, heavier dependency tree. Pick Garak for new orgs; PyRIT if you're already in the Microsoft ecosystem.

---

## 9 · Manual pen-test — Burp Suite Community / Caido

**Threat covered:** Residual — the human-driven layer for what scanners can't reach (business-logic abuse, multi-step auth, race conditions).

> 📖 **Deep-dive:** [`burp-suite.md`](./burp-suite.md) covers Community vs Pro vs Enterprise editions and Caido (the modern Rust-based alternative), proxy + CA-cert setup, the 5 tabs you actually use (Proxy / Target / Repeater / Intruder / Decoder), the Playwright→HAR→Burp→defect workflow, the per-finding write-up template, the Pro-features tour, and the legal/scope contract. The summary below stays in toolchain.md as the orientation entry.

### Cadence

- **Quarterly**, scoped to one surface (e.g., the cart-checkout flow).
- **Before every public-facing release** that materially changes the auth surface.

### Workflow

1. Burp/Caido proxy + browser → drive the flow once via Playwright codegen, exporting the HAR.
2. Replay through Burp/Caido, manually attack the boundaries (parameter tampering, IDOR by ID enumeration, race conditions on `/cart`).
3. Findings → defect issue with the canonical labels (`severity:*`, `module:*`, `phase:exploratory`, `found-in:staging`).

### Why this matters even with all the scanners above

The scanners catch known categories. Manual pen-test catches:

- **Business-logic abuse** — e.g., applying a discount code multiple times by racing the cart endpoint.
- **Auth chains** — e.g., the password-reset email contains a link that doesn't expire.
- **Stateful IDOR** — e.g., accessing other users' resources only after a specific multi-step flow.

These are the highest-severity findings most automation misses. Budget at least **one engineer-day per quarter**.

---

## Summary — the canonical pipeline

After all sections above are wired, the per-PR pipeline looks like this:

```
husky pre-commit         CI per-PR                              Schedule
─────────────────        ──────────────────────                 ────────────
gitleaks protect    →    eslint + semgrep                  →    daily   : Dependabot, trivy fs
npm audit (warn)         npm audit (warn)                       nightly : ZAP full scan, trivy image
                         actionlint + zizmor (workflow PRs)     quarterly: Garak, manual Burp
                         ZAP baseline
                         schemathesis
                         playwright api-security suite
                         promptfoo eval
```

**Build is red** if any per-PR step finds a `severity:major` or higher; warn-only steps are flagged in the PR comment but don't block. Daily/nightly scans **file an issue** with the canonical labels and let the dashboard surface trends — they don't block in-flight PRs (wrong cadence for that).

> Cross-references: gates ride on the contract in [`documents/ci/shared-conventions.md`](../ci/shared-conventions.md); concrete YAML lives in [`documents/ci/github-actions.md`](../ci/github-actions.md). Findings flow through the labels in [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) and surface in [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) Section 3.
