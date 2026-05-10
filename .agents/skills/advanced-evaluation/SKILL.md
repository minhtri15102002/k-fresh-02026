---
name: advanced-evaluation
description: "Evaluates LLM and AI-agent outputs systematically using direct scoring, pairwise comparison, and rubric generation. Use when the user asks to ‘grade these AI responses’, ‘compare model A vs B’, ‘build a rubric for prompt outputs’, or needs reliable judge/eval pipelines beyond ad-hoc spot checks."
risk: safe
source: community
date_added: "2026-02-27"
---

# Advanced Evaluation

Design and implement evaluation frameworks for LLM outputs and agent behavior using statistically rigorous methods.

## When to Use

- Evaluating AI-generated test code quality
- Comparing multiple agent approaches
- Building automated quality gates for AI outputs
- Measuring regression in agent capabilities
- Assessing prompt engineering changes

## Core Concepts

### The Evaluation Taxonomy

| Type | Best For | Limitation |
|------|----------|-----------|
| **Direct Scoring** | Absolute quality assessment | Calibration drift |
| **Pairwise Comparison** | Relative ranking | Position bias |
| **Rubric Generation** | Consistent multi-criteria | Rubric design hard |
| **Reference-based** | Factual accuracy | Needs ground truth |

### Metric Selection Framework

1. **Is correctness binary?** → Use pass/fail with test cases
2. **Is quality subjective?** → Use pairwise comparison with multiple judges
3. **Do you need reproducibility?** → Use rubric-based scoring
4. **Do you need speed?** → Use direct scoring with anchor examples

## Evaluation Approaches

### Direct Scoring Implementation

```typescript
interface EvaluationCriteria {
  dimension: string;
  weight: number;      // 0-1, must sum to 1
  rubric: string;
}

interface EvaluationResult {
  score: number;       // 0-1 overall
  breakdown: Record<string, number>;
  reasoning: string;
  confidence: 'low' | 'medium' | 'high';
}

const testCodeCriteria: EvaluationCriteria[] = [
  { dimension: 'correctness', weight: 0.4, rubric: 'Does the test actually test what it says?' },
  { dimension: 'isolation', weight: 0.3, rubric: 'Is the test independent of other tests?' },
  { dimension: 'readability', weight: 0.2, rubric: 'Can a new developer understand this test?' },
  { dimension: 'coverage', weight: 0.1, rubric: 'Does it cover edge cases?' },
];
```

### Pairwise Comparison Implementation

```typescript
// Run each comparison with position swapped to detect bias
async function pairwiseCompare(
  outputA: string,
  outputB: string,
  criteria: string
): Promise<{ winner: 'A' | 'B' | 'tie'; confidence: number }> {
  const result1 = await judge(outputA, outputB, criteria);
  const result2 = await judge(outputB, outputA, criteria); // Swap order
  
  // Check for position bias
  if (result1.winner === 'A' && result2.winner === 'B') {
    return { winner: 'A', confidence: 0.9 }; // Consistent
  }
  if (result1.winner === 'B' && result2.winner === 'A') {
    return { winner: 'tie', confidence: 0.5 }; // Position bias
  }
  return { winner: 'tie', confidence: 0.7 };
}
```

### Rubric Generation

```typescript
// Generate evaluation rubric from examples
interface RubricDimension {
  name: string;
  excellent: string;   // 5/5 example
  acceptable: string;  // 3/5 example
  poor: string;        // 1/5 example
}

const testQualityRubric: RubricDimension[] = [
  {
    name: 'Test Isolation',
    excellent: 'Each test has its own setup, no shared mutable state',
    acceptable: 'Tests mostly independent but share some fixtures',
    poor: 'Tests depend on execution order or shared database state',
  },
];
```

## Practical Guidance

### Evaluation Pipeline Design

```
Input → Sampling → Evaluation → Aggregation → Decision
         (n>=30)   (multi-judge)  (statistics)  (threshold)
```

### Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|-------------|---------|---------|
| Single-run evaluation | High variance | Run 5-10 times, use median |
| String matching | Misses semantics | Use embedding similarity |
| Only happy path | Misses edge cases | Include adversarial inputs |
| Single judge | Bias | Use 3+ independent evaluations |

### Statistical Significance

```typescript
// Don't declare improvement without statistical test
function isSignificantImprovement(
  baseline: number[],
  experiment: number[],
  alpha = 0.05
): boolean {
  // Minimum effect size of 5% + p < 0.05
  const baselineMean = mean(baseline);
  const experimentMean = mean(experiment);
  const effectSize = (experimentMean - baselineMean) / baselineMean;
  return effectSize > 0.05 && tTest(baseline, experiment) < alpha;
}
```

## Integration

Use this skill when:
- Comparing different prompt strategies for test generation
- Evaluating AI-generated test quality before merging
- Building automated quality gates in CI/CD
- Measuring agent performance over time
