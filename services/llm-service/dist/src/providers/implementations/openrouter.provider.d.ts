#!/usr/bin/env node
import { LLMProvider, LLMRequestOptions, LLMResponse, OpenRouterConfig, ChatMessage } from '../../interfaces/provider.interface';
export default class OpenRouterProvider implements LLMProvider {
    private client;
    private readonly defaultModel;
    private readonly maxRetries;
    private readonly timeout;
    private parameterCache;
    private parameterCacheTTL;
    private modelCapabilities;
    constructor(config: OpenRouterConfig);
    private initializeModelCapabilities;
    initialize(): Promise<void>;
    private getModelParameters;
    complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
    completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
    private processStream;
    healthCheck(): Promise<boolean>;
    listModels(): Promise<string[]>;
    private handleError;
}
