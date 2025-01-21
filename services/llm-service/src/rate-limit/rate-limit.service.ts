import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly globalConfig: RateLimitConfig;
  private readonly providerConfig: RateLimitConfig;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.globalConfig = {
      windowMs: this.configService.get<number>('RATE_LIMIT_WINDOW', 60000),
      maxRequests: this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100),
    };

    this.providerConfig = {
      windowMs: this.configService.get<number>('RATE_LIMIT_PROVIDER_WINDOW', 3600000),
      maxRequests: this.configService.get<number>('RATE_LIMIT_PROVIDER_MAX_REQUESTS', 1000),
    };
  }

  private getConfig(provider: string | null): RateLimitConfig {
    return provider ? this.providerConfig : this.globalConfig;
  }

  private async getRequestCount(key: string, windowStart: number, now: number): Promise<number> {
    const keys = await this.redisService.keys(`${key}:*`);
    let count = 0;
    
    for (const k of keys) {
      const timestamp = parseInt(k.split(':').pop() || '0', 10);
      if (timestamp > windowStart && timestamp <= now) {
        count++;
      }
    }
    
    return count;
  }

  async isRateLimited(userId: string, provider: string | null = null): Promise<boolean> {
    const config = this.getConfig(provider);
    const keyPrefix = `rate-limit:${provider || 'global'}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    const oldKeys = await this.redisService.keys(`${keyPrefix}:*`);
    for (const key of oldKeys) {
      const timestamp = parseInt(key.split(':').pop() || '0', 10);
      if (timestamp <= windowStart) {
        await this.redisService.del(key);
      }
    }

    // Count current requests
    const requestCount = await this.getRequestCount(keyPrefix, windowStart, now);

    // Add current request
    if (requestCount < config.maxRequests) {
      await this.redisService.set(`${keyPrefix}:${now}`, '1', Math.ceil(config.windowMs / 1000));
    }

    return requestCount >= config.maxRequests;
  }

  async getRemainingRequests(userId: string, provider: string | null = null): Promise<number> {
    const config = this.getConfig(provider);
    const keyPrefix = `rate-limit:${provider || 'global'}:${userId}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const requestCount = await this.getRequestCount(keyPrefix, windowStart, now);
    return Math.max(0, config.maxRequests - requestCount);
  }

  async getCacheKey(prompt: string, provider: string): Promise<string> {
    return `cache:${provider}:${Buffer.from(prompt).toString('base64')}`;
  }

  async getCachedResponse(prompt: string, provider: string): Promise<string | null> {
    const isStreamingEnabled = this.configService.get<boolean>('CACHE_STREAMING_ENABLED', false);
    if (isStreamingEnabled) {
      return null; // Don't cache streaming responses
    }

    const key = await this.getCacheKey(prompt, provider);
    return this.redisService.get(key);
  }

  async cacheResponse(prompt: string, provider: string, response: string): Promise<void> {
    const isStreamingEnabled = this.configService.get<boolean>('CACHE_STREAMING_ENABLED', false);
    if (isStreamingEnabled) {
      return; // Don't cache streaming responses
    }

    const key = await this.getCacheKey(prompt, provider);
    const ttl = this.configService.get<number>('CACHE_TTL', 3600); // Default 1 hour
    await this.redisService.set(key, response, ttl);
  }
}