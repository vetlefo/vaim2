"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestingModule = createTestingModule;
exports.createTestingApp = createTestingApp;
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const redis_module_1 = require("../src/redis/redis.module");
const llm_module_1 = require("../src/llm/llm.module");
const env_validation_1 = require("../src/config/env.validation");
jest.mock('ioredis', () => {
    const Redis = jest.fn();
    Redis.prototype.get = jest.fn();
    Redis.prototype.set = jest.fn();
    Redis.prototype.del = jest.fn();
    Redis.prototype.ping = jest.fn().mockResolvedValue('PONG');
    Redis.prototype.quit = jest.fn();
    return Redis;
});
jest.mock('openai', () => {
    return {
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [
                            {
                                message: {
                                    content: 'Test response',
                                },
                            },
                        ],
                        usage: {
                            prompt_tokens: 10,
                            completion_tokens: 20,
                            total_tokens: 30,
                        },
                    }),
                },
            },
            models: {
                list: jest.fn().mockResolvedValue({
                    data: [
                        { id: 'deepseek/deepseek-r1' },
                        { id: 'deepseek/deepseek-chat' },
                    ],
                }),
            },
        })),
    };
});
jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            post: jest.fn().mockResolvedValue({
                data: {
                    choices: [
                        {
                            message: {
                                content: 'Test response',
                            },
                        },
                    ],
                    usage: {
                        prompt_tokens: 10,
                        completion_tokens: 20,
                        total_tokens: 30,
                    },
                },
            }),
            get: jest.fn().mockResolvedValue({
                data: {
                    models: [
                        { id: 'deepseek/deepseek-r1' },
                        { id: 'deepseek/deepseek-chat' },
                    ],
                },
            }),
        })),
        isAxiosError: jest.fn().mockReturnValue(true),
    };
});
async function createTestingModule() {
    return testing_1.Test.createTestingModule({
        imports: [
            config_1.ConfigModule.forRoot({
                validate: env_validation_1.validate,
                isGlobal: true,
                envFilePath: ['.env.test'],
            }),
            redis_module_1.RedisModule,
            llm_module_1.LLMModule,
        ],
    }).compile();
}
async function createTestingApp() {
    const moduleFixture = await createTestingModule();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
}
beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_DB = '1';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.SITE_URL = 'http://localhost:3000';
    process.env.SITE_NAME = 'VAIM2 Test';
});
afterEach(() => {
    jest.clearAllMocks();
});
afterAll(async () => {
    jest.restoreAllMocks();
});
//# sourceMappingURL=setup.js.map