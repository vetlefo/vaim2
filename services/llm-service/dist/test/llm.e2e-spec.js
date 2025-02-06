"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const redis_service_1 = require("../src/redis/redis.service");
const llm_service_1 = require("../src/llm/llm.service");
const config_1 = require("@nestjs/config");
describe('LLM Service (e2e)', () => {
    let app;
    let redisService;
    let llmService;
    let configService;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        redisService = moduleFixture.get(redis_service_1.RedisService);
        llmService = moduleFixture.get(llm_service_1.LLMService);
        configService = moduleFixture.get(config_1.ConfigService);
        await app.init();
        await redisService.flushDb();
    });
    afterAll(async () => {
        await redisService.flushDb();
        await app.close();
    });
    describe('/llm/complete (POST)', () => {
        it('should return a completion response', async () => {
            jest.retryTimes(3);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const requests = Array(11).fill(null).map(() => (0, supertest_1.default)(app.getHttpServer())
                .post('/llm/complete')
                .send({
                messages: [{ role: 'user', content: 'Say hello' }]
            }));
            const responses = await Promise.all(requests);
            expect(responses.some(res => res.status === 429)).toBe(true);
        });
        it('should use cache for identical requests', async () => {
            const message = { role: 'user', content: 'Cache test message' };
            const response1 = await (0, supertest_1.default)(app.getHttpServer())
                .post('/llm/complete')
                .send({ messages: [message] })
                .expect(201);
            const response2 = await (0, supertest_1.default)(app.getHttpServer())
                .post('/llm/complete')
                .send({ messages: [message] })
                .expect(201);
            expect(response1.body.text).toBe(response2.body.text);
            expect(response2.body.metadata.cached).toBe(true);
        });
        it('should handle invalid API key', async () => {
            process.env.OPENROUTER_API_KEY = 'invalid-key';
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/llm/complete')
                .send({
                messages: [{ role: 'user', content: 'Say hello' }]
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid API key');
            process.env.OPENROUTER_API_KEY = 'test-key';
        });
        it('should handle context length errors', async () => {
            const longMessage = 'a'.repeat(8192);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            jest.retryTimes(3);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            process.env.OPENROUTER_API_KEY = 'invalid-key';
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/llm/complete/stream')
                .send({
                messages: [{ role: 'user', content: 'Say hello' }]
            })
                .expect(401);
            expect(response.body.message).toContain('Invalid API key');
            process.env.OPENROUTER_API_KEY = 'test-key';
        });
    });
    describe('/llm/health (GET)', () => {
        it('should return health status', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            process.env.OPENROUTER_API_KEY = 'invalid-key';
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/llm/health')
                .expect(200);
            expect(response.body.providers.openrouter).toBe(false);
            process.env.OPENROUTER_API_KEY = 'test-key';
        });
    });
    describe('GraphQL Endpoints', () => {
        it('should handle completion query', async () => {
            jest.retryTimes(3);
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(400);
            expect(response.body.errors[0].message).toContain('subscription');
        });
    });
});
//# sourceMappingURL=llm.e2e-spec.js.map