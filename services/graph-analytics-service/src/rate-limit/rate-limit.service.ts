import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

@Injectable()
export class RateLimitService {
  private readonly defaultConfig: RateLimitConfig;
  private readonly analyticsConfig: RateLimitConfig;
  private readonly pipelineConfig: RateLimitConfig;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.defaultConfig = {
      windowMs: this.configService.get<number>('RATE_LIMIT_WINDOW', 60000),
      maxRequests: this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
    };

    this.analyticsConfig = {
      windowMs: this.configService.get<number>('RATE_LIMIT_ANALYTICS_WINDOW', 3600000),
      maxRequests: this.configService.get<number>('RATE_LIMIT_ANALYTICS_MAX_REQUESTS', 1000),
    };

    this.pipelineConfig = {
      windowMs: this.configService.get<number>('RATE_LIMIT_PIPELINE_WINDOW', 86400000),
      maxRequests: this.configService.get<number>('RATE_LIMIT_PIPELINE_MAX_REQUESTS', 24),
    };
  }

  private getKeyPrefix(endpoint: string): string {
    if (endpoint.includes('/analytics')) {
      return 'analytics';
    }
    if (endpoint.includes('/pipeline')) {
      return 'pipeline';
    }
    return 'default';
  }

  private getConfig(endpoint: string): RateLimitConfig {
    if (endpoint.includes('/analytics')) {
      return this.analyticsConfig;
    }
    if (endpoint.includes('/pipeline')) {
      return this.pipelineConfig;
    }
    return this.defaultConfig;
  }

  async isRateLimited(userId: string, endpoint: string): Promise<boolean> {
    const prefix = this.getKeyPrefix(endpoint);
    const config = this.getConfig(endpoint);
    const key = `rate-limit:${prefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const pipeline = this.redisService.getClient().pipeline();

    // Remove old requests outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Count requests in current window
    pipeline.zcount(key, windowStart, now);
    // Add current request
    pipeline.zadd(key, now, `${now}`);
    // Set expiry to ensure cleanup
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();
    if (!results) {
      return false;
    }

    // Get count from results, defaulting to 0 if there's an error
    const [error, count] = results[1] || [null, 0];
    if (error) {
      return false;
    }

    return Number(count) >= config.maxRequests;
  }

  async getRemainingRequests(userId: string, endpoint: string): Promise<number> {
    const prefix = this.getKeyPrefix(endpoint);
    const config = this.getConfig(endpoint);
    const key = `rate-limit:${prefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const client = this.redisService.getClient();
    await client.zremrangebyscore(key, 0, windowStart);
    const requestCount = await client.zcount(key, windowStart, now);

    return Math.max(0, config.maxRequests - requestCount);
  }
}