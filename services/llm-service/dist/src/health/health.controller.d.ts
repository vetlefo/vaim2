import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
import { LLMService } from '../llm/llm.service';
export declare class HealthController {
    private readonly health;
    private readonly redisService;
    private readonly llmService;
    private readonly logger;
    constructor(health: HealthCheckService, redisService: RedisService, llmService: LLMService);
    check(): Promise<HealthCheckResult>;
}
