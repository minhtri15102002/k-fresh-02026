# Acceptance Criteria Template

One Given-When-Then per behaviour the requirement implies. Use this template verbatim — consistency makes downstream skills (`generate-manual-testcase`, `bdd-gherkin-author`, `requirements-traceability`) parseable.

---

## Skeleton

```gherkin
AC-<n>: <one-line title that describes the behaviour, not the implementation>

  GIVEN  <pre-condition / state / actor with role>
    AND  <additional pre-condition>
  WHEN   <single, atomic trigger>
  THEN   <observable outcome>
    AND  <additional outcome / side-effect>
```

Rules:
- One `WHEN` per criterion. If you need two, split into two ACs.
- Every `THEN` must be observable from outside the system (UI element, API response, DB row, event emitted, email sent, log line written).
- No `THEN` of the form "the system works correctly" — that's not an outcome.
- Use the actor's exact role name, not "user". A `Customer` and a `Customer-Service-Agent` are different.

---

## Required coverage per requirement

A green verdict requires at least one AC for each of:

```
□ Happy path                     (typically 1–2 ACs)
□ Each alternate path            (one AC each)
□ Each error path                (auth fail, validation fail, downstream timeout, partial write)
□ Each boundary                  (empty, single, max, max+1, zero, negative, unicode, RTL)
□ Each stated non-functional     (perf budget, a11y level, locale, security control)
```

If the requirement names performance, security, accessibility, or i18n, those become explicit ACs — not "implicit, the framework handles it".

---

## Worked example

**Raw requirement:**
> "Customers can apply a promo code at checkout to get a discount."

**Drafted ACs:**

```gherkin
AC-1: Valid promo code reduces order total

  GIVEN a Customer with a non-empty cart of subtotal $100
    AND a promo code "WELCOME10" that grants 10% off the subtotal
    AND the code is currently active and within its usage limit
  WHEN the Customer applies "WELCOME10" at checkout
  THEN the order total updates to $90
    AND the discount line shows "WELCOME10 −$10.00"
    AND the discount is included in the order confirmation email
    AND the code's usage counter increments by 1


AC-2: Expired promo code is rejected

  GIVEN a Customer with a non-empty cart
    AND a promo code "SUMMER" whose end date is yesterday
  WHEN the Customer applies "SUMMER" at checkout
  THEN the order total does not change
    AND an inline error reads "This promo code has expired"
    AND no discount line is added
    AND no usage counter changes


AC-3: Promo code at usage limit is rejected

  GIVEN a Customer with a non-empty cart
    AND a promo code "VIP" with usage limit 100 already used 100 times
  WHEN the Customer applies "VIP" at checkout
  THEN the order total does not change
    AND an inline error reads "This promo code is no longer available"


AC-4: Unknown promo code is rejected

  GIVEN a Customer with a non-empty cart
  WHEN the Customer applies "DOES-NOT-EXIST" at checkout
  THEN the order total does not change
    AND an inline error reads "Invalid promo code"
    AND no API call is made beyond the validation request


AC-5: Promo code field is empty
  GIVEN a Customer with a non-empty cart
  WHEN the Customer clicks Apply with an empty promo code field
  THEN the Apply button is disabled
    AND no validation request is sent


AC-6: Performance — code validation responds within budget
  GIVEN a Customer with a non-empty cart
  WHEN the Customer applies any promo code at checkout
  THEN the validation response p95 is < 300 ms on a 4G connection
    AND the spinner is shown for at most 500 ms before timeout fallback


AC-7: Accessibility — keyboard-only flow
  GIVEN a Customer using only the keyboard
  WHEN the Customer tabs to the promo code field, types "WELCOME10", and presses Enter
  THEN the discount applies as in AC-1
    AND focus moves to the Apply button after the field
    AND the discount-line update is announced via aria-live="polite"
```

Notice:
- Happy path (AC-1) and three error paths (AC-2, AC-3, AC-4).
- A boundary (AC-5).
- Two non-functionals that the original requirement silently omitted (AC-6, AC-7) — surfaced because Pass 3 found them missing.
- Each `THEN` is externally observable.

If the original requirement had been too vague to draft AC-1 confidently — e.g. "discount" without any rule about percentage vs flat amount — the verdict would have been **NEEDS-REFINEMENT**, not "draft an AC and guess the rule".

---

## Hand-off

Drafted ACs are stored alongside the scorecard at `reports/requirement-scorecards/<REQ-ID>-<DATE>.md` and consumed by:

- [`test-design-techniques`](../../test-design-techniques/SKILL.md) — picks EP / BVA / decision-tables for each AC.
- [`generate-manual-testcase`](../../generate-manual-testcase/SKILL.md) — emits the manual cases (typically 1–N per AC).
- [`bdd-gherkin-author`](../../bdd-gherkin-author/SKILL.md) — emits the executable feature file with the same AC IDs.
- [`requirements-traceability`](../../requirements-traceability/SKILL.md) — stitches AC-ID ↔ TC-ID ↔ test-file:line in the matrix.

Keep AC IDs stable across refactors — they're the join key for the entire downstream chain.
