import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LLMService } from './llm.service';
import { RedisService } from '../redis/redis.service';
import { LLMProviderFactory } from '../providers/provider.factory';
import { validate } from '../config/env.validation';
import { ChatMessage, LLMError, LLMErrorType, LLMResponse } from '../interfaces/provider.interface';

describe('LLMService', () => {
  let service: LLMService;
  let providerFactory: LLMProviderFactory;
  let redisService: RedisService;

  const mockResponse: LLMResponse = {
    text: 'Test response',
    usage: {
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    },
    metadata: {
      provider: 'openrouter',
      model: 'deepseek/deepseek-r1',
      latency: 100,
      timestamp: new Date().toISOString(),
    },
  };

  const mockProvider = {
    initialize: jest.fn().mockResolvedValue(undefined),
    complete: jest.fn().mockResolvedValue(mockResponse),
    completeStream: jest.fn().mockImplementation(async function* () {
      yield mockResponse;
    }),
    healthCheck: jest.fn().mockResolvedValue(true),
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate,
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
      ],
      providers: [
        LLMService,
        {
          provide: LLMProviderFactory,
          useValue: {
            getProvider: jest.fn().mockReturnValue(mockProvider),
            listProviders: jest.fn().mockReturnValue(['openrouter']),
            listModels: jest.fn().mockReturnValue(['deepseek/deepseek-r1']),
            healthCheck: jest.fn().mockResolvedValue({ openrouter: true }),
          },
        },
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<LLMService>(LLMService);
    providerFactory = module.get<LLMProviderFactory>(LLMProviderFactory);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('complete', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('should return completion response', async () => {
      mockRedis.get.mockResolvedValue(null);
      const response = await service.complete(messages);
      expect(response).toBeDefined();
      expect(response.text).toBe('Test response');
      expect(response.usage).toBeDefined();
      expect(response.metadata).toBeDefined();
    });

    it('should use cache when available', async () => {
      const cachedResponse = {
        ...mockResponse,
        metadata: { ...mockResponse.metadata, provider: 'cache' },
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedResponse));

      const response = await service.complete(messages);
      expect(response).toBeDefined();
      expect(response.metadata.provider).toBe('cache');
    });

    it('should handle provider errors', async () => {
      mockRedis.get.mockResolvedValue(null);
      jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Provider error',
          'test-provider'
        );
      });

      await expect(service.complete(messages)).rejects.toThrow(LLMError);
    });
  });

  describe('completeStream', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello, world!' },
    ];

    it('should return stream iterator', async () => {
      const stream = await service.completeStream(messages);
      expect(stream).toBeDefined();

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toBeDefined();
      expect(chunks[0].metadata).toBeDefined();
    });

    it('should handle stream errors', async () => {
      jest.spyOn(providerFactory, 'getProvider').mockImplementation(() => {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Stream error',
          'test-provider'
        );
      });

      await expect(service.completeStream(messages)).rejects.toThrow(LLMError);
    });
  });

  describe('provider management', () => {
    it('should list available providers', () => {
      const providers = service.listProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toContain('openrouter');
    });

    it('should list models for provider', () => {
      const models = service.listModels('openrouter');
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models).toContain('deepseek/deepseek-r1');
    });

    it('should handle invalid provider', () => {
      jest.spyOn(providerFactory, 'listModels').mockImplementation(() => {
        throw new LLMError(
          LLMErrorType.PROVIDER_ERROR,
          'Invalid provider',
          'invalid-provider'
        );
      });
      expect(() => service.listModels('invalid-provider')).toThrow(LLMError);
    });
  });

  describe('health check', () => {
    it('should return provider health status', async () => {
      const health = await service.healthCheck();
      expect(health).toBeDefined();
      expect(typeof health).toBe('object');
      expect(health.openrouter).toBe(true);
    });

    it('should handle health check errors', async () => {
      jest.spyOn(providerFactory, 'healthCheck').mockResolvedValue({
        openrouter: false,
      });
      const health = await service.healthCheck();
      expect(health.openrouter).toBe(false);
    });
  });
});