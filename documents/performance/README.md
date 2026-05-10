# Performance Testing Guidelines (k6, JMeter, Locust)

> Source-of-truth folder for **how this repo runs load and performance tests**. One platform-neutral discipline (budgets, SLOs, dashboards, CI gates), three concrete tool implementations.
>
> Anchored on the [`performance-testing` skill](../../.agents/skills/performance-testing/SKILL.md) (which authors the tests) and the [`performance-analyzer` skill](../../.agents/skills/performance-analyzer/SKILL.md) (which triages the results). This folder is the **operational guideline** the skills lean on.

## The picture

```
┌────────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────────┐
│ define SLO │→ │ pick     │→ │ author  │→ │ run in CI as │→ │ analyse +    │
│ + budget   │  │ tool     │  │ scenario│  │ gate / cron  │  │ regress vs   │
│ (this doc) │  │ k6/JMeter│  │         │  │              │  │ baseline     │
│            │  │ /Locust  │  │         │  │              │  │              │
└────────────┘  └──────────┘  └─────────┘  └──────────────┘  └──────────────┘
   service-       decision        scripts/      .github/         dashboard
   level          matrix          tests/perf/   workflows/       Panel #N
                  (below)
```

The **shape** of every perf test in this repo is identical regardless of tool: a named scenario hits a named SUT for a named duration with a named SLO, and CI fails if a threshold breaks. Only the syntax differs.

## Index

| File | What it covers | When to read |
|---|---|---|
| [`README.md`](./README.md) (this) | The decision matrix (k6 vs JMeter vs Locust), shared SLO discipline, dashboard contract, CI shape, anti-patterns | Always read first |
| [`k6.md`](./k6.md) | Concrete k6 implementation — install, project layout, sample script, thresholds, scenarios, CI snippet, output → dashboard. **Default tool for new work in this repo.** | New API perf test; CI gating an existing one |
| [`jmeter.md`](./jmeter.md) | JMeter implementation — install, `.jmx` layout, parameterisation, headless CLI mode, JTL parsing, GUI/non-GUI discipline, CI snippet. **Use for inherited test plans or protocol breadth (JDBC, JMS, FTP).** | Maintaining legacy `.jmx` plans; non-HTTP protocols |
| [`locust.md`](./locust.md) | Locust implementation — install, `locustfile.py` layout, distributed mode, custom users, thresholds via assertions, CI snippet. **Use when scenarios are easier to express in Python or your team already lives in Python.** | Python-first teams; complex stateful user journeys |

## Reading order

1. **`README.md`** — the contract every implementation must preserve. If you skip this, your tool choice will diverge from the dashboard and the SLO.
2. **`k6.md`** — the default. If a stakeholder asks for "a perf test" with no further constraints, this is what you reach for.
3. **`jmeter.md`** OR **`locust.md`** — only when the decision matrix below points there.

## Decision matrix — which tool when?

> Pick **one tool per service**. Mixing tools per-service makes thresholds non-comparable across runs.

| Question | k6 | JMeter | Locust | Why |
|---|---|---|---|---|
| HTTP / HTTPS REST or gRPC API? | ✅ default | ✅ | ✅ | All three handle this; pick on team-fit, not capability |
| GraphQL? | ✅ via `http.post` | ✅ via HTTP sampler | ✅ via `requests` | Same — capability parity |
| WebSockets? | ✅ first-class | ✅ via plugin | ⚠️ via `websockets` lib | k6 wins on idiom |
| JDBC / SOAP / JMS / FTP / LDAP? | ❌ | ✅ first-class | ⚠️ via Python libs | JMeter wins; this is when to break the k6 default |
| Browser-level perf (LCP / INP / CLS)? | ⚠️ k6/browser (experimental) | ❌ | ❌ | Use **Lighthouse** instead; see [`performance-testing` skill](../../.agents/skills/performance-testing/SKILL.md) §Lane 2 |
| Test author writes TypeScript / JS? | ✅ k6 is JS | ⚠️ XML + Groovy | ❌ | k6 wins; matches this repo's primary language |
| Test author writes Python? | ⚠️ JS only | ⚠️ XML + Groovy | ✅ idiomatic Python | Locust wins |
| Test author wants a GUI? | ❌ code-only | ✅ test-plan editor | ❌ web UI for runs only | JMeter wins for non-coder authors (and loses for code review) |
| Distributed load (>1 generator node)? | ✅ via k6 cloud or self-hosted | ✅ master/slave | ✅ master/worker | All three; k6 cloud is easiest, the others self-host cheaper |
| CI-friendly headless mode? | ✅ native (`k6 run`) | ✅ via `-n -t` flags | ✅ native (`--headless`) | All three; k6 has the cleanest threshold→exit-code wiring |
| Output → Prometheus / Grafana / InfluxDB? | ✅ first-class outputs | ✅ via Backend Listener | ✅ via plugins | All three; k6 has the most adapters out of the box |
| Result file diff-able in Git? | ✅ JSON / CSV | ⚠️ JTL / XML (verbose) | ✅ CSV | k6 / Locust win for review-ability |

**Default rule:** *if none of the above forces a choice, pick **k6**.* It's the lightest to install, the easiest to gate in CI, and matches the repo's TypeScript-first culture.

## The shared discipline (all three tools must satisfy)

Every perf test in this repo, no matter the tool:

1. **Names a scenario** — not "load test" but `cart_checkout_p95_under_500ms_at_50_vus`. The name is the contract.
2. **Names an SLO** — exactly one threshold per scenario that, if breached, **fails the build**. No "warn-only" thresholds; ambiguity destroys the gate.
3. **Names a baseline** — a previous run on `main` whose numbers are the comparison point. No baseline = no regression detection. Stored under `reports/perf/baselines/`.
4. **Names a duration & ramp** — `30s ramp → 5min steady → 30s ramp-down` is the minimum shape; spike tests get their own scenario file.
5. **Reads its config from env vars** — `BASE_URL`, `VUS`, `DURATION`, `RAMP` — never hardcoded. Same script runs against `qa` / `staging` / `prod-shadow`.
6. **Tagged with the service it tests** — `service:cart`, `service:checkout`, `service:product` — feeds the dashboard's by-service breakdown.
7. **Emits to the QA Metrics Dashboard** — Panel #6 (planned; placeholder until live) ingests P50 / P95 / P99 / error-rate / throughput per scenario per run.
8. **Has an owner** — `# OWNER: <github-handle>` in the script header. No owner = no test.

> **Operating principle:** a perf test that doesn't fail the build when SLO breaks is a *demo*, not a test. Every guideline below enforces this.

## SLO discipline (the bar)

Adopt one of the four canonical shapes per scenario. Mixing shapes per scenario breaks the dashboard.

| Shape | Threshold | Example |
|---|---|---|
| **Latency** | P95 < N ms | `cart_add_item: http_req_duration p(95) < 500` |
| **Throughput** | RPS ≥ N | `search_query: http_reqs/s ≥ 100` |
| **Error rate** | failures < N % | `checkout_submit: http_req_failed rate < 0.5%` |
| **Saturation** | CPU/memory < N % at given load | infra-side; not measured by these tools — pair with Datadog / Prometheus |

Each scenario file declares **at least one of Latency or Error rate** plus exactly one **owner**. Throughput and Saturation are RECOMMENDED for production-traffic-shaped tests.

The numbers themselves come from your team's **quality bar** in the [`quality-org-charter`](../../training/sandbox/example/manager/quality-org-charter.md) §6 and the [`quality-metrics-pack`](../../training/sandbox/example/manager/quality-metrics-pack.md) Project-scope rows P5/P8. Don't invent new bars per perf test; cite the bar.

## Where the scripts live

```
tests/perf/
├── k6/
│   ├── README.md
│   ├── lib/                 ← shared helpers (auth, env, custom metrics)
│   ├── scenarios/
│   │   ├── cart-add-item.js
│   │   ├── checkout-submit.js
│   │   └── search-query.js
│   └── baselines/           ← committed JSON snapshots per scenario per env
├── jmeter/
│   ├── README.md
│   ├── plans/
│   │   ├── cart-add-item.jmx
│   │   └── checkout-submit.jmx
│   ├── data/                ← CSV data sets used by the plans
│   └── results/             ← .gitignore'd; populated by CI
└── locust/
    ├── README.md
    ├── locustfile.py        ← entry point
    ├── users/               ← per-user-class modules
    │   ├── cart_user.py
    │   └── checkout_user.py
    └── baselines/
```

`tests/perf/` is added by the per-tool docs as needed; nothing else in the repo writes there.

## CI shape (every tool)

Every tool's CI job is one of three shapes:

| Shape | When | Cadence | What happens on failure |
|---|---|---|---|
| **Gate on PR** | Test touches a hot endpoint (cart / checkout / search) | per PR | Block merge |
| **Cron baseline refresh** | After a green deploy to staging | nightly | Update `baselines/<scenario>.json`; fail-and-page if regression > 20 % vs prior baseline |
| **Soak / spike (manual)** | Pre-release or post-incident | on demand | Open a defect via [`defect-report`](../../.agents/skills/defect-report/SKILL.md) if SLO breaches |

The matching GitHub Actions snippets live in each per-tool file.

## How perf results reach the dashboard

```
tool run → JSON / JTL / CSV in tests/perf/<tool>/results/
        → scripts/perf-summary.ts (post-test step)
        → reports/perf-summary.json
        → ingested by reports/custom-reporter.ts
        → Panel #6 of templates/qa-metrics-dashboard.html (planned; placeholder until live)
```

The intermediate `reports/perf-summary.json` is the **dashboard contract**. Every tool must produce a compatible row:

```json
{
  "scenario": "cart-add-item",
  "tool": "k6",
  "service": "cart",
  "env": "qa",
  "p50_ms": 142,
  "p95_ms": 387,
  "p99_ms": 612,
  "error_rate": 0.0021,
  "throughput_rps": 92.3,
  "duration_sec": 330,
  "vus_peak": 50,
  "slo_passed": true,
  "ts_iso": "2026-05-10T14:32:00Z",
  "owner": "@khanhdo",
  "baseline_ref": "reports/perf/baselines/qa/cart-add-item.json"
}
```

Per-tool docs explain how to emit this from the tool's native output. **Don't ship a perf test that doesn't produce this row** — the dashboard panel is blind to it, and the team won't know it ran.

## Conventions used here (cross-references)

- **The skill that authors tests** — [`.agents/skills/performance-testing/SKILL.md`](../../.agents/skills/performance-testing/SKILL.md). Picks the right lane (k6 / Lighthouse / Playwright traces) for the question.
- **The skill that triages results** — [`.agents/skills/performance-analyzer/SKILL.md`](../../.agents/skills/performance-analyzer/SKILL.md). Reads the JSON output and surfaces regressions.
- **Which tests to gate vs background** — [`.agents/skills/ci-optimizer/SKILL.md`](../../.agents/skills/ci-optimizer/SKILL.md). Perf tests are expensive; gate selectively.
- **Defect filing on regression** — [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md). Use `module:perf` + the appropriate `severity:*`.
- **The bar** — [`training/sandbox/example/manager/quality-org-charter.md`](../../training/sandbox/example/manager/quality-org-charter.md) §6 + [`quality-metrics-pack.md`](../../training/sandbox/example/manager/quality-metrics-pack.md) rows P5 / P8.
- **CI implementation** — [`documents/ci/github-actions.md`](../ci/github-actions.md) for the canonical workflow shape; perf jobs follow the same env-matrix and artifact contract.
- **Dashboard panel** — [`wiki/QA-Metrics-Dashboard.md`](../../wiki/QA-Metrics-Dashboard.md) §"Panel #6 — Performance" (planned).

## Anti-patterns (do NOT do these)

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Multiple tools for the same service | Thresholds become non-comparable across runs | One tool per service; document the choice in the scenario header |
| "Warn-only" thresholds | A gate that doesn't gate is a comment | Every threshold either fails the build or it isn't a threshold |
| Hardcoded `BASE_URL` | Test only runs against one env; useless for staging gates | Read from env var; default to `qa` |
| Running JMeter in GUI mode in CI | GUI mode is not headless; results are unreliable | Always `jmeter -n -t plan.jmx` in CI; GUI is dev-only |
| Locust with a single worker against a real cluster | Single-worker throughput is bound by Python GIL; you'll measure the test, not the system | Distributed mode with ≥ N workers, where N = max-RPS-needed / 1500 |
| Committing `.jtl` / `*.csv` results to Git | Repo bloats; meaningful diff is impossible | `.gitignore` the `results/` folders; commit baselines under `baselines/` |
| Perf test without an owner | No one fixes the regression | `# OWNER: @handle` header is mandatory |
| "Let's load-test prod" without a contract | Customer-visible incident | Use `prod-shadow` or `staging`; if you must touch prod, file a [`chaos-engineering`](../../.agents/skills/chaos-engineering/SKILL.md) experiment |

## Out of scope

This folder is **not**:

- A general performance-engineering tutorial (queueing theory, USE / RED methods) — read [Brendan Gregg](https://www.brendangregg.com/usemethod.html) and Tom Wilkie's RED for that.
- A vendor reference (k6 cloud pricing, BlazeMeter for JMeter, Locust cloud) — see each vendor's docs.
- A licence to add a fourth tool — every additional tool fragments the dashboard contract; bring an RFC if you need one.
- A replacement for **observability**. Perf tests prove a hypothesis; observability tells you what users actually experience. Both are required.

## Status

| Doc | Status | Owner |
|---|---|---|
| [`README.md`](./README.md) | ✅ v1 (decision matrix, SLO discipline, dashboard contract, anti-patterns) | QA Platform |
| [`k6.md`](./k6.md) | ✅ v1 (default tool; full CI integration) | QA Platform |
| [`jmeter.md`](./jmeter.md) | ✅ v1 (legacy / protocol-breadth lane) | QA Platform |
| [`locust.md`](./locust.md) | ✅ v1 (Python-first lane) | QA Platform |

## Phase-7+ connection

For the leadership / architect framing of "what perf testing *should* be in an AI-augmented QA org", see:

- [`training/phase-7-ai-era-leadership/README.md`](../../training/phase-7-ai-era-leadership/README.md) — perf as a leading indicator of release readiness.
- [`training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md`](../../training/phase-8-quality-architecture/41-designing-and-building-an-ai-quality-platform.md) — perf budgets as a platform-enforced gate, not a per-team courtesy.
