import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitService } from './rate-limit.service';
import { RedisService } from '../redis/redis.service';

describe('RateLimitService', () => {
  let service: RateLimitService;
  let redisService: RedisService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        const config = {
          RATE_LIMIT_WINDOW: 60000,
          RATE_LIMIT_MAX_REQUESTS: 100,
          RATE_LIMIT_PROVIDER_WINDOW: 3600000,
          RATE_LIMIT_PROVIDER_MAX_REQUESTS: 1000,
          CACHE_TTL: 3600,
          CACHE_STREAMING_ENABLED: false,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            keys: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RateLimitService>(RateLimitService);
    redisService = module.get<RedisService>(RedisService);
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
      configService.get.mockImplementationOnce((key: string) => {
        if (key === 'CACHE_STREAMING_ENABLED') return true;
        return undefined;
      });
      
      await service.cacheResponse('test prompt', 'openrouter', 'test response');
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should cache response with TTL when streaming is disabled', async () => {
      const response = 'test response';
      await service.cacheResponse('test prompt', 'openrouter', response);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        response,
        expect.any(Number),
      );
    });
  });
});