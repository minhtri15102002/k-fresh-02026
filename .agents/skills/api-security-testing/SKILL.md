---
name: api-security-testing
description: "Audits REST and GraphQL APIs for authentication, authorization, rate-limiting, input-validation, and OWASP-API-Top-10 weaknesses. Use when the user asks to ‘security-test this endpoint’, ‘check for IDOR/auth bypass’, ‘fuzz the API for injection’, or before shipping a new public API."
category: granular-workflow-bundle
risk: safe
source: personal
date_added: "2026-02-27"
---

# API Security Testing Workflow

## Overview

Specialized workflow for testing REST and GraphQL API security including authentication, authorization, rate limiting, input validation, and API-specific vulnerabilities.

## When to Use This Workflow

Use this workflow when:
- Testing REST API security
- Assessing GraphQL endpoints
- Validating API authentication
- Testing API rate limiting
- Bug bounty API testing

## Workflow Phases

### Phase 1: API Discovery
1. Enumerate endpoints
2. Document API methods
3. Identify parameters
4. Map data flows
5. Review documentation

### Phase 2: Authentication Testing
1. Test API key validation
2. Test JWT tokens
3. Test OAuth2 flows
4. Test token expiration
5. Test refresh tokens

### Phase 3: Authorization Testing
1. Test object-level authorization
2. Test function-level authorization
3. Test role-based access
4. Test privilege escalation
5. Test multi-tenant isolation

### Phase 4: Input Validation
1. Test parameter validation
2. Test SQL injection
3. Test NoSQL injection
4. Test command injection
5. Test XXE injection

### Phase 5: Rate Limiting
1. Test rate limit headers
2. Test brute force protection
3. Test resource exhaustion
4. Test bypass techniques

### Phase 6: GraphQL Testing
1. Test introspection
2. Test query depth
3. Test query complexity
4. Test batch queries

### Phase 7: Error Handling
1. Test error messages
2. Check information disclosure
3. Test stack traces
4. Verify logging

## API Security Checklist

- [ ] Authentication working
- [ ] Authorization enforced
- [ ] Input validated
- [ ] Rate limiting active
- [ ] Errors sanitized
- [ ] Logging enabled
- [ ] CORS configured
- [ ] HTTPS enforced

## Quality Gates

- [ ] All endpoints tested
- [ ] Vulnerabilities documented
- [ ] Remediation provided
- [ ] Report generated
