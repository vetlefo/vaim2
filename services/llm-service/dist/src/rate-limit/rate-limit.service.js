"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RateLimitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const config_1 = require("@nestjs/config");
let RateLimitService = RateLimitService_1 = class RateLimitService {
    constructor(redisService, configService) {
        this.redisService = redisService;
        this.configService = configService;
        this.logger = new common_1.Logger(RateLimitService_1.name);
        this.globalConfig = {
            windowMs: this.configService.get('RATE_LIMIT_WINDOW', 60000),
            maxRequests: this.configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
        };
        this.providerConfig = {
            windowMs: this.configService.get('RATE_LIMIT_PROVIDER_WINDOW', 3600000),
            maxRequests: this.configService.get('RATE_LIMIT_PROVIDER_MAX_REQUESTS', 1000),
        };
    }
    getConfig(provider) {
        return provider ? this.providerConfig : this.globalConfig;
    }
    async getRequestCount(key, windowStart, now) {
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
    async isRateLimited(userId, provider = null) {
        const config = this.getConfig(provider);
        const keyPrefix = `rate-limit:${provider || 'global'}:${userId}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;
        const oldKeys = await this.redisService.keys(`${keyPrefix}:*`);
        for (const key of oldKeys) {
            const timestamp = parseInt(key.split(':').pop() || '0', 10);
            if (timestamp <= windowStart) {
                await this.redisService.del(key);
            }
        }
        const requestCount = await this.getRequestCount(keyPrefix, windowStart, now);
        if (requestCount < config.maxRequests) {
            await this.redisService.set(`${keyPrefix}:${now}`, '1', Math.ceil(config.windowMs / 1000));
        }
        return requestCount >= config.maxRequests;
    }
    async getRemainingRequests(userId, provider = null) {
        const config = this.getConfig(provider);
        const keyPrefix = `rate-limit:${provider || 'global'}:${userId}`;
        const now = Date.now();
        const windowStart = now - config.windowMs;
        const requestCount = await this.getRequestCount(keyPrefix, windowStart, now);
        return Math.max(0, config.maxRequests - requestCount);
    }
    async getCacheKey(prompt, provider) {
        return `cache:${provider}:${Buffer.from(prompt).toString('base64')}`;
    }
    async getCachedResponse(prompt, provider) {
        const isStreamingEnabled = this.configService.get('CACHE_STREAMING_ENABLED', false);
        if (isStreamingEnabled) {
            return null;
        }
        const key = await this.getCacheKey(prompt, provider);
        return this.redisService.get(key);
    }
    async cacheResponse(prompt, provider, response) {
        const isStreamingEnabled = this.configService.get('CACHE_STREAMING_ENABLED', false);
        if (isStreamingEnabled) {
            return;
        }
        const key = await this.getCacheKey(prompt, provider);
        const ttl = this.configService.get('CACHE_TTL', 3600);
        await this.redisService.set(key, response, ttl);
    }
};
exports.RateLimitService = RateLimitService;
exports.RateLimitService = RateLimitService = RateLimitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        config_1.ConfigService])
], RateLimitService);
//# sourceMappingURL=rate-limit.service.js.map