import { OpenAI } from 'openai';
import axios from 'axios';
import {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  OpenRouterConfig,
  ChatMessage,
  LLMError,
  LLMErrorType,
} from '@app/interfaces/provider.interface';

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

export default class OpenRouterOpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private readonly baseURL: string;
  private modelParameters: Map<string, ModelParameters> = new Map();

  constructor(config: OpenRouterConfig) {
    this.defaultModel = config.defaultModel || 'deepseek/deepseek-r1';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    this.baseURL = config.baseUrl || 'https://openrouter.ai/api/v1';

    this.client = new OpenAI({
      baseURL: this.baseURL,
      apiKey: config.apiKey,
      defaultHeaders: {
        'HTTP-Referer': config.siteUrl || '',
        'X-Title': config.siteName || '',
      },
      defaultQuery: {
        timeout: this.timeout.toString(),
      },
      maxRetries: this.maxRetries,
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.healthCheck();
      // Pre-fetch parameters for default model
      await this.fetchModelParameters(this.defaultModel);
    } catch (error) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        'Failed to initialize OpenRouter provider',
        'openrouter',
        error
      );
    }
  }

  private async fetchModelParameters(modelId: string): Promise<ModelParameters> {
    if (this.modelParameters.has(modelId)) {
      return this.modelParameters.get(modelId)!;
    }

    const [author, modelSlug] = modelId.split('/');
    try {
      const response = await axios.get(
        `${this.baseURL}/parameters/${author}/${modelSlug}`,
        {
          headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${this.client.apiKey}`,
          },
        }
      );

      const parameters = response.data.data;
      this.modelParameters.set(modelId, parameters);
      return parameters;
    } catch (error) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        `Failed to fetch parameters for model ${modelId}`,
        'openrouter',
        error
      );
    }
  }

  private async getOptimalParameters(modelId: string): Promise<Partial<LLMRequestOptions>> {
    const parameters = await this.fetchModelParameters(modelId);
    return {
      temperature: parameters.temperature_p50,
      topP: parameters.top_p_p50,
      frequencyPenalty: parameters.frequency_penalty_p50,
      presencePenalty: parameters.presence_penalty_p50,
      ...(parameters.top_k_p50 && { topK: parameters.top_k_p50 }),
      ...(parameters.min_p_p50 && { minP: parameters.min_p_p50 }),
      ...(parameters.repetition_penalty_p50 && { repetitionPenalty: parameters.repetition_penalty_p50 }),
      ...(parameters.top_a_p50 && { topA: parameters.top_a_p50 }),
    };
  }

  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    const modelId = options?.model || this.defaultModel;

    try {
      const optimalParams = await this.getOptimalParameters(modelId);
      const completion = await this.client.chat.completions.create({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        ...optimalParams,
        ...options,
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
          model: modelId,
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
    const modelId = options?.model || this.defaultModel;

    try {
      const optimalParams = await this.getOptimalParameters(modelId);
      const stream = await this.client.chat.completions.create({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        ...optimalParams,
        ...options,
        stream: true,
      });

      return this.processStream(stream, startTime, modelId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async *processStream(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    startTime: number,
    model: string
  ): AsyncIterableIterator<LLMResponse> {
    try {
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
    } catch (error) {
      throw this.handleError(error);
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
    if (error?.name === 'APIError') {
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