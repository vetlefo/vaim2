# LLM Service Providers

The LLM service uses a provider-based architecture to interact with different language model APIs. This document outlines the available providers and their configurations.

## Provider Architecture

The service uses a factory pattern to manage providers:
- Each provider implements the `LLMProvider` interface
- Providers are loaded dynamically at runtime
- Health checks and monitoring are integrated
- Automatic fallback handling is supported

## Available Providers

### OpenRouter (Primary Provider)

OpenRouter is our primary provider, offering access to multiple LLM models through a unified API. The implementation has been consolidated into a single, robust provider that handles both standard and streaming completions with proper AsyncIterator support.

#### Key Features
- Unified streaming and non-streaming implementation
- Proper AsyncIterator support for streaming responses
- Robust error handling with automatic retries
- Efficient parameter caching
- Detailed model capabilities tracking

#### Available Models

##### Anthropic Models
- `anthropic/claude-3.5-sonnet` - Latest Claude model, optimal balance of capabilities
- `anthropic/claude-2.1` - Previous generation Claude
- `anthropic/claude-2` - Legacy Claude model
- `anthropic/claude-instant` - Fast, cost-effective model

##### OpenAI Models
- `openai/gpt-4-turbo` - Latest GPT-4 model
- `openai/gpt-4` - Standard GPT-4
- `openai/gpt-3.5-turbo` - Cost-effective option

##### Meta Models
- `meta/llama2-70b` - Largest Llama 2 model
- `meta/llama2-13b` - Smaller Llama 2 variant

##### Google Models
- `google/palm-2` - Google's PaLM 2 model
- `google/gemini-pro` - Latest Gemini model

##### Deepseek Models
- `deepseek/deepseek-coder` - Specialized for code
- `deepseek/deepseek-chat` - General chat model
- `deepseek/deepseek-math` - Math-focused model

##### Mistral Models
- `mistral/mistral-7b` - Base Mistral model
- `mistral/mixtral-8x7b` - MoE architecture model

#### Configuration

```typescript
interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;  // Defaults to https://openrouter.ai/api/v1
  siteUrl?: string;  // For HTTP-Referer header
  siteName?: string; // For X-Title header
  defaultModel?: string;  // Defaults to anthropic/claude-3.5-sonnet
  maxRetries?: number;  // Defaults to 3
  timeout?: number;  // Defaults to 30000ms
}
```

Environment variables:
```env
OPENROUTER_API_KEY=your_api_key
SITE_URL=your_site_url
SITE_NAME=your_site_name
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TIMEOUT=30000
```

### DeepSeek (Direct Access)

Optional direct access to DeepSeek models, bypassing OpenRouter.

#### Available Models
- `deepseek-coder` - Code generation and analysis
- `deepseek-chat` - General conversation
- `deepseek-math` - Mathematical computations

#### Configuration

```typescript
interface DeepSeekConfig {
  apiKey: string;
  model?: string;  // Defaults to deepseek-chat
  maxRetries?: number;  // Defaults to 3
  timeout?: number;  // Defaults to 30000ms
}
```

Environment variables:
```env
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_RETRIES=3
DEEPSEEK_TIMEOUT=30000
```

## Provider Features

All providers support:
- Completion requests
- Streaming responses
- Token counting
- Error handling
- Health checks
- Model listing
- Rate limiting
- Caching (where appropriate)

## Provider Selection

The service automatically selects the appropriate provider based on:
1. Model specification in the request
2. Provider health status
3. Rate limit availability
4. Cost optimization rules

## Error Handling

Providers implement standardized error handling:
```typescript
enum LLMErrorType {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}
```

## Monitoring

Each provider reports metrics for:
- Request counts
- Error rates
- Token usage
- Response times
- Rate limit status

See [Monitoring Documentation](./monitoring.md) for details.

## Adding New Providers

To add a new provider:

1. Implement the `LLMProvider` interface
2. Add provider configuration to `ProviderConfig`
3. Update the provider factory
4. Add monitoring integration
5. Update documentation

## Best Practices

1. **Model Selection**
   - Use `anthropic/claude-3.5-sonnet` for general tasks
   - Use specialized models for specific tasks (code, math)
   - Consider cost vs. performance tradeoffs

2. **Error Handling**
   - Implement retries with exponential backoff
   - Handle rate limits gracefully
   - Provide meaningful error messages

3. **Performance**
   - Use streaming for long responses
   - Implement caching where appropriate
   - Monitor token usage

4. **Monitoring**
   - Track error rates per model
   - Monitor response times
   - Set up alerts for issues

## Current Limitations and Future Features

### Cost Management
The service currently implements basic cost controls:
- Daily cost limit checks through environment variables
- Token usage tracking per request
- Basic cost estimation based on model pricing

Advanced cost optimization features planned but not yet implemented:
- Predictive cost analysis
- Automated model selection based on cost/performance ratio
- Detailed cost attribution and reporting
- Budget-aware routing

### HPC Integration Status
HPC integration is currently in planning phase and not implemented in the codebase:
- Distributed inference
- GPU acceleration
- Model parallelism
- Batch processing optimization

### Specialized Provider Integration
The following providers are planned but not yet integrated:
- o1 Pro
- Mistral Codestral
- MiniMax-01

These integrations are part of the enterprise roadmap and will be implemented based on demand and performance requirements.

## Future Enhancements

1. Dynamic model discovery
2. Enhanced caching strategies
3. Advanced fallback mechanisms
4. Performance analytics
5. Custom model fine-tuning support

For implementation details, see the [Implementation Guide](./implementation.md).

## Enterprise Features
Some advanced features mentioned in the broader documentation are part of our enterprise roadmap and not included in the current codebase:
- HPC/GPU acceleration
- Advanced cost optimization tools
- Specialized model providers
- Custom model deployment

Please contact the development team for information about enterprise feature availability.