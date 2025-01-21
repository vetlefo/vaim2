# Testing Documentation

## Overview
This document outlines the testing strategy and setup for the Graph Analytics Service.

## Test Setup

### Rate Limit Testing
The rate limit tests use a dedicated setup file (`test/rate-limit-setup.ts`) that provides mocked services. This approach allows for:
- Isolated testing of rate limiting logic
- No dependency on actual Redis or Neo4j connections
- Faster test execution
- More reliable test results

Example of mocked rate limit setup:
```typescript
const moduleFixture = await Test.createTestingModule({
  providers: [
    RateLimitGuard,
    {
      provide: RateLimitService,
      useValue: {
        isRateLimited: jest.fn(),
        getRemainingRequests: jest.fn(),
      },
    },
  ],
}).compile();
```

### Jest Configuration
The Jest configuration (`jest.config.js`) is set up to:
- Use the appropriate test setup files
- Run tests in a Node.js environment
- Support TypeScript through ts-jest
- Enable proper module path mapping

## Running Tests
To run specific tests:
```bash
npm test src/path/to/test.spec.ts
```

To run all tests:
```bash
npm test
```

## Best Practices
1. Use dedicated setup files for different test suites when they require different mocked services
2. Clear mocks between tests using `jest.clearAllMocks()`
3. Mock external services (Redis, Neo4j) to avoid test flakiness
4. Use proper type definitions for mocked services
5. Include both success and failure test cases

## Recent Improvements
- Added dedicated rate limit test setup
- Improved test isolation by removing dependencies on external services
- Fixed issues with @golevelup/ts-jest integration
- Enhanced Jest configuration for better test file organization