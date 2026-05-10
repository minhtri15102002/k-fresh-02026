---
name: javascript-testing-patterns
description: "Documents robust testing strategies for JavaScript/TypeScript applications using modern frameworks (Jest, Vitest, Playwright, Testing Library) and best practices around unit, integration, and component tests. Use when the user asks ‘how should I test this React/Node module?’, ‘what’s the right pattern for mocking X?’, or wants principled guidance on coverage and structure rather than just snippets."
risk: safe
source: community
date_added: "2026-02-27"
---

# JavaScript Testing Patterns

Comprehensive guide for implementing robust testing strategies in JavaScript/TypeScript applications using modern testing frameworks and best practices.

## Use this skill when

- Setting up test infrastructure for new projects
- Writing unit tests for functions and classes
- Creating integration tests for APIs and services
- Implementing end-to-end tests for user flows
- Mocking external dependencies and APIs
- Testing React, Vue, or other frontend components
- Implementing test-driven development (TDD)
- Setting up continuous testing in CI/CD pipelines

## Do not use this skill when

- The task is unrelated to javascript testing patterns
- You need a different domain or tool outside this scope

## Instructions

- Clarify goals, constraints, and required inputs.
- Apply relevant best practices and validate outcomes.
- Provide actionable steps and verification.

## Key Patterns

### Unit Testing (Jest/Vitest)
```typescript
describe('MyService', () => {
  it('should return expected result', () => {
    const result = myFunction(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

### API Integration Testing
```typescript
describe('POST /api/resource', () => {
  it('should create resource and return 201', async () => {
    const response = await request(app)
      .post('/api/resource')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: expect.any(String) });
  });
});
```

### Mocking
```typescript
jest.mock('../services/myService');
const mockedService = jest.mocked(myService);
mockedService.fetchData.mockResolvedValue(mockData);
```

### Test Data Factories
```typescript
const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  ...overrides,
});
```

### Async Testing
```typescript
it('should handle async operations', async () => {
  await expect(asyncOperation()).resolves.toBe('expected');
  await expect(failingOperation()).rejects.toThrow('error message');
});
```

## Resources

- Playbook: Detailed patterns and examples in `resources/implementation-playbook.md`
