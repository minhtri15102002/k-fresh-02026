---
name: chaos-engineering
description: "Designs and runs chaos experiments to validate resilience: hypothesis-driven failure injection (kill a pod, drop network packets, latency-inject 200ms, throttle CPU, fill disk, corrupt a response) under controlled traffic, with measurable steady-state assertions and an automatic abort if user-impact thresholds breach. Picks the right tool (toxiproxy for network, k6 for load, Chaos Toolkit / Litmus / Gremlin for k8s, Playwright for client-side fault injection). Use when explicitly asked to 'chaos-test the cart', 'inject latency', 'kill the database for 30s', 'verify graceful degradation', 'game-day exercise', or before declaring a feature production-ready. Distinct from performance-testing (steady-state load) — this skill is failure-injection."
---

# Chaos Engineering

Most "production-ready" claims are untested optimism. Chaos engineering replaces optimism with evidence: state a hypothesis, inject the failure, observe whether the system actually behaves the way you said it would.

## When to use this skill

- "Chaos-test `<feature>`"
- "Inject latency / drop the DB / fill disk"
- "Verify graceful degradation"
- "Game-day exercise"
- Before declaring a feature production-ready

Do **not** use when:
- The system isn't observable (no metrics, no traces) → instrument first; chaos without observability is just sabotage.
- The system has no redundancy → chaos will reveal that, but you knew it would. Build redundancy first.

## Hypothesis-first workflow

Every experiment starts with a written hypothesis:

```
Hypothesis:
  When the cart-service Postgres connection drops for 30s,
  the cart UI continues serving from cache,
  the user can still browse but cannot check out,
  and recovery completes within 60s of restoration.

Steady-state metric: cart-page p95 < 1.5s, error rate < 1%
Abort threshold:     error rate > 5% for 30s OR any 5xx on /checkout
```

If the hypothesis is unwritten, **stop and write it**. Skip this and you'll learn nothing.

## Tool decision tree

```
What are you injecting ?
├── Network latency / drop / partition       → toxiproxy (lightweight, in-process)
├── Service kill / pod kill / restart         → Chaos Toolkit, Litmus (k8s), or kubectl scripts
├── CPU / memory / disk pressure              → stress-ng, Chaos Mesh
├── Bad responses (5xx, malformed JSON)       → Mountebank / Wiremock fault injection
├── Client-side (browser) — slow CPU, 3G       → Playwright `client.send('Network.emulateNetworkConditions')`
└── Combined load + chaos                     → k6 + toxiproxy in same compose
```

## How to use it

### Phase 1 — Author the experiment

```yaml
# experiments/cart-db-drop-30s.yaml
name: cart-db-drop-30s
hypothesis:
  steady_state:
    - probe: cart-page p95 < 1500ms (k6 baseline)
    - probe: error rate < 1%
  abort_if:
    - probe: error rate > 5% for 30s
    - probe: any 5xx on /checkout
method:
  - background: k6 run baseline.js (50 RPS)
  - action:     toxiproxy block cart-postgres for 30s
  - rollback:   toxiproxy unblock cart-postgres
observe:
  - metric: error_rate (Prometheus)
  - metric: cart_page_latency_p95 (Prometheus)
  - log:    cart-service.log
recovery_check:
  - probe: cart-page p95 < 1500ms within 60s of restore
```

### Phase 2 — Run small, scoped

| Blast radius | When |
|---|---|
| One service, dev env | always start here |
| One service, staging | only after dev passes |
| One service, prod (canary) | only with abort wiring + on-call buy-in |
| Whole stack, prod | game-day; declared, scheduled, observed |

### Phase 3 — Observe & decide

After the run:
- Did steady-state hold? → hypothesis confirmed; document for runbook.
- Did the abort fire? → hypothesis falsified; file via [`defect-report`](../defect-report/SKILL.md) with `severity:major`, custom `type:resilience`.
- Inconclusive (noise) → repeat with sharper steady-state probes.

### Phase 4 — Wire into CI (resilience regression tests)

For matured systems, run a small subset of experiments on a schedule:

```yaml
# .github/workflows/chaos.yml
on: { schedule: [{ cron: '0 6 * * 1' }] }   # every Monday 06:00
jobs:
  cart-db-drop:
    runs-on: ubuntu-latest
    steps:
      - run: docker compose up -d
      - run: chaos run experiments/cart-db-drop-30s.yaml
      - if: failure()
        run: gh issue create --title "Chaos: cart-db-drop hypothesis falsified" --label "chaos,severity:major,resilience"
```

## Best practices

- **Hypothesis or it didn't happen.** A chaos run without a hypothesis is just an outage you caused yourself.
- **Abort thresholds are non-negotiable.** Every experiment has a kill-switch; the kill-switch is wired before the action.
- **Smallest blast radius first.** Dev → staging → canary → prod, never skip steps.
- **Observe before injecting.** If you can't see steady-state, you can't see deviation.
- **Document every run.** Even passing runs are evidence; archive them with the runbook.

## Related

- [`.agents/skills/performance-testing/SKILL.md`](../performance-testing/SKILL.md) — sibling: steady-state load (provides baseline for chaos)
- [`.agents/skills/performance-analyzer/SKILL.md`](../performance-analyzer/SKILL.md) — analyse latency during chaos
- [`.agents/skills/defect-report/SKILL.md`](../defect-report/SKILL.md) — file falsified-hypothesis findings
- [`.agents/skills/release-readiness/SKILL.md`](../release-readiness/SKILL.md) — chaos pass/fail can be an exit criterion
