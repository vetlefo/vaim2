"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const redis_service_1 = require("../src/redis/redis.service");
describe('Rate Limiting (e2e)', () => {
    let app;
    let redisService;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        redisService = moduleFixture.get(redis_service_1.RedisService);
        await app.init();
    });
    afterEach(async () => {
        const keys = await redisService.keys('rate-limit:*');
        for (const key of keys) {
            await redisService.del(key);
        }
        await app.close();
    });
    it('should handle global rate limiting', async () => {
        const maxRequests = 100;
        const requests = [];
        for (let i = 0; i <= maxRequests; i++) {
            requests.push((0, supertest_1.default)(app.getHttpServer())
                .post('/llm/completion')
                .send({
                provider: 'openrouter',
                prompt: 'test prompt',
            }));
        }
        const responses = await Promise.all(requests);
        expect(responses[maxRequests].status).toBe(common_1.HttpStatus.TOO_MANY_REQUESTS);
        expect(responses[maxRequests].body).toMatchObject({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            message: 'Global rate limit exceeded',
        });
    });
    it('should handle provider-specific rate limiting', async () => {
        const maxProviderRequests = 1000;
        const requests = [];
        for (let i = 0; i <= maxProviderRequests; i++) {
            requests.push((0, supertest_1.default)(app.getHttpServer())
                .post('/llm/completion')
                .send({
                provider: 'openrouter',
                prompt: 'test prompt',
            }));
        }
        const responses = await Promise.all(requests);
        expect(responses[maxProviderRequests].status).toBe(common_1.HttpStatus.TOO_MANY_REQUESTS);
        expect(responses[maxProviderRequests].body).toMatchObject({
            statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded for provider: openrouter',
        });
    });
    it('should handle caching', async () => {
        const prompt = 'test prompt';
        const mockResponse = { text: 'cached response' };
        const firstResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/llm/completion')
            .send({
            provider: 'openrouter',
            prompt,
        });
        const cacheKey = `cache:openrouter:${Buffer.from(prompt).toString('base64')}`;
        await redisService.set(cacheKey, JSON.stringify(mockResponse));
        const secondResponse = await (0, supertest_1.default)(app.getHttpServer())
            .post('/llm/completion')
            .send({
            provider: 'openrouter',
            prompt,
        });
        expect(secondResponse.status).toBe(common_1.HttpStatus.OK);
        expect(secondResponse.body).toMatchObject({
            statusCode: common_1.HttpStatus.OK,
            message: 'Cached response',
            data: mockResponse,
            cached: true,
        });
    });
    it('should not cache streaming responses', async () => {
        const prompt = 'test prompt';
        process.env.CACHE_STREAMING_ENABLED = 'true';
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/llm/completion')
            .send({
            provider: 'openrouter',
            prompt,
            stream: true,
        });
        const cacheKey = `cache:openrouter:${Buffer.from(prompt).toString('base64')}`;
        const cached = await redisService.get(cacheKey);
        expect(cached).toBeNull();
        process.env.CACHE_STREAMING_ENABLED = 'false';
    });
});
//# sourceMappingURL=rate-limit.e2e-spec.js.map