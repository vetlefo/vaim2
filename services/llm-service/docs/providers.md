# LLM Service Provider Documentation

## OpenRouter Integration

The LLM Service implements two different approaches for OpenRouter integration:
1. Direct API integration using axios
2. OpenAI SDK integration with Parameters API support

### OpenRouter OpenAI Provider

The OpenAI SDK provider uses the official OpenAI SDK configured for OpenRouter, enhanced with dynamic parameter optimization through the OpenRouter Parameters API.

#### Features
- OpenAI SDK integration
- Automatic parameter optimization via Parameters API
- Dynamic model-specific parameter fetching
- Parameter caching for performance
- Type-safe requests
- Built-in error handling
- Streaming support
- Request timeout handling
- Default DeepSeek-R1 model support
- Support for Claude-3.5-Sonnet through OpenRouter

#### Implementation

```typescript
interface ModelParameters {
  model: string;
  supported_parameters: string[];
  temperature_p50: number;
  top_p_p50: number;
  frequency_penalty_p50: number;
  presence_penalty_p50: number;
  top_k_p50?: number;
  min_p_p50?: number;
  repetition_penalty_p50?: number;
  top_a_p50?: number;
}

class OpenRouterOpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private readonly defaultModel: string;
  private modelParameters: Map<string, ModelParameters>;

  constructor(config: OpenRouterConfig) {
    this.defaultModel = config.defaultModel || 'deepseek/deepseek-r1';
    // Initialize with OpenAI SDK configuration
  }

  private async fetchModelParameters(modelId: string): Promise<ModelParameters>;
  private async getOptimalParameters(modelId: string): Promise<Partial<LLMRequestOptions>>;
  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  async completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
}
```

#### Available Models
- `deepseek/deepseek-r1` (default)
- `anthropic/claude-3.5-sonnet`

#### Parameter Optimization
The provider automatically fetches and uses optimal parameters for each model through the OpenRouter Parameters API:

```typescript
GET /api/v1/parameters/{author}/{modelSlug}
```

Response includes:
- Supported parameters for the model
- Optimal parameter values based on usage statistics
- Model-specific parameter ranges and defaults

#### Error Handling
- APIError handling
- Rate limit detection
- Context length validation
- Model availability checks
- Timeout handling
- Network error handling

### DeepSeek Integration

The DeepSeek provider implements type-safe integration with DeepSeek's API.

#### Features
- Type-safe message handling
- Custom parameter support
- Reasoning content handling
- Automatic parameter validation
- Default parameter values
- Error handling with retries

#### Implementation

```typescript
interface DeepseekMessage extends OpenAI.ChatCompletionMessageParam {
  reasoning_content?: string;
}

interface DeepseekParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
}

class DeepseekService {
  private readonly client: OpenAI;
  private readonly defaultParameters: DeepseekParameters;

  constructor(config: ConfigService) {
    // Initialize with configuration
  }

  async createChatCompletion(
    messages: Array<DeepseekMessage>,
    parameters?: Partial<DeepseekParameters>
  ): Promise<LLMResponse>;
}
```

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

app.get('/api/v1/parameters/:author/:modelSlug', (req, res) => {
  // Handle parameter queries
});
```

#### Features
- Rate limiting simulation (10 requests/minute)
- Context length validation (8192 tokens)
- Configurable timeouts
- Authentication validation
- Streaming response simulation
- Error scenario simulation
- Parameter API simulation

### Test Cases

#### Provider Tests
```typescript
describe('OpenRouterProvider', () => {
  // Parameter API tests
  it('should fetch model parameters successfully');
  it('should cache model parameters');
  it('should handle parameter API errors');
  it('should use optimal parameters');

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

## Provider Configuration

### OpenRouter Configuration
```typescript
interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string; // Defaults to 'deepseek/deepseek-r1'
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
  maxRetries?: number;
  timeout?: number;
}
```

### DeepSeek Configuration
```typescript
interface DeepseekParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
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

### Parameter Optimization
- Automatic fetching of optimal parameters
- Parameter caching with TTL
- Model-specific defaults
- Dynamic parameter updates
- Fallback strategies

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
- Parameter caching
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
- Parameter API status

### Metrics
- Request latency
- Token usage
- Error rates
- Cache hit rates
- Provider availability
- Parameter optimization effectiveness