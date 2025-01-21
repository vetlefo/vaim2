/**
 * Base interface for LLM provider responses
 */
export interface LLMResponse {
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

/**
 * Configuration options for LLM requests
 */
export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
  topA?: number;
  stop?: string[];
  stream?: boolean;
  model?: string; // Specific model to use within a provider
}

/**
 * Message format for chat-based models
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Base interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Generate chat completion
   */
  complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;

  /**
   * Generate chat completion with streaming
   */
  completeStream?(
    messages: ChatMessage[],
    options?: LLMRequestOptions
  ): Promise<AsyncIterableIterator<LLMResponse>>;

  /**
   * Get embeddings for text
   */
  getEmbeddings?(text: string): Promise<number[]>;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Check if provider is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Provider-specific configuration
 */
export interface ProviderConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * OpenRouter specific configuration
 */
export interface OpenRouterConfig extends ProviderConfig {
  siteUrl?: string;  // HTTP-Referer header
  siteName?: string; // X-Title header
  defaultModel?: string;
  parameterCacheTTL?: number; // Time in ms to cache model parameters
}

/**
 * Provider factory interface
 */
export interface ProviderFactory {
  createProvider(name: string, config: ProviderConfig): Promise<LLMProvider>;
  getProvider(name: string): LLMProvider | undefined;
  listProviders(): string[];
  listModels(provider: string): string[];
}

/**
 * Cost tracking interface
 */
export interface CostTracking {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  currency: string;
}

/**
 * Error types for LLM operations
 */
export enum LLMErrorType {
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_LENGTH = 'CONTEXT_LENGTH',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for LLM operations
 */
export class LLMError extends Error {
  constructor(
    public type: LLMErrorType,
    message: string,
    public provider?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LLMError';
  }
}