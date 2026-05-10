# Security Testing Tools — Guideline

> Source-of-truth folder for **which security testing tools we use, when, and how they plug into this repo's CI + dashboard**. The companion to [`SECURITY.md`](../../SECURITY.md) (policy + threat model) and [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) (one tactical workflow). Where `SECURITY.md` says *what we promise*, this folder says *how we verify it with tools*.

A defensible security testing posture is **not "we ran a scanner"**. It is:

1. A **threat model** — which classes of attack we actually care about for this codebase.
2. A **tool per category** — one canonical tool for SAST / DAST / SCA / Secrets / Container / API, not seven overlapping ones.
3. A **gate, not a report** — each tool either passes the build or files a defect through the same `bug + severity:* + module:*` convention as every other failure.
4. A **cadence** — pre-commit, per-PR, nightly, or quarterly — picked by attack speed, not by scanner verbosity.
5. A **path to the QA dashboard** — security findings ride the same pipe as functional defects so leadership sees one quality picture.

If any of those five is missing, the scan is theatre. The discipline below makes them all explicit.

## The picture

```
┌────────────────┐ pre-commit ┌──────┐  per-PR  ┌──────────┐  nightly  ┌────────────┐
│ DEVELOPER      │──────────▶│ HOOK │ ──────▶  │ CI CHECK │ ───────▶  │ SCHEDULED  │
│ machine        │  gitleaks │      │ ESLint   │          │ ZAP base  │ FULL SCAN  │
│ (write code)   │  npm audit│      │ semgrep  │          │ Trivy     │ ZAP full   │
│                │           │      │ Dependa- │          │ schemath. │ Garak (LLM)│
│                │           │      │ bot      │          │           │            │
└──────┬─────────┘           └──────┘          └────┬─────┘           └─────┬──────┘
       │ findings                                   │ findings              │ findings
       ▼                                            ▼                       ▼
                  ┌────────────────────────────────────────────────────────────┐
                  │ GITHUB ISSUES  (label: bug + severity:* + module:auth/...) │
                  │       ▲                                                    │
                  │       │ scripts/fetch-defects.ts                           │
                  └───────┼────────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌────────────────────────────────────────────┐
                  │ QA METRICS DASHBOARD  (Section 3 Defects)  │
                  │ severity / module / leakage / aging panels │
                  └────────────────────────────────────────────┘
```

Security findings are **just another flavour of defect**. They're severity- and module-labelled like any other bug, so the [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) already shows them next to functional bugs. The new `found-in:*` and `root-cause:*` labels (see [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md)) let the dashboard separate "found in CI" vs "escaped to prod".

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | Threat model, tool-category decision matrix, cadence, cross-refs | First time wiring security tooling; orientation |
| [`toolchain.md`](./toolchain.md) | One canonical tool per category with **install + run + interpret + gate** for each — for the Node/TypeScript/Playwright stack this repo runs | Every time you set up, debug, or upgrade a security tool |
| [`owasp-zap.md`](./owasp-zap.md) | Deep-dive on OWASP ZAP — Baseline / API Scan / Full Scan modes, authenticated scans (Playwright session sharing), rules tsv tuning, CI gate wiring, defect-issue routing, false-positive playbook | Configuring or tuning the per-PR DAST gate; ZAP nightly returning noisy alerts |
| [`burp-suite.md`](./burp-suite.md) | Deep-dive on Burp Suite (Community / Pro / Enterprise) and **Caido** — proxy + cert setup, the five tabs you actually use, the Playwright→HAR→Burp→defect workflow, write-up template, legal/scope discipline | Quarterly manual pen-test; deep iteration on a single finding ZAP couldn't classify |

## Reading order

1. **`README.md`** — read once for the threat model + tool-category map.
2. **`toolchain.md`** — keep open while configuring; one tool per H2 section, copy/paste-ready snippets.
3. **`owasp-zap.md`** OR **`burp-suite.md`** — when you reach for the specific tool. ZAP is the automated lane (every PR / nightly); Burp is the manual lane (quarterly + deep-dive on one finding). Both reference each other.
4. [`SECURITY.md`](../../SECURITY.md) — policy / disclosure / hardening guarantees (this folder is the *how*; that file is the *what we promise*).
5. [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) — when the agent is asked to security-test a specific endpoint.

## Threat model — what we are actually defending against

This repo is a **Playwright UI/API test framework**. It does not serve traffic, so the canonical web-app threat model (XSS / SQLi against *us*) is mostly out of scope. The realistic threats are:

| # | Threat | Tool category | Severity if exploited |
|---|---|---|---|
| T1 | **Credential leakage** in committed files or git history | Secret scanning (gitleaks, GitHub Secret Scanning) | `severity:critical` |
| T2 | **Malicious or compromised npm dependency** | SCA (npm audit, Dependabot, Socket) | `severity:critical` |
| T3 | **Vulnerable npm dependency** with a known CVE | SCA (Dependabot, Snyk) | `severity:major` |
| T4 | **Insecure CI workflow** — pwned PRs, over-scoped tokens, untrusted code execution | IaC / workflow scanning (`actionlint`, `zizmor`) | `severity:critical` |
| T5 | **Insecure container image** (when packaging for `docker-runner`) | Container scanning (Trivy) | `severity:major` |
| T6 | **Test code injection / unsafe patterns** (eval, shell-out, regex DoS in test helpers) | SAST (ESLint security plugin, semgrep) | `severity:major` |
| T7 | **Bugs in the system-under-test** (auth bypass, IDOR, missing rate limit) discovered by Playwright tests | DAST + API security | filed as `severity:critical` upstream — see [`SECURITY.md`](../../SECURITY.md) scope |
| T8 | **Prompt injection / unsafe LLM behaviour** in agents and skills | LLM security (Garak, promptfoo evals) | `severity:major` |
| T9 | **AI-agent over-permission** — code-committer or similar agent staging a `.env` | Policy + grep gates (already documented in SECURITY.md) | `severity:critical` |

> See [`SECURITY.md`](../../SECURITY.md) §Scope for the formal in/out-of-scope split. This table is the operational mapping from threat → tool.

## Tool-category decision matrix

For each category, **pick exactly one canonical tool** so the build doesn't drown in duplicate findings. Alternatives are listed in [`toolchain.md`](./toolchain.md) for organisations with different constraints.

| Category | Threat covered | This repo's pick | Cadence | Build-failing? |
|---|---|---|---|---|
| **Secret scanning** | T1 | `gitleaks` (pre-commit + CI) + GitHub Secret Scanning (always-on) | Pre-commit + per-PR | ✅ Yes |
| **SAST (TS/JS)** | T6 | `eslint-plugin-security` + `semgrep` (OSS rulesets) | Per-PR | ✅ Yes (eslint), ⚠️ Warn (semgrep until tuned) |
| **SCA (deps)** | T2, T3 | Dependabot + `npm audit` (informational) | Daily (Dependabot), per-PR (npm audit) | ⚠️ PR review required (Dependabot), ❌ No (npm audit — see [`SECURITY.md`](../../SECURITY.md) §Dependency hygiene) |
| **CI / workflow security** | T4 | `actionlint` + `zizmor` | Per-PR when `.github/workflows/**` changes | ✅ Yes |
| **Container / IaC** | T5 | `trivy image` + `trivy fs` | On `docker build` (manual or per-release) | ✅ Yes for `severity:HIGH+` |
| **DAST (running app)** | T7 | OWASP ZAP Baseline (per-PR), ZAP Full (nightly) | Per-PR baseline; nightly full | ✅ Yes (baseline), ⚠️ Warn (full) |
| **API security** | T7 | Schemathesis (OpenAPI fuzzing) + this repo's existing `tests/api/test-security.spec.ts` | Per-PR | ✅ Yes |
| **LLM safety** | T8 | promptfoo evals (regression) + Garak (red-team, scheduled) | Per-PR (promptfoo); quarterly (Garak) | ✅ Yes (promptfoo); ⚠️ Warn (Garak) |
| **Manual pen-test** | residual | Burp Suite Community / Caido | Quarterly or before a public-facing release | n/a — informs roadmap |

> **Convention.** Each tool either fails the build (`exit 1`) **or** files a GitHub issue with the canonical labels — it never just prints a warning that nobody reads. The "Build-failing?" column is the SLO.

## Cadences

| Cadence | What runs | Owner |
|---|---|---|
| **Pre-commit** (husky) | `gitleaks protect`, `npm audit --audit-level=high` (advisory), eslint-security | Author |
| **Per-PR** (CI) | `eslint-plugin-security`, `semgrep`, ZAP Baseline, Schemathesis, `actionlint`, `zizmor`, promptfoo eval-regression | CI; merge blocked on red |
| **Daily** (scheduled) | Dependabot scan (auto-PR), `trivy fs` against the repo, npm audit summary → defect issue | QA Platform |
| **Nightly** (scheduled) | ZAP Full Scan against the SUT, `trivy image` against the published Docker image | QA Platform |
| **Quarterly** | Garak (LLM red-team), manual Burp/Caido pass on public surfaces, full threat-model review | AI Quality Leader |
| **On every CVE advisory** | Triage Dependabot alert; if exploitable on `main`, file `severity:critical` and rotate as needed | SECURITY.md owner |

## How findings reach the QA Metrics Dashboard

Every security tool's output funnels through the **same defect-label convention** as any other bug, so no parallel reporting pipeline is needed:

1. The tool produces a finding (CVE, CWE, OWASP rule ID, ZAP alert, semgrep rule ID, …).
2. CI (or the developer if local) opens a GitHub Issue with:
   - `bug` + exactly one `severity:*` (mapped from the tool's severity)
   - exactly one `module:*` (the affected area; security findings most often map to `module:auth` or whichever module the surface belongs to)
   - `root-cause:*` from the new convention — security findings almost always map to `root-cause:logic`, `root-cause:integration`, `root-cause:env`, or `root-cause:requirements`
   - `found-in:dev` (pre-commit), `found-in:qa` (per-PR), `found-in:staging` (nightly), or `found-in:prod` (escape) — **`found-in:prod` drives the Defect Leakage KPI** in the dashboard
   - `phase:*` matching where the tool ran — `phase:unit` for SAST, `phase:integration` for SCA, `phase:e2e` for DAST, `phase:exploratory` for manual pen-test, `phase:customer` if reported externally
3. `npm run fetch:defects` (see [`scripts/fetch-defects.ts`](../../scripts/fetch-defects.ts)) writes `reports/defects.json`.
4. The QA Metrics Dashboard renders these findings in Section 3 alongside functional bugs.

> See [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) for the full label catalogue, including the `priority:*`, `root-cause:*`, `phase:*`, and `found-in:*` families introduced for the dashboard's Tier-1+2 KPIs.

## Cross-references

- [`SECURITY.md`](../../SECURITY.md) — disclosure policy, hardening guarantees, secrets policy. **Read this first**, this folder operationalises it.
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — every security finding files an issue with these labels. No exceptions.
- [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) — agent-side workflow for testing one API surface. Uses the tools defined here.
- [`.agents/skills/api-fuzzer-generator/SKILL.md`](../../.agents/skills/api-fuzzer-generator/SKILL.md) — for boundary / negative-input generation; complements Schemathesis.
- [`.agents/skills/api-patterns/security-testing.md`](../../.agents/skills/api-patterns/security-testing.md) — OWASP API Top-10 reference card; informs which DAST/Schemathesis rules to enable.
- [`documents/ci/shared-conventions.md`](../ci/shared-conventions.md) — the platform-neutral CI contract that the security gates ride on.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — concrete GitHub Actions implementation; security jobs are documented there.
- [`tests/api/test-security.spec.ts`](../../tests/api/test-security.spec.ts) — the in-repo Playwright security suite (REQ-SEC-01). Complements the external scanners; doesn't replace them.

## Out of scope

This folder is **not**:

- A general "OWASP Top 10 explained" tutorial. For category background read [OWASP Top 10](https://owasp.org/Top10/) and the [API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) directly.
- A penetration-testing methodology. We integrate scanners; we do not author offensive playbooks. For an internal pen-test see [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) and engage a specialist for anything beyond.
- A licence to skip [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md). Security findings get the same labels as functional bugs — *especially* severity. A `severity:trivial` SAST finding from a noisy ruleset stays `severity:trivial`; a CVE in an exposed dependency is `severity:critical`.
- A replacement for **threat modelling**. Tools find what they're configured to find. A threat model finds what tools cannot. Re-run [`SECURITY.md`](../../SECURITY.md) §Scope review once a quarter.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (threat model + decision matrix) | QA Lead |
| [`toolchain.md`](./toolchain.md) | ✅ v1 (one canonical tool per category, install + gate snippets) | QA Platform |
| [`owasp-zap.md`](./owasp-zap.md) | ✅ v1 (3 scan modes, auth, CI snippets, defect routing) | QA Platform |
| [`burp-suite.md`](./burp-suite.md) | ✅ v1 (CE/Pro/Enterprise + Caido, Playwright→HAR workflow, write-up template) | Security Lead |

## Phase-7+ connection

For the leadership / architect framing of "what security testing should be in an AI-augmented QA org", see:

- [`training/phase-7-ai-era-leadership/37-trust-governance-and-responsible-ai.md`](../../training/phase-7-ai-era-leadership/37-trust-governance-and-responsible-ai.md) — the LLM-safety category (Garak / promptfoo) is the centre of this phase.
- [`training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md`](../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) — the Quality Platform's "security gates" component reads from `reports/defects.json` produced by the pipeline above.
