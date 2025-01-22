import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LLMProvider,
  ProviderConfig,
  ProviderFactory,
  LLMError,
  LLMErrorType,
  OpenRouterConfig,
  ModelCapabilities,
} from '@app/interfaces/provider.interface';

@Injectable()
export class LLMProviderFactory implements ProviderFactory, OnModuleInit {
  private providers: Map<string, LLMProvider> = new Map();
  private defaultProvider: string;
  private modelMap: Map<string, string[]> = new Map();
  private modelCapabilities: Map<string, ModelCapabilities> = new Map();

  constructor(private configService: ConfigService) {
    this.defaultProvider = this.configService.get<string>('DEFAULT_LLM_PROVIDER', 'openrouter');
    this.initializeModelMap();
    this.initializeModelCapabilities();
  }

  getModelCapabilities(model: string): ModelCapabilities | undefined {
    return this.modelCapabilities.get(model);
  }

  private initializeModelMap() {
    // OpenRouter models
    this.modelMap.set('openrouter', [
      // Premium models
      'anthropic/claude-3.5-sonnet',
      'openai/o1',
      'google/gemini-pro',
      'mistral/codestral-2501',
      // Mid-range models
      'openai/gpt-4o',
      'deepseek/deepseek-v3',
      'minimax/minimax-01',
      'mistral/mistral-7b',
      'mistral/ministral-8b',
    ]);

    // Direct provider models (if direct access is configured)
    this.modelMap.set('deepseek', [
      'deepseek-v3',
      'deepseek-coder',
      'deepseek-chat',
      'deepseek-math',
    ]);
  }

  private initializeModelCapabilities() {
    // Claude 3.5 Sonnet
    this.modelCapabilities.set('anthropic/claude-3.5-sonnet', {
      contextWindow: 200000,
      maxOutputTokens: 8000,
      pricing: {
        input: 1.50,
        output: 5.50
      },
      strengths: [
        'Strong at bridging statements, summary layers, multi-step reasoning',
        'Excellent at "big-picture" analysis and data unification',
        'Great for advanced data science or code reasoning'
      ],
      useCases: [
        'Architectural planning',
        'Summaries of large corpora',
        'High-level design reviews'
      ]
    });

    // OpenAI o1
    this.modelCapabilities.set('openai/o1', {
      contextWindow: 200000,
      maxOutputTokens: 100000,
      pricing: {
        input: 15.00,
        output: 60.00,
        images: 21.68
      },
      strengths: [
        'Extreme STEM performance',
        'Multi-path reasoning with advanced backtracking',
        'PhD-level physics, math, HPC-like analysis'
      ],
      useCases: [
        'High-stakes correctness',
        'HPC code validations',
        'Large-scale problem solving'
      ]
    });

    // Google Gemini Pro
    this.modelCapabilities.set('google/gemini-pro', {
      contextWindow: 2000000,
      pricing: {
        input: 1.25,
        output: 5.00,
        images: 0.6575
      },
      strengths: [
        'Enormous context window',
        'Multimodal capabilities',
        'Good for code gen and complex data extraction'
      ],
      useCases: [
        'Huge document sets',
        'Multimedia tasks',
        'Large-scale text ingestion'
      ],
      multimodal: true
    });

    // DeepSeek V3
    this.modelCapabilities.set('deepseek/deepseek-v3', {
      contextWindow: 128000,
      pricing: {
        input: 0.14,
        output: 0.28
      },
      strengths: [
        'Open-source orientation',
        'Strong code analysis',
        'Good performance across multiple domains'
      ],
      useCases: [
        'Self-hosted deployments',
        'Large codebase analysis',
        'General domain tasks'
      ]
    });

    // MiniMax-01
    this.modelCapabilities.set('minimax/minimax-01', {
      contextWindow: 1000000,
      pricing: {
        input: 0.20,
        output: 1.10
      },
      strengths: [
        'Large context at budget-friendly rate',
        'Hybrid architecture',
        'Decent multimodal capabilities'
      ],
      useCases: [
        'Massive text ingestion',
        'Large data transformations',
        'Cost-effective processing'
      ],
      multimodal: true
    });

    // Mistral 7B
    this.modelCapabilities.set('mistral/mistral-7b', {
      contextWindow: 32000,
      pricing: {
        input: 0.03,
        output: 0.055
      },
      strengths: [
        'Very cheap input & output cost',
        'Good for simpler tasks & high volumes',
        'Strong for quick queries'
      ],
      useCases: [
        'High-volume tasks',
        'Basic QA or summaries',
        'Budget-constrained operations'
      ]
    });
  }

  /**
   * Get capabilities for a specific model
   */
  getModelCapabilities(model: string): ModelCapabilities | undefined {
    return this.modelCapabilities.get(model);
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