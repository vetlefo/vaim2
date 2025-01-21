import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  OpenRouterConfig,
  ChatMessage,
  LLMError,
  LLMErrorType,
} from '@app/interfaces/provider.interface';

export default class OpenRouterProvider implements LLMProvider {
  private client: AxiosInstance;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(config: OpenRouterConfig) {
    this.defaultModel = config.defaultModel || 'deepseek/deepseek-r1';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': config.siteUrl || '',
        'X-Title': config.siteName || '',
        'Content-Type': 'application/json',
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
        'Failed to initialize OpenRouter provider',
        'openrouter',
        error
      );
    }
  }

  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    let retries = 0;

    while (retries < this.maxRetries) {
      try {
        const response = await this.client.post('/chat/completions', {
          model: options?.model || this.defaultModel,
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4096,
          top_p: options?.topP || 1,
          frequency_penalty: options?.frequencyPenalty,
          presence_penalty: options?.presencePenalty,
          stop: options?.stop,
          stream: false,
        });

        const completion = response.data.choices[0].message.content;
        const usage = response.data.usage;

        return {
          text: completion,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          },
          metadata: {
            model: options?.model || this.defaultModel,
            provider: 'openrouter',
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
      'openrouter'
    );
  }

  async completeStream(
    messages: ChatMessage[],
    options?: LLMRequestOptions
  ): Promise<AsyncIterableIterator<LLMResponse>> {
    const startTime = Date.now();

    try {
      const response = await this.client.post('/chat/completions', {
        model: options?.model || this.defaultModel,
        messages: messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true,
      }, {
        responseType: 'stream',
      });

      const stream = response.data;
      return this.processStream(stream, startTime, options?.model || this.defaultModel);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async *processStream(
    stream: any,
    startTime: number,
    model: string
  ): AsyncIterableIterator<LLMResponse> {
    for await (const chunk of stream) {
      const data = JSON.parse(chunk.toString());
      if (data.choices?.[0]?.delta?.content) {
        yield {
          text: data.choices[0].delta.content,
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
          metadata: {
            model: model,
            provider: 'openrouter',
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
            'openrouter',
            error
          );
        case 429:
          return new LLMError(
            LLMErrorType.RATE_LIMIT,
            'Rate limit exceeded',
            'openrouter',
            error
          );
        case 400:
          if (message.includes('context length')) {
            return new LLMError(
              LLMErrorType.CONTEXT_LENGTH,
              'Maximum context length exceeded',
              'openrouter',
              error
            );
          }
          return new LLMError(
            LLMErrorType.INVALID_REQUEST,
            message,
            'openrouter',
            error
          );
        case 404:
          return new LLMError(
            LLMErrorType.MODEL_NOT_FOUND,
            `Model not found: ${message}`,
            'openrouter',
            error
          );
        case 408:
          return new LLMError(
            LLMErrorType.TIMEOUT,
            'Request timed out',
            'openrouter',
            error
          );
        default:
          return new LLMError(
            LLMErrorType.UNKNOWN,
            `Unexpected error: ${message}`,
            'openrouter',
            error
          );
      }
    }

    return new LLMError(
      LLMErrorType.UNKNOWN,
      'Unknown error occurred',
      'openrouter',
      error
    );
  }
}