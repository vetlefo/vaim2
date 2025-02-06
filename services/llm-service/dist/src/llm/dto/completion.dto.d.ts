import { ChatMessage } from '@app/interfaces/provider.interface';
export declare class CompletionOptionsInput {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
}
export declare class ChatMessageInput implements ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
declare class CompletionUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
declare class CompletionMetadata {
    model: string;
    provider: string;
    latency: number;
    timestamp: string;
}
export declare class CompletionResponse {
    text: string;
    usage: CompletionUsage;
    metadata: CompletionMetadata;
}
export declare class StreamCompletionResponse {
    text: string;
    metadata: CompletionMetadata;
}
export {};
