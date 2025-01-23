# LLM Service Configuration Guide

## Docker Compose Setup

The LLM service uses its own docker-compose.yml file located in `services/llm-service/` instead of being part of the root docker-compose.yml. This allows for independent scaling and configuration.

```bash
# Start the LLM service stack
cd services/llm-service
docker-compose up -d
```

The service exposes:
- API on port 3003
- Metrics on port 9464
- WebSocket on port 3004
- Redis Commander UI on port 8081

## Environment Variables

### Core Configuration
```env
NODE_ENV=development|test|production
PORT=3003  # Changed from default 3000 to avoid conflicts
```

### CORS Configuration
```env
CORS_ORIGIN=*  # Allow all origins, or specify domain
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Accept,Authorization,Last-Event-ID
CORS_EXPOSED_HEADERS=Content-Type,Last-Event-ID
CORS_CREDENTIALS=true
```

### OpenRouter Configuration
```env
OPENROUTER_API_KEY=your-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
SITE_URL=http://your-site.com
SITE_NAME=Your Site Name
DEFAULT_MODEL=deepseek/deepseek-r1
```

### Redis Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_CACHE_TTL=3600
CACHE_ENABLED=true
```

### Provider Settings
```env
DEFAULT_LLM_PROVIDER=openrouter
MAX_RETRIES=3
REQUEST_TIMEOUT=30000
```

### Streaming Configuration
```env
STREAM_CHUNK_SIZE=1024  # Size of streaming chunks in bytes
STREAM_RETRY_ATTEMPTS=3  # Number of retry attempts for failed streams
STRUCTURED_OUTPUT_ENABLED=true  # Enable JSON schema validation for structured output
```

## Test Environment Configuration

### Docker Compose Test Setup

The test environment uses Docker Compose to run integration tests with mock services:

```yaml
services:
  # Test service container
  llm-service-test:
    build:
      context: .
      target: builder
    environment:
      - NODE_ENV=test
      - REDIS_HOST=redis-test
      - OPENROUTER_BASE_URL=http://mock-openrouter:3000/api/v1
      - OPENROUTER_API_KEY=test-key

  # Mock OpenRouter API
  mock-openrouter:
    build:
      context: ./test/mock-openrouter
    ports:
      - "3001:3000"

  # Redis test instance
  redis-test:
    image: redis:7-alpine
    command: redis-server --appendonly no --save ""
```

### Mock OpenRouter API

The test environment includes a mock OpenRouter API that simulates:
- Success responses
- Rate limiting (10 requests per minute)
- Context length errors (>8192 tokens)
- Timeouts
- Authentication errors
- Streaming responses
- Structured output responses

### Test Environment Variables (.env.test)
```env
NODE_ENV=test
REDIS_HOST=redis-test
REDIS_PORT=6379
REDIS_DB=1
OPENROUTER_API_KEY=test-key
SITE_URL=http://localhost:3000
SITE_NAME=VAIM2 Test
OPENROUTER_BASE_URL=http://mock-openrouter:3000/api/v1
```

## Provider Configuration

### OpenRouter Direct Provider

The OpenRouter direct provider uses axios to communicate with the OpenRouter API:

```typescript
{
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
  maxRetries?: number;
  timeout?: number;
  structuredOutput?: boolean;
}
```

### OpenRouter OpenAI Provider

The OpenRouter OpenAI provider uses the OpenAI SDK configured for OpenRouter:

```typescript
{
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
  maxRetries?: number;
  timeout?: number;
  structuredOutput?: boolean;
}
```

## Caching Configuration

### Redis Cache Settings
- TTL: Configurable via `REDIS_CACHE_TTL` (default: 3600 seconds)
- Cache key format: `llm:{hash of request parameters}`
- Cache bypass: Set `CACHE_ENABLED=false`

### Cache Key Generation
Cache keys are generated based on:
- Messages content and role
- Model selection
- Temperature
- Max tokens
- Top P
- Frequency penalty
- Presence penalty
- Stop sequences
- Structured output schema (if enabled)

## Testing

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Retry Strategy
The service implements test-level retries for E2E tests that interact with external services to handle flaky tests caused by network conditions or rate limiting:

- Tests with external API calls use `jest.retryTimes(3)`
- Retried tests include:
  - LLM completion endpoints
  - Streaming completion endpoints
  - GraphQL completion queries
  - Structured output validation
- Deterministic tests (e.g., rate limiting, caching) do not use retries

### Test Coverage Requirements
- Unit test coverage: >90%
- Integration test coverage: >80%
- E2E test coverage: >70%

### Performance Metrics
- Response time: <200ms (p95)
- Cache hit rate: >80%
- Error rate: <1%

## Error Handling

### Retry Strategy
- Maximum retries: Configurable via `MAX_RETRIES`
- Exponential backoff: `Math.pow(2, retryCount) * 1000ms`
- Retryable errors:
  - Network timeouts
  - Rate limiting
  - 5xx server errors
  - SSE connection failures

### Error Types
- `PROVIDER_ERROR`: Provider-specific errors
- `RATE_LIMIT`: Rate limit exceeded
- `CONTEXT_LENGTH`: Maximum context length exceeded
- `TIMEOUT`: Request timeout
- `MODEL_NOT_FOUND`: Model not available
- `INVALID_REQUEST`: Invalid parameters
- `SCHEMA_VALIDATION`: Structured output validation error
- `SSE_ERROR`: Server-sent events error
- `UNKNOWN`: Unexpected errors

## Monitoring

### Health Checks
- Provider health: API accessibility
- Redis health: Connection status
- Overall service health: Combined status
- SSE connection health: Stream stability

### Metrics
- Request latency
- Cache hit rate
- Error rate
- Token usage
- Provider availability
- Stream connection stability
- Structured output validation success rate