# LLM Provider Integration Guide

## Overview

This guide explains how to integrate new LLM providers into the service. The service uses a modular provider system that allows easy addition of new providers while maintaining consistent interfaces and behavior.

## Provider Interface

### Core Interface

```typescript
interface LLMProvider {
  // Required methods
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
  completeStream(messages: ChatMessage[], options?: CompletionOptions): AsyncIterableIterator<StreamResponse>;
  listModels(): Promise<string[]>;
  healthCheck(): Promise<boolean>;

  // Optional methods
  validateApiKey?(): Promise<boolean>;
  getModelInfo?(model: string): Promise<ModelInfo>;
}
```

### Data Types

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

interface CompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    provider: string;
    latency: number;
    timestamp: string;
  };
}

interface StreamResponse {
  text: string;
  metadata: {
    model: string;
    provider: string;
    latency: number;
    timestamp: string;
  };
}
```

## Available Providers

### OpenRouter Provider

OpenRouter is a unified API that provides access to various LLM models. We offer two implementations:

1. Direct API Implementation (`OpenRouterProvider`)
   - Uses OpenRouter's native API
   - Supports all OpenRouter models
   - Configuration:
     ```typescript
     interface OpenRouterConfig {
       apiKey: string;
       defaultModel?: string;
       siteUrl?: string;  // HTTP-Referer header
       siteName?: string; // X-Title header
       maxRetries?: number;
       timeout?: number;
     }
     ```

2. OpenAI-Compatible Implementation (`OpenRouterOpenAIProvider`)
   - Uses OpenRouter's OpenAI-compatible endpoint
   - Compatible with OpenAI client libraries
   - Supports streaming responses
   - Configuration:
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

#### Environment Variables
```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=deepseek/deepseek-r1
OPENROUTER_SITE_URL=https://your-site.com
OPENROUTER_SITE_NAME=Your Site Name
OPENROUTER_MAX_RETRIES=3
OPENROUTER_TIMEOUT=30000
```

#### Available Models
- deepseek/deepseek-r1
- deepseek/deepseek-chat
- anthropic/claude-3-sonnet
- anthropic/claude-2
- meta/llama2-70b
- google/palm-2

## Implementation Steps

1. Create Provider Class

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProvider, ChatMessage, CompletionOptions } from '@app/interfaces/provider.interface';

@Injectable()
export class NewProvider implements LLMProvider {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  // Implement required methods
  async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse> {
    // Implementation
  }

  async *completeStream(messages: ChatMessage[], options?: CompletionOptions): AsyncIterableIterator<StreamResponse> {
    // Implementation
  }

  async listModels(): Promise<string[]> {
    // Implementation
  }

  async healthCheck(): Promise<boolean> {
    // Implementation
  }
}
```

2. Add Provider Configuration

```typescript
// src/config/env.validation.ts
export const validationSchema = Joi.object({
  // ... existing validation
  NEW_PROVIDER_API_KEY: Joi.string().required(),
  NEW_PROVIDER_BASE_URL: Joi.string().uri().required(),
});
```

3. Register Provider

```typescript
// src/providers/provider.factory.ts
@Injectable()
export class LLMProviderFactory {
  private readonly providers: Map<string, LLMProvider>;

  constructor(
    private readonly newProvider: NewProvider,
  ) {
    this.providers = new Map([
      ['new-provider', newProvider],
    ]);
  }
}
```

## Error Handling

### Provider Errors

```typescript
export class LLMError extends Error {
  constructor(
    public readonly type: LLMErrorType,
    message: string,
    public readonly provider: string,
    public readonly details?: any,
  ) {
    super(message);
  }
}

export enum LLMErrorType {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
}
```

### Error Implementation

```typescript
async complete(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse> {
  try {
    // Provider-specific implementation
  } catch (error) {
    if (error instanceof ProviderAPIError) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        error.message,
        'new-provider',
        error.details
      );
    }
    throw error;
  }
}
```

## Testing

### Unit Tests

```typescript
describe('NewProvider', () => {
  let provider: NewProvider;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<NewProvider>(NewProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('complete', () => {
    it('should return completion response', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```typescript
describe('NewProvider Integration', () => {
  let app: INestApplication;
  let provider: NewProvider;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    provider = app.get<NewProvider>(NewProvider);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should integrate with provider API', async () => {
    // Test implementation
  });
});
```

## Best Practices

1. API Key Management
```typescript
constructor(private readonly configService: ConfigService) {
  const apiKey = this.configService.get<string>('NEW_PROVIDER_API_KEY');
  if (!apiKey) {
    throw new Error('NEW_PROVIDER_API_KEY is required');
  }
}
```

2. Rate Limiting
```typescript
private async checkRateLimit(): Promise<void> {
  const remaining = await this.getRateLimitRemaining();
  if (remaining <= 0) {
    throw new LLMError(
      LLMErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      'new-provider'
    );
  }
}
```

3. Retry Logic
```typescript
private async withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!this.isRetryableError(error)) {
        throw error;
      }
      await this.delay(Math.pow(2, i) * 1000);
    }
  }
  throw lastError;
}
```

4. Token Counting
```typescript
private countTokens(text: string): number {
  // Implement provider-specific token counting
  return Math.ceil(text.length / 4); // Simple approximation
}
```

5. Streaming Implementation
```typescript
async *completeStream(
  messages: ChatMessage[],
  options?: CompletionOptions
): AsyncIterableIterator<StreamResponse> {
  const response = await this.api.createStreamingCompletion(/* params */);
  
  for await (const chunk of response) {
    yield {
      text: chunk.text,
      metadata: {
        model: options?.model || this.defaultModel,
        provider: 'new-provider',
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

## Documentation

1. Add provider details to README.md
2. Update API documentation
3. Add provider-specific configuration guide
4. Document rate limits and quotas
5. Include usage examples
6. Document error codes and handling
7. Add monitoring guidelines
8. Update architecture documentation