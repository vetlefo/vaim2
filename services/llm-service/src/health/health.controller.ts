import { Controller, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
import { LLMService } from '../llm/llm.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly redisService: RedisService,
    private readonly llmService: LLMService,
  ) {}

  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          const isRedisHealthy = await this.redisService.ping();
          return {
            redis: {
              status: isRedisHealthy ? 'up' : 'down',
            },
          };
        } catch (error) {
          this.logger.error('Redis health check failed:', error);
          return {
            redis: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },
      async (): Promise<HealthIndicatorResult> => {
        try {
          const providerHealth = await this.llmService.healthCheck();
          const isAnyProviderHealthy = Object.values(providerHealth).some(
            (healthy) => healthy,
          );

          return {
            llm: {
              status: isAnyProviderHealthy ? 'up' : 'down',
              providers: providerHealth,
            },
          };
        } catch (error) {
          this.logger.error('LLM health check failed:', error);
          return {
            llm: {
              status: 'down',
              error: error.message,
            },
          };
        }
      },
    ]);
  }
}