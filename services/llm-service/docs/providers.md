# LLM Service Provider Documentation

## OpenRouter Integration

The LLM Service implements two different approaches for OpenRouter integration:
1. Direct API integration using axios
2. OpenAI SDK integration

### OpenRouter Direct Provider

The direct provider implementation uses axios to communicate directly with the OpenRouter API.

#### Features
- Direct HTTP requests to OpenRouter API
- Custom error handling and mapping
- Built-in retry mechanism
- Streaming support
- Request timeout handling
- Rate limit handling

#### Implementation

```typescript
class OpenRouterProvider implements LLMProvider {
  private client: AxiosInstance;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(config: OpenRouterConfig) {
    // Initialize with configuration
  }

  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  async completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
  async healthCheck(): Promise<boolean>;
}
```

#### Error Handling
- Authentication errors (401)
- Rate limiting (429)
- Context length exceeded (400)
- Model not found (404)
- Timeouts (408)
- Network errors
- Unexpected errors

### OpenRouter OpenAI Provider

The OpenAI SDK provider uses the official OpenAI SDK configured for OpenRouter.

#### Features
- OpenAI SDK integration
- Automatic retries
- Type-safe requests
- Built-in error handling
- Streaming support
- Request timeout handling

#### Implementation

```typescript
class OpenRouterOpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(config: OpenRouterConfig) {
    // Initialize with OpenAI SDK configuration
  }

  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  async completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
  async healthCheck(): Promise<boolean>;
}
```

#### Error Handling
- APIError handling
- Rate limit detection
- Context length validation
- Model availability checks
- Timeout handling
- Network error handling

## Testing Infrastructure

### Mock OpenRouter API

The test environment includes a mock OpenRouter API that simulates various scenarios:

```typescript
// Mock API endpoints
app.post('/api/v1/chat/completions', (req, res) => {
  // Handle completion requests
});

app.get('/api/v1/models', (req, res) => {
  // Handle model listing
});
```

#### Features
- Rate limiting simulation (10 requests/minute)
- Context length validation (8192 tokens)
- Configurable timeouts
- Authentication validation
- Streaming response simulation
- Error scenario simulation

### Test Cases

#### Provider Tests
```typescript
describe('OpenRouterProvider', () => {
  // Initialization tests
  it('should initialize successfully');
  it('should handle initialization failure');

  // Completion tests
  it('should complete messages successfully');
  it('should handle context length errors');
  it('should handle rate limiting');
  it('should handle timeouts');
  it('should handle invalid API key');
  it('should retry on failure');

  // Streaming tests
  it('should handle streaming responses');
  it('should handle streaming errors');
  it('should handle streaming timeouts');

  // Health check tests
  it('should return true when API is accessible');
  it('should return false when API is inaccessible');
});
```

### Integration Testing

#### Docker Compose Setup
```yaml
services:
  mock-openrouter:
    build:
      context: ./test/mock-openrouter
    ports:
      - "3001:3000"
    networks:
      - llm-test-network
```

#### Test Environment Variables
```env
OPENROUTER_API_KEY=test-key
OPENROUTER_BASE_URL=http://mock-openrouter:3000/api/v1
```

## Provider Configuration

### Direct Provider Configuration
```typescript
interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
  maxRetries?: number;
  timeout?: number;
}
```

### OpenAI SDK Configuration
```typescript
{
  baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
  apiKey: config.apiKey,
  defaultHeaders: {
    'HTTP-Referer': config.siteUrl || '',
    'X-Title': config.siteName || '',
  },
  defaultQuery: {
    timeout: config.timeout.toString(),
  },
  maxRetries: config.maxRetries,
}
```

## Error Mapping

### Provider-Specific Errors
```typescript
enum LLMErrorType {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH',
  TIMEOUT = 'TIMEOUT',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN = 'UNKNOWN',
}
```

### Error Handling Strategy
1. Attempt to identify specific error type
2. Map to standardized LLMError
3. Include original error details
4. Apply retry strategy if applicable
5. Propagate error with context

## Performance Considerations

### Retry Strategy
- Maximum retries configurable
- Exponential backoff
- Specific error types for retries
- Timeout handling

### Rate Limiting
- Per-provider rate limits
- Global rate limiting
- Burst handling
- Queue management

### Caching
- Response caching
- Cache key generation
- TTL management
- Cache invalidation

## Monitoring

### Health Checks
- Provider availability
- API response time
- Error rates
- Rate limit status

### Metrics
- Request latency
- Token usage
- Error rates
- Cache hit rates
- Provider availability