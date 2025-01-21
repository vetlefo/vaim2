import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { LLMProviderFactory } from '../providers/provider.factory';
import {
  ChatMessage,
  LLMError,
  LLMErrorType,
  LLMResponse,
  LLMRequestOptions,
} from '@app/interfaces/provider.interface';

@Injectable()
export class LLMService implements OnModuleInit {
  private readonly logger = new Logger(LLMService.name);
  private readonly defaultProvider: string;
  private readonly defaultModel: string;
  private readonly cacheEnabled: boolean;
  private readonly cacheTTL: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly providerFactory: LLMProviderFactory,
    private readonly redisService: RedisService,
  ) {
    this.defaultProvider = this.configService.get<string>('DEFAULT_LLM_PROVIDER', 'openrouter');
    this.defaultModel = this.configService.get<string>('DEFAULT_MODEL', 'deepseek/deepseek-r1');
    this.cacheEnabled = this.configService.get<boolean>('CACHE_ENABLED', true);
    this.cacheTTL = this.configService.get<number>('REDIS_CACHE_TTL', 3600);
  }

  async onModuleInit() {
    await this.healthCheck();
  }

  async complete(
    messages: ChatMessage[],
    options?: LLMRequestOptions,
  ): Promise<LLMResponse> {
    const cacheKey = this.generateCacheKey(messages, options);
    
    if (this.cacheEnabled) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached;
      }
    }

    try {
      const provider = await this.getProvider(options?.model);
      const response = await provider.complete(messages, options);

      if (this.cacheEnabled) {
        await this.cacheResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      this.logger.error(`Error in complete: ${error.message}`, error.stack);
      throw this.handleError(error);
    }
  }

  async completeStream(
    messages: ChatMessage[],
    options?: LLMRequestOptions,
  ): Promise<AsyncIterableIterator<LLMResponse>> {
    try {
      const provider = await this.getProvider(options?.model);
      return await provider.completeStream(messages, options);
    } catch (error) {
      this.logger.error(`Error in completeStream: ${error.message}`, error.stack);
      throw this.handleError(error);
    }
  }

  async healthCheck(): Promise<{ [key: string]: boolean }> {
    try {
      return await this.providerFactory.healthCheck();
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      throw this.handleError(error);
    }
  }

  listProviders(): string[] {
    return this.providerFactory.listProviders();
  }

  listModels(provider: string): string[] {
    return this.providerFactory.listModels(provider);
  }

  private async getProvider(model?: string) {
    if (model) {
      // Extract provider from model name (e.g., 'deepseek/deepseek-r1' -> 'deepseek')
      const providerName = model.split('/')[0];
      try {
        return this.providerFactory.getProvider(providerName);
      } catch (error) {
        // If provider-specific model fails, fall back to OpenRouter
        this.logger.warn(`Failed to get provider for model ${model}, falling back to OpenRouter`);
        return this.providerFactory.getProvider('openrouter');
      }
    }
    return this.providerFactory.getProvider(this.defaultProvider);
  }

  private generateCacheKey(messages: ChatMessage[], options?: LLMRequestOptions): string {
    const key = {
      messages,
      options: {
        model: options?.model || this.defaultModel,
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 4096,
        topP: options?.topP || 1,
        frequencyPenalty: options?.frequencyPenalty,
        presencePenalty: options?.presencePenalty,
        stop: options?.stop,
      },
    };
    return `llm:${JSON.stringify(key)}`;
  }

  private async getCachedResponse(key: string): Promise<LLMResponse | null> {
    try {
      const cached = await this.redisService.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.warn(`Cache retrieval failed: ${error.message}`);
      return null;
    }
  }

  private async cacheResponse(key: string, response: LLMResponse): Promise<void> {
    try {
      await this.redisService.set(key, JSON.stringify(response), this.cacheTTL);
    } catch (error) {
      this.logger.warn(`Cache storage failed: ${error.message}`);
    }
  }

  private handleError(error: any): LLMError {
    if (error instanceof LLMError) {
      return error;
    }

    return new LLMError(
      LLMErrorType.UNKNOWN,
      `Unexpected error: ${error.message}`,
      this.defaultProvider,
      error,
    );
  }
}