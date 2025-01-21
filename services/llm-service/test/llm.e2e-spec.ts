import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/redis/redis.service';
import { LLMService } from '../src/llm/llm.service';
import { ConfigService } from '@nestjs/config';

describe('LLM Service (e2e)', () => {
  let app: INestApplication;
  let redisService: RedisService;
  let llmService: LLMService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    redisService = moduleFixture.get<RedisService>(RedisService);
    llmService = moduleFixture.get<LLMService>(LLMService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();
    await redisService.flushDb(); // Clear Redis before tests
  });

  afterAll(async () => {
    await redisService.flushDb(); // Clean up Redis after tests
    await app.close();
  });

  describe('/llm/complete (POST)', () => {
    it('should return a completion response', async () => {
      const response = await request(app.getHttpServer())
        .post('/llm/complete')
        .send({
          messages: [{ role: 'user', content: 'Say hello' }],
          model: 'deepseek/deepseek-r1'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        text: expect.any(String),
        usage: {
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number)
        },
        metadata: {
          provider: 'openrouter',
          model: 'deepseek/deepseek-r1',
          latency: expect.any(Number),
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle rate limiting', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(11).fill(null).map(() => 
        request(app.getHttpServer())
          .post('/llm/complete')
          .send({
            messages: [{ role: 'user', content: 'Say hello' }]
          })
      );

      const responses = await Promise.all(requests);
      expect(responses.some(res => res.status === 429)).toBe(true);
    });

    it('should use cache for identical requests', async () => {
      const message = { role: 'user', content: 'Cache test message' };
      
      // First request
      const response1 = await request(app.getHttpServer())
        .post('/llm/complete')
        .send({ messages: [message] })
        .expect(201);

      // Second request (should be cached)
      const response2 = await request(app.getHttpServer())
        .post('/llm/complete')
        .send({ messages: [message] })
        .expect(201);

      expect(response1.body.text).toBe(response2.body.text);
      expect(response2.body.metadata.cached).toBe(true);
    });

    it('should handle invalid API key', async () => {
      // Temporarily override API key in environment
      process.env.OPENROUTER_API_KEY = 'invalid-key';

      const response = await request(app.getHttpServer())
        .post('/llm/complete')
        .send({
          messages: [{ role: 'user', content: 'Say hello' }]
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid API key');

      // Restore API key
      process.env.OPENROUTER_API_KEY = 'test-key';
    });

    it('should handle context length errors', async () => {
      const longMessage = 'a'.repeat(8192);
      const response = await request(app.getHttpServer())
        .post('/llm/complete')
        .send({
          messages: [{ role: 'user', content: longMessage }]
        })
        .expect(400);

      expect(response.body.message).toContain('context length');
    });
  });

  describe('/llm/complete/stream (POST)', () => {
    it('should stream completion responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/llm/complete/stream')
        .send({
          messages: [{ role: 'user', content: 'Count from 1 to 5' }]
        })
        .expect(201);

      expect(response.headers['content-type']).toMatch(/text\/event-stream/);
      
      const chunks = response.text.split('\n\n')
        .filter(chunk => chunk.startsWith('data: '))
        .map(chunk => JSON.parse(chunk.slice(6)));

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk).toMatchObject({
          text: expect.any(String),
          metadata: {
            provider: 'openrouter',
            model: expect.any(String),
            latency: expect.any(Number),
            timestamp: expect.any(String)
          }
        });
      });
    });

    it('should handle streaming errors', async () => {
      // Temporarily override API key in environment
      process.env.OPENROUTER_API_KEY = 'invalid-key';

      const response = await request(app.getHttpServer())
        .post('/llm/complete/stream')
        .send({
          messages: [{ role: 'user', content: 'Say hello' }]
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid API key');

      // Restore API key
      process.env.OPENROUTER_API_KEY = 'test-key';
    });
  });

  describe('/llm/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/llm/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        providers: {
          openrouter: expect.any(Boolean),
          openrouterOpenAI: expect.any(Boolean)
        },
        redis: expect.any(Boolean)
      });
    });

    it('should reflect provider health status', async () => {
      // Temporarily override API key in environment
      process.env.OPENROUTER_API_KEY = 'invalid-key';

      const response = await request(app.getHttpServer())
        .get('/llm/health')
        .expect(200);

      expect(response.body.providers.openrouter).toBe(false);

      // Restore API key
      process.env.OPENROUTER_API_KEY = 'test-key';
    });
  });

  describe('GraphQL Endpoints', () => {
    it('should handle completion query', async () => {
      const query = `
        query {
          complete(input: {
            messages: [{ role: "user", content: "Say hello" }]
            model: "deepseek/deepseek-r1"
          }) {
            text
            usage {
              promptTokens
              completionTokens
              totalTokens
            }
            metadata {
              provider
              model
              latency
              timestamp
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.complete).toMatchObject({
        text: expect.any(String),
        usage: {
          promptTokens: expect.any(Number),
          completionTokens: expect.any(Number),
          totalTokens: expect.any(Number)
        },
        metadata: {
          provider: 'openrouter',
          model: 'deepseek/deepseek-r1',
          latency: expect.any(Number),
          timestamp: expect.any(String)
        }
      });
    });

    it('should handle completion subscription', async () => {
      const query = `
        subscription {
          completionStream(input: {
            messages: [{ role: "user", content: "Count from 1 to 5" }]
            model: "deepseek/deepseek-r1"
          }) {
            text
            metadata {
              provider
              model
              latency
              timestamp
            }
          }
        }
      `;

      // Note: WebSocket testing would be implemented here
      // For now, we'll just verify the subscription exists
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(400); // 400 because we're not using WebSocket

      expect(response.body.errors[0].message).toContain('subscription');
    });
  });
});