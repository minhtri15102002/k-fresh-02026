# Locust — Performance Testing Guideline

> The **Python lane**. Use when your team writes Python natively, when scenarios involve complex stateful user journeys (multi-step shop-then-checkout-then-review flows where Python's expressiveness pays off), or when your perf and integration test suites already share Python utilities.
>
> Read [`README.md`](./README.md) first for the shared discipline (SLOs, dashboard contract, decision matrix). This doc is the **Locust-specific implementation** of that contract.

## TL;DR

- Author user classes in Python under `tests/perf/locust/users/`; entry point is `tests/perf/locust/locustfile.py`.
- One `User` subclass per persona; one `@task` per business action; SLOs enforced via `events.quitting` hook.
- `locust --headless --csv` writes CSVs; `scripts/locust-summary.ts` collapses them into the dashboard row.
- CI gates on threshold breach evaluated **at quit time** (Locust exits non-zero when an `events.quitting` listener raises).

## When to actually pick Locust

The decision matrix in [`README.md`](./README.md) gives the rule. Practical triggers:

- The QA team writes Python (most data-engineering / ML-platform-adjacent QA orgs).
- A scenario reuses production Python clients (e.g. internal SDK with auth flow, retries, signing — easier than re-implementing in JS).
- The user journey is genuinely **stateful** and the state graph is non-trivial (Locust's `User` model with sequential `@task` weights is the cleanest expression).
- You want a **live web UI** during a soak test to watch RPS / latency move (Locust's UI is its other super-power).

If none apply, **default to [`k6.md`](./k6.md)**.

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS / Linux local | `pipx install locust==2.31.0` (or `pip install --user`) | `2.31.0` |
| Docker | `docker run --rm -v "$PWD":/mnt/locust locustio/locust:2.31.0 -f /mnt/locust/tests/perf/locust/locustfile.py --headless -u 50 -r 5 -t 5m` | `2.31.0` |
| CI (GitHub Actions) | `actions/setup-python@v5` + `pip install -r tests/perf/locust/requirements.txt` | `2.31.0` |

Pin both Locust and Python (`>= 3.11`) in CI — Locust's gevent backend is sensitive to Python minor versions.

## Project layout in this repo

```
tests/perf/locust/
├── README.md                         ← link back to documents/performance/locust.md
├── requirements.txt                  ← locust==2.31.0 + minimal deps
├── locustfile.py                     ← entry point — imports user classes + wires SLO hooks
├── users/
│   ├── __init__.py
│   ├── cart_user.py                  ← one User class per persona
│   ├── checkout_user.py
│   └── search_user.py
├── lib/
│   ├── env.py                        ← reads BASE_URL / VUS / DURATION / TOKEN
│   ├── auth.py                       ← shared auth helper (login + token cache)
│   └── slo.py                        ← SLO definitions + quit-time evaluator
├── data/                             ← CSVs / fixtures consumed by users
│   └── product-skus.csv
├── results/                          ← .gitignore'd; populated by CI
└── baselines/                        ← per-env baseline JSON
    ├── qa/
    └── staging/
```

## Hello world — `users/cart_user.py`

```python
"""
OWNER: @khanhdo
SCENARIO: cart-add-item
SLO: P95 < 500ms, error_rate < 0.5%, sustained 50 users for 5 min
"""
from locust import HttpUser, task, between, events
from lib.env import ENV
from lib.auth import login

class CartUser(HttpUser):
    """A logged-in user who repeatedly adds items to their cart."""
    wait_time = between(0.5, 1.5)   # think time — keep above 0
    host = ENV.BASE_URL

    def on_start(self) -> None:
        """Run once per virtual user before any @task fires."""
        self.token = login(self.client, ENV.USERNAME, ENV.PASSWORD)
        self.client.headers.update({"Authorization": f"Bearer {self.token}"})

    @task(weight=10)
    def add_item(self) -> None:
        with self.client.post(
            "/api/cart/items",
            json={"productId": "SKU-42", "qty": 1},
            name="cart_add",                           # group in stats — equivalent to k6's tag
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"unexpected status {resp.status_code}")
            elif "cart_id" not in (resp.json() or {}):
                resp.failure("missing cart_id in response")
            else:
                resp.success()

    @task(weight=1)
    def view_cart(self) -> None:
        # weight=1 means ~10x less frequent than add_item
        self.client.get("/api/cart", name="cart_view")
```

Three things this template enforces:

1. **Module docstring carries the contract** — owner, scenario name, SLO. CI lint job (planned) refuses files without all three lines.
2. **`name="cart_add"`** groups stats by business action — equivalent to k6's `tags: { name: 'cart_add' }`. Without `name`, every URL with a different cart_id becomes a separate stat row.
3. **`catch_response=True` + explicit `success()` / `failure()`** — distinguishes "200 OK with wrong body" from "200 OK". A test that doesn't assert response shape is half-blind.

## `lib/env.py` — env var contract

```python
import os
from dataclasses import dataclass

@dataclass(frozen=True)
class _Env:
    BASE_URL: str
    VUS: int
    SPAWN_RATE: int
    DURATION: str
    ENV_NAME: str
    USERNAME: str
    PASSWORD: str

ENV = _Env(
    BASE_URL=os.environ.get("BASE_URL", "https://qa.ecommerce-playground.lambdatest.io"),
    VUS=int(os.environ.get("VUS", "50")),
    SPAWN_RATE=int(os.environ.get("SPAWN_RATE", "5")),     # users/sec — controls ramp
    DURATION=os.environ.get("DURATION", "5m"),
    ENV_NAME=os.environ.get("ENV_NAME", "qa"),
    USERNAME=os.environ.get("PERF_USER", "perf-bot@example.com"),
    PASSWORD=os.environ.get("PERF_PASS", "changeme"),
)
```

**Never hardcode `BASE_URL`.** Same script runs against `qa`, `staging`, `prod-shadow` via env vars only.

## `lib/slo.py` — SLO definitions + quit-time evaluator

Locust doesn't have native thresholds the way k6 does, but `events.quitting` runs after the test ends — that's where the gate lives.

```python
from typing import TypedDict
from locust import events
from locust.env import Environment

class Slo(TypedDict):
    p95_ms: float
    error_rate: float

SLOS: dict[str, Slo] = {
    "cart_add":      {"p95_ms": 500.0,  "error_rate": 0.005},
    "checkout_pay":  {"p95_ms": 1200.0, "error_rate": 0.005},
    "search_query":  {"p95_ms": 800.0,  "error_rate": 0.01},
}

@events.quitting.add_listener
def _evaluate_slo(environment: Environment, **kwargs) -> None:
    """Run after the test ends. Set environment.process_exit_code to a non-zero value
    to make Locust exit non-zero (CI sees as failure)."""
    failed: list[str] = []
    for name, slo in SLOS.items():
        stats = environment.stats.get(name, "POST") or environment.stats.get(name, "GET")
        if stats is None or stats.num_requests == 0:
            continue   # scenario didn't run; skip (don't fail on absent)

        p95 = stats.get_response_time_percentile(0.95)
        err = stats.fail_ratio
        if p95 > slo["p95_ms"]:
            failed.append(f"{name}: P95 {p95:.0f}ms > SLO {slo['p95_ms']:.0f}ms")
        if err > slo["error_rate"]:
            failed.append(f"{name}: error_rate {err:.4f} > SLO {slo['error_rate']:.4f}")

    if failed:
        for line in failed:
            print(f"SLO FAIL — {line}")
        environment.process_exit_code = 99   # match k6's threshold-fail code
```

**Hard rule:** every SLO sits in `lib/slo.py`, not in the user-class file. Keeps the gate auditable in one place.

## `locustfile.py` — entry point

```python
"""Entry point. Imports user classes + wires the SLO evaluator (via lib/slo.py side-effects)."""
from users.cart_user import CartUser            # noqa: F401
from users.checkout_user import CheckoutUser    # noqa: F401
from users.search_user import SearchUser        # noqa: F401
import lib.slo                                  # noqa: F401  -- registers events.quitting hook
```

The `# noqa` comments are intentional: importing for side-effects (registering the User class with Locust, registering the quit-time hook) is the whole point.

## Local run

```bash
# Headless — the canonical CI/local invocation
locust \
  -f tests/perf/locust/locustfile.py \
  --headless \
  -u 50 \                # peak users (VUS in k6 / threads in JMeter)
  -r 5 \                 # spawn-rate users/sec — ramp shape
  -t 5m \                # total duration
  --csv tests/perf/locust/results/cart-add-item \
  --csv-full-history \
  --exit-code-on-error 99

# Web UI — for AUTHORING and SOAK observation only
locust -f tests/perf/locust/locustfile.py
# then open http://localhost:8089
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | Test ran; SLO evaluator did not set `process_exit_code` |
| `99` | SLO breach (set by the `events.quitting` hook in `lib/slo.py`) |
| `non-zero (other)` | Script error or unhandled exception |

## CSV output → dashboard row

`scripts/perf/locust-summary.ts` (called by CI):

```typescript
import { readFileSync, writeFileSync } from 'node:fs';

interface Row { Name: string; 'Request Count': number; '50%': number; '95%': number; '99%': number; 'Failure Count': number; 'Requests/s': number; }

const scenario = process.argv[2];
const csv = readFileSync(`tests/perf/locust/results/${scenario}_stats.csv`, 'utf8');
const rows = parseCsv<Row>(csv).filter((r) => r.Name === 'cart_add');   // adjust per scenario
const r = rows[0];
if (!r) { console.error(`no rows for ${scenario}`); process.exit(2); }

writeFileSync(`reports/perf-summary-${scenario}.json`, JSON.stringify({
  scenario,
  tool: 'locust',
  service: 'cart',
  env: process.env.ENV_NAME,
  p50_ms: r['50%'],
  p95_ms: r['95%'],
  p99_ms: r['99%'],
  error_rate: r['Failure Count'] / r['Request Count'],
  throughput_rps: r['Requests/s'],
  duration_sec: parseInt(process.env.DURATION_SEC ?? '300', 10),
  vus_peak: parseInt(process.env.VUS ?? '50', 10),
  slo_passed: r['95%'] < 500 && (r['Failure Count'] / r['Request Count']) < 0.005,
  ts_iso: new Date().toISOString(),
  owner: '@khanhdo',
  baseline_ref: `tests/perf/locust/baselines/${process.env.ENV_NAME}/${scenario}.json`,
}, null, 2));
```

This emits the **same `reports/perf-summary.json` shape** as k6 and JMeter — the dashboard treats all three identically.

## CI — GitHub Actions

```yaml
perf-locust:
  if: github.event_name == 'pull_request' && contains(github.event.pull_request.changed_files, 'tests/perf/locust/')
  runs-on: ubuntu-latest
  needs: install
  strategy:
    fail-fast: false
    matrix:
      scenario: [cart-add-item, checkout-submit]
      env: [qa]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with: { python-version: '3.11' }
    - name: Install Locust
      run: pip install -r tests/perf/locust/requirements.txt
    - name: Run Locust — ${{ matrix.scenario }} on ${{ matrix.env }}
      env:
        BASE_URL: ${{ secrets[format('BASE_URL_{0}', matrix.env)] }}
        ENV_NAME: ${{ matrix.env }}
        VUS: '50'
        SPAWN_RATE: '5'
        DURATION: '5m'
        DURATION_SEC: '300'
        PERF_USER: ${{ secrets.PERF_USER }}
        PERF_PASS: ${{ secrets.PERF_PASS }}
      working-directory: tests/perf/locust
      run: |
        mkdir -p results
        locust -f locustfile.py \
          --headless -u $VUS -r $SPAWN_RATE -t $DURATION \
          --csv results/${{ matrix.scenario }} \
          --exit-code-on-error 99
    - name: Emit dashboard row
      run: npx tsx scripts/perf/locust-summary.ts ${{ matrix.scenario }}
    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: perf-locust-${{ matrix.scenario }}-${{ matrix.env }}
        path: |
          tests/perf/locust/results/${{ matrix.scenario }}*.csv
          reports/perf-summary-${{ matrix.scenario }}.json
        retention-days: 30
```

## Distributed mode (master / worker)

A single Locust process is bound by the Python GIL — peak ~1500 RPS per worker on a typical 4-core box. For higher load:

```bash
# On the master node
locust -f locustfile.py --master --headless -u 1000 -r 20 -t 10m \
  --expect-workers 4 --csv results/checkout-submit

# On each of 4 worker nodes (same .py files; same env vars)
locust -f locustfile.py --worker --master-host=<master-ip>
```

CI shape: spin up master + N workers as separate jobs in the same matrix, or run inside a single job with `docker compose` (`locustio/locust` image supports both modes via env vars).

## Updating baselines

Same flow as k6 / JMeter:

```bash
ENV_NAME=staging BASE_URL=https://staging.example.com locust -f tests/perf/locust/locustfile.py \
  --headless -u 50 -r 5 -t 5m --csv tests/perf/locust/results/cart-add-item
npx tsx scripts/perf/locust-summary.ts cart-add-item
mv reports/perf-summary-cart-add-item.json tests/perf/locust/baselines/staging/cart-add-item.json
# PR titled "perf(baseline): refresh cart-add-item @ staging — <reason>"
```

## Anti-patterns specific to Locust

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| `wait_time = constant(0)` or `between(0, 0)` | Generates unrealistic synchronous load; saturates the worker before the SUT | Minimum `between(0.5, 1.5)`; tune to traffic shape |
| Single Locust process targeting a real cluster | GIL caps you ~1500 RPS; you measure the test, not the system | Distributed mode with `--master` + N workers |
| `self.client.post(url)` without `name=` | URL-with-cart-id-in-path becomes a unique stat row; percentiles meaningless | Always `name="cart_add"` to group by business action |
| `catch_response` without explicit `success()` / `failure()` | Test never reports actual failures | `with ... as resp:` block must call one of the two on every path |
| Putting SLO checks inside `@task` functions | Threshold logic scattered across files; un-auditable | Centralise in `lib/slo.py` via `events.quitting` listener |
| Running with the web UI for a real load test | UI overhead + browser polling skew small-load measurements | `--headless` for any measurement run; UI is dev-only |
| Logging in inside `@task` instead of `on_start` | Login dominates the per-iteration timing; SLO meaningless | `on_start` (per virtual user once) or `on_start` of a `SequentialTaskSet` |
| Sharing a single `requests.Session` across users | All users look like one client to the SUT (same cookies, connection pool) | Use `self.client` (Locust's per-user `HttpSession`) — never raw `requests` |
| Reading test data via `open()` inside `@task` | File handles per request; OS errors at scale | Read CSV once into a class-level list; pick via `random.choice` |

## Cross-references

- [`README.md`](./README.md) — shared discipline (SLO, dashboard contract, decision matrix).
- [`k6.md`](./k6.md) — the default lane; pick this if your team writes JS/TS.
- [`jmeter.md`](./jmeter.md) — the legacy / protocol-breadth lane.
- [`.agents/skills/performance-testing/SKILL.md`](../../.agents/skills/performance-testing/SKILL.md) — author skill (note: skill primarily targets k6; Locust use is by exception per the decision matrix).
- [`.agents/skills/performance-analyzer/SKILL.md`](../../.agents/skills/performance-analyzer/SKILL.md) — reads `reports/perf-summary.json` and triages regressions.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — the canonical workflow shape this perf job slots into.
- Official: [Locust docs](https://docs.locust.io/en/stable/) · [writing a locustfile](https://docs.locust.io/en/stable/writing-a-locustfile.html) · [running distributed](https://docs.locust.io/en/stable/running-distributed.html).
