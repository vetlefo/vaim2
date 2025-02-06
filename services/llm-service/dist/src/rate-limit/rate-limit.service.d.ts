import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}
export declare class RateLimitService {
    private readonly redisService;
    private readonly configService;
    private readonly logger;
    private readonly globalConfig;
    private readonly providerConfig;
    constructor(redisService: RedisService, configService: ConfigService);
    private getConfig;
    private getRequestCount;
    isRateLimited(userId: string, provider?: string | null): Promise<boolean>;
    getRemainingRequests(userId: string, provider?: string | null): Promise<number>;
    getCacheKey(prompt: string, provider: string): Promise<string>;
    getCachedResponse(prompt: string, provider: string): Promise<string | null>;
    cacheResponse(prompt: string, provider: string, response: string): Promise<void>;
}
