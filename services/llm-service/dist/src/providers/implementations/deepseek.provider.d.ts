import { LLMProvider, LLMRequestOptions, LLMResponse, ProviderConfig, ChatMessage } from '@app/interfaces/provider.interface';
export default class DeepSeekProvider implements LLMProvider {
    private client;
    private readonly defaultModel;
    private readonly maxRetries;
    private readonly timeout;
    constructor(config: ProviderConfig);
    initialize(): Promise<void>;
    complete(messages: ChatMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;
    completeStream(messages: ChatMessage[], options?: LLMRequestOptions): Promise<AsyncIterableIterator<LLMResponse>>;
    private processStream;
    healthCheck(): Promise<boolean>;
    listModels(): Promise<string[]>;
    private handleError;
}
