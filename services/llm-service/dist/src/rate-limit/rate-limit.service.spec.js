"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const rate_limit_service_1 = require("./rate-limit.service");
const redis_service_1 = require("../redis/redis.service");
describe('RateLimitService', () => {
    let service;
    let redisService;
    let configService;
    beforeEach(async () => {
        configService = {
            get: jest.fn().mockImplementation((key, defaultValue) => {
                var _a;
                const config = {
                    RATE_LIMIT_WINDOW: 60000,
                    RATE_LIMIT_MAX_REQUESTS: 100,
                    RATE_LIMIT_PROVIDER_WINDOW: 3600000,
                    RATE_LIMIT_PROVIDER_MAX_REQUESTS: 1000,
                    CACHE_TTL: 3600,
                    CACHE_STREAMING_ENABLED: false,
                };
                return (_a = config[key]) !== null && _a !== void 0 ? _a : defaultValue;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                rate_limit_service_1.RateLimitService,
                {
                    provide: config_1.ConfigService,
                    useValue: configService,
                },
                {
                    provide: redis_service_1.RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        keys: jest.fn(),
                        del: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(rate_limit_service_1.RateLimitService);
        redisService = module.get(redis_service_1.RedisService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('isRateLimited', () => {
        it('should return false when under global rate limit', async () => {
            jest.spyOn(redisService, 'keys').mockResolvedValue([]);
            const result = await service.isRateLimited('test-user');
            expect(result).toBe(false);
        });
        it('should return true when over global rate limit', async () => {
            const now = Date.now();
            const keys = Array(100).fill(0).map((_, i) => `rate-limit:global:test-user:${now - i}`);
            jest.spyOn(redisService, 'keys').mockResolvedValue(keys);
            const result = await service.isRateLimited('test-user');
            expect(result).toBe(true);
        });
        it('should return false when under provider rate limit', async () => {
            jest.spyOn(redisService, 'keys').mockResolvedValue([]);
            const result = await service.isRateLimited('test-user', 'openrouter');
            expect(result).toBe(false);
        });
        it('should return true when over provider rate limit', async () => {
            const now = Date.now();
            const keys = Array(1000).fill(0).map((_, i) => `rate-limit:openrouter:test-user:${now - i}`);
            jest.spyOn(redisService, 'keys').mockResolvedValue(keys);
            const result = await service.isRateLimited('test-user', 'openrouter');
            expect(result).toBe(true);
        });
    });
    describe('caching', () => {
        it('should return cached response when available', async () => {
            const cachedResponse = '{"text": "cached response"}';
            jest.spyOn(redisService, 'get').mockResolvedValue(cachedResponse);
            const result = await service.getCachedResponse('test prompt', 'openrouter');
            expect(result).toBe(cachedResponse);
        });
        it('should not cache response when streaming is enabled', async () => {
            configService.get.mockImplementationOnce((key) => {
                if (key === 'CACHE_STREAMING_ENABLED')
                    return true;
                return undefined;
            });
            await service.cacheResponse('test prompt', 'openrouter', 'test response');
            expect(redisService.set).not.toHaveBeenCalled();
        });
        it('should cache response with TTL when streaming is disabled', async () => {
            const response = 'test response';
            await service.cacheResponse('test prompt', 'openrouter', response);
            expect(redisService.set).toHaveBeenCalledWith(expect.any(String), response, expect.any(Number));
        });
    });
});
//# sourceMappingURL=rate-limit.service.spec.js.map