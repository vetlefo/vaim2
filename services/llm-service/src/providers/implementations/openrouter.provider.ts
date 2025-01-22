import axios, { AxiosInstance } from 'axios';
import {
  LLMProvider,
  LLMRequestOptions,
  LLMResponse,
  OpenRouterConfig,
  ChatMessage,
  LLMError,
  LLMErrorType,
  ModelCapabilities,
} from '@app/interfaces/provider.interface';

interface ModelParameters {
  temperature_p50: number;
  top_p_p50: number;
  frequency_penalty_p50: number;
  presence_penalty_p50: number;
  top_k_p50: number;
  repetition_penalty_p50: number;
}

export default class OpenRouterProvider implements LLMProvider {
  private client: AxiosInstance;
  private readonly defaultModel: string;
  private readonly maxRetries: number;
  private readonly timeout: number;
  private parameterCache: Map<string, ModelParameters>;
  private parameterCacheTTL: number;
  private modelCapabilities: Map<string, ModelCapabilities>;

  constructor(config: OpenRouterConfig) {
    this.defaultModel = config.defaultModel || 'anthropic/claude-3.5-sonnet';
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    this.parameterCache = new Map();
    this.parameterCacheTTL = config.parameterCacheTTL || 3600000; // 1 hour default
    this.modelCapabilities = new Map();

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

    this.initializeModelCapabilities();
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

    // Ministral 8B
    this.modelCapabilities.set('mistral/ministral-8b', {
      contextWindow: 128000,
      pricing: {
        input: 0.10,
        output: 0.10
      },
      strengths: [
        'Solid "edge" performance in a smaller param model',
        'Good for moderate-scale tasks & slightly advanced reasoning'
      ],
      useCases: [
        'Edge or on-prem contexts needing 8B param-level speed',
        'Middle-tier tasks or real-time chat'
      ]
    });
  }

  async initialize(): Promise<void> {
    try {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Failed to initialize OpenRouter provider',
          'openrouter'
        );
      }
      // Pre-fetch parameters for default model
      await this.getModelParameters(this.defaultModel);
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      throw new LLMError(
        LLMErrorType.PROVIDER_ERROR,
        'Failed to initialize OpenRouter provider',
        'openrouter',
        error
      );
    }
  }

  private async getModelParameters(model: string): Promise<ModelParameters> {
    const cached = this.parameterCache.get(model);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.client.get(`/parameters/${model}`);
      const parameters = response.data;
      this.parameterCache.set(model, parameters);
      
      // Clear cache after TTL
      setTimeout(() => {
        this.parameterCache.delete(model);
      }, this.parameterCacheTTL);

      return parameters;
    } catch (error) {
      // Return default parameters if fetch fails
      return {
        temperature_p50: 0.7,
        top_p_p50: 0.95,
        frequency_penalty_p50: 0.1,
        presence_penalty_p50: 0.1,
        top_k_p50: 40,
        repetition_penalty_p50: 1.1,
      };
    }
  }

  async complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse> {
    const startTime = Date.now();
    let retries = 0;
    const model = options?.model || this.defaultModel;
    let lastError: any;

    // Get optimal parameters for model
    const parameters = await this.getModelParameters(model);

    while (retries <= this.maxRetries) {
      try {
        const response = await this.client.post('/chat/completions', {
          model: model,
          messages: messages,
          temperature: options?.temperature || parameters.temperature_p50,
          max_tokens: options?.maxTokens || 4096,
          top_p: options?.topP || parameters.top_p_p50,
          top_k: options?.topK || parameters.top_k_p50,
          frequency_penalty: options?.frequencyPenalty || parameters.frequency_penalty_p50,
          presence_penalty: options?.presencePenalty || parameters.presence_penalty_p50,
          repetition_penalty: options?.repetitionPenalty || parameters.repetition_penalty_p50,
          min_p: options?.minP || 0.0,
          top_a: options?.topA || 0.0,
          stop: options?.stop || [],
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
            model: model,
            provider: 'openrouter',
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            capabilities: this.modelCapabilities.get(model),
          },
        };
      } catch (error) {
        lastError = error;
        const llmError = this.handleError(error);
        
        // Don't retry certain errors
        if (
          llmError.type === LLMErrorType.INVALID_REQUEST ||
          llmError.type === LLMErrorType.CONTEXT_LENGTH ||
          llmError.type === LLMErrorType.MODEL_NOT_FOUND ||
          llmError.type === LLMErrorType.PROVIDER_ERROR ||
          llmError.type === LLMErrorType.RATE_LIMIT ||
          llmError.type === LLMErrorType.TIMEOUT
        ) {
          throw llmError;
        }

        retries++;
        if (retries > this.maxRetries) {
          throw llmError;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }

    throw this.handleError(lastError);
  }

  async completeStream(
    messages: ChatMessage[],
    options?: LLMRequestOptions
  ): Promise<AsyncIterableIterator<LLMResponse>> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;
    const parameters = await this.getModelParameters(model);

    try {
      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: messages,
        temperature: options?.temperature || parameters.temperature_p50,
        max_tokens: options?.maxTokens || 4096,
        top_p: options?.topP || parameters.top_p_p50,
        top_k: options?.topK || parameters.top_k_p50,
        frequency_penalty: options?.frequencyPenalty || parameters.frequency_penalty_p50,
        presence_penalty: options?.presencePenalty || parameters.presence_penalty_p50,
        repetition_penalty: options?.repetitionPenalty || parameters.repetition_penalty_p50,
        min_p: options?.minP || 0.0,
        top_a: options?.topA || 0.0,
        stop: options?.stop || [],
        stream: true,
      }, {
        responseType: 'stream',
      });

      return this.processStream(response.data, startTime, model);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async *processStream(
    stream: any,
    startTime: number,
    model: string
  ): AsyncIterableIterator<LLMResponse> {
    let buffer = '';
    
    try {
      for await (const chunk of stream) {
        const lines = (buffer + chunk.toString()).split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
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
                  capabilities: this.modelCapabilities.get(model),
                },
              };
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
            continue;
          }
        }
      }

      // Handle any remaining data in buffer
      if (buffer.trim() !== '') {
        try {
          const data = JSON.parse(buffer.startsWith('data: ') ? buffer.slice(6) : buffer);
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
                capabilities: this.modelCapabilities.get(model),
              },
            };
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    } catch (error) {
      throw this.handleError(error);
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

  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      throw this.handleError(error);
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
          if (error.code === 'ECONNABORTED') {
            return new LLMError(
              LLMErrorType.TIMEOUT,
              'Request timed out',
              'openrouter',
              error
            );
          }
          return new LLMError(
            LLMErrorType.UNKNOWN,
            `Unexpected error: ${message}`,
            'openrouter',
            error
          );
      }
    }

    if (error instanceof Error) {
      return new LLMError(
        LLMErrorType.UNKNOWN,
        error.message,
        'openrouter',
        error
      );
    }

    return new LLMError(
      LLMErrorType.UNKNOWN,
      'Unknown error occurred',
      'openrouter',
      error
    );
  }
}