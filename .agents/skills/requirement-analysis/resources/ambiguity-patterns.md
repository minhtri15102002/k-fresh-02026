# Ambiguity & Weasel-Word Pattern Catalogue

Patterns this skill scans for during Pass 2. Each row has the smell, the regex (or token list) the script can match against, why it's lethal, and a recommended re-wording move.

---

## 1. Vague adjectives

| Trigger words | Why lethal | Re-wording move |
|---|---|---|
| `fast`, `quick`, `responsive`, `snappy` | Different readers measure differently — guaranteed sign-off fight | Replace with explicit budget: `< 200 ms p95 on 4G connection` |
| `user-friendly`, `intuitive`, `easy-to-use`, `simple` | Untestable opinion | Replace with task-completion measure: `90% of users complete checkout in ≤ 3 clicks` |
| `clean`, `nice`, `professional`, `polished` | Aesthetic, not behaviour | Replace with concrete style guide reference or comparator |
| `robust`, `reliable`, `stable`, `resilient` | Disagreement on threshold | Replace with explicit failure budget: `≤ 0.1% error rate over 24h` |
| `scalable`, `high-performance` | Hand-waves the constraint | Replace with stated load: `1000 RPS sustained, 5000 RPS burst` |
| `secure`, `safe` | Empty signifier | Reference specific threats / standards: OWASP API Top 10, PCI-DSS 3.2 |
| `modern`, `state-of-the-art` | Time-relative, undefined | Remove or replace with technology constraint |

Regex hint: `\b(fast|quick|responsive|user-friendly|intuitive|easy[\s-]to[\s-]use|clean|robust|reliable|scalable|secure|modern|seamless)\b`

---

## 2. Modal weakness

| Trigger words | Why lethal | Re-wording move |
|---|---|---|
| `should`, `may`, `could`, `might`, `ideally`, `preferably` | Optionality unclear ⇒ devs ship without, defects triaged "won't fix" | Replace with `must` for mandatory or move to a separate "nice-to-have" backlog item |
| `eventually`, `at some point` | No timing | Replace with explicit deadline / freshness window |

Regex hint: `\b(should|may|could|might|ideally|preferably|eventually|at some point)\b`

Note: `should` in test-style language ("Then the cart should display…") is fine; the smell is `should` in *requirement* language ("The system should validate…").

---

## 3. Unbounded plurals & quantifiers

| Trigger words | Why lethal | Re-wording move |
|---|---|---|
| `users`, `items`, `products`, `records`, `requests` (no number) | 1 vs 100 vs 1M changes the design entirely | Add explicit cardinality: `up to 10K active users`, `≤ 50 items per cart` |
| `all`, `every`, `any`, `some` (without scope) | Unbounded — drives O(N) blow-ups | Bound the scope: `all items in the current page`, `every order from the last 30 days` |
| `etc.`, `and so on`, `…`, `including but not limited to` | Hides the long tail | Enumerate fully, or close the list |

Regex hint: `\b(etc\.?|and so on|\.\.\.|including but not limited to)\b`

---

## 4. Missing structural elements

| Smell | Question to ask | Re-wording move |
|---|---|---|
| **Missing actor** | Who triggers this? Customer? Admin? System? Cron? | Prefix with "As a `<role>`…" or "When the `<role>` does X" |
| **Missing trigger** | What event causes the behaviour? | Add `WHEN` clause: click, submit, cron, webhook, message |
| **Missing pre-conditions** | What state must hold? Logged in? Cart populated? Inventory available? | Add `GIVEN` clauses listing required state |
| **Missing post-conditions** | What's the observable outcome? UI? DB? Email? Event emitted? | Add `THEN` clauses with all observable side-effects |
| **Missing error paths** | What happens when X fails? | Enumerate failure modes (auth fail, validation fail, downstream timeout, partial write) |
| **Missing units** | "Wait 30" — seconds? ms? days? | Always include the unit |

---

## 5. Hidden non-functional requirements

The requirement describes *what* but silently elides *how well* / *how fast* / *for whom*:

| Hidden NFR | Surface question |
|---|---|
| Performance | Latency budget? Throughput? Payload size? Time-out? |
| Security | Auth? Authz? Audit log? Input validation? PII handling? |
| Accessibility | WCAG level (A / AA / AAA)? Keyboard nav? Screen-reader? |
| i18n / l10n | Locale matrix? Currency? Date format? RTL? |
| Compatibility | Browser matrix? Device matrix? OS matrix? |
| Observability | Metrics emitted? Log fields? Trace span? Alerting? |
| Data | Retention? Backup? Export? Deletion (GDPR)? |
| Failure | Retry? Circuit-breaker? Fallback? Degraded mode? |
| Capacity | Concurrency? Rate-limit? Quota? |
| Compliance | Regulatory framework? Audit requirement? |

If any hidden NFR is critical for the feature and not stated, surface it during the assumption pass.

---

## 6. Implementation leakage

| Smell | Why it locks design | Re-wording move |
|---|---|---|
| Names a specific tech ("Redis", "Postgres", "RabbitMQ") | Pre-decides the *how*; loses Negotiable | Re-state as user behaviour or non-functional constraint |
| Names a UI control ("modal", "dropdown", "tab") | Locks UX | Describe interaction outcome, let designers pick the control |
| Names an algorithm ("sort by Levenshtein") | Pre-decides; misses the actual user need | Describe the desired ordering / matching outcome |

The exception: when the constraint is genuine (regulatory, compatibility), state it as a non-functional row instead of folding it into the behaviour.

---

## 7. Double / triple-barrelled requirements

A single requirement that smuggles two or more behaviours:

> "Users can search products **and** save them to a wishlist."

Why lethal: two behaviours, one acceptance test. If one fails, the story is half-broken — and refinement during dev is more expensive than splitting up front.

Detection: scan for conjunctions (`and`, `as well as`, `also`, `,`) joining two verbs.

Re-wording move: split into two stories.

---

## 8. Numeric ambiguity

| Smell | Example | Fix |
|---|---|---|
| Off-by-one ambiguity | "up to 10" — inclusive or exclusive? | Use `≤ 10` or `< 10` |
| Open-ended range | "more than 5" — what's the upper bound? | State the upper bound, even if it's `Infinity` |
| Mixed units | "30 days … 24 hours" | Convert to a single unit |
| Significant figures | "approximately 100ms" | State precision: `100 ± 5 ms p95` |

---

## Scanner output format

For each match, emit:

```
[smell-class]  <pattern matched>
  location  : §<section> / <line>
  evidence  : "<verbatim quote>"
  suggestion: "<re-wording move>"
```

Aggregate counts by smell-class are fed into the verdict matrix:

- ≥ 3 ambiguity smells in critical positions (trigger, outcome, actor) ⇒ **REJECT**
- 1–2 ambiguity smells, otherwise clean ⇒ **NEEDS-REFINEMENT** (light touch)
- Smells only in nice-to-have prose ⇒ note in scorecard, do not block

Critical positions are defined as: the actor clause, the trigger clause, and the primary outcome clause. Smells in supporting context are softer signals.
