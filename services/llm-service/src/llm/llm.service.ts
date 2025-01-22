import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrometheusService } from '../monitoring/prometheus.service';
import { LLMProvider, LLMResponse } from '../interfaces/provider.interface';
import { LLMProviderFactory } from '../providers/provider.factory';
import {
  CompletionOptionsInput,
  ChatMessageInput,
  CompletionResponse,
  StreamCompletionResponse
} from './dto/completion.dto';

@Injectable()
export class LLMService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prometheusService: PrometheusService,
    private readonly providerFactory: LLMProviderFactory,
  ) {}

  async complete(
    messages: ChatMessageInput[],
    options: CompletionOptionsInput = {}
  ): Promise<CompletionResponse> {
    const provider = options.model?.split('/')[0] || 'openrouter';
    const startTime = Date.now();
    this.prometheusService.startRequest(provider);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(messages, provider);
      const cachedResponse = await this.redisService.get(cacheKey);
      
      if (cachedResponse) {
        this.prometheusService.recordCacheHit();
        this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
        return JSON.parse(cachedResponse);
      }

      this.prometheusService.recordCacheMiss();
      this.prometheusService.recordProviderRequest(provider);

      // Get the appropriate provider implementation
      const llmProvider: LLMProvider = this.providerFactory.getProvider(provider);
      
      // Make the actual request
      const response = await llmProvider.complete(messages, options);

      // Record token usage
      if (response.usage) {
        this.prometheusService.recordTokenUsage(provider, 'prompt', response.usage.promptTokens);
        this.prometheusService.recordTokenUsage(provider, 'completion', response.usage.completionTokens);
      }

      // Cache the response
      await this.redisService.set(
        cacheKey,
        JSON.stringify(response),
        60 * 60 // 1 hour cache
      );

      // Update cache metrics
      const cacheStats = await this.redisService.getStats();
      this.prometheusService.updateCacheMetrics(
        cacheStats.keyCount,
        cacheStats.memoryUsage
      );

      this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
      return response;

    } catch (error) {
      this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
      this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
      throw error;
    }
  }

  async completeStream(
    messages: ChatMessageInput[],
    options: CompletionOptionsInput = {}
  ): Promise<AsyncIterableIterator<StreamCompletionResponse>> {
    const provider = options.model?.split('/')[0] || 'openrouter';
    const llmProvider = this.providerFactory.getProvider(provider);
    
    if (!llmProvider.completeStream) {
      throw new Error(`Provider ${provider} does not support streaming`);
    }

    const startTime = Date.now();
    this.prometheusService.startRequest(provider);

    try {
      const stream = await llmProvider.completeStream(messages, options);
      return this.wrapStream(stream, startTime, provider);
    } catch (error) {
      this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
      this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
      throw error;
    }
  }

  private async *wrapStream(
    stream: AsyncIterableIterator<LLMResponse>,
    startTime: number,
    provider: string
  ): AsyncIterableIterator<StreamCompletionResponse> {
    try {
      for await (const chunk of stream) {
        yield {
          text: chunk.text,
          metadata: {
            model: chunk.metadata.model,
            provider: chunk.metadata.provider,
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          },
        };
      }
      this.prometheusService.endRequest(provider, 'success', (Date.now() - startTime) / 1000);
    } catch (error) {
      this.prometheusService.recordProviderError(provider, error.name || 'UnknownError');
      this.prometheusService.endRequest(provider, 'error', (Date.now() - startTime) / 1000);
      throw error;
    }
  }

  async listProviders(): Promise<string[]> {
    return this.providerFactory.listProviders();
  }

  async listModels(provider?: string): Promise<string[]> {
    if (provider) {
      return this.providerFactory.listModels(provider);
    }
    
    // If no provider specified, get models from all providers
    const providers = await this.listProviders();
    const allModels: string[] = [];
    
    for (const provider of providers) {
      const models = this.providerFactory.listModels(provider);
      allModels.push(...models);
    }
    
    return allModels;
  }

  async healthCheck(): Promise<Record<string, any>> {
    const providers = await this.listProviders();
    const health: Record<string, any> = {};

    for (const provider of providers) {
      try {
        const llmProvider = this.providerFactory.getProvider(provider);
        health[provider] = await llmProvider.healthCheck();
      } catch (error) {
        health[provider] = {
          status: 'error',
          error: error.message,
        };
      }
    }

    return health;
  }

  private generateCacheKey(messages: ChatMessageInput[], provider: string): string {
    // Create a deterministic cache key from messages and provider
    const messageString = JSON.stringify(messages);
    return `llm:${provider}:${Buffer.from(messageString).toString('base64')}`;
  }
}