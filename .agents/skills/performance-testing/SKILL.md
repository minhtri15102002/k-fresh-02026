---
name: performance-testing
description: "Authors performance tests using k6 (load + scenario), Lighthouse (front-end vitals), and Playwright traces (transactional latency budgets). Use when explicitly asked to 'add a performance test', 'load test the cart API', 'measure LCP / TTFB / CLS', 'set a latency budget', or before a release that touched a hot path. Picks the right tool per scenario, defines budgets in code, and routes regressions through defect-report. Distinct from performance-testing-review-ai-review which only audits — this skill authors."
optionalRefs:
  - tests/perf/k6/   # output — k6 scripts authored by this skill
---

# Performance Testing

Performance is a feature. This skill picks the right tool for the question, writes the tests, and bakes the budgets into CI so a regression fails the build instead of the next user.

Three tools, three lanes:

| Question | Tool | Output |
|---|---|---|
| **"Does the API hold up under N concurrent users?"** | **k6** (or Artillery) | Throughput, p95/p99 latency, error rate |
| **"Is the rendered page fast for a real user?"** | **Lighthouse** | Core Web Vitals (LCP, INP, CLS), Performance Score |
| **"Does this user journey stay within budget?"** | **Playwright traces / `performance.measure`** | Transaction-level latency assertions |

---

## When to use this skill

Trigger on:
- "Load-test the …" / "Stress-test the …"
- "Measure LCP / INP / CLS / TTFB"
- "Set a latency budget for …"
- "How fast is the cart API under load?"
- Before a release that touched checkout / search / homepage

**Do NOT use when:**
- The user wants a *review* of an existing perf test → use `performance-testing-review-ai-review`.
- A specific perf bug was found → use `defect-report`.
- The user wants visual / a11y → wrong skill.

---

## How to use it

### Phase 1 — Decide the lane

```
What are you testing ?
├── API / endpoint under concurrency        → k6  (Phase 2)
├── Page render in a real browser           → Lighthouse  (Phase 3)
├── E2E journey time (login → buy)          → Playwright trace + soft-assert  (Phase 4)
├── Background job throughput               → out of scope; use a service-side load tool
└── Frontend bundle size                    → Lighthouse `performance` audit + size-limit
```

### Phase 2 — k6 (API load + scenarios)

Install once:
```bash
brew install k6   # or: docker run -i grafana/k6 run -
```

Author tests under `tests/perf/k6/`:
```js
// tests/perf/k6/cart-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const addLatency = new Trend('cart_add_latency_ms', true);

export const options = {
  scenarios: {
    smoke:   { executor: 'constant-vus', vus: 1,  duration: '30s', tags: { stage: 'smoke' } },
    average: { executor: 'ramping-vus', startTime: '30s', stages: [
      { target: 20, duration: '1m' }, { target: 20, duration: '2m' }, { target: 0, duration: '30s' },
    ], tags: { stage: 'avg' } },
  },
  thresholds: {
    http_req_failed:   ['rate<0.01'],                              // < 1% errors
    http_req_duration: ['p(95)<500', 'p(99)<1500'],                // p95 < 500ms
    cart_add_latency_ms: ['p(95)<300'],                            // domain budget
  },
};

export default function () {
  const t0 = Date.now();
  const res = http.post(`${__ENV.BASE_URL}/api/cart`, JSON.stringify({ productId: 30, qty: 1 }), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${__ENV.TOKEN}` },
  });
  addLatency.add(Date.now() - t0);
  check(res, { '201': r => r.status === 201 });
  sleep(1);
}
```

Run: `BASE_URL=https://qa.example.com TOKEN=… k6 run tests/perf/k6/cart-load.js`

CI hook: emit JUnit (`--out junit=k6.xml`) so failed thresholds show in the dashboard.

### Phase 3 — Lighthouse (Core Web Vitals)

Use [`lighthouse`](https://github.com/GoogleChrome/lighthouse) headless or `playwright-lighthouse`:
```bash
npm install --save-dev playwright-lighthouse
```

```ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test(
  'TC-PERF-HOME-01 home page passes Core Web Vitals budgets',
  { tag: ['@P3', '@minor', '@perf', '@home'] },
  async ({ page }) => {
    await page.goto('/');
    await playAudit({
      page,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'first-contentful-paint': 1800,    // ms (good)
        'largest-contentful-paint': 2500,
        'cumulative-layout-shift': 0.1,
        'total-blocking-time': 200,
      },
      reports: { formats: { html: true }, name: 'home-lighthouse' },
    });
  },
);
```

Budgets reference:
| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5 s | 2.5 – 4.0 s | > 4.0 s |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | 200 – 500 ms | > 500 ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 – 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8 s | 1.8 – 3.0 s | > 3.0 s |
| **TTFB** | ≤ 800 ms | 800 – 1800 ms | > 1800 ms |

### Phase 4 — Playwright transaction budgets

For end-to-end journeys, use `performance.now()` or trace timeline:
```ts
test(
  'TC-PERF-CHECKOUT-01 add-to-cart → confirm budget < 4s',
  { tag: ['@P2', '@major', '@perf', '@checkout'] },
  async ({ page, productPage, checkoutPage }) => {
    const t0 = await page.evaluate(() => performance.now());
    await productPage.addToCart(30);
    await checkoutPage.placeOrder();
    await expect(checkoutPage.confirmation).toBeVisible();
    const t1 = await page.evaluate(() => performance.now());
    const elapsed = t1 - t0;
    test.info().annotations.push({ type: 'perf-elapsed-ms', description: String(elapsed) });
    expect.soft(elapsed).toBeLessThan(4000);
  },
);
```

Use `expect.soft` so the run isn't aborted by one-off jitter; the dashboard sees the soft-fail.

### Phase 5 — Triage regressions

A perf test fails → categorise:
1. **Real regression** (sustained over multiple runs) → `defect-report` with `severity:major` if hot path, `severity:minor` if cold.
2. **Single-run jitter** (passes on retry) → flaky perf; widen budget by 10% only after investigation, file a `flaky-test-triage` issue.
3. **Environment effect** (qa runner busy) → mark with `@perf-env-sensitive`, run in a dedicated job with `--workers 1`.

---

## Best practices

- **Set the budget BEFORE the test.** A budget written to match the current run is documentation, not a budget.
- **One scenario per file.** Mixing smoke + soak in one k6 script is unreadable and hard to debug.
- **Tag specs `@perf @P3 @minor`.** Per `prompts/core/test-tags.md`. They don't run on every PR — only on `--grep @perf` jobs.
- **Don't run perf in the main matrix.** Add a dedicated CI job; serialise (`--workers 1`) so noise is bounded.
- **Pin the runner.** Compare like with like — same instance type, same warm-up, same baseline traffic.
- **Track trends, not single points.** Store p95 over 30 days; alert on > 10% week-over-week drift.
- **Lighthouse is volatile.** Run 3× and take the median; never assert on single-run number for INP.
- **Don't conflate load with stress.** Load = expected concurrency; Stress = beyond expected. Document which.
- **Strip third parties for k6.** k6 hits your own services; ad/analytics calls just add noise.

---

## Related

- [`prompts/advanced/performance-analyzer.md`](../../../prompts/advanced/performance-analyzer.md) — analysis prompt for results.
- [`.agents/skills/performance-testing-review-ai-review`](../performance-testing-review-ai-review/SKILL.md) — sister skill that **reviews** existing perf tests.
- [`.agents/skills/defect-report`](../defect-report/SKILL.md) — for filing perf regressions.
- [`prompts/core/test-tags.md`](../../../prompts/core/test-tags.md) — `@perf` tag.
- k6 docs: <https://k6.io/docs/>
- Web Vitals: <https://web.dev/articles/vitals>
