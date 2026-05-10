---
name: data-quality-frameworks
description: "Implements data-quality validation with Great Expectations, dbt tests, and data contracts so pipelines fail loudly on bad data instead of silently corrupting downstream systems. Use when the user asks to ‘add data-quality checks’, ‘write expectations for this dataset’, ‘set up a data contract between teams’, or is building a new pipeline that needs trustworthy outputs."
risk: unknown
source: community
date_added: "2026-02-27"
---

# Data Quality Frameworks

Production patterns for implementing data quality to ensure reliable data pipelines and API response validation.

## Use this skill when

- Implementing data quality checks in pipelines
- Validating API response schema correctness
- Building comprehensive test suites for data shapes
- Establishing data contracts between teams
- Monitoring data quality metrics
- Automating data validation in CI/CD

## Instructions

- Identify critical datasets and quality dimensions.
- Define expectations/tests and contract rules.
- Automate validation in CI/CD and schedule checks.
- Set alerting, ownership, and remediation steps.

## API Response Validation (Zod — TypeScript)

```typescript
import { z } from 'zod';

// Define the contract
const DiscountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  discount_type: z.enum(['PERCENTAGE', 'FIXED']),
  discount_value: z.number().min(0).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ENDED']),
  seller_sku: z.string().nullable(),  // Can be null or string
  created_at: z.string().datetime(),
});

// Validate in tests
it('should return valid discount schema', async () => {
  const response = await api.getDiscount(discountId);
  const result = DiscountSchema.safeParse(response.data);
  
  if (!result.success) {
    console.error('Schema violations:', result.error.issues);
  }
  expect(result.success).toBe(true);
});
```

## Data Contract Pattern

```typescript
// contracts/discount.contract.ts
export const DiscountContract = {
  version: '1.0.0',
  schema: DiscountSchema,
  
  // Business rules
  rules: [
    {
      name: 'discount_value_range_by_type',
      validate: (discount: Discount) => {
        if (discount.discount_type === 'PERCENTAGE') {
          return discount.discount_value <= 100;
        }
        return discount.discount_value > 0;
      },
      message: 'Percentage discount must be 0-100, fixed must be > 0',
    },
  ],
};
```

## Quality Dimensions

| Dimension | What to Check |
|---|---|
| **Completeness** | Required fields are not null/undefined |
| **Correctness** | Values match enum/range constraints |
| **Consistency** | Cross-field rules (e.g., end_date > start_date) |
| **Timeliness** | Timestamps are recent/valid |
| **Uniqueness** | IDs are unique across responses |

## CI/CD Integration

```typescript
// Run schema validation as part of test suite
describe('API Contract: Discount', () => {
  it('GET /discounts/:id matches DiscountSchema', async () => {
    const { data } = await discountApi.getDetail(testDiscountId);
    expect(() => DiscountSchema.parse(data)).not.toThrow();
  });
  
  it('POST /discounts response matches DiscountSchema', async () => {
    const { data } = await discountApi.create(validPayload);
    expect(() => DiscountSchema.parse(data)).not.toThrow();
  });
});
```
