import OpenAI from 'openai';
import {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  OpenRouterConfig,
  ChatMessage,
  LLMError,
  LLMErrorType,
} from '@app/interfaces/provider.interface';

export default class OpenRouterOpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(config: OpenRouterConfig) {
    this.defaultModel = config.defaultModel || 'deepseek/deepseek-r1';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;

    this.client = new OpenAI({
      baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
      apiKey: config.apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.siteUrl || '',
        'X-Title': config.siteName || '',
      },
      defaultQuery: {
        timeout: this.timeout,
      },
      maxRetries: this.maxRetries,
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

    try {
      const completion = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: false,
      });

      return {
        text: completion.choices[0].message.content || '',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        metadata: {
          model: options?.model || this.defaultModel,
          provider: 'openrouter',
          latency: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completeStream(
    messages: ChatMessage[],
    options?: LLMRequestOptions
  ): Promise<AsyncIterableIterator<LLMResponse>> {
    const startTime = Date.now();

    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || 1,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
        stream: true,
      });

      return this.processStream(stream, startTime, options?.model || this.defaultModel);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async *processStream(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    startTime: number,
    model: string
  ): AsyncIterableIterator<LLMResponse> {
    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield {
          text: chunk.choices[0].delta.content,
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
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: any): LLMError {
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      const message = error.message;

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