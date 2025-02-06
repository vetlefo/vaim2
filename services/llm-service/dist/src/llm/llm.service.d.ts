import { RedisService } from '../redis/redis.service';
import { PrometheusService } from '../monitoring/prometheus.service';
import { LLMProviderFactory } from '../providers/provider.factory';
import { CompletionOptionsInput, ChatMessageInput, CompletionResponse, StreamCompletionResponse } from './dto/completion.dto';
export declare class LLMService {
    private readonly redisService;
    private readonly prometheusService;
    private readonly providerFactory;
    constructor(redisService: RedisService, prometheusService: PrometheusService, providerFactory: LLMProviderFactory);
    complete(messages: ChatMessageInput[], options?: CompletionOptionsInput): Promise<CompletionResponse>;
    completeStream(messages: ChatMessageInput[], options?: CompletionOptionsInput): Promise<AsyncIterableIterator<StreamCompletionResponse>>;
    private wrapStream;
    listProviders(): Promise<string[]>;
    listModels(provider?: string): Promise<string[]>;
    healthCheck(): Promise<Record<string, any>>;
    private generateCacheKey;
}
