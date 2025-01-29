# LLM Service Testing Guide

## Overview

This document outlines the testing strategy and implementation for the LLM service, with a particular focus on provider testing, error handling, and streaming capabilities.

## Test Structure

### Provider Tests

Provider tests are located in `src/providers/implementations/__tests__/` and follow this structure:

```typescript
describe('Provider', () => {
  describe('initialize', () => {
    // Initialization tests
    // Error handling tests
  });

  describe('complete', () => {
    // Basic completion tests
    // Error handling tests
    // Retry mechanism tests
  });

  describe('completeStream', () => {
    // Streaming functionality tests
    // Stream error handling
    // Buffer management tests
  });

  describe('healthCheck', () => {
    // Health check tests
    // Error condition tests
  });
});
```

### Error Handling Tests

Each provider must include comprehensive error handling tests:

```typescript
it('should handle rate limiting', async () => {
  // Mock rate limit response
  mockAxiosInstance.post.mockRejectedValueOnce({
    isAxiosError: true,
    response: {
      status: 429,
      data: { error: { message: 'Rate limit exceeded' } },
    },
  });

  await expect(provider.complete(mockMessages)).rejects.toThrow(
    expect.objectContaining({
      type: LLMErrorType.RATE_LIMIT,
      message: 'Rate limit exceeded',
      provider: 'provider-name',
    })
  );
});
```

### Streaming Tests

Streaming functionality tests cover:

```typescript
it('should handle streaming responses', async () => {
  const mockStream = createMockStream([
    'data: {"choices":[{"delta":{"content":"1"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"2"}}]}\n\n',
  ]);

  mockAxiosInstance.post.mockResolvedValueOnce({ data: mockStream });

  const stream = await provider.completeStream(mockMessages);
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
    expect(chunk).toMatchObject({
      text: expect.any(String),
      metadata: expect.any(Object),
    });
  }
});

// New: Test for structured output streaming
it('should handle structured output streaming', async () => {
  const mockStream = createMockStream([
    'data: {"choices":[{"delta":{"content":"{\\\"location\\":\\"San"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":" Francisco\\",\\"temperature\\":22"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":",\\"conditions\\":\\"sunny\\"}"}}]}\n\n',
  ]);

  mockAxiosInstance.post.mockResolvedValueOnce({ data: mockStream });

  const stream = await provider.completeStream(mockMessages, {
    responseFormat: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          temperature: { type: 'number' },
          conditions: { type: 'string' },
        },
      },
    },
  });

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  // Combine chunks and parse final JSON
  const finalJson = JSON.parse(chunks.map(c => c.text).join(''));
  expect(finalJson).toMatchObject({
    location: 'San Francisco',
    temperature: 22,
    conditions: 'sunny',
  });
});

// New: Test for CORS and EventSource compatibility
it('should handle EventSource connections with CORS', async () => {
  const mockEventSource = new EventSource('/api/v1/llm/complete/stream');
  
  expect(mockEventSource.withCredentials).toBe(false);
  expect(mockEventSource.readyState).toBe(EventSource.CONNECTING);
  
  // Verify CORS headers
  const headers = mockAxiosInstance.defaults.headers;
  expect(headers['Access-Control-Allow-Origin']).toBe('*');
  expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
  expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
  expect(headers['Access-Control-Allow-Headers']).toContain('Last-Event-ID');
});
```

## Test Categories

### Unit Tests

Unit tests cover individual components:
- Provider implementations
- Service layer
- Controllers
- Guards
- Utilities

### Integration Tests

Integration tests verify component interactions:
- Provider with service layer
- Service with cache
- Rate limiting integration
- Error propagation

### E2E Tests

End-to-end tests validate complete flows:
- API endpoints
- Streaming endpoints
- Error handling
- Rate limiting
- Authentication

## Mock Implementations

### Mock Providers

```typescript
const mockProvider: LLMProvider = {
  initialize: jest.fn(),
  complete: jest.fn(),
  completeStream: jest.fn(),
  healthCheck: jest.fn(),
};
```

### Mock Streams

```typescript
const createMockStream = (chunks: string[]) => ({
  [Symbol.asyncIterator]: () => ({
    next: async () => {
      if (chunks.length > 0) {
        return { done: false, value: Buffer.from(chunks.shift()!) };
      }
      return { done: true, value: undefined };
    },
  }),
});
```

## Test Utilities

### Error Testing

```typescript
export const expectLLMError = async (
  promise: Promise<any>,
  type: LLMErrorType,
  message: string,
  provider: string
) => {
  await expect(promise).rejects.toThrow(
    expect.objectContaining({
      type,
      message,
      provider,
    })
  );
};
```

### Response Matchers

```typescript
export const matchLLMResponse = {
  text: expect.any(String),
  usage: {
    promptTokens: expect.any(Number),
    completionTokens: expect.any(Number),
    totalTokens: expect.any(Number),
  },
  metadata: {
    provider: expect.any(String),
    model: expect.any(String),
    latency: expect.any(Number),
  },
};
```

## Test Coverage

Required coverage thresholds:
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
};
```

Current coverage areas:
- Provider implementations
- Error handling
- Streaming functionality
  - Basic streaming ✅
  - Structured output streaming ✅
  - CORS and EventSource compatibility ✅
- Rate limiting
- Cache integration
- Service layer
- API endpoints

## Running Tests

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## Best Practices

1. Error Testing
   - Test all error types
   - Verify error messages
   - Check error propagation
   - Test retry mechanisms

2. Streaming Tests
   - Test chunk processing
   - Verify error handling
   - Test buffer management
   - Check metadata consistency
   - Test structured output parsing
   - Verify CORS headers
   - Test EventSource compatibility

3. Mock Implementation
   - Use realistic mock data
   - Simulate network conditions
   - Test edge cases
   - Mock external services

4. Test Organization
   - Group related tests
   - Use descriptive names
   - Maintain test isolation
   - Clean up after tests

5. Coverage
   - Maintain high coverage
   - Focus on critical paths
   - Test edge cases
   - Document uncovered scenarios

## Continuous Integration

Tests are run in CI/CD pipeline:
- On pull requests
- Before deployments
- Nightly builds
- Coverage reports

## Debugging Tests

Tips for debugging test failures:
- Use verbose output: `npm test -- --verbose`
- Debug specific tests: `npm test -- -t "test name"`
- Check mock implementations
- Verify test isolation