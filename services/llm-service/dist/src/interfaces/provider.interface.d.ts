export interface ModelCapabilities {
    contextWindow: number;
    maxOutputTokens?: number;
    pricing: {
        input: number;
        output: number;
        images?: number;
    };
    strengths: string[];
    useCases: string[];
    multimodal?: boolean;
}
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
        capabilities?: ModelCapabilities;
    };
}
export interface JSONSchemaResponseFormat {
    type: 'json_schema';
    schema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
        additionalProperties?: boolean;
    };
}
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
    model?: string;
    responseFormat?: JSONSchemaResponseFormat;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface LLMProvider {
    complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
    completeStream?(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
    getEmbeddings?(text: string): Promise<number[]>;
    initialize(): Promise<void>;
    healthCheck(): Promise<boolean>;
    listModels(): Promise<string[]>;
}
export interface ProviderConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
    organization?: string;
    maxRetries?: number;
    timeout?: number;
    headers?: Record<string, string>;
}
export interface OpenRouterConfig extends ProviderConfig {
    siteUrl?: string;
    siteName?: string;
    defaultModel?: string;
    parameterCacheTTL?: number;
}
export interface ProviderFactory {
    createProvider(name: string, config: ProviderConfig): Promise<LLMProvider>;
    getProvider(name: string): LLMProvider | undefined;
    listProviders(): string[];
    listModels(provider: string): string[];
    getModelCapabilities(model: string): ModelCapabilities | undefined;
}
export interface CostTracking {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
    currency: string;
}
export declare enum LLMErrorType {
    PROVIDER_ERROR = "PROVIDER_ERROR",
    RATE_LIMIT = "RATE_LIMIT",
    CONTEXT_LENGTH = "CONTEXT_LENGTH",
    INVALID_REQUEST = "INVALID_REQUEST",
    TIMEOUT = "TIMEOUT",
    MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
    UNKNOWN = "UNKNOWN"
}
export declare class LLMError extends Error {
    type: LLMErrorType;
    provider?: string;
    details?: any;
    constructor(type: LLMErrorType, message: string, provider?: string, details?: any);
}
