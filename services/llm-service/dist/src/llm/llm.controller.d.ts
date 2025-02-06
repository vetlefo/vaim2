import { Observable } from 'rxjs';
import { LLMService } from './llm.service';
import { ChatMessageInput, CompletionOptionsInput, CompletionResponse } from './dto/completion.dto';
interface SseMessageEvent {
    data: string;
    id?: string;
    type?: string;
    retry?: number;
}
export declare class LLMController {
    private readonly llmService;
    constructor(llmService: LLMService);
    complete(messages: ChatMessageInput[], options?: CompletionOptionsInput): Promise<CompletionResponse>;
    streamCompletion(messagesJson: string, optionsJson?: string): Observable<SseMessageEvent>;
    listProviders(): Promise<string[]>;
    listModels(provider: string): Promise<string[]>;
    healthCheck(): Promise<{
        [key: string]: boolean;
    }>;
}
export {};
