import {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  ProviderConfig,
  LLMError,
  LLMErrorType,
} from '@app/interfaces/provider.interface';
import axios, { AxiosInstance } from 'axios';

export default class ClaudeProvider implements LLMProvider {
  private client: AxiosInstance;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(config: ProviderConfig) {
    this.defaultModel = config.model || 'claude-3-sonnet';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      timeout: this.timeout,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.healthCheck();
    } catch (error) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        'Failed to initialize Claude provider',
        'claude',
        error
      );
    }
  }

  async complete(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        const response = await this.client.post('/messages', {
          model: this.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          top_p: options?.topP || 1,
        });

        const completion = response.data.content[0].text;
        const usage = response.data.usage;

        return {
          text: completion,
          usage: {
            promptTokens: usage.input_tokens,
            completionTokens: usage.output_tokens,
            totalTokens: usage.total_tokens,
          },
          metadata: {
            model: this.defaultModel,
            provider: 'claude',
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        retries++;
        if (retries === this.maxRetries) {
          throw this.handleError(error);
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    throw new LLMError(
      LLMErrorType.UNKNOWN,
      'Failed to complete request after retries',
      'claude'
    );
  }

  async completeStream(
    prompt: string,
    options?: LLMRequestOptions
  ): AsyncIterableIterator<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.post('/messages', {
        model: this.defaultModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || 1,
        stream: true,
      }, {
        responseType: 'stream',
      });

      const stream = response.data;
      return this.processStream(stream, startTime);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async *processStream(
    stream: any,
    startTime: number
  ): AsyncIterableIterator<LLMResponse> {
    for await (const chunk of stream) {
      const data = JSON.parse(chunk.toString());
      if (data.type === 'content_block_delta') {
        yield {
          text: data.delta.text,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          metadata: {
            model: this.defaultModel,
            provider: 'claude',
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        };
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: any): LLMError {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      switch (status) {
        case 401:
          return new LLMError(
            LLMErrorType.PROVIDER_ERROR,
            'Invalid API key',
            'claude',
            error
          );
        case 429:
          return new LLMError(
            LLMErrorType.RATE_LIMIT,
            'Rate limit exceeded',
            'claude',
            error
          );
        case 400:
          if (message.includes('context length')) {
            return new LLMError(
              LLMErrorType.CONTEXT_LENGTH,
              'Maximum context length exceeded',
              'claude',
              error
            );
          }
          return new LLMError(
            LLMErrorType.INVALID_REQUEST,
            message,
            'claude',
            error
          );
        case 408:
          return new LLMError(
            LLMErrorType.TIMEOUT,
            'Request timed out',
            'claude',
            error
          );
        default:
          return new LLMError(
            LLMErrorType.UNKNOWN,
            `Unexpected error: ${message}`,
            'claude',
            error
          );
      }
    }

    return new LLMError(
      LLMErrorType.UNKNOWN,
      'Unknown error occurred',
      'claude',
      error
    );
  }
}