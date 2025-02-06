import { LLMService } from './llm.service';
import { ChatMessageInput, CompletionOptionsInput, CompletionResponse, StreamCompletionResponse } from './dto/completion.dto';
export declare class LLMResolver {
    private readonly llmService;
    constructor(llmService: LLMService);
    complete(messages: ChatMessageInput[], options?: CompletionOptionsInput): Promise<CompletionResponse>;
    streamCompletion(messages: ChatMessageInput[], options?: CompletionOptionsInput): AsyncIterableIterator<StreamCompletionResponse>;
    listProviders(): Promise<string[]>;
    listModels(provider: string): Promise<string[]>;
    healthCheck(): Promise<boolean>;
}
