import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMProvider,
  ProviderConfig,
  ProviderFactory,
  LLMError,
  LLMErrorType,
  OpenRouterConfig,
} from '@app/interfaces/provider.interface';

@Injectable()
export class LLMProviderFactory implements ProviderFactory, OnModuleInit {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private modelMap: Map<string, string[]> = new Map();

  constructor(private configService: ConfigService) {
    this.defaultProvider = this.configService.get<string>('DEFAULT_LLM_PROVIDER', 'openrouter');
    this.initializeModelMap();
  }

  private initializeModelMap() {
    // OpenRouter models
    this.modelMap.set('openrouter', [
      // Anthropic models
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-2.1',
      'anthropic/claude-2',
      'anthropic/claude-instant',
      // OpenAI models
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      // Meta models
      'meta/llama2-70b',
      'meta/llama2-13b',
      // Google models
      'google/palm-2',
      'google/gemini-pro',
      // Deepseek models
      'deepseek/deepseek-coder',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-math',
      // Mistral models
      'mistral/mistral-7b',
      'mistral/mixtral-8x7b',
    ]);

    // Direct provider models (if direct access is configured)
    this.modelMap.set('deepseek', [
      'deepseek-coder',
      'deepseek-chat',
      'deepseek-math',
    ]);
  }

  async onModuleInit() {
    await this.initializeDefaultProviders();
  }

  private async initializeDefaultProviders() {
    // Initialize OpenRouter provider
    const openrouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (openrouterApiKey) {
      await this.createProvider('openrouter', {
        apiKey: openrouterApiKey,
        baseUrl: 'https://openrouter.ai/api/v1',
        siteUrl: this.configService.get<string>('SITE_URL'),
        siteName: this.configService.get<string>('SITE_NAME'),
        defaultModel: 'anthropic/claude-3.5-sonnet',
        maxRetries: this.configService.get<number>('OPENROUTER_MAX_RETRIES', 3),
        timeout: this.configService.get<number>('OPENROUTER_TIMEOUT', 30000),
      } as OpenRouterConfig);
    }

    // Initialize Deepseek provider if direct access is configured
    const deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (deepseekApiKey) {
      await this.createProvider('deepseek', {
        apiKey: deepseekApiKey,
        model: this.configService.get<string>('DEEPSEEK_MODEL', 'deepseek-chat'),
        maxRetries: this.configService.get<number>('DEEPSEEK_MAX_RETRIES', 3),
        timeout: this.configService.get<number>('DEEPSEEK_TIMEOUT', 30000),
      });
    }
  }

  async createProvider(name: string, config: ProviderConfig): Promise<LLMProvider> {
    try {
      // Dynamically import provider implementation
      const { default: ProviderClass } = await import(`./implementations/${name}.provider`);
      const provider = new ProviderClass(config);
      await provider.initialize();
      
      this.providers.set(name, provider);
      return provider;
    } catch (error) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        `Failed to create provider ${name}: ${error.message}`,
        name,
        error
      );
    }
  }

  getProvider(name?: string): LLMProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        `Provider ${providerName} not found`,
        providerName
      );
    }

    return provider;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  listModels(provider: string): string[] {
    const models = this.modelMap.get(provider);
    if (!models) {
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        `Provider ${provider} not found or has no models defined`,
        provider
      );
    }
    return models;
  }

  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.healthCheck();
      } catch (error) {
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Get the best available provider based on health and priority
   */
  async getBestProvider(): Promise<LLMProvider> {
    // Try default provider first
    const defaultProvider = this.getProvider();
    try {
      const isHealthy = await defaultProvider.healthCheck();
      if (isHealthy) {
        return defaultProvider;
      }
    } catch (error) {
      // Default provider is unhealthy, continue to fallback
    }

    // Try other providers in order of priority
    for (const [name, provider] of this.providers.entries()) {
      if (name === this.defaultProvider) continue;

      try {
        const isHealthy = await provider.healthCheck();
        if (isHealthy) {
          return provider;
        }
      } catch (error) {
        continue;
      }
    }

    throw new LLMError(
      LLMErrorType.PROVIDER_ERROR,
      'No healthy providers available',
      undefined
    );
  }
}