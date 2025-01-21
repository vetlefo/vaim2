import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../src/redis/redis.module';
import { LLMModule } from '../src/llm/llm.module';
import { validate } from '../src/config/env.validation';

// Mock Redis for unit tests
jest.mock('ioredis', () => {
  const Redis = jest.fn();
  Redis.prototype.get = jest.fn();
  Redis.prototype.set = jest.fn();
  Redis.prototype.del = jest.fn();
  Redis.prototype.ping = jest.fn().mockResolvedValue('PONG');
  Redis.prototype.quit = jest.fn();
  return Redis;
});

// Mock OpenAI for unit tests
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

// Mock Axios for unit tests
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

export async function createTestingModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        validate,
        isGlobal: true,
        envFilePath: ['.env.test'],
      }),
      RedisModule,
      LLMModule,
    ],
  }).compile();
}

export async function createTestingApp(): Promise<INestApplication> {
  const moduleFixture = await createTestingModule();
  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
}

// Global test environment setup
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.REDIS_DB = '1';
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.SITE_URL = 'http://localhost:3000';
  process.env.SITE_NAME = 'VAIM2 Test';
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test environment teardown
afterAll(async () => {
  jest.restoreAllMocks();
});