# LLM Service Providers Guide

This document outlines the available LLM providers and their implementation details.

## Available Providers

### OpenRouter Provider

The OpenRouter provider is our primary interface to multiple LLM models through OpenRouter's API. It provides a unified way to access various models including DeepSeek, Claude, GPT-4, and others.

#### Features
- Unified model access through OpenRouter's API
- Robust error handling and retry mechanism
- Streaming support for real-time responses
- Automatic parameter optimization per model
- Connection pooling and timeout handling
- Comprehensive test coverage

#### Configuration
```typescript
interface OpenRouterConfig {
  apiKey: string;                // OpenRouter API key
  defaultModel: string;          // Default model (e.g., 'deepseek/deepseek-r1')
  baseUrl?: string;             // Optional custom API endpoint
  siteUrl?: string;             // Your site URL for request attribution
  siteName?: string;            // Your site name for request attribution
  maxRetries?: number;          // Max retry attempts (default: 3)
  timeout?: number;             // Request timeout in ms (default: 30000)
  parameterCacheTTL?: number;   // Cache duration for model parameters (default: 1h)
}
```

#### Error Handling
The provider implements comprehensive error handling for various scenarios:
- Authentication errors (invalid API key)
- Rate limiting
- Context length exceeded
- Network timeouts
- Model-specific errors
- Transient API errors with automatic retry

#### Streaming Implementation
Streaming support is implemented with:
- Chunk-based processing
- Proper error propagation
- Automatic reconnection
- Buffer management for partial messages

### Claude Provider

Direct integration with Anthropic's Claude models.

[Configuration and implementation details to be added]

### DeepSeek Provider

Integration with DeepSeek's models.

[Configuration and implementation details to be added]

## Adding New Providers

To add a new provider:

1. Implement the `LLMProvider` interface:
```typescript
interface LLMProvider {
  initialize(): Promise<void>;
  complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
  completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
  healthCheck(): Promise<boolean>;
}
```

2. Add provider configuration interface:
```typescript
interface YourProviderConfig {
  apiKey: string;
  // Additional configuration options
}
```

3. Implement error handling using the `LLMError` class:
```typescript
throw new LLMError(
  LLMErrorType.PROVIDER_ERROR,
  'Error message',
  'provider-name',
  originalError
);
```

4. Add comprehensive tests covering:
- Basic functionality
- Error scenarios
- Streaming capabilities
- Retry mechanisms
- Edge cases

5. Update the provider factory to include the new provider:
```typescript
case 'your-provider':
  return new YourProvider(config as YourProviderConfig);
```

## Testing Providers

Each provider must include:
- Unit tests for all functionality
- Integration tests with mock servers
- Error handling tests
- Streaming tests
- Performance tests

See `services/llm-service/src/providers/implementations/__tests__/` for examples.

## Error Types

Available error types for provider implementations:
```typescript
enum LLMErrorType {
  PROVIDER_ERROR = 'PROVIDER_ERROR',       // Provider-specific errors
  RATE_LIMIT = 'RATE_LIMIT',              // Rate limiting errors
  CONTEXT_LENGTH = 'CONTEXT_LENGTH',       // Context length exceeded
  INVALID_REQUEST = 'INVALID_REQUEST',     // Invalid request parameters
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',     // Requested model not available
  TIMEOUT = 'TIMEOUT',                     // Request timeout
  UNKNOWN = 'UNKNOWN'                      // Unexpected errors
}
```

## Best Practices

1. Error Handling
   - Implement comprehensive error handling
   - Use appropriate error types
   - Include original error details when possible
   - Implement retries for transient errors

2. Configuration
   - Make configuration flexible but with sensible defaults
   - Validate configuration on initialization
   - Document all configuration options

3. Testing
   - Write comprehensive tests
   - Include error scenarios
   - Test streaming functionality
   - Use mock servers for integration tests

4. Performance
   - Implement connection pooling
   - Cache model parameters when appropriate
   - Handle rate limiting gracefully
   - Monitor and log performance metrics

5. Documentation
   - Document all provider features
   - Include configuration examples
   - Document error handling
   - Keep changelog updated