# Burp Suite — Deep-Dive Guideline

> The operator's manual for Burp Suite (and its modern alternative, **Caido**) in this repo. The compact decision-matrix entry lives in [`toolchain.md`](./toolchain.md) §9; this file is the full how-to: edition choice, proxy + cert setup, the five tabs you actually use, the Playwright → Burp → defect workflow, and the legal / scope discipline you can't skip. Calibrated for **Burp Suite 2025.x** (cross-checked May 2026).

## When to reach for Burp Suite

Use Burp when:

- 🧠 You need **business-logic** attacks — multi-step flows, race conditions, intent abuse (the cart-discount-expiry incident in [`training/sandbox/example/manager/defect-narrative-dev.md`](../../training/sandbox/example/manager/defect-narrative-dev.md) is exactly this class)
- 🔬 You need **deep manual iteration** on one request — fuzz a parameter, replay 50 variants, watch the response tree
- 🪤 You need **stateful IDOR / BOLA** testing across users — Burp's session handling beats every other free tool
- 🔭 You need **out-of-band callbacks** for blind XSS / SSRF / blind SQLi (Pro only — Collaborator)
- 🧪 You're conducting a **scoped quarterly pen-test** of a public-facing surface

Avoid Burp when:

- 🚫 You need **CI automation** — Burp Suite CE has no headless mode; Pro's CLI is constrained; use [OWASP ZAP](./owasp-zap.md) for everything that runs unattended
- 🚫 The target has an **OpenAPI spec** and you want broad coverage — Schemathesis ([`toolchain.md`](./toolchain.md) §7) auto-derives tests from the spec; Burp doesn't
- 🚫 You only need **passive header / TLS / cookie** checks — that's [ZAP Baseline](./owasp-zap.md)
- 🚫 You're scanning a **target you don't have written authorisation for** — see §Legal & scope below

The clean rule: **ZAP for every-PR / scheduled, Burp for the manual quarterly deep dive.** They're complementary; don't try to make one do the other's job.

## Editions — pick deliberately

| Edition | Price (May 2026) | Key features | Right for |
|---|---|---|---|
| **Community Edition (CE)** | Free | Proxy + Repeater + Decoder + Comparer + Sequencer · throttled Intruder · no Scanner · no Collaborator · no project-saving | Manual exploration, one-off triage |
| **Professional** | ~$475/user/yr | + Scanner (active + passive) · Collaborator (out-of-band) · BApp Store extensions · project save · faster Intruder | Single dedicated security engineer; quarterly pen-tests |
| **Enterprise** | Custom (per-org) | Headless scanner, CI integration, multi-target scheduling, role-based access, dashboards | Org-scale continuous DAST; alternative to ZAP scheduled scans |

**This repo's default:** Burp **Community** for manual pen-test workflow + [OWASP ZAP](./owasp-zap.md) for everything automated. Pro is justified once a single engineer is doing >2 days/month of manual work — pay back is then ~3 weeks.

For a Pro / Enterprise paid licence proposal, use the [`vendor-decision-rfc`](../../templates/manager/vendor-decision-rfc-template.md) template; the worked example at [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) (visual regression, but same shape) is the calibration reference.

## Caido — the modern alternative

[Caido](https://caido.io) is a Rust-based proxy-tool that re-imagines Burp's UI for 2024+. **Generous free tier** (covers everything Burp CE does and more), much faster UI, native multi-platform binaries, and a Lua scripting model. Trade-off: smaller ecosystem (no BApp store equivalent yet), newer (less battle-tested), team-collaboration features behind paid tier.

| Concern | Burp CE | Caido (free) |
|---|---|---|
| Repeater | ✅ | ✅ (called "Replay") |
| Intruder / Fuzzer | ⚠️ throttled | ✅ unrestricted |
| Project save | ❌ | ✅ |
| Scripting | ❌ (Pro+) | ✅ Lua + JS |
| BApp / extensions | ❌ (Pro+) | ⚠️ smaller ecosystem |
| Out-of-band callback | ❌ (Pro+) | ❌ (paid tier) |
| UI responsiveness | average | excellent |

If you're starting today and don't have a Burp habit, **try Caido first**. The workflow in this guideline maps almost one-for-one (note differences in §Caido section below).

## Install + first run

### Burp CE (macOS / Linux / Windows)

```bash
# macOS
brew install --cask burp-suite

# Linux (.sh installer from PortSwigger)
chmod +x burpsuite_community_linux_v2025_x_x.sh
./burpsuite_community_linux_v2025_x_x.sh

# Windows
# Download installer from https://portswigger.net/burp/communitydownload
```

First-run wizard: choose **Temporary Project** (Pro: choose "New project on disk" and commit the `.burp` file's metadata, never the captured traffic).

### Burp's CA certificate — the prerequisite

Burp intercepts HTTPS by performing a TLS man-in-the-middle. Your browser must trust Burp's certificate or every request will fail with a TLS error.

1. With Burp running and proxy on `127.0.0.1:8080`, browse to `http://burp` in a browser configured to use the proxy.
2. Click **CA Certificate** → downloads `cacert.der`.
3. **Import into your browser:**
   - Firefox: Preferences → Privacy & Security → View Certificates → Authorities → Import → tick "Trust this CA to identify websites"
   - Chrome / Edge / Safari: import via OS keychain (Keychain Access on macOS, certmgr on Windows, NSS on Linux)
4. Verify by hitting `https://example.com` through the proxy — no TLS warning.

⚠️ **Never install Burp's CA into your daily-driver OS keychain.** Use a dedicated browser profile (Firefox profile `pen-test`, Chrome profile `pen-test`) to limit blast radius if Burp is left running.

### Browser proxy configuration

Two patterns, ranked by safety:

**Pattern A (recommended) — Foxy Proxy + dedicated browser profile.** Install [FoxyProxy](https://getfoxyproxy.org/) in a Firefox profile named `pen-test`; configure it to route to `127.0.0.1:8080` only when on a target domain. Switching off = traffic flows direct.

**Pattern B — System-wide proxy.** Set the OS HTTP/HTTPS proxy. Faster, but every app on the machine now goes through Burp — a Spotify update during a scan will pollute your site map and waste your time. Avoid.

## Scope discipline — non-negotiable

Before clicking anything, define scope. Two layers:

### Target scope

**Target → Scope** → **Include in scope** → add prefix(es), e.g.:

```
https://ecommerce-playground.lambdatest.io/
```

**Exclude from scope** anything destructive (mirrors the ZAP excludes from [`owasp-zap.md`](./owasp-zap.md) §Configure context):

```
https://ecommerce-playground.lambdatest.io/index.php?route=account/logout
https://ecommerce-playground.lambdatest.io/index.php?route=account/edit
https://ecommerce-playground.lambdatest.io/index.php?route=admin
```

### Proxy scope

**Proxy → Options → Intercept → Set intercept rule** → tick "URL is in target scope". Now Burp only intercepts in-scope traffic; the YouTube tab you have open in another window doesn't pollute your site map.

### Tool scope (the safety net)

**Settings → Project → Scope** → tick "Use suite scope" for Spider / Scanner / Intruder. This guarantees Intruder won't accidentally fuzz the third-party CDN whose token leaked into a header.

### Save the scope

For Pro: **Project → Save** captures scope. For CE (no project save): export the scope as JSON via **Target → Scope → Export** and commit to `documents/security/burp-scopes/<env>.json` for the next session.

## The five tabs you actually use

Burp has ~12 top-level tabs. In practice you'll spend 90 % of your time in five.

### 1. Proxy

**Where you start.** Capture every in-scope request, forward to the server, watch the response.

- **Intercept on:** every request pauses for your approval. Use this when you need to *modify* a request before it hits the server.
- **Intercept off:** requests flow through; you can see them after-the-fact in **HTTP history**. Use this for general browsing.

Real-life rhythm: keep intercept *off* by default; turn on for the specific request you want to tamper with, then back off.

### 2. Target

**Where you orient.** The site map (left tree of every URL Burp has seen) + the in-scope filter.

Every URL in the tree carries a colour:

| Colour | Meaning |
|---|---|
| Grey | Not visited |
| Blue | Visited (request only — usually a referenced resource) |
| Black | Request + response |
| Green | Has parameters (interesting; tamperable) |
| Red | A scanner finding (Pro only) |

Right-click any node → **Send to Repeater** / **Intruder** / **Comparer** to start the next phase.

### 3. Repeater (the workhorse)

**Where you iterate.** Take one request, modify it, fire it, examine the response. Then modify again. Then again. This is **75 % of all manual pen-test work**.

Workflow: send a request to Repeater (Ctrl-R / Cmd-R), then in the Repeater tab:

1. Edit the request body / headers / URL on the left
2. Click **Send**
3. Read the response on the right
4. Compare with the original (right-click → Send to Comparer if needed)
5. Iterate until you've answered: "is this parameter exploitable?"

Tabs in Repeater are cheap — open one per parameter or per hypothesis. Name them (`#1` → `#1 — discount EXP_2025`, etc.).

Repeater is where you'd reproduce the **cart-discount-expiry** bug:

```
Original request:  POST cart/add  body: discount=SAVE15
Repeated 1:        POST cart/add  body: discount=SAVE15-EXPIRED  → 200, total $0
Repeated 2:        POST cart/add  body: discount=' OR '1'='1     → check for SQL hints
Repeated 3:        POST cart/add  body: discount=<script>...     → check XSS reflection
```

### 4. Intruder

**Where you fuzz.** Take a request, mark which parameter to vary, choose a payload list, fire all variants, sort the responses by status / length / content.

Four attack types:

| Type | What it does | When to use |
|---|---|---|
| **Sniper** | One payload position at a time; substitutes payloads from one list | Most common — fuzz a single parameter |
| **Battering Ram** | Same payload into all positions | Test "does this token work in any field" |
| **Pitchfork** | Parallel payloads — N lists, one payload from each per request | Username + password from two lists, paired |
| **Cluster Bomb** | Cartesian product — every payload from each list combined with every other | Username × password fuzzing (slow; thousands of requests) |

⚠️ **Throttle Community Edition.** Burp CE rate-limits Intruder to ~1 req/sec. For real fuzzing volumes, either upgrade or use Caido / ZAP / `ffuf`. Don't try to "wait it out" — for a 10k payload list at 1/sec that's >2 hours.

### 5. Decoder + Comparer (small but used)

**Decoder** — paste a value, decode/encode through Base64 / URL / Hex / HTML / etc. Useful when a param looks suspicious (`MTIzNDU=` → `12345` → tampering surface).

**Comparer** — diff two responses (the Repeater original vs. the variant) byte-by-byte or word-by-word. Useful when the only difference between "exploit worked" and "exploit didn't work" is a single header or a 5-byte body change.

### The other tabs (briefly)

- **Sequencer** — analyse session-token randomness. Useful once when joining a new project, then rarely.
- **Extender / BApp Store** — third-party plugins (Pro only). Notable: `Logger++` (better history), `Autorize` (auto-IDOR detection), `Hackvertor` (encoding chains).
- **Collaborator** (Pro only) — out-of-band callbacks. Burp's killer feature for blind XSS / SSRF / blind SQLi. If you only ever use one Pro feature, this is it.
- **Scanner** (Pro only) — active scanner. We use [ZAP](./owasp-zap.md) for the automated lane; Pro's scanner is convenient if you already have Pro.

## The integration this repo uses — Playwright → Burp → defect

The cleanest workflow for a quarterly manual pen-test of one surface (e.g. cart):

### Step 1 — Capture the happy-path flow with Playwright

You already have this — `tests/ui/test-cart.spec.ts` (and the AI Agent can generate one if not). Run it with HAR capture:

```bash
PLAYWRIGHT_HAR=reports/security/cart-flow.har \
  npx playwright test tests/ui/test-cart.spec.ts --project="Desktop Chrome"
```

Where the test does (or `globalSetup` does):

```ts
// playwright.config.ts contextOptions, OR per-test:
const context = await browser.newContext({
  recordHar: { path: process.env.PLAYWRIGHT_HAR ?? 'reports/cart-flow.har' },
});
```

### Step 2 — Import the HAR into Burp

**Burp → Proxy → HTTP history → right-click → Import** → choose `cart-flow.har`. Every request from the Playwright run lands in your history with full headers + bodies.

### Step 3 — Send the interesting requests to Repeater + Intruder

Walk the history; for each request that takes user input (POST body params, URL params, JSON fields), right-click → **Send to Repeater**. For each request you want to fuzz, right-click → **Send to Intruder**.

Now you have a **scoped pen-test workspace** that covers exactly the surface your test exercises — no spider, no third-party noise.

### Step 4 — Probe systematically (a checklist)

For each request in Repeater:

- [ ] **Auth bypass:** remove the auth cookie. Does it still work?
- [ ] **IDOR:** change a numeric ID by ±1 / ±100. Does it return a different user's data?
- [ ] **Type confusion:** change `"id": 42` to `"id": "42"` / `"id": [42]` / `"id": null` / `"id": {"$ne": null}`. Different behaviour?
- [ ] **Boundary:** very long strings, very large numbers, very deep JSON. 5xx? Stack trace?
- [ ] **Unicode / encoding:** `discount=SAVE15` vs `discount=SAVE\u200B15` (zero-width space). Different result?
- [ ] **Race conditions:** fire 10 identical "apply discount" requests simultaneously (Burp Pro: Turbo Intruder). Does the discount apply 10×?
- [ ] **Method confusion:** swap `POST` for `GET` or `PUT`. Same result?
- [ ] **Parameter pollution:** `discount=SAVE15&discount=EXPIRED`. Which wins?
- [ ] **Reflected XSS surface:** `discount=<svg/onload=alert(1)>`. Reflected anywhere?
- [ ] **Stored XSS surface:** put the same payload in a field that other users will see (review, comment).

For intent-test cases (the cart-discount-expiry style), this list is the difference between "we ran a scan" and "we manually verified the auth / business-logic surface".

### Step 5 — Record findings

Per finding:

1. Save the **Repeater request + response** as a saved item (Burp Pro) or copy as a curl command (CE — right-click → Copy as curl) into the write-up.
2. Take a **screenshot** of the response showing the unexpected behaviour.
3. Document the **minimum repro** in `documents/security/findings/<YYYY-MM-DD>-<short-name>.md` (template below).
4. File the **defect** (next section).

## Write-up template — `findings/<date>-<name>.md`

```markdown
# <Short, no-jargon title> — <YYYY-MM-DD>

## Severity
sev-<1-4> · `severity:critical|major|minor|trivial`

## Affected
- URL: `<scheme>://<host><path>`
- Method: GET / POST / PUT / DELETE
- Module: `module:cart` (or whichever)
- Authentication: anonymous / requires login / requires admin

## Summary (1-2 sentences)
<what the unexpected behaviour is, in the dev's vocabulary>

## Steps to reproduce
1. <step>
2. <step>
3. <step>

## Curl repro (paste from Burp Repeater)
```bash
curl 'https://...' \
  -H 'Cookie: ...' \
  -d 'discount=SAVE15-EXPIRED'
```

## Expected vs actual
**Expected:** <reference: spec / `documents/requirements/...md`>
**Actual:** <observed behaviour, with response snippet>

## Evidence
- Screenshot: `findings/<date>-<name>-evidence.png`
- Burp item: `findings/<date>-<name>.burp` (Pro only — saved Repeater request)
- Related test: `tests/api/<spec>.spec.ts` :TC-<id>

## Suggested remediation
<one paragraph; what the fix would change in the code path>

## Reporter
<your name> · <date>
```

This shape mirrors [`templates/manager/defect-narrative-template.md`](../../templates/manager/defect-narrative-template.md) — the same write-up promotes directly to a Track P P3 defect narrative.

## Defect routing — same canonical labels as everything else

A Burp finding files a defect with **exactly** the same labels as a ZAP finding or a Playwright failure:

| Label family | Burp finding default |
|---|---|
| `bug` | always |
| `severity:*` | `severity:critical` for auth bypass / IDOR with PII / RCE / SQLi · `severity:major` for stored XSS / reflected XSS in auth context · `severity:minor` for header / cookie / TLS issues missed by ZAP · `severity:trivial` for informational |
| `module:*` | from the affected URL path |
| `root-cause:*` | `root-cause:logic` (always — manual pen-test catches logic bugs by definition) |
| `phase:*` | `phase:exploratory` (this is the only place this value originates) |
| `found-in:*` | `found-in:staging` (you scanned staging, not prod, right?) |
| `priority:*` | inherits from severity by default |

Use the [`defect-report`](../../.agents/skills/defect-report/SKILL.md) skill — pass it the markdown write-up:

```bash
npm run defect:from-md -- documents/security/findings/2026-04-22-cart-discount-bypass.md \
  --module cart --severity critical --found-in staging --phase exploratory
```

The skill emits a Jira / GitHub-ready issue body using the canonical labels and surfaces in [`templates/qa-metrics-dashboard.html`](../../templates/qa-metrics-dashboard.html) Section 3.

## Caido — same workflow, what differs

If you're using Caido instead of Burp:

| Burp concept | Caido equivalent |
|---|---|
| **Proxy → HTTP history** | **HTTPQL** (powerful query DSL: `req.method.eq:"POST" AND req.path.cont:"cart"`) |
| **Repeater** | **Replay** (collections; tabs persist across sessions for free, no Pro upsell) |
| **Intruder (Sniper / Pitchfork / etc.)** | **Automate** (single tool, payload + position concept; not throttled in free tier) |
| **Comparer** | **Convert** + side-by-side diff |
| **Decoder** | **Convert** (encoding chains via Lua) |
| **BApp Store** | **Plugins** (smaller ecosystem; growing) |
| **Collaborator** | **Listener** (paid tier) |

The mental model and §The five tabs guidance translate directly. Caido's **HTTPQL** is the killer feature — once you've used it, Burp's history feels primitive.

## Anti-patterns this guideline rules out

- ❌ **Running Burp without scope.** You will spider into the wrong target. Set scope first, every time.
- ❌ **Using Burp on a target without written authorisation.** See §Legal & scope below — this is the difference between "security testing" and "criminal offence".
- ❌ **Trusting Burp CE's Intruder for production-grade fuzzing.** It's throttled; you'll get misleading results. Use Caido or ZAP if you need volume.
- ❌ **Not capturing your repro.** A finding without a curl-replayable repro is hearsay. Always copy-as-curl.
- ❌ **Letting Burp run in the background between sessions.** It will exhaust memory and start dropping requests silently.
- ❌ **Pasting captured traffic into chat / tickets.** It contains session cookies. Redact via Burp's "Mask sensitive data" or use the curl-with-`<TOKEN>`-placeholder pattern.
- ❌ **Reporting a finding without the suggested remediation.** "It's broken" without "here's how to fix it" is half a defect.
- ❌ **Treating Burp as a substitute for [OWASP ZAP](./owasp-zap.md).** Different tools, different cadences, both required.

## Legal & scope — the must-read

You may run Burp / Caido **only** against:

1. Targets your organisation **owns and operates** in environments where pen-testing is authorised in writing
2. Public bug-bounty targets that **explicitly permit** the techniques you're using (read the program's policy; "Burp Repeater" is usually fine, "Burp Intruder against `/login`" usually isn't without rate-limit agreement)
3. The repo's defaulted SUT (LambdaTest e-commerce playground) for **manual exploration only** — passive interception + Repeater single requests; **never Intruder against a third-party testbed** without their explicit consent

If you intercept / modify / fuzz a target outside these conditions, you may be committing a criminal offence (CFAA in the US, Computer Misuse Act in the UK, similar elsewhere). The cost of getting this wrong is real (criminal prosecution, civil liability, employer termination, industry blacklist).

Document every authorisation under `documents/security/scan-authorizations/<target>.md` with:

- The target URL pattern
- The dated written authorisation (email screenshot, signed MSA section, bug-bounty program URL)
- The agreed-on testing window
- The agreed-on rate limits
- The contact for questions

Re-confirm before every quarterly pass.

## Pro features — when they earn their keep

Buy Burp Pro when **all** of the following are true:

1. ≥ 1 dedicated security engineer doing >2 days/month of manual work (back-of-napkin: $475 / yr / engineer is < 1 hour of senior-IC time)
2. You have at least one in-scope public-facing surface where Collaborator (out-of-band) findings would be high-impact (any auth flow, any user-content surface)
3. Your team would use **Scanner** + **Repeater session save** + **BApp Store** in their normal flow

Otherwise: stay on CE + augment with Caido (free tier) for fuzzing volume + use [ZAP](./owasp-zap.md) for the automated scanner role.

For the paid-licence proposal, the [`vendor-decision-rfc`](../../templates/manager/vendor-decision-rfc-template.md) template is purpose-built; Phoenix QA's worked example for visual regression at [`training/sandbox/example/manager/vendor-decision-rfc.md`](../../training/sandbox/example/manager/vendor-decision-rfc.md) shows the scoring pattern.

## Related

- [`README.md`](./README.md) — folder index, threat model, decision matrix
- [`toolchain.md`](./toolchain.md) §9 — the compact entry this file expands
- [`owasp-zap.md`](./owasp-zap.md) — automated DAST sibling guideline (the right tool for the cases Burp doesn't cover)
- [`SECURITY.md`](../../SECURITY.md) — disclosure policy, scope, hardening guarantees
- [`prompts/core/defect-labels.md`](../../prompts/core/defect-labels.md) — canonical label set every Burp-derived issue uses
- [`templates/manager/defect-narrative-template.md`](../../templates/manager/defect-narrative-template.md) — same write-up shape as the per-finding template above
- [`templates/manager/vendor-decision-rfc-template.md`](../../templates/manager/vendor-decision-rfc-template.md) — for any paid Burp Pro / Enterprise proposal
- [`.agents/skills/api-security-testing/SKILL.md`](../../.agents/skills/api-security-testing/SKILL.md) — agent workflow for security-testing one endpoint (complements manual Burp)
- [`.agents/skills/defect-report/SKILL.md`](../../.agents/skills/defect-report/SKILL.md) — converts a Burp finding write-up to a Jira/GitHub-ready issue
- [`tests/api/test-security.spec.ts`](../../tests/api/test-security.spec.ts) — in-repo Playwright security suite (intent tests; Burp findings here often get a regression spec port)
- [`training/sandbox/example/manager/defect-narrative-dev.md`](../../training/sandbox/example/manager/defect-narrative-dev.md) — worked example of a finding write-up for the engineer audience
