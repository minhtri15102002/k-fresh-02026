---
name: openapi-spec-generation
description: "Generates and maintains OpenAPI 3.1 specifications from code, design-first specs, and validation patterns. Use when the user asks to ‘write an OpenAPI spec for X’, ‘generate SDKs from our API’, ‘keep code and spec in sync’, or needs contract compliance enforced in CI."
risk: safe
source: community
date_added: "2026-02-27"
---

# OpenAPI Spec Generation

Comprehensive patterns for creating, maintaining, and validating OpenAPI 3.1 specifications for RESTful APIs.

## Use this skill when

- Creating API documentation from scratch
- Generating OpenAPI specs from existing code
- Designing API contracts (design-first approach)
- Validating API implementations against specs
- Generating client SDKs from specs
- Setting up API documentation portals

## Instructions

- Clarify goals, constraints, and required inputs.
- Apply relevant best practices and validate outcomes.
- Provide actionable steps and verification.

## OpenAPI 3.1 Template

```yaml
openapi: 3.1.0
info:
  title: Seller Platform API
  version: 1.0.0
  description: API for seller platform operations

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://predev.api.example.com/v1
    description: Pre-dev

paths:
  /discounts:
    post:
      summary: Create a discount
      operationId: createDiscount
      tags: [Discounts]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDiscountRequest'
      responses:
        '201':
          description: Discount created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DiscountResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    CreateDiscountRequest:
      type: object
      required: [name, discount_type, discount_value]
      properties:
        name:
          type: string
          maxLength: 100
        discount_type:
          type: string
          enum: [PERCENTAGE, FIXED]
        discount_value:
          type: number
          minimum: 0

  responses:
    BadRequest:
      description: Invalid request parameters
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    Unauthorized:
      description: Authentication required

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

## Generate from TypeScript Code

Use `tsoa` or `swagger-jsdoc` to auto-generate from TypeScript interfaces:

```typescript
/**
 * @swagger
 * /discounts:
 *   post:
 *     summary: Create discount
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDiscountRequest'
 */
```

## Validate Spec Against Implementation

```bash
npx @redocly/cli lint openapi.yaml
npx @redocly/cli bundle openapi.yaml -o dist/openapi.json
```

## Key Rules

- Use `$ref` for all reusable schemas — avoid inline repetition
- Document all error responses (400, 401, 403, 404, 422, 500)
- Include examples in every schema definition
- Use `operationId` consistently for SDK generation
