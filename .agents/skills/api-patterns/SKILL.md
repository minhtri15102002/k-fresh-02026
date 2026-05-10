---
name: api-patterns
description: "Picks an API style (REST vs GraphQL vs tRPC), response format, versioning policy, and pagination strategy for a new or existing service. Use when the user asks ‘how should I design this API?’, ‘REST or GraphQL for X?’, ‘how do I version this endpoint?’, or wants principled trade-off guidance instead of cargo-culted patterns."
risk: unknown
source: community
date_added: "2026-02-27"
---

# API Patterns

> API design principles and decision-making for 2025.
> **Learn to THINK, not copy fixed patterns.**

## Content Map

| Topic | When to Use |
|-------|-------------|
| REST patterns | Designing resource endpoints |
| Response formats | Structuring API responses |
| Authentication | JWT, OAuth, API Keys |
| Pagination | List endpoints |
| Versioning | API evolution |
| Rate limiting | Protection |
| Error handling | Error response shapes |
| Status codes | HTTP semantics |

## REST Best Practices

```
# Resources (nouns, not verbs)
GET    /discounts              → list
POST   /discounts              → create
GET    /discounts/:id          → get one
PUT    /discounts/:id          → full update
PATCH  /discounts/:id          → partial update
DELETE /discounts/:id          → delete

# Nested resources
GET  /sellers/:id/discounts    → seller's discounts
POST /sellers/:id/discounts    → create for seller

# Actions (when REST doesn't fit)
POST /discounts/:id/end        → end a discount
POST /discounts/:id/activate   → activate
```

## Standard Response Envelope

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "DISCOUNT_ALREADY_ENDED",
    "message": "Cannot modify a discount that has already ended",
    "details": [
      { "field": "end_date", "message": "end_date is in the past" }
    ]
  }
}
```

## HTTP Status Codes

| Code | Use When |
|------|----------|
| `200` | Successful GET, PUT, PATCH |
| `201` | Successful POST (created) |
| `204` | Successful DELETE (no body) |
| `400` | Invalid request body/params |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (duplicate, state mismatch) |
| `422` | Validation errors |
| `429` | Rate limit exceeded |
| `500` | Server error |

## Pagination Patterns

```typescript
// Cursor-based (preferred for large datasets)
GET /discounts?cursor=eyJpZCI6IjEyMyJ9&limit=20

// Offset-based (simpler, for small datasets)
GET /discounts?page=2&per_page=20

// Response
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6IjE0MyJ9",
    "has_more": true,
    "total": 150
  }
}
```

## Authentication

```typescript
// Bearer token (most common)
Authorization: Bearer <jwt_token>

// API Key
X-API-Key: <api_key>
```

## Decision Checklist

Before designing an API:
- [ ] Asked about API consumers?
- [ ] Chosen API style for THIS context? (REST/GraphQL/tRPC)
- [ ] Defined consistent response format?
- [ ] Planned versioning strategy?
- [ ] Considered authentication needs?
- [ ] Planned rate limiting?
- [ ] Documentation approach defined?

## Anti-Patterns

**DON'T:**
- Use verbs in REST endpoints (`/getDiscounts`, `/createDiscount`)
- Return inconsistent response formats across endpoints
- Expose internal error details (stack traces) to clients
- Use `200` for errors
- Use `DELETE` with a request body

**DO:**
- Use plural nouns for collections (`/discounts`, `/products`)
- Use sub-resources for relationships
- Return consistent error envelopes
- Document all possible error codes
