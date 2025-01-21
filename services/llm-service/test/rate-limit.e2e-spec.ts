import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/redis/redis.service';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    redisService = moduleFixture.get<RedisService>(RedisService);
    await app.init();
  });

  afterEach(async () => {
    // Clean up Redis after each test
    const keys = await redisService.keys('rate-limit:*');
    for (const key of keys) {
      await redisService.del(key);
    }
    await app.close();
  });

  it('should handle global rate limiting', async () => {
    const maxRequests = 100; // From test environment config
    const requests = [];

    // Make maxRequests + 1 requests
    for (let i = 0; i <= maxRequests; i++) {
      requests.push(
        supertest(app.getHttpServer())
          .post('/llm/completion')
          .send({
            provider: 'openrouter',
            prompt: 'test prompt',
          }),
      );
    }

    const responses = await Promise.all(requests);

    // Verify that the last request was rate limited
    expect(responses[maxRequests].status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(responses[maxRequests].body).toMatchObject({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Global rate limit exceeded',
    });
  });

  it('should handle provider-specific rate limiting', async () => {
    const maxProviderRequests = 1000; // From test environment config
    const requests = [];

    // Make maxProviderRequests + 1 requests to the same provider
    for (let i = 0; i <= maxProviderRequests; i++) {
      requests.push(
        supertest(app.getHttpServer())
          .post('/llm/completion')
          .send({
            provider: 'openrouter',
            prompt: 'test prompt',
          }),
      );
    }

    const responses = await Promise.all(requests);

    // Verify that the last request was rate limited
    expect(responses[maxProviderRequests].status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(responses[maxProviderRequests].body).toMatchObject({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Rate limit exceeded for provider: openrouter',
    });
  });

  it('should handle caching', async () => {
    const prompt = 'test prompt';
    const mockResponse = { text: 'cached response' };

    // Make initial request
    const firstResponse = await supertest(app.getHttpServer())
      .post('/llm/completion')
      .send({
        provider: 'openrouter',
        prompt,
      });

    // Cache the response
    const cacheKey = `cache:openrouter:${Buffer.from(prompt).toString('base64')}`;
    await redisService.set(cacheKey, JSON.stringify(mockResponse));

    // Make second request with same prompt
    const secondResponse = await supertest(app.getHttpServer())
      .post('/llm/completion')
      .send({
        provider: 'openrouter',
        prompt,
      });

    expect(secondResponse.status).toBe(HttpStatus.OK);
    expect(secondResponse.body).toMatchObject({
      statusCode: HttpStatus.OK,
      message: 'Cached response',
      data: mockResponse,
      cached: true,
    });
  });

  it('should not cache streaming responses', async () => {
    const prompt = 'test prompt';
    
    // Enable streaming
    process.env.CACHE_STREAMING_ENABLED = 'true';

    // Make request with streaming enabled
    await supertest(app.getHttpServer())
      .post('/llm/completion')
      .send({
        provider: 'openrouter',
        prompt,
        stream: true,
      });

    // Check that response was not cached
    const cacheKey = `cache:openrouter:${Buffer.from(prompt).toString('base64')}`;
    const cached = await redisService.get(cacheKey);
    expect(cached).toBeNull();

    // Reset streaming setting
    process.env.CACHE_STREAMING_ENABLED = 'false';
  });
});