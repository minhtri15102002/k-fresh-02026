# Module 04 — Test Design Techniques

> Phase 0 · Effort: 4h · Prerequisites: Module 03

## Learning objectives

After this module you can:

- Apply **Equivalence Partitioning (EP)** to reduce N inputs to a handful of representative classes.
- Apply **Boundary Value Analysis (BVA)** to find off-by-one and off-by-edge bugs.
- Build a **Decision Table** for combinatorial business rules.
- Sketch a **State Transition Diagram** and derive tests from edges.
- Use **Pairwise (orthogonal-array) testing** when full combinatorial coverage is infeasible.
- Write a **risk-based** test plan: where to spend test effort first.

## Why it matters

Without test design, you write the same 3 happy-path tests in slightly different syntax. With test design, 8 well-chosen test cases beat 80 random ones. **This is the highest-leverage skill in QA.** Tools cannot fake it.

## Concepts

### 1. Equivalence Partitioning

For each input, identify classes that should behave the same; pick one representative from each.

**Example — age field, valid 18–120:**

| Class | Range | Representative |
|---|---|---|
| Below valid | < 18 | 17 |
| Valid | 18–120 | 50 |
| Above valid | > 120 | 121 |
| Non-numeric | letters/symbols | "abc", "@@" |
| Empty | "" | "" |
| Negative | x < 0 | -5 |

5 classes → ~6 tests instead of 120+.

### 2. Boundary Value Analysis

EP misses the most bug-prone inputs: **the edges**. Test each boundary at:

`boundary − 1`, `boundary`, `boundary + 1`

For age 18–120:

`17, 18, 19, 119, 120, 121` (6 cases) → catches the "off-by-one" defect class.

Always combine **EP + BVA**. Industry-standard.

### 3. Decision Tables

For combinational rules — multiple inputs producing different outputs.

**Example — Free shipping:**

| Rule | Cart > $50 | Has coupon | Premium member | → Shipping |
|---|---|---|---|---|
| R1 | Y | Y | Y | Free |
| R2 | Y | Y | N | Free |
| R3 | Y | N | Y | Free |
| R4 | Y | N | N | Free (over $50) |
| R5 | N | Y | Y | Free (coupon) |
| R6 | N | Y | N | Free (coupon) |
| R7 | N | N | Y | Free (member) |
| R8 | N | N | N | $5 |

8 rules → 8 test cases. The decision table also forces conversation with the PM ("wait, R4 contradicts the spec").

### 4. State Transition Testing

For state machines: order workflow, login session, subscription lifecycle.

**Example — Login session:**

```
[Logged out] --login()--> [Logged in] --inactivity 30m--> [Session expired]
[Logged in] --logout()--> [Logged out]
[Session expired] --any action--> [Logged out]
```

Tests:
- Each **state** is reachable
- Each **valid transition** works
- Each **invalid transition** is rejected (e.g. `logout()` while `[Logged out]`)

### 5. Pairwise Testing

When N inputs each have M values, full coverage = M^N. Pairwise covers all pairs of values, drastically cutting cases while still finding most defects (~80% of multi-variable bugs are pairwise).

**Example — Browser × OS × Resolution × Locale, 3 values each = 81 combinations.** Pairwise reduces to ~9 combinations.

Tools: PICT (Microsoft), `allpairs.py`.

### 6. Risk-Based Prioritization

```
Risk score = Likelihood × Impact
```

Rank features → spend test effort proportional to risk.

| Feature | Likelihood (1–5) | Impact (1–5) | Risk | Priority |
|---|---|---|---|---|
| Payment | 3 | 5 | 15 | P1 |
| Wishlist | 2 | 1 | 2 | P3 |
| Login | 4 | 5 | 20 | P1 |

This drives the `@P1/@P2/@P3` tags in this repo (see `prompts/core/test-tags.md`).

## Hands-on lab

1. **EP + BVA** — Take the registration form (`pages/ui/register-page.ts`). Apply EP + BVA to the email + password fields. Produce a table.
2. **Decision Table** — Read `documents/automation-framework/coverage-requirements.md` (or the equivalent in your spec). Build a decision table for cart-discount logic.
3. **State Transition** — Draw the state diagram for the user authentication lifecycle. Identify which states/transitions are covered by `tests/ui/test-login.spec.ts` and which are missing.
4. **Pairwise** — You have 4 browsers × 3 OSes × 2 viewports × 4 locales = 96. Use PICT to reduce. Submit your config + result.

## Self-check

- [ ] Given a positive-integer field 1–100, EP+BVA gives how many cases? List them.
- [ ] When does a decision table beat a list of test cases?
- [ ] Why doesn't 100% line coverage equal 100% test coverage?
- [ ] Given a 2-hour test budget and 3 features (Login, Wishlist, Checkout), how do you allocate time?

## Further reading

- *A Practitioner's Guide to Software Test Design*, Lee Copeland
- ISTQB Foundation Level syllabus — chapters on test techniques
- Microsoft PICT pairwise tool

---

**Prev:** [03 — Test types & levels](./03-test-types-and-levels.md) · **Next:** [05 — Manual test cases & defects](./05-manual-test-cases-and-defects.md)
