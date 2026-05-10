# JMeter — Performance Testing Guideline

> The **legacy / protocol-breadth** lane. Use when k6 isn't enough (JDBC, SOAP, JMS, FTP, LDAP, MQ) or when you've inherited a `.jmx` plan and rewriting it isn't justified.
>
> Read [`README.md`](./README.md) first for the shared discipline (SLOs, dashboard contract, decision matrix). This doc is the **JMeter-specific implementation** of that contract.

## TL;DR

- Author plans as `.jmx` files (XML) under `tests/perf/jmeter/plans/`.
- **Edit in the GUI; run in CI headless** — that's the only sane workflow.
- One `.jmx` per scenario; one SLO per scenario; one owner per scenario in the test plan comment.
- `jmeter -n -t plan.jmx -l result.jtl` writes JTL; `scripts/jmeter-summary.ts` collapses it into the dashboard row.
- CI gates on threshold breach evaluated **after** the run from the JTL (JMeter doesn't have native exit-code thresholds — see "Thresholds" below).

## When to actually pick JMeter

The decision matrix in [`README.md`](./README.md) gives the rule. Practical triggers:

- You inherited 200+ `.jmx` plans and rewriting in k6 would cost more than maintaining JMeter.
- You need **JDBC** sampling (verify a write at the database layer under load).
- You need **JMS / MQ / FTP / LDAP / SOAP** native samplers.
- Non-coder QA leads need to author plans (the GUI is JMeter's super-power).

If none of those apply, **use [`k6.md`](./k6.md) instead**.

## Install

| Surface | Command | Pinned version |
|---|---|---|
| macOS local | `brew install jmeter` | `>= 5.6.3` |
| Linux local | Download binary from [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi); requires Java 17+ | `5.6.3` |
| Docker | `docker run --rm -v "$PWD":/jmeter -w /jmeter justb4/jmeter:5.6.3 -n -t plan.jmx -l result.jtl` | `5.6.3` (pin per release) |
| CI (GitHub Actions) | install via `actions/setup-java@v4` + `wget` of the official tarball, or use the Docker image | `5.6.3` |

Pin both **JMeter** and **Java** versions in CI — JMeter behaviour shifts with Java version.

## Project layout in this repo

```
tests/perf/jmeter/
├── README.md                         ← link back to documents/performance/jmeter.md
├── plans/
│   ├── cart-add-item.jmx             ← one plan per scenario
│   ├── checkout-submit.jmx
│   └── jdbc-order-write.jmx
├── data/                             ← CSV data files used via CSV Data Set Config
│   ├── users.csv
│   └── product-skus.csv
├── lib/                              ← shared `.jmx` fragments via "Test Fragment" + Module Controller
│   ├── auth-fragment.jmx
│   └── headers-fragment.jmx
├── results/                          ← .gitignore'd; populated by CI
└── baselines/                        ← per-env baseline JSON (after summary post-processing)
    ├── qa/
    └── staging/
```

> **Why CSV under `data/` not inline?** Inline thread-group data couples the load shape to the data; external CSV lets you swap data without touching the plan XML.

## The mandatory header in every plan

Every `.jmx` opens with a **Test Plan** node whose `<stringProp name="TestPlan.comments">` carries:

```text
OWNER: @khanhdo
SCENARIO: cart-add-item
SLO: P95 < 500ms, error_rate < 0.5%, sustained 50 users for 5 min
ENV: read from __P(BASE_URL) / __P(USERS) / __P(DURATION)
```

The CI lint job (planned) refuses `.jmx` files whose comments don't carry all four lines.

## Hello world — `cart-add-item.jmx` (skeleton)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan testname="cart-add-item">
      <stringProp name="TestPlan.comments">
OWNER: @khanhdo
SCENARIO: cart-add-item
SLO: P95 &lt; 500ms, error_rate &lt; 0.5%, 50 users for 5 min
ENV: __P(BASE_URL) / __P(USERS) / __P(DURATION_SEC)
      </stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <stringProp name="TestPlan.user_defined_variables"></stringProp>
    </TestPlan>
    <hashTree>
      <!-- Read all runtime values from JVM properties (-J flags) -->
      <Arguments testname="User Defined Variables">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">${__P(BASE_URL,https://qa.ecommerce-playground.lambdatest.io)}</stringProp>
          </elementProp>
          <elementProp name="USERS" elementType="Argument">
            <stringProp name="Argument.name">USERS</stringProp>
            <stringProp name="Argument.value">${__P(USERS,50)}</stringProp>
          </elementProp>
          <elementProp name="RAMP" elementType="Argument">
            <stringProp name="Argument.name">RAMP</stringProp>
            <stringProp name="Argument.value">${__P(RAMP,30)}</stringProp>
          </elementProp>
          <elementProp name="DURATION_SEC" elementType="Argument">
            <stringProp name="Argument.name">DURATION_SEC</stringProp>
            <stringProp name="Argument.value">${__P(DURATION_SEC,300)}</stringProp>
          </elementProp>
        </collectionProp>
      </Arguments>
      <hashTree/>

      <ThreadGroup testname="cart-users">
        <stringProp name="ThreadGroup.num_threads">${USERS}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${RAMP}</stringProp>
        <stringProp name="ThreadGroup.duration">${DURATION_SEC}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">true</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>

        <!-- CSV data: pull a perf-bot user per iteration -->
        <CSVDataSet testname="users-csv">
          <stringProp name="filename">data/users.csv</stringProp>
          <stringProp name="variableNames">USER_EMAIL,USER_PASSWORD</stringProp>
          <stringProp name="delimiter">,</stringProp>
          <boolProp name="recycle">true</boolProp>
          <boolProp name="stopThread">false</boolProp>
        </CSVDataSet>
        <hashTree/>

        <!-- Login (transaction-controlled so it doesn't pollute cart_add timings) -->
        <TransactionController testname="login">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
        </TransactionController>
        <hashTree>
          <HTTPSamplerProxy testname="POST /api/auth/login">
            <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
            <stringProp name="HTTPSampler.path">/api/auth/login</stringProp>
            <stringProp name="HTTPSampler.method">POST</stringProp>
          </HTTPSamplerProxy>
          <hashTree>
            <JSONPostProcessor testname="extract token">
              <stringProp name="JSONPostProcessor.referenceNames">TOKEN</stringProp>
              <stringProp name="JSONPostProcessor.jsonPathExprs">$.token</stringProp>
            </JSONPostProcessor>
            <hashTree/>
          </hashTree>
        </hashTree>

        <!-- The actual measured transaction -->
        <TransactionController testname="cart_add">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
        </TransactionController>
        <hashTree>
          <HTTPSamplerProxy testname="POST /api/cart/items">
            <stringProp name="HTTPSampler.domain">${BASE_URL}</stringProp>
            <stringProp name="HTTPSampler.path">/api/cart/items</stringProp>
            <stringProp name="HTTPSampler.method">POST</stringProp>
            <stringProp name="HTTPSampler.postBodyRaw">true</stringProp>
            <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
              <collectionProp name="Arguments.arguments">
                <elementProp name="" elementType="HTTPArgument">
                  <stringProp name="Argument.value">{"productId":"SKU-42","qty":1}</stringProp>
                </elementProp>
              </collectionProp>
            </elementProp>
          </HTTPSamplerProxy>
          <hashTree>
            <HeaderManager testname="auth-header">
              <collectionProp name="HeaderManager.headers">
                <elementProp name="Authorization" elementType="Header">
                  <stringProp name="Header.name">Authorization</stringProp>
                  <stringProp name="Header.value">Bearer ${TOKEN}</stringProp>
                </elementProp>
                <elementProp name="Content-Type" elementType="Header">
                  <stringProp name="Header.name">Content-Type</stringProp>
                  <stringProp name="Header.value">application/json</stringProp>
                </elementProp>
              </collectionProp>
            </HeaderManager>
            <hashTree/>
            <ResponseAssertion testname="status 200">
              <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
              <intProp name="Assertion.test_type">8</intProp>
              <collectionProp name="Asserion.test_strings">
                <stringProp>200</stringProp>
              </collectionProp>
            </ResponseAssertion>
            <hashTree/>
          </hashTree>
        </hashTree>

        <!-- Realistic think time -->
        <ConstantTimer testname="1s think time">
          <stringProp name="ConstantTimer.delay">1000</stringProp>
        </ConstantTimer>
        <hashTree/>

        <!-- Result collector — JTL only; no GUI listeners in CI -->
        <ResultCollector testname="JTL writer" enabled="true">
          <stringProp name="filename">results/cart-add-item.jtl</stringProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <bytes>true</bytes>
              <threadCounts>true</threadCounts>
            </value>
          </objProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

> **Reading XML this dense is the cost of admission.** Author with the GUI; review the diffs as XML in PRs. If the diff is unreadable, you've changed too much in one PR.

## Local run

```bash
# GUI for AUTHORING (never for CI)
jmeter -t tests/perf/jmeter/plans/cart-add-item.jmx

# Headless run — the canonical CI/local invocation
jmeter -n \
  -t tests/perf/jmeter/plans/cart-add-item.jmx \
  -l tests/perf/jmeter/results/cart-add-item.jtl \
  -j tests/perf/jmeter/results/cart-add-item.log \
  -JBASE_URL=https://qa.ecommerce-playground.lambdatest.io \
  -JUSERS=50 \
  -JRAMP=30 \
  -JDURATION_SEC=300

# Generate the static HTML dashboard from JTL
jmeter -g tests/perf/jmeter/results/cart-add-item.jtl \
       -o tests/perf/jmeter/results/cart-add-item-html/
```

`-J<key>=<value>` sets a JVM property that `${__P(<key>)}` reads. **Always pass env config via `-J`, never edit the `.jmx`.**

## Thresholds — JMeter doesn't have them natively (work-around)

JMeter's exit code is `0` if the test ran (regardless of how slow). To match the [`README.md`](./README.md) discipline (threshold breach → build fail), evaluate the JTL **after** the run.

`scripts/jmeter-summary.ts` (called by CI):

```typescript
// Pseudo-code; full version in scripts/perf/jmeter-summary.ts
import { readFileSync, writeFileSync } from 'node:fs';

interface Slo { p95_ms: number; error_rate: number; }
const SLOS: Record<string, Slo> = {
  'cart-add-item':   { p95_ms: 500,  error_rate: 0.005 },
  'checkout-submit': { p95_ms: 1200, error_rate: 0.005 },
};

const scenario = process.argv[2];   // e.g. 'cart-add-item'
const jtl = readFileSync(`tests/perf/jmeter/results/${scenario}.jtl`, 'utf8');
// Parse JTL CSV header → rows: timeStamp,elapsed,label,responseCode,success,...
const rows = parseJtl(jtl).filter((r) => r.label === 'cart_add');
const elapsed = rows.map((r) => r.elapsed).sort((a, b) => a - b);
const p = (q: number) => elapsed[Math.floor(elapsed.length * q)];

const row = {
  scenario, tool: 'jmeter', service: 'cart', env: process.env.ENV_NAME,
  p50_ms: p(0.50), p95_ms: p(0.95), p99_ms: p(0.99),
  error_rate: rows.filter((r) => !r.success).length / rows.length,
  throughput_rps: rows.length / ((rows.at(-1)!.timeStamp - rows[0]!.timeStamp) / 1000),
  duration_sec: (rows.at(-1)!.timeStamp - rows[0]!.timeStamp) / 1000,
  vus_peak: Math.max(...rows.map((r) => r.allThreads)),
  slo_passed: p(0.95) < SLOS[scenario]!.p95_ms && rows.filter((r) => !r.success).length / rows.length < SLOS[scenario]!.error_rate,
  ts_iso: new Date().toISOString(),
  owner: '@khanhdo',
  baseline_ref: `tests/perf/jmeter/baselines/${process.env.ENV_NAME}/${scenario}.json`,
};
writeFileSync(`reports/perf-summary-${scenario}.json`, JSON.stringify(row, null, 2));
process.exit(row.slo_passed ? 0 : 99);   // 99 matches k6's threshold-fail code
```

This collapses JMeter's output into the **same `reports/perf-summary.json` shape** as k6 and Locust, so the dashboard treats all three identically.

## CI — GitHub Actions

```yaml
perf-jmeter:
  if: github.event_name == 'pull_request' && contains(github.event.pull_request.changed_files, 'tests/perf/jmeter/')
  runs-on: ubuntu-latest
  needs: install
  strategy:
    fail-fast: false
    matrix:
      scenario: [cart-add-item, checkout-submit]
      env: [qa]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with: { distribution: 'temurin', java-version: '17' }
    - name: Install JMeter
      run: |
        wget -q https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.6.3.tgz
        tar -xzf apache-jmeter-5.6.3.tgz
        echo "$PWD/apache-jmeter-5.6.3/bin" >> $GITHUB_PATH
    - name: Run JMeter — ${{ matrix.scenario }} on ${{ matrix.env }}
      env:
        BASE_URL: ${{ secrets[format('BASE_URL_{0}', matrix.env)] }}
        ENV_NAME: ${{ matrix.env }}
      run: |
        mkdir -p tests/perf/jmeter/results reports
        jmeter -n \
          -t tests/perf/jmeter/plans/${{ matrix.scenario }}.jmx \
          -l tests/perf/jmeter/results/${{ matrix.scenario }}.jtl \
          -JBASE_URL=$BASE_URL -JUSERS=50 -JRAMP=30 -JDURATION_SEC=300
    - name: Evaluate SLO + emit dashboard row
      run: npx tsx scripts/perf/jmeter-summary.ts ${{ matrix.scenario }}
    - name: Upload artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: perf-jmeter-${{ matrix.scenario }}-${{ matrix.env }}
        path: |
          tests/perf/jmeter/results/${{ matrix.scenario }}.jtl
          reports/perf-summary-${{ matrix.scenario }}.json
        retention-days: 30
```

## GUI / non-GUI discipline (the most-violated rule)

| Mode | When | Why |
|---|---|---|
| **GUI mode (`jmeter` with no `-n`)** | Authoring + debugging only | The GUI's listeners (View Results Tree, Aggregate Report) are heavy; running a load test in GUI mode measures the GUI, not the SUT |
| **Non-GUI mode (`jmeter -n`)** | All real runs — local benchmark, CI, production-shadow | The only mode whose numbers are trustworthy |
| **Distributed (`-r` flag)** | When one node can't generate enough load | Master coordinates; multiple slaves generate; results aggregate to master |

**Hard rule:** if the JMeter UI is open during a load run, throw the result away.

## Updating baselines

Same flow as k6:

```bash
ENV_NAME=staging jmeter -n -t tests/perf/jmeter/plans/cart-add-item.jmx \
  -l tests/perf/jmeter/results/cart-add-item.jtl \
  -JBASE_URL=https://staging.example.com -JUSERS=50 -JRAMP=30 -JDURATION_SEC=300
npx tsx scripts/perf/jmeter-summary.ts cart-add-item
mv reports/perf-summary-cart-add-item.json tests/perf/jmeter/baselines/staging/cart-add-item.json
# PR titled "perf(baseline): refresh cart-add-item @ staging — <reason>"
```

## Anti-patterns specific to JMeter

| Anti-pattern | Why it's bad | Do this instead |
|---|---|---|
| Running in GUI mode in CI | Not headless; numbers are wrong | `-n` always; GUI is dev-only |
| Heavy listeners enabled in `.jmx` (View Results Tree, Graph Results) | Slow the load generator more than the SUT | Strip all listeners; `Simple Data Writer` → JTL only |
| Embedding test data in the `.jmx` (User Parameters) | Couples data to the plan; PRs become unreviewable | CSV Data Set Config under `data/` |
| One mega-thread-group covering 8 transactions | Can't isolate which transaction broke SLO | One Transaction Controller per measured transaction; one thread group per scenario |
| `-Xms256m -Xmx512m` (defaults) on a 50-VU run | OOM before the test finishes | `-Xms2g -Xmx4g` minimum for non-trivial loads; tune to peak VU × payload size |
| Letting `.jtl` files into Git | Repo bloats; binary-ish diffs | `.gitignore` `tests/perf/jmeter/results/`; commit baselines under `baselines/` |
| `__time(YMD)` in URLs to "ensure unique data" without a teardown | Pollutes the SUT with garbage rows | Use `setUp` / `tearDown` Thread Groups; or hit ephemeral test data the SUT cleans |
| Modifying `jmeter.properties` for a single test | Per-test config drifts; reproducibility breaks | Pass `-J<key>=<value>` flags only; never touch the global properties file in a PR |

## Cross-references

- [`README.md`](./README.md) — shared discipline (SLO, dashboard contract, decision matrix).
- [`k6.md`](./k6.md) — the default lane for HTTP-only / JS-friendly teams.
- [`locust.md`](./locust.md) — the Python lane.
- [`.agents/skills/performance-testing/SKILL.md`](../../.agents/skills/performance-testing/SKILL.md) — author skill (note: skill primarily targets k6; JMeter use is by exception per the decision matrix).
- [`.agents/skills/performance-analyzer/SKILL.md`](../../.agents/skills/performance-analyzer/SKILL.md) — reads `reports/perf-summary.json` and triages regressions.
- [`documents/ci/github-actions.md`](../ci/github-actions.md) — the canonical workflow shape this perf job slots into.
- Official: [Apache JMeter docs](https://jmeter.apache.org/usermanual/index.html) · [non-GUI testing best practices](https://jmeter.apache.org/usermanual/best-practices.html) · [distributed mode](https://jmeter.apache.org/usermanual/remote-test.html).
